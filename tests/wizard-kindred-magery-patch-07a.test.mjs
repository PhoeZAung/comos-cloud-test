import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,effectiveScores,mageCastingInt,previewBuild,spellCounts,raceTraits,compileBuild,registry} from '../src/features/characters/rules/build.mjs';
import {blackMageSummary} from '../src/features/characters/rules-summary.mjs';
import {spells} from '../src/features/characters/rules/spells.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';

const KINDRED='ffd20:race:kindred';
function character(kindred=true){
 const b=newBuild();Object.assign(b,{name:'Kindred mage test',raceId:kindred?KINDRED:'ffd20:race:hume',classId:'ffd20:class:black-mage',
  baseScores:{str:10,dex:10,con:10,int:16,wis:10,cha:10},reviewed:true});
 if(kindred)b.racialChoices[KINDRED+':pool:languages-selection']=[KINDRED+':pool:languages-selection:option:abyssal'];
 return b;
}
function selectedSpells(b){
 const can=spells.filter(s=>s.level===0).slice(0,spellCounts(b).cantrips);
 const leveled=spells.filter(s=>s.level===1).slice(0,spellCounts(b).leveled);
 b.spellIds=[...can,...leveled].map(s=>s.id);
 b.spellSelections={cantrips:can.map(s=>s.id),leveled:leveled.map(s=>s.id)};
}
test('Fiendish Magery increases only effective Black Mage spell INT and MP, never displayed INT or skill points',()=>{
 const normal=character(true),kindred=character(true);normal.disabledTraits=[KINDRED+':trait:fiendish-magery'];
 for(const b of [normal,kindred]){b.hpRolls=[4];}
 assert.equal(effectiveScores(kindred).int,18); // separate source-defined racial INT score adjustment
 assert.equal(mageCastingInt(kindred),20);
 assert.equal(mageCastingInt(normal),18);
 assert.equal(previewBuild(kindred).scores.int,18);
 assert.equal(previewBuild(kindred).summary.bonusMp,blackMageSummary(1,20).bonusMp);
 assert.equal(previewBuild(normal).summary.bonusMp,blackMageSummary(1,18).bonusMp);
 assert.equal(previewBuild(kindred).skillBudget,previewBuild(normal).skillBudget);
 assert.equal(spellCounts(kindred).leveled,spellCounts(normal).leveled+1);
 const removed={...kindred,disabledTraits:[KINDRED+':trait:fiendish-magery']};
 assert.equal(mageCastingInt(removed),18);
 for(const slug of ['maw-or-claw','smite-good']){
  const b={...kindred,alternateIds:[KINDRED+':trait:'+slug]};
  assert(!raceTraits(b).traits.some(f=>f.id===KINDRED+':trait:fiendish-magery'));
  assert.equal(mageCastingInt(b),18);
 }
 const nonMage={...kindred,classId:'ffd20:class:warrior'};
 assert.equal(mageCastingInt(nonMage),18);
});
test('Black Mage selected spells carry the source-scoped DC bonus while sheet INT remains unchanged',()=>{
 const b=character(true);b.hpRolls=[4];b.skillRanks=fixedSkills.map(()=>0);
 b.choices={'ffd20:class:black-mage:event:black-magery-1':['ffd20:class:black-mage:option:black-magery:elemental-mastery']};
 let budget=previewBuild(b).skillBudget;
 for(let i=0;i<fixedSkills.length&&budget>0;i++,budget--)b.skillRanks[i]=1;
 selectedSpells(b);
 const compiled=compileBuild(b);
 assert.equal(Number(compiled.int),18);
 assert.equal(compiled.mp_bonus,blackMageSummary(1,20).bonusMp);
 const spell=compiled.spells.find(s=>s.sourceClass==='Black Mage'&&s.lvl>0);
 assert(spell);assert.equal(spell.rulesDcBonus,1);
 assert.equal(compiled.spells.find(s=>s.sourceClass==='Black Mage'&&s.lvl===0).rulesDcBonus,1,'Fiendish casting INT also applies to cantrip DC');
 const reopened=compileBuild(compiled.rulesBuild.input,compiled);
 assert.equal(reopened.spells.find(s=>s.sourceRuleId===spell.sourceRuleId).rulesDcBonus,1);
 assert.equal(reopened.spells.find(s=>s.sourceRuleId===spell.sourceRuleId).dc_misc,1);
 assert.equal(reopened.rulesBuild.input.initialIntMod,5);
});
