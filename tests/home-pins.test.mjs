import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createPostsService} from '../backend/posts/service.mjs';
import {createPostsRoutes} from '../backend/posts/routes.mjs';
import {createApiServer} from '../backend/http/app.mjs';
import {renderHomeFeed} from '../src/features/home/feed.mjs';

test('Only pinned announcements appear above Home timeline; normal paging stays stable',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const repo=createUserRepository(db),admin=repo.create({displayName:'Admin'}),member=repo.create({displayName:'Member'});
  let tick=0;
  const posts=createPostsService(db,{now:()=>new Date(Date.UTC(2026,9,25,10,0,tick++)).toISOString()});
  const ids=[];
  for(let i=0;i<26;i++)ids.push(posts.create(admin.id,{title:'Update '+i,text:'Details',clientRequestId:randomUUID()},{admin:true}).id);
  assert.throws(()=>posts.pin(member.id,ids[0],true),{code:'POST_FORBIDDEN'});
  assert.throws(()=>posts.pin(admin.id,ids[0],true),{code:'POST_FORBIDDEN'});
  for(const id of [ids[0],ids[2],ids[4]])posts.pin(admin.id,id,true,{admin:true});
  assert.throws(()=>posts.pin(admin.id,ids[6],true,{admin:true}),{code:'POST_PIN_LIMIT'});
  assert.ok(posts.get(member.id,ids[0]).pinnedAt);
  const first=posts.list(member.id);
  assert.equal(first.pinnedPosts.length,3);
  assert.equal(first.posts.length,20);
  assert.ok(first.nextCursor);
  assert.ok(first.pinnedPosts.every(p=>p.pinnedAt));
  assert.ok(first.posts.every(p=>!p.pinnedAt));
  const second=posts.list(member.id,{cursor:first.nextCursor});
  assert.equal(second.pinnedPosts.length,3);
  assert.equal(new Set([...first.posts,...second.posts,...first.pinnedPosts].map(p=>p.id)).size,26);
  const html=renderHomeFeed({posts:first.posts,pinnedPosts:first.pinnedPosts,viewerId:member.id,canPost:false});
  assert.equal((html.match(/comos-pinned-label/g)||[]).length,3);
  assert.doesNotMatch(html,/data-pin-post/,'members cannot pin');
  assert.ok(html.indexOf('📌 Pinned')<html.indexOf('Update 25'));
  const adminHtml=renderHomeFeed({posts:first.posts,pinnedPosts:first.pinnedPosts,viewerId:admin.id,canPost:true});
  assert.match(adminHtml,/data-pin-state="unpin"/);
  assert.match(adminHtml,/data-pin-state="pin"/);
  posts.pin(admin.id,ids[0],false,{admin:true});
  assert.equal(posts.list(member.id).pinnedPosts.length,2);
  assert.equal(posts.get(member.id,ids[0]).pinnedAt,null);
  posts.pin(admin.id,ids[6],true,{admin:true});
  assert.equal(posts.list(member.id).pinnedPosts.length,3);
  posts.remove(admin.id,ids[6]);
  assert.equal(posts.list(member.id).pinnedPosts.length,2);
 }finally{db.close();}
});

test('Pin endpoint enforces the verified Firebase admin session and Origin',async()=>{
 const db=await openDatabase(':memory:');
 const users=createUserRepository(db),admin=users.create({displayName:'Admin'}),member=users.create({displayName:'Member'});
 admin.profileState=member.profileState='complete';
 const posts=createPostsService(db),post=posts.create(admin.id,{title:'Rules',text:'Remember this',clientRequestId:randomUUID()},{admin:true});
 const sessions={restore:async token=>{
  if(token==='admin')return {subject:'verified-admin-uid',user:admin};
  if(token==='member')return {subject:'member-uid',user:member};
  throw Error('Unauthenticated');
 }};
 const origin='https://example.test',server=createApiServer({db,postsRoutes:createPostsRoutes({sessions,posts,origin,adminUids:['verified-admin-uid']})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const path='http://127.0.0.1:'+server.address().port+'/api/v1/posts/'+post.id+'/pin';
 const headers={Origin:origin,'Content-Type':'application/json',Cookie:'__Host-comos_session=admin'};
 try{
  assert.equal((await fetch(path,{method:'PATCH',headers:{...headers,Cookie:'__Host-comos_session=member'},body:'{"pinned":true}'})).status,403);
  assert.equal((await fetch(path,{method:'PATCH',headers:{...headers,Origin:'https://evil.test'},body:'{"pinned":true}'})).status,403);
  assert.equal((await fetch(path,{method:'PATCH',headers,body:'{"pinned":"true"}'})).status,400);
  const res=await fetch(path,{method:'PATCH',headers,body:'{"pinned":true}'});
  assert.equal(res.status,200);assert.ok((await res.json()).post.pinnedAt);
  const memberFeed=await (await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/feed',{headers:{Cookie:'__Host-comos_session=member'}})).json();
  assert.equal(memberFeed.canPost,false);assert.equal(memberFeed.pinnedPosts.length,1);
  assert.equal((await fetch(path,{method:'PATCH',headers,body:'{"pinned":false}'})).status,200);
  assert.equal(posts.list(member.id).pinnedPosts.length,0);
 }finally{await new Promise(r=>server.close(r));db.close();}
});
