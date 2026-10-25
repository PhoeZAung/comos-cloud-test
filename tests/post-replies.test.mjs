import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {createPostsService} from '../backend/posts/service.mjs';
import {createRepliesService,validateReply} from '../backend/posts/replies.mjs';
import {createReplyRoutes} from '../backend/posts/reply-routes.mjs';
import {createPostsRoutes} from '../backend/posts/routes.mjs';
import {createApiServer} from '../backend/http/app.mjs';
import {renderPostThread} from '../src/features/home/thread.mjs';
import {renderHomeFeed} from '../src/features/home/feed.mjs';

const people={alice:randomUUID(),bob:randomUUID(),admin:randomUUID()};
const worlds={one:randomUUID(),two:randomUUID()};
const parties={one:randomUUID(),two:randomUUID()};
const message=(text='Hello')=>({text,clientRequestId:randomUUID()});
async function setup(){
  const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
  db.exec(`CREATE TABLE users(id TEXT PRIMARY KEY,display_name TEXT NOT NULL,profile_state TEXT NOT NULL DEFAULT 'complete') STRICT;
    CREATE TABLE worlds(id TEXT PRIMARY KEY,name TEXT NOT NULL) STRICT;
    CREATE TABLE parties(id TEXT PRIMARY KEY,world_id TEXT NOT NULL REFERENCES worlds(id),name TEXT NOT NULL) STRICT;
    CREATE TABLE world_memberships(user_id TEXT NOT NULL REFERENCES users(id),world_id TEXT NOT NULL REFERENCES worlds(id),PRIMARY KEY(user_id,world_id)) STRICT;
    CREATE TABLE party_memberships(user_id TEXT NOT NULL REFERENCES users(id),party_id TEXT NOT NULL REFERENCES parties(id),PRIMARY KEY(user_id,party_id)) STRICT;
    CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY) STRICT;INSERT INTO schema_migrations VALUES(7);`);
  for(const number of ['006-posts.sql','007-post-replies.sql'])db.exec(await readFile(new URL('../backend/db/migrations/'+number,import.meta.url),'utf8'));
  for(const [name,id] of Object.entries(people))db.prepare('INSERT INTO users(id,display_name) VALUES(?,?)').run(id,name);
  for(const [name,id] of Object.entries(worlds))db.prepare('INSERT INTO worlds VALUES(?,?)').run(id,name);
  for(const [name,id] of Object.entries(parties))db.prepare('INSERT INTO parties VALUES(?,?,?)').run(id,worlds[name],name);
  db.prepare('INSERT INTO world_memberships VALUES(?,?)').run(people.alice,worlds.one);
  db.prepare('INSERT INTO world_memberships VALUES(?,?)').run(people.bob,worlds.two);
  db.prepare('INSERT INTO party_memberships VALUES(?,?)').run(people.alice,parties.one);
  db.prepare('INSERT INTO party_memberships VALUES(?,?)').run(people.bob,parties.two);
  let tick=0;const now=()=>new Date(Date.UTC(2026,9,24,20,0,Math.floor(tick++/3))).toISOString();
  const posts=createPostsService(db,{now});
  const replies=createRepliesService(db,{posts,now});
  return {db,posts,replies};
}
function publish(service,author=people.alice,worldId=worlds.one,partyId=null){return service.create(author,{worldId,partyId,text:'Author post',clientRequestId:randomUUID()});}

test('5.2 member can read original post but nonmember cannot discover its existence',async()=>{
  const {db,posts,replies}=await setup();try{
    const post=publish(posts,people.alice,worlds.one,parties.one);
    assert.equal(posts.get(people.alice,post.id).authorName,'alice');
    assert.throws(()=>posts.get(people.bob,post.id),{code:'POST_NOT_FOUND'});
    assert.throws(()=>replies.list(people.bob,post.id),{code:'POST_NOT_FOUND'});
    assert.equal(posts.get(people.admin,post.id,{admin:true}).id,post.id);
    assert.throws(()=>posts.get(people.alice,randomUUID()),{code:'POST_NOT_FOUND'});
    const reply=replies.create(people.alice,post.id,message('Really good post'));
    assert.equal(reply.authorName,'alice');assert.equal(posts.get(people.alice,post.id).replyCount,1);
    assert.equal(replies.list(people.alice,post.id).replies.length,1);
    assert.equal(replies.list(people.admin,post.id,{admin:true}).replies[0].id,reply.id);
  }finally{db.close();}
});

test('5.2 revoked world/party membership hides post and replies, blocks new replies',async()=>{
  const {db,posts,replies}=await setup();try{
    const worldPost=publish(posts);
    const partyPost=publish(posts,people.alice,worlds.one,parties.one);
    replies.create(people.alice,partyPost.id,message('Secret party reply'));
    db.prepare('INSERT INTO world_memberships VALUES(?,?)').run(people.admin,worlds.one);
    assert.equal(posts.get(people.admin,worldPost.id).id,worldPost.id);
    assert.throws(()=>posts.get(people.admin,partyPost.id),{code:'POST_NOT_FOUND'});
    db.prepare('DELETE FROM party_memberships WHERE user_id=?').run(people.alice);
    assert.throws(()=>replies.list(people.alice,partyPost.id),{code:'POST_NOT_FOUND'});
    assert.throws(()=>replies.create(people.alice,partyPost.id,message()),{code:'POST_NOT_FOUND'});
    assert.equal(posts.get(people.alice,worldPost.id).id,worldPost.id);
    db.prepare('DELETE FROM world_memberships WHERE user_id=?').run(people.alice);
    assert.throws(()=>posts.get(people.alice,worldPost.id),{code:'POST_NOT_FOUND'});
  }finally{db.close();}
});

test('5.2 rejects impersonation, invalid input and replayed request IDs',async()=>{
  const {db,posts,replies}=await setup();try{
    const post=publish(posts);
    const input=message('  my reply   ');
    const reply=replies.create(people.alice,post.id,input);
    assert.equal(reply.text,'my reply');assert.equal(reply.authorId,people.alice);
    assert.equal(replies.create(people.alice,post.id,input).id,reply.id);
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM feed_replies').get().c,1);
    assert.throws(()=>replies.create(people.alice,post.id,{...input,text:'Different'}),{code:'REPLY_CONFLICT'});
    for(const body of [{...input,text:' '},{...input,text:'x'.repeat(2001)},{...input,text:'abc\u0000def'},{...input,authorId:people.bob},{text:'good',clientRequestId:'not-uuid'}])assert.throws(()=>validateReply(body),{code:'INVALID_REPLY'});
    assert.throws(()=>replies.create(people.bob,post.id,message('Not allowed')),{code:'POST_NOT_FOUND'});
  }finally{db.close();}
});

test('5.2 replies use stable pages even when timestamps collide',async()=>{
  const {db,posts,replies}=await setup();try{
    const post=publish(posts);
    for(let i=0;i<48;i++)replies.create(people.alice,post.id,message('Reply '+i));
    let cursor='',total=0;const ids=new Set();
    do{
      const data=replies.list(people.alice,post.id,{cursor});assert.ok(data.replies.length<=20);
      for(const reply of data.replies){assert.ok(!ids.has(reply.id));ids.add(reply.id);}
      total++;cursor=data.nextCursor||'';assert.ok(total<=3);
    }while(cursor);
    assert.equal(ids.size,48);
    assert.throws(()=>replies.list(people.alice,post.id,{cursor:'invalid'}),{code:'INVALID_REPLY'});
  }finally{db.close();}
});

test('5.2 deleting a post cascades reply cleanup; only reply author can delete reply',async()=>{
  const {db,posts,replies}=await setup();try{
    const post=publish(posts);
    const reply=replies.create(people.alice,post.id,message());
    assert.throws(()=>replies.remove(people.bob,reply.id),{code:'REPLY_NOT_FOUND'});
    assert.equal(replies.remove(people.alice,reply.id),true);
    assert.throws(()=>replies.remove(people.alice,reply.id),{code:'REPLY_NOT_FOUND'});
    replies.create(people.alice,post.id,message('Second'));
    posts.remove(people.alice,post.id);
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM feed_replies').get().c,0);
  }finally{db.close();}
});

test('5.2 detail renderer escapes user content and Home only links to detail',()=>{
  const row={id:randomUUID(),authorName:'<svg onload=x>',authorId:'me',createdAt:new Date().toISOString(),text:'<script>bad</script>'};
  const html=renderPostThread({post:row,replies:[{...row,id:randomUUID(),text:'<img onerror=x>'}],viewerId:'me'});
  assert.match(html,/&lt;script&gt;/);assert.match(html,/&lt;img/);
  assert.doesNotMatch(html,/<script>|<img onerror|<svg onload/);
  const feed=renderHomeFeed({posts:[row]});
  assert.match(feed,/post\.html\?id=/);
  assert.doesNotMatch(feed,/data-reply-form|comos-thread-entry|<textarea/);
});

test('5.2 HTTP routes deny signed-out requests, cross-origin writes and forged authors',async()=>{
  const {db,posts,replies}=await setup();
  const sessions={restore:async token=>{
    if(!Object.hasOwn(people,token))throw Error('No session');
    return {user:{id:people[token],profileState:'complete'},subject:token};
  }};
  const replyRoutes=createReplyRoutes({sessions,posts,replies,origin:'https://example.test',adminUids:['admin']});
  const postRoutes=createPostsRoutes({sessions,posts,origin:'https://example.test',adminUids:['admin']});
  const server=createApiServer({db,replyRoutes,postsRoutes:postRoutes});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/v1`;
  const header=name=>({Cookie:'__Host-comos_session='+name,Origin:'https://example.test','Content-Type':'application/json'});
  try{
    const post=publish(posts),thread=base+'/posts/'+post.id;
    const postReply=(headers=header('alice'),body=message())=>fetch(thread+'/replies',{method:'POST',headers,body:JSON.stringify(body)});
    assert.equal((await fetch(thread)).status,401);
    assert.equal((await fetch(thread+'/replies')).status,401);
    assert.equal((await fetch(thread,{headers:header('bob')})).status,404);
    assert.equal((await fetch(thread,{headers:header('alice')})).status,200);
    assert.equal((await fetch(thread+'/replies',{headers:header('bob')})).status,404);
    assert.equal((await postReply({...header('alice'),Origin:'https://other.test'})).status,403);
    assert.equal((await postReply(header('bob'))).status,404);
    assert.equal((await postReply(header('alice'),{...message(),authorId:people.bob})).status,400);
    const result=await postReply();assert.equal(result.status,201);
    const reply=(await result.json()).reply;assert.equal(reply.authorId,people.alice);
    assert.equal((await fetch(base+'/replies/'+reply.id,{method:'DELETE',headers:header('bob')})).status,404);
    assert.equal((await fetch(base+'/replies/'+reply.id,{method:'DELETE',headers:header('alice')})).status,200);
    assert.equal((await fetch(thread+'/replies?extra=1',{headers:header('alice')})).status,400);
    assert.equal((await fetch(thread,{method:'DELETE',headers:header('alice')})).status,200);
  }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});