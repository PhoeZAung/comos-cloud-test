import {gzipSync} from 'node:zlib';
import {importDirectory} from '../backend/import/legacy.mjs';
import {createGroupsService} from '../backend/groups/service.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createSessionService} from '../backend/auth/sessions.mjs';
import {createUserRepository,createIdentityRepository} from '../backend/repositories/users.mjs';
import {createCharactersService} from '../backend/characters/service.mjs';
import {createDirectoryRoutes} from '../backend/characters/directory.mjs';
import {createUserDeletionRoutes,removeCosmosUser} from '../backend/characters/user-deletion.mjs';
import {createApiServer} from '../backend/http/app.mjs';

test('user removal is atomic, preserves attribution, blocks sign-in/session reuse and keeps Firebase untouched',async()=>{
 const db=await openDatabase(':memory:');try{
  const users=createUserRepository(db),owner=users.create({displayName:'Admin'}),player=users.create({displayName:'Player'}),other=users.create({displayName:'Other'}),id=randomUUID(),issuer='https://securetoken.google.com/cosmos-test';
  createIdentityRepository(db).link({provider:'firebase',issuer,subject:'player'},player.id);
  createIdentityRepository(db).link({provider:'firebase',issuer,subject:'admin'},owner.id);
  createCharactersService(db).save({op:'save',id,revision:0,name:'Adventurer',ownerId:player.id,sources:[]});
  const args={db,adminUids:['admin'],actorId:owner.id,userId:player.id,confirmName:'Player',revision:player.revision};
  assert.throws(()=>removeCosmosUser({...args,confirmName:'wrong'}),/name/);assert.throws(()=>removeCosmosUser({...args,revision:99}),/changed/);assert.equal(db.prepare('SELECT archived FROM characters WHERE id=?').get(id).archived,0);
  assert.throws(()=>removeCosmosUser({...args,userId:owner.id,confirmName:'Admin'}),/own account/);assert.throws(()=>removeCosmosUser({...args,actorId:other.id,userId:owner.id,confirmName:'Admin'}),/Administrator/);
  let cookieCalls=0;const now=Date.now(),claims=session=>({sub:'player',aud:'cosmos-test',iss:session?'https://session.firebase.google.com/cosmos-test':issuer,exp:now/1000+600,auth_time:now/1000});
  const sessions=createSessionService({db,projectId:'cosmos-test',now:()=>now,auth:{verifyIdToken:async()=>claims(false),verifySessionCookie:async()=>claims(true),createSessionCookie:async()=>{cookieCalls++;return 'cookie';}}});
  assert.equal((await sessions.restore('cookie')).user.id,player.id);
  db.exec("CREATE TRIGGER test_remove_failure BEFORE UPDATE OF deleted_at ON users BEGIN SELECT RAISE(ABORT,'remove blocked'); END");
  assert.throws(()=>removeCosmosUser(args),/remove blocked/);assert.equal(db.prepare('SELECT archived FROM characters WHERE id=?').get(id).archived,0);assert.ok(users.get(player.id));db.exec('DROP TRIGGER test_remove_failure');
  assert.deepEqual(removeCosmosUser(args),{removed:true,archivedCharacters:1,firebaseDeleted:false});
  assert.equal(users.get(player.id),null);assert.ok(db.prepare('SELECT deleted_at,deleted_by FROM users WHERE id=?').get(player.id).deleted_at);assert.equal(db.prepare('SELECT archived,owner_id FROM characters WHERE id=?').get(id).owner_id,player.id);assert.equal(db.prepare('SELECT archived FROM characters WHERE id=?').get(id).archived,1);
  await assert.rejects(sessions.restore('cookie'));await assert.rejects(sessions.login('valid'),/removed/);assert.equal(cookieCalls,0);assert.equal(createIdentityRepository(db).find({provider:'firebase',issuer,subject:'player'}),player.id);assert.equal(users.create({displayName:'Player'}).displayName,'Player');
  assert.equal(createCharactersService(db).players().users.some(u=>u.id===player.id),false);
  const groups=createGroupsService(db);assert.equal(groups.snapshot().users.some(u=>u.id===player.id),false);assert.equal(groups.snapshot({userId:player.id}).selectedUser,null);assert.throws(()=>groups.update({op:'memberships',revision:groups.snapshot().revision,userId:player.id,worldIds:[],partyIds:[]}),/Select a player/);
  const backup=gzipSync(JSON.stringify({users:[{uid:'player',displayName:'Revived'}],characters:[{uid:'player',legacyId:'new-import',data:{charName:'Do not revive'}}]})).toString('base64');
  await importDirectory({db,projectId:'cosmos-test',auth:{listUsers:async()=>({users:[{uid:'player',displayName:'Revived'}]})},env:{COMOS_LEGACY_IMPORT_PARTS:'1',COMOS_LEGACY_IMPORT_0:backup}});assert.equal(users.get(player.id),null);assert.equal(db.prepare('SELECT count(*) AS n FROM characters WHERE owner_id=?').get(player.id).n,1);

 }finally{db.close();}
});

test('only a same-origin administrator may remove users and removed users vanish from directory',async()=>{
 const db=await openDatabase(':memory:'),users=createUserRepository(db),admin=users.create({displayName:'Admin'}),player=users.create({displayName:'Player'}),origin='https://cosmos.test';
 const sessions={restore:async cookie=>{if(cookie==='admin')return {user:admin,subject:'admin'};if(cookie==='player')return {user:player,subject:'player'};throw Error('No session');}};
 const removal=createUserDeletionRoutes({db,sessions,adminUids:['admin'],origin}),directory=createDirectoryRoutes({db,sessions,adminUids:['admin'],origin}),server=createApiServer({db,directoryRoutes:async(...args)=>await removal(...args)||await directory(...args)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const post=(cookie,requestOrigin=origin,extra={})=>fetch(base+'/api/v1/admin/users/remove',{method:'POST',headers:{cookie:'__Host-comos_session='+cookie,origin:requestOrigin,'content-type':'application/json'},body:JSON.stringify({userId:player.id,confirmName:'Player',revision:player.revision,...extra})});
 try{assert.equal((await post('none')).status,401);assert.equal((await post('player')).status,403);assert.equal((await post('admin','https://foreign.test')).status,403);assert.equal((await post('admin',origin,{actorId:player.id})).status,400);assert.equal((await post('admin')).status,200);const response=await fetch(base+'/api/v1/admin/directory',{headers:{cookie:'__Host-comos_session=admin'}});assert.deepEqual((await response.json()).users.map(u=>u.id),[admin.id]);}
 finally{await new Promise(resolve=>server.close(resolve));db.close();}
});
