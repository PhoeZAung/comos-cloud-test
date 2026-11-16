import {readdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import {resolve,relative,join,basename,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {EXTRA_ITEM_SOURCES,validateExtraCatalog} from '../backend/items/extra-sources.mjs';
import {readableDescription} from './build-pf2e-catalog.mjs';

const foundryPacks=new Set(['pf-items','pf-goods-services','pf-magic','pf-wondrous',
 'pf-artifacts','pf-technology','pf-cursed-items','pf-intelligent-items','pf-scaling-items']);
const pf2Types=new Set(['item','weapon','armor','shield','consumable','equipment',
 'adventuringgear','gear','ammunition','ammo','rune','magicitem','wornitem','wand',
 'staff','potion','snare','treasure','alchemicalitem','talisman','helditem','material']);
const hash=value=>createHash('sha256').update(value).digest('hex');
const obj=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const str=value=>typeof value==='string'?value:'';
const money=value=>{
 if(typeof value==='string')return value.slice(0,160);
 if(typeof value==='number'&&Number.isFinite(value))return String(value)+' gp';
 if(obj(value)){
  if(typeof value.value==='number'&&str(value.unit))return value.value+' '+value.unit;
  if(typeof value.amount==='number'&&str(value.denomination))return value.amount+' '+value.denomination;
  if(obj(value.value))return Object.entries(value.value).filter(([c,n])=>['gp','sp','cp','pp'].includes(c)&&Number.isFinite(n)).map(([c,n])=>n+' '+c).join(' + ');
 }
 return '';
};
const weight=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0?value:
 typeof value==='string'&&/^\d+(?:\.\d+)?$/.test(value)?Number(value):null;
function plainText(value){
 if(typeof value==='string')return readableDescription(value.replace(/\{@[^}\s]+\s+([^}]+)\}/g,'$1'));
 if(Array.isArray(value))return value.map(plainText).filter(Boolean).join('\n');
 if(obj(value)){
  if(Array.isArray(value.entries))return [str(value.name),plainText(value.entries)].filter(Boolean).join('\n');
  if(Array.isArray(value.items))return plainText(value.items);
 }
 return '';
}
function category(value,pack=''){
 const k=String(value||'').toLowerCase(),p=pack.toLowerCase();
 if(/artifact/.test(k+' '+p))return 'Artifacts';
 if(/ranged/.test(k))return 'Ranged Weapon';
 if(/weapon|melee|firearm/.test(k))return 'Weapon';
 if(/ammo|ammunition|arrow|bullet/.test(k))return 'Ammunition';
 if(/armor|armour|shield/.test(k))return 'Armor';
 if(/consumable|potion|scroll|wand|alchemical|drug/.test(k))return 'Consumables';
 if(/vehicle|mount|transport/.test(k+' '+p))return 'Vehicles & Mounts';
 if(/service|lodging/.test(k+' '+p))return 'Services & Other';
 if(/rune|enhancement|special-qualit/.test(k))return 'Enhancements';
 if(/magic|wondrous|staff|rod|ring|tattoo/.test(k+' '+p))return 'Magic Items';
 return 'Gear';
}
function entriesFor(source,file,strings={}){
 const rel=file.replaceAll('\\','/'),base=basename(rel);
 if(source==='pf1e-foundry'){
  const match=/src\/packs\/(pf-[^/]+)\/[^/]+\.json$/i.exec(rel);
  if(!match||!foundryPacks.has(match[1]))return [];
  const row=JSON.parse(strings.body);
  const s=row.system||{};
  const html=str(s.description?.value);
  const cleaned=html.replace(/^\s*<p[^>]*>\s*<strong>Source<\/strong>[\s\S]*?<\/p>/i,'');
  return [{name:row.name,id:row._id,category:category(row.type,match[1]),
   description:plainText(cleaned||html),price:money(s.price),
   weight:weight(s.weight?.value),damage:str(s.damage?.parts?.[0]?.[0]||s.damage?.value),
   crit:str(s.critRange),range:s.range?.value,armor:s.armor?.value}];
 }
 if(source==='pf1e-pfdata'){
  if(!/\bjson\/(equipment|magic|item)[-_][^/]+\.json$/i.test(rel))return [];
  const data=JSON.parse(strings.body);
  if(!obj(data))return [];
  return Object.entries(data).filter(([id,row])=>id!=='not_found'&&obj(row)&&str(row.name)).map(([id,row])=>({
   id,name:row.name,category:category(base,base),description:plainText(row.description),
   price:money(row.price||row.cost),weight:weight(row.weight),damage:row.damage,crit:row.critical,
   range:row.range
  }));
 }
 if(source==='pf1e-openref'){
  if(!/\bbooks\/[^/]+\/\d+\.json$/i.test(rel))return [];
  const data=JSON.parse(strings.body);
  if(!Array.isArray(data))return [];
  return data.filter(row=>obj(row)&&['item','vehicle'].includes(row.t)&&str(row.n)).map(row=>({
   id:row.i,name:row.n,category:category(row.t,rel),description:plainText(row.b),
   price:money(row.cost),weight:weight(row.weight),rawUrl:row.u
  }));
 }
 if(source==='pf2e-pf2ools'){
  if(!/\bdata\/core\//i.test(rel)||/\b(homebrew|license|source|sourcegroup)\b/i.test(rel))return [];
  const data=JSON.parse(strings.body);
  if(!obj(data)||!pf2Types.has(str(data.type).toLowerCase()))return [];
  return [{id:rel,name:data.name?.display||data.name?.primary||data.name,
   category:category(data.type,rel),description:plainText(data.data?.entries||data.data?.description),
   price:money(data.data?.price),weight:null,traits:data.tags}];
 }
 if(source==='pf2e-orc'){
  if(!/\bdata\/item\/[^/]+\.json$/i.test(rel))return [];
  const row=JSON.parse(strings.body);
  if(!obj(row))return [];
  const id=str(row.id)||base.replace(/\.json$/,'');
  const local=(field)=>str(strings.locales[id+'.'+field]||strings.locales['item.'+id+'.'+field]);
  const name=local('name')||str(row.name);
  const description=local('text')||str(row.text);
  const basic={id,name,description,category:category(row.kind||row.category||row.type,'item'),
   price:Number.isSafeInteger(row.priceCp)?row.priceCp/100+' gp':'',weight:null,
   traits:row.traits,level:row.level,review:row.review};
  return [basic,...(Array.isArray(row.variants)?row.variants.filter(obj).map((variant,i)=>({
   ...basic,id:id+':variant:'+i,name:local('variants.'+i+'.name')||str(variant.name)||name+' ('+(i+1)+')',
   price:Number.isSafeInteger(variant.priceCp)?variant.priceCp/100+' gp':basic.price,
   level:variant.level??row.level,variant:variant
  })):[])];
 }
 if(source==='pf2e-json'){
  // This legacy repository stores related items in named arrays inside
  // json/weapons-pf2.json, json/consumables-pf2.json, etc.
  const match=/^json\/(adv-gear-v2|advGear|alchemical|armor|artifacts|consumables|held-items|material|runes|services|shields|snares|staves|wands|weapons|worn-items)-pf2\.json$/i.exec(rel);
  if(!match)return [];
  const data=JSON.parse(strings.body);
  if(!obj(data))return [];
  const groups=Object.entries(data).filter(([key,value])=>Array.isArray(value)&&!['sources','index'].includes(key));
  return groups.flatMap(([group,items])=>items.filter(row=>obj(row)&&str(row.name).trim())
   .map((row,i)=>{
    const type=str(row.type||row.category||group);
    const name=row.name.trim();
    const price=money(row.price??row.Price??row.cost);
    const entry={
     id:str(row.link)||group+':'+i,name,category:category(type,rel),
     description:plainText(row.text||row.description||row.entries),
     price,weight:null,level:row.level??row.Level,
     damage:row.damage,traits:row.traits||row.weaponTraits,
     armor:row.acBonus,range:row.range
    };
    return entry;
   }));
 }
 return [];
}
async function* walk(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(entry.name==='.git'||entry.name==='node_modules'||entry.name==='homebrew')continue;
  const path=join(dir,entry.name);
  if(entry.isDirectory())yield* walk(path);
  else if(entry.isFile()&&entry.name.endsWith('.json'))yield path;
 }
}
export async function buildExtraCatalog(source,input,version,output){
 const info=EXTRA_ITEM_SOURCES[source];
 if(!info||!/^[a-f0-9]{40}$/.test(version))throw Error('Select a supported source and exact 40-digit upstream commit SHA.');
 const base=resolve(input),files=[],rows=[],seen=new Set();
 let locales={};
 if(source==='pf2e-orc')locales=JSON.parse(await readFile(join(base,'i18n/en.json'),'utf8'));
 for await(const file of walk(base)){
  const rel=relative(base,file).split(sep).join('/');
  if(rel.startsWith('..')||rel==='i18n/en.json')continue;
  if(!['pf1e-foundry','pf1e-pfdata','pf1e-openref','pf2e-pf2ools','pf2e-orc','pf2e-json'].includes(source))continue;
  // Files from source archives are interpreted strictly by the selected adapter.
  let selected=[];
  try{selected=entriesFor(source,rel,{body:await readFile(file,'utf8'),locales});}
  catch(error){throw Error('Invalid upstream item file '+rel+': '+error.message);}
  if(!selected.length)continue;
  files.push(rel);
  for(const [index,entry] of selected.entries()){
   const name=str(entry.name).trim();
   if(!name||name.length>80)continue;
   const key=hash(source+':'+rel+':'+String(entry.id??index)).slice(0,32);
   if(seen.has(key))continue;seen.add(key);
   const link='https://github.com/'+info.repository+'/blob/'+version+'/'+rel.split('/').map(encodeURIComponent).join('/');
   const sourceRow={
    itemKey:key,name,sourceId:info.sourceId,sourceSystem:info.system,sourceVersion:version,
    category:entry.category,description:str(entry.description).slice(0,30000),
    originalPriceText:str(entry.price).slice(0,160),priceGil:null,sourceUrl:link,detailUrl:link,
    sourceRepository:info.repository,sourceProvider:info.label.split(' · ')[1],
    sourceFile:rel,sourceCategoryDetail:str(entry.category),mechanicsMode:'informational-only'
   };
   if(info.system==='pathfinder-1e'&&entry.weight!==null&&entry.weight!==undefined&&Number.isFinite(entry.weight))
    sourceRow.weight=entry.weight;
   for(const [field,val] of Object.entries({dmg:entry.damage,crit:entry.crit,range:entry.range,
    acBonus:entry.armor,traits:entry.traits,level:entry.level,review:entry.review})){
    if(typeof val==='string'&&val.length<=200)sourceRow[field]=val;
    else if(typeof val==='number'&&Number.isFinite(val))sourceRow[field]=String(val);
    else if(Array.isArray(val))sourceRow[field]=val.map(String).join(', ').slice(0,200);
   }
   rows.push(sourceRow);
  }
 }
 if(!rows.length)throw Error('No compatible item entries found; refusing to stage an empty catalog.');
 if(rows.length>50000)throw Error('Extra catalog exceeds 50,000 items.');
 rows.sort((a,b)=>a.name.localeCompare(b.name)||a.itemKey.localeCompare(b.itemKey));
 const catalog={schemaVersion:'cosmos.extra-item-catalog.v1',sourceKey:source,sourceId:info.sourceId,
  sourceSystem:info.system,version,itemCount:rows.length,sourceFiles:files.length,items:rows};
 validateExtraCatalog(catalog,source);
 const bytes=Buffer.from(JSON.stringify(catalog)),compressed=gzipSync(bytes,{level:9});
 const dest=resolve(output),tmp=dest+'.tmp-'+process.pid;
 try{await writeFile(tmp,compressed,{flag:'wx',mode:0o600});await rename(tmp,dest);}
 catch(error){await rm(tmp,{force:true});throw error;}
 console.log(JSON.stringify({source,version,files:files.length,items:rows.length,output:dest,
  sha256:hash(bytes),compressedSha256:hash(compressed),size:compressed.length},null,2));
 return catalog;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [source,input,revision,out]=process.argv.slice(2);
 if(!source||!input||!revision||!out){
  console.error('Usage: node scripts/build-extra-item-catalog.mjs <source-key> <extracted-upstream-root> <40-character-commit-SHA> <output.json.gz>');
  process.exitCode=2;
 }else await buildExtraCatalog(source,input,revision,out);
}
