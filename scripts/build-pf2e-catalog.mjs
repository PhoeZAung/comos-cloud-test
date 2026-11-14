import {readFile,readdir,writeFile,rename,rm} from 'node:fs/promises';
import {resolve,basename,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {PF2E_UPSTREAM_SHA,PF2E_SOURCE_VERSION} from '../backend/items/pf2e-offline.mjs';

const EQUIPMENT_TYPES=new Set(['weapon','armor','shield','consumable','equipment','treasure','ammo','backpack','kit','book']);
const entity=match=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&apos;':"'",'&nbsp;':' '}[match]??match);
export function readableDescription(html){
 return String(html||'')
  .replace(/@Damage\[\(([^)\]]+)\)\[([^\]]+)\]\]/g,'$1 $2')
  .replace(/@Damage\[([^\]]+)\]/g,'$1')
  .replace(/@(?:UUID|Localize|Check|Template)\[[^\]]+\]\{([^}]+)\}/g,'$1')
  .replace(/@UUID\[([^\]]+)\]/g,'$1')
  .replace(/<br\s*\/?>/gi,'\n')
  .replace(/<\/(?:p|div|li|ul|ol|h[1-6]|tr)>/gi,'\n')
  .replace(/<li(?:\s[^>]*)?>/gi,'• ')
  .replace(/<[^>]*>/g,'')
  .replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39);/g,entity)
  .replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Math.min(0x10ffff,Number(code))))
  .replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim().slice(0,30000);
}
function sourcePrice(price){
 if(!price||typeof price!=='object')return '';
 const coins=['pp','gp','sp','cp'];
 const parts=coins.filter(coin=>Number.isFinite(price.value?.[coin])&&price.value[coin]>=0)
  .map(coin=>String(price.value[coin])+' '+coin);
 if(!parts.length)return '';
 const per=price.per;
 return parts.join(' + ')+(Number.isSafeInteger(per)&&per>1?' / '+per:'');
}
const detail=(name,val)=>val===undefined||val===null||val===''?null:{name,val:String(val)};
function categoryFor(source){
 const system=source.system||{};
 if(source.type==='weapon')return typeof system.range==='number'&&system.range>0?'Ranged Weapon':'Weapon';
 if(source.type==='armor'||source.type==='shield')return 'Armor';
 if(source.type==='consumable')return 'Consumables';
 if(source.type==='ammo')return 'Ammunition';
 if(source.type==='treasure'&&system.stackGroup==='coins')return 'Materials & Crafting';
 return 'Gear';
}
export function convertFoundryEquipment(source,filename){
 if(!source||typeof source!=='object'||!EQUIPMENT_TYPES.has(source.type)||
  !/^[a-z0-9][a-z0-9_-]*\.json$/.test(filename)||
  !/^[A-Za-z0-9]{16}$/.test(source._id||'')||
  typeof source.name!=='string'||!source.name.trim()||source.name.length>80||
  !source.system||typeof source.system!=='object')return null;
 const s=source.system,kind=source.type;
 const url='https://github.com/foundryvtt/pf2e/blob/'+PF2E_UPSTREAM_SHA+'/packs/pf2e/equipment/'+filename;
 const roll=s.damage?.kind==='healing'&&typeof s.damage.formula==='string'?s.damage.formula:'';
 const weaponDamage=(Number.isInteger(s.damage?.dice)&&s.damage.dice>0&&/^d\d+$/.test(s.damage?.die||''))
  ?s.damage.dice+s.damage.die:'';
 const effect=roll?'Heals '+roll+' HP':undefined;
 const fields=[
  detail('Level',s.level?.value),detail('Bulk (PF2e)',s.bulk?.value),
  detail('Rarity',s.traits?.rarity),detail('Traits',Array.isArray(s.traits?.value)?s.traits.value.join(', '):''),
  detail('Usage',s.usage?.value),detail('Publication',s.publication?.title)
 ].filter(Boolean);
 const stats={
  ...(weaponDamage?{dmg:weaponDamage,damage:weaponDamage}:{}),
  ...(s.damage?.damageType?{damageType:s.damage.damageType}:{}),
  ...(typeof s.range==='number'&&s.range>0?{range:String(s.range)+' ft.'}:{}),
  ...(typeof s.acBonus==='number'?{acBonus:String(s.acBonus)}:{}),
  ...(typeof s.dexCap==='number'?{maxDex:String(s.dexCap)}:{}),
  ...(typeof s.checkPenalty==='number'?{checkPenalty:String(s.checkPenalty)}:{}),
  ...(kind==='weapon'&&s.category?{proficiency:String(s.category)}:{}),
  ...(effect?{effect}:{}),
  ...(s.usage?.value?{usageType:s.usage.value}:{}),
  ...(s.traits?.rarity?{rarity:s.traits.rarity}:{})
 };
 const description=readableDescription(s.description?.value);
 return {
  id:'pf2e:'+source._id,name:source.name.trim(),category:categoryFor(source),sourceId:'pathfinder-2e-shopping',
  sourceSystem:'pathfinder-2e',sourceVersion:PF2E_SOURCE_VERSION,sourceUrl:url,detailUrl:url,
  sourceFile:filename,sourceCategoryDetail:kind,originalPriceText:sourcePrice(s.price),
  priceGil:null,description,details:fields,...stats,
  ...(roll?{healing:roll}:{}),
  mechanicsMode:'informational-only',
  license:s.publication?.license||'',remaster:s.publication?.remaster===true
 };
}
export function makeCatalog(entries){
 const items=[],ids=new Set(),counts={};
 for(const [filename,data] of entries){
  const item=convertFoundryEquipment(data,filename);
  if(!item)continue;
  if(ids.has(item.id))throw Error('Duplicate Foundry PF2e item id: '+item.id);
  ids.add(item.id);items.push(item);
  counts[item.category]=(counts[item.category]||0)+1;
 }
 items.sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
 return {schemaVersion:'cosmos.pf2e-foundry-catalog.v1',version:PF2E_SOURCE_VERSION,
  upstreamRef:PF2E_UPSTREAM_SHA,sourceSystem:'pathfinder-2e',
  sourceFiles:entries.length,itemCount:items.length,categoryCounts:counts,items};
}
export async function buildPf2eCatalog(inputDirectory,outputFile){
 const files=(await readdir(inputDirectory)).filter(name=>/^[a-z0-9][a-z0-9_-]*\.json$/.test(name)&&name!=='_folders.json');
 if(files.length<5000)throw Error('Incomplete Foundry equipment directory ('+files.length+' files). Expected the pinned 8.7.0 equipment pack.');
 const entries=[];
 for(const file of files){
  const data=JSON.parse(await readFile(join(inputDirectory,file),'utf8'));
  entries.push([file,data]);
 }
 const catalog=makeCatalog(entries);
 if(catalog.items.length<4000)throw Error('PF2e extraction unexpectedly small: '+catalog.items.length);
 const plain=Buffer.from(JSON.stringify(catalog)),packed=gzipSync(plain,{level:9});
 const target=resolve(outputFile),tmp=target+'.tmp-'+process.pid;
 try{
  await writeFile(tmp,packed,{flag:'wx',mode:0o600});
  await rename(tmp,target);
 }catch(error){await rm(tmp,{force:true});throw error;}
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 console.log(JSON.stringify({state:'built',file:target,sourceFiles:catalog.sourceFiles,
  items:catalog.itemCount,categories:catalog.categoryCounts,sha256:sha(plain),
  compressedSha256:sha(packed),compressedBytes:packed.length},null,2));
 return catalog;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [dir,out]=process.argv.slice(2);
 if(!dir||!out){console.error('Usage: node scripts/build-pf2e-catalog.mjs /path/to/packs/pf2e/equipment /path/to/pf2e-foundry-8.7.0.json.gz');process.exitCode=2;}
 else await buildPf2eCatalog(dir,out);
}
