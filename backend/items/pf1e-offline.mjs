import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {catalogId} from './catalog.mjs';
import {ALL_ITEM_TAG_OPTIONS} from '../../src/features/sheet/item-categories.mjs';

// The user-supplied, offline AoN archive is not checked into public GitHub.
// Put the verified .gz in the persistent /data volume before deploying.
export const PF1E_CATALOG_PATH='/data/pf1e-offline-v1.json.gz';
const MANIFEST=new URL('./catalog/pf1e-offline-manifest.json',import.meta.url);
const allowedCategories=new Set(ALL_ITEM_TAG_OPTIONS);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const plain=value=>value&&typeof value==='object'&&!Array.isArray(value);
function sourceUrl(value){
 try{const url=new URL(value);return url.protocol==='https:'&&['www.aonprd.com','aonprd.com'].includes(url.hostname)&&!url.username&&!url.password;}
 catch{return false;}
}
export function validatePf1eOfflineCatalog(data,manifest){
 if(!plain(data)||data.schemaVersion!=='cosmos.pf1e-offline-catalog.v1'||data.version!==manifest.version||
   data.sourceSystem!=='pathfinder-1e'||data.sourcePagesInArchive!==manifest.sourcePages||
   !Array.isArray(data.items)||data.items.length!==manifest.itemCount||
   data.itemCandidateOccurrences!==manifest.itemCandidateOccurrences)throw Error('Invalid offline PF1e catalog manifest.');
 const ids=new Set();const rows=[];
 for(const item of data.items){
  if(!plain(item)||!/^pf1e:[a-f0-9]{28}$/.test(item.id)||ids.has(item.id)||
   typeof item.name!=='string'||!item.name.trim()||item.name.length>80||
   !allowedCategories.has(item.category)||item.sourceSystem!=='pathfinder-1e'||
   item.sourceId!=='pathfinder-shopping'||!sourceUrl(item.sourceUrl)||!sourceUrl(item.detailUrl)||
   !plain(item.raw)||Object.keys(item.raw).length>100||Object.entries(item.raw).some(([key,val])=>!key||key.length>100||typeof val!=='string'||val.length>12000)||
   typeof item.description!=='string'||item.description.length>5000||
   typeof item.sourceCategoryDetail!=='string'||item.sourceCategoryDetail.length>160||
   typeof item.originalPriceText!=='string'||item.originalPriceText.length>120||
   item.priceGil!==null)throw Error('Invalid offline PF1e item metadata.');
  ids.add(item.id);rows.push({...item,importId:catalogId('pf1e-offline:'+item.id)});
 }
 return rows;
}
export async function importPf1eOfflineCatalog(db,{file=process.env.COMOS_PF1E_CATALOG_PATH||PF1E_CATALOG_PATH,manifest=null}={}){
 const expected=manifest||JSON.parse(await readFile(MANIFEST,'utf8'));
 let packed;
 try{packed=await readFile(file);}catch(error){
  if(error.code==='ENOENT'&&!manifest&&!process.env.COMOS_PF1E_CATALOG_PATH)return {state:'not-installed',count:0,file};
  throw error;
 }
 if(expected.compressedSha256&&digest(packed)!==expected.compressedSha256)throw Error('Offline PF1e compressed catalog checksum mismatch.');
 const decoded=gunzipSync(packed,{maxOutputLength:20000000});
 const checksum=digest(decoded);
 if(checksum!==expected.sha256)throw Error('Offline PF1e catalog checksum mismatch.');
 if(db.prepare('SELECT 1 FROM item_catalog_imports WHERE checksum=?').get(checksum))return {state:'already-imported',count:0,checksum};
 const items=validatePf1eOfflineCatalog(JSON.parse(decoded),expected);
 const insert=db.prepare('INSERT INTO items(id,name,source_id,source_version,category,description,price_units,cost_text,catalog_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING');
 const previously=db.prepare("SELECT id,catalog_json FROM items WHERE source_id='pathfinder-shopping' AND lower(name)=lower(?)");
 let added=0,skipped=0;
 db.exec('BEGIN IMMEDIATE');
 try{
  const now=new Date().toISOString();
  for(const item of items){
   const existing=previously.all(item.name);
   // Only skip an older *PF1e* record with the same item URL. Never dedupe
   // across game systems, and never modify GM-edited/archive records.
   if(existing.some(row=>{
    let source={};try{source=JSON.parse(row.catalog_json||'{}');}catch{}
    const url=source.detailUrl||source.sourceUrl||'';
    return url===item.detailUrl && (!source.sourceCategoryDetail||source.sourceCategoryDetail===item.sourceCategoryDetail);
   })){skipped++;continue;}
   const result=insert.run(item.importId,item.name,'pathfinder-shopping',expected.version,item.category,
      item.description,null,item.originalPriceText,JSON.stringify(item),now,now);
   added+=result.changes;skipped+=result.changes?0:1;
  }
  db.prepare('INSERT INTO item_catalog_imports(checksum,imported_at,item_count) VALUES(?,?,?)').run(checksum,now,added);
  db.exec('COMMIT');
 }catch(error){db.exec('ROLLBACK');throw error;}
 console.info('Offline Pathfinder 1e catalog imported '+added+' rows; skipped '+skipped+' preserved duplicates.');
 return {state:'imported',count:added,skipped,checksum};
}
