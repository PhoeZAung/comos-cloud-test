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
  abacus:{name:'Abacus',description:['## Abacus','‹SOURCE Ultimate Equipment/77›',
   '**Price** 2 gp; **Weight** 2 lbs.','Counting device.'],sources:['Core Rulebook']},
  not_found:{name:'Unknown',description:['Error']}
 }},
 'pf1e-openref':{'docs/data/books/ultimate-equipment/0.json':[
  {i:1,t:'section',n:'Rules',b:'Rules section'},
  {i:2,t:'item',n:'Abacus',b:'<p>Counting device.</p>',u:'items/abacus',
   x:{item_details:{price:'2 gp',weight:'2 lbs.'}}},
  {i:3,t:'item',n:'Agile Breastplate',b:'<p>Armored breastplate.</p>',
   x:{item_details:{price:'400 gp',weight:'25 lbs.'},item_misc:[
    {field:'Armor Bonus',value:'+6'}, {field:'MaxDex Bonus',value:'+3'},
    {field:'Arcane SpellFailure Chance',value:'25%'},
    {field:'ArmorCheck Penalty',value:'-4'}]}}
 ]},
 'pf2e-pf2ools':{'data/core/Core Rulebook/weapon/Longsword.json':{
  type:'weapon',name:{display:'Longsword'},data:{price:'1 gp',entries:['One-handed sword.']}
 }},
 'pf2e-orc':{
  'data/items/item.healing-potion.json':{id:'item.healing-potion',type:'item',
   name:'item.healing-potion.name',text:'item.healing-potion.text',category:'consumable',
   level:1,priceCp:400,review:'auto'},
  'data/items/item.longsword.json':{id:'item.longsword',type:'item',name:'item.longsword.name',
   text:'item.longsword.text',category:'weapon',priceCp:100,bulk:'1',
   weapon:{category:'martial',damage:{dice:'1d8',type:'slashing'}}},
  'data/items/item.shortbow.json':{id:'item.shortbow',type:'item',name:'item.shortbow.name',
   text:'item.shortbow.text',category:'weapon',priceCp:300,bulk:'1',
   weapon:{category:'martial',damage:{dice:'1d6',type:'piercing'},range:60}},
  'data/items/item.chain-mail.json':{id:'item.chain-mail',type:'item',name:'item.chain-mail.name',
   text:'item.chain-mail.text',category:'armor',priceCp:600,bulk:'2',
   armor:{category:'medium',acBonus:4,dexCap:1,checkPenalty:-2}},
  'i18n/en.json':{
   'item.healing-potion.name':'Healing Potion','item.healing-potion.text':'Heals hit points',
   'item.longsword.name':'Longsword','item.longsword.text':'A long sword.',
   'item.shortbow.name':'Shortbow','item.shortbow.text':'A short bow.',
   'item.chain-mail.name':'Chain Mail','item.chain-mail.text':'Protective armor.'}

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
  // Matching item names from multiple chosen shops are ALWAYS separate choices.
  // The player decides which version to take; the importer never deduplicates by name.
  const foundryAndData=items.list({q:'Abacus',catalogs:[
   'pf1e-foundry~'+sha,'pf1e-pfdata~'+sha
  ]}).items;
  assert.equal(foundryAndData.length,2,'two selected catalogs show two same-named items');
  assert.deepEqual(new Set(foundryAndData.map(item=>item.sourceId)),
    new Set(['pf1e-foundry','pf1e-pfdata']));
  assert.notEqual(foundryAndData[0].id,foundryAndData[1].id,'each source has its own item ID');
  const allThree=items.list({q:'Abacus',catalogs:[
   'pf1e-foundry~'+sha,'pf1e-pfdata~'+sha,'pf1e-openref~'+sha
  ]}).items;
  assert.equal(allThree.length,3,'third selected shop adds its own Abacus');
  assert.equal(items.list({q:'Abacus'}).items.length,4,
    'all-source browsing still includes the existing GM-owned Abacus');
  assert.equal(items.get(id).description,'Player customization');
  assert.equal(items.get(id).priceGil,10);
  const foundry=items.list({sourceId:'pf1e-foundry'}).items[0];
  assert.equal(catalogInventoryItem(items.get(foundry.id),1).weight,2);
  assert.equal(items.list({sourceId:'pf1e-pfdata'}).items.length,1,'exclude error placeholder');
  assert.equal(items.list({sourceId:'pf1e-openref'}).items.length,2,'exclude rules sections');
  const pfData=items.list({sourceId:'pf1e-pfdata'}).items[0];
  assert.equal(pfData.costText,'2 gp','extract PF Data Markdown price');
  assert.equal(catalogInventoryItem(items.get(pfData.id),1).weight,2);
  assert.ok(!items.get(pfData.id).description.includes('‹SOURCE'),'hide duplicate source heading');
  const openArmor=items.list({sourceId:'pf1e-openref',q:'Agile Breastplate'}).items[0];
  assert.equal(openArmor.costText,'400 gp','extract Open Reference item_details price');
  const armorItem=catalogInventoryItem(items.get(openArmor.id),1);
  assert.equal(armorItem.weight,25);assert.equal(armorItem.acBonus,'+6');
  assert.equal(armorItem.maxDex,'+3');assert.equal(armorItem.spellFailure,'25%');
  assert.equal(items.list({sourceId:'pf2e-orc',q:'Healing Potion'}).items[0].name,'Healing Potion','resolve ORC item i18n key');
  const orcSword=catalogInventoryItem(items.get(items.list({sourceId:'pf2e-orc',q:'Longsword'}).items[0].id),1);
  assert.equal(orcSword.dmg,'1d8');assert.equal(orcSword.damageType,'slashing');
  assert.equal(orcSword.pf2eBulk,'1');assert.equal(orcSword.weight,undefined,'Bulk is not pounds');
  const orcBow=items.get(items.list({sourceId:'pf2e-orc',q:'Shortbow'}).items[0].id);
  assert.equal(orcBow.category,'Ranged Weapon');assert.equal(catalogInventoryItem(orcBow,1).range,'60 ft.');
  const orcArmor=catalogInventoryItem(items.get(items.list({sourceId:'pf2e-orc',q:'Chain Mail'}).items[0].id),1);
  assert.equal(orcArmor.acBonus,'4');assert.equal(orcArmor.maxDex,'1');assert.equal(orcArmor.checkPenalty,'-2');

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
