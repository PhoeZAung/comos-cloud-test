import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,raceTraits,buildIssues} from '../src/features/characters/rules/build.mjs';
import {DWARF_ID,DWARF_MOUNTAIN_TRAIT,DWARF_MOUNTAIN_LANDSCAPE} from '../src/features/characters/rules/racial-progress.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
const terrains=[
 DWARF_ID+':option:mountain-familarity-landscape-mountains-and-hills',
 DWARF_ID+':option:mountain-familarity-landscape-coniferous-or-deciduous-forests'
];
function fixture(terrain=terrains[0]){
 const b=newBuild();Object.assign(b,{name:'Mountain Dwarf',alignment:'True Neutral',raceId:DWARF_ID,classId:'ffd20:class:dancer',alternateIds:[DWARF_MOUNTAIN_TRAIT],racialChoices:{[DWARF_MOUNTAIN_LANDSCAPE]:[terrain]},reviewed:true});
 b.hpRolls=[classHitDie(b)];b.skillRanks=fixedSkills.map(()=>0);
 let remain=previewBuild(b).skillBudget;for(let i=0;i<fixedSkills.length&&remain>0;i++){b.skillRanks[i]=1;remain--;}
 return b;
}
test('Dwarf Mountain Familarity offers source terrain choices and persists selected conditional benefit',()=>{
 for(const terrain of terrains){
  const b=fixture(terrain),racePage=renderBuild(b,2),i=racePage.indexOf('data-rw-alternate="'+DWARF_MOUNTAIN_TRAIT+'"');
  assert.ok(i>=0);assert.doesNotMatch(racePage.slice(i,i+110),/disabled/);
  assert.match(racePage,/data-rw-racial-choice="ffd20:race:dwarf:pool:mountain-familarity-landscape"/);
  assert.match(racePage,/mountains and hills/);assert.match(racePage,/coniferous or deciduous forests/);
  const racial=raceTraits(b);assert.ok(racial.replaced.includes(DWARF_ID+':feature:bond-to-the-land'));
  const name=terrain===terrains[0]?'mountains and hills':'coniferous or deciduous forests';
  assert.match(racial.traits.find(f=>f.id===DWARF_MOUNTAIN_TRAIT).description,new RegExp('Chosen landscape: '+name));
  assert.ok(!buildIssues(b).some(x=>x.message.includes('Mountain Familarity')));
  const saved=compileBuild(b),card=saved.racialAbilities.find(f=>f.sourceRuleId===DWARF_MOUNTAIN_TRAIT);
  assert.ok(card);assert.match(card.desc,/Chosen landscape/);
  assert.equal(saved.ac_temp||0,0,'conditional AC must not become permanently applied');
  assert.deepEqual(saved.rulesBuild.input.racialChoices[DWARF_MOUNTAIN_LANDSCAPE],[terrain]);
  const again=compileBuild(saved.rulesBuild.input,saved);
  assert.deepEqual(again.rulesBuild.input.racialChoices[DWARF_MOUNTAIN_LANDSCAPE],[terrain]);
  assert.match(again.racialAbilities.find(f=>f.sourceRuleId===DWARF_MOUNTAIN_TRAIT).desc,/Chosen landscape/);
 }
});
test('Dwarf Mountain Familarity choice validation rejects missing, duplicate, and disabled trait values',()=>{
 const missing=fixture();delete missing.racialChoices[DWARF_MOUNTAIN_LANDSCAPE];assert.throws(()=>compileBuild(missing),/choose 1/i);
 const excess=fixture();excess.racialChoices[DWARF_MOUNTAIN_LANDSCAPE]=terrains;assert.throws(()=>compileBuild(excess),/choose 1/i);
 const unknown=fixture();unknown.racialChoices[DWARF_MOUNTAIN_LANDSCAPE]=['invalid'];assert.throws(()=>compileBuild(unknown),/Invalid or duplicate/i);
 const inactive=fixture();inactive.alternateIds=[];assert.throws(()=>compileBuild(inactive),/inactive|Unknown/i);
});
test('Dwarf Mountain Familarity terrain and starting alternate cannot be switched during editing',()=>{
 const saved=compileBuild(fixture());
 const modified=structuredClone(saved.rulesBuild.input);modified.racialChoices[DWARF_MOUNTAIN_LANDSCAPE]=[terrains[1]];
 assert.throws(()=>compileBuild(modified,saved),/permanent|cannot change/);
 const toggled=structuredClone(saved.rulesBuild.input);toggled.alternateIds=[];delete toggled.racialChoices[DWARF_MOUNTAIN_LANDSCAPE];
 assert.throws(()=>compileBuild(toggled,saved),/character creation/);
 const normal=fixture();normal.alternateIds=[];normal.racialChoices={};
 const old=compileBuild(normal),late=structuredClone(old.rulesBuild.input);
 late.alternateIds=[DWARF_MOUNTAIN_TRAIT];late.racialChoices={[DWARF_MOUNTAIN_LANDSCAPE]:[terrains[0]]};
 assert.throws(()=>compileBuild(late,old),/character creation/);
});
