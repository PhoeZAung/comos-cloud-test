import {shopSourceForItem} from './shop-sources.mjs';

// A shop catalog identifies one independently imported dataset, not one game system.
// A provider must use its own sourceId or sourceVersion when importing another dataset.
const part=/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
export function catalogKey(sourceId,sourceVersion){
 return String(sourceId||'')+'~'+String(sourceVersion||'');
}
export function parseCatalogKey(value){
 if(typeof value!=='string'||value.length>129)return null;
 const parts=value.split('~');
 return parts.length===2&&parts.every(x=>part.test(x))
  ?{sourceId:parts[0],sourceVersion:parts[1]}:null;
}
const gameNames={'pathfinder-1e':'Pathfinder 1e','pathfinder-2e':'Pathfinder 2e',ffd20:'FFd20',cosmos:'Cosmos'};
const first=(...values)=>values.find(value=>typeof value==='string'&&value.trim())?.trim()||'';
function githubRepository(url){
 try{
  const parsed=new URL(url);
  if(parsed.hostname!=='github.com'&&parsed.hostname!=='raw.githubusercontent.com')return '';
  const segments=parsed.pathname.split('/').filter(Boolean);
  return segments.length>=2&&/^[A-Za-z0-9_.-]+$/.test(segments[0])&&/^[A-Za-z0-9_.-]+$/.test(segments[1])
   ?segments[0]+'/'+segments[1].replace(/\.git$/,''):'';
 }catch{return '';}
}
export function shopCatalogLabel(item={}){
 const catalog=item.catalog||item.sourceCatalog||{};
 const sourceId=String(item.sourceId||item.source_id||catalog.sourceId||'');
 const version=String(item.sourceVersion||item.source_version||catalog.sourceVersion||'');
 const system=shopSourceForItem({...item,sourceId,sourceSystem:catalog.sourceSystem||item.sourceSystem});
 const game=gameNames[system]||'Cosmos';
 const repository=first(catalog.sourceRepository,catalog.repository,githubRepository(first(catalog.sourceUrl,catalog.detailUrl,catalog.link)));
 const provider=first(catalog.sourceProvider,catalog.provider,catalog.catalogName,catalog.catalogLabel,catalog.sourceName);
 let origin='';
 if(repository)origin=(/^(foundryvtt|foundry)\//i.test(repository)?'Foundry':'GitHub')+' ('+repository+')';
 else if(provider)origin=provider;
 else if(sourceId==='pathfinder-shopping')origin='Archives of Nethys';
 else if(sourceId==='pathfinder-2e-shopping')origin='Foundry (foundryvtt/pf2e)';
 else if(sourceId==='ffd20-shopping')origin='FFd20 source';
 else if(sourceId==='legacy-master')origin='Master catalog';
 else origin=sourceId||'Imported catalog';
 return game+' · '+origin+(version?' ['+version+']':'');
}
