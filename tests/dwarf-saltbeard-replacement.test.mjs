import test from 'node:test';
import assert from 'node:assert/strict';
import {registry,newBuild,raceTraits,compileBuild,previewBuild,buildIssues} from '../src/features/characters/rules/build.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {isSupportedRaceOperation} from '../src/features/characters/rules/race-replacement-operations.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
const DWARF='ffd20:race:dwarf',feature=key=>DWARF+':feature:'+key;
function fixture(alt='saltbeard'){
 const b=newBuild();Object.assign(b,{name:'Saltbeard Audit',alignment:'True Neutral',raceId:DWARF,classId:'ffd20:class:dancer',alternateIds:alt?[feature(alt)]:[],reviewed:true});
 b.hpRolls=[classHitDie(b)];b.skillRanks=fixedSkills.map(()=>0);let remaining=previewBuild(b).skillBudget;
 for(let i=0;i<fixedSkills.length&&remaining>0;i++){b.skillRanks[i]=1;remaining--;}return b;
}
test('Dwarf Saltbeard replaces three standards and modifies rather than removes Greed',()=>{
 const b=fixture(),r=raceTraits(b);
 assert.deepEqual(r.errors,[]);
 for(const key of ['defensive-training','hatred','stonecunning']){
  assert.ok(r.replaced.includes(feature(key)),key);
  assert.ok(!r.traits.some(f=>f.id===feature(key)),key);
 }
 assert.ok(r.traits.some(f=>f.id===feature('saltbeard')));
 assert.ok(!r.replaced.includes(feature('greed')));
 const greed=r.traits.find(f=>f.id===feature('greed'));
 assert.ok(greed);assert.match(greed.description,/under water/i);
 assert.doesNotMatch(greed.description,/nonmagical goods containing precious metals/i);
 const bonus=greed.effects.find(e=>e.kind==='skill_bonus');
 assert.equal(bonus.value.value,2);assert.equal(bonus.automation,'conditional');
 assert.match(bonus.condition.description,/under water/);
 assert.doesNotMatch(bonus.condition.description,/only.*precious/i);
 assert.match(renderBuild(b,2),new RegExp('data-rw-alternate="'+feature('saltbeard')+'"'));
 assert.doesNotMatch(renderBuild(b,2),new RegExp('data-rw-alternate="'+feature('saltbeard')+'" disabled'));
 assert.ok(!buildIssues(b).some(x=>/precise replacement/.test(x.message)));
 const result=compileBuild(b);
 assert.ok(result.racialAbilities.some(f=>f.sourceRuleId===feature('saltbeard')));
 const row=result.racialAbilities.find(f=>f.sourceRuleId===feature('greed'));
 assert.ok(row);assert.match(row.desc,/Saltbeard-modified Greed/i);
 assert.equal(result.ac_temp||0,0); // never grant a permanent +2 dodge bonus
 const reopened=compileBuild(result.rulesBuild.input,result);
 assert.match(reopened.racialAbilities.find(f=>f.sourceRuleId===feature('greed')).desc,/under water/);
 assert.equal(reopened.ac_temp||0,0);
});
test('Standard Dwarf Greed retains its original non-water condition without Saltbeard',()=>{
 const b=fixture(''),r=raceTraits(b),greed=r.traits.find(f=>f.id===feature('greed'));
 assert.match(greed.description,/precious metals or gemstones/);
 assert.match(greed.effects[0].condition.description,/precious metal|gemstones/i);
 assert.ok(!r.traits.some(f=>f.id===feature('saltbeard')));
});
test('Saltbeard conflicts with choices that replace Greed or shared traits',()=>{
 for(const other of ['craftsman','lorekeeper','iifa-professor','sky-sentinel']){
  const b=fixture();b.alternateIds.push(feature(other));const errors=raceTraits(b).errors;
  assert.ok(errors.length,'conflict '+other);assert.throws(()=>compileBuild(b),{code:'INVALID_CHARACTER'});
 }
 const disabled=fixture();disabled.disabledTraits=[feature('greed')];
 assert.match(raceTraits(disabled).errors.join(' '),/disabled/);
});
test('Only source-verified partial modification is whitelisted; other unresolved operations remain guarded',()=>{
 const dwarf=registry.races.find(r=>r.id===DWARF);
 const operations=dwarf.data.alternateReplacements.filter(op=>op.addsFeatureIds.includes(feature('saltbeard')));
 assert.equal(operations.length,2);assert.ok(operations.every(op=>isSupportedRaceOperation(dwarf,op)));
 const fake={...operations[1],id:DWARF+':replacement:other-modification'};
 assert.equal(isSupportedRaceOperation(dwarf,fake),false);
 const other=registry.races.find(r=>r.id==='ffd20:race:beastkin');
 const unresolved=other.data.alternateReplacements.find(op=>op.resolution!=='resolved');
 assert.ok(unresolved);assert.equal(isSupportedRaceOperation(other,unresolved),false);
 const b=newBuild();b.raceId=other.id;b.alternateIds=[other.id+':trait:feral'];
 assert.ok(raceTraits(b).errors.some(x=>/precise replacement/.test(x)));
});
test('Saltbeard selection becomes permanent after creation, without a new terrain wizard',()=>{
 const saved=compileBuild(fixture()),original=structuredClone(saved.rulesBuild.input);
 assert.doesNotThrow(()=>compileBuild(original,saved));
 original.alternateIds=[];assert.throws(()=>compileBuild(original,saved),/permanent/);
});
