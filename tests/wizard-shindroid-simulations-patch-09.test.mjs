import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,buildIssues,effectiveScores,raceTraits,raceFor,replacementFor} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {racialChoiceSpecs,pruneRacialChoices,shindroidSimulationOptions,SHINDROID_SIMULATED_RACE} from '../src/features/characters/rules/racial-choices.mjs';
import {isSupportedRaceOperation} from '../src/features/characters/rules/race-replacement-operations.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
const ID='ffd20:race:shindroid',alt=slug=>ID+':trait:'+slug;
function fixture(...alternates){
 const b=newBuild();Object.assign(b,{name:'Shindroid simulation review',alignment:'True Neutral',
  classId:'ffd20:class:monk',raceId:ID,alternateIds:alternates.map(alt),reviewed:true});
 b.hpRolls=[classHitDie(b)];b.skillRanks=fixedSkills.map(()=>0);
 let left=previewBuild(b).skillBudget;
 for(let i=0;i<fixedSkills.length&&left>0;i++,left--)b.skillRanks[i]=1;
 return b;
}
const trait=(b,slug)=>raceTraits(b).traits.find(t=>t.id===alt(slug));
const issues=b=>buildIssues(b).map(x=>x.message);
const choose=(b,name)=>{
 const option=shindroidSimulationOptions().find(o=>o.name===name);
 assert(option,'Source-backed playable Humanoid option must exist: '+name);
 b.racialChoices[SHINDROID_SIMULATED_RACE]=[option.id];
 return option;
};
test('Hologram Simulation exact operation replaces Plating and base scores, preserving all unrelated traits',()=>{
 const b=fixture('hologram-simulation'),r=raceFor(b);
 const ops=replacementFor(r,alt('hologram-simulation'));
 assert.equal(ops.length,1);assert(ops.every(op=>isSupportedRaceOperation(r,op)));
 assert.deepEqual(ops[0].targetFeatureIds,[alt('composite-plating'),alt('ability-score-racial-traits')]);
 assert.deepEqual(raceTraits(b).errors,[]);
 assert.deepEqual(effectiveScores(fixture()),{str:10,dex:12,con:10,int:12,wis:10,cha:8});
 assert.deepEqual(effectiveScores(b),{str:10,dex:10,con:10,int:14,wis:8,cha:10});
 assert(!trait(b,'composite-plating'));assert(!trait(b,'ability-score-racial-traits'));
 for(const retained of ['robotic-immunities','part-robot','immortal','self-sustained','emotionless','magic-ineptitude','natural-weapons'])
  assert(trait(b,retained),'unrelated racial trait retained: '+retained);
 const sheet=compileBuild(b);
 assert.equal(sheet.size_category,'Diminutive');
 assert.equal(sheet.racialIdentity.type,'Construct');
 assert(sheet.racialIdentity.subtypes.includes('technological'));
 assert(!sheet.racialIdentity.subtypes.some(x=>/humanoid and construct targeting/i.test(x)));
 assert.equal(sheet.speed,0,'core cannot physically move; hardlight body has manual projected speed');
 assert.equal(sheet.ac_natural||0,0,'Composite Plating natural armor no longer stacks');
 assert.equal(sheet.int,14);assert.equal(sheet.wis,8);
 assert.match(trait(b,'hologram-simulation').description,/full-round/);
 assert.match(trait(b,'hologram-simulation').description,/30 ft movement/);
 assert.match(trait(b,'hologram-simulation').description,/programmed appearance/);
 assert.match(renderBuild(b,2),/hardlight body/);
 assert.match(renderBuild(b,2),/Hologram Simulation selected/);
 const reopened=compileBuild(sheet.rulesBuild.input,sheet);
 assert.deepEqual([reopened.size_category,reopened.racialIdentity.type,reopened.int,reopened.wis],
  ['Diminutive','Construct',14,8]);
 assert.equal(reopened.speed,0);
 const tampered=structuredClone(sheet.rulesBuild.input);tampered.alternateIds=[];
 assert.throws(()=>compileBuild(tampered,sheet),/permanent/);
});
test('Hologram Simulation rejects official incompatible selections and overlapping replacements',()=>{
 for(const other of ['integrated-weaponry','race-simulation','ironspy','body-double']){
  const b=fixture('hologram-simulation',other);
  assert(raceTraits(b).errors.length>0,other);
  assert(issues(b).length>0,other);
  assert.throws(()=>compileBuild(b),{code:'INVALID_CHARACTER'});
 }
 const heritage=fixture('hologram-simulation');
 heritage.heritageId=ID+':heritage:android';
 assert(raceTraits(heritage).errors.some(x=>/Hologram Simulation/.test(x)));
 assert(issues(heritage).length>0);
 assert.throws(()=>compileBuild(heritage),{code:'INVALID_CHARACTER'});
 const b=fixture('hologram-simulation');
 assert.doesNotMatch(renderBuild(b,2),new RegExp('data-rw-alternate="'+alt('race-simulation')+'"[^>]*>(?!.*?)'));
 assert(!racialChoiceSpecs(raceFor(b),raceTraits(b).traits).some(s=>s.id===SHINDROID_SIMULATED_RACE));
});
test('Race Simulation chooses a verified humanoid and only adopts size plus race/age notes',()=>{
 const options=shindroidSimulationOptions();
 assert(options.length>=2);
 assert(options.some(o=>o.name==='Hume'&&o.size==='Medium'));
 assert(options.some(o=>o.name==='Tarutaru'&&o.size==='Small'));
 assert(!options.some(o=>o.value===ID));
 assert(!options.some(o=>/Syricta|Shindroid/.test(o.name)));
 for(const [race,size] of [['Hume','Medium'],['Tarutaru','Small']]){
  const b=fixture('race-simulation'),choice=choose(b,race);
  const r=raceFor(b),ops=replacementFor(r,alt('race-simulation'));
  assert.equal(ops.length,1);assert(isSupportedRaceOperation(r,ops[0]));
  assert.deepEqual(ops[0].targetFeatureIds,[alt('immortal')]);
  assert.deepEqual(raceTraits(b).errors,[]);
  const spec=racialChoiceSpecs(r,raceTraits(b).traits,1,b).find(p=>p.id===SHINDROID_SIMULATED_RACE);
  assert.equal(spec.minimum,1);assert.equal(spec.maximum,1);
  assert(spec.options.some(o=>o.id===choice.id));
  assert(!trait(b,'immortal'));
  for(const unchanged of ['robotic-immunities','type','self-sustained','composite-plating','ability-score-racial-traits','magic-ineptitude'])
   assert(trait(b,unchanged),'preserves '+unchanged);
  assert.deepEqual(effectiveScores(b),{str:10,dex:12,con:10,int:12,wis:10,cha:8});
  assert.match(renderBuild(b,2),/data-rw-racial-choice="ffd20:race:shindroid:pool:race-simulation-humanoid"/);
  const sheet=compileBuild(b);
  assert.equal(sheet.size_category,size);
  assert.equal(sheet.racialIdentity.type,'humanoid');
  assert.equal(sheet.racialIdentity.subtypes.includes('technological'),false);
  assert.equal(sheet.languages,'Common','No copied target-race language grants');
  const effect=raceTraits(b).traits.flatMap(t=>t.effects).find(e=>e.target==='race.shindroid.simulated-humanoid');
  assert.match(effect?.textValue||'',new RegExp('Shindroid and '+race));
  assert.match(effect?.textValue||'',/Ages as/);
  assert.match(effect?.textValue||'',/does not gain the race/);
  assert(sheet.racialAbilities.some(row=>row.desc?.includes('Race Simulation')));
  assert.equal(compileBuild(sheet.rulesBuild.input,sheet).size_category,size);
  const changed=structuredClone(sheet.rulesBuild.input);
  changed.racialChoices[SHINDROID_SIMULATED_RACE]=[options.find(o=>o.id!==choice.id).id];
  assert.throws(()=>compileBuild(changed,sheet),/Starting racial language and Knowledge choices cannot be changed/);
 }
});
test('Race Simulation requires exactly one playable humanoid and rejects forged or stale race IDs',()=>{
 const b=fixture('race-simulation');
 assert(issues(b).some(x=>/Race Simulation/.test(x)));
 assert.throws(()=>compileBuild(b),{code:'INVALID_CHARACTER'});
 for(const picked of ['ffd20:race:shindroid','ffd20:race:syricta','invalid']){
  const bad=structuredClone(b);
  bad.racialChoices[SHINDROID_SIMULATED_RACE]=[SHINDROID_SIMULATED_RACE+':option:'+picked];
  assert(issues(bad).some(x=>/Invalid or duplicate/.test(x)));
  assert.throws(()=>compileBuild(bad),{code:'INVALID_CHARACTER'});
 }
 choose(b,'Tarutaru');
 assert.equal(issues(b).length,0);
 b.alternateIds=[];
 assert(issues(b).some(x=>/Unknown or inactive racial choice/.test(x)));
 pruneRacialChoices(b,raceFor(b),raceTraits(b).traits);
 assert.equal(b.racialChoices[SHINDROID_SIMULATED_RACE],undefined);
 assert.equal(compileBuild(b).size_category,'Medium');
});
