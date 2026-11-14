import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createItemsService} from '../backend/items/service.mjs';
import {catalogInventoryItem} from '../backend/items/inventory.mjs';
import {itemWeightLb,inventoryItemValue} from '../src/features/sheet/inventory-fields.mjs';
import {carryingCapacity,carriedWeight} from '../src/features/sheet/carrying.mjs';

test('shop and carrying capacity use the same pounds, including fractions and explicit kilograms',()=>{
 assert.equal(itemWeightLb('1/2 lb'),0.5);
 assert.equal(itemWeightLb('1 1/2 lbs'),1.5);
 assert.equal(itemWeightLb('2.25 lb'),2.25);
 assert.equal(itemWeightLb('1 kg'),2.2046);
 assert.equal(itemWeightLb('100'),100);
 assert.equal(itemWeightLb(0.5),0.5);
 for(const bad of ['L','-','—','1 Bulk','not set','1 stone','-2 lb'])assert.equal(itemWeightLb(bad),null,bad);
 assert.equal(inventoryItemValue({catalog:{bulk:'L',raw:{Bulk:'L'}}},'weight'),undefined);
 assert.equal(inventoryItemValue({catalog:{raw:{Weight:'1/2 lb'}}},'weight'),0.5);
});

test('source-weight displayed on a shop row survives purchase and increases capacity by quantity',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const id=randomUUID(),name='Half pound sample';
  db.prepare('INSERT INTO items(id,name,source_id,source_version,category,description,price_units,cost_text,catalog_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(
   id,name,'pathfinder-shopping','aon-v1','Gear','Source item',1200,'12 gp',JSON.stringify({raw:{Weight:'1/2 lb'},sourceUrl:'https://www.aonprd.com/'}),'2026-11-14','2026-11-14'
  );
  const svc=createItemsService(db);
  const listed=svc.list({catalogs:['pathfinder-shopping~aon-v1']}).items;
  assert.equal(listed.length,1);
  assert.equal(listed[0].weightLb,0.5);
  const item=svc.get(id);
  const bought=catalogInventoryItem(item,3);
  assert.equal(bought.weight,0.5);
  assert.equal(bought.amount,3);
  assert.equal(carriedWeight({items:[bought]}).total,1.5);
  assert.equal(carryingCapacity({str:10,size_category:'Medium',items:[bought]}).weight,1.5);
 }finally{db.close();}
});
