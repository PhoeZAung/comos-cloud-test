import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createPostsService} from '../backend/posts/service.mjs';
import {createRepliesService} from '../backend/posts/replies.mjs';
import {renderPostThread} from '../src/features/home/thread.mjs';

test('Reddit-style nested comment threads support unlimited reply depth and keep parent connections',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const users=createUserRepository(db);
  const admin=users.create({displayName:'Host'}),guest=users.create({displayName:'Guest'});
  const posts=createPostsService(db),replies=createRepliesService(db,{posts});
  const post=posts.create(admin.id,{title:'Discussion',text:'Topic',clientRequestId:randomUUID()},{admin:true});
  const top=replies.create(guest.id,post.id,{text:'Top-level comment',clientRequestId:randomUUID()});
  let parent=top;
  const chain=[top];
  for(let i=1;i<=10;i++){
    const data={text:'Nested comment '+i,parentReplyId:parent.id,clientRequestId:randomUUID()};
    const next=replies.create(i%2?admin.id:guest.id,post.id,data);
    assert.equal(next.parentReplyId,parent.id);
    assert.equal(replies.create(i%2?admin.id:guest.id,post.id,data).id,next.id,'idempotent retries must work at any depth');
    chain.push(next);parent=next;
  }
  const other=posts.create(admin.id,{title:'Other',text:'Another topic',clientRequestId:randomUUID()},{admin:true});
  assert.throws(()=>replies.create(guest.id,other.id,{text:'Cross-post',parentReplyId:top.id,clientRequestId:randomUUID()}),{code:'INVALID_REPLY'});
  const page=replies.list(guest.id,post.id).replies;
  const render=renderPostThread({post,replies:page,viewerId:admin.id});
  assert.equal((render.match(/data-reply-to="/g)||[]).length,11,'every reply can be replied to');
  assert.equal((render.match(/class="comos-reply-branch/g)||[]).length,11);
  assert.match(render,/class="comos-reply-children"/);
  assert.match(render,/role="group" aria-label="Replies to/);
  for(let i=0;i<10;i++)assert.ok(render.indexOf(chain[i].text)<render.indexOf(chain[i+1].text),'children must follow parent comments');
  assert.match(render,/data-reply-level="10"/);
  assert.match(render,/--step-small:0/,'deep mobile replies stop indenting while retaining context');
  assert.match(render,/data-reply-to="/);
  assert.match(render,/Replying to Host|Replying to Guest/);
  const inline=renderPostThread({post,replies:page,viewerId:admin.id,replyTarget:{id:chain[5].id,authorName:'Host'}});
  assert.equal((inline.match(/data-reply-form/g)||[]).length,1);
  assert.ok(inline.indexOf('data-reply-branch="'+chain[5].id+'"')<inline.indexOf('comos-reply-inline'));
  assert.match(inline,/Replying to Host/);
  assert.match(inline,/data-cancel-reply/);
  // The first page of busy threads includes missing parent context, so a
  // reply never floats free just because its parent is on an older page.
  const crowded=posts.create(admin.id,{title:'Busy',text:'Lots of replies',clientRequestId:randomUUID()},{admin:true});
  const oldRoot=replies.create(guest.id,crowded.id,{text:'Conversation root',clientRequestId:randomUUID()});
  for(let i=0;i<25;i++)replies.create(admin.id,crowded.id,{text:'Busy child '+i,parentReplyId:oldRoot.id,clientRequestId:randomUUID()});
  const firstPage=replies.list(guest.id,crowded.id);
  assert.ok(firstPage.nextCursor);
  assert.ok(firstPage.replies.some(r=>r.id===oldRoot.id),'parent must be included even when outside the page window');
  assert.equal(firstPage.replies.filter(r=>r.id===oldRoot.id).length,1);
  const grouped=renderPostThread({post:crowded,replies:firstPage.replies});
  assert.ok(grouped.indexOf('Conversation root')<grouped.indexOf('Busy child 24'));
  assert.match(grouped,/comos-reply-children/);
  // Deleting a parent promotes children, without deleting their descendants.
  replies.remove(guest.id,top.id);
  const after=replies.list(admin.id,post.id).replies;
  assert.equal(after.find(row=>row.id===chain[1].id).parentReplyId,null);
  assert.equal(after.find(row=>row.id===chain[2].id).parentReplyId,chain[1].id);
 }finally{db.close();}
});
