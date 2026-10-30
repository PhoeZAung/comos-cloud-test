import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,choiceEvents,eligibleOptions,calculated,classFor,spellCounts,spellsForBuild,hasSpellcasting} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {AL_BHED_ID,AL_BHED_LANGUAGES,AL_BHED_GENIUS} from '../src/features/characters/rules/racial-progress.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {skillBudget} from '../src/features/sheet/skill-budget.mjs';
function fixture(cls='dancer',selected=4){
 const b=newBuild();Object.assign(b,{alignment:'Lawful Good',name:'Al Bhed '+cls,raceId:AL_BHED_ID,classId:'ffd20:class:'+cls,hpRolls:[],reviewed:true});b.baseScores.cha=14;b.hpRolls=[classHitDie(b)];
 b.racialChoices[AL_BHED_GENIUS]=['skill-row:'+selected];if([4,5,6].includes(selected))b.racialSpecialties[AL_BHED_GENIUS]='Woodworking';
 for(const e of choiceEvents(b))b.choices[e.id]=eligibleOptions(b,e).slice(0,calculated(e.count,b)).map(o=>o.id);
 if(hasSpellcasting(classFor(b))){const count=spellCounts(b),spells=spellsForBuild(b);b.spellIds=[...spells.filter(s=>s.level===0).slice(0,count.cantrips),...spells.filter(s=>s.level===1).slice(0,count.leveled)].map(s=>s.id);}
 b.skillRanks=fixedSkills.map(()=>0);b.skillRanks[selected]=1;let remaining=previewBuild(b).skillBudget-1;for(let i=0;remaining>0;i++)if(i!==selected){b.skillRanks[i]=1;remaining--;}
 return b;
}
test('Al Bhed standard first-level builds map identity, class skills, selected rank and manual feat through eight adapters',()=>{
 for(const cls of ['black-mage','archer','chocobo-knight','dancer','dragoon','knight','bard','beastmaster']){
  const b=fixture(cls),d=compileBuild(b);assert.deepEqual([d.dex,d.int,d.cha],[12,12,12]);assert.equal(d.speed,30);assert.equal(d.size_category,'Medium');assert.equal(d.languages,'Common, Albhedian');assert.match(d.proficiencies,/Simple firearms/);
  for(const name of ['Repair','Drive','Pilot','Craft','Disable Device','Knw: Engineering','Use Magic Device'])assert.equal(d.skills.find(s=>s.name===name).cs,true,name+' '+cls);
  assert.equal(d.skills[4].rulesBonus,2);assert.equal(d.skills[4].subName,'Woodworking');assert.equal(d.skills[4].lvl,1);assert.equal(d.skills[5].rulesBonus,0);
  assert(d.feats.some(f=>f.name==='Technologist'&&f.automation==='manual'&&!f.pendingFeat));
  assert.equal(skillBudget(d).racialSkill,1);assert.equal(skillBudget(d).totalBudget,previewBuild(b).skillBudget);assert.equal(skillBudget(d).unused,0);
  assert.equal(d.fort_temp,undefined);assert.equal(d.ref_temp,undefined);assert.equal(d.will_temp,undefined);
 }
});
test('Mechanical Genius supports exactly its printed skills, requires the selected rank and names only the chosen specialty row',()=>{
 for(const index of [4,5,6,8,18,34,35,36,45]){
  const b=fixture('dancer',index),d=compileBuild(b);assert.equal(d.skills[index].rulesBonus,2);assert.equal(d.skills[index].cs,true);
  if([34,35,36].includes(index))assert.equal(d.skills[index].subName,'Engineering');
  const bad=structuredClone(b);bad.skillRanks[index]=0;bad.skillRanks[10]=1;assert.throws(()=>compileBuild(bad),/Mechanical Genius/);
 }
 for(const change of [b=>b.racialChoices[AL_BHED_GENIUS]=[],b=>b.racialChoices[AL_BHED_GENIUS]=['skill-row:16'],b=>delete b.racialSpecialties[AL_BHED_GENIUS]]){const b=fixture();change(b);assert.throws(()=>compileBuild(b));}
});
test('Al Bhed editing preserves manual rows, bonus feat notes and source-bounded languages; unsupported progression stays guarded',()=>{
 const b=fixture();b.racialChoices[AL_BHED_LANGUAGES]=[AL_BHED_LANGUAGES+':option:pupon'];const d=compileBuild(b);d.skills[4].temp+=5;d.hp_curr=1;d.feats.find(f=>f.name==='Technologist').desc='My manually recorded feat notes';
 const twice=compileBuild(d.rulesBuild.input,d);assert.equal(twice.skills[4].temp,7);assert.equal(twice.skills[4].subName,'Woodworking');assert.equal(twice.hp_curr,1);assert.equal(twice.languages,'Common, Albhedian, PuPon');assert.equal(twice.feats.find(f=>f.name==='Technologist').desc,'My manually recorded feat notes');
 for(const change of [b=>b.level=2,b=>b.alternateIds=[AL_BHED_ID+':trait:academician'],b=>b.racialChoices[AL_BHED_LANGUAGES].push(AL_BHED_LANGUAGES+':option:goblin'),b=>b.racialChoices[AL_BHED_LANGUAGES]=[AL_BHED_LANGUAGES+':option:draconic']]){const bad=structuredClone(b);change(bad);assert.throws(()=>compileBuild(bad));}
 const off=structuredClone(b);off.disabledTraits=[AL_BHED_ID+':trait:mechanical-genius'];delete off.racialChoices[AL_BHED_GENIUS];delete off.racialSpecialties[AL_BHED_GENIUS];off.skillRanks[4]=0;
 const removed=compileBuild(off,twice,{allowRankReduction:true});assert.equal(removed.skills[4].temp,5);assert.equal(skillBudget(removed).racialSkill,0);
});
