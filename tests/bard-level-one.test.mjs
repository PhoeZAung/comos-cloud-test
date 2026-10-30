import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {newBuild,previewBuild,compileBuild,buildIssues,levelUpBuild,appendClassBuild,spellCounts,spellsForBuild,classSkill} from '../src/features/characters/rules/build.mjs';
import {BARD_ID} from '../src/features/characters/rules/bard-level-one.mjs';
import {bardSongs} from '../src/features/characters/rules/bard-songs.mjs';
import {validateBardSongMechanics} from '../src/features/characters/rules/song-mechanics-contract.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {entryCalculations} from '../src/features/sheet/calculations.mjs';
import {restRecovery} from '../src/features/sheet/recovery.mjs';
import {renderBuild,wizardOrder} from '../src/ui/rules-wizard.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharacterLibraryService} from '../backend/characters/library.mjs';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const HANDY='ffd20:race:moogle:pool:moogle-handy-craft-or-profession';
function fixture({cha=10,int=10}={}){
 const b=newBuild();Object.assign(b,{name:'Moogle Bard',classId:BARD_ID,raceId:'ffd20:race:moogle',hpRolls:[8],reviewed:true,
  racialChoices:{[HANDY]:['skill-row:4']},racialSpecialties:{[HANDY]:'Woodworking'}});
 Object.assign(b.baseScores,{cha,int});
 const counts=spellCounts(b);b.spellSelections={cantrips:bardSongs.filter(s=>s.level===0).slice(0,counts.cantrips).map(s=>s.id),leveled:bardSongs.filter(s=>s.level===1).slice(0,counts.leveled).map(s=>s.id)};
 b.spellIds=[...b.spellSelections.cantrips,...b.spellSelections.leveled];
 let remaining=previewBuild(b).skillBudget;b.skillRanks=fixedSkills.map(()=>remaining-->0?1:0);return b;
}
test('all thirty individual song mechanics are sourced, distinct and manual; Threnody uses individual maintained duration',async()=>{
 const catalog=await read('rules/classes/bard-songs.json'),batch=await read('rules/classes/bard-song-mechanics.json');
 assert.deepEqual(validateBardSongMechanics(batch,catalog),{total:30,maintained:11,coverage:'level-1-only'});
 for(const mutate of [b=>b.entries.pop(),b=>b.entries[1]=b.entries[0],b=>b.entries[0].mpCost=0,b=>b.entries[0].automation='automatic',b=>b.entries[0].archiveSha256='',b=>b.entries[0].targeting={},b=>b.entries[0].maintained=true]){
  const wrong=structuredClone(batch);mutate(wrong);assert.throws(()=>validateBardSongMechanics(wrong,catalog));
 }
 const bySlug=s=>batch.entries.find(x=>x.songId.endsWith(':'+s));
 assert.equal(bySlug('elemental-threnody').maintained,true);
 assert.equal(bySlug('inspirational-boost').castingTime,'1 swift action');
 assert.equal(bySlug('saving-finale').castingTime,'1 immediate action');
 assert.equal(bySlug('suit-of-the-dancer').castingTime,'1 round');
 assert.match(bySlug('saving-finale').mechanicsSummary,/jingle does not qualify/);
 assert.match(bySlug('joyful-noise').mechanicsSummary,/not dispelled/);
 assert.match(bySlug('toilsome-chant').mechanicsSummary,/does not grant Inspire Competence/);
});
test('first-level Bard uses racial CHA for songs, performance, DC and MP; INT only changes skill ranks',()=>{
 for(const [cha,int,songs,mp,skills] of [[9,10,3,2,6],[10,10,4,3,6],[18,10,8,4,6],[10,18,4,3,10]]){
  const b=fixture({cha,int}),p=previewBuild(b);assert.deepEqual(buildIssues(b),[]);
  assert.equal(p.summary.mp,mp);assert.equal(p.skillBudget,skills);assert.equal(spellCounts(b).leveled,songs);
  const d=compileBuild(b);assert.equal(d.class,'Bard');assert.equal(d.hp_max,8);assert.equal(d.currency_gil,105);
  assert.deepEqual([d.bab,d.fort_base,d.ref_base,d.will_base],[0,0,2,2]);
  assert.equal(d.mp_class,2);assert.equal(d.mp_bonus,mp-2);assert.equal(d.mp_curr,mp);
  assert.equal(d.skills.reduce((n,s)=>n+s.lvl,0),skills);assert.equal(d.spells.length,2+songs);
  assert.equal(d.activeAbilities.find(a=>a.name==='Bardic Performance').u_max,4+Math.floor((cha+2-10)/2));
  assert(d.activeAbilities.find(a=>a.name==="Siren's Song").limitBreak);assert(d.activeAbilities.find(a=>a.name==='Soul Voice').limitBreak);
  assert.equal(['activeAbilities','passiveAbilities'].flatMap(k=>d[k]).filter(a=>a.limitBreak).length,2);
  assert(!d.activeAbilities.some(a=>a.name==='Inspiration'));assert(!d.feats.some(f=>f.name==='Mounted Combat'));
  const spell=d.spells.find(s=>s.lvl===1);assert.equal(entryCalculations(spell,d,'spells').dc,11+Math.floor((cha+2-10)/2));
  assert.equal(entryCalculations(d.spells.find(s=>s.lvl===0),d,'spells').mp,0);
  assert.equal(entryCalculations(spell,d,'spells').mp,1);assert(d.spells.every(s=>s.casting_ability==='cha'&&s.automation==='manual'));
  assert.equal(restRecovery(d).rows[0].ability,'cha');assert.equal(restRecovery(d).unresolved.length,0);
 }
 assert(classSkill(fixture(),'skill:perform'));assert(classSkill(fixture(),'skill:knowledge-nature'));assert(!classSkill(fixture(),'skill:survival'));
});
test('Bard saving rejects missing, duplicate, swapped, unknown or premature songs and invalid character choices',()=>{
 const cases=[b=>b.spellIds.push(b.spellIds[0]),b=>{b.spellIds.pop();b.spellSelections=null;},b=>{b.spellIds[0]='ffd20:spell:black-mage:blizzard';b.spellSelections=null;},b=>{[b.spellSelections.cantrips[0],b.spellSelections.leveled[0]]=[b.spellSelections.leveled[0],b.spellSelections.cantrips[0]];b.spellIds=[...b.spellSelections.cantrips,...b.spellSelections.leveled];},b=>b.baseScores.cha=8,b=>b.baseScores.cha=45,b=>b.initialIntMod=4,b=>b.archetypeId='ffd20:archetype:bard:clown',b=>b.hpRolls=[6],b=>b.favored=['hp'],b=>b.skillRanks=null,b=>b.abilityIncreases={4:'cha'},b=>b.choices={'invented-talent':['fake']}];
 for(const change of cases){const b=fixture();change(b);assert.throws(()=>compileBuild(b));}
 const immortal=fixture();immortal.raceId='ffd20:race:immortal';immortal.racialChoices={};immortal.racialSpecialties={};assert(buildIssues(immortal).some(i=>/Magic Ineptitude/.test(i.message)));
});
test('Bard boundaries reject level-up, adding another class, changing classes or adopting a manual sheet',()=>{
 const b=fixture(),saved=compileBuild(b);
 assert.throws(()=>compileBuild({...b,level:2},saved),/level-1 testing/);
 assert.throws(()=>levelUpBuild({...b,level:2},saved),/level-1 testing/);
 assert.throws(()=>appendClassBuild({...newBuild(),classId:'ffd20:class:black-mage'},saved),/multiclassing/);
 assert.throws(()=>appendClassBuild(b,{}),/multiclassing/);
 assert.throws(()=>compileBuild({...b,classId:'ffd20:class:dancer'},saved),/change classes/);
 assert.throws(()=>compileBuild(b,{charName:'Manual sheet'}),/adopting/);
});
test('Bard edit and save/reopen retain resource expenditure, manual rows and overrides without accumulating owned rows',()=>{
 const b=fixture(),d=compileBuild(b);d.hp_curr=3;d.mp=d.mp_curr=1;
 const pool=d.activeAbilities.find(a=>a.name==='Bardic Performance');pool.u_curr=2;
 d.spells[0].name='My jingle';d.spells[0].desc='My own note';d.spells.push({name:'Manual spell',desc:'Keep me'});
 d.passiveAbilities.push({name:'Manual class note'});d.mp_bonus+=2;
 const twice=compileBuild(JSON.parse(JSON.stringify(d.rulesBuild.input)),JSON.parse(JSON.stringify(d)));
 assert.equal(twice.hp_curr,3);assert.equal(twice.mp_curr,1);assert.equal(twice.mp,1);assert.equal(twice.mp_bonus,d.mp_bonus);
 assert.equal(twice.activeAbilities.find(a=>a.name==='Bardic Performance').u_curr,2);
 assert.equal(twice.spells.find(s=>s.sourceRuleId===d.spells[0].sourceRuleId).name,'My jingle');
 assert.equal(twice.spells.find(s=>s.sourceRuleId===d.spells[0].sourceRuleId).desc,'My own note');
 assert(twice.spells.some(s=>s.name==='Manual spell'));assert(twice.passiveAbilities.some(s=>s.name==='Manual class note'));
 const ids=['activeAbilities','passiveAbilities','racialAbilities','feats','spells'].flatMap(k=>twice[k].filter(s=>s.rulesOwned).map(s=>s.sourceRuleId));assert.equal(new Set(ids).size,ids.length);
});
test('sheet CHA edits change Bard MP and performance capacity without healing or using INT bonus MP',()=>{
 const d=compileBuild(fixture());d.hp_curr=3;d.mp=d.mp_curr=1;
 d.activeAbilities.find(a=>a.name==='Bardic Performance').u_curr=2;
 const changed=mergeSheetData(d,{action:'fields',fields:{cha:20,int:18,con:14}});
 assert.equal(changed.mp_bonus,2);assert.equal(changed.mp_curr,1);assert.equal(changed.hp_curr,3);assert.equal(changed.hp_max,10);
 assert.equal(entryCalculations(changed.activeAbilities.find(a=>a.name==='Bardic Performance'),changed,'activeAbilities').maxUses,9);
 assert.throws(()=>mergeSheetData(d,{action:'fields',fields:{cha:46}}),/verified table/);
});
test('wizard uses Bard-only song slots and retains them in the real character library',async()=>{
 const b=fixture();assert.equal(spellsForBuild(b).length,41);assert(wizardOrder(b).includes(5));
 const html=renderBuild(b,5);assert.match(html,/Jingle 1/);assert.match(html,/Song 4/);assert.match(html,/one maintained song/);assert.doesNotMatch(html,/Cantrip 1/);
 const db=await openDatabase(':memory:');
 try{const user=createUserRepository(db).create({displayName:'Bard fixture'}),service=createCharacterLibraryService(db),request={build:b,requestId:randomUUID()};
  const created=service.createBuild(user.id,request);assert.equal(service.createBuild(user.id,request).id,created.id);
  const stored=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(created.id).data_json);
  assert.deepEqual(stored.rulesBuild.input.spellSelections,b.spellSelections);assert.equal(stored.class,'Bard');assert.equal(stored.spells.length,6);
  assert.equal(stored.rulesBuild.input.initialChaMod,1);
  assert.deepEqual(compileBuild(stored.rulesBuild.input,stored).rulesBuild.input,{...b,initialChaMod:1});
 }finally{db.close();}
});


test('Bard starting song allowance survives sheet CHA edits and rejects forged entitlements',()=>{
 const created=compileBuild(fixture());assert.equal(created.rulesBuild.input.initialChaMod,1);
 const changed=mergeSheetData(created,{action:'fields',fields:{cha:20}});
 assert.deepEqual(spellCounts(changed.rulesBuild.input),{cantrips:2,leveled:4});
 const edited=compileBuild(changed.rulesBuild.input,changed);assert.equal(edited.mp_bonus,2);assert.equal(edited.spells.length,6);
 const forged=structuredClone(edited.rulesBuild.input);forged.initialChaMod=5;forged.spellSelections=null;
 forged.spellIds=[...bardSongs.filter(s=>s.level===0).slice(0,2),...bardSongs.filter(s=>s.level===1).slice(0,8)].map(s=>s.id);
 assert.throws(()=>compileBuild(forged,edited),/allowance cannot be changed/);
 const fakeCreation=fixture();fakeCreation.initialChaMod=5;fakeCreation.spellSelections=null;fakeCreation.spellIds=forged.spellIds;
 assert.throws(()=>compileBuild(fakeCreation),/allowance cannot be changed/);
 const oldVersion=structuredClone(created);delete oldVersion.rulesBuild.input.initialChaMod;
 const migrated=compileBuild(oldVersion.rulesBuild.input,oldVersion);assert.equal(migrated.rulesBuild.input.initialChaMod,1);
 const oldChanged=mergeSheetData(oldVersion,{action:'fields',fields:{cha:20}});assert.equal(compileBuild(oldChanged.rulesBuild.input,oldChanged).rulesBuild.input.initialChaMod,1);
});
