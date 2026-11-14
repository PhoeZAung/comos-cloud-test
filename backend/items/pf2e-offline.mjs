import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {catalogId} from './catalog.mjs';
import {ALL_ITEM_TAG_OPTIONS} from '../../src/features/sheet/item-categories.mjs';

export const PF2E_UPSTREAM_SHA='52dfeee703b887237f5e454747bcae45b136f9af';
export const PF2E_SOURCE_VERSION='foundry-pf2e-8.7.0';
export const PF2E_CATALOG_PATH='/data/pf2e-foundry-8.7.0.json.gz';
const categories=new Set(ALL_ITEM_TAG_OPTIONS);
const goodString=(x,max)=>typeof x==='string'&&x.length<=max;
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

export function validatePf2eCatalog(data){
 if(!plain(data)||data.schemaVersion!=='cosmos.pf2e-foundry-catalog.v1'||
  data.version!==PF2E_SOURCE_VERSION||data.sourceSystem!=='pathfinder-2e'||
  data.upstreamRef!==PF2E_UPSTREAM_SHA||!Array.isArray(data.items)||
  !Number.isSafeInteger(data.itemCount)||data.itemCount!==data.items.length||
  !Number.isSafeInteger(data.sourceFiles)||data.sourceFiles<data.items.length||
  data.items.length>15000)throw Error('Invalid PF2e catalog header');
 const ids=new Set(),rows=[];
 for(const item of data.items){
  if(!plain(item)||!/^pf2e:[A-Za-z0-9]{16}$/.test(item.id||'')||ids.has(item.id)||
   !goodString(item.name,80)||!item.name.trim()||
   !categories.has(item.category)||item.sourceId!=='pathfinder-2e-shopping'||
   item.sourceSystem!=='pathfinder-2e'||item.sourceVersion!==PF2E_SOURCE_VERSION||
   !goodString(item.sourceFile,150)||!/^[a-z0-9][a-z0-9_-]*\.json$/.test(item.sourceFile)||
   item.sourceUrl!=='https://github.com/foundryvtt/pf2e/blob/'+PF2E_UPSTREAM_SHA+'/packs/pf2e/equipment/'+item.sourceFile||
   item.detailUrl!==item.sourceUrl||
   !goodString(item.description,30000)||!goodString(item.originalPriceText,160)||
   item.priceGil!==null||!Array.isArray(item.details)||item.details.length>24||
   item.details.some(d=>!plain(d)||!goodString(d.name,100)||!goodString(d.val,600))||
   Object.keys(item).length>60)throw Error('Invalid PF2e catalog item');
  ids.add(item.id);
  rows.push({...item,importId:catalogId('pf2e-foundry:'+item.id)});
 }
 return rows;
}

export async function importPf2eCatalog(db,{file=process.env.COMOS_PF2E_CATALOG_PATH||PF2E_CATALOG_PATH}={}){
 let packed;
 try{packed=await readFile(file);}
 catch(error){
  if(error.code==='ENOENT'&&!process.env.COMOS_PF2E_CATALOG_PATH&&file===PF2E_CATALOG_PATH) return {state:'not-installed',count:0,file};
  throw error;
 }
 const decoded=gunzipSync(packed,{maxOutputLength:120000000}),checksum=sha(decoded);
 if(db.prepare('SELECT 1 FROM item_catalog_imports WHERE checksum=?').get(checksum))
  return {state:'already-imported',count:0,checksum};
 const rows=validatePf2eCatalog(JSON.parse(decoded.toString('utf8')));
 const insert=db.prepare('INSERT INTO items(id,name,source_id,source_version,category,description,price_units,cost_text,catalog_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING');
 let added=0,skipped=0;
 db.exec('BEGIN IMMEDIATE');
 try{
  const now=new Date().toISOString();
  for(const row of rows){
   const result=insert.run(row.importId,row.name,'pathfinder-2e-shopping',PF2E_SOURCE_VERSION,row.category,
    row.description,null,row.originalPriceText,JSON.stringify(row),now,now);
   added+=result.changes;skipped+=result.changes?0:1;
  }
  db.prepare('INSERT INTO item_catalog_imports(checksum,imported_at,item_count) VALUES(?,?,?)').run(checksum,now,added);
  db.exec('COMMIT');
 }catch(error){db.exec('ROLLBACK');throw error;}
 console.info('Foundry Pathfinder 2e equipment imported '+added+' rows; skipped '+skipped+' preserved items.');
 return {state:'imported',count:added,skipped,checksum};
}
