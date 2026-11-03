import OBR from '@owlbear-rodeo/sdk';
import {peer} from './rpc.mjs';
import {KEY,PORTRAITS,REQUEST,UI,esc} from './party-state.mjs';
const status=document.querySelector('[data-status]'),connect=document.querySelector('[data-connect-party]'),stop=document.querySelector('[data-stop-party]'),roster=document.querySelector('[data-party-roster]');
let available=false,popup,nonce,connection,timer,generation=0,publishing=false,ownId,lastSignature='',lastPublished=0;
const portraits=new Map();
const say=message=>{status.textContent=message;};
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
  if(popup?.closed||!connection)throw Error('The Cosmos connection window closed. Reconnect to sync party status.');
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
  roster.innerHTML=characters.map(c=>'<li>'+esc(c.name)+' <span>HP '+esc(c.hp)+'/'+esc(c.hpMax)+' · MP '+esc(c.mp)+'/'+esc(c.mpMax)+'</span></li>').join('');
  say(characters.length?'Sharing '+characters.length+' character card'+(characters.length===1?'':'s')+' · Synced with Cosmos.':'Connected. Turn on the status-card icon beside a character in Cosmos Admin.');
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
 connect.hidden=stop.hidden=await OBR.player.getRole()!=='GM';
 say(connect.hidden?'The GM connects Cosmos and chooses the visible character cards.':'Connect the Cosmos administrator account to share party cards with this room.');
 OBR.broadcast.onMessage(REQUEST,({data})=>{if(!publishing||!Array.isArray(data?.ids))return;for(const id of data.ids.slice(0,40)){const portrait=portraits.get(id);if(portrait)void OBR.broadcast.sendMessage(PORTRAITS,portrait,{destination:'ALL'}).catch(()=>{});}});
});
connect.onclick=()=>{
 if(!available)return;generation++;publishing=false;clearTimeout(timer);lastPublished=0;lastSignature='';connection?.close();portraits.clear();
 nonce=[...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');
 popup=window.open(new URL('/owlbear/connect.html?mode=party-status#'+nonce,location.origin).href,'cosmos-party-connect-'+crypto.randomUUID(),'width=520,height=520');
 say(popup?'Connect your Cosmos administrator account in the connection window.':'Allow the Cosmos connection popup and try again.');
};
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==popup||event.data?.type!=='cosmos:connect-ready'||event.data.nonce!==nonce)return;
 generation++;clearTimeout(timer);connection?.close();const channel=new MessageChannel();connection=peer(channel.port1,()=>{throw Error('Unsupported request.');});
 popup.postMessage({type:'cosmos:connect-port',nonce},location.origin,[channel.port2]);publishing=true;lastPublished=0;lastSignature='';void tick(generation);
});
stop.onclick=async()=>{generation++;publishing=false;clearTimeout(timer);connection?.close();connection=null;portraits.clear();await clear().catch(()=>{});roster.replaceChildren();say('Party status sharing stopped for this room.');};
document.querySelector('[data-show-overlay]').onclick=()=>{if(available)void OBR.broadcast.sendMessage(UI,{show:true},{destination:'LOCAL'}).catch(error=>say(error.message));};
document.querySelector('[data-hide-overlay]').onclick=()=>{if(available)void OBR.broadcast.sendMessage(UI,{show:false},{destination:'LOCAL'}).catch(error=>say(error.message));};
document.querySelector('[data-overlay-position]').onchange=event=>{if(available)void OBR.broadcast.sendMessage(UI,{position:event.target.value},{destination:'LOCAL'}).catch(error=>say(error.message));};
window.addEventListener('pagehide',()=>{generation++;publishing=false;clearTimeout(timer);connection?.close();},{once:true});
