import {normalizePublicReceipt,mergeRollHistory,receiptChunks} from '../features/room-rolls.mjs';
const CHANNEL='com.cosmos.character-sheets/history-v1';
// Public receipts only. Grants and private account history never enter this bus.
export async function roomHistory(OBR,onChange,{storage}={}){
 if(!storage)try{storage=globalThis.localStorage;}catch{storage={getItem:()=>null,setItem(){}};}
 const [id,connectionId,name,initial]=await Promise.all([OBR.player.getId(),OBR.player.getConnectionId(),OBR.player.getName(),OBR.party.getPlayers()]),key='cosmos.room-rolls.v1.'+OBR.room.id;
 let rows=[],players=initial,closed=false;const timers=new Set();
 try{rows=mergeRollHistory([],JSON.parse(storage.getItem(key)||'[]').map(normalizePublicReceipt).filter(Boolean));}catch{}
 const emit=(remote,row)=>{if(closed)return;try{storage.setItem(key,JSON.stringify(rows));}catch{}onChange(rows,{remote,row});};
 const send=message=>OBR.broadcast.sendMessage(CHANNEL,message,{destination:'ALL'});
 function add(values,remote=false){const accepted=values.map(normalizePublicReceipt).filter(Boolean),fresh=accepted.filter(value=>!rows.some(row=>row.id===value.id));if(!fresh.length)return;rows=mergeRollHistory([], [...rows,...accepted]);emit(remote,fresh[0]);}
 const sync=()=>{if(!closed)void send({type:'request',to:connectionId}).catch(()=>{});};
 const off=OBR.broadcast.onMessage(CHANNEL,event=>{
  if(closed||event.connectionId===connectionId)return;const sender=players.find(player=>player.connectionId===event.connectionId);if(!sender)return;const data=event.data;
  if(data?.type==='receipt'){const row=normalizePublicReceipt(data.row);if(row&&row.playerId===sender.id)add([{...row,player:sender.name}],true);}
  else if(data?.type==='request'&&data.to===event.connectionId){for(const batch of receiptChunks(rows))void send({type:'sync',to:event.connectionId,rows:batch}).catch(()=>{});}
  else if(data?.type==='sync'&&data.to===connectionId&&Array.isArray(data.rows)&&data.rows.length<=100)add(data.rows);
 });
 const connections=value=>value.map(player=>player.connectionId).sort().join(',');
 const offParty=OBR.party.onChange(value=>{const changed=connections(players)!==connections(value);players=value;if(changed)sync();}),timer=setInterval(sync,30000);emit(false);sync();
 return {rows:()=>rows,async publish(entry,target){if(closed||target!=='everyone')return;const row=normalizePublicReceipt({...entry,playerId:id,player:name,audience:'everyone'});if(!row)return;add([row]);try{await send({type:'receipt',row});}catch{const retry=setTimeout(()=>{timers.delete(retry);if(!closed)void send({type:'receipt',row}).catch(()=>{});},1000);timers.add(retry);}},close(){closed=true;off();offParty();clearInterval(timer);for(const pending of timers)clearTimeout(pending);}};
}
