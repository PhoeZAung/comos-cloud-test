import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {npcDirectory} from '../backend/characters/npcs.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {npcCatalogTab,npcCatalogTag,npcStorageCategory,npcTagForData,NPC_CATALOG_TABS} from '../src/features/characters/npc-library.mjs';
import {KINGMAKER_STAGED_ENTRIES,kingmakerNpcData} from '../src/data/kingmaker/catalog.mjs';
import {renderSheetFrame} from '../src/features/sheet/view.mjs';

test('exactly three catalog tags without moving older untagged NPCs',()=>{
 assert.deepEqual(NPC_CATALOG_TABS.map(t=>t.id),['npc','bestiary','companions']);
 assert.deepEqual(NPC_CATALOG_TABS.map(t=>t.tag),['npc','bestiary','companion']);
 assert.equal(npcCatalogTab('npc-codex'),'npc');
 assert.equal(npcStorageCategory('npc'),'npc-codex');
 assert.equal(npcStorageCategory('companion'),'companions');
 assert.equal(npcCatalogTag('companions'),'companion');
 assert.equal(npcTagForData({}),'npc');
 assert.equal(npcTagForData({npcCategory:'legacy-custom'}),'npc');
 assert.equal(npcTagForData({npcCategory:'bestiary'}),'bestiary');
 assert.throws(()=>npcStorageCategory('hazards'),/Invalid NPC catalog category/);
});

test('all previously reviewed Kingmaker creatures retain the Bestiary catalog tag',()=>{
 const bestiary=KINGMAKER_STAGED_ENTRIES.filter(x=>x.chapter==='bestiary');
 assert.equal(bestiary.length,105);
 for(const entry of bestiary){
  const data=kingmakerNpcData(entry);
  assert.equal(data.npcCategory,'bestiary',entry.name);
  assert.equal(data.npcLibraryTag,'bestiary',entry.name);
  assert.equal(data.npcImportKey,entry.slug);
  assert.equal(data.npcVerified,true,entry.name);
 }
 const codex=KINGMAKER_STAGED_ENTRIES.filter(x=>x.chapter==='npc-codex');
 const companions=KINGMAKER_STAGED_ENTRIES.filter(x=>x.chapter==='companions');
 assert.equal(codex.length,105);
 assert.equal(companions.length,7);
 assert.ok(codex.every(entry=>kingmakerNpcData(entry).npcLibraryTag==='npc'));
 assert.ok(companions.every(entry=>kingmakerNpcData(entry).npcLibraryTag==='companion'));
 assert.ok(companions.every(entry=>kingmakerNpcData(entry).npcVerified===false));
});

test('companion sheets track independent current, max and temporary HP while NPC and Bestiary stay HP-less',()=>{
 const make=(category,health={})=>({
  id:randomUUID(),kind:'npc',name:category+' sample',
  data:{manualCharacter:true,npcCategory:category,...health,
   npcStats:{ac:18,str:16},npcText:{hpDetail:'15 (1d12+3)'},
   npcVariants:[{level:1,hp:15},{level:11,hp:126}]}
 });
 const companion=make('companions',{hp_curr:11,hp_max:15,hp_temp:3});
 const rendered=renderSheetFrame(companion,'overview',{admin:true});
 assert.match(rendered,/cs-companion-sheet/);
 assert.match(rendered,/data-edit-stats="npcHealth"/);
 assert.match(rendered,/Current companion HP/);
 assert.match(rendered,/11 \/ 15/);
 assert.match(rendered,/Temporary HP: 3/);
 assert.match(rendered,/data-resource="hp_curr" data-delta="-1"/);
 assert.match(rendered,/Level 1 · printed HP 15/);
 assert.match(rendered,/Level 11 · printed HP 126/);
 assert.match(rendered,/source review before play/);
 assert.doesNotMatch(rendered,/data-level-up=|data-sheet-tab="items"/);
 let a={...companion.data},b={...make('bestiary',{hp_curr:54,hp_max:54}).data};
 a=mergeSheetData(a,{action:'fields',fields:{hp_curr:7,hp_max:20,hp_temp:0}},{npc:true});
 assert.deepEqual([a.hp_curr,a.hp_max,a.hp_temp],[7,20,0]);
 assert.deepEqual([b.hp_curr,b.hp_max],[54,54],'Bestiary records remain untouched by companion HP edits');
 for(const other of ['npc','npc-codex','bestiary']){
  const html=renderSheetFrame(make(other,{hp_curr:54,hp_max:54}),'overview',{admin:true});
  assert.doesNotMatch(html,/cs-companion-health|data-resource="hp_curr"|data-edit-stats="npcHealth"/);
 }
 const unset=renderSheetFrame(make('companions',{hp_curr:null,hp_max:null}),'overview',{admin:true});
 assert.match(unset,/Set current and maximum HP using Edit/);
 assert.doesNotMatch(unset,/Current companion HP|>0 \/ 0</);
});

test('directory returns category tags without updating legacy NPC database rows',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'GM'});
  const stamp='2026-11-16T00:00:00Z';
  function insert(name,data){
   const id=randomUUID();
   db.prepare("INSERT INTO characters(id,owner_id,name,created_at,updated_at,kind) VALUES(?,?,?,?,?,'npc')").run(id,owner.id,name,stamp,stamp);
   db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(id,JSON.stringify(data));
   return id;
  }
  const legacy=insert('Pre-existing Guard',{manualCharacter:true,hp_curr:22,hp_max:22});
  const creature=insert('Reviewed Monster',kingmakerNpcData(KINGMAKER_STAGED_ENTRIES[0]));
  const companion=insert('Named Companion',{npcCategory:'companions',hp_curr:10,hp_max:10});
  const read=async category=>{
   let response;
   const suffix=category?'?category='+encodeURIComponent(category):'';
   await npcDirectory({req:{method:'GET'},url:new URL('/api/v1/admin/npcs'+suffix,'https://cosmos.test'),db,ownerId:owner.id,send:(status,data)=>response={status,data}});
   return response;
  };
  for(const [category,id,tag] of [['npc',legacy,'npc'],['npc-codex',legacy,'npc'],['bestiary',creature,'bestiary'],['companions',companion,'companion']]){
   const response=await read(category);
   assert.equal(response.status,200);
   assert.deepEqual(response.data.characters.map(c=>c.id),[id]);
   assert.equal(response.data.characters[0].tag,tag);
   assert.deepEqual(response.data.characters[0].tags,[tag]);
  }
  const original=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(legacy).data_json);
  assert.deepEqual(original,{manualCharacter:true,hp_curr:22,hp_max:22});
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM characters').get().n,3);
 }finally{db.close();}
});
