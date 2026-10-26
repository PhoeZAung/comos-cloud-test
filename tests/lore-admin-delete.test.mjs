import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createLoreService,createLoreRoutes} from '../backend/lore/service.mjs';
import {createApiServer} from '../backend/http/app.mjs';
import {renderLoreEntry} from '../src/ui/lore-entry.mjs';

const noThrottle={enter:()=>({allowed:true,release(){}})};
test('Only a verified administrator can delete Lore; tagged content and image links disappear',async()=>{
 const db=await openDatabase(':memory:');
 const users=createUserRepository(db);
 const admin=users.create({displayName:'Admin'}),player=users.create({displayName:'Player'});
 const lore=createLoreService(db),imageId=randomUUID(),tagId=randomUUID(),charId=randomUUID();
 db.prepare('INSERT INTO character_tags(id,name) VALUES(?,?)').run(tagId,'Quest');
 db.prepare('INSERT INTO characters(id,owner_id,name,sources_json,created_at,updated_at) VALUES(?,?,?,?,?,?)')
   .run(charId,player.id,'Knight','[]','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
 db.prepare('INSERT INTO character_tag_links(character_id,tag_id) VALUES(?,?)').run(charId,tagId);
 db.prepare('INSERT INTO lore_images(id,owner_id,file_key,mime,created_at) VALUES(?,?,?,?,?)')
   .run(imageId,player.id,randomUUID()+'.blob','image/webp','2026-01-01T00:00:00.000Z');
 const blocks=[{type:'text',text:'The Chronicle'},{type:'image',mediaId:imageId,alt:'Cover art'}];
 const entry=lore.create(player.id,{title:'Quest Log',text:'The Chronicle',blocks,tagIds:[tagId],clientRequestId:randomUUID()});
 const origin='https://comos.test';
 const sessions={restore:async token=>{
  if(token==='real-admin')return {subject:'firebase-admin-uid',user:admin};
  if(token==='user')return {subject:'regular-firebase-uid',user:player};
  throw Error('No session');
 }};
 const server=createApiServer({db,loreRoutes:createLoreRoutes({db,sessions,origin,adminUids:['firebase-admin-uid'],throttle:noThrottle})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const path='http://127.0.0.1:'+server.address().port+'/api/v1/lore/'+entry.id;
 const loggedIn={Cookie:'__Host-comos_session=user'};
 const adminHeaders={Cookie:'__Host-comos_session=real-admin'};
 try{
  assert.doesNotMatch(renderLoreEntry(entry),/data-delete-lore/);
  assert.match(renderLoreEntry(entry,{canDelete:true}),/data-delete-lore/);
  assert.equal((await fetch(path,{method:'DELETE',headers:{Origin:origin}})).status,401);
  const regular=await fetch(path,{headers:loggedIn});assert.equal((await regular.json()).canDelete,false);
  const privileged=await fetch(path,{headers:adminHeaders});assert.equal((await privileged.json()).canDelete,true);
  assert.equal((await fetch(path,{method:'DELETE',headers:{...loggedIn,Origin:origin,'X-Admin':'true'}})).status,403);
  assert.equal((await fetch(path,{method:'DELETE',headers:{...adminHeaders,Origin:'https://malicious.test'}})).status,403);
  assert.ok(lore.get(entry.id),'Forbidden requests must not remove entry');
  const deleted=await fetch(path,{method:'DELETE',headers:{...adminHeaders,Origin:origin}});
  assert.equal(deleted.status,200);assert.deepEqual(await deleted.json(),{deleted:true});
  assert.equal((await fetch(path,{headers:loggedIn})).status,404);
  assert.equal((await fetch(path,{method:'DELETE',headers:{...adminHeaders,Origin:origin}})).status,404);
  assert.equal(db.prepare('SELECT count(*) AS total FROM lore_entry_tags WHERE entry_id=?').get(entry.id).total,0);
  assert.equal(db.prepare('SELECT count(*) AS total FROM lore_entry_images WHERE image_id=?').get(imageId).total,0);
  // The file's owner still has the upload, but no signed-in reader can open the deleted Lore image.
  assert.equal(db.prepare('SELECT count(*) AS total FROM lore_images WHERE id=?').get(imageId).total,1);
  assert.equal((await (await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/lore',{headers:loggedIn})).json()).entries.length,0);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});
