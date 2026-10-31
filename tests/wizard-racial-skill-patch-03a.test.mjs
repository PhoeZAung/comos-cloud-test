import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,buildIssues,raceTraits,racialClassSkill} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {racialChoiceSpecs,pruneRacialChoices} from '../src/features/characters/rules/racial-choices.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';

const race=slug=>'ffd20:race:'+slug;
const pool=(slug,name)=>race(slug)+':pool:'+name;
function fixture(slug) {
 const b=newBuild();Object.assign(b,{name:'Wizard skill pick '+slug,alignment:'True Neutral',
  raceId:race(slug),classId:'ffd20:class:dancer',reviewed:true});
 b.hpRolls=[classHitDie(b)];
 return b;
}
function finish(b){
 b.skillRanks=fixedSkills.map(()=>0);
 for(let i=0,n=previewBuild(b).skillBudget;i<fixedSkills.length&&n>0;i++,n--)b.skillRanks[i]=1;
 return b;
}

test('Orc chooses one skill package, not both; Jump is not a permanent Acrobatics bonus',()=>{
 const b=fixture('orc'),id=pool('orc','skill-bonus-selection');
 assert.match(renderBuild(b,2),new RegExp('data-rw-racial-choice="'+id+'"'));
 assert(buildIssues(b,{complete:false}).some(x=>x.message.includes('Skill Bonus selection')));
 b.racialChoices[id]=[id+':option:2-acrobatics'];
 let effects=raceTraits(b).traits.flatMap(f=>f.effects);
 assert(effects.some(e=>e.target==='skills.row.0.bonus'&&e.value?.value===2&&e.automation==='automatic'));
 assert(!effects.some(e=>e.target==='skills.row.3.bonus'&&e.automation==='automatic'));
 let compiled=compileBuild(finish(b));
 assert.equal(compiled.skills[0].rulesBonus,2);
 assert.equal(compiled.skills[3].rulesBonus||0,0);
 b.racialChoices[id]=[id+':option:1-climb-and-jump'];
 effects=raceTraits(b).traits.flatMap(f=>f.effects);
 assert(effects.some(e=>e.target==='skills.row.3.bonus'&&e.value?.value===1&&e.automation==='automatic'));
 assert(!effects.some(e=>e.target==='skills.row.0.bonus'&&e.automation==='automatic'));
 assert(effects.some(e=>e.target==='race.orc.jump'&&e.automation==='manual'&&e.textValue.includes('jump only')));
 compiled=compileBuild(b);
 assert.equal(compiled.skills[3].rulesBonus,1);
 assert.equal(compiled.skills[0].rulesBonus||0,0);
 b.racialChoices[id]=[id+':option:does-not-exist'];
 assert(buildIssues(b,{complete:false}).some(x=>x.message.includes('Invalid or duplicate Skill Bonus')));
});

test('Matanga Academic choice grants +2 to exactly one Knowledge row and class-skill status',()=>{
 const b=fixture('matanga'),id=pool('matanga','academic-selection');
 assert.match(renderBuild(b,2),new RegExp('data-rw-racial-choice="'+id+'"'));
 assert(buildIssues(b,{complete:false}).some(x=>x.message.includes('Academic selection')));
 b.racialChoices[id]=['skill-row:20']; // Knowledge (history)
 const effects=raceTraits(b).traits.flatMap(f=>f.effects);
 assert(effects.some(e=>e.target==='skills.row.20.bonus'&&e.value?.value===2));
 assert(effects.some(e=>e.target==='skills.row.20.class_skill'));
 assert(racialClassSkill(b,'skill:knowledge-history',20));
 const compiled=compileBuild(finish(b));
 assert.equal(compiled.skills[20].rulesBonus,2);
 assert.equal(compiled.skills[20].cs,true);
 assert.equal(compiled.skills[21].rulesBonus||0,0);
 b.racialChoices[id]=['skill-row:0'];
 assert(buildIssues(b,{complete:false}).some(x=>x.message.includes('Invalid or duplicate Academic')));
});

test('Loporrit Handy uses one named Craft/Profession specialty and only the selected row receives +2',()=>{
 for(const [selected,row] of [['skill-row:4',4],['skill-row:35',35]]){
  const b=fixture('loporrit'),id=pool('loporrit','handy-selection');
  assert.match(renderBuild(b,2),new RegExp('data-rw-racial-choice="'+id+'"'));
  b.racialChoices[id]=[selected];
  assert(buildIssues(b,{complete:false}).some(x=>/Name the Craft or Profession specialty/.test(x.message)));
  b.racialSpecialties[id]='Clock repair';
  const d=compileBuild(finish(b));
  assert.equal(d.skills[row].rulesBonus,2);
  assert.equal(d.skills[row].subName,'Clock repair');
  assert.deepEqual(d.rulesBuild.input.racialChoices[id],[selected]);
  const invalid=structuredClone(b);invalid.racialSpecialties[id]='';
  assert.throws(()=>compileBuild(invalid),/Name the Craft or Profession specialty/);
 }
});

test('Choice pruning removes obsolete racial skill selections and specialties when trait disappears',()=>{
 const b=fixture('loporrit'),id=pool('loporrit','handy-selection');
 b.racialChoices[id]=['skill-row:34'];b.racialSpecialties[id]='Tailoring';
 const disabled=raceTraits({...b,disabledTraits:[race('loporrit')+':trait:handy']}).traits;
 const source={id:b.raceId,choicePools:[{id}]};
 pruneRacialChoices(b,source,disabled);
 assert.equal(b.racialChoices[id],undefined);
 assert.equal(b.racialSpecialties[id],undefined);
});
