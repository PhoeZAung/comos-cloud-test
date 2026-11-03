import OBR from '@owlbear-rodeo/sdk';
import {connection as connectGrant} from './connection.mjs';
import {UI} from './party-state.mjs';
const status=document.querySelector('[data-status]'),connect=document.querySelector('[data-connect-party]'),toggle=document.querySelector('[data-show-party]');
let popup,nonce,connection,ownId,gm=false;const commits=new Map();
OBR.onReady(async()=>{
 ownId=await OBR.player.getConnectionId();gm=await OBR.player.getRole()==='GM';connect.hidden=!gm;toggle.hidden=false;
 OBR.player.onChange(player=>{gm=player.role==='GM';connect.hidden=!gm||Boolean(connection);});
 await OBR.action.setIcon(new URL('/owlbear/party-action.svg',location.origin).href).catch(()=>{});
 OBR.broadcast.onMessage(UI+'/layout',event=>{if(event.connectionId===ownId)toggle.setAttribute('aria-pressed',String(event.data?.show!==false));});
 OBR.broadcast.onMessage(UI+'/public-state',event=>{if(event.connectionId===ownId)status.textContent=event.data?.status||'Connecting…';});
 await OBR.broadcast.sendMessage(UI,{layoutRequest:true},{destination:'LOCAL'});await OBR.broadcast.sendMessage(UI,{stateRequest:true},{destination:'LOCAL'});
 let edits=Promise.resolve();
 OBR.broadcast.onMessage(UI+'/sheet-stats',event=>{
  if(event.connectionId!==ownId)return;const value=event.data;
  edits=edits.then(async()=>{
   try{
    if(!gm||!connection){void OBR.action.open();throw Error('Connect Cosmos to edit HP / MP.');}
    const last=commits.get(value.id),revision=last&&value.revision===last.from?last.to:value.revision;
    const result=await connection.call('party-stats',{id:value.id,revision,stats:value.stats});
    commits.set(value.id,{from:last&&value.revision===last.from?last.from:value.revision,to:result.revision});
    await OBR.broadcast.sendMessage(UI+'/edit-result',{requestId:value.requestId,id:value.id,revision:result.revision},{destination:'LOCAL'});
   }catch(error){await OBR.broadcast.sendMessage(UI+'/edit-result',{requestId:value.requestId,id:value.id,error:error.message},{destination:'LOCAL'});}
  });
 });
});
connect.onclick=()=>{
 if(!ownId||!gm)return;connection?.close();commits.clear();nonce=[...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');
 popup=window.open(new URL('/owlbear/connect.html?mode=party-status#'+nonce,location.origin).href,'cosmos-party-connect-'+nonce,'width=520,height=520');connect.textContent=popup?'Connecting…':'Allow popup';
};
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==popup||event.data?.type!=='cosmos:connected'||event.data.nonce!==nonce||!/^[a-f0-9]{64}$/.test(event.data.token||''))return;
 connection=connectGrant(event.data.token);popup.postMessage({type:'cosmos:connected-ack',nonce},location.origin);connect.hidden=true;
});
toggle.onclick=()=>void OBR.broadcast.sendMessage(UI,{toggle:'party'},{destination:'LOCAL'});
window.addEventListener('pagehide',()=>connection?.close(),{once:true});
