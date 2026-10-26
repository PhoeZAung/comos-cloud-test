// Lore permissions rely on persisted character-tag links, not user-editable JSON.
export const LORE_ADMIN_TAG_ID='00000000-0000-4000-8000-0000000000ad';

export function createLoreAccess(db){
 const activeAdmin=db.prepare('SELECT 1 FROM character_tag_links l JOIN characters c ON c.id=l.character_id WHERE c.owner_id=? AND c.archived=0 AND l.tag_id=? LIMIT 1');
 const firstCharacter=db.prepare('SELECT id FROM characters WHERE owner_id=? AND archived=0 ORDER BY created_at,id LIMIT 1');
 const attach=db.prepare('INSERT OR IGNORE INTO character_tag_links(character_id,tag_id) VALUES(?,?)');
 const listTags=db.prepare('SELECT id,name FROM character_tags ORDER BY name COLLATE NOCASE,id');
 const ownTags=db.prepare('SELECT DISTINCT t.id,t.name FROM character_tags t JOIN character_tag_links l ON l.tag_id=t.id JOIN characters c ON c.id=l.character_id WHERE c.owner_id=? AND c.archived=0 ORDER BY t.name COLLATE NOCASE,t.id');
 const tagAllowed=db.prepare('SELECT 1 FROM character_tag_links l JOIN characters c ON c.id=l.character_id WHERE c.owner_id=? AND c.archived=0 AND l.tag_id=? LIMIT 1');
 const tagExists=db.prepare('SELECT 1 FROM character_tags WHERE id=?');
 const exists=db.prepare('SELECT 1 FROM lore_entries WHERE id=?');
 const visible=db.prepare('SELECT 1 FROM lore_entries e WHERE e.id=? AND (e.author_id=? OR EXISTS (SELECT 1 FROM lore_entry_tags et JOIN character_tag_links l ON l.tag_id=et.tag_id JOIN characters c ON c.id=l.character_id WHERE et.entry_id=e.id AND c.owner_id=? AND c.archived=0))');
 return Object.freeze({
  isPrivileged(userId,{admin=false}={}){
   return Boolean(userId&&(admin||activeAdmin.get(userId,LORE_ADMIN_TAG_ID)));
  },
  // Verified Firebase admins receive Admin on their first active character.
  // Without a character, verified admin access still works.
  ensureAdminTag(userId){
   if(!userId)return false;
   if(activeAdmin.get(userId,LORE_ADMIN_TAG_ID))return true;
   const character=firstCharacter.get(userId);
   if(!character)return false;
   attach.run(character.id,LORE_ADMIN_TAG_ID);
   return true;
  },
  availableTags(userId,{admin=false}={}){
   if(!userId)return [];
   return admin||activeAdmin.get(userId,LORE_ADMIN_TAG_ID)?listTags.all():ownTags.all(userId);
  },
  allowsTags(userId,tagIds,{admin=false}={}){
   if(!userId)return false;
   if(tagIds.some(id=>!tagExists.get(id)))return false;
   return Boolean(admin||activeAdmin.get(userId,LORE_ADMIN_TAG_ID)||tagIds.every(id=>Boolean(tagAllowed.get(userId,id))));
  },
  canRead(userId,entryId,{admin=false}={}){
   if(!userId)return false;
   return Boolean(admin||activeAdmin.get(userId,LORE_ADMIN_TAG_ID)?exists.get(entryId):visible.get(entryId,userId,userId));
  },
  // Add to the library WHERE clause; untagged entries stay author-only.
  restrictList(userId,{admin=false}={}){
   if(!userId)return {sql:'0=1',args:[]};
   if(admin||activeAdmin.get(userId,LORE_ADMIN_TAG_ID))return {sql:'1=1',args:[]};
   return {
    sql:'(l.author_id=? OR EXISTS (SELECT 1 FROM lore_entry_tags visible_tag JOIN character_tag_links owned_link ON owned_link.tag_id=visible_tag.tag_id JOIN characters owned_character ON owned_character.id=owned_link.character_id WHERE visible_tag.entry_id=l.id AND owned_character.owner_id=? AND owned_character.archived=0))',
    args:[userId,userId]
   };
  }
 });
}
