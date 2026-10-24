import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthThrottle } from '../backend/auth/throttle.mjs';
import { createSessionRoutes } from '../backend/auth/routes.mjs';
import { createAuthService } from '../src/auth/service.mjs';
const lanes={login:2,restore:4,profile:2,logout:2};
test('auth limits refill, separate peers/lanes, cap concurrency and safely release twice',()=>{
 let time=0;const t=createAuthThrottle({now:()=>time,windowMs:1000,limits:lanes,globalLimit:20,maxConcurrent:1});
 let a=t.enter('peer-a','login');assert.equal(a.allowed,true);assert.equal(t.enter('peer-b','restore').allowed,false);a.release();a.release();
 a=t.enter('peer-a','login');a.release();assert.equal(t.enter('peer-a','login').allowed,false);
 a=t.enter('peer-a','logout');assert.equal(a.allowed,true);a.release();
 a=t.enter('peer-b','login');assert.equal(a.allowed,true);a.release();
 time=500;a=t.enter('peer-a','login');assert.equal(a.allowed,true);a.release();
});
test('global cap prevents peer rotation and the peer map rejects overflow until stale',()=>{
 let time=0;const t=createAuthThrottle({now:()=>time,windowMs:1000,limits:lanes,globalLimit:2,maxPeers:2});
 for(const peer of ['a','b']){const a=t.enter(peer,'login');a.release();}
 assert.equal(t.enter('c','restore').allowed,false);assert.equal(t.enter('a','restore').allowed,false);
 time=1000;const a=t.enter('c','login');assert.equal(a.allowed,true);a.release();
});
test('HTTP limiter blocks before provider calls and forwarded headers do not change peer identity',async()=>{
 let calls=0,time=0;const throttle=createAuthThrottle({now:()=>time,windowMs:1000,limits:{...lanes,restore:1}});
 const route=createSessionRoutes({origin:'https://comos.example',throttle,sessions:{restore:async()=>{calls++;throw Error('invalid');}}});
 async function run(forwarded){const headers={},replies=[];await route({method:'GET',socket:{remoteAddress:'127.0.0.1'},headers:{cookie:'__Host-comos_session=fake','x-forwarded-for':forwarded}},{setHeader:(k,v)=>{headers[k]=v;}},'/api/v1/auth/session',(...r)=>replies.push(r));return {headers,replies};}
 assert.equal((await run('first')).replies[0][0],401);
 const rejected=await run('second');assert.equal(rejected.replies[0][0],429);assert.equal(rejected.headers['Retry-After'],'1');assert.equal(calls,1);
 time=1000;assert.equal((await run('third')).replies[0][0],401);assert.equal(calls,2);
});
test('rejected Origin does not consume the legitimate request budget; failures release capacity',async()=>{
 const throttle=createAuthThrottle({limits:lanes,maxConcurrent:1});let calls=0;
 const routes=createSessionRoutes({origin:'https://comos.example',throttle,sessions:{logout:async()=>{calls++;throw Error();}}});
 async function run(origin){let code;await routes({method:'POST',headers:{origin,cookie:'__Host-comos_session=fake'},socket:{remoteAddress:'a'}},{setHeader:()=>{}},'/api/v1/auth/logout',s=>code=s);return code;}
 assert.equal(await run('https://evil.example'),403);assert.equal(await run('https://comos.example'),401);assert.equal(await run('https://comos.example'),401);assert.equal(await run('https://comos.example'),429);assert.equal(calls,2);
});
test('client reports throttling without retrying the server request',async()=>{
 let calls=0;const service=createAuthService({provider:{},origin:'https://comos.example',request:async()=>{calls++;return {ok:false,status:429};}});
 await assert.rejects(service.restore(),{code:'session/rate-limited'});assert.equal(calls,1);
});
