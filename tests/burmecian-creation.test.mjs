import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,choiceEvents,eligibleOptions,calculated,classFor,spellCounts,spellsForBuild,hasSpellcasting} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {BURMECIAN_ID,BURMECIAN_LANGUAGES} from '../src/features/characters/rules/racial-progress.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {addRuleAbility} from '../src/features/characters/rules/ability-library.mjs';
function fixture(cls='dancer'){
 const b=newBuild();Object.assign(b,{alignment:'Lawful Good',name:'Burmecian '+cls,raceId:BURMECIAN_ID,classId:'ffd20:class:'+cls,hpRolls:[],reviewed:true});b.baseScores.int=10;b.baseScores.cha=14;b.hpRolls=[classHitDie(b)];
 for(const e of choiceEvents(b))b.choices[e.id]=eligibleOptions(b,e).slice(0,calculated(e.count,b)).map(o=>o.id);
 if(hasSpellcasting(classFor(b))){const count=spellCounts(b),spells=spellsForBuild(b);b.spellIds=[...spells.filter(s=>s.level===0).slice(0,count.cantrips),...spells.filter(s=>s.level===1).slice(0,count.leveled)].map(s=>s.id);}
 b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);return b;
}
test('Burmecian standards map across eight adapters without a global jump, fear-save or feat-derived initiative bonus',()=>{
 for(const cls of ['black-mage','archer','chocobo-knight','dancer','dragoon','knight','bard','beastmaster']){
  const d=compileBuild(fixture(cls));assert.deepEqual([d.dex,d.int,d.cha],[12,12,12]);assert.equal(d.speed,30);assert.equal(d.size_category,'Medium');assert.equal(d.languages,'Common, Burmecian');assert.match(d.senses,/Darkvision.*60/);
  assert.equal(d.skills.find(s=>s.name==='Perception').rulesBonus,2);assert.equal(d.skills.find(s=>s.name==='Acrobatics').rulesBonus,0);
  assert.equal(d.cmd_temp,1);const without=compileBuild({...fixture(cls),disabledTraits:[BURMECIAN_ID+':trait:battle-hardened']});assert.equal(sheetStats(d).cmd-sheetStats(without).cmd,1);assert.equal(d.init_temp,undefined);assert.equal(d.ac_natural,undefined);assert.equal(d.will_temp,undefined);
  assert(d.feats.some(f=>f.name==='Improved Initiative'&&f.automation==='manual'));assert.equal(d.weapons.length,0);
  assert(d.racialAbilities.some(f=>f.sourceRuleId===BURMECIAN_ID+':trait:claws'&&/1d4/.test(f.desc)));
 }
});
test('Burmecian Battle-Hardened owns only its CMD contribution and manual initiative/feat notes survive edits',()=>{
 const b=fixture(),d=compileBuild(b);d.cmd_temp+=4;d.init_temp=4;d.hp_curr=1;d.feats.find(f=>f.sourceRace==='Burmecian').desc='My initiative feat notes';
 const twice=compileBuild(d.rulesBuild.input,d);assert.equal(twice.cmd_temp,5);assert.equal(twice.init_temp,4);assert.equal(twice.hp_curr,1);assert.equal(twice.feats.find(f=>f.sourceRace==='Burmecian').desc,'My initiative feat notes');
 const off={...b,disabledTraits:[BURMECIAN_ID+':trait:battle-hardened',BURMECIAN_ID+':trait:quick-reactions']},removed=compileBuild(off,twice);assert.equal(removed.cmd_temp,4);assert.equal(removed.init_temp,4);assert(!removed.feats.some(f=>f.sourceRace==='Burmecian'));
 const again=compileBuild(b,removed);assert.equal(again.cmd_temp,5);assert.equal(again.init_temp,4);assert.equal(again.feats.filter(f=>f.sourceRace==='Burmecian').length,1);
});
test('Burmecian optional languages persist and unreviewed Cleyran/alternate mechanics stay guarded',()=>{
 const b=fixture();b.racialChoices[BURMECIAN_LANGUAGES]=[BURMECIAN_LANGUAGES+':option:draconic'];const d=compileBuild(b);assert.equal(d.languages,'Common, Burmecian, Draconic');assert.equal(compileBuild(d.rulesBuild.input,d).languages,d.languages);
 for(const change of [b=>b.racialChoices[BURMECIAN_LANGUAGES].push(BURMECIAN_LANGUAGES+':option:orc'),b=>b.racialChoices[BURMECIAN_LANGUAGES]=[BURMECIAN_LANGUAGES+':option:kojin'],b=>b.heritageId=BURMECIAN_ID+':heritage:cleyran',b=>b.alternateIds=[BURMECIAN_ID+':trait:jumper']]){const bad=structuredClone(b);change(bad);assert.throws(()=>compileBuild(bad));}
});
