import test from 'node:test';
import assert from 'node:assert/strict';
import {fixedSkills,sheetSkills,skillCanRoll,skillRequiresTraining,skillDisplayName} from '../src/features/sheet/skills.mjs';
import {renderSkillRows,renderSection} from '../src/features/sheet/view.mjs';
import {skillTotal} from '../src/features/sheet/model.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {readFile} from 'node:fs/promises';

test('FFD20 list includes the expanded Craft specialties and Computers without shifting old indexed skill ranks',()=>{
 assert.equal(fixedSkills[0].name,'Acrobatics');
 assert.equal(fixedSkills[16].name,'Knw: Arcana');
 assert.equal(fixedSkills[45].name,'Use Magic Device');
 assert.equal(fixedSkills.length,59);
 for(const name of ['Computers','Drive','Navigate','Pilot','Repair','Knw: Technology',
  'Craft (Electronic)','Craft (Explosive)','Craft (Mechanical)','Craft (Structural)',
  'Craft (Alchemy)','Craft (Ammunition)','Craft (Armor)','Craft (Bows)','Craft (Calligraphy)',
  'Craft (Firearms)','Craft (Traps)','Craft (Weapons)'])assert.ok(fixedSkills.some(skill=>skill.name===name),name);
 const old=Object.fromEntries([]);
 const previous=fixedSkills.slice(0,46).map((row,index)=>({...row,lvl:index===0?3:0,cs:index===0}));
 const extended=sheetSkills({skills:previous});
 assert.equal(extended[0].lvl,3);
 assert.equal(extended[0].name,'Acrobatics');
 assert.equal(extended[45].name,'Use Magic Device');
 assert.equal(extended.length,59);
});
test('trained-only rules require actual ranks, never a class-skill, misc or racial bonus',()=>{
 for(const name of ['Computers','Disable Device','Drive','Handle Animal','Linguistics','Pilot','Profession',
   'Sleight of Hand','Spellcraft','Use Magic Device','Knw: Arcana','Knw: Technology',
   'Craft (Electronic)','Craft (Explosive)','Craft (Mechanical)','Craft (Structural)']){
  assert.equal(skillRequiresTraining({name}),true,name);
  assert.equal(skillCanRoll({name,lvl:0,cs:true,temp:20}),false,name+' cannot bypass rank requirement');
  assert.equal(skillCanRoll({name,lvl:1}),true,name+' unlocks at one rank');
 }
 assert.equal(skillRequiresTraining({name:'Craft',subName:'Electronic'}),true);
 assert.equal(skillCanRoll({name:'Craft',subName:'Electronic',lvl:0}),false);
 assert.equal(skillDisplayName({name:'Craft',subName:'Electronic'}),'Craft (Electronic)');
 for(const name of ['Acrobatics','Perception','Stealth','Swim','Repair','Navigate','Craft','Craft (Alchemy)','Perform']){
  assert.equal(skillCanRoll({name,lvl:0}),true,name+' can use untrained');
 }
 assert.equal(skillCanRoll({name:'Profession',lvl:0,temp:20}),false);
});
test('grey out dice and entire locked skill control while leaving Edit and Favorite enabled',()=>{
 const d={skills:[{name:'Computers',stat:'int',lvl:0,cs:true,temp:6},{name:'Acrobatics',stat:'dex',lvl:0}]};
 const html=renderSkillRows(d);
 assert.match(html,/cs-skill-untrained/);
 assert.match(html,/data-training-locked="true"/);
 assert.match(html,/Trained only · 1 rank required/);
 const computer=html.slice(html.indexOf('Trained only: add at least 1 skill rank'));
 assert.match(computer,/disabled aria-disabled="true"/);
 assert.match(html,/data-edit-entry="skills:0"/);
 assert.match(html,/data-favorite="skills:0"/);
 assert.match(html,/data-skill-index="0"/);
 assert.match(html,/data-skill-index="1"/);
 const saved=mergeSheetData(d,{action:'entry',collection:'skills',mode:'update',index:0,fields:{lvl:1}});
 assert.equal(skillCanRoll(sheetSkills(saved)[0]),true);
 assert.equal(skillTotal(saved.skills[0],saved),10,'rank +1, misc +6, class skill +3 are retained');
 const newHtml=renderSkillRows(saved);
 assert.doesNotMatch(newHtml.slice(newHtml.indexOf('Computers'),newHtml.indexOf('Craft (Alchemy)')+1),/trained only · 1 rank required/i);
});
test('locked favorite skills also have disabled roll control and live edit link',()=>{
 const d={skills:[{name:'Pilot',stat:'dex',lvl:0,favorite:true}]};
 const out=renderSection({name:'Hero',id:'abc',kind:'player',data:d},'favorites');
 assert.match(out,/data-skill-index="0"[^>]*disabled/);
 assert.match(out,/data-edit-entry="skills:0"/);
});
