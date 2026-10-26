import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
export const gilUnits=value=>{
 if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1e12)return null;
 const units=Math.round(value*100);return Number.isSafeInteger(units)&&Math.abs(value*100-units)<0.0001?units:null;
};
// Never turn ranges, multipliers, formulas or price alternatives into a guessed price.
export function catalogPrice(row){
 const match=/^\s*(\d[\d,]*(?:\.\d+)?)\s*(?:gil|gp)?\s*$/i.exec(String(row.cost??''));
 return match?gilUnits(Number(match[1].replaceAll(',',''))):null;
}
export function catalogId(id){const b=createHash('sha256').update('comos-master-item:'+id).digest().subarray(0,16);b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=b.toString('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
export async function importItemCatalog(db){
 const manifest=JSON.parse(await readFile(new URL('./catalog/manifest.json',import.meta.url),'utf8'));
 if(db.prepare('SELECT 1 FROM item_catalog_imports WHERE checksum=?').get(manifest.sha256))return;
 const bytes=gunzipSync(await readFile(new URL('./catalog/master-items.json.gz',import.meta.url)),{maxOutputLength:16000000});
 if(createHash('sha256').update(bytes).digest('hex')!==manifest.sha256)throw Error('Item catalog checksum mismatch.');
 const catalog=JSON.parse(bytes);if(catalog.items.length!==manifest.count)throw Error('Item catalog count mismatch.');
 const insert=db.prepare('INSERT INTO items(id,name,source_id,source_version,category,description,price_units,cost_text,catalog_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING');
 db.exec('BEGIN IMMEDIATE');try{const now=new Date().toISOString();for(const row of catalog.items){
  insert.run(catalogId(row.id),row.name,'legacy-master',manifest.version,row.category,[row.desc,row.special&&(/^special:/i.test(row.special)?row.special:'Special: '+row.special)].filter(Boolean).join('\n\n'),catalogPrice(row),row.cost||'',JSON.stringify(row),now,now);
 }db.prepare('INSERT OR IGNORE INTO item_catalog_imports VALUES(?,?,?)').run(manifest.sha256,now,catalog.items.length);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
}
