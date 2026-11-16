// Presentation-only pagination. Never truncate the authoritative history arrays.
export const HISTORY_BATCH_SIZE=5;
export function historyPage(rows,limit=HISTORY_BATCH_SIZE){
 const all=Array.isArray(rows)?rows:[];
 const count=Number.isSafeInteger(limit)?Math.max(HISTORY_BATCH_SIZE,limit):HISTORY_BATCH_SIZE;
 return {rows:all.slice(0,count),hasMore:all.length>count,remaining:Math.max(0,all.length-count)};
}
export function nextHistoryLimit(limit=HISTORY_BATCH_SIZE){
 return (Number.isSafeInteger(limit)&&limit>=HISTORY_BATCH_SIZE?limit:HISTORY_BATCH_SIZE)+HISTORY_BATCH_SIZE;
}
