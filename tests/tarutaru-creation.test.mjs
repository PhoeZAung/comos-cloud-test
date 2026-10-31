import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,choiceEvents,eligibleOptions,calculated,classFor,spellCounts,spellsForBuild,hasSpellcasting} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {TARUTARU_ID,TARUTARU_LANGUAGES,TARUTARU_TALENTED} from '../src/features/characters/rules/racial-progress.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
function fixture(cls='dancer'){
 const b=newBuild();Object.assign(b,{alignment:'Lawful Good',name:'Tarutaru '+cls,raceId:TARUTARU_ID,classId:'ffd20:class:'+cls,reviewed:true,racialChoices:{[TARUTARU_TALENTED]:['skill-row:4']},racialSpecialties:{[TARUTARU_TALENTED]:'Woodworking'}});b.baseScores.cha=12;b.hpRolls=[classHitDie(b)];
 for(const e of choiceEvents(b))b.choices[e.id]=eligibleOptions(b,e).slice(0,calculated(e.count,b)).map(o=>o.id);
 if(hasSpellcasting(classFor(b))){const count=spellCounts(b),spells=spellsForBuild(b);b.spellIds=[...spells.filter(s=>s.level===0).slice(0,count.cantrips),...spells.filter(s=>s.level===1).slice(0,count.leveled)].map(s=>s.id);}
 b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);return b;
}
test('Tarutaru standard traits and selected specialty work across nine compilers without global magic or save bonuses',()=>{
 for(const cls of ['black-mage','archer','chocobo-knight','dancer','dragoon','knight','monk','bard','beastmaster']){
  const b=fixture(cls),d=compileBuild(b),s=sheetStats(d);
  assert.deepEqual([d.str,d.dex,d.int],[8,12,12]);assert.equal(d.size_category,'Small');assert.equal(d.speed,20);assert.equal(d.languages,'Common, Lalafellan');
  assert.equal(s.ac,12);assert.equal(s.cmd,9);assert.equal(d.skills.find(r=>r.name==='Stealth').rulesBonus,4);
  for(const name of ['Knw: Arcana','Spellcraft'])assert.equal(d.skills.find(r=>r.name===name).rulesBonus,2);
  assert.equal(d.skills[4].rulesBonus,2);assert.equal(d.skills[4].subName,'Woodworking');assert.equal(d.skills[5].rulesBonus,0);
  assert.equal(d.spells.length,b.spellIds.length,'racial Detect Magic is a manual card, not a learned spell slot');
  assert.equal(d.will_temp,undefined);assert.equal(d.fort_temp,undefined);assert.equal(d.ac_dodge,undefined);
  assert(d.racialAbilities.some(f=>f.name==='Spell-Like Ability'));
  if(!hasSpellcasting(classFor(b)))assert.equal(d.mp_class,0);
 }
});
test('Tarutaru specialty/language choices are required, source-bounded and stable across edit/reopen',()=>{
 const b=fixture();b.racialChoices[TARUTARU_LANGUAGES]=[TARUTARU_LANGUAGES+':option:draconic'];const d=compileBuild(b);
 assert.equal(d.languages,'Common, Lalafellan, Draconic');d.skills[4].temp+=3;d.hp_curr=1;
 const next=compileBuild(d.rulesBuild.input,d);assert.equal(next.skills[4].temp,5);assert.equal(next.skills[4].subName,'Woodworking');assert.equal(next.hp_curr,1);assert.equal(next.languages,d.languages);
 for(const change of [b=>b.racialChoices={},b=>b.racialSpecialties={},b=>b.racialChoices[TARUTARU_TALENTED]=['skill-row:0'],b=>b.racialChoices[TARUTARU_LANGUAGES].push(TARUTARU_LANGUAGES+':option:orc'),b=>b.racialChoices[TARUTARU_LANGUAGES]=[TARUTARU_LANGUAGES+':option:celestial'],b=>b.heritageId=TARUTARU_ID+':heritage:gnome',]){
  const bad=structuredClone(b);change(bad);assert.throws(()=>compileBuild(bad));
 }
});
