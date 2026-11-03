import OBR from '@owlbear-rodeo/sdk';
import {connection as connectGrant} from './connection.mjs';
import {KEY,PORTRAITS,REQUEST,UI,stateFrom} from './party-state.mjs';
const status=document.querySelector('[data-status]'),connect=document.querySelector('[data-connect-party]'),toggle=document.querySelector('[data-show-party]');
let popup,nonce,connection,timer,generation=0,ownId,gm=false,publishing=false,polling=false,refresh=false,room={},lastSignature='',lastPublished=0,statusExpiry;
const portraits=new Map(),requests=new Map(),commits=new Map();
async function thumbnail(source){if(!source)return '';const image=new Image();image.src=source;await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const side=Math.min(image.naturalWidth,image.naturalHeight);canvas.getContext('2d').drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,64,64);return canvas.toDataURL('image/jpeg',.6);}
const message=value=>{status.textContent=value;};
async function poll(run){
 if(!publishing||run!==generation)return;if(polling){refresh=true;return;}polling=true;
 try{
  if(!gm||!connection)throw Error('Reconnect Cosmos.');
  const {characters}=await connection.call('party-status');if(run!==generation)return;
  if(lastPublished&&room[KEY]?.publisher&&room[KEY].publisher!==ownId){publishing=false;message('Another GM is connected.');return;}
  const signature=JSON.stringify(characters);
  if(signature!==lastSignature||Date.now()-lastPublished>15000){
   const next={publisher:ownId,updatedAt:Date.now(),characters};
   if(new TextEncoder().encode(JSON.stringify({...room,[KEY]:next})).byteLength>15000)throw Error('Too many shared characters for this room.');
   await OBR.room.setMetadata({[KEY]:next});if(run!==generation)return;lastSignature=signature;lastPublished=Date.now();
  }
  connect.hidden=true;message('Connected');
  const active=new Set(characters.map(c=>c.id));for(const id of portraits.keys())if(!active.has(id))portraits.delete(id);
  const changed=characters.filter(c=>c.portraitHash&&portraits.get(c.id)?.hash!==c.portraitHash);
  // Decode a few thumbnails at a time; publish values before waiting on images.
  for(let i=0;i<changed.length;i+=3)await Promise.all(changed.slice(i,i+3).map(async row=>{
   try{const result=await connection.call('party-portrait',{id:row.id}),portrait=await thumbnail(result.portrait);if(run!==generation||portrait.length>12000)return;const item={id:row.id,hash:row.portraitHash,portrait};portraits.set(row.id,item);await OBR.broadcast.sendMessage(PORTRAITS,item,{destination:'ALL'});}catch{if(run===generation)portraits.set(row.id,{id:row.id,hash:row.portraitHash,portrait:''});}
  }));
 }catch(error){if(run===generation){message(error.message);connect.hidden=!gm;}}
 finally{polling=false;if(publishing){timer=setTimeout(()=>void poll(generation),refresh||run!==generation?0:1000);refresh=false;}}
}
function refreshNow(){clearTimeout(timer);if(polling)refresh=true;else void poll(generation);}
OBR.onReady(async()=>{
 ownId=await OBR.player.getConnectionId();gm=await OBR.player.getRole()==='GM';room=await OBR.room.getMetadata();connect.hidden=!gm;toggle.hidden=false;
 const update=value=>{room=value;message(stateFrom(value)?'Connected':gm?'Connect Cosmos':'Waiting for GM');clearTimeout(statusExpiry);if(Number.isFinite(value[KEY]?.updatedAt)&&value[KEY].updatedAt+45100>Date.now())statusExpiry=setTimeout(()=>update(room),Math.max(100,value[KEY].updatedAt+45100-Date.now()));};update(room);OBR.room.onMetadataChange(update);
 OBR.player.onChange(player=>{gm=player.role==='GM';connect.hidden=!gm||Boolean(connection);if(!gm){generation++;publishing=false;clearTimeout(timer);}});
 await OBR.action.setIcon(new URL('/owlbear/party-action.svg',location.origin).href).catch(()=>{});
 OBR.broadcast.onMessage(UI+'/layout',event=>{if(event.connectionId===ownId)toggle.setAttribute('aria-pressed',String(event.data?.show!==false));});
 await OBR.broadcast.sendMessage(UI,{layoutRequest:true},{destination:'LOCAL'});
 OBR.broadcast.onMessage(REQUEST,({data,connectionId})=>{
  if(!publishing||!Array.isArray(data?.ids)||Date.now()-(requests.get(connectionId)||0)<800)return;requests.set(connectionId,Date.now());
  for(const id of data.ids.slice(0,40)){const item=portraits.get(id);if(item)void OBR.broadcast.sendMessage(PORTRAITS,item,{destination:'ALL'}).catch(()=>{});}
 });
 let edits=Promise.resolve();
 OBR.broadcast.onMessage(UI+'/sheet-stats',event=>{
  if(event.connectionId!==ownId)return;const value=event.data;
  edits=edits.then(async()=>{
   try{
    if(!gm||!connection)throw Error('Connect Cosmos first.');
    const last=commits.get(value.id),revision=last&&value.revision===last.from?last.to:value.revision;
    const result=await connection.call('party-stats',{id:value.id,revision,stats:value.stats});
    commits.set(value.id,{from:last&&value.revision===last.from?last.from:value.revision,to:result.revision});
    await OBR.broadcast.sendMessage(UI+'/edit-result',{requestId:value.requestId,id:value.id,revision:result.revision},{destination:'LOCAL'});refreshNow();
   }catch(error){await OBR.broadcast.sendMessage(UI+'/edit-result',{requestId:value.requestId,id:value.id,error:error.message},{destination:'LOCAL'});}
  });
 });
});
connect.onclick=()=>{
 if(!ownId||!gm)return;generation++;publishing=false;clearTimeout(timer);connection?.close();commits.clear();lastSignature='';lastPublished=0;
 nonce=[...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');
 popup=window.open(new URL('/owlbear/connect.html?mode=party-status#'+nonce,location.origin).href,'cosmos-party-connect-'+nonce,'width=520,height=520');message(popup?'Connecting…':'Allow the Cosmos popup.');
};
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==popup||event.data?.type!=='cosmos:connected'||event.data.nonce!==nonce||!/^[a-f0-9]{64}$/.test(event.data.token||''))return;
 generation++;connection=connectGrant(event.data.token);popup.postMessage({type:'cosmos:connected-ack',nonce},location.origin);publishing=true;clearTimeout(timer);void poll(generation);
});
toggle.onclick=()=>void OBR.broadcast.sendMessage(UI,{toggle:'party'},{destination:'LOCAL'});
window.addEventListener('pagehide',()=>{generation++;publishing=false;clearTimeout(timer);clearTimeout(statusExpiry);connection?.close();},{once:true});
