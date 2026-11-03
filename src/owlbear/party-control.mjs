import OBR from '@owlbear-rodeo/sdk';
import {trackerConfig} from './tracker.mjs';
import {connection as connectGrant} from './connection.mjs';
import {KEY,PORTRAITS,REQUEST,UI,esc,stateFrom} from './party-state.mjs';
const status=document.querySelector('[data-status]'),connect=document.querySelector('[data-connect-party]');
let available=false,popup,nonce,connection,timer,generation=0,publishing=false,ownId,lastSignature='',lastPublished=0;
const portraits=new Map();
const say=message=>{status.textContent=message;connect.hidden=message==='Connected';};
async function clear(){const metadata=await OBR.room.getMetadata();if(metadata[KEY]?.publisher===ownId)await OBR.room.setMetadata({[KEY]:null});}
async function thumbnail(source){
 if(!source)return '';const image=new Image();image.src=source;await image.decode();
 const canvas=document.createElement('canvas');canvas.width=canvas.height=80;const ctx=canvas.getContext('2d'),side=Math.min(image.naturalWidth,image.naturalHeight);
 ctx.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,80,80);
 return canvas.toDataURL('image/jpeg',.65);
}
async function tick(run){
 if(!publishing||run!==generation)return;
 try{
  if(!connection)throw Error('Reconnect Cosmos.');
  if(await OBR.player.getRole()!=='GM')throw Error('Only the Owlbear GM can share party status.');
  const result=await connection.call('party-status'),characters=result.characters;
  if(run!==generation)return;
  const signature=JSON.stringify(characters),metadata=await OBR.room.getMetadata();
  // A second GM may explicitly take over the live connection.
  if(lastPublished&&metadata[KEY]?.publisher&&metadata[KEY].publisher!==ownId){publishing=false;clearTimeout(timer);say('Another GM is now sharing party status.');return;}
  if(signature!==lastSignature||Date.now()-lastPublished>=4000){
   const next={publisher:ownId,updatedAt:Date.now(),characters};
   if(new TextEncoder().encode(JSON.stringify({...metadata,[KEY]:next})).byteLength>15000)throw Error('Party status exceeds this room’s available space. Hide some characters in Cosmos Admin.');
   if(run!==generation)return;await OBR.room.setMetadata({[KEY]:next});lastSignature=signature;lastPublished=Date.now();
  }

  say('Connected');
  const active=new Set(characters.map(c=>c.id));for(const id of portraits.keys())if(!active.has(id))portraits.delete(id);
  for(const row of characters){
   if(run!==generation)return;if(!row.portraitHash){portraits.delete(row.id);continue;}
   if(portraits.get(row.id)?.hash===row.portraitHash)continue;
   const result=await connection.call('party-portrait',{id:row.id});
   let portrait='';try{portrait=await thumbnail(result.portrait);}catch{}if(run!==generation)return;
   if(portrait.length>12000)portrait='';
   const message={id:row.id,hash:row.portraitHash,portrait};portraits.set(row.id,message);
   await OBR.broadcast.sendMessage(PORTRAITS,message,{destination:'ALL'});
  }
 }catch(error){if(run===generation){say(error.message);await clear().catch(()=>{});lastPublished=0;lastSignature='';}}
 finally{if(publishing&&run===generation)timer=setTimeout(()=>void tick(run),2000);}
}
OBR.onReady(async()=>{
 available=true;ownId=await OBR.player.getConnectionId();
 await OBR.action.setIcon(new URL('/owlbear/party-action.svg',location.origin).href);
 const gm=await OBR.player.getRole()==='GM';connect.hidden=!gm;document.querySelector('.party-actions').hidden=!gm;
 const update=value=>{status.textContent=stateFrom(value)?'Connected':'Disconnected';for(const button of document.querySelectorAll('[data-mode]'))button.setAttribute('aria-pressed',String(trackerConfig(value).views[button.dataset.mode]===true));};update(await OBR.room.getMetadata());OBR.room.onMetadataChange(update);
 OBR.broadcast.onMessage(REQUEST,({data})=>{if(!publishing||!Array.isArray(data?.ids))return;for(const id of data.ids.slice(0,40)){const portrait=portraits.get(id);if(portrait)void OBR.broadcast.sendMessage(PORTRAITS,portrait,{destination:'ALL'}).catch(()=>{});}});
 let statEdits=Promise.resolve();
 OBR.broadcast.onMessage(UI+'/sheet-stats',event=>{
  if(event.connectionId!==ownId)return;
  statEdits=statEdits.then(async()=>{if(await OBR.player.getRole()!=='GM'||!connection)throw Error('Connect the Cosmos administrator account first.');await connection.call('party-stats',event.data);}).catch(error=>OBR.notification.show(error.message,'ERROR'));
 });
});
connect.onclick=()=>{
 if(!available)return;generation++;publishing=false;clearTimeout(timer);lastPublished=0;lastSignature='';connection?.close();portraits.clear();
 nonce=[...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');
 popup=window.open(new URL('/owlbear/connect.html?mode=party-status#'+nonce,location.origin).href,'cosmos-party-connect-'+crypto.randomUUID(),'width=520,height=520');
 say(popup?'Connect your Cosmos administrator account in the connection window.':'Allow the Cosmos connection popup and try again.');
};
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==popup||event.data?.type!=='cosmos:connected'||event.data.nonce!==nonce)return;
 if(!/^[a-f0-9]{64}$/.test(event.data.token||''))return;generation++;clearTimeout(timer);connection?.close();connection=connectGrant(event.data.token);popup.postMessage({type:'cosmos:connected-ack',nonce},location.origin);publishing=true;lastPublished=0;lastSignature='';void tick(generation);
});
for(const button of document.querySelectorAll('[data-mode]'))button.onclick=()=>{if(available)void OBR.broadcast.sendMessage(UI,{toggle:button.dataset.mode},{destination:'LOCAL'});};
window.addEventListener('pagehide',()=>{generation++;publishing=false;clearTimeout(timer);connection?.close();},{once:true});
