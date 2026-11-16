import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {gunzipSync,gzipSync} from 'node:zlib';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createItemsService} from '../backend/items/service.mjs';
import {EXTRA_ITEM_SOURCES,validateExtraCatalog,importExtraItemCatalog} from '../backend/items/extra-sources.mjs';
import {buildExtraCatalog} from '../scripts/build-extra-item-catalog.mjs';
import {shopCatalogChoiceLabel,shopCatalogShortLabel,visibleShopCatalogs} from '../src/features/sheet/shop-catalogs.mjs';
import {catalogInventoryItem} from '../backend/items/inventory.mjs';

const sha='a'.repeat(40);
const examples={
 'pf1e-foundry':{'src/packs/pf-items/Abacus-hlLuwEeFdKf7OgFX.json':{
  _id:'hlLuwEeFdKf7OgFX',name:'Abacus',type:'loot',system:{
   description:{value:'<p><strong>Source</strong> Ultimate Equipment</p><p>Counting device.</p>'},
   weight:{value:2},price:2
  }}},
 'pf1e-pfdata':{'json/equipment_misc.json':{
  abacus:{name:'Abacus',description:['Counting device.'],sources:['Core Rulebook'],price:'2 gp'},
  not_found:{name:'Unknown',description:['Error']}
 }},
 'pf1e-openref':{'docs/data/books/ultimate-equipment/0.json':[
  {i:1,t:'section',n:'Rules',b:'Rules section'},
  {i:2,t:'item',n:'Abacus',b:'<p>Counting device.</p>',u:'items/abacus'}
 ]},
 'pf2e-pf2ools':{'data/core/Core Rulebook/weapon/Longsword.json':{
  type:'weapon',name:{display:'Longsword'},data:{price:'1 gp',entries:['One-handed sword.']}
 }},
 'pf2e-orc':{
  'data/items/item.healing-potion.json':{id:'item.healing-potion',type:'item',
   name:'item.healing-potion.name',text:'item.healing-potion.text',category:'consumable',
   level:1,priceCp:400,review:'auto'},
  'i18n/en.json':{'item.healing-potion.name':'Healing Potion','item.healing-potion.text':'Heals hit points'}
 },
 'pf2e-json':{'json/weapons-pf2.json':{
  name:'Pathfinder 2.0 Weapons list',date:'February 10, 2020',
  meleeWeapons:[{name:'Longsword',link:'https://2e.aonprd.com/Weapons.aspx?ID=20',
   category:'Martial',damage:'1d8 S',price:'1 gp',text:'A sturdy sword'}],
  rangedWeapons:[{name:'Shortbow',link:'https://2e.aonprd.com/Weapons.aspx?ID=75',
   category:'Martial',damage:'1d6 P',price:'3 gp',text:'A ranged bow'}]
 }}
};
async function createSource(root,files){
 for(const [path,data] of Object.entries(files)){
  const to=join(root,path);await mkdir(dirname(to),{recursive:true});
  await writeFile(to,JSON.stringify(data));
 }
}
test('all six formats stage item-only, source-specific, non-Gil catalogs',async()=>{
 const root=await mkdtemp(join(tmpdir(),'cosmos-extra-imports-'));
 const db=await openDatabase(':memory:');
 try{
  const items=createItemsService(db),id=randomUUID();
  items.save({op:'save',id,revision:0,name:'Abacus',sourceId:'legacy-master',sourceVersion:'gm',
   category:'Gear',description:'Player customization',priceGil:10});
  for(const [source,fixture] of Object.entries(examples)){
   const input=join(root,source),file=join(root,source+'.json.gz');
   await mkdir(input,{recursive:true});await createSource(input,fixture);
   const output=await buildExtraCatalog(source,input,sha,file);
   assert.ok(output.itemCount>0,source);
   assert.equal(output.sourceId,EXTRA_ITEM_SOURCES[source].sourceId);
   assert.ok(output.items.every(item=>item.priceGil===null));
   assert.ok(output.items.every(item=>item.sourceUrl.includes('/blob/'+sha+'/')));
   assert.equal(validateExtraCatalog(output,source).length,output.itemCount);
   const imported=await importExtraItemCatalog(db,source,{file});
   assert.equal(imported.count,output.itemCount,source);
   assert.equal((await importExtraItemCatalog(db,source,{file})).state,'already-imported');
   const records=items.list({sourceId:EXTRA_ITEM_SOURCES[source].sourceId}).items;
   assert.equal(records.length,output.itemCount,source);
   assert.equal(records[0].priceGil,null,source);
   const listing=items.listCatalogs({playerView:true});
   const label=listing.find(x=>x.sourceId===EXTRA_ITEM_SOURCES[source].sourceId);
   assert.equal(label?.shortLabel,EXTRA_ITEM_SOURCES[source].label);
  }
  assert.equal(items.get(id).description,'Player customization');
  assert.equal(items.get(id).priceGil,10);
  const foundry=items.list({sourceId:'pf1e-foundry'}).items[0];
  assert.equal(catalogInventoryItem(items.get(foundry.id),1).weight,2);
  assert.equal(items.list({sourceId:'pf1e-pfdata'}).items.length,1,'exclude error placeholder');
  assert.equal(items.list({sourceId:'pf1e-openref'}).items.length,1,'exclude rules sections');
  assert.equal(items.list({sourceId:'pf2e-orc',q:'Healing Potion'}).items[0].name,'Healing Potion','resolve ORC item i18n key');
  assert.equal(items.list({sourceId:'pf2e-json'}).items.length,2,'expand grouped legacy equipment tables');
  assert.equal(items.list({sourceId:'pf2e-json'}).items.filter(x=>x.category==='Ranged Weapon').length,1,'recognize ranged weapon group');
  assert.equal(items.list({sourceId:'pf2e-json'}).items.filter(x=>x.category==='Weapon').length,1,'recognize melee weapon group');
 }finally{db.close();await rm(root,{recursive:true,force:true});}
});
test('reject modified source links, false edition, malformed package and unsupported key',()=>{
 const sample={schemaVersion:'cosmos.extra-item-catalog.v1',sourceKey:'pf2e-orc',
  sourceId:'pf2e-orc',sourceSystem:'pathfinder-2e',version:sha,itemCount:1,items:[{
  itemKey:'abc123',name:'Healing Potion',sourceId:'pf2e-orc',
  sourceSystem:'pathfinder-2e',sourceVersion:sha,category:'Consumables',
  sourceUrl:'https://github.com/TiMarron/orc-rules-data/blob/'+sha+'/data/items/item.healing-potion.json',
  detailUrl:'https://github.com/TiMarron/orc-rules-data/blob/'+sha+'/data/items/item.healing-potion.json',
  description:'Heals',originalPriceText:'4 gp',priceGil:null
 }]};
 assert.equal(validateExtraCatalog(sample,'pf2e-orc').length,1);
 assert.throws(()=>validateExtraCatalog({...sample,items:sample.items.map(x=>({...x,priceGil:4}))},'pf2e-orc'),/Invalid item/);
 assert.throws(()=>validateExtraCatalog({...sample,items:sample.items.map(x=>({...x,sourceUrl:'https://evil.invalid'}))},'pf2e-orc'),/Invalid item/);
 assert.throws(()=>validateExtraCatalog({...sample,sourceSystem:'pathfinder-1e'},'pf2e-orc'),/header/);
 assert.throws(()=>validateExtraCatalog(sample,'nonexistent'),/header/);
});
test('shop labels are concise and versions group while unrelated small catalogs remain hidden',()=>{
 const a={sourceId:'pf2e-orc',sourceVersion:sha,id:'pf2e-orc~'+sha,count:2};
 const b={sourceId:'pf2e-orc',sourceVersion:'b'.repeat(40),id:'pf2e-orc~'+'b'.repeat(40),count:3};
 assert.equal(shopCatalogShortLabel(a),'PF2e · ORC');
 assert.equal(shopCatalogChoiceLabel(a,[a,b]),'PF2e · ORC');
 const visible=visibleShopCatalogs([a,b,{sourceId:'test-small',sourceVersion:'v1',id:'test-small~v1',count:2}]);
 assert.equal(visible.length,1);
 assert.equal(visible[0].count,5);
 assert.equal(visible[0].catalogIds.length,2);
});
