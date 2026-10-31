import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,raceFor,replacementFor,raceTraits,buildIssues} from '../src/features/characters/rules/build.mjs';
import {isSupportedRaceOperation} from '../src/features/characters/rules/race-replacement-operations.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';

const TONKIN='ffd20:race:tonkin';
const LANTERN=TONKIN+':trait:lantern-bearer';
const DANCING=TONKIN+':trait:dancing-lantern';
const KEEN=TONKIN+':trait:keen-senses';
const SPEED=TONKIN+':trait:base-speed';
const TELEPATHY=TONKIN+':trait:limited-telepathy';
const UNABLE=TONKIN+':trait:unable-to-cast';

function fixture({dancing=false,int=10}={}){
 const b=newBuild();
 Object.assign(b,{name:'Tonkin Lantern',alignment:'True Neutral',raceId:TONKIN,classId:'ffd20:class:monk',
  reviewed:true,alternateIds:dancing?[DANCING]:[]});
 b.baseScores.int=int;
 b.hpRolls=[classHitDie(b)];
 b.skillRanks=fixedSkills.map(()=>0);
 let remaining=previewBuild(b).skillBudget;
 for(let i=0;i<fixedSkills.length&&remaining>0;i++){b.skillRanks[i]=1;remaining--;}
 return b;
}
const trait=(b,id)=>raceTraits(b).traits.find(f=>f.id===id);
const card=(d,id)=>d.racialAbilities.find(f=>f.sourceRuleId===id);

test('Source-scoped Tonkin modifier replaces only Lantern Bearer torchlight, never the entire trait',()=>{
 const r=raceFor(fixture()),source=r.data.alternateReplacements.find(op=>op.id===DANCING+':replacement');
 assert.equal(source.scope,'partial_feature');
 assert.equal(source.resolution,'unresolved');
 const ops=replacementFor(r,DANCING);
 assert.equal(ops.length,1);
 assert.equal(ops[0].operation,'modify');
 assert.equal(ops[0].scope,'part_of_feature');
 assert.deepEqual(ops[0].targetFeatureIds,[LANTERN]);
 assert.deepEqual(ops[0].addsFeatureIds,[DANCING]);
 assert.ok(isSupportedRaceOperation(r,ops[0]));
 // An unrelated invented source mapping cannot use the allowlist.
 assert.equal(isSupportedRaceOperation(r,{...ops[0],targetFeatureIds:[TELEPATHY]}),false);
 assert.equal(isSupportedRaceOperation(r,{...ops[0],addsFeatureIds:[KEEN]}),false);
 assert.equal(isSupportedRaceOperation(r,{...ops[0],operation:'replace'}),false);
});

test('Default Tonkin retains conditional torchlight and every unrelated racial trait',()=>{
 const b=fixture(),before=raceTraits(b);
 assert.deepEqual(before.errors,[]);
 assert.ok(trait(b,LANTERN));
 assert.match(trait(b,LANTERN).description,/INT\s*>=\s*10|Intelligence of 10/i);
 assert.match(trait(b,LANTERN).description,/blindness|dazzle/i);
 assert.ok(!trait(b,DANCING));
 for(const id of [SPEED,TELEPATHY,UNABLE])assert.ok(trait(b,id),id);
 const view=renderBuild(b,2,{mode:'create'}),input=view.match(new RegExp('<input[^>]*data-rw-alternate="'+DANCING+'"[^>]*>'));
 assert.ok(input,'Dancing Lantern input exists');
 assert.doesNotMatch(input[0],/disabled/);
 assert.deepEqual(before.replaced,[]);
});

test('Dancing Lantern grants at-will SLA while retaining passive light defenses at any Intelligence',()=>{
 for(const int of [8,10,16]){
  const b=fixture({dancing:true,int}),result=raceTraits(b);
  assert.deepEqual(result.errors,[]);
  assert.ok(!result.replaced.includes(LANTERN));
  assert.ok(trait(b,LANTERN),'Lantern Bearer remains');
  assert.ok(trait(b,DANCING),'Dancing Lantern is separate');
  assert.match(trait(b,LANTERN).description,/immune.*blindness.*dazzle/i);
  assert.match(trait(b,LANTERN).description,/one level higher/i);
  assert.doesNotMatch(trait(b,LANTERN).description,/torchlight\s+at\s+will|INT\s*>=\s*10/);
  assert.match(trait(b,DANCING).description,/at will/i);
  for(const id of [SPEED,TELEPATHY,UNABLE])assert.ok(trait(b,id),'retains '+id);
  assert.equal(result.traits.filter(t=>t.id===LANTERN).length,1);
  assert.equal(result.traits.filter(t=>t.id===DANCING).length,1);
  assert.deepEqual(buildIssues(b).filter(issue=>/unresolved replacement|precise replacement/i.test(issue.message)),[]);
  const saved=compileBuild(b);
  assert.ok(card(saved,LANTERN));assert.ok(card(saved,DANCING));
  assert.match(card(saved,LANTERN).desc,/immune.*blindness.*dazzle/i);
  assert.doesNotMatch(card(saved,LANTERN).desc,/INT\s*>=\s*10/);
  assert.match(card(saved,DANCING).desc,/at will/);
  const reopened=compileBuild(saved.rulesBuild.input,saved);
  assert.equal(reopened.racialAbilities.filter(x=>x.sourceRuleId===DANCING).length,1);
  assert.equal(reopened.racialAbilities.filter(x=>x.sourceRuleId===LANTERN).length,1);
  assert.equal(reopened.rulesBuild.input.alternateIds[0],DANCING);
 }
});

test('Independent alternatives coexist; disabled Lantern Bearer and changed saved alt are rejected',()=>{
 const b=fixture({dancing:true});
 b.alternateIds.push(KEEN);
 assert.deepEqual(raceTraits(b).errors,[]);
 assert.ok(trait(b,KEEN));
 const invalid=fixture({dancing:true});
 invalid.disabledTraits=[LANTERN];
 assert.ok(raceTraits(invalid).errors.some(msg=>/Cannot modify/.test(msg)));
 assert.ok(buildIssues(invalid).some(i=>/Cannot modify/.test(i.message)));
 assert.throws(()=>compileBuild(invalid));
 const normal=compileBuild(fixture({dancing:false}));
 const added=structuredClone(normal.rulesBuild.input);added.alternateIds=[DANCING];
 assert.throws(()=>compileBuild(added,normal),/permanent/);
 const saved=compileBuild(fixture({dancing:true}));
 const without=structuredClone(saved.rulesBuild.input);without.alternateIds=[];
 assert.throws(()=>compileBuild(without,saved),/permanent/);
 // A player's manual ability-card notes are not discarded on edit/reopen.
 card(saved,LANTERN).desc+=' Player note: keep the lantern covered.';
 assert.match(card(compileBuild(saved.rulesBuild.input,saved),LANTERN).desc,/Player note/);
});
