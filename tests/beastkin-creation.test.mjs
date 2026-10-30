import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,choiceEvents,eligibleOptions,calculated,classFor,spellCounts,spellsForBuild,hasSpellcasting} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {BEASTKIN_ID,BEASTKIN_LANGUAGES} from '../src/features/characters/rules/racial-progress.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {addRuleAbility} from '../src/features/characters/rules/ability-library.mjs';
function fixture(cls='dancer'){
 const b=newBuild();Object.assign(b,{alignment:'Lawful Good',name:'Beastkin '+cls,raceId:BEASTKIN_ID,classId:'ffd20:class:'+cls,hpRolls:[],reviewed:true});b.baseScores.int=14;b.baseScores.cha=12;b.hpRolls=[classHitDie(b)];
 for(const e of choiceEvents(b))b.choices[e.id]=eligibleOptions(b,e).slice(0,calculated(e.count,b)).map(o=>o.id);
 if(hasSpellcasting(classFor(b))){const count=spellCounts(b),spells=spellsForBuild(b);b.spellIds=[...spells.filter(s=>s.level===0).slice(0,count.cantrips),...spells.filter(s=>s.level===1).slice(0,count.leveled)].map(s=>s.id);}
 b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);return b;
}
test('Beastkin standard traits work across nine class adapters without global Sprinter, immunity or save modifiers',()=>{
 for(const cls of ['black-mage','archer','chocobo-knight','dancer','dragoon','knight','monk','bard','beastmaster']){
  const d=compileBuild(fixture(cls));assert.deepEqual([d.str,d.dex,d.int,d.wis],[12,10,12,12]);assert.equal(d.speed,30);assert.equal(d.size_category,'Medium');assert.equal(d.languages,'Common, Beastmen');assert.match(d.senses,/Darkvision 60 feet/);assert.match(d.senses,/2x/);
  assert.equal(d.skills.find(s=>s.name==='Perception').rulesBonus,2);for(const name of ['Stealth','Survival'])assert.equal(d.skills.find(s=>s.name===name).cs,true);
  assert.equal(d.init_temp,2);assert.equal(d.ac_natural,1);assert.equal(sheetStats(d).ac,11);assert.equal(sheetStats(d).touch,10);
  assert(d.feats.some(f=>f.name==='Run'&&f.sourceRace==='Beastkin'&&f.automation==='manual'));
  assert.equal(d.fort_temp,undefined);assert.equal(d.ref_temp,undefined);assert.equal(d.will_temp,undefined);
  assert(d.racialAbilities.some(f=>f.sourceRuleId===BEASTKIN_ID+':trait:beastkin-immunities'));
 }
});
test('Beastkin owns its initiative/natural armor and Run card while preserving manual adjustments and notes',()=>{
 const b=fixture(),d=compileBuild(b);d.init_temp+=3;d.ac_natural+=4;d.hp_curr=1;d.feats.find(f=>f.sourceRace==='Beastkin').desc='My Run note';
 const twice=compileBuild(d.rulesBuild.input,d);assert.equal(twice.init_temp,5);assert.equal(twice.ac_natural,5);assert.equal(twice.hp_curr,1);assert.equal(twice.feats.find(f=>f.sourceRace==='Beastkin').desc,'My Run note');
 const off={...b,disabledTraits:[BEASTKIN_ID+':trait:fleet-footed',BEASTKIN_ID+':trait:natural-armor']},removed=compileBuild(off,twice);assert.equal(removed.init_temp,3);assert.equal(removed.ac_natural,4);assert(!removed.feats.some(f=>f.sourceRace==='Beastkin'));
 const again=compileBuild(b,removed);assert.equal(again.init_temp,5);assert.equal(again.ac_natural,5);assert.equal(again.feats.filter(f=>f.sourceRace==='Beastkin').length,1);
});
test('Beastkin optional languages use Intelligence after its penalty and alternate traits stay guarded',()=>{
 const b=fixture();b.racialChoices[BEASTKIN_LANGUAGES]=[BEASTKIN_LANGUAGES+':option:draconic'];const d=compileBuild(b);assert.equal(d.languages,'Common, Beastmen, Draconic');assert.equal(compileBuild(d.rulesBuild.input,d).languages,d.languages);
 for(const change of [b=>b.baseScores.int=12,b=>b.racialChoices[BEASTKIN_LANGUAGES].push(BEASTKIN_LANGUAGES+':option:orc'),b=>b.racialChoices[BEASTKIN_LANGUAGES]=[BEASTKIN_LANGUAGES+':option:celestial'],b=>b.alternateIds=[BEASTKIN_ID+':trait:civilized']]){const bad=structuredClone(b);change(bad);assert.throws(()=>compileBuild(bad));}
});
