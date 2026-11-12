import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {createCombatActions} from '../backend/characters/combat-actions.mjs';

const roomId='room_1';
function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec(`CREATE TABLE characters(id TEXT PRIMARY KEY,name TEXT,kind TEXT,archived INTEGER,owner_id TEXT,revision INTEGER,updated_at TEXT);
 CREATE TABLE character_details(character_id TEXT PRIMARY KEY,data_json TEXT);
 CREATE TABLE sheet_rolls(id TEXT PRIMARY KEY,user_id TEXT,character_id TEXT,result_json TEXT,label TEXT);`);
 const source=randomUUID(),target=randomUUID();
 for(const [id,name,owner,data] of [
  [source,'White Mage','player1',{hp_curr:30,hp_max:30,ac_total:14,owlbearStatusVisible:true}],
  [target,'Fighter','player2',{hp_curr:20,hp_max:30,hp_temp:3,ac_total:15,touch_ac_total:11,cmd_total:20,owlbearStatusVisible:true}]
 ]){
  db.prepare('INSERT INTO characters VALUES(?,?,?,?,?,?,?)').run(id,name,'player',0,owner,1,'today');
  db.prepare('INSERT INTO character_details VALUES(?,?)').run(id,JSON.stringify(data));
 }
 const actions=createCombatActions(db);
 const insert=(roll,label='Longsword')=>{
  const id=randomUUID();db.prepare('INSERT INTO sheet_rolls VALUES(?,?,?,?,?)').run(id,'player1',source,JSON.stringify(roll),label);return id;
 };
 const request=(requestId,rest={})=>({
  requestId,actorSheetId:source,actorTokenId:'caster-token',targetTokenId:'fighter-token',
  targetSheetId:target,targetName:'Fighter',targetAc:15,defense:'ac',round:2,...rest
 });
 const stats=()=>JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(target).data_json);
 return {db,actions,source,target,insert,request,stats};
}

test('player damage from a recorded roll updates another owner’s HP exactly once and writes history',()=>{
 const f=fixture(),roll=f.insert({kind:'weapon',rolls:[14],total:21,attackType:'melee',damage:{total:8}});
 const first=f.actions.apply(roomId,'player1',false,f.request(roll));
 assert.equal(first.event.applied,8);assert.equal(first.event.before.hp,20);
 assert.deepEqual([f.stats().hp_curr,f.stats().hp_temp],[15,0]);
 const retry=f.actions.apply(roomId,'player1',false,f.request(roll));
 assert.equal(retry.alreadyApplied,true);assert.equal(f.stats().hp_curr,15);
 assert.equal(f.actions.history(roomId,false).length,1);
 f.db.close();
});

test('healing is capped and temporary HP does not stack automatically',()=>{
 const f=fixture();
 const heal=f.insert({kind:'ability',effectType:'heal',damage:{total:50}},'Cure');
 f.actions.apply(roomId,'player1',false,f.request(heal));
 assert.equal(f.stats().hp_curr,30);
 const temp=f.insert({kind:'ability',effectType:'temp_hp',damage:{total:7}},'Stoneskin');
 f.actions.apply(roomId,'player1',false,f.request(temp));
 assert.equal(f.stats().hp_temp,7);
 const repeat=f.insert({kind:'ability',effectType:'temp_hp',damage:{total:4}},'Stoneskin');
 f.actions.apply(roomId,'player1',false,f.request(repeat));
 assert.equal(f.stats().hp_temp,7);
 f.db.close();
});

test('weapon and ability validation are independent and GM approval is required when enabled',()=>{
 const f=fixture();
 assert.deepEqual(f.actions.getSettings(roomId),{weapon:false,ability:false});
 assert.throws(()=>f.actions.settings(roomId,false,{weapon:true,ability:true}),/GM/);
 f.actions.settings(roomId,true,{weapon:true,ability:false});
 const weapon=f.insert({kind:'weapon',rolls:[14],total:21,damage:{total:8}});
 assert.throws(()=>f.actions.apply(roomId,'player1',false,f.request(weapon)),/GM validation/);
 assert.equal(f.actions.apply(roomId,'admin',true,f.request(weapon)).event.applied,8);
 const ability=f.insert({kind:'ability',effectType:'heal',damage:{total:5}},'Cure');
 assert.equal(f.actions.apply(roomId,'player1',false,f.request(ability)).event.kind,'heal');
 f.db.close();
});

test('NPC damage receipt awaits token finalization and cannot be applied twice',()=>{
 const f=fixture(),roll=f.insert({kind:'weapon',rolls:[14],total:21,damage:{total:8}});
 const request=f.request(roll,{targetTokenId:'goblin-token',targetSheetId:null,targetName:'Goblin',targetHp:20,targetHpMax:25,targetHpTemp:0,targetAc:15});
 const first=f.actions.apply(roomId,'player1',false,request);
 assert.equal(first.needsNpcUpdate,true);assert.equal(first.event.status,'pending');
 const finalized=f.actions.finalize(roomId,'player1',false,{requestId:roll,before:{hp:20,hpMax:25,hpTemp:0},after:{hp:12,hpMax:25,hpTemp:0}});
 assert.equal(finalized.status,'applied');
 assert.equal(f.actions.apply(roomId,'player1',false,request).alreadyApplied,true);
 assert.equal(f.actions.history(roomId,false)[0].before,undefined,'NPC HP is hidden from non-GMs');
 assert.equal(f.actions.history(roomId,true)[0].after.hp,12);
 f.db.close();
});

test('End Battle preserves previous history and changes the battle sequence',()=>{
 const f=fixture(),roll=f.insert({kind:'weapon',rolls:[14],total:21,damage:{total:8}});
 f.actions.apply(roomId,'player1',false,f.request(roll));
 assert.throws(()=>f.actions.end(roomId,false),/GM/);
 const end=f.actions.end(roomId,true);
 assert.equal(end.kind,'end');
 const events=f.actions.history(roomId,true);
 assert.equal(events.length,2);assert.equal(events[0].kind,'end');
 const newRoll=f.insert({kind:'ability',effectType:'heal',damage:{total:5}});
 assert.equal(f.actions.apply(roomId,'player1',false,f.request(newRoll)).event.battle,2);
 f.db.close();
});
