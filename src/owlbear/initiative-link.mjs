// Shared, non-sensitive link classification for initiative indicators.
// An NPC can be linked to a GM-owned NPC record without a public siteId.
export function initiativeLinkStatus(row={}){
 if(row.linked&&row.available===false)return {kind:'missing',label:'Token not connected — broken Cosmos sheet link'};
 if(row.isNpc&&row.linked)return {kind:'npc',label:'NPC connected to Cosmos'};
 if(row.siteId||row.linked)return {kind:'character',label:'Party connected to Cosmos'};
 return {kind:'unlinked',label:'Token not connected to Cosmos — manual combatant'};
}
