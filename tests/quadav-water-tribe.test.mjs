import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,buildIssues,compileBuild,raceFor,raceTraits,replacementFor} from '../src/features/characters/rules/build.mjs';
import {isSupportedRaceOperation} from '../src/features/characters/rules/race-replacement-operations.mjs';
import {QUADAV_ID,QUADAV_TERRAIN} from '../src/features/characters/rules/racial-progress.mjs';
import {racialChoiceSpecs,pruneRacialChoices} from '../src/features/characters/rules/racial-choices.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';

const WATER=QUADAV_ID+':trait:water-tribe';
const WITHDRAWAL=QUADAV_ID+':trait:full-withdrawal';
const BASE=QUADAV_ID+':trait:base-speed';
const BOND=QUADAV_ID+':trait:bond-to-the-land';
const terrain=name=>QUADAV_TERRAIN+':option:'+name;
const trait=(b,id)=>raceTraits(b).traits.find(f=>f.id===id);

function fixture({water=false,chosen='swamp',int=10}={}){
 const b=newBuild();
 Object.assign(b,{name:'Quadav Water Tribe',alignment:'True Neutral',raceId:QUADAV_ID,classId:'ffd20:class:monk',
  hpRolls:[12],reviewed:true,alternateIds:water?[WATER]:[],racialChoices:chosen?{[QUADAV_TERRAIN]:[terrain(chosen)]}:{}});
 b.baseScores.int=int;
 b.skillRanks=fixedSkills.map(()=>0);
 let remaining=previewBuild(b).skillBudget;
 for(let i=0;i<fixedSkills.length&&remaining>0;i++){b.skillRanks[i]=1;remaining--;}
 return b;
}

test('Quadav Water Tribe is an exact complete Withdrawal swap plus partial Base Speed modifier',()=>{
 const race=raceFor(fixture());
 const extracted=race.data.alternateReplacements.find(op=>op.id===WATER+':replacement');
 assert.equal(extracted.scope,'partial_feature');assert.equal(extracted.resolution,'unresolved');
 const ops=replacementFor(race,WATER);
 assert.equal(ops.length,2);
 assert.deepEqual(ops.map(x=>x.operation),['replace','modify']);
 assert.deepEqual(ops[0].targetFeatureIds,[WITHDRAWAL]);
 assert.deepEqual(ops[1].targetFeatureIds,[BASE]);
 assert.ok(ops.every(op=>isSupportedRaceOperation(race,op)));
 assert.equal(isSupportedRaceOperation(race,{...ops[1],targetFeatureIds:[BOND]}),false);
 assert.equal(isSupportedRaceOperation(race,{...ops[1],addsFeatureIds:[WATER]}),false);
 assert.equal(isSupportedRaceOperation(race,{...ops[1],operation:'replace'}),false);
});

test('Quadav standard retains 20-ft land and 30-ft swim, Full Withdrawal and terrain choice',()=>{
 const b=fixture();
 assert.deepEqual(buildIssues(b),[]);
 const specs=racialChoiceSpecs(raceFor(b),raceTraits(b).traits);
 const bond=specs.find(x=>x.id===QUADAV_TERRAIN);
 assert.equal(bond.minimum,1);assert.equal(bond.maximum,1);
 assert.deepEqual(bond.options.map(x=>x.name),['Swamp','Underground']);
 const html=renderBuild(b,2,{mode:'create'});
 assert.match(html,new RegExp('data-rw-racial-choice="'+QUADAV_TERRAIN+'"'));
 const waterControl=html.match(new RegExp('<input[^>]*data-rw-alternate="'+WATER+'"[^>]*>'));
 assert.ok(waterControl);assert.doesNotMatch(waterControl[0],/disabled/);
 assert.ok(trait(b,WITHDRAWAL));
 assert.ok(!trait(b,WATER));
 const d=compileBuild(b);
 assert.equal(d.speed,20);assert.equal(d.speed_swim,30);
 assert.match(d.racialAbilities.find(x=>x.sourceRuleId===BOND)?.desc||'',/Chosen terrain: Swamp/);
 assert.ok(d.racialAbilities.some(x=>x.sourceRuleId===WITHDRAWAL));
 assert.equal(compileBuild(d.rulesBuild.input,d).speed_swim,30);
});

test('Quadav Water Tribe gives 50-ft swim and amphibious ability without land-speed change or withdrawal benefits',()=>{
 for(const chosen of ['swamp','underground']){
  const b=fixture({water:true,chosen}),racial=raceTraits(b);
  assert.deepEqual(racial.errors,[]);
  assert.deepEqual(buildIssues(b),[]);
  assert.ok(racial.replaced.includes(WITHDRAWAL));
  assert.ok(!trait(b,WITHDRAWAL));
  assert.ok(trait(b,WATER));
  assert.ok(trait(b,BOND));
  assert.match(trait(b,BOND).description,new RegExp('Chosen terrain: '+(chosen==='swamp'?'Swamp':'Underground')));
  assert.equal(trait(b,BASE).effects.find(e=>e.target==='identity.speed.land').value.value,20);
  assert.equal(trait(b,BASE).effects.find(e=>e.target==='identity.speed.swim').value.value,50);
  const d=compileBuild(b);
  assert.equal(d.speed,20);assert.equal(d.speed_swim,50);
  assert.match(d.racialAbilities.find(x=>x.sourceRuleId===WATER)?.desc||'',/breathe air and water/);
  assert.ok(!d.racialAbilities.some(x=>x.sourceRuleId===WITHDRAWAL));
  assert.ok(d.racialAbilities.some(x=>x.sourceRuleId===BOND));
  assert.equal(d.rulesBuild.input.racialChoices[QUADAV_TERRAIN][0],terrain(chosen));
  const reopened=compileBuild(d.rulesBuild.input,d);
  assert.equal(reopened.speed_swim,50);
  assert.equal(reopened.racialAbilities.filter(x=>x.sourceRuleId===WATER).length,1);
 }
});

test('Quadav terrain must be explicitly chosen, validated, fixed after save, and never applied as always-on dodge AC',()=>{
 const missing=fixture({water:true,chosen:''});
 assert.ok(buildIssues(missing).some(i=>/Bond to the Land selection: choose 1/.test(i.message)));
 assert.throws(()=>compileBuild(missing),/Bond to the Land selection/);
 const invalid=fixture({water:true,chosen:'mountain'});
 assert.ok(buildIssues(invalid).some(i=>/Invalid or duplicate Bond to the Land/.test(i.message)));
 assert.throws(()=>compileBuild(invalid));
 const b=fixture({water:true}),saved=compileBuild(b);
 assert.equal(saved.ac_dodge||0,0);
 const changed=structuredClone(saved.rulesBuild.input);
 changed.racialChoices[QUADAV_TERRAIN]=[terrain('underground')];
 assert.throws(()=>compileBuild(changed,saved),/permanent/);
 const without=structuredClone(saved.rulesBuild.input);
 without.alternateIds=[];
 assert.throws(()=>compileBuild(without,saved),/permanent/);
 const before=fixture();before.racialChoices={};
 pruneRacialChoices(before,raceFor(before),raceTraits(before).traits);
 assert.deepEqual(before.racialChoices,{});
});

test('Quadav swim speed is seeded only on creation; player editing zero or custom speed persists',()=>{
 const b=fixture({water:true}),original=compileBuild(b);
 for(const swim of [0,35,60]){
  const edited=mergeSheetData(original,{action:'fields',fields:{speed_swim:swim}});
  const reopened=compileBuild(edited.rulesBuild.input,edited);
  assert.equal(reopened.speed_swim,swim,'manual swim '+swim+' should survive reopen');
  assert.equal(reopened.speed,20);
 }
 // Vanilla retains manual edits too and the movement modifier is never an
 // unconditional AC, attack, concentration or skill bonus.
 const vanilla=compileBuild(fixture());
 const edited=mergeSheetData(vanilla,{action:'fields',fields:{speed_swim:42}});
 assert.equal(compileBuild(edited.rulesBuild.input,edited).speed_swim,42);
});
