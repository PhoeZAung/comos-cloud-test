import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newBuild,buildIssues,raceTraits,compileBuild,previewBuild,raceFor} from '../src/features/characters/rules/build.mjs';
import {GUNBREAKER_ID,DOOM_SLAYER_ID} from '../src/features/characters/rules/level-one-classes.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
const GALKA='ffd20:race:galka';
const trait=k=>GALKA+':feature:'+k;
const make=(ids=[],archetypeId='')=>{
 const b=newBuild();Object.assign(b,{name:'Galka Alternate',raceId:GALKA,classId:GUNBREAKER_ID,archetypeId,reviewed:true,hpRolls:[10],alternateIds:ids});
 b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);
 return b;
};
const skill=(data,name)=>data.skills.find(x=>x.name===name);
test('all ten Galka alternates have single-source replacements, selectable checkbox and compile safely',async()=>{
 const race=JSON.parse(await readFile(new URL('../rules/races/galka.race.json',import.meta.url),'utf8'));
 assert.equal(race.data.alternateTraitIds.length,10);assert.equal(race.data.alternateReplacements.length,10);
 for(const id of race.data.alternateTraitIds){
  const b=make([id]),choice=race.data.alternateReplacements.filter(x=>x.addsFeatureIds.includes(id));
  assert.equal(choice.length,1);assert.equal(choice[0].resolution,'resolved');
  assert.deepEqual(buildIssues(b),[],'Gal ka alternate should save: '+id);
  const state=raceTraits(b),d=compileBuild(b);
  assert(state.traits.some(f=>f.id===id));
  assert(!state.traits.some(f=>choice[0].targetFeatureIds.includes(f.id)));
  assert.equal(d.alternateRacialTraits.length,1);
  assert.equal(d.alternateRacialTraits[0].enabled,true);
  assert.equal(d.hp_max,10);
  const html=renderBuild(b,2,{mode:'create'});
  assert(html.includes('data-rw-alternate="'+id+'"'));
  assert(!html.includes('data-rw-alternate="'+id+'" disabled'));
 }
});
test('Galka alternate replacements change only the owned effect, preserving conditional rules',()=>{
 let b=make([trait('darkvision')]);let d=compileBuild(b);
 assert.match(d.senses,/Darkvision 60 ft/i);assert.doesNotMatch(d.senses,/low.light/i);
 assert(!d.racialAbilities.some(f=>f.name==='Metalworker'));
 b=make([trait('wary')]);d=compileBuild(b);
 assert.equal(skill(d,'Bluff').rulesBonus,1);assert.equal(skill(d,'Sense Motive').rulesBonus,1);
 assert.equal(skill(d,'Intimidate').rulesBonus,2);
 b=make([trait('beastmaster')]);d=compileBuild(b);
 assert.equal(skill(d,'Handle Animal').rulesBonus,2);assert(!d.racialAbilities.some(f=>f.name==='Ferocity'));
 b=make([trait('architectural-ingenuity')]);d=compileBuild(b);
 assert.equal(skill(d,'Knw: Engineering').rulesBonus,2);assert.equal(skill(d,'Perception').rulesBonus,0);
 b=make([trait('city-raised')]);d=compileBuild(b);
 assert.equal(skill(d,'Knw: Local').rulesBonus,2);assert.match(d.proficiencies,/Whip/);assert.match(d.proficiencies,/Longsword/);
 b=make([trait('scavenger')]);d=compileBuild(b);
 assert.equal(skill(d,'Appraise').rulesBonus,2);assert.equal(skill(d,'Perception').rulesBonus,0);
 b=make([trait('tenacious')]);d=compileBuild(b);
 assert.equal(d.racialAbilities.find(f=>f.name==='Tenacious').u_max,1);
 assert(!d.racialAbilities.some(f=>f.name==='Ferocity'));
});
test('Galka conflicting replacements cannot be saved, and the non-conflicting ones combine',()=>{
 const conflicting=make([trait('architectural-ingenuity'),trait('wary')]);
 assert(raceTraits(conflicting).errors.some(x=>/Two selections replace/.test(x)));
 assert.throws(()=>compileBuild(conflicting),/Two selections replace/);
 const b=make([trait('city-raised'),trait('tenacious'),trait('wary')],DOOM_SLAYER_ID);
 assert.deepEqual(buildIssues(b),[]);
 const d=compileBuild(b);assert.equal(d.alternateRacialTraits.length,3);
 assert.equal(d.classes[0].archetype,'Doom Slayer');
 const edited=compileBuild(d.rulesBuild.input,d);
 assert.equal(edited.alternateRacialTraits.length,3);
 assert.equal(edited.racialAbilities.find(f=>f.name==='Tenacious').u_curr,1);
});
