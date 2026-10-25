import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import sharp from 'sharp';
import {openDatabase} from '../backend/db/database.mjs';import {createUserRepository} from '../backend/repositories/users.mjs';import {createPostsService} from '../backend/posts/service.mjs';import {createPostsRoutes} from '../backend/posts/routes.mjs';import {createHomeMediaRoutes} from '../backend/posts/media.mjs';import {createApiServer} from '../backend/http/app.mjs';import {mkdtemp,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
test('shared feed has identical content for members; only admin posts, images persist and spoofed uploads fail',async()=>{
 const db=await openDatabase(':memory:'),dir=await mkdtemp(path.join(os.tmpdir(),'home-test-'));const users=createUserRepository(db),a=users.create({displayName:'Admin'}),b=users.create({displayName:'Member'});a.profileState=b.profileState='complete';const sessions={restore:async c=>{if(!['admin','member'].includes(c))throw Error();return {user:c==='admin'?a:b,subject:c};}},posts=createPostsService(db),origin='https://example.test';const media=await createHomeMediaRoutes({db,sessions,adminUids:['admin'],origin,mediaRoot:dir});const server=createApiServer({db,homeMediaRoutes:media,postsRoutes:createPostsRoutes({sessions,posts,adminUids:['admin'],origin})});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`,headers={Cookie:'__Host-comos_session=admin',Origin:origin};
 try{
  const image=await sharp({create:{width:3,height:3,channels:3,background:'red'}}).png().toBuffer();
  assert.equal((await fetch(base+'/api/v1/home-media',{method:'POST',headers:{...headers,Cookie:'__Host-comos_session=member'},body:image})).status,403);
  assert.equal((await fetch(base+'/api/v1/home-media',{method:'POST',headers,body:Buffer.from('<svg/>')})).status,400);
  let r=await fetch(base+'/api/v1/home-media',{method:'POST',headers,body:image});assert.equal(r.status,201);const {id}=await r.json();
  const data={title:'Hello 🌌',text:'One shared announcement',mediaIds:[id],clientRequestId:randomUUID()};
  r=await fetch(base+'/api/v1/posts',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(data)});assert.equal(r.status,201);const result=await r.json();assert.equal(result.post.media.length,1);
  assert.deepEqual(posts.list(a.id).posts,posts.list(b.id).posts);assert.throws(()=>posts.create(b.id,{...data,clientRequestId:randomUUID()}),{code:'POST_FORBIDDEN'});
  r=await fetch(base+'/api/v1/home-media/'+id,{headers:{Cookie:'__Host-comos_session=member'}});assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/webp');
  const gif=await sharp({create:{width:2,height:2,channels:3,background:'blue'}}).gif().toBuffer();r=await fetch(base+'/api/v1/home-media',{method:'POST',headers,body:gif});assert.equal(r.status,201);
  assert.equal(posts.create(a.id,data,{admin:true}).id,result.post.id);
 }finally{await new Promise(r=>server.close(r));db.close();await rm(dir,{recursive:true,force:true});}
});
import {createRepliesService} from '../backend/posts/replies.mjs';
test('shared pagination and replies remain stable; deleting an announcement cleans its replies',async()=>{
 const db=await openDatabase(':memory:');try{const users=createUserRepository(db),a=users.create(),b=users.create(),posts=createPostsService(db),replies=createRepliesService(db,{posts});
 for(let i=0;i<25;i++)posts.create(a.id,{title:'Announcement',text:String(i),clientRequestId:randomUUID()},{admin:true});
 const first=posts.list(b.id),second=posts.list(b.id,{cursor:first.nextCursor});assert.equal(new Set([...first.posts,...second.posts].map(p=>p.id)).size,25);
 const id=first.posts[0].id,retry={text:'Reply 😀',clientRequestId:randomUUID()},r=replies.create(b.id,id,retry);assert.equal(replies.create(b.id,id,retry).id,r.id);assert.equal(replies.list(a.id,id).replies.length,1);assert.throws(()=>posts.remove(b.id,id),{code:'POST_NOT_FOUND'});posts.remove(a.id,id);assert.equal(db.prepare('SELECT count(*) AS n FROM feed_replies WHERE post_id=?').get(id).n,0);
 }finally{db.close();}
});
