import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {catalogId} from './catalog.mjs';
import {ALL_ITEM_TAG_OPTIONS} from '../../src/features/sheet/item-categories.mjs';

// Optional, separately staged third-party item catalogs. No remote network on startup.
export const EXTRA_ITEM_SOURCES=Object.freeze({
  'pf1e-foundry':{sourceId:'pf1e-foundry',system:'pathfinder-1e',label:'PF1e · Foundry',repository:'baileymh/pf1e-content'},
  'pf1e-pfdata':{sourceId:'pf1e-pfdata',system:'pathfinder-1e',label:'PF1e · PF Data',repository:'jasontankapps/pathfinder-data-1-e'},
  'pf1e-openref':{sourceId:'pf1e-openref',system:'pathfinder-1e',label:'PF1e · Open Ref',repository:'Nietsneflow/open-reference'},
  'pf2e-pf2ools':{sourceId:'pf2e-pf2ools',system:'pathfinder-2e',label:'PF2e · Pf2ools',repository:'Pf2ools/pf2ools-data'},
  'pf2e-orc':{sourceId:'pf2e-orc',system:'pathfinder-2e',label:'PF2e · ORC',repository:'TiMarron/orc-rules-data'},
  'pf2e-json':{sourceId:'pf2e-json',system:'pathfinder-2e',label:'PF2e · JSON',repository:'jimbarnesrtp/pf2'}
});
const categories=new Set(ALL_ITEM_TAG_OPTIONS);
const sha=buffer=>createHash('sha256').update(buffer).digest('hex');
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const part=/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
function validUrl(value,repository){
 try{
  const url=new URL(value);
  const [owner,name]=repository.split('/');
  return url.protocol==='https:'&&url.hostname==='github.com'&&!url.username&&!url.password&&
   url.pathname.startsWith('/'+owner+'/'+name+'/blob/');
 }catch{return false;}
}
function isTrustedPf2eItemPage(value){
 try{
  const url=new URL(value);
  return url.protocol==='https:'&&url.hostname==='2e.aonprd.com'&&
   /^\/(?:Equipment|Weapons|Armor|Shields)\.aspx$/i.test(url.pathname)&&
   /^\?ID=\d+$/i.test(url.search)&&!url.hash&&!url.username&&!url.password;
 }catch{return false;}
}
export function validateExtraCatalog(catalog,key){
 const info=EXTRA_ITEM_SOURCES[key];
 if(!info||!plain(catalog)||catalog.schemaVersion!=='cosmos.extra-item-catalog.v1'||
  catalog.sourceKey!==key||catalog.sourceId!==info.sourceId||catalog.sourceSystem!==info.system||
  !part.test(catalog.version)||!Array.isArray(catalog.items)||!catalog.items.length||
  catalog.items.length>50000||catalog.itemCount!==catalog.items.length)throw Error('Invalid extra catalog header: '+key);
 const seen=new Set();
 for(const row of catalog.items){
  if(!plain(row)||!part.test(row.itemKey)||seen.has(row.itemKey)||
    typeof row.name!=='string'||!row.name.trim()||row.name.length>80||
    !categories.has(row.category)||typeof row.description!=='string'||row.description.length>30000||
    typeof row.originalPriceText!=='string'||row.originalPriceText.length>160||
    row.priceGil!==null||row.sourceId!==info.sourceId||row.sourceSystem!==info.system||
    row.sourceVersion!==catalog.version||!validUrl(row.sourceUrl,info.repository)||
    !(row.detailUrl===row.sourceUrl||(key==='pf2e-json'&&isTrustedPf2eItemPage(row.detailUrl)))||
    Object.keys(row).length>65)throw Error('Invalid item in extra catalog: '+key);
  seen.add(row.itemKey);
 }
 return catalog.items;
}
export async function importExtraItemCatalog(db,key,{file='/data/extra-'+key+'.json.gz'}={}){
 const info=EXTRA_ITEM_SOURCES[key];if(!info)throw Error('Unknown extra catalog.');
 let compressed;
 try{compressed=await readFile(file);}
 catch(error){if(error.code==='ENOENT')return {state:'not-installed',key,count:0};throw error;}
 const decoded=gunzipSync(compressed,{maxOutputLength:150000000});
 const checksum=sha(decoded);
 if(db.prepare('SELECT 1 FROM item_catalog_imports WHERE checksum=?').get(checksum))
  return {state:'already-imported',key,count:0};
 const catalog=JSON.parse(decoded.toString('utf8'));
 const rows=validateExtraCatalog(catalog,key);
 let added=0,skipped=0;
 const insert=db.prepare('INSERT INTO items(id,name,source_id,source_version,category,description,price_units,cost_text,catalog_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING');
 db.exec('BEGIN IMMEDIATE');
 try{
  const now=new Date().toISOString();
  for(const item of rows){
   const id=catalogId('extra:'+key+':'+item.itemKey);
   const result=insert.run(id,item.name,info.sourceId,catalog.version,item.category,
    item.description,null,item.originalPriceText,JSON.stringify(item),now,now);
   added+=result.changes;skipped+=result.changes?0:1;
  }
  db.prepare('INSERT INTO item_catalog_imports(checksum,imported_at,item_count) VALUES(?,?,?)').run(checksum,now,added);
  db.exec('COMMIT');
 }catch(error){db.exec('ROLLBACK');throw error;}
 console.info('Extra item catalog '+info.label+': '+added+' added, '+skipped+' skipped.');
 return {state:'imported',key,count:added,skipped,checksum};
}
export async function importExtraItemCatalogs(db,options={}){
 const results=[];
 for(const key of Object.keys(EXTRA_ITEM_SOURCES)){
  try{results.push(await importExtraItemCatalog(db,key,options[key]||{}));}
  catch(error){
   console.error('Optional '+key+' catalog skipped: '+(error?.message||String(error)));
   results.push({state:'failed',key,count:0,error:String(error?.message||error)});
  }
 }
 return results;
}
