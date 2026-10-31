import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,choiceEvents,eligibleOptions,calculated,buildIssues} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {GARLEAN_ID,GARLEAN_LANGUAGES,GARLEAN_WEAPON,GARLEAN_CRAFT} from '../src/features/characters/rules/racial-progress.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
const option=(pool,slug)=>pool+':option:'+slug;
function fixture(cls='dancer'){
 const b=newBuild();Object.assign(b,{name:'Garlean Test',alignment:'Lawful Neutral',raceId:GARLEAN_ID,classId:'ffd20:class:'+cls,hpRolls:[],reviewed:true});
 b.baseScores.int=14;b.hpRolls=[classHitDie(b)];
 b.racialChoices={[GARLEAN_WEAPON]:[option(GARLEAN_WEAPON,'firearms-simple')],[GARLEAN_CRAFT]:['skill-row:4']};
 b.racialSpecialties={[GARLEAN_CRAFT]:'Mechanical'};
 for(const event of choiceEvents(b))b.choices[event.id]=eligibleOptions(b,event).slice(0,calculated(event.count,b)).map(o=>o.id);
 b.skillRanks=fixedSkills.map(()=>0);let remaining=previewBuild(b).skillBudget;
 for(let i=0;i<fixedSkills.length&&remaining>0;i++){b.skillRanks[i]=1;remaining--;}
 return b;
}
test('Garlean standard maps level-one stats, skills, firearm proficiency and named Craft',()=>{
 for(const cls of ['dancer','archer','chocobo-knight']){
  const b=fixture(cls),d=compileBuild(b);
  assert.equal(d.con,12);assert.equal(d.int,16);assert.equal(d.wis,8);
  assert.equal(d.speed,30);assert.equal(d.size_category,'Medium');assert.equal(d.languages,'Common');
  assert.equal(d.racialIdentity.type,'Humanoid');assert.deepEqual(d.racialIdentity.subtypes,['garlean']);
  assert.match(d.proficiencies,/Firearms \(Simple\)/);assert.doesNotMatch(d.proficiencies,/Exotic Weapon Proficiency/);
  assert.equal(d.skills[4].subName,'Mechanical');assert.equal(d.skills[4].rulesBonus,2);
  for(const i of [20,23]){assert.equal(d.skills[i].rulesBonus,2);assert.equal(d.skills[i].cs,true);}
  for(const i of [26,29,37])assert.equal(d.skills[i].rulesBonus,2);
  assert.equal(d.ac_temp||0,0);assert.equal(d.fort_temp||0,0);
  assert.match(d.racialAbilities.find(r=>r.sourceRuleId===GARLEAN_ID+':trait:magic-ineptitude').desc,/Cannot gain an MP pool/);
  assert.deepEqual(compileBuild(d.rulesBuild.input,d).rulesBuild.input.racialChoices,b.racialChoices);
 }
});
test('Garlean required choices, incompatible magic and source languages are guarded',()=>{
 const b=fixture();assert.match(renderBuild(b,2),/Magic Ineptitude/);
 for(const mutate of [
  x=>delete x.racialChoices[GARLEAN_WEAPON],x=>delete x.racialChoices[GARLEAN_CRAFT],
  x=>x.racialChoices[GARLEAN_WEAPON]=[option(GARLEAN_WEAPON,'one-gun-arm-exotic-weapon-proficiency')],
  x=>x.racialChoices[GARLEAN_CRAFT]=['skill-row:43'],x=>x.racialSpecialties[GARLEAN_CRAFT]='',
  x=>x.heritageId=GARLEAN_ID+':heritage:baelsar',
  x=>x.level=2,x=>x.carry={classes:[]}
 ]){const invalid=structuredClone(b);mutate(invalid);assert.throws(()=>compileBuild(invalid),{code:'INVALID_CHARACTER'});}
 const magic=structuredClone(b);magic.classId='ffd20:class:black-mage';
 assert.ok(buildIssues(magic).some(issue=>issue.message.includes('Magic Ineptitude')));
 b.racialChoices[GARLEAN_LANGUAGES]=[option(GARLEAN_LANGUAGES,'elvaan'),option(GARLEAN_LANGUAGES,'mithran')];
 assert.match(compileBuild(b).languages,/Elvaan, Mithran/);
 const tooMany=structuredClone(b);tooMany.racialChoices[GARLEAN_LANGUAGES].push(option(GARLEAN_LANGUAGES,'goblin'),option(GARLEAN_LANGUAGES,'galkan'));
 assert.throws(()=>compileBuild(tooMany));
});
test('Saved Garlean starting weapon and Craft specialty cannot be replaced',()=>{
 const saved=compileBuild(fixture());
 for(const mutate of [x=>x.racialChoices[GARLEAN_WEAPON]=[],x=>x.racialChoices[GARLEAN_CRAFT]=['skill-row:5'],x=>x.racialSpecialties[GARLEAN_CRAFT]='Electronics']){
  const changed=structuredClone(saved.rulesBuild.input);mutate(changed);assert.throws(()=>compileBuild(changed,saved),/cannot be changed/);
 }
});
