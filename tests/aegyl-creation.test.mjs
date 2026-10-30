import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,choiceEvents,eligibleOptions,calculated,classFor,spellCounts,spellsForBuild,hasSpellcasting} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {AEGYL_ID,AEGYL_LANGUAGES} from '../src/features/characters/rules/racial-progress.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {addRuleAbility} from '../src/features/characters/rules/ability-library.mjs';
function fixture(cls='dancer'){
 const b=newBuild();Object.assign(b,{name:'Aegyl '+cls,raceId:AEGYL_ID,classId:'ffd20:class:'+cls,hpRolls:[],reviewed:true});b.baseScores.int=12;b.baseScores.cha=14;b.hpRolls=[classHitDie(b)];
 for(const e of choiceEvents(b))b.choices[e.id]=eligibleOptions(b,e).slice(0,calculated(e.count,b)).map(o=>o.id);
 if(hasSpellcasting(classFor(b))){const count=spellCounts(b),spells=spellsForBuild(b);b.spellIds=[...spells.filter(s=>s.level===0).slice(0,count.cantrips),...spells.filter(s=>s.level===1).slice(0,count.leveled)].map(s=>s.id);}
 b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);return b;
}
const hope=d=>d.racialAbilities.find(f=>f.sourceRuleId===AEGYL_ID+':trait:eternal-hope');
test('Aegyl standard traits map across seven class adapters without flattening conditional flight, defenses or Diplomacy',()=>{
 for(const cls of ['black-mage','archer','chocobo-knight','dancer','dragoon','bard','beastmaster']){
  const d=compileBuild(fixture(cls));assert.deepEqual([d.con,d.dex,d.wis,d.cha],[10,12,12,12]);
  assert.equal(d.speed,30);assert.equal(d.size_category,'Medium');assert.equal(d.languages,'Common, Aegyllan');assert.match(d.senses,/Twice normal/);
  assert.equal(d.skills.find(s=>s.name==='Perception').rulesBonus,2);
  assert.equal(d.skills.find(s=>s.name==='Diplomacy').rulesBonus,0);
  assert.equal(d.init_temp,undefined);assert.equal(d.fort_temp,undefined);assert.equal(d.ref_temp,undefined);assert.equal(d.will_temp,undefined);
  const wings=d.racialAbilities.find(f=>f.sourceRuleId===AEGYL_ID+':trait:base-speed');assert.match(wings.desc,/40.*poor/);assert.match(wings.desc,/12-foot/);
  assert.equal(hope(d).u_max,1);assert.equal(hope(d).restoreOnLongRest,false);
 }
});
test('Aegyl Eternal Hope spent state survives save/rest and the inactive trait supplies no counter',()=>{
 const b=fixture(),d=compileBuild(b);hope(d).u_curr=0;d.hp_curr=1;
 const twice=compileBuild(d.rulesBuild.input,d);assert.equal(hope(twice).u_curr,0);assert.equal(twice.hp_curr,1);
 const rested=mergeSheetData(twice,{action:'rest'});assert.equal(hope(rested).u_curr,0);
 const removed=compileBuild({...b,disabledTraits:[AEGYL_ID+':trait:eternal-hope']},twice);assert.equal(hope(removed),undefined);
 const deleted=structuredClone(d);deleted.racialAbilities=deleted.racialAbilities.filter(f=>f.sourceRuleId!==hope(d).sourceRuleId);
 assert.equal(addRuleAbility(deleted,hope(d).sourceRuleId).u_max,1);
});
test('Aegyl bonus languages stay within source options and reject unsupported alternatives',()=>{
 const b=fixture();b.racialChoices[AEGYL_LANGUAGES]=[AEGYL_LANGUAGES+':option:draconic'];const d=compileBuild(b);
 assert.equal(d.languages,'Common, Aegyllan, Draconic');assert.equal(compileBuild(d.rulesBuild.input,d).languages,d.languages);
 for(const change of [b=>b.racialChoices[AEGYL_LANGUAGES].push(AEGYL_LANGUAGES+':option:orc'),b=>b.racialChoices[AEGYL_LANGUAGES]=[AEGYL_LANGUAGES+':option:celestial'],b=>b.alternateIds=[AEGYL_ID+':trait:wing-clipped']]){
  const bad=structuredClone(b);change(bad);assert.throws(()=>compileBuild(bad));
 }
});
