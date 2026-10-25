import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {createPostsService,validatePostInput} from '../backend/posts/service.mjs';
import {createRepliesService} from '../backend/posts/replies.mjs';
import {createPostsRoutes} from '../backend/posts/routes.mjs';
import {createApiServer} from '../backend/http/app.mjs';

const ids={admin:randomUUID(),alice:randomUUID(),bob:randomUUID(),world:randomUUID(),party:randomUUID()};
const post=(worldId=null,partyId=null,text='Admin announcement')=>({worldId,partyId,text,clientRequestId:randomUUID()});
async function dbFixture({worlds=true,migrateBefore=true}={}) {
  const db=new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON');
  db.exec(`CREATE TABLE users(id TEXT PRIMARY KEY,display_name TEXT NOT NULL) STRICT;
    CREATE TABLE worlds(id TEXT PRIMARY KEY,name TEXT NOT NULL) STRICT;
    CREATE TABLE parties(id TEXT PRIMARY KEY,world_id TEXT NOT NULL REFERENCES worlds(id),name TEXT NOT NULL) STRICT;
    CREATE TABLE world_memberships(user_id TEXT NOT NULL REFERENCES users(id),world_id TEXT NOT NULL REFERENCES worlds(id),PRIMARY KEY(user_id,world_id)) STRICT;
    CREATE TABLE party_memberships(user_id TEXT NOT NULL REFERENCES users(id),party_id TEXT NOT NULL REFERENCES parties(id),PRIMARY KEY(user_id,party_id)) STRICT;`);
  for(const [who,id] of Object.entries(ids)) if(['admin','alice','bob'].includes(who))db.prepare('INSERT INTO users VALUES(?,?)').run(id,who);
  if(worlds){db.prepare('INSERT INTO worlds VALUES(?,?)').run(ids.world,'First World');db.prepare('INSERT INTO parties VALUES(?,?,?)').run(ids.party,ids.world,'Party');}
  for(const name of ['006-posts.sql','007-post-replies.sql'])db.exec(await readFile(new URL('../backend/db/migrations/'+name,import.meta.url),'utf8'));
  if(migrateBefore)db.exec(await readFile(new URL('../backend/db/migrations/008-admin-global-posts.sql',import.meta.url),'utf8'));
  return db;
}

test('5.3 administrator can post with no world or membership and everybody signed in can read and reply',async()=>{
 const db=await dbFixture({worlds:false});try{
  const service=createPostsService(db);
  const scopes=service.scopes(ids.admin,{admin:true});
  assert.deepEqual(scopes,{admin:true,worlds:[],parties:[]});
  assert.deepEqual(service.scopes(ids.alice),{admin:false,worlds:[],parties:[]});
  const announcement=service.create(ids.admin,post(),{admin:true});
  assert.equal(announcement.worldId,null);assert.equal(announcement.worldName,null);
  assert.equal(announcement.authorId,ids.admin);
  for(const viewer of [ids.alice,ids.bob,ids.admin]) {
    assert.equal(service.list(viewer).posts[0].id,announcement.id);
    assert.equal(service.get(viewer,announcement.id).id,announcement.id);
  }
  const replies=createRepliesService(db,{posts:service});
  const reply=replies.create(ids.alice,announcement.id,{text:'Hello!',clientRequestId:randomUUID()});
  assert.equal(reply.postId,announcement.id);
  assert.equal(replies.list(ids.bob,announcement.id).replies.length,1);
  service.remove(ids.admin,announcement.id);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM feed_replies').get().n,0);
 }finally{db.close();}
});

test('5.3 regular members cannot forge site-wide scope, even when in a world',async()=>{
 const db=await dbFixture();try{
  const service=createPostsService(db);
  db.prepare('INSERT INTO world_memberships VALUES(?,?)').run(ids.alice,ids.world);
  assert.throws(()=>service.create(ids.alice,post(null)),{code:'POST_FORBIDDEN'});
  assert.throws(()=>service.create(ids.alice,post(null,ids.party)),{code:'POST_FORBIDDEN'});
  assert.throws(()=>service.create(ids.bob,post(ids.world)),{code:'POST_FORBIDDEN'});
  const own=service.create(ids.alice,post(ids.world));
  assert.equal(own.worldId,ids.world);
  assert.equal(service.list(ids.bob).posts.length,0);
  assert.equal(service.list(ids.admin,{admin:true}).posts.length,1);
  assert.throws(()=>validatePostInput({...post(),authorId:ids.admin}),{code:'INVALID_POST'});
  assert.throws(()=>validatePostInput({...post(),worldId:undefined}),{code:'INVALID_POST'});
 }finally{db.close();}
});

test('5.3 verified admin can post into any existing world or party without joining, while nonmembers cannot',async()=>{
 const db=await dbFixture();try{
  const service=createPostsService(db);
  const worldPost=service.create(ids.admin,post(ids.world),{admin:true});
  const partyPost=service.create(ids.admin,post(ids.world,ids.party),{admin:true});
  assert.equal(service.list(ids.admin,{admin:true}).posts.length,2);
  assert.equal(service.list(ids.bob).posts.length,0);
  db.prepare('INSERT INTO world_memberships VALUES(?,?)').run(ids.alice,ids.world);
  assert.equal(service.list(ids.alice).posts.length,1);
  db.prepare('INSERT INTO party_memberships VALUES(?,?)').run(ids.alice,ids.party);
  assert.equal(service.list(ids.alice).posts.length,2);
  assert.equal(service.get(ids.alice,partyPost.id).id,partyPost.id);
  assert.equal(service.get(ids.alice,worldPost.id).id,worldPost.id);
 }finally{db.close();}
});

test('5.3 migration preserves existing scoped posts, replies, and foreign keys',async()=>{
 const db=await dbFixture({migrateBefore:false});try{
  const before=createPostsService(db);
  db.prepare('INSERT INTO world_memberships VALUES(?,?)').run(ids.alice,ids.world);
  const original=before.create(ids.alice,post(ids.world));
  const replies=createRepliesService(db,{posts:before});
  const reply=replies.create(ids.alice,original.id,{text:'Prior reply',clientRequestId:randomUUID()});
  db.exec('BEGIN IMMEDIATE');
  try {db.exec(await readFile(new URL('../backend/db/migrations/008-admin-global-posts.sql',import.meta.url),'utf8'));db.exec('COMMIT');}
  catch(err){db.exec('ROLLBACK');throw err;}
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys,1);
  const after=createPostsService(db);
  assert.equal(after.get(ids.alice,original.id).text,'Admin announcement');
  assert.equal(db.prepare('SELECT body FROM feed_replies WHERE id=?').get(reply.id).body,'Prior reply');
  assert.equal(createRepliesService(db,{posts:after}).list(ids.alice,original.id).replies[0].id,reply.id);
  const global=after.create(ids.admin,post(),{admin:true});
  assert.equal(db.prepare('SELECT world_id FROM feed_posts WHERE id=?').get(global.id).world_id,null);
  assert.throws(()=>db.prepare('INSERT INTO feed_posts VALUES(?,?,?,?,?,?,?)').run(randomUUID(),ids.admin,randomUUID(),null,ids.party,'bad','2026-10-24T00:00:00.000Z'),/CHECK/);
  after.remove(ids.alice,original.id);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM feed_replies').get().n,0);
 }finally{db.close();}
});

test('5.3 API uses verified server admin role only and denies forged privilege and cross-origin writes',async()=>{
 const db=await dbFixture({worlds:false});
 const service=createPostsService(db);
 const fakeSessions={restore:async cookie=>{
  if(!['admin','alice','bob'].includes(cookie))throw new Error('signed out');
  return {user:{id:ids[cookie],profileState:'complete'},subject:cookie};
 }};
 const route=createPostsRoutes({sessions:fakeSessions,posts:service,origin:'https://comos.example',adminUids:['admin']});
 const server=createApiServer({db,postsRoutes:route});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/api/v1`;
 const headers=(name,origin='https://comos.example')=>({Origin:origin,Cookie:'__Host-comos_session='+name,'Content-Type':'application/json'});
 try{
  assert.equal((await fetch(base+'/feed/scopes')).status,401);
  let r=await fetch(base+'/feed/scopes',{headers:headers('alice')});assert.equal((await r.json()).admin,false);
  r=await fetch(base+'/feed/scopes',{headers:headers('admin')});assert.equal((await r.json()).admin,true);
  const input=post();const send=(name,origin='https://comos.example')=>fetch(base+'/posts',{method:'POST',headers:{...headers(name,origin),'X-Role':'admin'},body:JSON.stringify(input)});
  assert.equal((await send('alice')).status,403);
  assert.equal((await send('admin','https://evil.example')).status,403);
  const created=await send('admin');assert.equal(created.status,201);const saved=(await created.json()).post;
  assert.equal(saved.authorId,ids.admin);
  assert.equal((await send('admin')).status,201);
  const regularFeed=await fetch(base+'/feed',{headers:headers('bob')});assert.equal(regularFeed.status,200);
  assert.deepEqual((await regularFeed.json()).posts.map(p=>p.id),[saved.id]);
  assert.equal((await fetch(base+'/posts/'+saved.id,{method:'DELETE',headers:headers('alice')})).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});