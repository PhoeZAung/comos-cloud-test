import {randomUUID,randomInt} from 'node:crypto';
import {defenseProfile,resolveDefenses} from '../../src/features/sheet/pathfinder-defenses.mjs';
import {sheetStats} from '../../src/features/sheet/model.mjs';
import {computeCombatEffect,applyCombatHp} from '../../src/owlbear/combat-effects.mjs';

const validId=value=>typeof value==='string'&&/^[\da-f-]{36}$/i.test(value);
const validRoom=value=>typeof value==='string'&&value.length>=1&&value.length<=128&&/^[a-z\d_-]+$/i.test(value);
const check=(condition,message)=>{if(!condition)throw Error(message);};
const safeName=value=>String(value||'').slice(0,80).replace(/[\u0000-\u001f]/g,'');
function init(db){
 db.exec(`CREATE TABLE IF NOT EXISTS cosmos_combat_rooms(
  room_id TEXT PRIMARY KEY, weapon_validation INTEGER NOT NULL DEFAULT 0,
  ability_validation INTEGER NOT NULL DEFAULT 0,battle INTEGER NOT NULL DEFAULT 1
 );
 CREATE TABLE IF NOT EXISTS cosmos_combat_events(
  id TEXT PRIMARY KEY,room_id TEXT NOT NULL,battle INTEGER NOT NULL,
  roll_id TEXT, user_id TEXT, status TEXT NOT NULL,
  event_json TEXT NOT NULL,created_at INTEGER NOT NULL
 );
 CREATE INDEX IF NOT EXISTS idx_cosmos_combat_room_history
  ON cosmos_combat_events(room_id,created_at DESC);`);
}
export function createCombatActions(db,{rollSr=()=>randomInt(1,21)}={}){
 init(db);
 const room=id=>{check(validRoom(id),'Invalid Owlbear room.');db.prepare('INSERT OR IGNORE INTO cosmos_combat_rooms(room_id) VALUES(?)').run(id);return db.prepare('SELECT * FROM cosmos_combat_rooms WHERE room_id=?').get(id);};
 const getSettings=id=>{const r=room(id);return {weapon:r.weapon_validation===1,ability:r.ability_validation===1};};
 function settings(id,userAdmin,values){
  check(userAdmin,'Only the GM administrator may change combat validation.');
  check(values&&typeof values.weapon==='boolean'&&typeof values.ability==='boolean','Invalid combat settings.');
  room(id);db.prepare('UPDATE cosmos_combat_rooms SET weapon_validation=?,ability_validation=? WHERE room_id=?').run(Number(values.weapon),Number(values.ability),id);
  return getSettings(id);
 }
 function history(id,admin){
  room(id);
  return db.prepare('SELECT event_json FROM cosmos_combat_events WHERE room_id=? AND status=? ORDER BY created_at DESC,id DESC LIMIT 120').all(id,'applied').map(row=>{
   const event=JSON.parse(row.event_json);
   if(!admin&&event.gmOnly)return null;
   if(!admin&&event.targetNpc){delete event.before;delete event.after;}
   return event;
  }).filter(Boolean);
 }
 function effectRow(id){const result=db.prepare('SELECT * FROM cosmos_combat_events WHERE id=?').get(id);return result?{...JSON.parse(result.event_json),status:result.status}:null;}
 function apply(id,userId,isAdmin,value){
  check(value&&validId(value.requestId)&&typeof value.actorTokenId==='string'&&typeof value.targetTokenId==='string'&&
   value.actorTokenId.length<=128&&value.targetTokenId.length<=128&&value.actorTokenId!==value.targetTokenId,'Invalid combat target.');
  const r=room(id),receipt=db.prepare('SELECT id,user_id,character_id,result_json,label FROM sheet_rolls WHERE id=?').get(value.requestId);
  check(receipt,'The combat roll is not recorded.');
  check(isAdmin||receipt.user_id===userId,'This is not your combat roll.');
  check(value.actorSheetId===receipt.character_id,'The acting sheet does not match this roll.');
  const roll=JSON.parse(receipt.result_json);
  check(['weapon','ability','spell'].includes(roll.kind),'This receipt is not a targeted action.');
  const needsApproval=roll.kind==='weapon'?r.weapon_validation===1:r.ability_validation===1;
  check(!needsApproval||isAdmin,'Waiting for GM validation of this combat action.');
  const targetNpc=value.targetSheetId===null||value.targetSheetId===undefined;
  check(targetNpc||validId(value.targetSheetId),'Choose a linked party target.');
  check(!targetNpc||roll.kind==='weapon'||roll.effectType==='damage','Healing and temporary HP require a linked party target.');
  check(Number.isInteger(value.round)&&value.round>=1&&value.round<=100000,'Invalid combat round.');
  const source=db.prepare('SELECT id,name,kind,archived FROM characters WHERE id=?').get(receipt.character_id);
  check(source&&!source.archived,'Acting character is unavailable.');
  let target=null,targetData=null,targetStats=null;
  if(!targetNpc){
   target=db.prepare('SELECT c.id,c.name,c.kind,c.archived,d.data_json FROM characters c JOIN character_details d ON d.character_id=c.id WHERE c.id=?').get(value.targetSheetId);
   check(target&&!target.archived&&target.kind==='player','Target character is unavailable.');
   targetData=JSON.parse(target.data_json);check(targetData.owlbearStatusVisible===true,'Target must be shared with the battle tracker.');
   targetStats=sheetStats(targetData);
  }
  let ac=targetNpc?value.targetAc:null,defense=value.defense;
  check(['ac','touch','cmd'].includes(defense),'Invalid target defense.');
  if(!targetNpc)ac=targetStats[defense];
  let profile={dr:0,drBypass:'',sr:0,energyResistances:'',immunities:'',vulnerabilities:''};
  if(targetNpc&&validId(value.targetNpcId)){
   const saved=db.prepare('SELECT c.kind,c.archived,d.data_json FROM characters c JOIN character_details d ON d.character_id=c.id WHERE c.id=?').get(value.targetNpcId);
   if(!saved||saved.kind!=='npc'||saved.archived)throw Error('The linked NPC defense record is unavailable.');
   const npcData=JSON.parse(saved.data_json);
   profile=defenseProfile(npcData,{npc:true});
   const npcDefense=npcData.npcStats?.[defense];
   if(Number.isFinite(npcDefense))ac=npcDefense;
  }else if(!targetNpc)profile=defenseProfile(targetData);
  check(Number.isFinite(ac)&&ac>=0&&ac<=100000,'Target armor class is unavailable.');
  const initial=computeCombatEffect(roll,{defense,ac});
  const srRelevant=initial.hit&&['spell','sp'].includes(roll.resolution?.abilityKind)&&
    roll.resolution?.srApplies!==false&&profile.sr>0;
  const result=resolveDefenses(roll,initial,profile,{srRoll:srRelevant?rollSr():null});
  if(result.kind==='heal'||result.kind==='temp_hp')check(!targetNpc,'Healing requires a party character.');
  const beforeNpc=Number(value.targetHp),maxNpc=Number(value.targetHpMax),tempNpc=Number(value.targetHpTemp||0);
  if(targetNpc)check([beforeNpc,maxNpc,tempNpc].every(Number.isFinite)&&maxNpc>=0&&Math.abs(beforeNpc)<=1000000&&maxNpc<=1000000&&tempNpc>=0&&tempNpc<=1000000,'NPC health is unavailable.');
  const sourceName=safeName(source.name),targetName=safeName(target?.name||value.targetName);
  const base={id:value.requestId,roomId:id,battle:r.battle,round:value.round,actorId:receipt.character_id,actorTokenId:value.actorTokenId,actor:sourceName,
   targetTokenId:value.targetTokenId,targetId:target?.id||null,target:targetName,targetNpc,
   kind:result.kind,source:roll.kind,action:safeName(receipt.label),gmOnly:value.gmOnly===true,
   roll:Math.max(0,Number(roll.damage?.total)||0),
   amount:result.amount,critical:result.critical,hit:result.hit,reason:result.reason,
   mitigation:result.mitigation||[],
   defense,ac:targetNpc?null:ac,time:Date.now()};
  db.exec('BEGIN IMMEDIATE');
  try{
   const existing=effectRow(value.requestId);
   if(existing){
    check(existing.roomId===id&&existing.targetTokenId===value.targetTokenId&&existing.actorId===receipt.character_id,'Roll was already applied to a different target.');
    db.exec('COMMIT');return {event:existing,alreadyApplied:true,needsNpcUpdate:existing.status==='pending'};
   }
   let diff;
   if(targetNpc)diff=applyCombatHp({hp:beforeNpc,hpMax:maxNpc,hpTemp:tempNpc},result);
   else diff=applyCombatHp({hp:targetStats.hp,hpMax:targetStats.hpMax,hpTemp:targetStats.hpTemp},result);
   const event={...base,before:diff.before,after:diff.after,applied:diff.applied,status:targetNpc?'pending':'applied'};
   if(!targetNpc){
    targetData.hp_curr=diff.after.hp;targetData.hp_temp=diff.after.hpTemp;
    db.prepare('UPDATE character_details SET data_json=? WHERE character_id=?').run(JSON.stringify(targetData),target.id);
    db.prepare('UPDATE characters SET revision=revision+1,updated_at=? WHERE id=?').run(new Date().toISOString(),target.id);
   }
   db.prepare('INSERT INTO cosmos_combat_events(id,room_id,battle,roll_id,user_id,status,event_json,created_at) VALUES(?,?,?,?,?,?,?,?)')
    .run(value.requestId,id,r.battle,value.requestId,receipt.user_id,event.status,JSON.stringify(event),event.time);
   db.exec('COMMIT');return {event,alreadyApplied:false,needsNpcUpdate:targetNpc};
  }catch(error){db.exec('ROLLBACK');throw error;}
 }
 function finalize(id,userId,isAdmin,value){
  check(value&&validId(value.requestId),'Invalid combat receipt.');
  const r=room(id),stored=db.prepare('SELECT user_id,status,event_json FROM cosmos_combat_events WHERE id=? AND room_id=?').get(value.requestId,id);
  check(stored,'The combat event is unavailable.');
  check(isAdmin||stored.user_id===userId,'Not your combat action.');
  const event=JSON.parse(stored.event_json);
  check(event.targetNpc,'Only NPC token effects require finalization.');
  if(stored.status==='applied')return event;
  check(stored.status==='pending'&&event.battle===r.battle,'The combat event is no longer pending.');
  const {before,after}=value;
  check(before&&after&&['hp','hpMax','hpTemp'].every(k=>Number.isFinite(before[k])&&Number.isFinite(after[k])),'Invalid NPC HP confirmation.');
  const confirmed={...event,before,after,status:'applied',applied:event.kind==='damage'?(before.hp-after.hp)+(before.hpTemp-after.hpTemp):event.kind==='heal'?after.hp-before.hp:after.hpTemp-before.hpTemp};
  db.prepare('UPDATE cosmos_combat_events SET status=?,event_json=? WHERE id=? AND room_id=?')
   .run('applied',JSON.stringify(confirmed),value.requestId,id);
  return confirmed;
 }
 function end(id,isAdmin){
  check(isAdmin,'Only the GM administrator can end a battle.');
  const r=room(id),event={id:randomUUID(),roomId:id,battle:r.battle,round:0,kind:'end',action:'Battle ended',actor:'GM',target:'',amount:0,applied:0,time:Date.now(),status:'applied'};
  db.exec('BEGIN IMMEDIATE');
  try{
   db.prepare('INSERT INTO cosmos_combat_events(id,room_id,battle,status,event_json,created_at) VALUES(?,?,?,?,?,?)')
    .run(event.id,id,r.battle,'applied',JSON.stringify(event),event.time);
   db.prepare('UPDATE cosmos_combat_rooms SET battle=battle+1 WHERE room_id=?').run(id);
   db.exec('COMMIT');return event;
  }catch(error){db.exec('ROLLBACK');throw error;}
 }
 return {getSettings,settings,history,apply,finalize,end};
}
