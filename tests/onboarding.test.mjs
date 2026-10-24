import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { openDatabase } from '../backend/db/database.mjs';
import { createUserRepository } from '../backend/repositories/users.mjs';
import { createSessionService } from '../backend/auth/sessions.mjs';
import { createSessionRoutes } from '../backend/auth/routes.mjs';
import { createApiServer } from '../backend/http/app.mjs';
import { validateProfile } from '../src/auth/validation.mjs';
import { publicAuthConfig } from '../scripts/auth-build-config.mjs';

test('profile completion survives restart, retries safely and rejects stale competing edits',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'comos-profile-'));let db=await openDatabase(path.join(dir,'db.sqlite'));
 try{
  let users=createUserRepository(db);const a=users.create(),b=users.create();
  for(const name of ['', '   ', 'x'.repeat(81), 'bad\nname'])assert.throws(()=>users.completeProfile(a.id,name,1));
  assert.throws(()=>users.completeProfile(a.id,'Explorer',0));
  db.close();db=await openDatabase(path.join(dir,'db.sqlite'));users=createUserRepository(db);
  assert.equal(users.get(a.id).profileState,'incomplete');
  const result=users.completeProfile(a.id,' Explorer ',1);assert.equal(result.profileState,'complete');assert.equal(result.revision,2);
  assert.deepEqual(users.completeProfile(a.id,'Explorer',1),result);
  assert.throws(()=>users.completeProfile(a.id,'Someone else',1),{code:'REVISION_CONFLICT'});
  assert.equal(users.get(b.id).profileState,'incomplete');
  db.close();db=await openDatabase(path.join(dir,'db.sqlite'));assert.equal(createUserRepository(db).get(a.id).displayName,'Explorer');
 }finally{db.close();await rm(dir,{recursive:true,force:true});}
});

test('profile HTTP endpoint derives owner from session and rejects supplied identity and foreign origins',async()=>{
 const db=await openDatabase(':memory:');const time=Date.now();
 const claims=(sub,session)=>({sub,aud:'comos-test',iss:`https://${session?'session.firebase':'securetoken'}.google.com/comos-test`,exp:time/1000+500,auth_time:time/1000});
 const auth={verifyIdToken:async t=>{if(!['alice','bob'].includes(t))throw Error();return claims(t,false);},createSessionCookie:async t=>t,verifySessionCookie:async t=>{if(!['alice','bob'].includes(t))throw Error();return claims(t,true);}};
 const sessions=createSessionService({db,auth,projectId:'comos-test',now:()=>time});
 const a=await sessions.login('alice'),b=await sessions.login('bob');
 const origin='https://comos.example';const server=createApiServer({db,sessionRoutes:createSessionRoutes({sessions,origin})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const url=`http://127.0.0.1:${server.address().port}/api/v1/auth/profile`;
  const send=(body,headers={})=>fetch(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:'__Host-comos_session=alice',...headers},body:JSON.stringify(body)});
  assert.equal((await send({displayName:'Explorer',revision:1},{Cookie:''})).status,401);
  assert.equal((await send({displayName:'Explorer',revision:1},{Origin:'https://evil.example'})).status,403);
  assert.equal((await send({displayName:'Explorer',revision:1,userId:b.user.id})).status,400);
  assert.equal((await send({displayName:' ',revision:1})).status,400);
  const result=await send({displayName:'Explorer',revision:1});assert.equal(result.status,200);assert.equal((await result.json()).user.id,a.user.id);
  assert.equal((await send({displayName:'Explorer',revision:1})).status,200);
  assert.equal((await send({displayName:'Changed',revision:1})).status,409);
  assert.equal((await sessions.restore('bob')).user.profileState,'incomplete');
 }finally{await new Promise(r=>server.close(r));db.close();}
});

test('profile input and public build configuration reject invalid and private fields',()=>{
 assert.ok(validateProfile({displayName:' \n '}).displayName);assert.deepEqual(validateProfile({displayName:'星の旅人'}),{});
 const valid={origin:'https://comos.example',firebase:{projectId:'comos-test',authDomain:'comos-test.firebaseapp.com',apiKey:'AIza'+'a'.repeat(30),appId:'1:123:web:abcdef'}};
 assert.deepEqual(publicAuthConfig(valid),valid);
 for(const input of [{...valid,privateKey:'never'}, {...valid,origin:'http://localhost'}, {...valid,firebase:{...valid.firebase,private_key:'never'}},{...valid,firebase:{...valid.firebase,authDomain:'evil.example'}}])assert.throws(()=>publicAuthConfig(input));
});
