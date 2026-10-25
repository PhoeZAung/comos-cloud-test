import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharactersService} from '../backend/characters/service.mjs';
import {createCharactersRoutes} from '../backend/characters/routes.mjs';
import {createApiServer} from '../backend/http/app.mjs';
test('character metadata survives restart, transfers ownership, validates sources and prevents stale edits',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'comos-characters-'));let db;
 try{
  db=await openDatabase(path.join(dir,'db.sqlite'));const users=createUserRepository(db),a=users.create({displayName:'First'}),b=users.create({displayName:'Second'});let c=createCharactersService(db);
  const change={op:'save',id:randomUUID(),revision:0,name:'  Explorer  ',ownerId:a.id,sources:[{id:'ffd20',version:'1'}]};
  const created=c.save(change);assert.equal(created.name,'Explorer');assert.equal(created.schemaVersion,1);assert.deepEqual(c.save(change),created);
  assert.throws(()=>c.save({...change,ownerId:b.id}),{code:'REVISION_CONFLICT'});
  for(const patch of [{ownerId:'missing'},{sources:[{id:'ffd20',version:'1'},{id:'ffd20',version:'2'}]},{sources:[{id:'ff',version:'<script>'}]},{name:'\u0000bad'},{isAdmin:true}])assert.throws(()=>c.save({...change,id:randomUUID(),...patch}),{code:'INVALID_CHARACTER'});
  const updated=c.save({...change,revision:1,ownerId:b.id});assert.equal(updated.ownerName,'Second');assert.equal(updated.revision,2);
  assert.throws(()=>c.save({...change,revision:1}),{code:'REVISION_CONFLICT'});
  c.save({op:'archive',id:change.id,revision:2,archived:true});assert.equal(c.list().characters.length,0);assert.equal(c.list({archived:true}).characters.length,1);
  db.close();db=await openDatabase(path.join(dir,'db.sqlite'));c=createCharactersService(db);const saved=c.list({archived:true}).characters[0];assert.equal(saved.ownerId,b.id);assert.equal(saved.revision,3);assert.deepEqual(saved.sources,[{id:'ffd20',version:'1'}]);
  c.save({op:'archive',id:saved.id,revision:3,archived:false});assert.equal(c.list().characters[0].archived,false);
 }finally{db?.close();await rm(dir,{recursive:true,force:true});}
});
test('character and player searches are bounded and character cursors never repeat records',async()=>{
 const db=await openDatabase(':memory:');try{
  const users=createUserRepository(db),a=users.create({displayName:'Owner'}),c=createCharactersService(db);
  for(let i=0;i<45;i++)c.save({op:'save',id:randomUUID(),revision:0,name:'Explorer '+i,ownerId:a.id,sources:[]});
  const ids=[];let cursor='';do{const page=c.list({cursor,q:'Explorer'});assert.ok(page.characters.length<=20);ids.push(...page.characters.map(c=>c.id));cursor=page.nextCursor;}while(cursor);
  assert.equal(new Set(ids).size,45);assert.equal(ids.length,45);assert.equal(c.list({q:'missing'}).characters.length,0);
  for(let i=0;i<55;i++)users.create({displayName:'Player '+i});assert.equal(c.players().users.length,50);assert.equal(c.players().moreUsers,true);assert.equal(c.players({q:'Player 54'}).users.length,1);assert.equal(c.players({userId:a.id}).selectedUser.id,a.id);
  assert.throws(()=>c.list({cursor:'bad'}),{code:'INVALID_CHARACTER'});
 }finally{db.close();}
});
test('character controls enforce session admins, reject forged roles and foreign writes, and protect player lists',async()=>{
 const db=await openDatabase(':memory:'),user=createUserRepository(db).create();
 const sessions={restore:async cookie=>{if(!['admin','player'].includes(cookie))throw Error();return {user,subject:cookie};}};
 const server=createApiServer({db,charactersRoutes:createCharactersRoutes({sessions,characters:createCharactersService(db),origin:'https://example.test',adminUids:['admin']})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/api/v1`;
 const headers={Cookie:'__Host-comos_session=admin',Origin:'https://example.test','Content-Type':'application/json'};
 try{
  for(const p of ['/access','/admin/characters','/admin/players'])assert.equal((await fetch(base+p)).status,401);
  for(const p of ['/admin/characters','/admin/players'])assert.equal((await fetch(base+p+'?admin=true',{headers:{Cookie:'__Host-comos_session=player','X-Role':'admin'}})).status,403);
  assert.deepEqual(await (await fetch(base+'/access',{headers:{Cookie:'__Host-comos_session=player'}})).json(),{admin:false});assert.deepEqual(await (await fetch(base+'/access',{headers})).json(),{admin:true});
  assert.equal((await fetch(base+'/admin/characters',{method:'POST',headers:{...headers,Origin:'https://evil.test'},body:'{}'})).status,403);
  const change={op:'save',id:randomUUID(),revision:0,name:'Record',ownerId:user.id,sources:[]};
  let r=await fetch(base+'/admin/characters',{method:'POST',headers,body:JSON.stringify(change)});assert.equal(r.status,200);
  r=await fetch(base+'/admin/characters',{method:'POST',headers,body:JSON.stringify({...change,revision:1,name:'Renamed'})});assert.equal(r.status,200);
  r=await fetch(base+'/admin/characters',{method:'POST',headers,body:JSON.stringify({...change,revision:1,name:'Stale'})});assert.equal(r.status,409);
  assert.equal((await (await fetch(base+'/admin/characters',{headers})).json()).characters[0].name,'Renamed');
  assert.equal((await fetch(base+'/admin/characters?archived=maybe',{headers})).status,400);
  assert.equal((await fetch(base+'/admin/players',{method:'POST',headers,body:'{}'})).status,405);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});
