import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharactersService} from '../backend/characters/service.mjs';
import {createCharacterLibraryService,createCharacterLibraryRoutes,parseCharacterImport} from '../backend/characters/library.mjs';
import {createLoreAccess,LORE_ADMIN_TAG_ID} from '../backend/lore/access.mjs';
import {createLoreService,createLoreRoutes} from '../backend/lore/service.mjs';
import {createDirectoryRoutes} from '../backend/characters/directory.mjs';
import {createApiServer} from '../backend/http/app.mjs';

const now='2026-10-25T12:00:00.000Z',origin='https://comos.test';
function assignCharacter(db,ownerId,tagIds=[]){
 const id=randomUUID();
 db.prepare('INSERT INTO characters(id,owner_id,name,sources_json,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(id,ownerId,'Explorer','[]',now,now);
 const attach=db.prepare('INSERT INTO character_tag_links(character_id,tag_id) VALUES(?,?)');
 for(const tagId of tagIds)attach.run(id,tagId);
 return id;
}
function newTag(db,name){
 const id=randomUUID();db.prepare('INSERT INTO character_tags(id,name) VALUES(?,?)').run(id,name);return id;
}
function story(lore,ownerId,title,tags=[]){
 return lore.create(ownerId,{title,text:'Lore description',tagIds:tags,clientRequestId:randomUUID()});
}
test('Lore is visible by an active character tag, with an author exception and Admin-tag bypass',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const users=createUserRepository(db);
  const alice=users.create({displayName:'Alice'}),bob=users.create({displayName:'Bob'}),charlie=users.create({displayName:'Charlie'}),outsider=users.create({displayName:'No Characters'});
  const dragons=newTag(db,'Dragons'),kings=newTag(db,'Kings');
  assignCharacter(db,alice.id,[dragons]);
  const bobChar=assignCharacter(db,bob.id,[kings]),charlieChar=assignCharacter(db,charlie.id,[dragons]);
  const lore=createLoreService(db),dragon=story(lore,alice.id,'Dragon Chronicle',[dragons]),king=story(lore,bob.id,'King Story',[kings]),untagged=story(lore,alice.id,'Private Notes');
  assert.deepEqual(lore.list(alice.id,{sort:'az'}).entries.map(e=>e.title),['Dragon Chronicle','Private Notes']);
  assert.deepEqual(lore.list(bob.id,{sort:'az'}).entries.map(e=>e.title),['King Story']);
  assert.deepEqual(lore.list(charlie.id,{sort:'az'}).entries.map(e=>e.title),['Dragon Chronicle']);
  assert.deepEqual(lore.list(outsider.id).entries,[]);
  assert.equal(lore.readVisible(bob.id,dragon.id),null);
  assert.equal(lore.readVisible(charlie.id,king.id),null);
  assert.equal(lore.readVisible(alice.id,untagged.id)?.id,untagged.id);
  assert.equal(lore.readVisible(bob.id,untagged.id),null);
  assert.equal(lore.readVisible(outsider.id,dragon.id,{admin:true})?.id,dragon.id);
  assert.equal(lore.readVisible(outsider.id,untagged.id,{admin:true})?.id,untagged.id);
  assert.throws(()=>lore.list(bob.id,{tagIds:[dragons]}),{code:'tag_not_available',status:403});
  assert.equal(lore.list(bob.id,{query:'Dragon'}).entries.length,0,'search cannot reveal hidden stories');
  assert.equal(lore.list(bob.id,{sort:'az',limit:1}).nextCursor,null,'paging stays scoped to visible entries');
  assert.deepEqual(lore.list(outsider.id,{sort:'az',admin:true}).entries.map(e=>e.title),['Dragon Chronicle','King Story','Private Notes']);
  assert.deepEqual(lore.access.availableTags(bob.id).map(t=>t.name),['Kings']);
  db.prepare('INSERT INTO character_tag_links(character_id,tag_id) VALUES(?,?)').run(bobChar,LORE_ADMIN_TAG_ID);
  assert.equal(lore.access.isPrivileged(bob.id),true);
  assert.deepEqual(lore.list(bob.id,{sort:'az'}).entries.map(e=>e.title),['Dragon Chronicle','King Story','Private Notes']);
  assert.deepEqual(lore.access.availableTags(bob.id).map(t=>t.name),['Admin','Dragons','Kings']);
  assert.deepEqual(lore.list(bob.id,{tagIds:[dragons]}).entries.map(e=>e.id),[dragon.id]);
  // The Admin tag is only a Lore visibility grant. It is not an admin edit/delete role.
  assert.throws(()=>lore.update(bob.id,dragon.id,{title:'Spoof',text:'Spoof',blocks:[{type:'text',text:'Spoof'}],tagIds:[],expectedUpdatedAt:dragon.updatedAt}),{code:'edit_forbidden'});
  db.prepare('DELETE FROM character_tag_links WHERE character_id=? AND tag_id=?').run(bobChar,LORE_ADMIN_TAG_ID);
  assert.equal(lore.readVisible(bob.id,dragon.id),null,'removing the Admin tag revokes access immediately');
  db.prepare('UPDATE characters SET archived=1 WHERE id=?').run(charlieChar);
  assert.deepEqual(lore.list(charlie.id).entries,[],'archived characters grant no Lore access');
 }finally{db.close();}
});

test('Verified Firebase admin gets Admin automatically; player import and spoofed labels cannot grant it',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const users=createUserRepository(db),owner=users.create({displayName:'Owner'}),player=users.create({displayName:'Player'});
  const ownerChar=assignCharacter(db,owner.id),library=createCharacterLibraryService(db),access=createLoreAccess(db);
  assert.ok(db.prepare('SELECT id FROM character_tags WHERE id=? AND name=?').get(LORE_ADMIN_TAG_ID,'Admin'));
  assert.equal(access.isPrivileged(owner.id),false);
  const ownTags=library.loreTags(owner.id,{admin:true});
  assert.equal(ownTags.find(t=>t.id===LORE_ADMIN_TAG_ID)?.name,'Admin');
  assert.equal(access.isPrivileged(owner.id),true);
  assert.equal(db.prepare('SELECT count(*) AS n FROM character_tag_links WHERE character_id=? AND tag_id=?').get(ownerChar,LORE_ADMIN_TAG_ID).n,1);
  library.loreTags(owner.id,{admin:true});
  assert.equal(db.prepare('SELECT count(*) AS n FROM character_tag_links WHERE tag_id=?').get(LORE_ADMIN_TAG_ID).n,1,'automatic grant idempotent');
  const forged={name:'Pretender',data:{charName:'Pretender',group_tags:['Admin','Other']}};
  assert.deepEqual(parseCharacterImport(forged).tagNames,['Other']);
  const result=library.import(player.id,forged);
  const playerTags=db.prepare('SELECT t.name FROM character_tags t JOIN character_tag_links l ON l.tag_id=t.id WHERE l.character_id=?').all(result.id);
  assert.deepEqual(playerTags,[]);
  assert.equal(access.isPrivileged(player.id),false);
  assert.equal(JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(result.id).data_json).group_tags.includes('Admin'),false);
  const noChar=users.create({displayName:'Fresh Admin'});
  assert.equal(access.ensureAdminTag(noChar.id),false);
  assert.equal(access.isPrivileged(noChar.id,{admin:true}),true);
  const fresh=library.create(noChar.id,{fields:{charName:'New Admin',alignment:'True Neutral'}},{admin:true});
  assert.ok(fresh.id);
  assert.equal(access.isPrivileged(noChar.id),true);
 }finally{db.close();}
});

test('HTTP Lore list, detail, search, tag lookup and admin tag changes require server authorization',async()=>{
 const db=await openDatabase(':memory:');
 const users=createUserRepository(db),owner=users.create({displayName:'Writer'}),reader=users.create({displayName:'Reader'}),admin=users.create({displayName:'Admin'});
 const magic=newTag(db,'Magic'),science=newTag(db,'Science');
 const ownerChar=assignCharacter(db,owner.id,[magic]),readerChar=assignCharacter(db,reader.id,[science]),adminChar=assignCharacter(db,admin.id);
 const lore=createLoreService(db),entry=story(lore,owner.id,'Restricted Tale',[magic]),unlabelled=story(lore,owner.id,'Unlabelled Tale');
 const sessions={restore:async token=>{
  if(token==='owner')return {subject:'owner-uid',user:owner};
  if(token==='reader')return {subject:'reader-uid',user:reader};
  if(token==='admin')return {subject:'trusted-admin-uid',user:admin};
  throw Error('Invalid session');
 }};
 const app=createApiServer({db,
  loreRoutes:createLoreRoutes({db,sessions,origin,adminUids:['trusted-admin-uid']}),
  characterLibraryRoutes:createCharacterLibraryRoutes({db,sessions,origin,adminUids:['trusted-admin-uid']}),
  directoryRoutes:createDirectoryRoutes({db,sessions,origin,adminUids:['trusted-admin-uid']})
 });
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const root='http://127.0.0.1:'+app.address().port,headers=token=>({Cookie:'__Host-comos_session='+token});
 try{
  const raw=await fetch(root+'/api/v1/lore',{headers:headers('reader')});
  assert.equal(raw.status,200);assert.deepEqual((await raw.json()).entries,[]);
  assert.equal((await fetch(root+'/api/v1/lore/'+entry.id,{headers:headers('reader')})).status,404);
  assert.equal((await fetch(root+'/api/v1/lore/'+unlabelled.id,{headers:headers('reader')})).status,404);
  assert.equal((await fetch(root+'/api/v1/lore?query=Restricted',{headers:headers('reader')})).status,200);
  assert.deepEqual((await (await fetch(root+'/api/v1/lore?query=Restricted',{headers:headers('reader')})).json()).entries,[]);
  assert.equal((await fetch(root+'/api/v1/lore?tagId='+magic,{headers:headers('reader')})).status,403);
  assert.equal((await fetch(root+'/api/v1/lore/'+entry.id,{headers:headers('owner')})).status,200);
  const adminTags=await (await fetch(root+'/api/v1/my/lore-tags',{headers:headers('admin')})).json();
  assert.deepEqual(adminTags.tags.map(t=>t.name),['Admin','Magic','Science']);
  assert.ok(db.prepare('SELECT 1 FROM character_tag_links WHERE character_id=? AND tag_id=?').get(adminChar,LORE_ADMIN_TAG_ID));
  const ownTags=await (await fetch(root+'/api/v1/my/lore-tags',{headers:headers('reader')})).json();
  assert.deepEqual(ownTags.tags.map(t=>t.name),['Science']);
  assert.equal((await (await fetch(root+'/api/v1/lore',{headers:headers('admin')})).json()).entries.length,2);
  assert.equal((await fetch(root+'/api/v1/lore/'+entry.id,{headers:headers('admin')})).status,200);
  // Verified admin can assign the special tag to another player's character.
  const grant=await fetch(root+'/api/v1/character-records/'+readerChar,{
   method:'POST',headers:{...headers('admin'),Origin:origin,'Content-Type':'application/json'},
   body:JSON.stringify({op:'tags',revision:1,tagIds:[science,LORE_ADMIN_TAG_ID]})
  });
  assert.equal(grant.status,200);
  const newlyVisible=await fetch(root+'/api/v1/lore/'+entry.id,{headers:headers('reader')});
  assert.equal(newlyVisible.status,200);
  assert.equal((await (await fetch(root+'/api/v1/lore',{headers:headers('reader')})).json()).entries.length,2);
  // A player with the Admin tag can see all Lore, but cannot rename it.
  const rename=await fetch(root+'/api/v1/admin/tags',{
   method:'POST',headers:{...headers('admin'),Origin:origin,'Content-Type':'application/json'},
   body:JSON.stringify({id:LORE_ADMIN_TAG_ID,name:'No longer Admin'})
  });
  assert.equal(rename.status,400);
  assert.equal((await fetch(root+'/api/v1/character-records/'+readerChar,{
   method:'POST',headers:{...headers('reader'),Origin:origin,'Content-Type':'application/json'},
   body:JSON.stringify({op:'tags',revision:2,tagIds:[science]})
  })).status,403);
  assert.ok(db.prepare('SELECT id FROM character_tags WHERE id=? AND name=?').get(LORE_ADMIN_TAG_ID,'Admin'));
 }finally{await new Promise(resolve=>app.close(resolve));db.close();}
});
