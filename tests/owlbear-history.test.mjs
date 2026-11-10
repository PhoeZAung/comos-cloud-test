import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {Readable} from 'node:stream';
import {rollHistory} from '../backend/characters/roll-history.mjs';
import {createOwlbearRoutes} from '../backend/auth/owlbear.mjs';
import {adminMenu} from '../src/owlbear/admin-menu.mjs';

function fixture(){
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE characters(id TEXT PRIMARY KEY,owner_id TEXT,name TEXT,kind TEXT DEFAULT \"player\");CREATE TABLE sheet_rolls(id TEXT PRIMARY KEY,user_id TEXT,character_id TEXT,label TEXT,result_json TEXT,created_at INTEGER)');
 db.prepare('INSERT INTO characters(id,owner_id,name) VALUES(?,?,?)').run('ca','a','Astra');db.prepare('INSERT INTO characters(id,owner_id,name) VALUES(?,?,?)').run('cb','b','Secret NPC');
 const add=(id,user,character,result,time=1)=>db.prepare('INSERT INTO sheet_rolls VALUES(?,?,?,?,?,?)').run(id,user,character,'Sword',JSON.stringify(result),time);
 return {db,add};
}
test('history preserves authoritative attack, damage and critical receipts without sending descriptions',()=>{
 const {db,add}=fixture();try{
  add('r','a','ca',{kind:'weapon',total:27,expression:'1d20+7',rolls:[20],description:'Private text',damage:{total:8,expression:'2d6',rolls:[3,5]},critical:{threat:true,confirmation:{total:18,expression:'1d20+7',rolls:[11]},damage:{total:16,expression:'2 × (2d6)',rolls:[]}}});
  const rows=rollHistory(db,'a');assert.equal(rows.length,1);assert.deepEqual(rows[0].parts.map(p=>p.total),[27,8,18,16]);assert.deepEqual(rows[0].parts[0].faces,[20]);assert.equal(rows[0].character,'Astra');assert.equal(JSON.stringify(rows).includes('Private text'),false);
  assert.equal(db.prepare('SELECT count(*) n FROM sheet_rolls').get().n,1);
 }finally{db.close();}
});
test('history isolates account and character ownership, ignores descriptions, and bounds results newest first',()=>{
 const {db,add}=fixture();try{
  for(let i=0;i<110;i++)add('own'+i,'a','ca',{total:i,expression:'1d20',rolls:[1]},i);
  add('secret','b','cb',{total:999},999);add('wrong-character','a','cb',{total:998},998);add('send','a','ca',{descriptionOnly:true,total:0},997);
  const rows=rollHistory(db,'a');assert.equal(rows.length,99);assert.equal(rows[0].id,'own109');assert.ok(rows.every(r=>r.character==='Astra'));assert.ok(!rows.some(r=>r.parts[0].total>=998));assert.equal(rollHistory(db,'nobody').length,0);
 }finally{db.close();}
});
test('extension history revalidates the original login and ignores requested user IDs',async()=>{
 const {db,add}=fixture();let revoked=false;
 add('a-roll','a','ca',{total:17,expression:'1d20',rolls:[17]});add('b-roll','b','cb',{total:88});
 const sessions={restore:async cookie=>{if(revoked||cookie!=='a')throw Error('Expired');return {subject:'ordinary-player',user:{id:'a'}};}},route=createOwlbearRoutes({db,sessions,adminUids:['admin-subject'],origin:'https://cosmos.test',handlers:[]});
 async function request(path,body,extra={}){const req=Readable.from([Buffer.from(JSON.stringify(body))]);req.method='POST';req.headers={origin:'https://cosmos.test','content-type':'application/json',...extra};req.socket={};let reply;await route(req,{},path,(status,data)=>reply={status,data});return reply;}
 try{
  assert.equal((await request('/api/v1/owlbear/connect',{scope:'sheet'})).status,401);
  assert.equal((await request('/api/v1/owlbear/connect',{scope:'party-status'},{cookie:'__Host-comos_session=a'})).status,403);
  const grant=await request('/api/v1/owlbear/connect',{scope:'sheet'},{cookie:'__Host-comos_session=a'});assert.equal(grant.status,200);assert.equal(grant.data.admin,false);
  const auth={authorization:'Bearer '+grant.data.token};const result=await request('/api/v1/owlbear/request',{method:'roll-history',value:{userId:'b'}},auth);assert.equal(result.status,200);assert.deepEqual(result.data.data.rolls.map(r=>r.id),['a-roll']);
  assert.equal((await request('/api/v1/owlbear/request',{method:'party-stats',value:{}},auth)).status,403);
  revoked=true;assert.equal((await request('/api/v1/owlbear/request',{method:'roll-history'},auth)).status,401);
 }finally{db.close();}
});
test('battle context menu is absent until GM and Cosmos admin checks both pass and disappears on revocation',async()=>{
 let gm=false,admin=false;const calls=[],OBR={contextMenu:{create:async item=>calls.push('create:'+item.id),remove:async id=>calls.push('remove:'+id)}},update=adminMenu(OBR,()=>gm&&admin,{id:'battle'});
 await update();gm=true;await update();assert.deepEqual(calls,[]);admin=true;await update();await update();assert.deepEqual(calls,['create:battle']);admin=false;await update();assert.deepEqual(calls,['create:battle','remove:battle']);
 admin=true;const pending=update();gm=false;await pending;assert.equal(calls.length,2);
});
