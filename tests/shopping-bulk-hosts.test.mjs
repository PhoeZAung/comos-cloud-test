import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {openDatabase} from '../backend/db/database.mjs';
import {importBulkShoppingBatch,validateBulkShoppingBatch} from '../backend/items/bulk-shopping.mjs';

const batch=JSON.parse(await readFile(new URL('../backend/items/catalog/shopping-bulk-02.json',import.meta.url),'utf8'));

test('shipped 88-row bulk catalog accepts both official FFd20 host variants',()=>{
 const rows=validateBulkShoppingBatch(batch);
 assert.equal(rows.length,88);
 assert.ok(rows.some(row=>row.detailUrl.startsWith('https://www.finalfantasyd20.com/')));
 assert.ok(rows.some(row=>row.sourceUrl.startsWith('https://finalfantasyd20.com/')));
 assert.ok(rows.some(row=>row.sourceUrl.startsWith('https://www.aonprd.com/')));
});

test('bulk importer starts with the exact checked-in catalog and is idempotent',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const result=await importBulkShoppingBatch(db);
  assert.equal(result.state,'imported');
  assert.ok(result.count>0);
  assert.equal((await importBulkShoppingBatch(db)).state,'already-imported');
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM items WHERE source_id IN ('ffd20-shopping','pathfinder-shopping')").get().n,result.count);
 }finally{db.close();}
});

test('bulk importer still rejects unapproved URL hosts',()=>{
 for(const field of ['sourceUrl','detailUrl']){
  const tampered=structuredClone(batch);
  tampered.items[0][field]='https://example.org/other-item';
  assert.throws(()=>validateBulkShoppingBatch(tampered),/Unsupported source URL/);
 }
});
