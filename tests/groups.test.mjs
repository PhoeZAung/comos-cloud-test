import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createGroupsService} from '../backend/groups/service.mjs';
import {createGroupsRoutes} from '../backend/groups/routes.mjs';
import {createApiServer} from '../backend/http/app.mjs';
test('world/party configuration is bounded, revision checked, and scope membership is conjunctive',async()=>{
 const db=await openDatabase(':memory:');try{
 const g=createGroupsService(db),u=createUserRepository(db).create(),v=createUserRepository(db).create();
 let revision=1;const update=data=>g.update({revision:revision++, ...data});
 for(let i=1;i<=4;i++)update({op:'world',name:'World '+i});
 assert.throws(()=>g.update({revision,op:'world',name:'Fifth'}),{code:'INVALID_GROUP'});
 assert.throws(()=>g.update({revision:1,op:'world',name:'Stale'}),{code:'REVISION_CONFLICT'});
 const [a,b]=g.snapshot().worlds;update({op:'party',worldId:a.id,name:'Party A'});const party=g.snapshot().parties[0];
 assert.throws(()=>g.update({revision,op:'memberships',userId:u.id,worldIds:[b.id],partyIds:[party.id]}),{code:'INVALID_GROUP'});
 assert.equal(g.canView(u.id,{worldId:a.id}),false);
 update({op:'memberships',userId:u.id,worldIds:[a.id],partyIds:[party.id]});
 assert.equal(g.canView(u.id,{worldId:a.id,partyId:party.id,playerId:u.id}),true);
 assert.equal(g.canView(u.id,{worldId:b.id,partyId:party.id}),false);
 assert.equal(g.canView(u.id,{worldId:a.id,playerId:v.id}),false);
 assert.equal(g.canView(v.id,{worldId:a.id,partyId:party.id}),false);
 update({op:'memberships',userId:u.id,worldIds:[],partyIds:[]});assert.equal(g.canView(u.id,{worldId:a.id,partyId:party.id}),false);
 assert.throws(()=>g.update({revision,op:'world',id:a.id,name:'<valid text>',admin:true}),{code:'INVALID_GROUP'});
 }finally{db.close();}
});
test('admin APIs deny signed-out/ordinary callers and forged roles, enforce Origin, and support explicit admins',async()=>{
 const db=await openDatabase(':memory:');const user=createUserRepository(db).create();
 const sessions={restore:async cookie=>{if(!['owner','ordinary'].includes(cookie))throw Error();return {user,subject:cookie};}};
 const server=createApiServer({db,groupsRoutes:createGroupsRoutes({sessions,groups:createGroupsService(db),origin:'https://example.test',adminUids:['owner']})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}/api/v1/admin/groups`;
 try{
  assert.equal((await fetch(url)).status,401);
  assert.equal((await fetch(url+'?admin=true',{headers:{Cookie:'__Host-comos_session=ordinary','X-Admin':'true'}})).status,403);
  const headers={Cookie:'__Host-comos_session=owner','Content-Type':'application/json',Origin:'https://example.test'};
  assert.equal((await fetch(url,{headers})).status,200);
  assert.equal((await fetch(url,{method:'POST',headers:{...headers,Origin:'https://evil.test'},body:'{}'})).status,403);
  let r=await fetch(url,{method:'POST',headers,body:JSON.stringify({revision:1,op:'world',name:'First world'})});assert.equal(r.status,200);assert.equal((await r.json()).worlds.length,1);
  r=await fetch(url,{method:'POST',headers,body:JSON.stringify({revision:1,op:'world',name:'Stale'})});assert.equal(r.status,409);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});
