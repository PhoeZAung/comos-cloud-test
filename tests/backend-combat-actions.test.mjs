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

test('saved NPC defenses reduce non-bypassing weapon damage before token update',()=>{
 const f=fixture(),npcId=randomUUID();
 f.db.prepare('INSERT INTO characters VALUES(?,?,?,?,?,?,?)').run(npcId,'Silver Knight','npc',0,'gm',1,'today');
 f.db.prepare('INSERT INTO character_details VALUES(?,?)').run(npcId,JSON.stringify({
  npcStats:{dr:5,sr:18},npcText:{drBypass:'silver and good'},hp_max:40,hp_curr:40
 }));
 const roll=f.insert({kind:'weapon',rolls:[14],total:22,damage:{total:13},
  resolution:{abilityKind:'weapon',damageTypes:['Slashing'],drBypass:['silver'],srApplies:false}});
 const result=f.actions.apply(roomId,'player1',false,f.request(roll,{
  targetTokenId:'silver-token',targetSheetId:null,targetNpcId:npcId,
  targetAc:18,targetHp:40,targetHpMax:40,targetHpTemp:0
 }));
 assert.equal(result.event.amount,8);
 assert.equal(result.event.mitigation.find(entry=>entry.type==='dr').reduced,5);
 assert.equal(result.event.after.hp,32);
 f.db.close();
});

test('spell-like effects are checked against NPC SR using server-side caster-level die',()=>{
 const f=fixture(),npcId=randomUUID();
 f.db.prepare('INSERT INTO characters VALUES(?,?,?,?,?,?,?)').run(npcId,'Spirit Knight','npc',0,'gm',1,'today');
 f.db.prepare('INSERT INTO character_details VALUES(?,?)').run(npcId,JSON.stringify({
  npcStats:{dr:4,sr:18},npcText:{drBypass:'magic'},hp_max:40,hp_curr:40
 }));
 const actions=createCombatActions(f.db,{rollSr:()=>6}); // 6 + CL 9 + 2 penetration = 17, fails SR 18
 const roll=f.insert({kind:'ability',effectType:'damage',damage:{total:12},
  resolution:{abilityKind:'sp',casterLevel:9,srBonus:2,srApplies:true}});
 const result=actions.apply(roomId,'player1',false,f.request(roll,{
  targetTokenId:'spirit-token',targetSheetId:null,targetNpcId:npcId,targetAc:18,targetHp:40,targetHpMax:40,targetHpTemp:0
 }));
 assert.equal(result.event.reason,'Spell resisted');
 assert.equal(result.event.amount,0);assert.equal(result.event.after.hp,40);
 assert.equal(result.event.mitigation.find(entry=>entry.type==='sr').total,17);
 f.db.close();
});

test('NPC Reflex save halves fire spell damage before energy resistance and persists the die roll',()=>{
 const f=fixture(),npcId=randomUUID();
 f.db.prepare('INSERT INTO characters VALUES(?,?,?,?,?,?,?)').run(npcId,'Fire Warden','npc',0,'gm',1,'today');
 f.db.prepare('INSERT INTO character_details VALUES(?,?)').run(npcId,JSON.stringify({
  npcStats:{ac:14,ref:5,sr:0},npcText:{energyResistances:'fire 3'},hp_max:40,hp_curr:40
 }));
 let count=0;const actions=createCombatActions(f.db,{rollSave:()=>{count++;return 12;}});
 const receipt=f.insert({kind:'spell',dc:17,effectType:'damage',damage:{total:21,breakdown:[{type:'fire',total:21}]},
  resolution:{abilityKind:'spell',srApplies:false,saveType:'ref',saveSuccess:'half',damageTypes:['Fire']}},'Fireball');
 const args=f.request(receipt,{targetTokenId:'warden-token',targetSheetId:null,targetNpcId:npcId,
  targetAc:14,targetHp:40,targetHpMax:40,targetHpTemp:0});
 const first=actions.apply(roomId,'player1',false,args);
 assert.equal(first.event.amount,7);
 assert.equal(first.event.after.hp,33);
 assert.equal(first.event.mitigation.find(x=>x.type==='save').total,17);
 assert.equal(count,1);
 const retried=actions.apply(roomId,'player1',false,args);
 assert.equal(retried.alreadyApplied,true);assert.equal(count,1,'never re-roll the save on retry');
 f.db.close();
});

test('NPC Fortitude successful save uses Slay Living alternative damage from recorded roll',()=>{
 const f=fixture(),npcId=randomUUID();
 f.db.prepare('INSERT INTO characters VALUES(?,?,?,?,?,?,?)').run(npcId,'Living Guard','npc',0,'gm',1,'today');
 f.db.prepare('INSERT INTO character_details VALUES(?,?)').run(npcId,JSON.stringify({
  npcStats:{touch:12,fort:8,sr:0},hp_max:70,hp_curr:70
 }));
 const actions=createCombatActions(f.db,{rollSave:()=>12});
 const id=f.insert({kind:'spell',dc:19,effectType:'damage',
  attack:{rolls:[13],total:22},damage:{total:51},saveSuccessDamage:{total:16},
  resolution:{abilityKind:'spell',srApplies:false,saveType:'fort',saveSuccess:'alternate'}},'Slay Living');
 const result=actions.apply(roomId,'player1',false,f.request(id,{
  targetTokenId:'guard-token',targetSheetId:null,targetNpcId:npcId,targetAc:12,
  defense:'touch',targetHp:70,targetHpMax:70,targetHpTemp:0
 }));
 assert.equal(result.event.amount,16);
 assert.equal(result.event.after.hp,54);
 assert.equal(result.event.reason,'Save: alternate damage');
 f.db.close();
});

test('ambiguous save text and missing NPC save bonus never auto-apply HP',()=>{
 const f=fixture(),npcId=randomUUID();
 f.db.prepare('INSERT INTO characters VALUES(?,?,?,?,?,?,?)').run(npcId,'Forgotten Warden','npc',0,'gm',1,'today');
 f.db.prepare('INSERT INTO character_details VALUES(?,?)').run(npcId,JSON.stringify({
  npcStats:{ac:15},hp_max:20,hp_curr:20
 }));
 const actions=createCombatActions(f.db,{rollSave:()=>12});
 const original=f.request(null,{targetTokenId:'warden-token',targetSheetId:null,targetNpcId:npcId,
  targetHp:20,targetHpMax:20,targetAc:15,targetHpTemp:0});
 const legacy=f.insert({kind:'spell',dc:15,effectType:'damage',damage:{total:10},
  resolution:{abilityKind:'spell',srApplies:false,saveType:'none',saveDescription:'Will partial'}});
 assert.throws(()=>actions.apply(roomId,'player1',false,{...original,requestId:legacy}),/Set Save type/);
 const missing=f.insert({kind:'ability',dc:15,effectType:'damage',damage:{total:10},
  resolution:{abilityKind:'sp',srApplies:false,saveType:'fort',saveSuccess:'negates'}});
 assert.throws(()=>actions.apply(roomId,'player1',false,{...original,requestId:missing}),/save bonus is missing/);
 assert.equal(actions.history(roomId,true).length,0);
 f.db.close();
});
