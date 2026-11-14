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
 const id=String(item.shopSource||item.sourceSystem||item.sourceId||item.source_id||'').toLowerCase();
 if(['pathfinder-2e','pathfinder-2e-shopping','pf2e'].includes(id))return 'pathfinder-2e';
 if(['pathfinder-1e','pathfinder-shopping','pf1e','pathfinder'].includes(id))return 'pathfinder-1e';
 if(['ffd20','ffd20-shopping'].includes(id))return 'ffd20';
 return 'cosmos';
}
export function shopSourceLabel(item){
 return SHOP_SOURCES.find(source=>source.id===shopSourceForItem(item))?.label||'Cosmos';
}
export function isShopSource(value){return value===ALL_SHOP_SOURCES||SHOP_SOURCE_IDS.includes(value);}
export function shopSourceSql(source){
 if(!source||source===ALL_SHOP_SOURCES)return {sql:'',params:[]};
 if(source==='cosmos')return {sql:" AND source_id NOT IN ('pathfinder-shopping','pathfinder-2e-shopping','ffd20-shopping')",params:[]};
 if(source==='pathfinder-1e')return {sql:' AND source_id=?',params:['pathfinder-shopping']};
 if(source==='pathfinder-2e')return {sql:' AND source_id=?',params:['pathfinder-2e-shopping']};
 if(source==='ffd20')return {sql:' AND source_id=?',params:['ffd20-shopping']};
 throw Error('Invalid shop source');
}
