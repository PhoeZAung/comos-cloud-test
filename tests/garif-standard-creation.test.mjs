import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,choiceEvents,eligibleOptions,calculated,classFor,spellCounts,spellsForBuild,hasSpellcasting} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {GARIF_ID,GARIF_LANGUAGES,GARIF_TERRAIN,GARIF_PASTORALIST} from '../src/features/characters/rules/racial-progress.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';

const option=(pool,slug)=>pool+':option:'+slug;
function fixture(cls='dancer',pastoralist='skill-row:43'){
 const b=newBuild();Object.assign(b,{name:'Garif Test',alignment:'Neutral Good',raceId:GARIF_ID,classId:'ffd20:class:'+cls,hpRolls:[],reviewed:true});
 b.baseScores.int=16;b.baseScores.cha=14;b.hpRolls=[classHitDie(b)];
 b.racialChoices={[GARIF_TERRAIN]:[option(GARIF_TERRAIN,'desert')],[GARIF_PASTORALIST]:[pastoralist]};
 for(const event of choiceEvents(b))b.choices[event.id]=eligibleOptions(b,event).slice(0,calculated(event.count,b)).map(o=>o.id);
 if(hasSpellcasting(classFor(b))){const count=spellCounts(b),spells=spellsForBuild(b);b.spellIds=[...spells.filter(s=>s.level===0).slice(0,count.cantrips),...spells.filter(s=>s.level===1).slice(0,count.leveled)].map(s=>s.id);}
 b.skillRanks=fixedSkills.map(()=>0);b.skillRanks[Number(pastoralist.split(':').at(-1))]=1;
 for(let i=0,remaining=previewBuild(b).skillBudget-1;i<fixedSkills.length&&remaining>0;i++)if(!b.skillRanks[i]){b.skillRanks[i]=1;remaining--;}
 return b;
}

test('Garif standard first level supports terrain, skills, abilities and weapon proficiency without automatic conditional AC/saves',()=>{
 for(const cls of ['black-mage','dancer','archer','chocobo-knight']){
  const b=fixture(cls),d=compileBuild(b);
  assert.equal(previewBuild(b).skillBudget,b.skillRanks.reduce((x,y)=>x+y,0));
  assert.deepEqual([d.str,d.con,d.wis,d.int],[10,12,12,14]);
  assert.equal(d.speed,30);assert.equal(d.size_category,'Medium');assert.equal(d.languages,'Common, Garif');
  for(const weapon of ['Longspear','Shortspear','Javelin','Boar spear'])assert.match(d.proficiencies,new RegExp(weapon));
  assert.equal(d.racialIdentity.type,'Humanoid');assert.deepEqual(d.racialIdentity.subtypes,['garif']);
  assert.equal(d.skills[43].cs,true);assert.equal(d.skills[43].lvl,1);
  assert.equal(d.skills[13].rulesBonus,2);assert.equal(d.skills[29].rulesBonus,2);
  assert.match(d.racialAbilities.find(r=>r.sourceRuleId===GARIF_ID+':trait:bond-to-the-land').desc,/Chosen terrain: Desert/);
  assert.equal(d.ac_temp||0,0);assert.equal(d.fort_temp||0,0);
  assert.deepEqual(compileBuild(d.rulesBuild.input,d).rulesBuild.input.racialChoices,b.racialChoices);
  const swapped=structuredClone(b);swapped.racialChoices[GARIF_TERRAIN]=[option(GARIF_TERRAIN,'plains')];assert.throws(()=>compileBuild(swapped,d),/cannot be changed/);
 }
});
test('Garif required choices, Pastoralist rank, post-racial intelligence languages and level limits are guarded',()=>{
 const b=fixture();
 assert.match(renderBuild(b,2),/Bond to the Land terrain/);
 assert.match(renderBuild(b,2),/Pastoralist skill/);
 for(const mutate of [
  v=>delete v.racialChoices[GARIF_TERRAIN],v=>delete v.racialChoices[GARIF_PASTORALIST],
  v=>v.skillRanks[43]=0,v=>v.racialChoices[GARIF_TERRAIN]=[option(GARIF_TERRAIN,'bog')],
  v=>v.alternateIds=[GARIF_ID+':trait:historian'],v=>v.level=2,v=>v.carry={classes:[]}
 ]){const invalid=structuredClone(b);mutate(invalid);assert.throws(()=>compileBuild(invalid),{code:'INVALID_CHARACTER'});}
 b.racialChoices[GARIF_LANGUAGES]=[option(GARIF_LANGUAGES,'dwarven'),option(GARIF_LANGUAGES,'orc')];
 assert.match(compileBuild(b).languages,/Dwarven, Orc/);
 const excessive=structuredClone(b);excessive.racialChoices[GARIF_LANGUAGES].push(option(GARIF_LANGUAGES,'giant'));assert.throws(()=>compileBuild(excessive));
});
test('Garif Craft or Profession pastoralist specialty is required, owned and saved',()=>{
 for(const [row,name] of [[4,'Basket weaving'],[35,'Shepherd']]){
  const b=fixture('dancer','skill-row:'+row);b.racialSpecialties={[GARIF_PASTORALIST]:name};
  const d=compileBuild(b);assert.equal(d.skills[row].lvl,1);assert.equal(d.skills[row].subName,name);assert.equal(d.skills[row].cs,true);
  const invalid=structuredClone(b);invalid.racialSpecialties[GARIF_PASTORALIST]='';assert.throws(()=>compileBuild(invalid));
 }
});
