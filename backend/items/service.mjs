import {SHOP_ITEM_CATEGORY_GROUPS} from '../../src/features/sheet/item-categories.mjs';
import {shopSourceForItem,shopSourceSql,isShopSource} from '../../src/features/sheet/shop-sources.mjs';
import {catalogKey,parseCatalogKey,shopCatalogLabel} from '../../src/features/sheet/shop-catalogs.mjs';
import {gilUnits} from './catalog.mjs';
const invalid=message=>Object.assign(new Error(message),{code:'INVALID_ITEM'});
const conflict=()=>Object.assign(new Error('This item changed. Reload before saving.'),{code:'REVISION_CONFLICT'});
const validId=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
const selectedCatalogs=value=>{
 if(value===null)return null; // Legacy clients retain their existing all-source behavior.
 if(!Array.isArray(value)||value.length>100||new Set(value).size!==value.length)throw invalid('Invalid catalog selection.');
 const selected=value.map(parseCatalogKey);
 if(selected.some(value=>!value))throw invalid('Invalid catalog selection.');
 return selected;
};
const catalogSql=selected=>selected?.length?' AND ('+selected.map(()=>'('+'source_id=? AND source_version=?'+')').join(' OR ')+')':'';
const catalogParams=selected=>selected?selected.flatMap(row=>[row.sourceId,row.sourceVersion]):[];
const record=row=>row?{id:row.id,name:row.name,sourceId:row.source_id,sourceVersion:row.source_version,category:row.category,shopSource:shopSourceForItem({sourceId:row.source_id}),archived:Boolean(row.archived),schemaVersion:row.schema_version,revision:row.revision,createdAt:row.created_at,updatedAt:row.updated_at,priceGil:row.price_units===null?null:row.price_units/100,costText:row.cost_text||'',...('description' in row?{description:row.description,catalog:JSON.parse(row.catalog_json||'{}')}:{})}:null;
export function createItemsService(db){
 const get=id=>{if(!validId(id))throw invalid('Invalid item ID.');return record(db.prepare('SELECT * FROM items WHERE id=?').get(id));};
 function list({q='',sourceId='',shopSource='all',cursor='',archived=false,category='',catalogs=null}={}){
  if(typeof q!=='string'||q.length>80||typeof sourceId!=='string'||(sourceId&&!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(sourceId))||(cursor&&!validId(cursor))||typeof archived!=='boolean'||typeof category!=='string'||category.length>60||!isShopSource(shopSource))throw invalid('Invalid item search.');
  const chosen=selectedCatalogs(catalogs);
  if(chosen?.length===0)return {items:[],nextCursor:null};
  const columns='id,name,source_id,source_version,category,archived,schema_version,revision,created_at,updated_at,price_units,cost_text';
  const oldGroups={Tools:['Gear','Food','Weapon','Ranged Weapon','Ammunition','Armor','Enchantment','Machine'],Magic:['Alchemical Items','Artifacts','Magic Items'],Other:['Collection','Misc']};
  const groups={...SHOP_ITEM_CATEGORY_GROUPS,...oldGroups};
  const categories=Object.hasOwn(groups,category)?groups[category]:[category];
  const source=shopSourceSql(shopSource),filter=(sourceId?' AND source_id=?':'')+source.sql+catalogSql(chosen)+(category?' AND category IN ('+categories.map(()=>'?').join(',')+')':'');
  const params=[Number(archived),cursor,q,...(sourceId?[sourceId]:[]),...source.params,...catalogParams(chosen),...(category?categories:[])];
  const rows=db.prepare(`SELECT ${columns} FROM items WHERE archived=? AND id>? AND instr(lower(name),lower(?))>0${filter} ORDER BY id LIMIT 21`).all(...params);
  return {items:rows.slice(0,20).map(record),nextCursor:rows.length>20?rows[19].id:null};
 }
 function save(data){
  if(!data||typeof data!=='object'||Array.isArray(data)||!validId(data.id)||!Number.isSafeInteger(data.revision)||data.revision<0)throw invalid('Invalid item change.');
  const fields=data.op==='save'?['op','id','revision','name','sourceId','sourceVersion','category','description','priceGil','costText','sourceUrl','sourceCategoryDetail','sourceFields']:data.op==='archive'?['op','id','revision','archived']:[];
  if(!fields.length||Object.keys(data).some(k=>!fields.includes(k)))throw invalid('Invalid item fields.');
  const previous=get(data.id),values={};
  if(data.op==='save'){
   for(const [field,max,required] of [['name',80,true],['category',40,false],['description',30000,false],['costText',120,false]]){
    const value=data[field]??'';
    if(typeof value!=='string'||value.length>max||(required&&!value.trim())||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)||(field!=='description'&&/[\r\n\t]/u.test(value)))throw invalid(`Enter a valid ${field} (up to ${max} characters).`);
    values[field]=value.trim();
   }
   for(const field of ['sourceId','sourceVersion']){
    if(typeof data[field]!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(data[field]))throw invalid('Source ID and version must use 1–64 letters, numbers, dots, dashes or underscores.');values[field]=data[field];
   }
  values.priceGil=Object.hasOwn(data,'priceGil')?data.priceGil:(previous?.priceGil??null);
   if(values.priceGil!==null&&gilUnits(values.priceGil)===null)throw invalid('Gil price must be nonnegative with at most two decimal places.');
   if(!Object.hasOwn(data,'costText'))values.costText=previous?.costText||'';
   if(Object.hasOwn(data,'sourceUrl')){
    if(typeof data.sourceUrl!=='string'||data.sourceUrl.length>2048)throw invalid('Invalid item source link.');
    if(data.sourceUrl.trim()){let url;try{url=new URL(data.sourceUrl.trim());}catch{throw invalid('Invalid item source link.');}
     if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw invalid('Item source link must be HTTP(S).');
     values.sourceUrl=url.href;
    }else values.sourceUrl='';
   }
   if(Object.hasOwn(data,'sourceCategoryDetail')){
    if(typeof data.sourceCategoryDetail!=='string'||data.sourceCategoryDetail.length>160||/[\u0000-\u001f\u007f]/u.test(data.sourceCategoryDetail))throw invalid('Invalid original website category.');
    values.sourceCategoryDetail=data.sourceCategoryDetail.trim();
   }
   if(Object.hasOwn(data,'sourceFields')){
    if(!data.sourceFields||typeof data.sourceFields!=='object'||Array.isArray(data.sourceFields)||Object.keys(data.sourceFields).length>100)throw invalid('Invalid source columns.');
    const fields={},entries=Object.entries(data.sourceFields);let length=0;
    for(const [key,value] of entries){
     if(!key||key.length>100||['__proto__','constructor','prototype'].includes(key)||typeof value!=='string'||value.length>12000)throw invalid('Invalid source column.');
     length+=key.length+value.length;if(length>60000)throw invalid('Source columns too large.');
     fields[key]=value;
    }
    values.sourceFields=fields;
   }
  }else if(typeof data.archived!=='boolean'||data.revision<1)throw invalid('Invalid archive change.');
  const baseCatalog=previous?.catalog&&typeof previous.catalog==='object'&&!Array.isArray(previous.catalog)?previous.catalog:{};
  const updatedCatalog={...baseCatalog,
   ...(Object.hasOwn(values,'sourceUrl')?{sourceUrl:values.sourceUrl}:{}),
   ...(Object.hasOwn(values,'sourceCategoryDetail')?{sourceCategoryDetail:values.sourceCategoryDetail}:{}),
   ...(Object.hasOwn(values,'sourceFields')?{sourceFields:values.sourceFields}:{})};
  const catalogJson=JSON.stringify(updatedCatalog);
  db.exec('BEGIN IMMEDIATE');
  try{
   const old=get(data.id),now=new Date().toISOString();
   if(data.revision===0&&data.op==='save'){
    if(old){if(old.revision!==1||old.archived||Object.entries(values).some(([k,v])=>old[k]!==v))throw conflict();}
    else db.prepare('INSERT INTO items(id,name,source_id,source_version,category,description,price_units,cost_text,catalog_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(data.id,values.name,values.sourceId,values.sourceVersion,values.category,values.description,values.priceGil===null?null:gilUnits(values.priceGil),values.costText,catalogJson,now,now);
   }else{
    if(!old||old.revision!==data.revision)throw conflict();
    if(data.op==='save')db.prepare('UPDATE items SET name=?,source_id=?,source_version=?,category=?,description=?,price_units=?,cost_text=?,catalog_json=?,revision=revision+1,updated_at=? WHERE id=?').run(values.name,values.sourceId,values.sourceVersion,values.category,values.description,values.priceGil===null?null:gilUnits(values.priceGil),values.costText,catalogJson,now,data.id);
    else db.prepare('UPDATE items SET archived=?,revision=revision+1,updated_at=? WHERE id=?').run(Number(data.archived),now,data.id);
   }
   const item=get(data.id);db.exec('COMMIT');return item;
  }catch(error){db.exec('ROLLBACK');throw error;}
 }
 const categories=(shopSource='all',catalogs=null)=>{
  if(!isShopSource(shopSource))throw invalid('Invalid shop source.');
  const chosen=selectedCatalogs(catalogs);
  if(chosen?.length===0)return [];
  const source=shopSourceSql(shopSource);
  return db.prepare('SELECT category,count(*) AS count FROM items WHERE archived=0'+source.sql+catalogSql(chosen)+' GROUP BY category ORDER BY category').all(...source.params,...catalogParams(chosen));
 };
 function listCatalogs(){
  const groups=db.prepare("SELECT source_id AS sourceId,source_version AS sourceVersion,count(*) AS count,min(id) AS sampleId FROM items WHERE archived=0 GROUP BY source_id,source_version ORDER BY source_id,source_version").all();
  const sample=db.prepare('SELECT catalog_json FROM items WHERE id=?');
  return groups.map(group=>{
   let catalog={};
   try{catalog=JSON.parse(sample.get(group.sampleId)?.catalog_json||'{}');}catch{}
   return {id:catalogKey(group.sourceId,group.sourceVersion),label:shopCatalogLabel({...group,catalog}),count:group.count,sourceId:group.sourceId,sourceVersion:group.sourceVersion};
  });
 }
 return {get,list,save,categories,listCatalogs};
}
