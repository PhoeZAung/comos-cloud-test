/** Public shop tabs. Source provenance survives purchases in one shared inventory. */
export const SHOP_SOURCES=Object.freeze([
 {id:'cosmos',label:'Cosmos'},
 {id:'pathfinder-1e',label:'Pathfinder 1e'},
 {id:'pathfinder-2e',label:'Pathfinder 2e'},
 {id:'ffd20',label:'FFd20'}
]);
export const SHOP_SOURCE_IDS=Object.freeze(SHOP_SOURCES.map(source=>source.id));
export const ALL_SHOP_SOURCES='all';
export function shopSourceForItem(item={}){
 const id=String(item.sourceSystem||item.catalog?.sourceSystem||item.shopSource||item.sourceId||item.source_id||'').toLowerCase();
 if(['pathfinder-2e','pathfinder-2e-shopping','pf2e'].includes(id)||/^(?:pf2e|pathfinder-2e)[-_.]/.test(id))return 'pathfinder-2e';
 if(['pathfinder-1e','pathfinder-shopping','pf1e','pathfinder'].includes(id)||/^(?:pf1e|pathfinder-1e)[-_.]/.test(id))return 'pathfinder-1e';
 if(['ffd20','ffd20-shopping'].includes(id)||/^ffd20[-_.]/.test(id))return 'ffd20';
 return 'cosmos';
}
export function shopSourceLabel(item){
 return SHOP_SOURCES.find(source=>source.id===shopSourceForItem(item))?.label||'Cosmos';
}
export function isShopSource(value){return value===ALL_SHOP_SOURCES||SHOP_SOURCE_IDS.includes(value);}
export function shopSourceSql(source){
 if(!source||source===ALL_SHOP_SOURCES)return {sql:'',params:[]};
 if(source==='cosmos')return {sql:" AND source_id NOT IN ('pathfinder-shopping','pathfinder-2e-shopping','ffd20-shopping') AND source_id NOT LIKE 'pf1e-%' AND source_id NOT LIKE 'pathfinder-1e-%' AND source_id NOT LIKE 'pf2e-%' AND source_id NOT LIKE 'pathfinder-2e-%' AND source_id NOT LIKE 'ffd20-%'",params:[]};
 if(source==='pathfinder-1e')return {sql:" AND (source_id=? OR source_id LIKE 'pf1e-%' OR source_id LIKE 'pathfinder-1e-%')",params:['pathfinder-shopping']};
 if(source==='pathfinder-2e')return {sql:" AND (source_id=? OR source_id LIKE 'pf2e-%' OR source_id LIKE 'pathfinder-2e-%')",params:['pathfinder-2e-shopping']};
 if(source==='ffd20')return {sql:" AND (source_id=? OR source_id LIKE 'ffd20-%')",params:['ffd20-shopping']};
 throw Error('Invalid shop source');
}
