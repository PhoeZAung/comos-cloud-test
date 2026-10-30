import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,choiceEvents,eligibleOptions,calculated,classFor,spellCounts,spellsForBuild,hasSpellcasting} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {BANGAA_ID,BANGAA_LANGUAGES} from '../src/features/characters/rules/racial-progress.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {addRuleAbility} from '../src/features/characters/rules/ability-library.mjs';
function fixture(cls='dancer'){
 const b=newBuild();Object.assign(b,{alignment:'Lawful Good',name:'Bangaa '+cls,raceId:BANGAA_ID,classId:'ffd20:class:'+cls,hpRolls:[],reviewed:true});b.baseScores.int=14;b.baseScores.cha=14;b.hpRolls=[classHitDie(b)];
 for(const e of choiceEvents(b))b.choices[e.id]=eligibleOptions(b,e).slice(0,calculated(e.count,b)).map(o=>o.id);
 if(hasSpellcasting(classFor(b))){const count=spellCounts(b),spells=spellsForBuild(b);b.spellIds=[...spells.filter(s=>s.level===0).slice(0,count.cantrips),...spells.filter(s=>s.level===1).slice(0,count.leveled)].map(s=>s.id);}
 b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);return b;
}
test('Bangaa maps its printed scores and reptilian subtype across nine class adapters without inventing strength or unconditional stability',()=>{
 for(const cls of ['black-mage','archer','chocobo-knight','dancer','dragoon','knight','monk','bard','beastmaster']){
  const d=compileBuild(fixture(cls));assert.deepEqual([d.str,d.dex,d.int,d.wis,d.cha],[10,12,12,12,14]);assert.equal(d.speed,30);assert.equal(d.size_category,'Medium');assert.deepEqual(d.racialIdentity.subtypes,['reptilian']);assert.equal(d.languages,'Common, Banganese');assert(d.senses);
  for(const name of ['Perception','Acrobatics'])assert.equal(d.skills.find(s=>s.name===name).rulesBonus,2);
  assert.equal(d.ac_natural,1);assert.equal(sheetStats(d).ac,12);assert.equal(sheetStats(d).touch,11);assert.equal(d.cmd_temp,undefined);assert.equal(d.fort_temp,undefined);
  assert.equal(d.weapons.length,0);assert(d.racialAbilities.some(f=>f.sourceRuleId===BANGAA_ID+':trait:bite'&&/1d3/.test(f.desc)));
  assert(!d.feats.some(f=>f.sourceRuleId?.startsWith(BANGAA_ID)));
 }
});
test('Bangaa Thick-skinned owns exactly one natural armor point and preserves manual AC adjustments across edit/remove cycles',()=>{
 const b=fixture(),d=compileBuild(b);d.ac_natural+=4;d.hp_curr=1;
 const twice=compileBuild(d.rulesBuild.input,d);assert.equal(twice.ac_natural,5);assert.equal(twice.hp_curr,1);
 const off={...b,disabledTraits:[BANGAA_ID+':trait:thick-skinned']},removed=compileBuild(off,twice);assert.equal(removed.ac_natural,4);assert.equal(compileBuild(off,removed).ac_natural,4);assert.equal(compileBuild(b,removed).ac_natural,5);
});
test('Bangaa bonus languages use the post-penalty Intelligence modifier and reject unreviewed heritages and alternates',()=>{
 const b=fixture();b.racialChoices[BANGAA_LANGUAGES]=[BANGAA_LANGUAGES+':option:ignan'];const d=compileBuild(b);assert.equal(d.languages,'Common, Banganese, Ignan');assert.equal(compileBuild(d.rulesBuild.input,d).languages,d.languages);
 for(const change of [b=>b.racialChoices[BANGAA_LANGUAGES].push(BANGAA_LANGUAGES+':option:terran'),b=>b.baseScores.int=12,b=>b.racialChoices[BANGAA_LANGUAGES]=[BANGAA_LANGUAGES+':option:celestial'],b=>b.heritageId=BANGAA_ID+':heritage:bista',b=>b.alternateIds=[BANGAA_ID+':trait:claws']]){const bad=structuredClone(b);change(bad);assert.throws(()=>compileBuild(bad));}
});
