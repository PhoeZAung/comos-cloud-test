import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newBuild,compileBuild,previewBuild,buildIssues,classSkill,choiceEvents,eligibleOptions,levelUpBuild,classFeatureChanges} from '../src/features/characters/rules/build.mjs';
import {GUNBREAKER_ID,DOOM_SLAYER_ID} from '../src/features/characters/rules/level-one-classes.mjs';
import {validateClassDefinition} from '../src/features/characters/rules/class-contract.mjs';
import {validateArchetypeDefinition} from '../src/features/characters/rules/archetype-contract.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
const make=(archetypeId='')=>{const b=newBuild();Object.assign(b,{name:'Galka Gunbreaker',raceId:'ffd20:race:galka',classId:GUNBREAKER_ID,archetypeId,alignment:'Neutral Good',hpRolls:[10],reviewed:true});b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);return b;};
test('Gunbreaker table and Doom Slayer replacement contract are valid',async()=>{
 const c=JSON.parse(await readFile(new URL('../rules/classes/gunbreaker.class.json',import.meta.url),'utf8'));
 const a=JSON.parse(await readFile(new URL('../rules/classes/archetypes/gunbreaker-doom-slayer.archetype.json',import.meta.url),'utf8'));
 assert.equal(validateClassDefinition(c).levels,20);
 assert.equal(validateArchetypeDefinition(a,c).replacements,11);
 assert.deepEqual(c.data.supportedLevels,Array.from({length:20},(_,i)=>i+1));assert.deepEqual(a.data.supportedLevels,Array.from({length:20},(_,i)=>i+1));
 assert.deepEqual(c.data.levels.map(row=>row.bab),Array.from({length:20},(_,i)=>i+1));
});
test('Both Galka Gunbreaker builds have correct baseline and distinct class abilities',()=>{
 for(const b of [make(),make(DOOM_SLAYER_ID)]){
  const p=previewBuild(b);assert.deepEqual([p.hp,p.summary.bab,p.summary.fort,p.summary.ref,p.summary.will,p.summary.mp],[10,1,2,2,0,0]);
  const d=compileBuild(b);assert.equal(d.class,'Gunbreaker');assert.equal(d.race,'Galka');
  assert.equal(d.currency_gil,175);assert.deepEqual([d.str,d.wis,d.cha],[12,12,8]);
  assert.equal(d.speed,20);assert(d.feats.some(f=>f.name==='Gunsmithing'));
  assert.equal(d.activeAbilities.filter(f=>f.limitBreak).length,2);
  assert.equal(d.activeAbilities.find(f=>f.name==='Magicked Ammo').u_max,3);
  assert.equal(d.classes[0].archetype,b.archetypeId?'Doom Slayer':'');
  assert.equal(d.activeAbilities.some(f=>f.name==='Aurora'),!b.archetypeId);
  assert.equal(d.activeAbilities.some(f=>f.name==='Doom Gun Arm'),Boolean(b.archetypeId));
  assert.equal(d.passiveAbilities.some(f=>f.name==='Praetor Sacrament'),Boolean(b.archetypeId));
  assert.equal(d.weapons.length,0);assert.equal(d.spells.length,0);
 }
});
test('Level 2 requires exactly one sourced talent and applies correct Doom Slayer replacement',()=>{
 for(const archetypeId of ['',DOOM_SLAYER_ID]){
  const first=make(archetypeId),firstSheet=compileBuild(first);firstSheet.hp_curr=2;
  const second=structuredClone(first);second.level=2;second.hpRolls=[10,6];second.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(second).skillBudget?1:0);
  const ev=choiceEvents(second).filter(e=>e.atClassLevel===2);assert.equal(ev.length,1);
  const choice=eligibleOptions(second,ev[0]).find(o=>o.name==='Ranged Combat Training');assert(choice);
  assert(buildIssues(second).some(x=>/exactly one/.test(x.message)));
  second.choices[ev[0].id]=[choice.id];assert.deepEqual(buildIssues(second),[]);
  const changes=classFeatureChanges(second,first);assert(changes.some(x=>x.feature.name==='Ranged Combat Training'));assert(changes.some(x=>['Keen Edge','Ravenous Hatred'].includes(x.feature.name)));
  const after=levelUpBuild(second,firstSheet);
  assert.deepEqual([after.level,after.bab,after.fort_base,after.ref_base,after.will_base,after.hp_max,after.hp_curr,after.mp_max_spell_level],[2,2,3,3,0,16,2,0]);
  assert.equal(after.classes[0].archetype,archetypeId?'Doom Slayer':'');
  assert.equal(after.passiveAbilities.some(f=>f.name==='Keen Edge'),!archetypeId);
  assert.equal(after.activeAbilities.some(f=>f.name==='Ravenous Hatred'),Boolean(archetypeId));
  assert(after.passiveAbilities.some(f=>f.name==='Ranged Combat Training'));
  assert(after.feats.some(f=>f.name==='Precise Shot'));
  assert.throws(()=>levelUpBuild({...second,level:3,hpRolls:[10,6,6]},after),/skill points|valid|cannot/);
  assert.throws(()=>levelUpBuild({...second,alternateIds:['ffd20:race:galka:feature:wary']},firstSheet),/cannot change alternate racial traits/);
 }
 const b=make(DOOM_SLAYER_ID);assert(buildIssues({...b,archetypeId:'other'}).some(x=>/not enabled/.test(x.message)));
 assert(buildIssues({...b,level:21}).some(x=>/1 to 20/.test(x.message)));
});

test('Doom Slayer replaces base class skills without changing Galka traits',()=>{
 const base=make(),doom=make(DOOM_SLAYER_ID);
 assert.equal(classSkill(base,'skill:heal'),true);
 assert.equal(classSkill(base,'skill:knowledge-nobility'),true);
 assert.equal(classSkill(base,'skill:survival'),false);
 assert.equal(classSkill(doom,'skill:heal'),false);
 assert.equal(classSkill(doom,'skill:knowledge-nobility'),false);
 assert.equal(classSkill(doom,'skill:survival'),true);
 assert.equal(classSkill(doom,'skill:knowledge-planes'),true);
 assert.equal(compileBuild(doom).str,12);
});
