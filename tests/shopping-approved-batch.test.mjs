import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {openDatabase} from '../backend/db/database.mjs';
import {createItemsService} from '../backend/items/service.mjs';
import {importApprovedShoppingBatch,validateApprovedShoppingBatch} from '../backend/items/approved-shopping.mjs';

const approved=JSON.parse(await readFile(new URL('../backend/items/catalog/ffd20-verified-batch-01.json',import.meta.url),'utf8'));

test('approved FFd20 runtime JSON contains eight distinct source-reviewed fixed-price items',()=>{
 const rows=validateApprovedShoppingBatch(approved);
 assert.equal(rows.length,8);
 assert.equal(new Set(rows.map(r=>r.importId)).size,8);
 assert.equal(rows.find(r=>r.name==='Bulletproof Vest')?.priceUnits,30000);
 assert.equal(rows.find(r=>r.name==='Sorcery Ring')?.priceUnits,1000000);
 assert.ok(rows.every(r=>r.sourceSystem==='ffd20'&&r.mechanicsMode===undefined));
 const bad=structuredClone(approved);bad.items[0].priceGil='300 gp';
 assert.throws(()=>validateApprovedShoppingBatch(bad),/Invalid approved/);
});

test('approved batch adds fixed-price catalog items and does not auto-equip or modify existing rows',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const first=await importApprovedShoppingBatch(db);
  assert.equal(first.state,'imported');
  assert.equal(first.count,8);
  const svc=createItemsService(db);
  const all=db.prepare("SELECT * FROM items WHERE source_id='ffd20-shopping' ORDER BY name").all();
  assert.equal(all.length,8);
  assert.ok(all.every(x=>x.revision===1&&x.archived===0&&x.catalog_json.includes('informational-only')));
  const riot=all.find(x=>x.name==='Riot Shield');
  assert.equal(riot.category,'Armor');
  assert.equal(riot.price_units,100000);
  const rings=svc.list({category:'Magic'}).items;
  assert.equal(rings.length,2);
  const bullet=all.find(x=>x.name==='Bulletproof Vest');
  assert.equal(bullet.price_units,30000);
  const changed=svc.save({op:'save',id:bullet.id,revision:1,name:bullet.name,sourceId:bullet.source_id,sourceVersion:bullet.source_version,category:bullet.category,description:'GM edited stats',priceGil:450,costText:'450 gil'});
  assert.equal(changed.revision,2);
  const again=await importApprovedShoppingBatch(db);
  assert.equal(again.state,'already-imported');
  assert.equal(db.prepare("SELECT COUNT(*) AS total FROM items WHERE source_id='ffd20-shopping'").get().total,8);
  assert.equal(svc.get(bullet.id).priceGil,450);
  assert.equal(svc.get(bullet.id).description,'GM edited stats');
  assert.equal(db.prepare('SELECT item_count FROM item_catalog_imports WHERE checksum=?').get(first.checksum).item_count,8);
 }finally{db.close();}
});

test('same-name legacy or admin-added items cannot be overwritten or duplicated by batch import',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const svc=createItemsService(db);
  const id=randomUUID();
  svc.save({op:'save',id,revision:0,name:'Vitality Ring',sourceId:'legacy-master',sourceVersion:'old',category:'Magic Items',description:'GM copy',priceGil:777});
  const out=await importApprovedShoppingBatch(db);
  assert.equal(out.count,7);
  assert.equal(out.skipped.length,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS total FROM items WHERE lower(name)='vitality ring'").get().total,1);
  assert.equal(svc.get(id).priceGil,777);
  assert.equal(svc.get(id).description,'GM copy');
 }finally{db.close();}
});
