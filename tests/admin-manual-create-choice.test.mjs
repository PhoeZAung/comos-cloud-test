import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharacterLibraryRoutes} from '../backend/characters/library.mjs';
import {createApiServer} from '../backend/http/app.mjs';

test('admin Create character offers Wizard or Manual for the selected player',async()=>{
 const source=await readFile(new URL('../src/ui/directory.mjs',import.meta.url),'utf8');
 assert.match(source,/data-admin-create-open/);
 assert.match(source,/if\(!partyMode\)root\.insertAdjacentHTML/);
 assert.match(source,/data-admin-create-dialog/);
 assert.match(source,/data-admin-create-wizard/);
 assert.match(source,/Use Wizard/);
 assert.match(source,/data-admin-create-manual/);
 assert.match(source,/Create Manually/);
 assert.match(source,/create-identity\.html\?ownerId='\+encodeURIComponent\(ownerId\)/);
 assert.match(source,/api\('admin\/characters\/create',\{mode:'manual',ownerId:createOwnerId,requestId:createRequestId\}/);
 assert.match(source,/location\.assign\('sheet\.html\?characterId='\+encodeURIComponent\(result\.character\.id\)\)/);
 assert.match(source,/createRequestId\|\|=crypto\.randomUUID\(\)/);
 assert.doesNotMatch(source,/<a class="button primary" href="create-identity\.html\?ownerId=/);
});

test('admin can create a blank manual character for another owner, but a non-admin cannot',async()=>{
 const db=await openDatabase(':memory:');
 const repo=createUserRepository(db);
 const admin=repo.create({displayName:'Admin'});
 const player=repo.create({displayName:'Player'});
 const other=repo.create({displayName:'Other'});
 const sessions={restore:async token=>{
  if(token==='admin')return {subject:'admin-subject',user:admin};
  if(token==='player')return {subject:'player-subject',user:player};
  throw Error('Sign in');
 }};
 const origin='https://example.test';
 const server=createApiServer({db,characterLibraryRoutes:createCharacterLibraryRoutes({db,sessions,origin,adminUids:['admin-subject']})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/api/v1/admin/characters/create';
 const headers={Cookie:'__Host-comos_session=admin',Origin:origin,'Content-Type':'application/json'};
 const requestId=randomUUID();
 const request={mode:'manual',ownerId:player.id,requestId};
 const post=(body,extra={})=>fetch(base,{method:'POST',headers:{...headers,...extra},body:JSON.stringify(body)});
 try{
  const created=await post(request);
  assert.equal(created.status,201);
  const first=(await created.json()).character;
  assert.equal(first.name,'New Character');
  assert.deepEqual(first.data,{manualCharacter:true});
  assert.equal(db.prepare('SELECT owner_id FROM characters WHERE id=?').get(first.id).owner_id,player.id);
  assert.equal(db.prepare('SELECT count(*) AS count FROM characters WHERE owner_id=?').get(admin.id).count,0);
  assert.deepEqual(JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(first.id).data_json),{manualCharacter:true});
  const retry=await post(request);
  assert.equal(retry.status,201);
  assert.equal((await retry.json()).character.id,first.id);
  const second=await post({...request,ownerId:other.id});
  assert.equal(second.status,201);
  assert.notEqual((await second.json()).character.id,first.id);
  assert.equal(db.prepare('SELECT count(*) AS count FROM characters WHERE owner_id=?').get(player.id).count,1);
  assert.equal((await post(request,{Cookie:'__Host-comos_session=player'})).status,403);
  assert.equal((await post(request,{Cookie:'__Host-comos_session=invalid'})).status,401);
  assert.equal((await post(request,{Origin:'https://other.test'})).status,403);
  assert.equal((await post({...request,ownerId:randomUUID()})).status,400);
  assert.equal((await post({...request,build:{}})).status,400);
  assert.equal((await post({...request,mode:'not-manual'})).status,400);
  assert.equal((await post({...request,requestId:'invalid'})).status,400);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});
