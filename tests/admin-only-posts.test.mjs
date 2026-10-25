import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createPostsService,validatePostInput} from '../backend/posts/service.mjs';
import {relativePostTime} from '../src/features/home/time.mjs';
import {renderHomeFeed} from '../src/features/home/feed.mjs';
import {renderPostThread} from '../src/features/home/thread.mjs';

const owner=randomUUID(),member=randomUUID(),world=randomUUID();
function fixture(){
  const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
  db.exec(`CREATE TABLE users(id TEXT PRIMARY KEY,display_name TEXT NOT NULL) STRICT;
    CREATE TABLE worlds(id TEXT PRIMARY KEY,name TEXT NOT NULL) STRICT;
    CREATE TABLE parties(id TEXT PRIMARY KEY,world_id TEXT NOT NULL REFERENCES worlds(id),name TEXT NOT NULL) STRICT;
    CREATE TABLE world_memberships(user_id TEXT NOT NULL REFERENCES users(id),world_id TEXT NOT NULL REFERENCES worlds(id),PRIMARY KEY(user_id,world_id)) STRICT;
    CREATE TABLE party_memberships(user_id TEXT NOT NULL REFERENCES users(id),party_id TEXT NOT NULL REFERENCES parties(id),PRIMARY KEY(user_id,party_id)) STRICT;
    CREATE TABLE feed_posts(id TEXT PRIMARY KEY,author_id TEXT NOT NULL REFERENCES users(id),client_request_id TEXT NOT NULL,world_id TEXT REFERENCES worlds(id),party_id TEXT REFERENCES parties(id),body TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(author_id,client_request_id)) STRICT;
    CREATE TABLE feed_replies(id TEXT PRIMARY KEY,post_id TEXT NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,author_id TEXT NOT NULL REFERENCES users(id),client_request_id TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(author_id,client_request_id)) STRICT;`);
  db.prepare('INSERT INTO users VALUES(?,?)').run(owner,'Owner');
  db.prepare('INSERT INTO users VALUES(?,?)').run(member,'Reader');
  return db;
}
const input=(text='A full post',title='News')=>({text,title,clientRequestId:randomUUID()});

test('5.3.1: title migration retains old records, replies and foreign keys',async()=>{
 const db=fixture();try{
   const oldId=randomUUID();
   db.prepare('INSERT INTO feed_posts VALUES(?,?,?,NULL,NULL,?,?)').run(oldId,owner,randomUUID(),'Existing description','2026-10-20T09:00:00.000Z');
   const replyId=randomUUID();
   db.prepare('INSERT INTO feed_replies VALUES(?,?,?,?,?,?)').run(replyId,oldId,member,randomUUID(),'Existing reply','2026-10-20T09:01:00.000Z');
   db.exec(await readFile(new URL('../backend/db/migrations/009-post-titles.sql',import.meta.url),'utf8'));
   assert.equal(db.prepare('SELECT title FROM feed_posts WHERE id=?').get(oldId).title,'');
   assert.equal(db.prepare('SELECT body FROM feed_replies WHERE id=?').get(replyId).body,'Existing reply');
   assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys,1);
   assert.throws(()=>db.prepare('UPDATE feed_posts SET title=? WHERE id=?').run('x'.repeat(141),oldId),/CHECK/);
 }finally{db.close();}
});

test('5.3.2: admin can publish globally with zero worlds; readers can read, but never publish',async()=>{
 const db=fixture();try{
   db.exec(await readFile(new URL('../backend/db/migrations/009-post-titles.sql',import.meta.url),'utf8'));
   const posts=createPostsService(db);
   assert.throws(()=>posts.create(member,input()),{code:'POST_FORBIDDEN'});
   assert.throws(()=>posts.create(member,input(),{admin:false}),{code:'POST_FORBIDDEN'});
   const data=input('Here is the full description','Announcement');
   const saved=posts.create(owner,data,{admin:true});
   assert.equal(saved.title,'Announcement');assert.equal(saved.text,'Here is the full description');
   assert.equal(saved.authorId,owner);assert.equal(saved.worldId,null);
   assert.equal(posts.create(owner,data,{admin:true}).id,saved.id);
   assert.equal(posts.list(member).posts[0].title,'Announcement');
   assert.equal(posts.get(member,saved.id).text,'Here is the full description');
   assert.equal(posts.list(member).posts.length,1);
   assert.throws(()=>posts.create(member,{...input(),worldId:null},{admin:false}),{code:'POST_FORBIDDEN'});
   assert.throws(()=>posts.create(owner,{...input(),authorId:member},{admin:true}),{code:'INVALID_POST'});
   assert.throws(()=>posts.create(owner,{...input(),partyId:null},{admin:true}),{code:'INVALID_POST'});
   assert.throws(()=>posts.create(owner,{...data,title:'Changed'},{admin:true}),{code:'POST_CONFLICT'});
   const id=randomUUID();db.prepare('INSERT INTO feed_replies VALUES(?,?,?,?,?,?)').run(id,saved.id,member,randomUUID(),'Reader reply',new Date().toISOString());
   assert.equal(posts.get(member,saved.id).replyCount,1);
   assert.equal(posts.remove(owner,saved.id),true);
   assert.equal(db.prepare('SELECT COUNT(*) AS n FROM feed_replies').get().n,0);
 }finally{db.close();}
});

test('5.3.3: validated text, title, IDs and legacy scope fields are not forgeable',()=>{
 const normalized=validatePostInput({...input(' Hello ',' Important ')});
 assert.equal(normalized.text,'Hello');assert.equal(normalized.title,'Important');
 assert.equal(validatePostInput({text:'Hello',clientRequestId:randomUUID()}).title,'');
 for(const value of [{...input(),text:' '},{...input(),title:'X'.repeat(141)},{...input(),text:'x'.repeat(2001)},{...input(),clientRequestId:'no'},{...input(),text:'bad\u0000text'},{...input(),worldId:world},{...input(),partyId:world}]) assert.throws(()=>validatePostInput(value),{code:'INVALID_POST'});
});

test('5.3.4: rendered Home contains only clickable post previews, optional titles, and author-only delete',()=>{
 const post={id:randomUUID(),authorId:owner,authorName:'Owner',title:'My title',text:'Line '.repeat(150),createdAt:'2026-10-24T22:00:00.000Z'};
 const markup=renderHomeFeed({posts:[post],viewerId:member,canPost:false,now:Date.parse('2026-10-24T23:00:00.000Z')});
 assert.match(markup,/comos-post-link/);assert.match(markup,/post\.html\?id=/);assert.match(markup,/comos-post-excerpt/);
 assert.match(markup,/My title/);assert.match(markup,/1 hour ago/);
 assert.doesNotMatch(markup,/cosmos-hero|comos-world-grid|data-delete-post|href="compose.html"|data-reply-form/);
 const ownerMarkup=renderHomeFeed({posts:[post],viewerId:owner,canPost:true});
 assert.match(ownerMarkup,/data-delete-post/);assert.match(ownerMarkup,/href="compose.html"/);
});

test('5.3.5: title is header on detail and description is full; escaping is safe',()=>{
 const row={id:randomUUID(),authorName:'<img onerror=x>',authorId:owner,title:'A <title>',createdAt:'2026-10-20T00:00:00.000Z',text:'<script>Not HTML</script>\n'+ 'text '.repeat(130)};
 const markup=renderPostThread({post:row,replies:[{...row,id:randomUUID(),authorId:member,text:'Reader replied'}],viewerId:member,now:Date.parse('2026-10-21T00:00:00.000Z')});
 assert.match(markup,/<h1 class="comos-thread-title">A &lt;title&gt;<\/h1>/);
 assert.match(markup,/&lt;script&gt;Not HTML&lt;\/script&gt;/);assert.match(markup,/Reader replied/);
 assert.doesNotMatch(markup,/<script>|<img onerror|comos-post-excerpt/);
});

test('5.3.6: relative timestamps follow requested hours/days/weeks/months/years',()=>{
 const now=Date.UTC(2026,9,25,12);const ago=seconds=>new Date(now-seconds*1000).toISOString();
 const cases=[[0,'Just now'],[59,'Just now'],[60,'1 minute ago'],[59*60,'59 minutes ago'],[3600,'1 hour ago'],[23*3600,'23 hours ago'],[24*3600,'1 day ago'],[6*86400,'6 days ago'],[7*86400,'1 week ago'],[27*86400,'3 weeks ago'],[28*86400,'1 month ago'],[330*86400,'11 months ago'],[364*86400,'11 months ago'],[365*86400,'1 year ago'],[800*86400,'2 years ago']];
 for(const [seconds,label] of cases)assert.equal(relativePostTime(ago(seconds),now),label,`at ${seconds} seconds`);
 assert.equal(relativePostTime('not-a-date',now),'Recently');
});