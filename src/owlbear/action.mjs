import OBR from '@owlbear-rodeo/sdk';
import {peer} from './rpc.mjs';
import {connection as connectGrant} from './connection.mjs';
import {dicePlus} from './dice-plus.mjs';
import {panelSize} from './panel-size.mjs';
import {localChannel} from './local-channel.mjs';
import {mountPanel} from './panel.mjs';
import {publicReceipt} from '../features/room-rolls.mjs';
const status=document.querySelector('[data-status]'),list=document.querySelector('[data-characters]'),frame=document.querySelector('iframe'),dice=dicePlus(OBR);
const npcList=document.querySelector('[data-npc-characters]'),npcGroup=document.querySelector('[data-npc-group]');
let popup,nonce,connection,sheetConnection,sheetNonce,activeCharacterId,tabWindow,tabNonce,tabConnection,tabCharacterId,available=false;
let disposeSize,trackerBus,grantToken='';const audiences=new Map(),names=new Map();
let showNpcs=false,activeNpc=false,loadGeneration=0;
const panel=mountPanel(document.querySelector('main'),{history:()=>connection.call('roll-history')});
const tabName='cosmos-owlbear-sheet-'+crypto.randomUUID(),openTab=document.querySelector('[data-open-sheet-tab]');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function say(message){status.textContent=message;}
function back(){frame.hidden=true;list.hidden=false;npcGroup.hidden=!showNpcs||!npcList.children.length;document.querySelector('[data-back]').hidden=true;openTab.hidden=true;activeCharacterId=null;activeNpc=false;sheetConnection?.close();sheetConnection=null;sheetNonce=null;frame.removeAttribute('src');}
async function sheetRequest(method,value){
 if(!connection)throw Error('Reconnect Cosmos.');
 if(method==='roll-context'){if(typeof value?.requestId!=='string')throw Error('Invalid roll.');if(audiences.size>=100)audiences.delete(audiences.keys().next().value);audiences.set(value.requestId,document.querySelector('[data-roll-audience]').value);return {};}
 if(method==='api'){try{const response=await connection.call('api',value);if(response.data?.character)names.set(response.data.character.id,response.data.character.name);if(response.status===200&&value.body?.op==='roll'&&response.data?.roll){panel.invalidate();const id=/character-records\/([\w-]+)/.exec(value.path)?.[1],entry=publicReceipt({id:value.body.requestId,character:names.get(id)||'Character',label:value.body.label,roll:response.data.roll});if(entry)trackerBus?.send({type:'roll-receipt',entry,target:audiences.get(value.body.requestId)||'self'});audiences.delete(value.body.requestId);}return response;}catch(error){panel.connected(false);panel.admin(false);say('Disconnected');document.querySelector('[data-connect]').hidden=false;throw error;}}
 if(method==='dice'){await dice.ready();return dice.roll(value.notation,audiences.get(value.requestId)||'self');}
 throw Error('Unsupported sheet action.');
}
async function load(){
 if(!connection)throw Error('Connect your Cosmos account first.');
 const current=connection,turn=++loadGeneration;
 const [characters,npcs]=await Promise.all([current.call('list'),showNpcs?current.call('npc-list'):[]]);
 if(current!==connection||turn!==loadGeneration)return;
 for(const character of [...characters,...npcs])names.set(character.id,character.name);
 const card=c=>'<button class="character-card" data-character="'+esc(c.id)+'"><span class="character-photo">'+(typeof c.portraitUrl==='string'&&/^data:image\/(png|jpeg|webp);base64,/i.test(c.portraitUrl)?'<img src="'+esc(c.portraitUrl)+'" alt="">':'<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="13" r="8"/><path d="M5 38v-5a15 15 0 0130 0v5Z"/></svg>')+'</span><strong>'+esc(c.name)+'</strong><span aria-hidden="true">›</span></button>';
 list.innerHTML=characters.map(card).join('')||'<p>No characters.</p>';
 npcList.innerHTML=showNpcs?npcs.map(card).join(''):'';npcGroup.hidden=!showNpcs||!npcs.length||!frame.hidden;
 say('Connected');panel.connected(true);document.querySelector('[data-connect]').hidden=true;
}
OBR.onReady(async()=>{
 available=true;say('Connect your Cosmos account to load your characters.');void OBR.action.setIcon(new URL('/owlbear/sheet-action.svg',location.origin).href).catch(()=>{});void panelSize(OBR,say).then(dispose=>disposeSize=dispose).catch(error=>say(error.message));
 trackerBus=await localChannel(OBR,data=>{
  if(data?.type==='grant'&&data.token!==grantToken){grantToken=data.token;panel.connected(false);connection?.close();connection=connectGrant(data.token);void load().catch(error=>say(error.message));}
  if(data?.type==='state'){
   if(showNpcs!==(data.admin===true)){
    showNpcs=data.admin===true;
    if(!showNpcs){npcList.replaceChildren();npcGroup.hidden=true;if(activeNpc)back();}
    if(connection)void load().catch(error=>say(error.message));
   }
   panel.admin(data.admin===true);document.querySelector('[data-admin-controls]').hidden=data.admin!==true;
   for(const key of ['party','initiative'])document.querySelector('[data-layout="'+key+'"]').checked=data.layout[key];
   for(const key of ['partyDock','initiativeDock'])document.querySelector('[data-layout="'+key+'"]').value=data.layout[key];
   document.querySelector('[data-tracker-status]').textContent=data.feed==='Live'?'Connected':data.feed;
  }
  if(data?.type==='room-rolls')panel.shared(data.rolls);
  if(data?.type==='result'&&data.error)say(data.error);
 });
 trackerBus.send({type:'hello'});
 document.querySelector('[data-admin-controls]').onchange=event=>{const node=event.target,key=node.dataset.layout;if(key)trackerBus.send({type:'layout',key,value:node.type==='checkbox'?node.checked:node.value,requestId:crypto.randomUUID()});};
});
document.querySelector('[data-connect]').onclick=()=>{
 if(!available){say('Open this extension inside an Owlbear room first.');return;}
 const bytes=crypto.getRandomValues(new Uint8Array(32));nonce=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
 panel.connected(false);panel.admin(false);connection?.close();back();popup=window.open(new URL('connect.html#'+nonce,location.href).href,'cosmos-connect-'+crypto.randomUUID(),'width=520,height=520');
 if(!popup)say('Allow this Cosmos connection popup, then click Connect again.');else say('Sign in in the Cosmos connection window.');
};
window.addEventListener('message',event=>{
 if(event.origin!==location.origin)return;
 if(event.source===popup&&event.data?.type==='cosmos:connected'&&event.data.nonce===nonce){
  if(!/^[a-f0-9]{64}$/.test(event.data.token||''))return;grantToken=event.data.token;connection=connectGrant(grantToken);trackerBus?.send({type:'grant-set',token:grantToken});popup.postMessage({type:'cosmos:connected-ack',nonce},location.origin);void load().catch(error=>say(error.message));
 }
 const fromFrame=sheetNonce&&event.source===frame.contentWindow&&event.data?.nonce===sheetNonce;
 const fromTab=tabNonce&&event.source===tabWindow&&event.data?.nonce===tabNonce;
 if((fromFrame||fromTab)&&event.data?.type==='cosmos:sheet-ready'){
  const channel=new MessageChannel();
  if(fromTab){tabConnection?.close();tabConnection=peer(channel.port1,sheetRequest);}
  else{sheetConnection?.close();sheetConnection=peer(channel.port1,sheetRequest);}
  event.source.postMessage({type:'cosmos:sheet-port',nonce:event.data.nonce},location.origin,[channel.port2]);
 }
 if((fromFrame||fromTab)&&event.data?.type==='cosmos:back'){back();if(fromTab){tabConnection?.close();tabConnection=null;tabCharacterId=null;}}
});
function openSheet(event){
 const button=event.target.closest('[data-character]');if(!button)return;
 activeNpc=event.currentTarget===npcList;
 if(activeNpc&&!showNpcs)return;
 activeCharacterId=button.dataset.character;sheetConnection?.close();sheetConnection=null;
 sheetNonce=crypto.randomUUID();frame.src=new URL('sheet.html?characterId='+encodeURIComponent(activeCharacterId)+'#'+sheetNonce,location.href).href;
 list.hidden=true;npcGroup.hidden=true;frame.hidden=false;document.querySelector('[data-back]').hidden=false;openTab.hidden=false;
 document.querySelector('.panel-options').open=false;
 say('Connected');
}
list.onclick=npcList.onclick=openSheet;
openTab.onclick=()=>{
 if(!activeCharacterId)return;
 if(tabWindow&&!tabWindow.closed&&tabCharacterId===activeCharacterId){tabWindow.focus();return;}
 tabNonce=crypto.randomUUID();tabConnection?.close();tabConnection=null;
 tabWindow=window.open(new URL('sheet.html?characterId='+encodeURIComponent(activeCharacterId)+'#'+tabNonce,location.href).href,tabName,'popup=yes,width=1000,height=800,resizable=yes,scrollbars=yes,toolbar=no,menubar=no');
 if(!tabWindow){tabCharacterId=null;say('Allow the sheet popup, then click the pop-out icon again.');return;}
 tabCharacterId=activeCharacterId;tabWindow.focus();say('Connected');
};
document.querySelector('[data-back]').onclick=back;
document.querySelector('[data-refresh]').onclick=()=>void load().catch(error=>say(error.message));
window.addEventListener('pagehide',()=>{disposeSize?.();panel.close();trackerBus?.close();connection?.close();sheetConnection?.close();tabConnection?.close();},{once:true});
