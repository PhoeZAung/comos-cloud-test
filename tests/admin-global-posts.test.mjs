import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {createPostsService,validatePostInput} from '../backend/posts/service.mjs';
import {createPostsRoutes} from '../backend/posts/routes.mjs';
import {createApiServer} from '../backend/http/app.mjs';

const ids={owner:randomUUID(),member:randomUUID(),outsider:randomUUID(),world:randomUUID(),party:randomUUID()};
const post=(text='Admin update',title='Site news')=>({title,text,clientRequestId:randomUUID()});
async function fixture({migrate=true,worlds=true}={}){
 const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
 db.exec(`CREATE TABLE users(id TEXT PRIMARY KEY,display_name TEXT NOT NULL,profile_state TEXT NOT NULL DEFAULT 'complete') STRICT;
 CREATE TABLE worlds(id TEXT PRIMARY KEY,name TEXT NOT NULL) STRICT;
 CREATE TABLE parties(id TEXT PRIMARY KEY,world_id TEXT NOT NULL REFERENCES worlds(id),name TEXT NOT NULL) STRICT;
 CREATE TABLE world_memberships(user_id TEXT NOT NULL REFERENCES users(id),world_id TEXT NOT NULL REFERENCES worlds(id),PRIMARY KEY(user_id,world_id)) STRICT;
 CREATE TABLE party_memberships(user_id TEXT NOT NULL REFERENCES users(id),party_id TEXT NOT NULL REFERENCES parties(id),PRIMARY KEY(user_id,party_id)) STRICT;`);
 for(const who of ['owner','member','outsider'])db.prepare('INSERT INTO users(id,display_name) VALUES(?,?)').run(ids[who],who);
 if(worlds){db.prepare('INSERT INTO worlds VALUES(?,?)').run(ids.world,'World');db.prepare('INSERT INTO parties VALUES(?,?,?)').run(ids.party,ids.world,'Party');}
 for(const name of ['006-posts.sql','007-post-replies.sql',...(migrate?['008-admin-global-posts.sql','009-post-titles.sql']:[])]) db.exec(await readFile(new URL('../backend/db/migrations/'+name,import.meta.url),'utf8'));
 return db;
}

test('admin can create a titled global post without worlds; ordinary signed-in people can read',async()=>{
 const db=await fixture({worlds:false});try{
  const svc=createPostsService(db),row=svc.create(ids.owner,post(),{admin:true});
  assert.equal(row.title,'Site news');assert.equal(row.worldId,null);assert.equal(row.partyId,null);
  assert.equal(svc.get(ids.member,row.id).id,row.id);
  assert.equal(svc.list(ids.outsider).posts[0].id,row.id);
  assert.equal(svc.list(ids.member).posts.length,1);
 }finally{db.close();}
});

test('ordinary members cannot create top-level posts even if they belong to worlds/parties',async()=>{
 const db=await fixture();try{
  const svc=createPostsService(db);
  db.prepare('INSERT INTO world_memberships VALUES(?,?)').run(ids.member,ids.world);
  db.prepare('INSERT INTO party_memberships VALUES(?,?)').run(ids.member,ids.party);
  assert.throws(()=>svc.create(ids.member,post()),{code:'POST_FORBIDDEN'});
  assert.throws(()=>svc.create(ids.outsider,post()),{code:'POST_FORBIDDEN'});
  assert.throws(()=>svc.create(ids.owner,{...post(),worldId:ids.world},{admin:true}),{code:'INVALID_POST'});
  assert.throws(()=>validatePostInput({...post(),authorId:ids.owner}),{code:'INVALID_POST'});
 }finally{db.close();}
});

test('old world/party records are preserved through 008+009 migrations, including replies',async()=>{
 const db=await fixture({migrate:false});try{
  const oldId=randomUUID(),replyId=randomUUID();
  db.prepare('INSERT INTO feed_posts VALUES(?,?,?,?,?,?,?)').run(oldId,ids.member,randomUUID(),ids.world,ids.party,'An older member post','2026-10-20T00:00:00.000Z');
  db.prepare('INSERT INTO feed_replies VALUES(?,?,?,?,?,?)').run(replyId,oldId,ids.member,randomUUID(),'Original reply','2026-10-20T00:01:00.000Z');
  db.exec('BEGIN IMMEDIATE');
  try {for(const name of ['008-admin-global-posts.sql','009-post-titles.sql']) db.exec(await readFile(new URL('../backend/db/migrations/'+name,import.meta.url),'utf8'));db.exec('COMMIT');}
  catch(err){db.exec('ROLLBACK');throw err;}
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys,1);
  assert.equal(db.prepare('SELECT title FROM feed_posts WHERE id=?').get(oldId).title,'');
  assert.equal(db.prepare('SELECT body FROM feed_replies WHERE id=?').get(replyId).body,'Original reply');
  const svc=createPostsService(db);
  assert.throws(()=>svc.get(ids.outsider,oldId),{code:'POST_NOT_FOUND'});
  db.prepare('INSERT INTO world_memberships VALUES(?,?)').run(ids.member,ids.world);
  db.prepare('INSERT INTO party_memberships VALUES(?,?)').run(ids.member,ids.party);
  assert.equal(svc.get(ids.member,oldId).id,oldId);
  const a=svc.create(ids.owner,post(),{admin:true});assert.equal(a.title,'Site news');
  assert.equal(svc.list(ids.outsider).posts.length,1);
 }finally{db.close();}
});

test('the HTTP posts API rejects forged admin access and foreign origins; feed signals compose capability',async()=>{
 const db=await fixture({worlds:false});const svc=createPostsService(db);
 const sessions={restore:async(cookie)=>{if(!['owner','member'].includes(cookie))throw Error('signed out');return {user:{id:ids[cookie],profileState:'complete'},subject:cookie};}};
 const route=createPostsRoutes({sessions,posts:svc,origin:'https://comos.test',adminUids:['owner']});
 const server=createApiServer({postsRoutes:route});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/api/v1`;
 const headers=(who,origin='https://comos.test')=>({Cookie:'__Host-comos_session='+who,Origin:origin,'Content-Type':'application/json','X-Role':'admin'});
 try{
  const message=post();const send=(who,origin)=>fetch(base+'/posts',{method:'POST',headers:headers(who,origin),body:JSON.stringify(message)});
  assert.equal((await send('member')).status,403);
  assert.equal((await send('owner','https://evil.test')).status,403);
  const saved=await send('owner');assert.equal(saved.status,201);assert.equal((await saved.json()).post.authorId,ids.owner);
  assert.equal((await send('owner')).status,201);
  const response=await fetch(base+'/feed',{headers:headers('member')});assert.equal(response.status,200);
  const data=await response.json();assert.equal(data.canPost,false);assert.equal(data.posts.length,1);
  assert.equal((await fetch(base+'/feed')).status,401);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});