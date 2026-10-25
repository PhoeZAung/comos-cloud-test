import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createPostsService,validatePostInput} from '../backend/posts/service.mjs';
import {createPostsRoutes} from '../backend/posts/routes.mjs';
import {createApiServer} from '../backend/http/app.mjs';
import {renderHomeFeed,pageFeed} from '../src/features/home/feed.mjs';
const people={alice:randomUUID(),bob:randomUUID(),admin:randomUUID()};
const worlds={first:randomUUID(),second:randomUUID()};
const parties={first:randomUUID(),second:randomUUID()};
const makePost=(worldId,partyId=null,text='Hi',clientRequestId=randomUUID())=>({text,worldId,partyId,clientRequestId});
const iso=(i)=>new Date(Date.UTC(2026,9,24,12,0,i)).toISOString();
async function setup(){
 const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
 db.exec(`CREATE TABLE users(id TEXT PRIMARY KEY,display_name TEXT NOT NULL,profile_state TEXT NOT NULL DEFAULT 'complete') STRICT;
 CREATE TABLE worlds(id TEXT PRIMARY KEY,name TEXT NOT NULL) STRICT;
 CREATE TABLE parties(id TEXT PRIMARY KEY,world_id TEXT NOT NULL REFERENCES worlds(id),name TEXT NOT NULL) STRICT;
 CREATE TABLE world_memberships(user_id TEXT NOT NULL REFERENCES users(id),world_id TEXT NOT NULL REFERENCES worlds(id),PRIMARY KEY(user_id,world_id)) STRICT;
 CREATE TABLE party_memberships(user_id TEXT NOT NULL REFERENCES users(id),party_id TEXT NOT NULL REFERENCES parties(id),PRIMARY KEY(user_id,party_id)) STRICT;
 CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY) STRICT;INSERT INTO schema_migrations VALUES(6);`);
 db.exec(await readFile(new URL('../backend/db/migrations/006-posts.sql',import.meta.url),'utf8'));
 for(const [name,id] of Object.entries(people))db.prepare('INSERT INTO users(id,display_name) VALUES(?,?)').run(id,name);
 for(const [name,id] of Object.entries(worlds))db.prepare('INSERT INTO worlds VALUES(?,?)').run(id,name);
 for(const [name,id] of Object.entries(parties))db.prepare('INSERT INTO parties VALUES(?,?,?)').run(id,worlds[name],name);
 const membership=db.prepare('INSERT INTO world_memberships VALUES(?,?)');membership.run(people.alice,worlds.first);membership.run(people.bob,worlds.second);
 const partyMember=db.prepare('INSERT INTO party_memberships VALUES(?,?)');partyMember.run(people.alice,parties.first);partyMember.run(people.bob,parties.second);
 let counter=0;const service=createPostsService(db,{now:()=>iso(counter++),ids:randomUUID});
 return {db,service};
}
test('real authenticated authors only, validated text and idempotent retries',async()=>{
 const {db,service}=await setup();try{
  const input=makePost(worlds.first,null,'  Posted by Alice  ');
  const row=service.create(people.alice,input);assert.equal(row.authorName,'alice');assert.equal(row.text,'Posted by Alice');
  assert.equal(service.create(people.alice,input).id,row.id);
  assert.equal(db.prepare('SELECT count(*) AS count FROM feed_posts').get().count,1);
  assert.throws(()=>service.create(people.alice,{...input,text:'Changed'}),{code:'POST_CONFLICT'});
  for(const payload of [{...input,text:''},{...input,text:'x'.repeat(2001)},{...input,text:'abc\u0000def'},{...input,authorId:people.bob},{...input,clientRequestId:'not-a-uuid'}])assert.throws(()=>validatePostInput(payload),{code:'INVALID_POST'});
  assert.throws(()=>service.create(people.bob,makePost(worlds.first)),{code:'POST_FORBIDDEN'});
  assert.throws(()=>service.create(people.alice,makePost(worlds.second)),{code:'POST_FORBIDDEN'});
  assert.throws(()=>service.create(people.bob,makePost(worlds.second,parties.first)),{code:'POST_FORBIDDEN'});
 }finally{db.close();}
});
test('members see only permitted worlds/parties; revocation immediately hides posts; admin can see all',async()=>{
 const {db,service}=await setup();try{
  const a=service.create(people.alice,makePost(worlds.first));
  service.create(people.alice,makePost(worlds.first,parties.first,'Party-only'));
  const b=service.create(people.bob,makePost(worlds.second));
  assert.equal(service.list(people.alice).posts.length,2);
  assert.deepEqual(service.list(people.bob).posts.map(p=>p.id),[b.id]);
  assert.equal(service.list(people.admin,{admin:true}).posts.length,3);
  assert.equal(service.scopes(people.alice).worlds.length,1);assert.equal(service.scopes(people.admin,{admin:true}).worlds.length,2);
  db.prepare('DELETE FROM party_memberships WHERE user_id=?').run(people.alice);
  assert.deepEqual(service.list(people.alice).posts.map(p=>p.id),[a.id]);
  db.prepare('DELETE FROM world_memberships WHERE user_id=?').run(people.alice);
  assert.equal(service.list(people.alice).posts.length,0);
  assert.throws(()=>service.create(people.alice,makePost(worlds.first)),{code:'POST_FORBIDDEN'});
 }finally{db.close();}
});
test('server pagination has no duplicates and rejects malformed cursors',async()=>{
 const {db,service}=await setup();try{
  const more=createPostsService(db,{now:()=>iso(7),ids:randomUUID});
  for(let i=0;i<46;i++)more.create(people.alice,makePost(worlds.first));
  let cursor='',count=0;const found=new Set();do{
    const page=more.list(people.alice,{cursor});assert.ok(page.posts.length<=20);
    for(const post of page.posts){assert.equal(found.has(post.id),false);found.add(post.id);}cursor=page.nextCursor||'';
    count++;assert.ok(count<5);
  }while(cursor);
  assert.equal(found.size,46);
  for(const input of ['@@!','AA','a'.repeat(300)])assert.throws(()=>more.list(people.alice,{cursor:input}),{code:'INVALID_POST'});
 }finally{db.close();}
});
test('only the author can remove posts and removal is permanent',async()=>{
 const {db,service}=await setup();try{
  const a=service.create(people.alice,makePost(worlds.first));
  assert.throws(()=>service.remove(people.bob,a.id),{code:'POST_NOT_FOUND'});
  assert.equal(service.remove(people.alice,a.id),true);
  assert.throws(()=>service.remove(people.alice,a.id),{code:'POST_NOT_FOUND'});
  assert.equal(service.list(people.alice).posts.length,0);
 }finally{db.close();}
});
test('Home never fabricates posts and escapes user-supplied content',()=>{
 const empty=renderHomeFeed();assert.match(empty,/No posts to show yet/);
 assert.doesNotMatch(empty,/Astra Vale|World 01|cosmos-hero|world-grid|comos-post-main/);
 const rendered=renderHomeFeed({posts:[{id:randomUUID(),authorName:'<img onerror=x>',createdAt:iso(1),text:'<script>alert(1)</script>',worldName:'W'}]});
 assert.match(rendered,/&lt;script&gt;/);assert.doesNotMatch(rendered,/<script>|<img onerror/);
 assert.equal(pageFeed([{id:'a',createdAt:iso(2)},{id:'b',createdAt:iso(1)}]).items[0].id,'a');
});
test('HTTP feed requires a verified session and write origin; user cannot impersonate author',async()=>{
 const {db,service}=await setup();
 const sessions={restore:async cookie=>{
   const key=String(cookie);if(!Object.hasOwn(people,key))throw Error('No session');
   return {user:{id:people[key],profileState:'complete'},subject:key};
 }};
 const route=createPostsRoutes({sessions,posts:service,origin:'https://example.test',adminUids:['admin']});
 const server=createApiServer({db,postsRoutes:route});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/api/v1`;
 const header=(name='alice')=>({Cookie:'__Host-comos_session='+name,Origin:'https://example.test','Content-Type':'application/json'});
 try{
   assert.equal((await fetch(base+'/feed')).status,401);
   assert.equal((await fetch(base+'/feed',{headers:header('bob')})).status,200);
   assert.equal((await fetch(base+'/posts',{method:'POST',headers:header(),body:'{}'})).status,400);
   const payload=makePost(worlds.first);const request=(headers=header(),body=payload)=>fetch(base+'/posts',{method:'POST',headers,body:JSON.stringify(body)});
   assert.equal((await request({...header(),Origin:'https://evil.test'})).status,403);
   assert.equal((await request(header('bob'))).status,403);
   assert.equal((await request(header(),{...payload,authorId:people.bob})).status,400);
   let r=await request();assert.equal(r.status,201);const created=(await r.json()).post;
   assert.equal(created.authorId,people.alice);
   assert.equal((await request()).status,201); // retry is idempotent
   assert.equal((await fetch(base+'/posts/'+created.id,{method:'DELETE',headers:header('bob')})).status,404);
   assert.equal((await fetch(base+'/posts/'+created.id,{method:'DELETE',headers:header()})).status,200);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});