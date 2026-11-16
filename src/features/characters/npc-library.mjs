// Display tags for GM-only NPC catalog records.
// Keep the existing storage categories for compatibility with earlier
// Kingmaker imports; never rewrite previously saved NPCs to add a tag.
export const NPC_CATALOG_TABS=Object.freeze([
 Object.freeze({id:'npc',name:'NPC',category:'npc-codex',tag:'npc'}),
 Object.freeze({id:'bestiary',name:'Bestiary',category:'bestiary',tag:'bestiary'}),
 Object.freeze({id:'companions',name:'Companions',category:'companions',tag:'companion'})
]);

// Existing NPCs without a category remain ordinary NPCs. The prior
// 'npc-codex' query/storage identifier remains supported.
export function npcCatalogTab(value){
 if(value==='bestiary')return 'bestiary';
 if(value==='companions'||value==='companion')return 'companions';
 if(value==='npc'||value==='npc-codex'||value==null||value==='')return 'npc';
 return null;
}
export function npcStorageCategory(value){
 const tab=npcCatalogTab(value);
 if(tab===null)throw Error('Invalid NPC catalog category.');
 return NPC_CATALOG_TABS.find(item=>item.id===tab).category;
}
export function npcCatalogTag(value){
 const tab=npcCatalogTab(value);
 if(tab===null)throw Error('Invalid NPC catalog category.');
 return NPC_CATALOG_TABS.find(item=>item.id===tab).tag;
}
export function npcTagForData(data={}){
 return npcCatalogTag(data?.npcCategory);
}
export function isNpcCompanion(data={}){
 return npcTagForData(data)==='companion';
}
