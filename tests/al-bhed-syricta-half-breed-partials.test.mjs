import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,buildIssues,effectiveScores,raceTraits,raceFor,replacementFor} from '../src/features/characters/rules/build.mjs';
import {isSupportedRaceOperation} from '../src/features/characters/rules/race-replacement-operations.mjs';
import {racialChoiceSpecs,pruneRacialChoices,SYRICTA_ELEMENT,SYRICTA_BREATH,HALF_ANCESTRAL_SLOT} from '../src/features/characters/rules/racial-choices.mjs';
import {AL_BHED_GENIUS,AL_BHED_LANGUAGES} from '../src/features/characters/rules/racial-progress.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
const id=(race,slug)=>'ffd20:race:'+race+':trait:'+slug;
const option=(pool,slug)=>pool+':option:'+slug;
const active=(b,slug)=>raceTraits(b).traits.find(f=>f.id===id(b.raceId.split(':').at(-1),slug));
function fixture(race,alts=[]){
 const b=newBuild();
 Object.assign(b,{name:'Race partial batch',alignment:'True Neutral',raceId:'ffd20:race:'+race,
  classId:'ffd20:class:dancer',alternateIds:alts.map(x=>id(race,x)),reviewed:true,hpRolls:[]});
 b.hpRolls=[classHitDie(b)];
 if(race==='al-bhed'){
  b.baseScores.int=14;
  b.racialChoices={[AL_BHED_GENIUS]:['skill-row:8']};
 }
 if(race==='syricta'){
  b.racialChoices={
   [SYRICTA_ELEMENT]:[option(SYRICTA_ELEMENT,'fire')],
   [SYRICTA_BREATH]:[option(SYRICTA_BREATH,'15-foot-cone')]
  };
 }
 b.skillRanks=fixedSkills.map(()=>0);
 let remaining=previewBuild(b).skillBudget;
 if(race==='al-bhed'){b.skillRanks[8]=1;remaining--;}
 for(let i=0;i<fixedSkills.length&&remaining>0;i++)if(!b.skillRanks[i]){b.skillRanks[i]=1;remaining--;}
 return b;
}
test('runtime reconciliation is restricted to exact source operations and baselines',()=>{
 for(const [race,slug,count] of [
  ['al-bhed','xenophobic',1],['syricta','wing-clipped',1],
  ['syricta','neglected-heritage',1],['half-breed','ancestral-arms',2]
 ]){
  const b=fixture(race),r=raceFor(b),ops=replacementFor(r,id(race,slug));
  assert.equal(ops.length,count,race+' '+slug);
  assert.ok(ops.every(o=>isSupportedRaceOperation(r,o)),race+' operation');
  for(const op of ops)for(const bad of [{...op,id:op.id+':invented'},{...op,targetFeatureIds:[id(race,'type')]}])
   assert.equal(isSupportedRaceOperation(r,bad),false,race+' source guard');
  const html=renderBuild(b,2,{mode:'create'}),control=html.match(new RegExp('<input[^>]*data-rw-alternate="'+id(race,slug)+'"[^>]*>'));
  assert.ok(control,race+' selectable alternate');
  assert.doesNotMatch(control[0],/disabled/);
 }
 const half=raceFor(fixture('half-breed')),unsafe=half.data.alternateReplacements.find(o=>o.id===id('half-breed','ancestral-arms')+':replacement');
 assert.equal(isSupportedRaceOperation(half,unsafe),false,'old two-target source cannot consume both inherited trait slots');
 for(const slug of ['dragon-type','memories-of-the-forgotten','evasive-maneuvers']){
  const b=fixture('syricta',[slug]);
  assert.ok(raceTraits(b).errors.some(x=>/precise replacement/.test(x)),slug+' remains guarded');
 }
});

test('Al Bhed Xenophobic starts Albhedian only and removes Intelligence bonus-language pool',()=>{
 const ordinary=fixture('al-bhed'),b=fixture('al-bhed',['xenophobic']);
 assert.deepEqual(raceTraits(b).errors,[]);
 assert.deepEqual(buildIssues(b),[]);
 const normal=compileBuild(ordinary),sheet=compileBuild(b);
 assert.match(normal.languages,/Common/);assert.match(normal.languages,/Albhedian/);
 assert.equal(sheet.languages,'Albhedian');
 assert.ok(active(b,'languages'));
 assert.ok(active(b,'xenophobic'));
 assert.ok(!racialChoiceSpecs(raceFor(b),raceTraits(b).traits).some(x=>x.id===AL_BHED_LANGUAGES));
 assert.match(active(b,'languages').description,/one language per TWO Linguistics ranks/);
 assert.match(active(b,'languages').description,/mind-affecting except fear/);
 assert.ok(active(b,'mechanical-genius'));
 assert.ok(active(b,'fixer-upper'));
 assert.ok(active(b,'weapon-familiarity'));
 assert.equal(compileBuild(sheet.rulesBuild.input,sheet).languages,'Albhedian');
 const stale=structuredClone(b);
 stale.racialChoices[AL_BHED_LANGUAGES]=[option(AL_BHED_LANGUAGES,'goblin')];
 assert.ok(buildIssues(stale).some(i=>/Unknown or inactive racial choice/.test(i.message)));
 assert.throws(()=>compileBuild(stale),{code:'INVALID_CHARACTER'});
 pruneRacialChoices(stale,raceFor(stale),raceTraits(stale).traits);
 assert.ok(!Object.hasOwn(stale.racialChoices,AL_BHED_LANGUAGES));
 const removed=structuredClone(sheet.rulesBuild.input);
 removed.alternateIds=[];
 assert.throws(()=>compileBuild(removed,sheet),/permanent/);
 const disabled=fixture('al-bhed',['xenophobic']);
 disabled.disabledTraits=[id('al-bhed','languages')];
 assert.ok(raceTraits(disabled).errors.some(e=>/disabled/.test(e)));
});

test('Syricta standard requires both elemental and breath picks; no invented default',()=>{
 const b=fixture('syricta');
 assert.deepEqual(buildIssues(b),[]);
 const empty=structuredClone(b);empty.racialChoices={};
 assert.ok(buildIssues(empty).some(i=>/Elemental Resistance selection/.test(i.message)));
 assert.ok(buildIssues(empty).some(i=>/Breath Weapon selection/.test(i.message)));
 assert.throws(()=>compileBuild(empty),{code:'INVALID_CHARACTER'});
 const specs=racialChoiceSpecs(raceFor(b),raceTraits(b).traits);
 assert.deepEqual(specs.filter(x=>[SYRICTA_ELEMENT,SYRICTA_BREATH].includes(x.id)).map(x=>x.maximum),[1,1]);
 const page=renderBuild(b,1,{mode:'create'});
 assert.match(page,/Elemental Resistance selection/);
 assert.match(page,/Breath Weapon selection/);
 const result=compileBuild(b);
 assert.equal(result.speed,20);assert.equal(result.speed_fly,40);
 assert.equal(result.speed_fly_maneuverability,'poor');
 assert.ok(result.racialAbilities.some(x=>x.name==='Selected racial choices'&&/fire/.test(x.desc)));
 assert.match(result.racialAbilities.find(x=>x.name==='Selected racial choices').desc,/15-foot cone/i);
 const changed=structuredClone(result.rulesBuild.input);
 changed.racialChoices[SYRICTA_ELEMENT]=[option(SYRICTA_ELEMENT,'ice')];
 assert.throws(()=>compileBuild(changed,result),/chosen at character creation/);
 const changedShape=structuredClone(result.rulesBuild.input);
 changedShape.racialChoices[SYRICTA_BREATH]=[option(SYRICTA_BREATH,'20-foot-line')];
 assert.throws(()=>compileBuild(changedShape,result),/chosen at character creation/);
});

test('Syricta Wing-Clipped keeps land and STR/CHA, removes DEX penalty and changes flight only',()=>{
 const normal=fixture('syricta'),b=fixture('syricta',['wing-clipped']);
 assert.deepEqual(raceTraits(b).errors,[]);
 assert.deepEqual(buildIssues(b),[]);
 const before=compileBuild(normal),after=compileBuild(b),scores=effectiveScores(b);
 assert.equal(before.dex,8);assert.equal(scores.dex,10);
 assert.equal(scores.str,12);assert.equal(scores.cha,12);
 assert.equal(after.speed,20);assert.equal(after.speed_fly,20);
 assert.equal(after.speed_fly_maneuverability,'clumsy');
 assert.ok(active(b,'base-speed'));assert.ok(active(b,'ability-score-racial-traits'));
 assert.ok(active(b,'wing-clipped'));assert.ok(active(b,'breath-weapon'));
 assert.match(active(b,'wing-clipped').description,/DC30 Fly/);
 for(const name of ['Bluff','Climb','Diplomacy']){
  const n=fixedSkills.findIndex(x=>x.name===name);
  assert.ok(n>=0,name);
  assert.equal(after.skills[n].rulesBonus-before.skills[n].rulesBonus,2,name);
 }
 const reopened=compileBuild(after.rulesBuild.input,after);
 assert.equal(reopened.speed_fly,20);assert.equal(reopened.speed_fly_maneuverability,'clumsy');
 const edited=mergeSheetData(after,{action:'fields',fields:{speed_fly:0,speed_fly_maneuverability:'average'}});
 const reread=compileBuild(edited.rulesBuild.input,edited);
 assert.equal(reread.speed_fly,0);assert.equal(reread.speed_fly_maneuverability,'average');
 const disabled=fixture('syricta',['wing-clipped']);
 disabled.disabledTraits=[id('syricta','ability-score-racial-traits')];
 assert.ok(raceTraits(disabled).errors.some(x=>/disabled/.test(x)));
});

test('Syricta Neglected Heritage removes only Draconic and preserves conditional Diplomacy wording',()=>{
 const normal=fixture('syricta'),b=fixture('syricta',['neglected-heritage']);
 assert.deepEqual(buildIssues(b),[]);
 assert.deepEqual(raceTraits(b).errors,[]);
 const before=compileBuild(normal),after=compileBuild(b);
 assert.match(before.languages,/Common/);assert.match(before.languages,/Draconic/);
 assert.equal(after.languages,'Common');
 assert.ok(active(b,'languages'));assert.ok(active(b,'neglected-heritage'));
 assert.match(active(b,'languages').description,/Linguistics/);
 const diplomacy=fixedSkills.findIndex(x=>x.name==='Diplomacy');
 assert.equal(after.skills[diplomacy].rulesBonus,before.skills[diplomacy].rulesBonus,'conditional +1 is not always-on');
 assert.equal(compileBuild(after.rulesBuild.input,after).languages,'Common');
 const combo=fixture('syricta',['wing-clipped','neglected-heritage']);
 assert.deepEqual(raceTraits(combo).errors,[]);
 assert.equal(compileBuild(combo).speed_fly,20);
 assert.equal(compileBuild(combo).languages,'Common');
 const invalid=fixture('syricta',['neglected-heritage']);
 invalid.disabledTraits=[id('syricta','languages')];
 assert.ok(raceTraits(invalid).errors.some(x=>/disabled/.test(x)));
});

test('Half-Breed Ancestral Arms replaces exactly the chosen inherited slot but race remains save-blocked',()=>{
 const prefix='ffd20:race:half-breed:trait:',initial=fixture('half-breed',['ancestral-arms']);
 const pool=HALF_ANCESTRAL_SLOT;
 const specs=racialChoiceSpecs(raceFor(initial),raceTraits(initial).traits);
 const slot=specs.find(x=>x.id===pool);
 assert.ok(slot);assert.equal(slot.minimum,1);assert.equal(slot.maximum,1);
 assert.equal(slot.options.length,2);
 assert.ok(buildIssues(initial).some(i=>/Ancestral Arms selected slot/.test(i.message)));
 for(const [chosen,target,keep] of [
  ['feat-and-skill','feat-and-skill-trait-selection','offense-trait-selection'],
  ['offense','offense-trait-selection','feat-and-skill-trait-selection']
 ]){
  const b=fixture('half-breed',['ancestral-arms']);
  b.racialChoices[pool]=[option(pool,chosen)];
  assert.deepEqual(raceTraits(b).errors,[]);
  assert.deepEqual(raceTraits(b).replaced,[prefix+target]);
  assert.ok(!raceTraits(b).traits.some(x=>x.id===prefix+target));
  assert.ok(raceTraits(b).traits.some(x=>x.id===prefix+keep));
  assert.ok(active(b,'ancestral-arms'));
  assert.ok(buildIssues(b).some(i=>/two legal parent races/.test(i.message)));
  assert.throws(()=>compileBuild(b),/two legal parent races/);
 }
 const bad=fixture('half-breed',['ancestral-arms']);
 bad.racialChoices[pool]=[option(pool,'not-an-option')];
 assert.ok(buildIssues(bad).some(i=>/Invalid or duplicate/.test(i.message)));
 const both=fixture('half-breed',['ancestral-arms']);
 both.racialChoices[pool]=[option(pool,'offense'),option(pool,'feat-and-skill')];
 assert.ok(buildIssues(both).some(i=>/choose 1 option/.test(i.message)));
});
