import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {catalogId,gilUnits} from './catalog.mjs';

const BATCH_FILE = new URL('./catalog/ffd20-verified-batch-01.json',import.meta.url);
const SOURCE_ID = 'ffd20-shopping';
const VERSION = '2026-11-14-01';

function verifiedRecord(row) {
 if(!row||typeof row!=='object'||Array.isArray(row) ||
    !/^ffd20:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id) ||
    typeof row.name!=='string'||!row.name.trim()||row.name.length>80 ||
    !['Armor','Magic Items'].includes(row.category) ||
    row.sourceSystem!=='ffd20'||typeof row.description!=='string'||!row.description.trim()||row.description.length>5000 ||
    typeof row.sourceUrl!=='string'||!/^https:\/\/finalfantasyd20\.com\/(?:equipment|magical-items)\//.test(row.sourceUrl) ||
    typeof row.detailUrl!=='string'||!/^https:\/\/finalfantasyd20\.com\/(?:equipment|magical-items)\//.test(row.detailUrl) ||
    gilUnits(row.priceGil)===null)throw Error('Invalid approved FFd20 shopping record.');
 return {
  ...row,
  importId:catalogId('approved-shopping:'+row.id),
  priceUnits:gilUnits(row.priceGil),
  costText:String(row.priceGil)+' gil',
 };
}

export function validateApprovedShoppingBatch(input) {
 if(input?.schemaVersion!=='cosmos.shopping-approved-batch.v1'||
    input.batchId!=='ffd20-verified-2026-11-14-01'||
    input.reviewStatus!=='approved-source-metadata'||!Array.isArray(input.items)||
    input.items.length!==8)throw Error('Unapproved shopping batch manifest.');
 const rows=input.items.map(verifiedRecord);
 if(new Set(rows.map(x=>x.id)).size!==rows.length ||
    new Set(rows.map(x=>x.name.toLowerCase())).size!==rows.length)throw Error('Duplicated approved shopping item.');
 return rows;
}

export async function importApprovedShoppingBatch(db) {
 const bytes=await readFile(BATCH_FILE);
 const checksum=createHash('sha256').update(bytes).digest('hex');
 const input=JSON.parse(bytes);
 const rows=validateApprovedShoppingBatch(input);
 if(db.prepare('SELECT 1 FROM item_catalog_imports WHERE checksum=?').get(checksum))
  return {state:'already-imported',checksum,count:0};

 const existingByName=db.prepare('SELECT id,source_id FROM items WHERE lower(name)=lower(?) LIMIT 2');
 const insert=db.prepare('INSERT INTO items(id,name,source_id,source_version,category,description,price_units,cost_text,catalog_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING');
 let added=0,skipped=[];
 db.exec('BEGIN IMMEDIATE');
 try {
  const now=new Date().toISOString();
  for(const row of rows) {
   // Do not overwrite legacy, manually administered, archived or previously imported items.
   const sameName=existingByName.all(row.name);
   if(sameName.length) {
    skipped.push({name:row.name,reason:'existing name (requires manual provenance review)'});
    continue;
   }
   const result=insert.run(row.importId,row.name,SOURCE_ID,VERSION,row.category,row.description,row.priceUnits,row.costText,
    JSON.stringify({...row,mechanicsMode:'informational-only'}),now,now);
   added+=Number(result.changes);
   if(!result.changes)skipped.push({name:row.name,reason:'deterministic ID conflict'});
  }
  db.prepare('INSERT INTO item_catalog_imports(checksum,imported_at,item_count) VALUES(?,?,?)').run(checksum,now,added);
  db.exec('COMMIT');
 }catch(error){db.exec('ROLLBACK');throw error;}
 if(skipped.length)console.warn('Approved shopping import skipped conflicting names:',skipped.map(x=>x.name).join(', '));
 return {state:'imported',checksum,count:added,skipped};
}
