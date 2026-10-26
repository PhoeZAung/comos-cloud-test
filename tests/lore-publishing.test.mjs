import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharactersService} from '../backend/characters/service.mjs';
import {createLoreService,createLoreRoutes} from '../backend/lore/service.mjs';
import {createApiServer} from '../backend/http/app.mjs';
import {renderLoreLibrary} from '../src/features/lore/library.mjs';
import {renderLoreEntry} from '../src/ui/lore-entry.mjs';

async function seeded(){
 const db=await openDatabase(':memory:');
 const users=createUserRepository(db);
 const owner=users.create({displayName:'Lore Owner'});
 const reader=users.create({displayName:'Lore Reader'});
 const first=users.completeProfile(owner.id,'Lore Owner',owner.revision);
 const second=users.completeProfile(reader.id,'Lore Reader',reader.revision);
 const chars=createCharactersService(db),one=randomUUID(),other=randomUUID(),archive=randomUUID();
 for(const [id,person,name] of [[one,first.id,'Mage'],[other,second.id,'Knight'],[archive,first.id,'Old Mage']]){
  chars.save({op:'save',id,revision:0,name,ownerId:person,sources:[]});
 }
 const magic=randomUUID(),steel=randomUUID(),old=randomUUID(),unused=randomUUID();
 for(const [id,name] of [[magic,'Magic'],[steel,'Steel'],[old,'Old Tag'],[unused,'Unused']]){
  db.prepare('INSERT INTO character_tags(id,name) VALUES(?,?)').run(id,name);
 }
 for(const [character,tag] of [[one,magic],[other,steel],[archive,old]]){
  db.prepare('INSERT INTO character_tag_links(character_id,tag_id) VALUES(?,?)').run(character,tag);
 }
 db.prepare('UPDATE characters SET archived=1 WHERE id=?').run(archive);
 return {db,owner:first,reader:second,magic,steel,old,unused};
}
test('Lore is saved and recovered with title, description, linked allowed tags and stable A-Z title list',async()=>{
 const fixture=await seeded();const {db,owner,reader,magic,steel,old,unused}=fixture;
 try{
  const lore=createLoreService(db);
  const request={title:'Zebra',text:'First story\nSecond paragraph.',tagIds:[magic],clientRequestId:randomUUID()};
  const entry=lore.create(owner.id,request);
  assert.equal(entry.title,'Zebra');assert.equal(entry.text,request.text);assert.deepEqual(entry.tags,[{id:magic,name:'Magic'}]);
  assert.equal(lore.create(owner.id,request).id,entry.id,'repeat submission must not duplicate a saved entry');
  assert.throws(()=>lore.create(owner.id,{...request,title:'Changed'}),{code:'duplicate_request',status:409});
  assert.throws(()=>lore.create(owner.id,{...request,clientRequestId:randomUUID(),tagIds:[steel]}),{code:'tag_not_available',status:403});
  assert.throws(()=>lore.create(owner.id,{...request,clientRequestId:randomUUID(),tagIds:[old]}),{code:'tag_not_available',status:403});
  assert.throws(()=>lore.create(owner.id,{...request,clientRequestId:randomUUID(),tagIds:[unused]}),{code:'tag_not_available',status:403});
  assert.throws(()=>lore.create(owner.id,{...request,clientRequestId:randomUUID(),title:'x'.repeat(141)}),{code:'invalid_lore'});
  assert.throws(()=>lore.create(owner.id,{...request,clientRequestId:randomUUID(),text:' '}),{code:'invalid_lore'});
  assert.throws(()=>lore.create(owner.id,{...request,clientRequestId:randomUUID(),tagIds:[magic,magic]}),{code:'invalid_tags'});
  const alpha=lore.create(reader.id,{title:'Alpha',text:'Other Lore',tagIds:[steel],clientRequestId:randomUUID()});
  const middle=lore.create(owner.id,{title:'Middle',text:'No tags',tagIds:[],clientRequestId:randomUUID()});
  const read=lore.list(reader.id,{sort:'az'});
  assert.equal(lore.list(reader.id).sort,'newest');
  assert.deepEqual(read.entries.map(e=>e.title),['Alpha']);
  assert.deepEqual(lore.list(reader.id,{sort:'az',admin:true}).entries.map(e=>e.title),['Alpha','Middle','Zebra']);
  assert.equal(read.entries[0].id,alpha.id);
  assert.equal(lore.list(owner.id,{query:'paragraph'}).entries[0].id,entry.id,'search should match descriptions too');
  assert.deepEqual(lore.list(owner.id,{tagIds:[magic]}).entries.map(e=>e.id),[entry.id]);
  assert.deepEqual(lore.list(reader.id,{tagIds:[steel]}).entries.map(e=>e.id),[alpha.id]);
  assert.throws(()=>lore.list(reader.id,{tagIds:[magic]}),{code:'tag_not_available',status:403});
  const firstPage=lore.list(owner.id,{limit:1,sort:'az'});
  assert.deepEqual(firstPage.entries.map(e=>e.title),['Middle']);
  const secondPage=lore.list(owner.id,{limit:1,cursor:firstPage.nextCursor,sort:'az'});
  assert.deepEqual(secondPage.entries.map(e=>e.title),['Zebra']);
  assert.equal(secondPage.nextCursor,null);
  assert.equal(lore.get(middle.id).text,'No tags');
  const html=renderLoreLibrary({entries:read.entries,serverFiltered:true,canPublish:true});
  assert.match(html,/>Alpha<\/a>/);
  assert.doesNotMatch(html,/>Middle<\/a>|>Zebra<\/a>/);
  assert.match(html,/href="lore-compose.html"/);
  assert.doesNotMatch(html,/Other Lore|First story|comos-lore-card/);
  const detail=renderLoreEntry(entry);
  assert.match(detail,/Zebra/);assert.match(detail,/First story\nSecond paragraph/);assert.match(detail,/Magic/);
  assert.doesNotMatch(detail,/<script>/);
 }finally{db.close();}
});
test('Lore HTTP routes require sign-in and protect tag writes, with read-only detail links',async()=>{
 const fixture=await seeded();const {db,owner,reader,magic,steel}=fixture;
 const sessions={restore:async token=>{
  if(token==='owner')return {subject:'owner',user:owner};
  if(token==='reader')return {subject:'reader',user:reader};
  throw Error('No session');
 }};
 const server=createApiServer({db,loreRoutes:createLoreRoutes({db,sessions,origin:'https://example.test'})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/api/v1/lore';
 const ownHeaders={'Content-Type':'application/json',Origin:'https://example.test',Cookie:'__Host-comos_session=owner'};
 const otherHeaders={'Content-Type':'application/json',Origin:'https://example.test',Cookie:'__Host-comos_session=reader'};
 try{
  assert.equal((await fetch(base)).status,401);
  const payload={title:'Quiet Grove',text:'The grove is old.',tagIds:[magic],clientRequestId:randomUUID()};
  assert.equal((await fetch(base,{method:'POST',headers:ownHeaders,body:JSON.stringify({...payload,authorId:reader.id})})).status,400,'caller cannot spoof author');
  assert.equal((await fetch(base,{method:'POST',headers:{...ownHeaders,Origin:'https://evil.test'},body:JSON.stringify(payload)})).status,403);
  assert.equal((await fetch(base,{method:'POST',headers:otherHeaders,body:JSON.stringify(payload)})).status,403,'reader cannot use owner tag');
  const create=await fetch(base,{method:'POST',headers:ownHeaders,body:JSON.stringify(payload)});
  assert.equal(create.status,201);
  const result=await create.json();
  const id=result.entry.id;
  const listed=await fetch(base,{headers:{Cookie:'__Host-comos_session=reader'}});
  assert.equal(listed.status,200);
  assert.deepEqual((await listed.json()).entries,[]);
  const single=await fetch(base+'/'+id,{headers:{Cookie:'__Host-comos_session=reader'}});
  assert.equal(single.status,404);
  const ownerView=await fetch(base+'/'+id,{headers:{Cookie:'__Host-comos_session=owner'}});
  assert.equal(ownerView.status,200);assert.equal((await ownerView.json()).entry.text,payload.text);
  assert.equal((await fetch(base+'?tagId='+magic,{headers:{Cookie:'__Host-comos_session=reader'}})).status,403);
  assert.equal((await fetch(base,{method:'DELETE',headers:ownHeaders})).status,405);
  assert.equal((await fetch(base+'?ownerId='+reader.id,{headers:{Cookie:'__Host-comos_session=owner'}})).status,400);
  assert.equal((await fetch(base+'/'+randomUUID(),{headers:{Cookie:'__Host-comos_session=reader'}})).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});
