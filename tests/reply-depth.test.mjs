import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createPostsService} from '../backend/posts/service.mjs';
import {createRepliesService} from '../backend/posts/replies.mjs';
import {renderPostThread} from '../src/features/home/thread.mjs';

test('Only one nested reply level is allowed, and only top-level comments have Reply buttons',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const users=createUserRepository(db);
  const admin=users.create({displayName:'Host'}),guest=users.create({displayName:'Guest'});
  const posts=createPostsService(db),replies=createRepliesService(db,{posts});
  const post=posts.create(admin.id,{title:'Discussion',text:'Topic',clientRequestId:randomUUID()},{admin:true});
  const first=replies.create(guest.id,post.id,{text:'First comment',clientRequestId:randomUUID()});
  const secondPayload={text:'Reply to comment',parentReplyId:first.id,clientRequestId:randomUUID()};
  const second=replies.create(admin.id,post.id,secondPayload);
  assert.equal(second.parentReplyId,first.id);
  assert.equal(replies.create(admin.id,post.id,secondPayload).id,second.id);
  assert.throws(()=>replies.create(guest.id,post.id,{text:'Third level is forbidden',parentReplyId:second.id,clientRequestId:randomUUID()}),{code:'INVALID_REPLY',message:'Replies are limited to one nested level.'});
  const secondPost=posts.create(admin.id,{title:'Other',text:'Another topic',clientRequestId:randomUUID()},{admin:true});
  assert.throws(()=>replies.create(guest.id,secondPost.id,{text:'Cross-post',parentReplyId:first.id,clientRequestId:randomUUID()}),{code:'INVALID_REPLY'});
  const replyList=replies.list(guest.id,post.id).replies;
  const rendered=renderPostThread({post,replies:replyList,viewerId:admin.id});
  assert.match(rendered,/First comment/);
  assert.match(rendered,/Reply to comment/);
  assert.match(rendered,/style="--reply-depth:1"/);
  assert.match(rendered,/Replying to Guest/);
  assert.equal((rendered.match(/data-reply-to="/g)||[]).length,1);
  assert.match(rendered,new RegExp('data-reply-to="'+first.id+'"'));
  assert.doesNotMatch(rendered,new RegExp('data-reply-to="'+second.id+'"'));
  // Older pre-existing records with deeper nesting are displayed at one visual depth
  // and cannot acquire a third-level Reply button.
  const oldThird=randomUUID();
  db.prepare('INSERT INTO feed_replies(id,post_id,author_id,client_request_id,body,created_at,parent_reply_id) VALUES(?,?,?,?,?,?,?)')
    .run(oldThird,post.id,guest.id,randomUUID(),'Historical reply',new Date().toISOString(),second.id);
  const oldMarkup=renderPostThread({post,replies:replies.list(guest.id,post.id).replies});
  assert.equal((oldMarkup.match(/data-reply-to="/g)||[]).length,1);
  assert.equal((oldMarkup.match(/style="--reply-depth:1"/g)||[]).length,2);
  assert.doesNotMatch(oldMarkup,/--reply-depth:2/);
  replies.remove(guest.id,first.id);
  const promoted=replies.list(admin.id,post.id).replies.find(row=>row.id===second.id);
  assert.equal(promoted.parentReplyId,null,'deleting the parent promotes its reply to top level');
  assert.match(renderPostThread({post,replies:replies.list(guest.id,post.id).replies}),new RegExp('data-reply-to="'+second.id+'"'));
 }finally{db.close();}
});
