import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,choiceEvents,eligibleOptions,calculated,classFor,spellCounts,spellsForBuild,hasSpellcasting} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {MITHRA_ID,MITHRA_LANGUAGES} from '../src/features/characters/rules/racial-progress.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {addRuleAbility} from '../src/features/characters/rules/ability-library.mjs';
function fixture(cls='dancer'){
 const b=newBuild();Object.assign(b,{name:'Mithra '+cls,raceId:MITHRA_ID,classId:'ffd20:class:'+cls,hpRolls:[],reviewed:true});b.baseScores.int=12;b.hpRolls=[classHitDie(b)];
 for(const e of choiceEvents(b))b.choices[e.id]=eligibleOptions(b,e).slice(0,calculated(e.count,b)).map(o=>o.id);
 if(hasSpellcasting(classFor(b))){const count=spellCounts(b),spells=spellsForBuild(b);b.spellIds=[...spells.filter(s=>s.level===0).slice(0,count.cantrips),...spells.filter(s=>s.level===1).slice(0,count.leveled)].map(s=>s.id);}
 b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);return b;
}
const luck=d=>d.racialAbilities.find(f=>f.sourceRuleId===MITHRA_ID+':trait:cat-s-luck');
test('Mithra standards map identically across seven compilers without unconditional conditional defenses or speed',()=>{
 for(const cls of ['black-mage','archer','chocobo-knight','dancer','dragoon','bard','beastmaster']){
  const d=compileBuild(fixture(cls));assert.deepEqual([d.str,d.dex,d.wis,d.cha],[10,12,8,12]);
  assert.equal(d.speed,30);assert.equal(d.size_category,'Medium');assert.equal(d.languages,'Common, Mithran');assert.match(d.senses,/2x/);
  for(const name of ['Perception','Stealth','Survival'])assert.equal(d.skills.find(s=>s.name===name).rulesBonus,cls==='beastmaster'&&name==='Survival'?4:2);
  assert.equal(d.init_temp,2);assert.equal(sheetStats(d).initiative,3);
  assert(d.feats.some(f=>f.name==='Run'&&f.automation==='manual'&&!f.pendingFeat));
  assert.equal(luck(d).u_max,1);assert.equal(luck(d).restoreOnLongRest,false);
  assert.equal(d.ac_dodge,undefined);assert.equal(d.cmd_temp,undefined);
 }
});
test('Mithra edit/remove cycle preserves manual initiative and spent luck while removing only the owned Fleet-Footed bonus',()=>{
 const b=fixture(),d=compileBuild(b);d.init_temp+=3;luck(d).u_curr=0;d.hp_curr=1;
 const twice=compileBuild(d.rulesBuild.input,d);assert.equal(twice.init_temp,5);assert.equal(luck(twice).u_curr,0);assert.equal(twice.hp_curr,1);
 const off={...b,disabledTraits:[MITHRA_ID+':trait:fleet-footed']},removed=compileBuild(off,twice);
 assert.equal(removed.init_temp,3);assert(!removed.feats.some(f=>f.sourceRace==='Mithra'));
 assert.equal(compileBuild(off,removed).init_temp,3);
 const restored=compileBuild(b,removed);assert.equal(restored.init_temp,5);assert.equal(restored.feats.filter(f=>f.sourceRace==='Mithra').length,1);
 const rest=mergeSheetData(twice,{action:'rest'});assert.equal(luck(rest).u_curr,0);
 const deleted=structuredClone(d);deleted.racialAbilities=deleted.racialAbilities.filter(f=>f.sourceRuleId!==luck(d).sourceRuleId);
 assert.equal(addRuleAbility(deleted,luck(d).sourceRuleId).u_max,1);
});
test('Mithra optional languages are source-bounded, persist and reject variants, alternates and excess choices',()=>{
 const b=fixture();b.racialChoices[MITHRA_LANGUAGES]=[MITHRA_LANGUAGES+':option:lupin'];const d=compileBuild(b);
 assert.equal(d.languages,'Common, Mithran, Lupin');assert.equal(compileBuild(d.rulesBuild.input,d).languages,d.languages);
 for(const change of [b=>b.racialChoices[MITHRA_LANGUAGES].push(MITHRA_LANGUAGES+':option:orc'),b=>b.racialChoices[MITHRA_LANGUAGES]=[MITHRA_LANGUAGES+':option:celestial'],b=>b.heritageId=MITHRA_ID+':heritage:keepers-of-the-moon',b=>b.alternateIds=[MITHRA_ID+':trait:climber']]){
  const bad=structuredClone(b);change(bad);assert.throws(()=>compileBuild(bad));
 }
});
