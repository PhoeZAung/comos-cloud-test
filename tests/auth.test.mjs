import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../backend/db/database.mjs';
import { createSessionService } from '../backend/auth/sessions.mjs';
import { createSessionRoutes } from '../backend/auth/routes.mjs';
import { createApiServer } from '../backend/http/app.mjs';
test('session lifecycle, identity isolation, revocation, CSRF and forged proof',async()=>{
 const db=await openDatabase(':memory:');let revoked=false,subject='alice',age=0,aud='comos-test';const now=1900000000000;
 const claims=session=>({sub:subject,aud,iss:`https://${session?'session.firebase':'securetoken'}.google.com/comos-test`,exp:now/1000+600,auth_time:now/1000-age});
 const auth={
  async verifyIdToken(token,check){assert.equal(check,true);if(token!=='valid'||revoked)throw Error();return claims(false);},
  async createSessionCookie(token,{expiresIn}){assert.equal(expiresIn,432000000);return 'signed-cookie';},
  async verifySessionCookie(token,check){assert.equal(check,true);if(token!=='signed-cookie'||revoked)throw Error();return claims(true);},
  async revokeRefreshTokens(uid){assert.equal(uid,subject);revoked=true;}
 };
 const sessions=createSessionService({db,auth,projectId:'comos-test',now:()=>now});
 const origin='https://comos.example';
 assert.throws(()=>createSessionRoutes({sessions,origin:'http://comos.example'}));
 const server=createApiServer({db,sessionRoutes:createSessionRoutes({sessions,origin})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try {
  await assert.rejects(sessions.login('forged'));
  age=301;await assert.rejects(sessions.login('valid'));age=-1;await assert.rejects(sessions.login('valid'));age=0;
  aud='other';await assert.rejects(sessions.login('valid'));aud='comos-test';
  assert.equal(db.prepare('SELECT count(*) n FROM users').get().n,0);
  const a=await sessions.login('valid');assert.equal(a.user.profileState,'incomplete');
  assert.equal((await sessions.login('valid')).user.id,a.user.id);
  assert.equal((await sessions.restore(a.cookie)).user.id,a.user.id);
  subject='bob';assert.notEqual((await sessions.login('valid')).user.id,a.user.id);
  const base=`http://127.0.0.1:${server.address().port}/api/v1`;
  const request=(route,options)=>fetch(base+route,options);
  const post=(value,extra={})=>({method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...extra},body:JSON.stringify(value)});
  assert.equal((await request('/auth/session',post({idToken:'valid'},{Origin:'https://evil.example'}))).status,403);
  assert.equal((await request('/auth/session',post({idToken:'forged'}))).status,401);
  assert.equal((await request('/auth/session',post({idToken:'x'.repeat(19000)}))).status,400);
  const login=await request('/auth/session',post({idToken:'valid'}));assert.equal(login.status,200);
  const header=login.headers.get('set-cookie');for(const part of ['HttpOnly','Secure','SameSite=Strict','Path=/'])assert.ok(header.includes(part));
  const Cookie=header.split(';')[0];
  assert.equal((await request('/auth/session',{headers:{Cookie}})).status,200);
  assert.equal((await request('/users',{headers:{Cookie}})).status,401);
  assert.equal((await request('/auth/session',{headers:{Cookie:Cookie+'; '+Cookie}})).status,401);
  const out=await request('/auth/logout',post({}, {Cookie}));assert.equal(out.status,200);assert.ok(out.headers.get('set-cookie').includes('Max-Age=0'));
  assert.equal((await request('/auth/session',{headers:{Cookie}})).status,401);
 }finally{await new Promise(r=>server.close(r));db.close();}
});
