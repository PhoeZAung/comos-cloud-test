import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openDatabase} from '../backend/db/database.mjs';
import {createItemsService} from '../backend/items/service.mjs';
import {catalogInventoryItem} from '../backend/items/inventory.mjs';
import {validatePf1eOfflineCatalog,importPf1eOfflineCatalog} from '../backend/items/pf1e-offline.mjs';

const dagger={
 id:'pf1e:1234567890abcdef1234567890ab',name:'Aklys',originalName:'Aklys',
 category:'Ranged Weapon',sourceSystem:'pathfinder-1e',sourceId:'pathfinder-shopping',
 sourceUrl:'https://www.aonprd.com/EquipmentWeapons.aspx?Proficiency=Exotic',
 detailUrl:'https://www.aonprd.com/EquipmentWeaponsDisplay.aspx?ItemName=Aklys',
 sourceCategoryDetail:'Weapons — Exotic',sourcePageId:'page-044-EquipmentWeapons-aspx',
 sourceTableId:'page-044-EquipmentWeapons-aspx-table-01',sourceRowNumber:2,
 originalPriceText:'5 gp',originalCurrency:'gp',priceGil:null,
 description:'PF1e Archives of Nethys item index entry.',mechanicsMode:'informational-only',
 raw:{Name:'Aklys',Cost:'5 gp','Dmg (S)':'1d4','Dmg (M)':'1d6',Critical:'x2',Range:'20 ft.',Weight:'2 lbs.',Type:'B',Special:'performance, trip',Unrecognized:'Keep this'},
 cost:'5 gp',dmg:'1d6',dmgM:'1d6',dmgS:'1d4',crit:'x2',range:'20 ft.',weightText:'2 lbs.',
 damage:'1d6',proficiency:'Exotic',type:'B',special:'performance, trip',otherListings:[]
};
const sha=buf=>createHash('sha256').update(buf).digest('hex');
const makeFixture=async(items=[dagger])=>{
 const directory=await mkdtemp(path.join(tmpdir(),'cosmos-pf1e-'));
 const file=path.join(directory,'pf1e.json.gz');
 const data={schemaVersion:'cosmos.pf1e-offline-catalog.v1',version:'fixture-v1',sourceSystem:'pathfinder-1e',
  sourcePagesInArchive:96,itemCandidateOccurrences:items.length,items};
 const bytes=Buffer.from(JSON.stringify(data));
 const zipped=gzipSync(bytes);
 await writeFile(file,zipped);
 const manifest={version:'fixture-v1',sourcePages:96,itemCandidateOccurrences:items.length,itemCount:items.length,sha256:sha(bytes),compressedSha256:sha(zipped)};
 return {file,manifest,cleanup:()=>rm(directory,{recursive:true,force:true})};
};

test('PF1e archive validates original named table columns, provenance and unconverted gp',async()=>{
 const {file,manifest,cleanup}=await makeFixture();
 try{
  const items=validatePf1eOfflineCatalog({schemaVersion:'cosmos.pf1e-offline-catalog.v1',version:manifest.version,sourceSystem:'pathfinder-1e',sourcePagesInArchive:96,itemCandidateOccurrences:1,items:[dagger]},manifest);
  assert.equal(items.length,1);
  assert.equal(items[0].priceGil,null);
  assert.equal(items[0].raw['Dmg (M)'],'1d6');
  assert.equal(items[0].sourceCategoryDetail,'Weapons — Exotic');
  assert.throws(()=>validatePf1eOfflineCatalog({schemaVersion:'cosmos.pf1e-offline-catalog.v1',version:manifest.version,sourceSystem:'pathfinder-1e',sourcePagesInArchive:96,itemCandidateOccurrences:1,items:[{...dagger,priceGil:5}]},manifest),/Invalid offline PF1e/);
  const db=await openDatabase(':memory:');
  try{
   const first=await importPf1eOfflineCatalog(db,{file,manifest});
   assert.equal(first.state,'imported');assert.equal(first.count,1);
   assert.equal((await importPf1eOfflineCatalog(db,{file,manifest})).state,'already-imported');
   const svc=createItemsService(db),item=svc.list({shopSource:'pathfinder-1e'}).items[0];
   assert.equal(item.name,'Aklys');
   assert.equal(item.priceGil,null);
   assert.equal(item.costText,'5 gp');
   assert.equal(svc.list({shopSource:'cosmos'}).items.length,0);
   const purchased=catalogInventoryItem(svc.get(item.id),2);
   assert.equal(purchased.shopSource,'pathfinder-1e');
   assert.equal(purchased.sourceCategory,'Ranged Weapon');
   assert.equal(purchased.sourceCategoryDetail,'Weapons — Exotic');
   assert.equal(purchased.proficiency,'Exotic');
   assert.equal(purchased.dmg,'1d6');
   assert.equal(purchased.dmgS,'1d4');
   assert.equal(purchased.crit,'x2');
   assert.equal(purchased.range,'20 ft.');
   assert.equal(purchased.weight,2);
   assert.equal(purchased.amount,2);
   assert.equal(purchased.cost,'5 gp');
   assert.equal(purchased.link,dagger.detailUrl);
   assert.equal(purchased.sourceFields['Dmg (M)'],'1d6');
   assert.equal(purchased.sourceFields.Unrecognized,'Keep this');
   assert.equal(purchased.sourceCatalog.raw.Unrecognized,'Keep this');
  }finally{db.close();}
 }finally{await cleanup();}
});

test('offline import does not overwrite older PF1e item edits or merge another game system by name',async()=>{
 const {file,manifest,cleanup}=await makeFixture();
 const db=await openDatabase(':memory:');
 try{
  const svc=createItemsService(db),id=randomUUID();
  svc.save({op:'save',id,revision:0,name:'Aklys',sourceId:'legacy-master',sourceVersion:'GM',category:'Weapon',description:'GM value',priceGil:10});
  const out=await importPf1eOfflineCatalog(db,{file,manifest});
  assert.equal(out.count,1,'same-name Cosmos item is a different source');
  assert.equal(svc.get(id).description,'GM value');
  assert.equal(svc.list({shopSource:'pathfinder-1e'}).items.length,1);
 }finally{db.close();await cleanup();}
});

test('tampered offline data fails closed without importing any PF1e rows',async()=>{
 const {file,manifest,cleanup}=await makeFixture();
 const db=await openDatabase(':memory:');
 try{
  await assert.rejects(importPf1eOfflineCatalog(db,{file,manifest:{...manifest,sha256:'0'.repeat(64)}}),/checksum mismatch/);
  assert.equal(svcCount(db),0);
 }finally{db.close();await cleanup();}
});
const svcCount=db=>db.prepare("SELECT count(*) AS n FROM items WHERE source_id='pathfinder-shopping'").get().n;

test('armor autofill uses PF1e armor table names without discarding original fields',()=>{
 const item={id:randomUUID(),name:'Scale Mail',sourceId:'pathfinder-shopping',category:'Armor',description:'Armor',
  priceGil:null,costText:'50 gp',catalog:{sourceCategoryDetail:'Armor — Medium',sourceUrl:'https://www.aonprd.com/EquipmentArmor.aspx?Category=Medium',
  raw:{Name:'Scale Mail',Cost:'50 gp',Weight:'30 lbs.','Armor Bonus':'+5','Max Dex Bonus':'+3','Armor Check Penalty':'-4','Arcane Spell Failure Chance':'25%','Speed (30 ft.)':'20 ft.','Speed (20 ft.)':'15 ft.'}}};
 const row=catalogInventoryItem(item,1);
 assert.equal(row.sourceCategory,'Armor');assert.equal(row.acBonus,'+5');assert.equal(row.maxDex,'+3');assert.equal(row.checkPenalty,'-4');assert.equal(row.spellFailure,'25%');assert.equal(row.speed30Ft,'20 ft.');assert.equal(row.speed20Ft,'15 ft.');assert.equal(row.weight,30);
 assert.equal(row.sourceFields['Arcane Spell Failure Chance'],'25%');
});
