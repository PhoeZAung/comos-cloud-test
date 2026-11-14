import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
import {openDatabase} from '../backend/db/database.mjs';
import {createItemsService} from '../backend/items/service.mjs';
import {catalogInventoryItem} from '../backend/items/inventory.mjs';
import {PF2E_UPSTREAM_SHA,PF2E_SOURCE_VERSION,validatePf2eCatalog,importPf2eCatalog} from '../backend/items/pf2e-offline.mjs';
import {convertFoundryEquipment,makeCatalog,readableDescription} from '../scripts/build-pf2e-catalog.mjs';
import {shopSourceForItem,shopSourceSql,SHOP_SOURCES} from '../src/features/sheet/shop-sources.mjs';

const potion={_id:'e0vSAQfxhHauiAoD',name:'Healing Potion (Lesser)',type:'consumable',
 system:{bulk:{value:0.1},category:'potion',damage:{formula:'2d8+5',kind:'healing',type:'vitality'},
  description:{value:'<p>When consumed, regain @Damage[(2d8+5)[healing]] Hit Points.</p>'},
  level:{value:3},price:{value:{gp:12}},traits:{rarity:'common',value:['consumable','healing','potion']},
  publication:{title:'Pathfinder GM Core',license:'ORC',remaster:true},usage:{value:'held-in-one-hand'}}};
const sword={_id:'LJdbVTOZog39EEbi',name:'Longsword',type:'weapon',
 system:{damage:{dice:1,die:'d8',damageType:'slashing'},description:{value:'<p>A sword.</p>'},price:{value:{gp:1}},
 traits:{value:['versatile-p'],rarity:'common'},level:{value:0},bulk:{value:1},category:'martial'}};
const armor={_id:'Kf4eJEXnFPuAsseP',name:'Chain Mail',type:'armor',
 system:{acBonus:4,dexCap:1,checkPenalty:-2,bulk:{value:2},price:{value:{gp:6}},
  description:{value:'<p>Armor.</p>'},level:{value:0},traits:{rarity:'common',value:[]}}};
const fixtures=[['healing-potion-lesser.json',potion],['longsword.json',sword],['chain-mail.json',armor]];
test('Foundry PF2e conversion captures description, healing dice, price and pinned link',()=>{
 const p=convertFoundryEquipment(potion,'healing-potion-lesser.json');
 assert.equal(p.name,'Healing Potion (Lesser)');
 assert.equal(p.category,'Consumables');assert.equal(p.healing,'2d8+5');assert.equal(p.effect,'Heals 2d8+5 HP');
 assert.equal(p.originalPriceText,'12 gp');assert.equal(p.priceGil,null);
 assert.ok(p.description.includes('2d8+5 healing'));
 assert.ok(p.sourceUrl.includes(PF2E_UPSTREAM_SHA));assert.ok(p.sourceUrl.endsWith('healing-potion-lesser.json'));
 assert.ok(p.details.some(d=>d.name==='Level'&&d.val==='3'));
 assert.equal(readableDescription('<p><b>Hello</b> &amp; good!</p>'),'Hello & good!');
 assert.equal(convertFoundryEquipment({_id:'INVALID',name:'bad',system:{},type:'weapon'},'bad.json'),null);
});
test('weapon and armor populate Cosmos fields without treating PF2e Bulk as pounds',()=>{
 const converted=makeCatalog(fixtures);
 const dbItems=converted.items.map(row=>({name:row.name,sourceId:row.sourceId,category:row.category,
  description:row.description,costText:row.originalPriceText,catalog:row}));
 const sw=catalogInventoryItem(dbItems.find(x=>x.name==='Longsword'),1);
 assert.equal(sw.dmg,'1d8');assert.equal(sw.damageType,'slashing');assert.equal(sw.cost,'1 gp');
 assert.equal(sw.shopSource,'pathfinder-2e');
 const ch=catalogInventoryItem(dbItems.find(x=>x.name==='Chain Mail'),1);
 assert.equal(ch.acBonus,'4');assert.equal(ch.maxDex,'1');assert.equal(ch.checkPenalty,'-2');
 assert.equal(ch.weight,undefined,'PF2e bulk must not be converted to pounds');
 const p=catalogInventoryItem(dbItems.find(x=>x.name==='Healing Potion (Lesser)'),2);
 assert.equal(p.effect,'Heals 2d8+5 HP');assert.equal(p.amount,2);
});
test('PF2e importer isolates sources and preserves same-named PF1e or GM items',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'cosmos-pf2e-'));
 const file=join(directory,'pf2e.json.gz');
 const db=await openDatabase(':memory:');
 try{
  const catalog=makeCatalog(fixtures);
  assert.equal(catalog.version,PF2E_SOURCE_VERSION);assert.equal(catalog.itemCount,3);
  assert.equal(validatePf2eCatalog(catalog).length,3);
  await writeFile(file,gzipSync(Buffer.from(JSON.stringify(catalog))));
  const svc=createItemsService(db),id=randomUUID();
  svc.save({op:'save',id,revision:0,name:'Longsword',sourceId:'pathfinder-shopping',sourceVersion:'GM',category:'Weapon',description:'Custom PF1e',priceGil:50});
  const out=await importPf2eCatalog(db,{file});
  assert.equal(out.count,3);
  assert.equal((await importPf2eCatalog(db,{file})).state,'already-imported');
  assert.equal(svc.list({shopSource:'pathfinder-2e'}).items.length,3);
  assert.equal(svc.list({shopSource:'pathfinder-1e'}).items.length,1);
  assert.equal(svc.get(id).description,'Custom PF1e');
  assert.equal(svc.list({shopSource:'cosmos'}).items.length,0);
  const p=svc.list({shopSource:'pathfinder-2e',q:'Healing Potion'}).items[0];
  assert.equal(p.costText,'12 gp');assert.equal(p.priceGil,null);
  assert.equal(catalogInventoryItem(svc.get(p.id),1).effect,'Heals 2d8+5 HP');
  assert.equal(SHOP_SOURCES.length,4);
  assert.equal(shopSourceForItem({sourceId:'pathfinder-2e-shopping'}),'pathfinder-2e');
  assert.equal(shopSourceSql('pathfinder-2e').params[0],'pathfinder-2e-shopping');
  assert.throws(()=>shopSourceSql('pathfinder-3e'),/Invalid/);
 }finally{db.close();await rm(directory,{recursive:true,force:true});}
});
test('tampered PF2e catalog fails closed without database writes',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const data=makeCatalog(fixtures);
  const altered={...data,items:data.items.map((x,i)=>i===0?{...x,sourceUrl:'https://evil.invalid/item'}:x)};
  assert.throws(()=>validatePf2eCatalog(altered),/Invalid PF2e catalog item/);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM items WHERE source_id='pathfinder-2e-shopping'").get().n,0);
 }finally{db.close();}
});
