import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,raceTraits,buildIssues} from '../src/features/characters/rules/build.mjs';
import {MUTANT_ID,mutantProjection,mutantVerifiedEffects} from '../src/features/characters/rules/mutant-progression.mjs';
import {seedRacialMovement} from '../src/features/sheet/movement.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';

const mutation=(abilities,raceId=MUTANT_ID)=>{
 const b=newBuild();b.name='D100 source mapping';b.raceId=raceId;
 b.mutantRolls={resistance:1,abilities,physical:[],levels:{}};
 return b;
};
const ownedSwim=(b)=>mutantVerifiedEffects(b).filter(e=>e.target==='identity.speed.swim');

test('d100 19 grants exactly 30 ft swim speed with source-owned effect and a visible preview',()=>{
 const b=mutation([19]),p=mutantProjection(b);
 assert.equal(p.swim,30);assert.equal(p.appliedResults.length,1);
 assert.deepEqual(p.manualResults,[]);
 assert.equal(ownedSwim(b).length,1);
 assert.equal(ownedSwim(b)[0].value.value,30);
 assert.equal(ownedSwim(b)[0].sourceOutcomeId,'ffd20:race:mutant:pool:table-variant-mutant-abilities:outcome:019');
 const next={};seedRacialMovement(next,{},MUTANT_ID,raceTraits(b).traits);
 assert.equal(next.speed_swim,30);
 assert.match(renderBuild(b,2),/Swim 30 ft/);
 assert.ok(buildIssues(b).some(x=>/saving is disabled/.test(x.message)),
  'source-verified swim does not falsely unblock full Mutant creation');
});
test('d100 20, 50, 80 give only source-defined preview combat numbers',()=>{
 for(const [roll,field,bonus] of [[20,'cmb',2],[50,'naturalArmor',1],[80,'cmd',2]]){
  const b=mutation([roll]),p=mutantProjection(b);
  assert.equal(p[field],bonus);
  assert.equal(p.appliedResults.length,1);assert.equal(p.manualResults.length,0);
  assert.equal(mutantVerifiedEffects(b).length,0,
   'combat previews are not installed as unsupported saved-sheet effects');
  assert.match(renderBuild(b,2),/Combat preview only: CMB/);
  for(const other of ['cmb','cmd','naturalArmor'].filter(x=>x!==field))assert.equal(p[other],0);
 }
});
test('Roll 100 duplicate Swim outcomes never set a fabricated 60-ft swim speed',()=>{
 const b=mutation([100,19,19]),p=mutantProjection(b);
 assert.equal(p.swim,30);
 assert.equal(p.appliedResults.length,2);
 const next={};seedRacialMovement(next,{},MUTANT_ID,raceTraits(b).traits);
 assert.equal(next.speed_swim,30);
});
test('Movement preserves explicit manual edits and does not affect other races',()=>{
 const b=mutation([19]);
 for(const v of [0,15,45]){
  const next={speed_swim:v};
  seedRacialMovement(next,{speed_swim:v},MUTANT_ID,raceTraits(b).traits);
  assert.equal(next.speed_swim,v);
 }
 const other=mutation([19],'ffd20:race:tarutaru');
 assert.equal(mutantProjection(other).swim,0);
 assert.equal(ownedSwim(other).length,0);
 const next={};seedRacialMovement(next,{},'ffd20:race:tarutaru',raceTraits(other).traits);
 assert.equal(next.speed_swim,undefined);
});
test('Unverified conditional burrowing stays manual; disabled Mutant ability does not apply d100 effects',()=>{
 const conditional=mutation([31]);
 assert.equal(mutantProjection(conditional).manualResults.length,1,
  'terrain-limited burrowing is not a universal unconditional sheet speed');
 assert.equal(mutantProjection(conditional).swim,0);
 assert.equal(mutantVerifiedEffects(conditional).length,0);
 const inactive=mutation([19]);inactive.disabledTraits=[MUTANT_ID+':trait:variable-mutant-abilities'];
 assert.equal(mutantProjection(inactive).swim,0);assert.equal(ownedSwim(inactive).length,0);
 const next={};seedRacialMovement(next,{},MUTANT_ID,raceTraits(inactive).traits);
 assert.equal(next.speed_swim,undefined);
});
