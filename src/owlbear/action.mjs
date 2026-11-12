import OBR from '@owlbear-rodeo/sdk';
import {peer} from './rpc.mjs';
import {connection as connectGrant} from './connection.mjs';
import {dicePlus} from './dice-plus.mjs';
import {panelSize} from './panel-size.mjs';
import {localChannel} from './local-channel.mjs';
import {mountPanel} from './panel.mjs';
import {mountInitiative} from './initiative-view.mjs';
import {publicReceipt} from '../features/room-rolls.mjs';

const root=document.querySelector('main'),status=document.querySelector('[data-status]'),list=document.querySelector('[data-characters]');
const roster=document.querySelector('[data-character-roster]'),prompt=document.querySelector('[data-connect-prompt]');
const frames=document.querySelector('[data-sheet-frames]'),picker=document.querySelector('[data-sheet-picker]'),choices=document.querySelector('[data-sheet-choices]'),pickerSearch=document.querySelector('[data-sheet-search]'),pickerStatus=document.querySelector('[data-sheet-search-status]');
const npcList=document.querySelector('[data-npc-characters]'),npcGroup=document.querySelector('[data-npc-group]'),dice=dicePlus(OBR);
const openSheets=new Map(),names=new Map(),audiences=new Map();
const backButton=document.querySelector('[data-back]'),addSheet=document.querySelector('[data-add-sheet]'),openTab=document.querySelector('[data-open-sheet-tab]');
let popup,nonce,connection,activeCharacterId=null,tabWindow,tabNonce,tabConnection,tabCharacterId,available=false;
let disposeSize,trackerBus,grantToken='',showNpcs=false,loadGeneration=0,characterRequest=null,npcRequest=null,characters=[],npcs=[],pickerCandidates=[];
const panel=mountPanel(root,{history:()=>connection.call('roll-history'),onSheetTab:id=>showSheet(id),onCloseSheet:id=>closeSheet(id),onView:()=>{saveScroll(activeCharacterId);backButton.hidden=true;addSheet.hidden=true;openTab.hidden=true;}});
const initiativeView=mountInitiative(document.querySelector('[data-initiative-panel]'),command=>trackerBus?.send(command));
const tabName='cosmos-owlbear-sheet-'+crypto.randomUUID();
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function say(message){status.textContent=message;}
function saveScroll(id){
 const sheet=openSheets.get(id);
 if(!sheet)return;
 try{sheet.scrollY=sheet.iframe.contentWindow?.scrollY??sheet.scrollY??0;}catch{}
}
function restoreScroll(sheet){
 if(!sheet)return;
 // Wait for the hidden iframe to re-enter layout before scrolling.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(activeCharacterId!==sheet.id||sheet.iframe.dataset.sheetInactive==='true')return;
  try{sheet.iframe.contentWindow?.scrollTo(0,sheet.scrollY||0);}catch{}
 }));
}
function showRoster(){
 saveScroll(activeCharacterId);
 activeCharacterId=null;
 roster.hidden=false;frames.hidden=true;
 for(const sheet of openSheets.values()){sheet.iframe.dataset.sheetInactive='true';sheet.iframe.setAttribute('aria-hidden','true');}
 backButton.hidden=true;addSheet.hidden=true;openTab.hidden=true;
 npcGroup.hidden=!showNpcs||!npcList.children.length;
}
function showSheet(id){
 const chosen=id?openSheets.get(id):null;
 if(!chosen){showRoster();return;}
 if(activeCharacterId!==id)saveScroll(activeCharacterId);
 activeCharacterId=id;
 roster.hidden=true;frames.hidden=false;
 for(const sheet of openSheets.values()){const inactive=sheet!==chosen;sheet.iframe.dataset.sheetInactive=String(inactive);sheet.iframe.setAttribute('aria-hidden',String(inactive));}
 backButton.hidden=false;addSheet.hidden=false;openTab.hidden=false;
 restoreScroll(chosen);
}
function syncSheetTabs(){
 panel.syncSheets([...openSheets.values()].map(sheet=>({id:sheet.id,name:sheet.name})));
}
function resetSheets(){
 for(const sheet of openSheets.values()){sheet.connection?.close();sheet.iframe.remove();}
 openSheets.clear();syncSheetTabs();showRoster();
}
function closeSheet(id){
 const sheet=openSheets.get(id);if(!sheet)return;
 const wasActive=activeCharacterId===id;
 sheet.connection?.close();sheet.iframe.remove();openSheets.delete(id);
 syncSheetTabs();
 if(wasActive){
  const next=openSheets.keys().next().value;
  panel.select('character');
  if(!next)showRoster();
 }else if(!openSheets.size){showRoster();}
}
function openSheet(id,npc=false){
 if(!connection){say('Connect your Cosmos account first.');return;}
 if(npc&&!showNpcs)return;
 if(!openSheets.has(id)){
  const iframe=document.createElement('iframe'),nonce=crypto.randomUUID();
  iframe.title=(names.get(id)||'Character')+' sheet';iframe.dataset.sheetInactive='true';iframe.setAttribute('aria-hidden','true');
  frames.append(iframe);
  openSheets.set(id,{id,name:names.get(id)||'Character',npc,iframe,nonce,scrollY:0,connection:null});
  iframe.src=new URL('sheet.html?characterId='+encodeURIComponent(id)+'#'+nonce,location.href).href;
 }
 syncSheetTabs();
 panel.select([...openSheets.keys()].indexOf(id)===0?'character':'sheet:'+id);
 say('Connected');
}
function renderSheetChoices(){
 const query=pickerSearch.value.trim().toLocaleLowerCase();
 const filtered=pickerCandidates.filter(c=>c.name.toLocaleLowerCase().includes(query));
 choices.replaceChildren();
 pickerStatus.textContent=filtered.length+' of '+pickerCandidates.length+' available sheets';
 if(!filtered.length){const note=document.createElement('p');note.textContent=query?'No matching characters.':'No other characters available.';choices.append(note);}
 for(const character of filtered){
  const button=document.createElement('button');
  button.type='button';button.dataset.pickSheet=character.id;
  button.className='character-card';
  const label=document.createElement('strong');label.textContent=character.name;
  button.append(label);
  if(character.npc){const kind=document.createElement('small');kind.textContent='NPC';button.append(kind);}
  choices.append(button);
 }
}
function openPicker(){
 if(!connection||!activeCharacterId)return;
 pickerCandidates=[
  ...characters.map(c=>({...c,npc:false})),
  ...(showNpcs?npcs.map(c=>({...c,npc:true})):[])
 ].filter(c=>!openSheets.has(c.id));
 pickerSearch.value='';
 renderSheetChoices();
 picker.showModal();pickerSearch.focus();
}
pickerSearch.addEventListener('input',renderSheetChoices);
document.querySelector('[data-sheet-search-go]').onclick=renderSheetChoices;
picker.addEventListener('close',()=>{pickerCandidates=[];pickerSearch.value='';choices.replaceChildren();});
choices.addEventListener('click',event=>{
 const button=event.target.closest('[data-pick-sheet]');if(!button)return;
 const item=pickerCandidates.find(c=>c.id===button.dataset.pickSheet);
 if(!item||item.npc&&!showNpcs)return;
 picker.close();openSheet(item.id,item.npc);
});
async function sheetRequest(method,value){
 if(!connection)throw Error('Reconnect Cosmos.');
 if(method==='roll-context'){
  if(typeof value?.requestId!=='string')throw Error('Invalid roll.');
  if(audiences.size>=100)audiences.delete(audiences.keys().next().value);
  audiences.set(value.requestId,document.querySelector('[data-roll-audience]').value);
  return {};
 }
 if(method==='api'){
  try{
   const response=await connection.call('api',value);
   if(response.data?.character)names.set(response.data.character.id,response.data.character.name);
   if(response.status===200&&value.body?.op==='roll'&&response.data?.roll){
    panel.invalidate();const id=/character-records\/([\w-]+)/.exec(value.path)?.[1];
    const entry=publicReceipt({id:value.body.requestId,character:names.get(id)||'Character',label:value.body.label,roll:response.data.roll});
    if(entry)trackerBus?.send({type:'roll-receipt',entry,target:audiences.get(value.body.requestId)||'self'});
    audiences.delete(value.body.requestId);
   }
   return response;
  }catch(error){
   panel.connected(false);panel.admin(false);say('Disconnected');
   prompt.hidden=false;connection?.close();connection=null;resetSheets();
   throw error;
  }
 }
 if(method==='dice'){await dice.ready();return dice.roll(value.notation,audiences.get(value.requestId)||'self');}
 throw Error('Unsupported sheet action.');
}
async function load({fresh=false}={}){
 if(!connection)throw Error('Connect your Cosmos account first.');
 const current=connection,turn=++loadGeneration;
 if(fresh){characterRequest=null;npcRequest=null;}
 if(!characterRequest)characterRequest=current.call('list').catch(error=>{if(connection===current)characterRequest=null;throw error;});
 const loaded=await characterRequest;
 if(current!==connection||turn!==loadGeneration)return;
 characters=loaded;
 for(const character of characters)names.set(character.id,character.name);
 const card=c=>'<button class="character-card" data-character="'+esc(c.id)+'"><span class="character-photo">'+(typeof c.portraitUrl==='string'&&/^data:image\/(png|jpeg|webp);base64,/i.test(c.portraitUrl)?'<img src="'+esc(c.portraitUrl)+'" alt="">':'<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="13" r="8"/><path d="M5 38v-5a15 15 0 0130 0v5Z"/></svg>')+'</span><strong>'+esc(c.name)+'</strong><span aria-hidden="true">›</span></button>';
 list.innerHTML=characters.map(card).join('')||'<p>No characters yet.</p>';
 say('Connected');panel.connected(true);prompt.hidden=true;
 // Switching or refreshing the admin/NPC roster must not steal the selected tab.
 if(!showNpcs){npcs=[];npcList.replaceChildren();npcGroup.hidden=true;return;}
 if(!npcRequest)npcRequest=current.call('npc-list').catch(error=>{if(connection===current)npcRequest=null;throw error;});
 const loadedNpcs=await npcRequest;
 if(current!==connection||turn!==loadGeneration||!showNpcs)return;
 npcs=loadedNpcs;
 for(const character of npcs)names.set(character.id,character.name);
 npcList.innerHTML=npcs.map(card).join('');
 npcGroup.hidden=!npcList.children.length||roster.hidden;
}
function chooseFromRoster(event,npc=false){
 const button=event.target.closest('[data-character]');if(!button)return;
 openSheet(button.dataset.character,npc);
}
list.addEventListener('click',event=>chooseFromRoster(event));
npcList.addEventListener('click',event=>chooseFromRoster(event,true));
backButton.onclick=()=>showRoster();
addSheet.onclick=openPicker;
openTab.onclick=()=>{
 if(!activeCharacterId)return;
 if(tabWindow&&!tabWindow.closed&&tabCharacterId===activeCharacterId){tabWindow.focus();return;}
 tabNonce=crypto.randomUUID();tabConnection?.close();tabConnection=null;
 tabWindow=window.open(new URL('sheet.html?characterId='+encodeURIComponent(activeCharacterId)+'#'+tabNonce,location.href).href,tabName,'popup=yes,width=1000,height=800,resizable=yes,scrollbars=yes,toolbar=no,menubar=no');
 if(!tabWindow){tabCharacterId=null;say('Allow the sheet popup, then click the pop-out icon again.');return;}
 tabCharacterId=activeCharacterId;tabWindow.focus();say('Connected');
};

OBR.onReady(async()=>{
 available=true;say('Connect your Cosmos account to load your characters.');
 void OBR.action.setIcon(new URL('/owlbear/sheet-action.svg',location.origin).href).catch(()=>{});
 void panelSize(OBR,say).then(dispose=>disposeSize=dispose).catch(error=>say(error.message));
 trackerBus=await localChannel(OBR,data=>{
  if(data?.type==='grant'&&data.token!==grantToken){
   grantToken=data.token;panel.connected(false);connection?.close();resetSheets();
   connection=connectGrant(data.token);characterRequest=null;npcRequest=null;
   panel.select('character');void load().catch(error=>say(error.message));
  }
  if(data?.type==='state'){
   if(showNpcs!==(data.admin===true)){
    showNpcs=data.admin===true;
    if(!showNpcs){
     if(picker.open)picker.close();
     for(const sheet of [...openSheets.values()])if(sheet.npc)closeSheet(sheet.id);
     npcs=[];npcList.replaceChildren();npcGroup.hidden=true;
    }
    if(connection)void load().catch(error=>say(error.message));
   }
   panel.admin(data.admin===true);initiativeView.state(data);
   document.querySelector('[data-admin-controls]').hidden=data.admin!==true;
   for(const key of ['party','initiative'])document.querySelector('[data-layout="'+key+'"]').checked=data.layout[key];
   document.querySelector('[data-layout="partyDock"]').value=data.layout.partyDock;
   document.querySelector('[data-tracker-status]').textContent=data.feed==='Live'?'Connected':data.feed;
  }
  if(data?.type==='room-rolls')panel.shared(data.rolls);
  if(data?.type==='result'){
   const handled=initiativeView.result(data);
   if(data.error&&!handled)say(data.error);
  }
 });
 trackerBus.send({type:'hello'});
 document.querySelector('[data-admin-controls]').onchange=event=>{
  const node=event.target,key=node.dataset.layout;
  if(key)trackerBus.send({type:'layout',key,value:node.type==='checkbox'?node.checked:node.value,requestId:crypto.randomUUID()});
 };
});
document.querySelector('[data-connect]').onclick=()=>{
 if(!available){say('Open this extension inside an Owlbear room first.');return;}
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 nonce=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
 panel.connected(false);panel.admin(false);connection?.close();connection=null;resetSheets();
 popup=window.open(new URL('connect.html#'+nonce,location.href).href,'cosmos-connect-'+crypto.randomUUID(),'width=520,height=520');
 if(!popup)say('Allow this Cosmos connection popup, then click Connect again.');
 else say('Sign in in the Cosmos connection window.');
};
window.addEventListener('message',event=>{
 if(event.origin!==location.origin)return;
 if(event.source===popup&&event.data?.type==='cosmos:connected'&&event.data.nonce===nonce){
  if(!/^[a-f0-9]{64}$/.test(event.data.token||''))return;
  grantToken=event.data.token;connection=connectGrant(grantToken);
  characterRequest=null;npcRequest=null;
  trackerBus?.send({type:'grant-set',token:grantToken});
  popup.postMessage({type:'cosmos:connected-ack',nonce},location.origin);
  panel.select('character');void load().catch(error=>say(error.message));
 }
 const fromFrame=[...openSheets.values()].find(sheet=>event.source===sheet.iframe.contentWindow&&event.data?.nonce===sheet.nonce);
 const fromTab=tabNonce&&event.source===tabWindow&&event.data?.nonce===tabNonce;
 if((fromFrame||fromTab)&&event.data?.type==='cosmos:sheet-selected'&&/^[0-9a-f-]{36}$/i.test(event.data.characterId)){
  if(fromTab)tabCharacterId=event.data.characterId;
 }
 if((fromFrame||fromTab)&&event.data?.type==='cosmos:sheet-ready'){
  const channel=new MessageChannel();
  if(fromTab){tabConnection?.close();tabConnection=peer(channel.port1,sheetRequest);}
  else{fromFrame.connection?.close();fromFrame.connection=peer(channel.port1,sheetRequest);}
  event.source.postMessage({type:'cosmos:sheet-port',nonce:event.data.nonce},location.origin,[channel.port2]);
 }
 if(event.data?.type==='cosmos:back'){
  if(fromFrame)showRoster();
  if(fromTab){tabConnection?.close();tabConnection=null;tabCharacterId=null;}
 }
});
window.addEventListener('pagehide',()=>{
 disposeSize?.();panel.close();initiativeView.close();trackerBus?.close();connection?.close();
 for(const sheet of openSheets.values())sheet.connection?.close();
 tabConnection?.close();
},{once:true});
