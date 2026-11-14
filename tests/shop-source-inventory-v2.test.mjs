import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createItemsService} from '../backend/items/service.mjs';
import {catalogInventoryItem} from '../backend/items/inventory.mjs';
import {SHOP_ITEM_CATEGORY_GROUPS,inventoryCategoryCounts,renderCategoryTiles} from '../src/features/sheet/item-categories.mjs';
import {shopSourceForItem,shopSourceSql,SHOP_SOURCES} from '../src/features/sheet/shop-sources.mjs';
import {sourceCategorySuggestions} from '../src/features/sheet/source-categories.mjs';
import {inventoryEditorKeys,inventorySourceFields,inventoryItemDetails} from '../src/features/sheet/inventory-fields.mjs';

test('nine high-level groups preserve legacy item tags for existing characters',()=>{
 assert.equal(Object.keys(SHOP_ITEM_CATEGORY_GROUPS).length,9);
 assert.deepEqual(SHOP_ITEM_CATEGORY_GROUPS['Weapons & Ammunition'],['Weapon','Ranged Weapon','Ammunition']);
 const counts=inventoryCategoryCounts([{sourceCategory:'Weapon'},{sourceCategory:'Alchemical Items'}]);
 const html=renderCategoryTiles(counts,'All',{groups:true});
 assert.match(html,/Weapons &amp; Ammunition/);
 assert.match(html,/Consumables/);
 assert.equal(counts.Weapon,1);
 assert.equal(counts['Alchemical Items'],1);
});

test('shop sources use strict source identity rather than name collisions',()=>{
 assert.deepEqual(SHOP_SOURCES.map(x=>x.id),['cosmos','pathfinder-1e','ffd20']);
 assert.equal(shopSourceForItem({sourceId:'pathfinder-shopping'}),'pathfinder-1e');
 assert.equal(shopSourceForItem({sourceId:'ffd20-shopping'}),'ffd20');
 assert.equal(shopSourceForItem({sourceId:'legacy-master'}),'cosmos');
 assert.equal(shopSourceSql('pathfinder-1e').params[0],'pathfinder-shopping');
 assert.throws(()=>shopSourceSql("ffd20' OR 1=1"),/Invalid/);
});

test('source taxonomy suggestions include downloaded PF1e weapon, armor and equipment subpages',()=>{
 const names=sourceCategorySuggestions('pathfinder-1e');
 assert.ok(names.includes('Weapons — Simple'));
 assert.ok(names.includes('Armor — Shield'));
 assert.ok(names.includes('Miscellaneous Equipment — AlchemicalRemedies'));
 assert.ok(names.includes('Magic Armor — SpecificShield'));
 assert.ok(sourceCategorySuggestions('ffd20').includes('Chocobo Food'));
});

test('all original site column labels and values stay readable and individually editable',()=>{
 const row={shopSource:'pathfinder-1e',sourceCategory:'Weapon',sourceCategoryDetail:'Weapons — Simple',link:'https://www.aonprd.com/EquipmentWeapons.aspx?Proficiency=Simple',
  sourceCatalog:{raw:{'Name':'Dagger','Dmg (S)':'1d3','Dmg (M)':'1d4','Critical':'19–20/x2','Source (Possible Spoilers)':'Core Rulebook'}},
  sourceFields:{'Dmg (M)':'1d6'}};
 const fields=inventorySourceFields(row);
 assert.equal(fields['Dmg (S)'],'1d3');
 assert.equal(fields['Dmg (M)'],'1d6');
 assert.equal(fields['Source (Possible Spoilers)'],'Core Rulebook');
 const facts=inventoryItemDetails(row);
 assert.ok(facts.some(([k,v])=>k==='Source: Dmg (S)'&&v==='1d3'));
 for(const field of ['shopSource','sourceCategoryDetail','link'])assert.ok(inventoryEditorKeys('Weapon').includes(field));
});

test('catalog purchase copies a source identity and original source link without mapping PF1e gp to gil',()=>{
 const item={id:randomUUID(),name:'Pathfinder Healing Potion',sourceId:'pathfinder-shopping',category:'Consumables',
   description:'Restores HP',costText:'12 gp',priceGil:null,catalog:{id:'pf1e:potion',sourceUrl:'https://www.aonprd.com/MagicPotions.aspx',originalCategory:'Potions/Oils',raw:{'Name':'Potion','Cost':'12 gp'}}};
 const row=catalogInventoryItem(item,2);
 assert.equal(row.shopSource,'pathfinder-1e');
 assert.equal(row.sourceCategoryDetail,'Potions/Oils');
 assert.equal(row.link,'https://www.aonprd.com/MagicPotions.aspx');
 assert.equal(row.sourceCatalog.raw.Cost,'12 gp');
 assert.equal(row.amount,2);
});

test('catalog API can filter sources and grouped categories without touching stored categories',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const svc=createItemsService(db);
  for(const [name,id,category] of [['Legacy dagger','legacy-master','Weapon'],['Pathfinder dagger','pathfinder-shopping','Weapon'],['FFd20 machine','ffd20-shopping','Machine']]){
   svc.save({op:'save',id:randomUUID(),revision:0,name,sourceId:id,sourceVersion:'test',category,description:'Test item',priceGil:null});
  }
  assert.equal(svc.list({shopSource:'cosmos'}).items.length,1);
  assert.equal(svc.list({shopSource:'pathfinder-1e'}).items.length,1);
  assert.equal(svc.list({shopSource:'ffd20'}).items.length,1);
  assert.equal(svc.list({shopSource:'all',category:'Weapons & Ammunition'}).items.length,2);
  assert.equal(svc.list({shopSource:'all',category:'Tools'}).items.length,3);
  assert.equal(svc.categories('pathfinder-1e').reduce((sum,row)=>sum+row.count,0),1);
  assert.throws(()=>svc.categories('x'),/Invalid/);
 }finally{db.close();}
});
