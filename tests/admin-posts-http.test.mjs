import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {createApiServer} from '../backend/http/app.mjs';
import {createPostsService} from '../backend/posts/service.mjs';
import {createPostsRoutes} from '../backend/posts/routes.mjs';

test('5.3 HTTP: verified role publishes without world; other users read but cannot forge admin',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
 db.exec(`CREATE TABLE users(id TEXT PRIMARY KEY,display_name TEXT NOT NULL) STRICT;
 CREATE TABLE worlds(id TEXT PRIMARY KEY,name TEXT NOT NULL) STRICT;
 CREATE TABLE parties(id TEXT PRIMARY KEY,world_id TEXT NOT NULL,name TEXT NOT NULL) STRICT;
 CREATE TABLE world_memberships(user_id TEXT NOT NULL,world_id TEXT NOT NULL) STRICT;
 CREATE TABLE party_memberships(user_id TEXT NOT NULL,party_id TEXT NOT NULL) STRICT;
 CREATE TABLE feed_posts(id TEXT PRIMARY KEY,author_id TEXT NOT NULL,client_request_id TEXT NOT NULL,world_id TEXT,party_id TEXT,body TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(author_id,client_request_id)) STRICT;
 CREATE TABLE feed_replies(id TEXT PRIMARY KEY,post_id TEXT NOT NULL,author_id TEXT NOT NULL,client_request_id TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL) STRICT;`);
 db.exec(await readFile(new URL('../backend/db/migrations/009-post-titles.sql',import.meta.url),'utf8'));
 const names={admin:randomUUID(),reader:randomUUID()};
 for(const [name,id] of Object.entries(names))db.prepare('INSERT INTO users VALUES(?,?)').run(id,name);
 const sessions={restore:async(cookie)=>({user:{id:names[cookie],profileState:'complete'},subject:cookie})};
 const posts=createPostsService(db),postsRoutes=createPostsRoutes({sessions,posts,origin:'https://comos.example',adminUids:['admin']});
 const server=createApiServer({postsRoutes});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/api/v1`;
 const hdr=(who,origin='https://comos.example')=>({Cookie:'__Host-comos_session='+who,Origin:origin,'Content-Type':'application/json', 'X-Role':'admin'});
 try{
   const body={title:'Event update',text:'The full update',clientRequestId:randomUUID()};
   const send=(who,origin)=>fetch(base+'/posts',{method:'POST',headers:hdr(who,origin),body:JSON.stringify(body)});
   assert.equal((await send('reader')).status,403);
   assert.equal((await send('admin','https://bad.example')).status,403);
   assert.equal((await send('admin')).status,201);
   assert.equal((await send('admin')).status,201);
   const list=await fetch(base+'/feed',{headers:hdr('reader')});assert.equal(list.status,200);
   const payload=await list.json();assert.equal(payload.posts.length,1);
   assert.equal(payload.posts[0].title,'Event update');assert.equal(payload.canPost,false);
   const adminList=await fetch(base+'/feed',{headers:hdr('admin')});assert.equal((await adminList.json()).canPost,true);
   assert.equal((await fetch(base+'/feed')).status,401);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});