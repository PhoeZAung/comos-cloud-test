import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createPostsService} from '../backend/posts/service.mjs';
import {createRepliesService} from '../backend/posts/replies.mjs';
import {createCharacterLibraryService,parseCharacterImport,createCharacterLibraryRoutes} from '../backend/characters/library.mjs';
import {createAccountRoutes} from '../backend/account/routes.mjs';
import {createApiServer} from '../backend/http/app.mjs';
import {renderHomeFeed} from '../src/features/home/feed.mjs';
import {renderPostThread} from '../src/features/home/thread.mjs';
import {renderCharacterRoster} from '../src/features/characters/roster.mjs';

test('reply chains preserve authors, nesting, retry semantics and promotion after deletion',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const users=createUserRepository(db),a=users.create({displayName:'Author'}),b=users.create({displayName:'Responder'});
  const posts=createPostsService(db),replies=createRepliesService(db,{posts});
  const p=posts.create(a.id,{text:'Announcement',clientRequestId:randomUUID()},{admin:true});
  const parent=replies.create(b.id,p.id,{text:'First',clientRequestId:randomUUID()});
  const payload={text:'Answer',clientRequestId:randomUUID(),parentReplyId:parent.id};
  const child=replies.create(a.id,p.id,payload);
  assert.equal(child.parentReplyId,parent.id);
  assert.equal(replies.create(a.id,p.id,payload).id,child.id);
  const another=posts.create(a.id,{text:'Other',clientRequestId:randomUUID()},{admin:true});
  assert.throws(()=>replies.create(b.id,another.id,{...payload,clientRequestId:randomUUID()}),{code:'INVALID_REPLY'});
  const list=replies.list(b.id,p.id).replies;
  assert.equal(list.find(r=>r.id===child.id).parentReplyId,parent.id);
  assert.match(renderPostThread({post:p,replies:list}),/Replying to Responder/);
  assert.match(renderPostThread({post:p,replies:list}),/--reply-depth:1/);
  replies.remove(b.id,parent.id);
  assert.equal(replies.list(a.id,p.id).replies.find(r=>r.id===child.id).parentReplyId,null);
 }finally{db.close();}
});
test('author avatar is rendered from trusted member URL; untrusted URL cannot be injected',()=>{
 const id=randomUUID(),authorId=randomUUID(),post={id,authorId,authorName:'Writer',text:'Hello',createdAt:new Date().toISOString(),avatarUrl:'/api/v1/member-avatars/'+authorId};
 const html=renderHomeFeed({posts:[post],viewerId:authorId});
 assert.match(html,/member-avatars/);assert.match(html,/<img loading="lazy"/);
 const unsafe=renderHomeFeed({posts:[{...post,avatarUrl:'javascript:alert(1)'}]});
 assert.doesNotMatch(unsafe,/javascript:alert/);assert.match(unsafe,/comos-avatar-default/);
});
test('character import is owner-scoped, preserves sheet fields, links known tags and creates fresh ids',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const users=createUserRepository(db),a=users.create({displayName:'A'}),b=users.create({displayName:'B'});
  const svc=createCharacterLibraryService(db),tag=randomUUID();
  db.prepare('INSERT INTO character_tags VALUES(?,?)').run(tag,'Arcane');
  const raw={character:{data:{charName:'Nyx',level:4,race:'Viera',hp_curr:16,items:[{name:'Blade'}],group_tags:['Arcane']}}};
  const first=svc.import(a.id,raw),second=svc.import(a.id,raw);
  assert.notEqual(first.id,second.id);
  const listed=svc.list(a.id).characters;assert.equal(listed.length,2);assert.equal(svc.list(b.id).characters.length,0);
  assert.deepEqual(listed[0].tags,['Arcane']);assert.equal(listed[0].level,4);
  assert.equal(JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(first.id).data_json).hp_curr,16);
  assert.throws(()=>parseCharacterImport({character:{name:'',data:{}}}),{code:'INVALID_IMPORT'});
  assert.throws(()=>parseCharacterImport(JSON.parse('{"charName":"A","__proto__":{"evil":1}}')),{code:'INVALID_IMPORT'});
  const rendered=renderCharacterRoster({characters:listed,selected:0});
  assert.match(rendered,/Nyx/);
  assert.match(rendered,/cc-panel is-current/);
  assert.match(rendered,/data-character-view="list"/);
  assert.doesNotMatch(rendered,/Import character|Character collection|saved character/i);
  const flat=renderCharacterRoster({characters:listed,view:'list'});
  assert.match(flat,/class="cc-list-row"/);
  assert.match(flat,/data-character-view="carousel"/);
  assert.match(flat,/Arcane/);
  assert.match(flat,/sheet\.html\?characterId=/);
  assert.doesNotMatch(flat,/directory-user|Import character|Character collection|saved character/);
  assert.doesNotMatch(rendered,/Player character cards are coming/);
 }finally{db.close();}
});
test('library API cannot import under another account, member photos need a session',async()=>{
 const db=await openDatabase(':memory:');
 const users=createUserRepository(db),a=users.create({displayName:'A'}),b=users.create({displayName:'B'});
 a.profileState=b.profileState='complete';
 const sessions={restore:async token=>{if(!['a','b'].includes(token))throw Error('Not signed in');return {subject:token,user:token==='a'?a:b};}};
 const origin='https://example.test';
 const account={avatar:async id=>id===a.id?Buffer.from('fake-jpg'):null,get:id=>users.get(id)};
 const srv=createApiServer({db,characterLibraryRoutes:createCharacterLibraryRoutes({db,sessions,origin}),accountRoutes:createAccountRoutes({sessions,account,origin})});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+srv.address().port;
 try{
  assert.equal((await fetch(base+'/api/v1/my/characters')).status,401);
  const bHeaders={Cookie:'__Host-comos_session=b',Origin:origin,'Content-Type':'application/json'};
  const res=await fetch(base+'/api/v1/my/characters/import',{method:'POST',headers:bHeaders,body:JSON.stringify({character:{charName:'Bard',hp_curr:4}})});
  assert.equal(res.status,201);
  assert.equal((await (await fetch(base+'/api/v1/my/characters',{headers:{Cookie:'__Host-comos_session=a'}})).json()).characters.length,0);
  assert.equal((await (await fetch(base+'/api/v1/my/characters',{headers:{Cookie:'__Host-comos_session=b'}})).json()).characters.length,1);
  assert.equal((await fetch(base+'/api/v1/member-avatars/'+a.id)).status,401);
  assert.equal((await fetch(base+'/api/v1/member-avatars/'+a.id,{headers:{Cookie:'__Host-comos_session=b'}})).status,200);
  assert.equal((await fetch(base+'/api/v1/member-avatars/'+b.id,{headers:{Cookie:'__Host-comos_session=a'}})).status,404);
  assert.equal((await fetch(base+'/api/v1/my/characters/import',{method:'POST',headers:{...bHeaders,Origin:'https://wrong.test'},body:'{}'})).status,403);
 }finally{await new Promise(r=>srv.close(r));db.close();}
});

test('list mode keeps characters separate without user folders and escapes names and tags',()=>{
  const html=renderCharacterRoster({view:'list',characters:[{id:'fixture:1',name:'<unsafe>',tags:['<script>'],level:2}]});
  assert.match(html,/&lt;unsafe&gt;/);
  assert.match(html,/&lt;script&gt;/);
  assert.doesNotMatch(html,/<unsafe>|<script>|directory-user|data-import-character/);
  assert.match(html,/Show rotating cards/);
  const cards=renderCharacterRoster({characters:[{id:'fixture:1',name:'Knight',tags:['Party']}]});
  assert.match(cards,/Show list view/);
  assert.doesNotMatch(cards,/Import character|Character collection|saved character/i);
});
