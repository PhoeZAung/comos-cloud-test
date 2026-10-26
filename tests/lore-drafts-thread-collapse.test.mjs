import test from 'node:test';
import assert from 'node:assert/strict';
import {draftKey,validateDraft,createLoreDraftStore} from '../src/ui/lore-draft.mjs';
import {renderPostThread} from '../src/features/home/thread.mjs';
import {default as composer} from '../src/pages/lore-compose.mjs';

test('Lore autosaves are account and entry scoped, with ordered text and Blob images',async()=>{
 const user='123e4567-e89b-42d3-a456-426614174000',entry='123e4567-e89b-42d3-a456-426614174001';
 assert.notEqual(draftKey(user),draftKey(user,entry));
 assert.notEqual(draftKey(user),draftKey('123e4567-e89b-42d3-a456-426614174002'));
 assert.throws(()=>draftKey(''),/signed-in/);
 const record={
  key:draftKey(user),version:1,title:'The Wanderer',tagIds:['tagA'],
  blocks:[{type:'text',text:'Paragraph one'},{
   type:'image',file:new Blob(['image data'],{type:'image/png'}),mediaId:'',alt:'The tower'
  },{type:'text',text:'Paragraph two'}],
  requestId:'req1',expectedUpdatedAt:'',savedAt:Date.now()
 };
 assert.equal(validateDraft(record),true);
 assert.equal(record.blocks[1].file.size,10);
 assert.equal(validateDraft({...record,blocks:[{type:'image',alt:'x',mediaId:'',file:null}]}),false);
 assert.equal(validateDraft({...record,blocks:Array.from({length:41},()=>({type:'text',text:'A'}))}),false);
 assert.match(composer.content,/data-lore-draft-status/);
 assert.match(composer.content,/data-lore-discard-draft/);
 // Browsers without IndexedDB must receive a clear failure, not a fake saved state.
 if(typeof indexedDB==='undefined')await assert.rejects(createLoreDraftStore().save(record),/cannot store image drafts/);
});

test('Every comment branch can be collapsed independently without removing its parent',()=>{
 const top='123e4567-e89b-42d3-a456-426614174000';
 const child='123e4567-e89b-42d3-a456-426614174001';
 const grandchild='123e4567-e89b-42d3-a456-426614174002';
 const post={id:'123e4567-e89b-42d3-a456-426614174003',title:'Hello',authorName:'Host',text:'News',createdAt:'2026-10-25T12:00:00Z'};
 const replies=[
  {id:grandchild,parentReplyId:child,authorName:'Third',text:'Third depth',createdAt:post.createdAt},
  {id:child,parentReplyId:top,authorName:'Second',text:'Child',createdAt:post.createdAt},
  {id:top,parentReplyId:null,authorName:'First',text:'Root',createdAt:post.createdAt}
 ];
 const open=renderPostThread({post,replies});
 assert.match(open,new RegExp('data-collapse-thread="'+top+'" aria-expanded="true"'));
 assert.match(open,/Hide 2 replies/);
 assert.match(open,/Hide 1 reply/);
 assert.ok(open.indexOf('Root')<open.indexOf('Child')&&open.indexOf('Child')<open.indexOf('Third depth'));
 const closed=renderPostThread({post,replies,collapsedIds:[top]});
 assert.match(closed,new RegExp('data-collapse-thread="'+top+'" aria-expanded="false"'));
 assert.match(closed,new RegExp('id="comos-branch-'+top+'"[^>]+ hidden>'));
 assert.match(closed,/Show 2 replies/);
 assert.match(closed,/data-reply-to="/);
 const inner=renderPostThread({post,replies,collapsedIds:[child]});
 assert.match(inner,new RegExp('id="comos-branch-'+child+'"[^>]+ hidden>'));
 assert.doesNotMatch(inner,new RegExp('id="comos-branch-'+top+'"[^>]+ hidden>'));
});
