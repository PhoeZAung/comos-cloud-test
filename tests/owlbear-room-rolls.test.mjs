import test from 'node:test';import assert from 'node:assert/strict';
import {publicReceipt,normalizePublicReceipt,mergeRollHistory,receiptChunks} from '../src/features/room-rolls.mjs';
import {roomHistory} from '../src/owlbear/room-history.mjs';
import {dicePlus} from '../src/owlbear/dice-plus.mjs';
import {panelBounds} from '../src/owlbear/panel-size.mjs';
const entry=n=>({id:'roll-'+n,character:'Astra',label:'Attack',time:n,parts:[{label:'Roll',total:17,expression:'1d20',faces:[17]}]});
test('public history contains bounded receipts, merges duplicate saved rolls and omits descriptions',()=>{
 assert.equal(publicReceipt({roll:{descriptionOnly:true}}),null);
 const row=publicReceipt({id:'roll-1',character:'Astra',label:'Attack',time:1,roll:{total:22,expression:'1d20+5',rolls:[17],description:'Private details'}});assert.equal(row.parts[0].total,22);assert.equal(JSON.stringify(row).includes('Private details'),false);
 assert.equal(normalizePublicReceipt({...row,audience:'self',playerId:'a'}),null);
 const safe=normalizePublicReceipt({...row,audience:'everyone',playerId:'a',player:'Alice',token:'secret'});assert.equal(safe.token,undefined);
 const merged=mergeRollHistory([{...row,time:2}], [safe, {...entry(3),player:'Bob'}]);assert.deepEqual(merged.map(r=>r.id),['roll-3','roll-1']);assert.equal(merged[1].player,'Alice');
 assert.equal(mergeRollHistory([],Array.from({length:110},(_,i)=>entry(i))).length,100);
 const chunks=receiptChunks(Array.from({length:100},(_,i)=>({...entry(i),label:'星'.repeat(100)})));assert.ok(chunks.length>1);for(const chunk of chunks)assert.ok(new TextEncoder().encode(JSON.stringify(chunk)).length<=10000);
});
function network(){
 const listeners=new Map(),partyListeners=new Map(),players=[{id:'a',connectionId:'ca',name:'Alice',role:'PLAYER'},{id:'b',connectionId:'cb',name:'Bob',role:'PLAYER'}],sent=[];
 const client=(id,store=new Map())=>{const me=players.find(p=>p.id===id),handlers=new Map();listeners.set(me.connectionId,handlers);return {storage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)},OBR:{room:{id:'room'},player:{getId:async()=>id,getConnectionId:async()=>me.connectionId,getName:async()=>me.name},party:{getPlayers:async()=>players,onChange:callback=>{partyListeners.set(id,callback);return ()=>partyListeners.delete(id);}},broadcast:{onMessage:(channel,callback)=>{handlers.set(channel,callback);return ()=>handlers.delete(channel);},sendMessage:async(channel,data,options)=>{sent.push({from:me.connectionId,data,options});for(const receiver of listeners.values())receiver.get(channel)?.({data,connectionId:me.connectionId});}}}};};
 return {client,sent};
}
test('two players receive public history with the panel closed, and later arrivals recover it',async()=>{
 const net=network(),a=net.client('a'),b=net.client('b'),events=[];
 const ha=await roomHistory(a.OBR,()=>{},{storage:a.storage});
 try{await ha.publish(entry(1),'everyone');const hb=await roomHistory(b.OBR,(rows,change)=>events.push({rows,change}),{storage:b.storage});try{assert.equal(hb.rows().length,1);assert.equal(hb.rows()[0].player,'Alice');await ha.publish(entry(2),'everyone');assert.equal(hb.rows().length,2);assert.equal(events.filter(e=>e.change.remote).length,1);await ha.publish(entry(2),'everyone');assert.equal(hb.rows().length,2);assert.equal(events.filter(e=>e.change.remote).length,1);}finally{hb.close();}}finally{ha.close();}
});
test('private and GM rolls never enter public broadcasts, caches or sync responses',async()=>{
 const net=network(),a=net.client('a'),history=await roomHistory(a.OBR,()=>{},{storage:a.storage});
 try{for(const target of ['self','dm','gm_only',undefined])await history.publish(entry(99),target);assert.equal(history.rows().length,0);assert.ok(!JSON.stringify(net.sent).includes('roll-99'));}finally{history.close();}
});
test('Dice+ public request reaches the room; matching remote replies settle once without another roll',async()=>{
 const handlers=new Map(),sent=[];const OBR={player:{getConnectionId:async()=> 'local',getId:async()=> 'a',getName:async()=> 'Alice'},broadcast:{onMessage:(channel,callback)=>{handlers.set(channel,callback);return ()=>handlers.delete(channel);},sendMessage:async(channel,data,options)=>{
  sent.push({channel,data,options});if(channel==='dice-plus/validate-notation')handlers.get(channel)?.({connectionId:'local',data:{requestId:data.requestId,valid:true}});
  if(channel==='dice-plus/roll-request'){const reply={rollId:data.rollId,playerId:'a',result:{diceNotation:data.diceNotation,groups:[{diceType:'d20',dice:[{value:17}]}]}};handlers.get('com.cosmos.character-sheets/roll-result')?.({connectionId:'gm',data:{...reply,rollId:'unrelated'}});handlers.get('com.cosmos.character-sheets/roll-result')?.({connectionId:'gm',data:reply});handlers.get('com.cosmos.character-sheets/roll-result')?.({connectionId:'local',data:reply});}
 }}};
 const result=await dicePlus(OBR).roll('1d20+5','everyone');assert.equal(result.groups[0].dice[0].value,17);const requests=sent.filter(s=>s.channel==='dice-plus/roll-request');assert.equal(requests.length,1);assert.equal(requests[0].options.destination,'ALL');assert.equal(requests[0].data.rollTarget,'everyone');assert.equal(handlers.size,0);
});
test('panel dimensions fit resized and small viewports rather than forcing desktop minimums',()=>{
 assert.deepEqual(panelBounds({width:1000,height:1200},{width:800,height:600}),{width:776,height:576});assert.deepEqual(panelBounds({width:200,height:200},{width:260,height:300}),{width:236,height:276});
});
