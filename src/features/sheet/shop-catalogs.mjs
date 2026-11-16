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
const extraShopNames=Object.freeze({
 'pf1e-foundry':'PF1e · Foundry',
 'pf1e-pfdata':'PF1e · PF Data',
 'pf1e-openref':'PF1e · Open Ref',
 'pf2e-pf2ools':'PF2e · Pf2ools',
 'pf2e-orc':'PF2e · ORC',
 'pf2e-json':'PF2e · JSON'
});
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
 const namedSystem=String(catalog.sourceSystem||item.sourceSystem||'').toLowerCase();
 const game=/^(?:dnd|dnd-?5e|dungeons-and-dragons-?5e)(?:[-_.]?2024)?$/.test(namedSystem)
  ?'D&D 5e'+(namedSystem.includes('2024')?' (2024)':'')
  :gameNames[system]||'Cosmos';
 const repository=first(catalog.sourceRepository,catalog.repository,githubRepository(first(catalog.sourceUrl,catalog.detailUrl,catalog.link)));
 const provider=first(catalog.sourceProvider,catalog.provider,catalog.catalogName,catalog.catalogLabel,catalog.sourceName);
 let origin='';
 if(repository)origin=(provider||(/^(foundryvtt|foundry)\//i.test(repository)?'Foundry':'GitHub'))+' ('+repository+')';
 else if(provider)origin=provider;
 else if(sourceId==='pathfinder-shopping')origin='Archives of Nethys';
 else if(sourceId==='pathfinder-2e-shopping')origin='Foundry (foundryvtt/pf2e)';
 else if(sourceId==='ffd20-shopping')origin='FFd20 source';
 else if(sourceId==='legacy-master')origin='Master catalog';
 else origin=sourceId||'Imported catalog';
 return game+' · '+origin+(version?' ['+version+']':'');
}


// Concise, distinct labels for player-facing controls. Keep full provenance
// separately for accessibility and traceability.
export function shopCatalogShortLabel(item={}){
 const catalog=item.catalog||item.sourceCatalog||{};
 const sourceId=String(item.sourceId||item.source_id||catalog.sourceId||'');
 if(extraShopNames[sourceId])return extraShopNames[sourceId];
 const system=shopSourceForItem({...item,sourceId,sourceSystem:catalog.sourceSystem||item.sourceSystem});
 const namedSystem=String(catalog.sourceSystem||item.sourceSystem||'').toLowerCase();
 const game=/^(?:dnd|dnd-?5e|dungeons-and-dragons-?5e)(?:[-_.]?2024)?$/.test(namedSystem)
  ?(namedSystem.includes('2024')?'5e24':'5e14')
  :({'pathfinder-1e':'PF1e','pathfinder-2e':'PF2e',ffd20:'FFd20',cosmos:'Cosmos'}[system]||'Cosmos');
 const repository=first(catalog.sourceRepository,catalog.repository,githubRepository(first(catalog.sourceUrl,catalog.detailUrl,catalog.link)));
 const provider=first(catalog.sourceProvider,catalog.provider,catalog.catalogName,catalog.catalogLabel,catalog.sourceName);
 let origin='';
 if(sourceId==='legacy-master')return 'Cosmos';
 if(sourceId==='pathfinder-shopping')origin='AoN';
 else if(repository)origin=/^(foundryvtt|foundry)\//i.test(repository)?'Foundry':repository.split('/')[0];
 else if(sourceId==='pathfinder-2e-shopping')origin='Foundry';
 else if(sourceId==='ffd20-shopping')origin='Core';
 else if(provider)origin=provider;
 else origin=sourceId.replace(/^(?:pf1e|pf2e|pathfinder-1e|pathfinder-2e|ffd20)[._-]?/i,'').replace(/[_-]+/g,' ').trim()||'Core';
 return game+' · '+String(origin).slice(0,26);
}

export function shopCatalogChoiceLabel(item={},catalogs=[]){
 if(extraShopNames[item.sourceId])return extraShopNames[item.sourceId];
 if(item.sourceId==='pathfinder-shopping')return 'PF1e · AoN';
 if(item.sourceId==='pathfinder-2e-shopping')return 'PF2e · Foundry';
 if(item.sourceId==='legacy-master')return 'Cosmos';
 const base=item.shortLabel||shopCatalogShortLabel(item);
 const others=catalogs.filter(c=>c.id!==item.id&&(c.shortLabel||shopCatalogShortLabel(c))===base);
 if(!others.length)return base;
 const version=String(item.sourceVersion||'').replace(/^(?:foundry-|pathfinder-|pf1e-|pf2e-)/i,'').slice(0,24);
 return base+' · '+(version||String(item.sourceId||'').slice(0,16));
}


/** Player shop tags: combine versions from the same official import, keep
 * other providers independent, and hide tiny legacy/test catalogs (<50).
 * The underlying items and historical purchases are never deleted. */
export function visibleShopCatalogs(catalogs=[]){
 const merged=new Map();
 for(const catalog of catalogs){
  if(!catalog||typeof catalog.id!=='string'||!Number.isFinite(catalog.count))continue;
  const sourceId=String(catalog.sourceId||'');
  const core=['legacy-master','pathfinder-shopping','pathfinder-2e-shopping'].includes(sourceId)||Boolean(extraShopNames[sourceId]);
  const groupKey=core?sourceId:catalog.id;
  const label=extraShopNames[sourceId]|| (sourceId==='legacy-master'?'Cosmos':sourceId==='pathfinder-shopping'?'PF1e · AoN':sourceId==='pathfinder-2e-shopping'?'PF2e · Foundry':catalog.shortLabel||shopCatalogShortLabel(catalog));
  const previous=merged.get(groupKey);
  if(previous){previous.count+=catalog.count;previous.catalogIds.push(catalog.id);}
  else merged.set(groupKey,{...catalog,id:groupKey,label,shortLabel:label,catalogIds:[catalog.id],count:catalog.count});
 }
 return [...merged.values()].filter(source=>source.count>=50||['legacy-master','pathfinder-shopping','pathfinder-2e-shopping'].includes(source.sourceId)||Boolean(extraShopNames[source.sourceId]));
}
