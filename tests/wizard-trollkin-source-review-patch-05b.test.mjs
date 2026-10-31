import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,raceTraits,compileBuild,previewBuild,registry} from '../src/features/characters/rules/build.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {racialChoiceSpecs} from '../src/features/characters/rules/racial-choices.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';

const RACE='ffd20:race:trollkin',trait=slug=>RACE+':trait:'+slug;
function fixture(faster=false){
 const b=newBuild();
 Object.assign(b,{name:'Trollkin review',raceId:RACE,classId:'ffd20:class:dancer',
  alignment:'True Neutral',reviewed:true,alternateIds:faster?[trait('faster-healing')]:[]});
 b.hpRolls=[classHitDie(b)];b.skillRanks=fixedSkills.map(()=>0);
 for(let i=0,remaining=previewBuild(b).skillBudget;i<fixedSkills.length&&remaining>0;i++,remaining--)b.skillRanks[i]=1;
 return b;
}
test('Trollkin weakness is explicitly displayed as conflicting source text, not a pick',()=>{
 const b=fixture(),r=registry.races.find(x=>x.id===RACE),source=r.features.find(x=>x.id===trait('acid-or-fire'));
 assert.match(source.description,/FIRE or EARTH/);
 assert.match(source.description,/Weakness header says Acid or Fire/);
 assert.deepEqual(racialChoiceSpecs(r,raceTraits(b).traits).filter(s=>/acid.or.fire/i.test(s.id)),[]);
 const warning=renderBuild(b,2);
 assert.match(warning,/source conflict, not an Acid\/Fire picker/);
 assert.match(warning,/FIRE or EARTH/);
 assert.doesNotMatch(warning,/data-rw-racial-choice="ffd20:race:trollkin:pool:/);
 const runtime=raceTraits(b).traits.find(x=>x.id===trait('acid-or-fire'));
 assert.match(runtime.description,/Source contradiction/);
 assert.match(runtime.description,/Acid or Fire/);
 assert.match(runtime.description,/FIRE or EARTH/);
 assert.match(runtime.description,/not a player choice/i);
 assert.equal(runtime.effects.length,0);
});

test('Standard Trollkin Fast Healing 1 and alternate Fast Healing 2 never stack or tick automatically',()=>{
 const normal=fixture(),enhanced=fixture(true);
 const standardTraits=raceTraits(normal).traits,enhancedTraits=raceTraits(enhanced).traits;
 const base=standardTraits.find(x=>x.id===trait('fast-healing'));
 assert.match(base.description,/1 HP per round/);
 assert.match(base.description,/No automatic HP tick/);
 assert(!enhancedTraits.some(x=>x.id===trait('fast-healing')));
 assert(!enhancedTraits.some(x=>x.id===trait('thick-skin')));
 const faster=enhancedTraits.find(x=>x.id===trait('faster-healing'));
 assert.match(faster.description,/2 HP each round replaces Fast Healing 1 and Thick Skin/);
 assert.match(faster.description,/fire or earth/);
 assert.match(faster.description,/No automatic HP|cannot automatically tick HP/);
 for(const traits of [standardTraits,enhancedTraits]){
  const effects=traits.flatMap(t=>t.effects);
  assert(!effects.some(e=>e.automation==='automatic'&&/heal|hp.curr|regenerat|suppression/i.test(e.target||'')));
 }
 const a=compileBuild(normal),b=compileBuild(enhanced);
 assert.equal(a.feats.filter(f=>f.sourceRace==='Trollkin').length,0);
 assert.equal(b.racialAbilities.filter(x=>x.sourceRuleId===trait('faster-healing')).length,1);
 assert(!b.racialAbilities.some(x=>x.sourceRuleId===trait('fast-healing')));
 assert.match(b.racialAbilities.find(x=>x.sourceRuleId===trait('acid-or-fire')).desc,/FIRE or EARTH/);
 assert.equal(compileBuild(b.rulesBuild.input,b).racialAbilities.filter(x=>x.sourceRuleId===trait('faster-healing')).length,1);
});
