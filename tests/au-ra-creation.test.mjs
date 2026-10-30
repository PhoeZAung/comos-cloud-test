import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,choiceEvents,eligibleOptions,calculated,classFor,spellCounts,spellsForBuild,hasSpellcasting} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {AU_RA_ID,AU_RA_LANGUAGES} from '../src/features/characters/rules/racial-progress.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {addRuleAbility} from '../src/features/characters/rules/ability-library.mjs';
function fixture(cls='dancer'){
 const b=newBuild();Object.assign(b,{alignment:'Lawful Good',name:'Au Ra '+cls,raceId:AU_RA_ID,classId:'ffd20:class:'+cls,hpRolls:[],reviewed:true});b.baseScores.int=12;b.baseScores.cha=14;b.hpRolls=[classHitDie(b)];
 for(const e of choiceEvents(b))b.choices[e.id]=eligibleOptions(b,e).slice(0,calculated(e.count,b)).map(o=>o.id);
 if(hasSpellcasting(classFor(b))){const count=spellCounts(b),spells=spellsForBuild(b);b.spellIds=[...spells.filter(s=>s.level===0).slice(0,count.cantrips),...spells.filter(s=>s.level===1).slice(0,count.leveled)].map(s=>s.id);}
 b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);return b;
}
const ferocity=d=>d.racialAbilities.find(f=>f.sourceRuleId===AU_RA_ID+':trait:ferocity');
test('Au Ra defaults to Xaela standards across eight adapters and leaves conditional defenses manual',()=>{
 for(const cls of ['black-mage','archer','chocobo-knight','dancer','dragoon','knight','bard','beastmaster']){
  const d=compileBuild(fixture(cls));assert.deepEqual([d.str,d.wis,d.cha],[12,12,12]);assert.equal(d.speed,30);assert.equal(d.size_category,'Medium');assert.equal(d.languages,'Common, Draconic');assert.match(d.senses,/Darkvision 60 feet/);
  assert.equal(d.skills.find(s=>s.name==='Intimidate').rulesBonus,2);assert.equal(d.skills.find(s=>s.name==='Survival').rulesBonus,cls==='beastmaster'?4:2);
  assert.equal(d.ac_natural,1);assert.equal(sheetStats(d).ac,11);assert.equal(sheetStats(d).touch,10);assert.equal(sheetStats(d).flat,11);
  assert.equal(d.fort_temp,undefined);assert.equal(d.ref_temp,undefined);assert.equal(d.will_temp,undefined);
  assert.equal(ferocity(d).u_max,1);assert.equal(ferocity(d).restoreOnLongRest,false);
 }
});
test('Au Ra natural armor contribution is idempotent, preserves manual adjustments and removes only its own bonus',()=>{
 const b=fixture(),d=compileBuild(b);d.ac_natural+=4;ferocity(d).u_curr=0;d.hp_curr=-1;
 const twice=compileBuild(d.rulesBuild.input,d);assert.equal(twice.ac_natural,5);assert.equal(ferocity(twice).u_curr,0);assert.equal(twice.hp_curr,-1);
 const off={...b,disabledTraits:[AU_RA_ID+':trait:scales']},removed=compileBuild(off,twice);assert.equal(removed.ac_natural,4);assert.equal(compileBuild(off,removed).ac_natural,4);assert.equal(compileBuild(b,removed).ac_natural,5);
 const rested=mergeSheetData(twice,{action:'rest'});assert.equal(ferocity(rested).u_curr,0);
 const deleted=structuredClone(d);deleted.racialAbilities=deleted.racialAbilities.filter(f=>f.sourceRuleId!==ferocity(d).sourceRuleId);assert.equal(addRuleAbility(deleted,ferocity(d).sourceRuleId).u_max,1);
 const noFerocity=compileBuild({...b,disabledTraits:[AU_RA_ID+':trait:ferocity']},twice);assert.equal(ferocity(noFerocity),undefined);
});
test('Au Ra source-bounded bonus languages persist while Raen and alternate traits remain guarded',()=>{
 const b=fixture();b.racialChoices[AU_RA_LANGUAGES]=[AU_RA_LANGUAGES+':option:kojin'];const d=compileBuild(b);assert.equal(d.languages,'Common, Draconic, Kojin');assert.equal(compileBuild(d.rulesBuild.input,d).languages,d.languages);
 for(const change of [b=>b.racialChoices[AU_RA_LANGUAGES].push(AU_RA_LANGUAGES+':option:orc'),b=>b.racialChoices[AU_RA_LANGUAGES]=[AU_RA_LANGUAGES+':option:celestial'],b=>b.heritageId=AU_RA_ID+':heritage:raen',b=>b.alternateIds=[AU_RA_ID+':trait:bull-headed']]){const bad=structuredClone(b);change(bad);assert.throws(()=>compileBuild(bad));}
});
