import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {openDatabase} from '../backend/db/database.mjs';
import {createItemsService} from '../backend/items/service.mjs';
import {createItemsRoutes} from '../backend/items/routes.mjs';
import {createApiServer} from '../backend/http/app.mjs';
const draft=()=>({op:'save',id:randomUUID(),revision:0,name:'Example item',sourceId:'test-source',sourceVersion:'1.0',category:'Equipment',description:'Plain text\nSecond line'});
test('item records persist, retry without duplicates, reject stale/invalid edits and archive reversibly',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'comos-items-'));let db;
 try{
  db=await openDatabase(path.join(dir,'db.sqlite'));let items=createItemsService(db),change=draft();
  const created=items.save(change);assert.equal(created.schemaVersion,1);assert.deepEqual(items.save(change),created);assert.equal(items.list().items.length,1);
  for(const patch of [{name:' '},{sourceId:''},{sourceVersion:'<script>'},{schemaVersion:2},{description:'a'.repeat(30001)},{name:'x\ny'},{category:23}])assert.throws(()=>items.save({...draft(),...patch}),{code:'INVALID_ITEM'});
  items.save({...change,revision:1,name:'Renamed',description:'<b>Plain text</b>'});assert.throws(()=>items.save({...change,revision:1}),{code:'REVISION_CONFLICT'});
  items.save({op:'archive',id:change.id,revision:2,archived:true});assert.equal(items.list().items.length,0);assert.equal(items.list({archived:true}).items.length,1);
  db.close();db=await openDatabase(path.join(dir,'db.sqlite'));items=createItemsService(db);const restored=items.get(change.id);assert.equal(restored.name,'Renamed');assert.equal(restored.description,'<b>Plain text</b>');assert.equal(restored.revision,3);
  items.save({op:'archive',id:change.id,revision:3,archived:false});assert.equal(items.list().items.length,1);
 }finally{db?.close();await rm(dir,{recursive:true,force:true});}
});
test('item summaries omit descriptions, filter by source and paginate without duplicates',async()=>{
 const db=await openDatabase(':memory:');try{
  const items=createItemsService(db);
  for(let i=0;i<45;i++)items.save({...draft(),name:'Example '+i,sourceId:i%2?'source-a':'source-b',description:'large detail body'});
  let cursor='',ids=[];do{const page=items.list({cursor});assert.ok(page.items.length<=20);for(const item of page.items)assert.equal('description' in item,false);ids.push(...page.items.map(i=>i.id));cursor=page.nextCursor;}while(cursor);
  assert.equal(ids.length,45);assert.equal(new Set(ids).size,45);assert.equal(items.get(ids[0]).description,'large detail body');
  const page=items.list({sourceId:'source-a'});assert.equal(page.items.length,20);assert.ok(page.items.every(i=>i.sourceId==='source-a'));assert.equal(items.list({q:'No match'}).items.length,0);
  assert.throws(()=>items.list({cursor:'bad'}),{code:'INVALID_ITEM'});assert.throws(()=>items.get('../private'),{code:'INVALID_ITEM'});
 }finally{db.close();}
});
test('item HTTP handlers protect list/detail/writes, enforce Origin, reject role forgery and conflicting edits',async()=>{
 const db=await openDatabase(':memory:');
 const sessions={restore:async cookie=>{if(cookie==='outage')throw Object.assign(Error(),{code:'auth/internal-error'});if(!['admin','ordinary'].includes(cookie))throw Error();return {subject:cookie,user:{id:'synthetic-user'}};}};
 const server=createApiServer({db,itemsRoutes:createItemsRoutes({sessions,items:createItemsService(db),origin:'https://example.test',adminUids:['admin']})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/api/v1/admin/items`,headers={Cookie:'__Host-comos_session=admin',Origin:'https://example.test','Content-Type':'application/json'};
 try{
  const change=draft();for(const url of [base,base+'/'+change.id]){
   assert.equal((await fetch(url)).status,401);
   assert.equal((await fetch(url+'?admin=true',{headers:{Cookie:'__Host-comos_session=ordinary','X-Role':'admin'}})).status,403);
   assert.equal((await fetch(url,{headers:{Cookie:'__Host-comos_session=admin; __Host-comos_session=ordinary'}})).status,401);
  }
  assert.equal((await fetch(base,{headers:{Cookie:'__Host-comos_session=outage'}})).status,503);
  assert.equal((await fetch(base,{method:'POST',headers:{...headers,Origin:'https://evil.test'},body:JSON.stringify(change)})).status,403);
  assert.equal((await fetch(base,{method:'POST',headers:{...headers,Cookie:'__Host-comos_session=ordinary'},body:JSON.stringify(change)})).status,403);
  let response=await fetch(base,{method:'POST',headers,body:JSON.stringify(change)});assert.equal(response.status,200);
  const list=await (await fetch(base,{headers})).json();assert.equal('description' in list.items[0],false);
  const detail=await (await fetch(base+'/'+change.id,{headers})).json();assert.equal(detail.item.description,change.description);
  response=await fetch(base,{method:'POST',headers,body:JSON.stringify({...change,revision:1,name:'Updated'})});assert.equal(response.status,200);
  response=await fetch(base,{method:'POST',headers,body:JSON.stringify({...change,revision:1,name:'Stale'})});assert.equal(response.status,409);
  assert.equal((await fetch(base+'/'+randomUUID(),{headers})).status,404);
  assert.equal((await fetch(base,{method:'DELETE',headers})).status,405);
  assert.equal((await fetch(base,{method:'POST',headers,body:'{bad json'})).status,400);
  assert.equal((await fetch(base+'?archived=maybe',{headers})).status,400);
  response=await fetch(base,{method:'POST',headers,body:JSON.stringify({...draft(),description:'x'.repeat(51000)})});assert.equal(response.status,413);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});
