// Shared, non-sensitive link classification for initiative indicators.
// An NPC can be linked to a GM-owned NPC record without a public siteId.
export function initiativeLinkStatus(row={}){
 if(row.linked&&row.available===false)return {kind:'missing',label:'Broken Cosmos sheet link'};
 if(row.isNpc&&row.linked)return {kind:'npc',label:'Linked NPC sheet'};
 if(row.siteId||row.linked)return {kind:'character',label:'Linked character sheet'};
 return {kind:'unlinked',label:'Unlinked token — manual combatant'};
}
