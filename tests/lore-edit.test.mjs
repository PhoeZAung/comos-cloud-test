import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createLoreService,createLoreRoutes} from '../backend/lore/service.mjs';
import {createApiServer} from '../backend/http/app.mjs';
import {renderLoreEntry} from '../src/ui/lore-entry.mjs';
import {mountLoreCompose} from '../src/ui/lore-compose.mjs';

const noThrottle={enter:()=>({allowed:true,release(){}})};
test('Lore authors can edit text, picture order, and tags without changing the entry ID',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const users=createUserRepository(db),writer=users.create({displayName:'Writer'}),reader=users.create({displayName:'Reader'});
  const first=users.completeProfile(writer.id,'Writer',writer.revision);
  const now='2026-01-01T00:00:00.000Z',cId=randomUUID(),tagA=randomUUID(),tagB=randomUUID(),foreignTag=randomUUID();
  db.prepare('INSERT INTO characters(id,owner_id,name,sources_json,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(cId,first.id,'Mage','[]',now,now);
  for(const [id,name] of [[tagA,'Magic'],[tagB,'Town'],[foreignTag,'Other']]){
    db.prepare('INSERT INTO character_tags(id,name) VALUES(?,?)').run(id,name);
  }
  for(const id of [tagA,tagB])db.prepare('INSERT INTO character_tag_links(character_id,tag_id) VALUES(?,?)').run(cId,id);
  const imageA=randomUUID(),imageB=randomUUID(),imageC=randomUUID();
  for(const id of [imageA,imageB,imageC])db.prepare('INSERT INTO lore_images(id,owner_id,file_key,mime,created_at) VALUES(?,?,?,?,?)').run(id,first.id,randomUUID()+'.blob','image/webp',now);
  const lore=createLoreService(db,{now:()=>now});
  const original=[{type:'text',text:'First paragraph'},{type:'image',mediaId:imageA,alt:'Original image'},{type:'text',text:'Second paragraph'}];
  const created=lore.create(first.id,{title:'Old title',text:'First paragraph\n\nSecond paragraph',blocks:original,tagIds:[tagA],clientRequestId:randomUUID()});
  const updated=[{type:'text',text:'New introduction'},{type:'image',mediaId:imageB,alt:'New image'},{type:'text',text:'Middle'},{type:'image',mediaId:imageA,alt:'Retained'},{type:'text',text:'Ending'}];
  const change={title:'New title',text:'New introduction\n\nMiddle\n\nEnding',blocks:updated,tagIds:[tagB],expectedUpdatedAt:created.updatedAt};
  const saved=lore.update(first.id,created.id,change);
  assert.equal(saved.id,created.id);
  assert.equal(saved.title,'New title');
  assert.equal(saved.createdAt,created.createdAt);
  assert.notEqual(saved.updatedAt,created.updatedAt,'revision must change even if clock is the same');
  assert.deepEqual(saved.blocks.map(b=>b.type),['text','image','text','image','text']);
  assert.deepEqual(saved.blocks.filter(b=>b.type==='image').map(b=>b.mediaId),[imageB,imageA]);
  assert.deepEqual(saved.tags,[{id:tagB,name:'Town'}]);
  assert.equal(db.prepare('SELECT count(*) AS n FROM lore_entry_images WHERE entry_id=?').get(created.id).n,2);
  assert.throws(()=>lore.update(first.id,created.id,change),{code:'edit_conflict',status:409});
  const current=lore.get(created.id);
  const foreign={...change,tagIds:[foreignTag],expectedUpdatedAt:current.updatedAt};
  assert.throws(()=>lore.update(first.id,created.id,foreign),{code:'tag_not_available',status:403});
  assert.throws(()=>lore.update(reader.id,created.id,{...change,expectedUpdatedAt:current.updatedAt}),{code:'edit_forbidden',status:403});
  assert.throws(()=>lore.update(first.id,created.id,{...change,expectedUpdatedAt:current.updatedAt,blocks:[{type:'text',text:'Bad'},{type:'image',mediaId:imageC,alt:'private'}, {type:'image',mediaId:imageC,alt:'duplicate'}]}),{code:'invalid_blocks'});
  assert.equal(lore.get(created.id).title,'New title','failed changes must roll back');
  const html=renderLoreEntry(saved,{canEdit:true});
  assert.match(html,new RegExp('href="lore-compose.html\\?id='+created.id+'"'));
  assert.match(html,/Edit Lore/);
  assert.doesNotMatch(renderLoreEntry(saved),/Edit Lore/);
 }finally{db.close();}
});

test('Lore PUT checks Firebase owner/admin permissions, origin, and revision',async()=>{
 const db=await openDatabase(':memory:');
 const users=createUserRepository(db),owner=users.create({displayName:'Creator'}),other=users.create({displayName:'Reader'}),admin=users.create({displayName:'Moderator'});
 const author=users.completeProfile(owner.id,'Creator',owner.revision);
 const moderator=users.completeProfile(admin.id,'Moderator',admin.revision);
 const outsider=users.completeProfile(other.id,'Reader',other.revision);
 const lore=createLoreService(db);
 const entry=lore.create(author.id,{title:'History',text:'Original text',tagIds:[],clientRequestId:randomUUID()});
 const sessions={restore:async token=>{
  if(token==='owner')return {subject:'uid-owner',user:author};
  if(token==='reader')return {subject:'uid-reader',user:outsider};
  if(token==='admin')return {subject:'uid-admin',user:moderator};
  throw Error('No session');
 }};
 const origin='https://example.test',api=createApiServer({db,loreRoutes:createLoreRoutes({db,sessions,origin,adminUids:['uid-admin'],throttle:noThrottle})});
 await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+api.address().port+'/api/v1/lore/'+entry.id;
 const headers=token=>({'Content-Type':'application/json',Origin:origin,Cookie:'__Host-comos_session='+token});
 const edit=(text,expectedUpdatedAt)=>({title:'Edited title',text,tagIds:[],blocks:[{type:'text',text}],expectedUpdatedAt});
 try{
  const outsiderResponse=await fetch(base,{headers:headers('reader')});
  assert.equal(outsiderResponse.status,404);
  const outsiderView=await outsiderResponse.json();
  assert.equal(outsiderView.error,'not_found');
  assert.equal((await (await fetch(base,{headers:headers('owner')})).json()).canEdit,true);
  assert.equal((await (await fetch(base,{headers:headers('admin')})).json()).canEdit,true);
  const denied=await fetch(base,{method:'PUT',headers:headers('reader'),body:JSON.stringify(edit('Forbidden',entry.updatedAt))});
  assert.equal(denied.status,403);
  assert.equal((await fetch(base,{method:'PUT',headers:{...headers('owner'),Origin:'https://evil.test'},body:JSON.stringify(edit('CSRF',entry.updatedAt))})).status,403);
  const response=await fetch(base,{method:'PUT',headers:headers('owner'),body:JSON.stringify(edit('First revision',entry.updatedAt))});
  assert.equal(response.status,200);
  const updated=await response.json();
  assert.equal(updated.entry.text,'First revision');
  assert.equal(updated.entry.authorId,author.id);
  assert.equal((await fetch(base,{method:'PUT',headers:headers('admin'),body:JSON.stringify(edit('Stale',entry.updatedAt))})).status,409);
  const current=updated.entry;
  const adminResponse=await fetch(base,{method:'PUT',headers:headers('admin'),body:JSON.stringify(edit('Admin update',current.updatedAt))});
  assert.equal(adminResponse.status,200);
  assert.equal((await adminResponse.json()).entry.text,'Admin update');
  assert.equal(lore.get(entry.id).authorId,author.id,'admin edit cannot change original author');
  assert.equal((await fetch(base,{method:'PUT',headers:headers('owner'),body:JSON.stringify({...edit('Spoof',current.updatedAt),authorId:moderator.id})})).status,400);
  assert.equal((await fetch(base,{method:'PUT',headers:headers('owner'),body:'not json'})).status,400);
 }finally{await new Promise(resolve=>api.close(resolve));db.close();}
});

test('Editor provides a private edit mode with existing image restoration',()=>{
 const script=mountLoreCompose.toString();
 assert.match(script,/editId=new URLSearchParams/);
 assert.match(script,/data.canEdit!==true/);
 assert.match(script,/availableEditTags/);
 assert.match(script,/addStoredImage/);
 assert.match(script,/expectedUpdatedAt/);
 assert.ok(script.includes("method:isEdit?'PUT':'POST'"));
});
