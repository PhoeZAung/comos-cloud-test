import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,choiceEvents,eligibleOptions,calculated,classFor,spellCounts,spellsForBuild,hasSpellcasting} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {DRACOBALTIAN_ID,DRACOBALTIAN_LANGUAGES} from '../src/features/characters/rules/racial-progress.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {addRuleAbility} from '../src/features/characters/rules/ability-library.mjs';
function fixture(cls='dancer'){
 const b=newBuild();Object.assign(b,{alignment:'Lawful Good',name:'Dracobaltian '+cls,raceId:DRACOBALTIAN_ID,classId:'ffd20:class:'+cls,hpRolls:[],reviewed:true});b.baseScores.int=14;b.baseScores.cha=14;b.hpRolls=[classHitDie(b)];
 for(const e of choiceEvents(b))b.choices[e.id]=eligibleOptions(b,e).slice(0,calculated(e.count,b)).map(o=>o.id);
 if(hasSpellcasting(classFor(b))){const count=spellCounts(b),spells=spellsForBuild(b);b.spellIds=[...spells.filter(s=>s.level===0).slice(0,count.cantrips),...spells.filter(s=>s.level===1).slice(0,count.leveled)].map(s=>s.id);}
 b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);return b;
}
test('Dracobaltian standard traits map across nine class adapters and preserve natural blindness and manual detection limits',()=>{
 for(const cls of ['black-mage','archer','chocobo-knight','dancer','dragoon','knight','monk','bard','beastmaster']){
  const d=compileBuild(fixture(cls));assert.deepEqual([d.str,d.dex,d.int,d.wis],[12,10,12,12]);assert.equal(d.size_category,'Medium');assert.equal(d.speed,40);assert.deepEqual(d.racialIdentity.subtypes,['reptilian']);assert.equal(d.languages,'Common, Draconese');
  assert.match(d.senses,/Naturally blind/);assert.match(d.senses,/30 feet/);assert.match(d.senses,/Perception checks still required/);assert.match(d.senses,/Scent/);assert.doesNotMatch(d.senses,/darkvision|low-light/i);
  assert.equal(d.skills.find(s=>s.name==='Perception').rulesBonus,2);assert.equal(d.skills.find(s=>s.name==='Diplomacy').rulesBonus,0);
  assert.equal(d.ac_natural,1);assert.equal(sheetStats(d).ac,11);assert.equal(sheetStats(d).touch,10);assert.equal(d.cmd_temp,undefined);assert.equal(d.weapons.length,0);
  for(const slug of ['lesser-blindsight','scent','claws','unsocialable'])assert(d.racialAbilities.some(f=>f.sourceRuleId===DRACOBALTIAN_ID+':trait:'+slug));
 }
});
test('Dracobaltian leathery hide contributes one owned natural armor point and preserves manual AC',()=>{
 const b=fixture(),d=compileBuild(b);d.ac_natural+=4;d.hp_curr=1;
 const twice=compileBuild(d.rulesBuild.input,d);assert.equal(twice.ac_natural,5);assert.equal(twice.hp_curr,1);
 const off={...b,disabledTraits:[DRACOBALTIAN_ID+':trait:leathery-skinned']},removed=compileBuild(off,twice);assert.equal(removed.ac_natural,4);assert.equal(compileBuild(off,removed).ac_natural,4);assert.equal(compileBuild(b,removed).ac_natural,5);
});
test('Dracobaltian source language choices remain optional, bounded after its Intelligence penalty and reject unsupported alternates',()=>{
 const b=fixture();b.racialChoices[DRACOBALTIAN_LANGUAGES]=[DRACOBALTIAN_LANGUAGES+':option:ignan'];const d=compileBuild(b);assert.equal(d.languages,'Common, Draconese, Ignan');assert.equal(compileBuild(d.rulesBuild.input,d).languages,d.languages);
 for(const change of [b=>b.baseScores.int=12,b=>b.racialChoices[DRACOBALTIAN_LANGUAGES].push(DRACOBALTIAN_LANGUAGES+':option:terran'),b=>b.racialChoices[DRACOBALTIAN_LANGUAGES]=[DRACOBALTIAN_LANGUAGES+':option:celestial'],]){const bad=structuredClone(b);change(bad);assert.throws(()=>compileBuild(bad));}
});
