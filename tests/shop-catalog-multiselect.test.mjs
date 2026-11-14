import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {openDatabase} from '../backend/db/database.mjs';
import {createItemsService} from '../backend/items/service.mjs';
import {catalogKey,parseCatalogKey,shopCatalogLabel,shopCatalogShortLabel,shopCatalogChoiceLabel,visibleShopCatalogs} from '../src/features/sheet/shop-catalogs.mjs';

test('each PF1e upstream origin has its own human-readable catalog identity',()=>{
 const aon={sourceId:'pathfinder-shopping',sourceVersion:'aon-v1'};
 const foundry={sourceId:'pf1e-github-baileymh',sourceVersion:'foundry-1',catalog:{sourceSystem:'pathfinder-1e',sourceUrl:'https://github.com/baileymh/pf1e-content/blob/main/src/packs/pf-items/Abacus.json'}};
 const github={sourceId:'pf1e-github-jasontankapps',sourceVersion:'github-1',catalog:{sourceSystem:'pathfinder-1e',sourceUrl:'https://github.com/jasontankapps/pathfinder-data-1-e/blob/master/json/magic_ring.json'}};
 assert.match(shopCatalogLabel(aon),/Pathfinder 1e · Archives of Nethys/);
 assert.match(shopCatalogLabel(foundry),/Pathfinder 1e · GitHub \(baileymh\/pf1e-content\)/);
 assert.match(shopCatalogLabel(github),/Pathfinder 1e · GitHub \(jasontankapps\/pathfinder-data-1-e\)/);
 assert.notEqual(catalogKey(foundry.sourceId,foundry.sourceVersion),catalogKey(github.sourceId,github.sourceVersion));
 assert.deepEqual(parseCatalogKey(catalogKey(foundry.sourceId,foundry.sourceVersion)),{sourceId:foundry.sourceId,sourceVersion:foundry.sourceVersion});
 for(const invalid of ['', 'a~','~b','a~b~c','a~b;DROP TABLE items'])assert.equal(parseCatalogKey(invalid),null);
});

test('multi-select catalogs combine only selected origins and group categories for the selection',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const svc=createItemsService(db);
  const data=[
   ['AON rope','pathfinder-shopping','aon-v1','Gear','https://www.aonprd.com/EquipmentMiscDisplay.aspx?ItemName=Rope'],
   ['Bailey sword','pf1e-github-baileymh','foundry-1','Weapon','https://github.com/baileymh/pf1e-content/blob/main/src/packs/pf-items/test.json'],
   ['Jason ring','pf1e-github-jasontankapps','github-1','Magic Items','https://github.com/jasontankapps/pathfinder-data-1-e/blob/main/json/magic_ring.json'],
   ['Foundry potion','pathfinder-2e-shopping','foundry-pf2e-8.7.0','Consumables','https://github.com/foundryvtt/pf2e/blob/main/packs/pf2e/equipment/healing-potion-lesser.json']
  ];
  for(const [name,sourceId,sourceVersion,category,sourceUrl] of data){
   svc.save({op:'save',id:randomUUID(),revision:0,name,sourceId,sourceVersion,category,description:'Sample',priceGil:null,sourceUrl});
  }
  const catalogs=svc.listCatalogs();
  assert.equal(catalogs.length,4);
  assert.ok(catalogs.some(x=>/Archives of Nethys/.test(x.label)));
  assert.ok(catalogs.some(x=>/baileymh\/pf1e-content/.test(x.label)));
  assert.ok(catalogs.some(x=>/jasontankapps\/pathfinder-data-1-e/.test(x.label)));
  assert.ok(catalogs.some(x=>/Foundry \(foundryvtt\/pf2e\)/.test(x.label)));
  const selected=[catalogKey('pf1e-github-baileymh','foundry-1'),catalogKey('pf1e-github-jasontankapps','github-1')];
  assert.deepEqual(svc.list({catalogs:selected}).items.map(x=>x.name).sort(),['Bailey sword','Jason ring']);
  assert.equal(svc.categories('all',selected).reduce((sum,row)=>sum+row.count,0),2);
  assert.equal(svc.list({catalogs:[]}).items.length,0);
  assert.equal(svc.list().items.length,4,'legacy callers may still browse without explicit selections');
  assert.throws(()=>svc.list({catalogs:['pf1e-github-baileymh~foundry-1 OR 1=1']}),/Invalid catalog selection/);
  assert.throws(()=>svc.categories('all',['bad']),/Invalid catalog selection/);
 }finally{db.close();}
});

test('player catalog picker opens empty and supports one or more chosen catalogs',async()=>{
 const source=await readFile('src/ui/inventory-shop-picker.mjs','utf8');
 assert.match(source,/chosen=new Set\(\)/);
 assert.match(source,/Choose Shop to browse items/);
 assert.match(source,/data-picker-catalog/);
 assert.match(source,/chosen\.has\(key\)\)chosen\.delete\(key\);else chosen\.add\(key\)/);
 assert.match(source,/for\(const id of ids\)params\.append\('catalog',id\)/);
 assert.match(source,/\/api\/v1\/item-catalog\/catalogs/);
});


test('short shop labels remain clear across providers and repeated versions',()=>{
 const aon={id:'aon-one',sourceId:'pathfinder-shopping',sourceVersion:'aon-v1'};
 const foundry={id:'foundry-one',sourceId:'pathfinder-2e-shopping',sourceVersion:'foundry-8.7.0'};
 const github={id:'github-one',sourceId:'pf1e-github-baileymh',sourceVersion:'github-1',catalog:{sourceSystem:'pathfinder-1e',sourceUrl:'https://github.com/baileymh/pf1e-content/blob/main/README.md'}};
 assert.equal(shopCatalogShortLabel(aon),'PF1e · AoN');
 assert.equal(shopCatalogShortLabel(foundry),'PF2e · Foundry');
 assert.equal(shopCatalogShortLabel(github),'PF1e · baileymh');
 assert.equal(shopCatalogShortLabel({sourceId:'legacy-master'}),'Cosmos');
 assert.equal(shopCatalogChoiceLabel(aon,[aon,foundry,github]),'PF1e · AoN');
 const other={id:'aon-two',sourceId:'pathfinder-shopping',sourceVersion:'aon-v2'};
 assert.notEqual(shopCatalogChoiceLabel(aon,[aon,other]),shopCatalogChoiceLabel(other,[aon,other]));
});

test('minimal shop UI uses a popup and custom item stands beside shop selection',async()=>{
 const src=await readFile('src/ui/inventory-shop-picker.mjs','utf8');
 assert.match(src,/data-picker-shop-toggle/);
 assert.match(src,/cs-shop-tag-dialog/);
 assert.match(src,/shopPanel\.showModal\(\)/);
 assert.match(src,/aria-haspopup=/);
 assert.match(src,/data-picker-shop-done/);
 assert.match(src,/data-custom-item/);
 assert.match(src,/groups:false,iconOnly:true/);
 assert.doesNotMatch(src,/Choose shops · select one or more catalogs/);
 const sheet=await readFile('src/ui/sheet.mjs','utf8');
 assert.match(sheet,/catalogMechanicalFacts\(\{\.\.\.item,catalog:item\.sourceCatalog/);
 assert.match(sheet,/const common=imported\?parts\.common\.map/);
 assert.match(sheet,/imported\?'<details class="cs-inventory-advanced-source"/);
});


test('player shop hides tiny catalogs but groups AoN and Foundry versions under clean tags',()=>{
 const catalogs=[
  {id:'legacy-master~main',sourceId:'legacy-master',sourceVersion:'main',shortLabel:'Cosmos',count:5604},
  {id:'pathfinder-shopping~offline-v1',sourceId:'pathfinder-shopping',sourceVersion:'offline-v1',shortLabel:'PF1e · AoN',count:7500},
  {id:'pathfinder-shopping~old-v1',sourceId:'pathfinder-shopping',sourceVersion:'old-v1',shortLabel:'PF1e · AoN',count:62},
  {id:'pathfinder-2e-shopping~foundry-v1',sourceId:'pathfinder-2e-shopping',sourceVersion:'foundry-v1',shortLabel:'PF2e · Foundry',count:5700},
  {id:'other-one~v1',sourceId:'other-one',sourceVersion:'v1',shortLabel:'Small one',count:8},
  {id:'other-two~v1',sourceId:'other-two',sourceVersion:'v1',shortLabel:'Small two',count:12},
  {id:'other-three~v1',sourceId:'other-three',sourceVersion:'v1',shortLabel:'Small three',count:30},
  {id:'pf1e-github-test~v1',sourceId:'pf1e-github-test',sourceVersion:'v1',shortLabel:'PF1e · test',count:400}
 ];
 const visible=visibleShopCatalogs(catalogs);
 assert.deepEqual(visible.map(c=>c.label),['Cosmos','PF1e · AoN','PF2e · Foundry','PF1e · test']);
 assert.deepEqual(visible.find(c=>c.label==='PF1e · AoN').catalogIds,['pathfinder-shopping~offline-v1','pathfinder-shopping~old-v1']);
 assert.equal(visible.find(c=>c.label==='PF1e · AoN').count,7562);
 assert.ok(visible.every(c=>!c.label.includes('offline')));
});

test('shop selection is remembered per character and custom item details stay minimal',async()=>{
 const picker=await readFile('src/ui/inventory-shop-picker.mjs','utf8');
 assert.match(picker,/rememberedShopTags\.set\(root,selection\)/);
 assert.match(picker,/shopSelectionKey/);
 assert.match(picker,/restoreTags\(\);paintSources\(\)/);
 const sheet=await readFile('src/ui/sheet.mjs','utf8');
 assert.match(sheet,/shopSelectionKey:id/);
 assert.match(sheet,/\['amount','cost','weight'\]/);
 assert.match(sheet,/imported\?\['carried'\]:\[\]/);
});
