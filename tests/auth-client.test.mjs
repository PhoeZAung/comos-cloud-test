import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { validateAuth, authMessage } from '../src/auth/validation.mjs';
import { createAuthService } from '../src/auth/service.mjs';
import { authConfiguration, initializeAuthentication } from '../backend/auth/firebase.mjs';
import { openDatabase } from '../backend/db/database.mjs';

test('form validation handles missing, malformed, short and mismatching inputs', () => {
 assert.deepEqual(validateAuth('signin', {email:' test@example.com ',password:' '}),{});
 assert.equal(Object.keys(validateAuth('signin',{})).length,2);
 assert.ok(validateAuth('reset',{email:'broken'}).email);
 assert.ok(validateAuth('signup',{email:'test@example.com',password:'short',confirm:'different'}).password);
 assert.ok(validateAuth('signup',{email:'test@example.com',password:'abcdefgh',confirm:'different'}).confirm);
 assert.deepEqual(validateAuth('signup',{email:'test@example.com',password:' abcdefg ',confirm:' abcdefg '}),{});
 assert.equal(authMessage({code:'auth/wrong-password'}),authMessage({code:'auth/user-not-found'}));
 assert.ok(!authMessage({message:'secret-token'}).includes('secret-token'));
});

test('real adapter exchanges proof, restores sessions and clears provider state',async()=>{
 const calls=[],providerCalls=[];
 const provider={email:async(...args)=>{providerCalls.push(args);return {user:{getIdToken:async force=>{assert.equal(force,true);return 'verified-proof';}}};},signOut:async()=>providerCalls.push('out'),reset:async()=>{throw {code:'auth/user-not-found'};}};
 const request=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({user:{id:'internal-user'}})};};
 const service=createAuthService({provider,request,origin:'https://comos.example'});
 await assert.rejects(service.signIn('signup',{email:'x',password:'x'}));assert.equal(calls.length,0);
 const result=await service.signIn('signin',{email:' test@example.com ',password:' untouched '});assert.equal(result.user.id,'internal-user');
 assert.deepEqual(providerCalls[0],['test@example.com',' untouched ',false]);assert.equal(providerCalls[1],'out');
 assert.deepEqual(JSON.parse(calls[0].options.body),{idToken:'verified-proof'});assert.equal(calls[0].options.credentials,'same-origin');
 await service.restore();assert.equal(calls[1].options.method,'GET');
 assert.match((await service.reset('test@example.com')).message,/If an account/);
 await service.signOut();assert.match(calls[2].url,/logout$/);assert.equal(providerCalls.at(-1),'out');
});

test('failed exchange clears provider state and duplicate submissions are rejected',async()=>{
 let release,outs=0;const pending=new Promise(r=>release=r);
 const provider={email:async()=>{await pending;return {user:{getIdToken:async()=>'token'}};},signOut:async()=>{outs++;}};
 const service=createAuthService({provider,request:async()=>{throw Error('offline');},origin:'https://comos.example'});
 const first=service.signIn('signin',{email:'test@example.com',password:'test'});
 await assert.rejects(service.signIn('signin',{email:'test@example.com',password:'test'}),{code:'session/busy'});
 release();await assert.rejects(first,{code:'session/unavailable'});assert.equal(outs,1);
});

test('Firebase boot defaults off, rejects invalid configuration, and official SDK interfaces load',async()=>{
 assert.equal(authConfiguration({}),null);
 for(const env of [
  {COMOS_AUTH_MODE:'fixture'}, {COMOS_AUTH_MODE:'firebase'},
  {COMOS_AUTH_MODE:'firebase',COMOS_FIREBASE_PROJECT_ID:'comos-test',COMOS_AUTH_ORIGIN:'http://example.com'},
  {COMOS_AUTH_MODE:'firebase',COMOS_FIREBASE_PROJECT_ID:'comos-test',COMOS_AUTH_ORIGIN:'https://example.com/'},
  {COMOS_AUTH_MODE:'firebase',COMOS_FIREBASE_PROJECT_ID:'comos-test',COMOS_AUTH_ORIGIN:'https://example.com',FIREBASE_AUTH_EMULATOR_HOST:'localhost:9099'},
 ])assert.throws(()=>authConfiguration(env));
 const db=await openDatabase(':memory:');try{const value=await initializeAuthentication({db,env:{}});assert.equal(value.sessionRoutes,null);await value.close();}finally{db.close();}
 const [{initializeApp,deleteApp},{getAuth}]=await Promise.all([import('firebase-admin/app'),import('firebase-admin/auth')]);
 const app=initializeApp({projectId:'comos-test'},'sdk-import-check');try{const auth=getAuth(app);assert.equal(typeof auth.verifyIdToken,'function');assert.equal(typeof auth.verifySessionCookie,'function');}finally{await deleteApp(app);}
 assert.equal(typeof (await import('../src/auth/firebase.mjs')).createFirebaseClient,'function');
});

test('generated forms remain preview-only and labelled, with submission disabled without JavaScript',async()=>{
 for(const id of ['signin','signup']){
  const html=await readFile(new URL(`../dist/${id}.html`,import.meta.url),'utf8');
  assert.match(html,/Form preview/);assert.match(html,/Nothing is sent or saved/);
  assert.match(html,/src="auth\/preview.mjs"/);assert.match(html,/type="submit" disabled/);
  assert.match(html,/for="email"/);assert.match(html,/for="password"/);
  assert.match(html,/connect-src &#39;none&#39;/);assert.match(html,/form-action &#39;none&#39;/);
 }
 assert.deepEqual((await readdir(new URL('../dist/auth/',import.meta.url))).sort(),['preview.mjs','validation.mjs']);
 const preview=await readFile(new URL('../dist/auth/preview.mjs',import.meta.url),'utf8');assert.doesNotMatch(preview,/fetch\(|localStorage|sessionStorage|firebase\.mjs/);
});

// Provider outage must not silently invalidate the browser's existing session cookie.
test('temporary provider failure returns service-unavailable without clearing session', async () => {
 const { createSessionRoutes } = await import('../backend/auth/routes.mjs');
 const route = createSessionRoutes({origin:'https://comos.example',sessions:{restore:async()=>{throw {code:'auth/internal-error'};}}});
 const headers = {}, replies = [];
 await route({method:'GET',headers:{cookie:'__Host-comos_session=existing'}},{setHeader:(k,v)=>{headers[k]=v;}},'/api/v1/auth/session',(...args)=>replies.push(args));
 assert.deepEqual(replies,[[503,{error:'service_unavailable'}]]);
 assert.equal(headers['Set-Cookie'],undefined);
});


test('interrupted signup reports existing account and keeps the original failure after cleanup errors',async()=>{
 const provider={email:async()=>({user:{getIdToken:async()=>{throw Object.assign(new Error('offline'),{code:'auth/network-request-failed'});}}}),signOut:async()=>{throw Error('cleanup failed');}};
 const service=createAuthService({provider,origin:'https://comos.example',request:async()=>{throw Error('must not send');}});
 await assert.rejects(service.signIn('signup',{email:'test@example.com',password:'abcdefgh',confirm:'abcdefgh'}),error=>error.code==='auth/network-request-failed'&&error.accountCreated===true);
});
