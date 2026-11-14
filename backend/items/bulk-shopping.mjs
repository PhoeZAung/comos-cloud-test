import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {catalogId,gilUnits} from './catalog.mjs';

// Keeps source-only metadata separate from the verified 8 and unchanged base archive.
const FILE=new URL('./catalog/shopping-bulk-02.json',import.meta.url);
const VERSION='bulk-2026-11-14-02';
const SOURCE_HOSTS=new Set(['finalfantasyd20.com','www.finalfantasyd20.com','aonprd.com','www.aonprd.com']);

export function validateBulkShoppingBatch(input){
 if(input?.schemaVersion!=='cosmos.shopping-bulk-metadata.v1'||
    input.batchId!=='aon-ffd20-bulk-2026-11-14-02'||
    !Array.isArray(input.items)||input.items.length!==88)throw Error('Invalid bulk shopping manifest');
 const ids=new Set(),names=new Set();
 return input.items.map(item=>{
  if(!item||typeof item!=='object'||Array.isArray(item)||
    !/^(?:aon|ffd20):[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)||
    typeof item.name!=='string'||!item.name.trim()||item.name.length>80||
    typeof item.originalName!=='string'||!item.originalName.trim()||
    !['Alchemical Items','Magic Items','Gear','Weapon','Ranged Weapon','Machine'].includes(item.category)||
    !['ffd20','pathfinder'].includes(item.sourceSystem)||
    !['gil','gp','gros'].includes(item.originalCurrency)||
    typeof item.sourceUrl!=='string'||typeof item.detailUrl!=='string'||
    typeof item.description!=='string'||!item.description||item.description.length>4000||
    item.reviewStatus!=='metadata-only'||!Object.hasOwn(item,'priceGil'))throw Error('Invalid bulk shopping item');
  for(const value of [item.sourceUrl,item.detailUrl]){
   let url;
   try{url=new URL(value);}catch{throw Error('Invalid shopping source URL');}
   if(url.protocol!=='https:'||!SOURCE_HOSTS.has(url.hostname))throw Error('Unsupported source URL');
  }
  const correctSystem=item.id.startsWith('aon:')?'pathfinder':'ffd20';
  if(item.sourceSystem!==correctSystem)throw Error('Mixed game systems in bulk shopping');
  const price=(item.sourceSystem==='ffd20'&&item.originalCurrency==='gil')?gilUnits(item.priceGil):null;
  if(item.sourceSystem==='ffd20'&&item.originalCurrency==='gil'&&price===null)throw Error('Invalid FFd20 gil price');
  if(item.originalCurrency!=='gil'&&item.priceGil!==null)throw Error('Cannot silently convert GP or gros to gil');
  const id=catalogId('bulk-shopping:'+item.id);
  const nameKey=item.name.normalize('NFKC').toLocaleLowerCase('en-US');
  if(ids.has(id)||names.has(nameKey))throw Error('Duplicate bulk item identity/name');
  ids.add(id);names.add(nameKey);
  return {...item,importId:id,priceUnits:price,sourceId:item.sourceSystem==='ffd20'?'ffd20-shopping':'pathfinder-shopping'};
 });
}

export async function importBulkShoppingBatch(db){
 const bytes=await readFile(FILE);
 const checksum=createHash('sha256').update(bytes).digest('hex');
 const items=validateBulkShoppingBatch(JSON.parse(bytes));
 if(db.prepare('SELECT 1 FROM item_catalog_imports WHERE checksum=?').get(checksum))
  return {state:'already-imported',checksum,count:0};
 const insert=db.prepare('INSERT INTO items (id,name,source_id,source_version,category,description,price_units,cost_text,catalog_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING');
 const exactName=db.prepare('SELECT id FROM items WHERE lower(name)=lower(?) LIMIT 1');
 let added=0,skipped=[];
 db.exec('BEGIN IMMEDIATE');
 try{
  const now=new Date().toISOString();
  for(const item of items){
   // Existing GM and baseline rows are immutable in this import.
   if(exactName.get(item.name)){
    skipped.push(item.name);
    continue;
   }
   const result=insert.run(
    item.importId,item.name,item.sourceId,VERSION,item.category,item.description,
    item.priceUnits,item.originalPriceText||'',JSON.stringify(item),now,now);
   added+=Number(result.changes);
   if(!result.changes)skipped.push(item.name);
  }
  db.prepare('INSERT INTO item_catalog_imports(checksum,imported_at,item_count) VALUES(?,?,?)').run(checksum,now,added);
  db.exec('COMMIT');
 }catch(error){db.exec('ROLLBACK');throw error;}
 if(skipped.length)console.warn('Shopping bulk import skipped existing names:',skipped.join(', '));
 return {state:'imported',checksum,count:added,skipped};
}
