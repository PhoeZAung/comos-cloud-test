import {readdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import {resolve,relative,join,basename,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {EXTRA_ITEM_SOURCES,validateExtraCatalog} from '../backend/items/extra-sources.mjs';
import {readableDescription} from './build-pf2e-catalog.mjs';
import {mapFoundry1e,mapPfData,mapOrc2e,mapLegacyPf2e} from './extra-item-values.mjs';

// Only the six real, item-bearing compendiums in the pinned PF1e Foundry archive.
const foundryPacks=new Set(['pf-items','pf-goods-services','pf-magic','pf-wondrous','pf-artifacts','pf-technology']);
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
// Parse only explicit player-facing amounts in source text; do not infer a price.
const labeled=(description,label)=>{
 const pattern=new RegExp('(?:^|[\\n;])\\s*\\*\\*'+label+'\\*\\*\\s*:?\\s*([^;\\n]+)','i');
 return pattern.exec(description)?.[1]?.trim()||'';
};
const pounds=value=>{
 const match=/^\s*(\d[\d,]*(?:\.\d+)?)\s*(?:lbs?\.?|pounds?)\b/i.exec(str(value).trim());
 if(!match)return null;
 const n=Number(match[1].replaceAll(',',''));
 return Number.isFinite(n)&&n>=0&&n<=1000000?n:null;
};
const normalizedField=value=>str(value).toLowerCase().replace(/[^a-z0-9]/g,'');
const referenceColumn=(cells,...labels)=>{
 const normalized=new Set(labels.map(normalizedField));
 return str(cells.find(row=>normalized.has(normalizedField(row.field)))?.value);
};
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
  if(!obj(row)||!['loot','weapon','equipment','consumable','container','armor','shield','ammo'].includes(str(row.type).toLowerCase()))return [];
  return [mapFoundry1e(row,match[1])];
 }
 if(source==='pf1e-pfdata'){
  if(!/\bjson\/(equipment|magic|item)[-_][^/]+\.json$/i.test(rel))return [];
  const data=JSON.parse(strings.body);
  if(!obj(data))return [];
  return Object.entries(data).filter(([id,row])=>id!=='not_found'&&obj(row)&&str(row.name)&&!row.redirect)
   .map(([id,row])=>({id,...mapPfData(row,rel)}));
 }
 if(source==='pf1e-openref'){
  if(!/\bbooks\/[^/]+\/\d+\.json$/i.test(rel))return [];
  const data=JSON.parse(strings.body);
  if(!Array.isArray(data))return [];
  return data.filter(row=>obj(row)&&['item','vehicle'].includes(row.t)&&str(row.n)).map(row=>{
   const cells=Array.isArray(row.x?.item_misc)?row.x.item_misc.filter(obj):[];
   const field=(...labels)=>referenceColumn(cells,...labels);
   const armor=field('Armor Bonus','Armor/ShieldBonus','Armor/Shield Bonus');
   const weaponClass=field('Weapon Class','Proficiency');
   const isArmor=Boolean(armor||field('Armor Type'));
   const isWeapon=Boolean(weaponClass||field('Damage (M)','Damage'));
   const itemCategory=row.t==='vehicle'?'Vehicles & Mounts':isArmor?'Armor':
     isWeapon?(/ranged/i.test(weaponClass)?'Ranged Weapon':'Weapon'):'Gear';
   return {
    id:row.i,name:row.n,category:itemCategory,description:plainText(row.b),
    price:money(row.x?.item_details?.price)||field('Price')||money(row.cost),
    weight:pounds(row.x?.item_details?.weight)||pounds(field('Weight'))||weight(row.weight),
    damage:field('Damage (M)','Damage (Medium)','Damage'),
    crit:field('Critical'),range:field('Range'),
    armor,maxDex:field('MaxDex Bonus','Max Dex Bonus','Maximum Dex Bonus'),
    checkPenalty:field('ArmorCheck Penalty','Armor Check Penalty'),
    spellFailure:field('Arcane SpellFailure Chance','Arcane Spell Failure Chance'),
    speed30Ft:field('Speed (30 ft.)'),speed20Ft:field('Speed (20 ft.)'),
    proficiency:weaponClass,rawUrl:row.u
   };
  });
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
  if(!/\bdata\/items\/item\.[^/]+\.json$/i.test(rel))return [];
  const row=JSON.parse(strings.body);
  if(!obj(row))return [];
  const id=str(row.id)||base.replace(/\.json$/,'');
  const basic=mapOrc2e({...row,id},strings.locales);
  return [basic,...(Array.isArray(row.variants)?row.variants.filter(obj).map((variant,i)=>({
   ...basic,id:id+':variant:'+i,
   name:str(strings.locales[id+'.variants.'+i+'.name']||variant.name||'')||basic.name+' ('+(i+1)+')',
   price:Number.isSafeInteger(variant.priceCp)?variant.priceCp/100+' gp':basic.price,
   itemLevel:variant.level??basic.itemLevel
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
   .map((row,i)=>({...mapLegacyPf2e(row,group,rel),id:row.id||row.link||group+':'+i})));
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
    originalPriceText:str(entry.price).slice(0,160),priceGil:null,sourceUrl:link,
    detailUrl:source==='pf2e-json'&&/^https:\/\/2e\.aonprd\.com\/(?:Equipment|Weapons|Armor|Shields)\.aspx\?ID=\d+$/i.test(entry.originalLink||'')?entry.originalLink:link,
    sourceRepository:info.repository,sourceProvider:info.label.split(' · ')[1],
    sourceFile:rel,sourceCategoryDetail:str(entry.originalCategory||entry.category),mechanicsMode:'informational-only'
   };
   if(info.system==='pathfinder-1e'&&entry.weight!==null&&entry.weight!==undefined&&Number.isFinite(entry.weight))
    sourceRow.weight=entry.weight;
   for(const [field,val] of Object.entries({dmg:entry.damage,dmgS:entry.dmgS,crit:entry.crit,range:entry.range,
    acBonus:entry.armor,maxDex:entry.maxDex,checkPenalty:entry.checkPenalty,
    spellFailure:entry.spellFailure,speed30Ft:entry.speed30Ft,speed20Ft:entry.speed20Ft,
    proficiency:entry.proficiency,damageType:entry.damageType,pf2eBulk:entry.pf2eBulk,
    dcSave:entry.dcSave,craftDc:entry.craftDc,duration:entry.duration,cl:entry.cl,
    effect:entry.effect,rarity:entry.rarity,usageType:entry.usageType,
    traits:entry.traits,itemLevel:entry.itemLevel??entry.level,review:entry.review})){
    if(typeof val==='string'&&val.trim()&&val.length<=200)sourceRow[field]=val;
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
