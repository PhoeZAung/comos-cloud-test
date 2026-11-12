import OBR from '@owlbear-rodeo/sdk';
import {peer} from './rpc.mjs';
import {connection as connectGrant} from './connection.mjs';
import {dicePlus} from './dice-plus.mjs';
import {panelSize} from './panel-size.mjs';
import {localChannel} from './local-channel.mjs';
import {mountPanel} from './panel.mjs';
import {mountInitiative} from './initiative-view.mjs';
import {publicReceipt} from '../features/room-rolls.mjs';
import {resolveCombatTarget} from './combat-target.mjs';
import {COMBAT_CHANNEL} from './combat-effects.mjs';
import {applyNpcTokenReceipt} from './combat-npc.mjs';
import {BATTLE} from './battle-state.mjs';

const root=document.querySelector('main'),status=document.querySelector('[data-status]'),list=document.querySelector('[data-characters]');
const roster=document.querySelector('[data-character-roster]'),prompt=document.querySelector('[data-connect-prompt]');
const frames=document.querySelector('[data-sheet-frames]'),picker=document.querySelector('[data-sheet-picker]'),choices=document.querySelector('[data-sheet-choices]'),pickerSearch=document.querySelector('[data-sheet-search]'),pickerStatus=document.querySelector('[data-sheet-search-status]');
const npcList=document.querySelector('[data-npc-characters]'),npcGroup=document.querySelector('[data-npc-group]'),dice=dicePlus(OBR);
const openSheets=new Map(),names=new Map(),audiences=new Map(),combatPending=new Map();
let latestBattle=[],latestTurn={},latestReady=false,latestAdmin=false,latestValidation={weapon:false,ability:false};
let combatHistoryTimer=null;
let popup,nonce,connection,activeCharacterId=null,tabWindow,tabNonce,tabConnection,tabCharacterId,available=false;
let autoConnecting=false,pendingExistingGrant=null,autoAttemptAt=0,autoAttemptGeneration=0;
let disposeSize,trackerBus,grantToken='',showNpcs=false,loadGeneration=0,characterRequest=null,npcRequest=null,characters=[],npcs=[],pickerCandidates=[];
const panel=mountPanel(root,{history:()=>connection.call('roll-history'),onSheetTab:id=>showSheet(id),onCloseSheet:id=>closeSheet(id),onView:()=>{saveScroll(activeCharacterId);}});
const initiativeView=mountInitiative(document.querySelector('[data-initiative-panel]'),command=>trackerBus?.send(command));
const tabName='cosmos-owlbear-sheet-'+crypto.randomUUID();
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function say(message){status.textContent=message;}
function saveScroll(id){
 const sheet=openSheets.get(id);
 if(!sheet)return;
 try{const y=sheet.iframe.contentWindow?.scrollY;if(Number.isFinite(y)&&(y>0||sheet.scrollY===0))sheet.scrollY=y;}catch{}
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
 npcGroup.hidden=!showNpcs||!npcList.children.length;
}
function showSheet(id){
 const chosen=id?openSheets.get(id):null;
 if(!chosen){showRoster();return;}
 if(activeCharacterId!==id)saveScroll(activeCharacterId);
 activeCharacterId=id;
 roster.hidden=true;frames.hidden=false;
 for(const sheet of openSheets.values()){const inactive=sheet!==chosen;sheet.iframe.dataset.sheetInactive=String(inactive);sheet.iframe.setAttribute('aria-hidden',String(inactive));}
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
  const sheet={id,name:names.get(id)||'Character',npc,iframe,nonce,scrollY:0,connection:null};
  openSheets.set(id,sheet);
  iframe.addEventListener('load',()=>{
   try{iframe.contentWindow?.addEventListener('scroll',()=>{
    if(activeCharacterId!==id||iframe.dataset.sheetInactive==='true')return;
    const y=iframe.contentWindow.scrollY;
    if(Number.isFinite(y))sheet.scrollY=y;
   },{passive:true});}catch{}
  });
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
async function refreshCombatHistory(){
 if(!connection||!available)return;
 try{
  const result=await connection.call('combat-history',{roomId:OBR.room.id});
  initiativeView.history(result.events||[]);
 }catch(error){console.debug('Combat history unavailable:',error.message);}
}
async function applyCombatRequest(request){
 if(!connection)throw Error('Reconnect Cosmos.');
 const target=latestBattle.find(row=>row.id===request.targetTokenId);
 if(!target)throw Error('The selected combatant left battle.');
 const item=request.targetSheetId?null:(await OBR.scene.items.getItems()).find(i=>i.id===request.targetTokenId);
 const npc=item?.metadata?.[BATTLE];
 if(!request.targetSheetId&&npc?.enabled!==true)throw Error('The NPC target is no longer in battle.');
 const applied=await connection.call('combat-apply',{
  roomId:OBR.room.id,...request,
  targetHp:request.targetSheetId?target.hp:npc.hp,
  targetHpMax:request.targetSheetId?target.hpMax:npc.hpMax,
  targetHpTemp:request.targetSheetId?target.hpTemp:npc.hpTemp||0,
  targetNpcId:request.targetSheetId?null:npc.npcId||null
 });
 let event=applied.event;
 if(applied.needsNpcUpdate){
  const outcome=await applyNpcTokenReceipt(OBR,{tokenId:request.targetTokenId,receiptId:request.requestId,effect:event});
  event=await connection.call('combat-finalize',{roomId:OBR.room.id,requestId:request.requestId,
   before:outcome.before||event.before,after:outcome.after||event.after});
 }
 void refreshCombatHistory();
 return event;
}
function approvalRequest(request,forceReview=false){
 return OBR.broadcast.sendMessage(COMBAT_CHANNEL,{type:'request',request:{...request,forceReview}},{destination:'REMOTE'});
}
async function sheetRequest(method,value){
 if(!connection)throw Error('Reconnect Cosmos.');
 if(method==='combat-context'){
  if(typeof value?.requestId!=='string'||typeof value.characterId!=='string'||!['weapon','spell','ability'].includes(value.kind)||!value.row||typeof value.row!=='object')throw Error('Invalid combat action.');
  if(!characters.some(c=>c.id===value.characterId)&&!(latestAdmin&&npcs.some(c=>c.id===value.characterId)))throw Error('This character is not available to your Cosmos account.');
  const selection=await OBR.player.getSelection();
  const target=resolveCombatTarget({characterId:value.characterId,kind:value.kind,row:value.row,battle:latestBattle,turn:latestTurn,selection:selection||[],ready:latestReady,admin:latestAdmin});
  if(target){
   if(combatPending.size>=100)combatPending.clear();
   combatPending.set(value.requestId,{...target,actorSheetId:value.characterId,source:value.kind,round:Math.max(1,Number(latestTurn.round)||1),at:Date.now()});
  }
  return target;
 }
 if(method==='combat-complete'){
  const pending=combatPending.get(value?.requestId);
  if(!pending||pending.targetId!==value.targetId||Date.now()-pending.at>120000)return {cleared:false};
  const target=latestBattle.find(row=>row.id===pending.targetId);
  if(!target)throw Error('Target left battle before the action could be resolved.');
  const actor=latestBattle.find(row=>row.id===pending.actorId);
  const request={
   requestId:value.requestId,actorSheetId:pending.actorSheetId,source:pending.source,kind:pending.kind,
   gmOnly:latestAdmin&&(actor?.visible===false||target.visible===false),
   actorTokenId:pending.actorId,targetTokenId:pending.targetId,
   targetSheetId:target.siteId||null,targetName:target.name,
   targetAc:pending.ac,defense:pending.defense,round:pending.round
  };
  const approval=latestValidation[pending.source==='weapon'?'weapon':'ability']&&!latestAdmin;
  let result;
  if(approval){
   await approvalRequest(request);
   result={status:'pending',applied:false};
  }else{
   try{
    const event=await applyCombatRequest(request);
    result={status:event.status,applied:true,event};
   }catch(error){
    // A player may be unable to change NPC tokens when Owlbear's Owner Only
    // permission is enabled. Let the GM finish that already-recorded receipt.
    if(!latestAdmin&&!target.siteId){
     await approvalRequest(request,true);
     result={status:'pending',applied:false,reason:'GM must apply this NPC effect'};
    }else throw error;
   }
  }
  combatPending.delete(value.requestId);
  const selection=await OBR.player.getSelection();
  if((selection||[]).includes(pending.targetId))await OBR.player.deselect([pending.targetId]);
  return {...result,cleared:true};
 }
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
function openSheetWindow(id){
 if(!id||!connection||!openSheets.has(id))return;
 if(tabWindow&&!tabWindow.closed&&tabCharacterId===id){tabWindow.focus();return;}
 tabNonce=crypto.randomUUID();tabConnection?.close();tabConnection=null;
 tabWindow=window.open(new URL('sheet.html?characterId='+encodeURIComponent(id)+'#'+tabNonce,location.href).href,tabName,'popup=yes,width=1000,height=800,resizable=yes,scrollbars=yes,toolbar=no,menubar=no');
 if(!tabWindow){tabCharacterId=null;say('Allow the sheet popup, then click the pop-out icon again.');return;}
 tabCharacterId=id;tabWindow.focus();say('Connected');
}
// Same-origin embedded sheets can open a window during the original click gesture.
// A delayed postMessage can lose transient user activation and trigger popup blockers.
window.cosmosOpenSheetWindow=sourceNonce=>{
 const sheet=[...openSheets.values()].find(s=>s.nonce===sourceNonce&&s.id===activeCharacterId);
 if(!sheet||!connection)return false;
 openSheetWindow(sheet.id);
 return true;
};


function attachGrant(token,{notifyBackground=false}={}){
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return;
 if(grantToken===token&&connection)return;
 grantToken=token;connection?.close();connection=null;
 characterRequest=null;npcRequest=null;
 panel.connected(false);resetSheets();
 connection=connectGrant(token);combatPending.clear();void refreshCombatHistory();panel.select('character');
 if(notifyBackground)trackerBus?.send({type:'grant-set',token});
 void load().catch(error=>say(error.message));
}
async function autoConnect(){
 if(!available||autoConnecting||connection||Date.now()-autoAttemptAt<3000)return;
 const generation=++autoAttemptGeneration;autoAttemptAt=Date.now();autoConnecting=true;
 try{
  const response=await fetch('/api/v1/owlbear/connect',{
   method:'POST',credentials:'same-origin',cache:'no-store',
   headers:{'Content-Type':'application/json'},body:JSON.stringify({scope:'sheet'})
  });
  if(generation!==autoAttemptGeneration)return;
  if(!response.ok){
   if(response.status!==401)throw Error('Cosmos could not restore the connection.');
   if(pendingExistingGrant&&!connection)attachGrant(pendingExistingGrant);
   else if(!connection)say('Sign in to Cosmos to connect your character sheets.');
   return;
  }
  const result=await response.json();
  if(!/^[a-f0-9]{64}$/.test(result.token||''))throw Error('Invalid Cosmos connection.');
  if(generation!==autoAttemptGeneration)return;
  pendingExistingGrant=null;attachGrant(result.token,{notifyBackground:true});
 }catch(error){
  if(generation!==autoAttemptGeneration)return;
  if(pendingExistingGrant&&!connection)attachGrant(pendingExistingGrant);
  else if(!connection)say(error.message);
 }finally{
  if(generation===autoAttemptGeneration){autoConnecting=false;pendingExistingGrant=null;}
 }
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void autoConnect();});
window.addEventListener('focus',()=>void autoConnect());

OBR.onReady(async()=>{
 available=true;say('Connect your Cosmos account to load your characters.');
 void OBR.action.setIcon(new URL('/owlbear/sheet-action.svg',location.origin).href).catch(()=>{});
 void panelSize(OBR,say).then(dispose=>disposeSize=dispose).catch(error=>say(error.message));
 trackerBus=await localChannel(OBR,data=>{
  if(data?.type==='grant'&&data.token!==grantToken){
   if(autoConnecting)pendingExistingGrant=data.token;
   else attachGrant(data.token);
  }
  if(data?.type==='state'){
   latestBattle=Array.isArray(data.battle)?data.battle:[];latestTurn=data.turn||{};latestReady=data.ready===true;latestAdmin=data.admin===true;latestValidation=data.validation||{weapon:false,ability:false};
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
   document.querySelector('[data-recommend-target]').checked=data.recommendTarget===true;
   for(const key of ['weapon','ability'])document.querySelector('[data-combat-validation="'+key+'"]').checked=data.validation?.[key]===true;
   document.querySelector('[data-admin-controls]').hidden=data.admin!==true;
   for(const key of ['party','initiative','npcHp'])document.querySelector('[data-layout="'+key+'"]').checked=data.layout?.[key]===true;
   document.querySelector('[data-layout="partyDock"]').value=data.layout.partyDock;
   document.querySelector('[data-tracker-status]').textContent=data.feed==='Live'?'Connected':data.feed;
  }
  if(data?.type==='room-rolls')panel.shared(data.rolls);
  if(data?.type==='combat-refresh')void refreshCombatHistory();
  if(data?.type==='combat-decision'){
   say(data.approved?'GM approved combat effect.':'GM rejected combat effect.');void refreshCombatHistory();
  }
  if(data?.type==='result'){
   const handled=initiativeView.result(data);
   if(data.error&&!handled)say(data.error);
  }
 });
 void autoConnect();
 combatHistoryTimer=setInterval(()=>void refreshCombatHistory(),7000);
 trackerBus.send({type:'hello'});
 document.querySelector('[data-admin-controls]').onchange=event=>{
  const node=event.target,key=node.dataset.layout;
  if(node.matches('[data-combat-validation]'))trackerBus.send({type:'combat-validation',key:node.dataset.combatValidation,enabled:node.checked,requestId:crypto.randomUUID()});
  else if(node.matches('[data-recommend-target]'))trackerBus.send({type:'recommend-setting',enabled:node.checked,requestId:crypto.randomUUID()});
  else if(key)trackerBus.send({type:'layout',key,value:node.type==='checkbox'?node.checked:node.value,requestId:crypto.randomUUID()});
 };
});
document.querySelector('[data-connect]').onclick=()=>{
 if(!available){say('Open this extension inside an Owlbear room first.');return;}
 ++autoAttemptGeneration;autoConnecting=false;pendingExistingGrant=null;
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
  ++autoAttemptGeneration;autoConnecting=false;pendingExistingGrant=null;
  attachGrant(event.data.token,{notifyBackground:true});
  popup.postMessage({type:'cosmos:connected-ack',nonce},location.origin);
 }
 const fromFrame=[...openSheets.values()].find(sheet=>event.source===sheet.iframe.contentWindow&&event.data?.nonce===sheet.nonce);
 const fromTab=tabNonce&&event.source===tabWindow&&event.data?.nonce===tabNonce;
 if(fromFrame&&event.data?.type==='cosmos:add-sheet'){
  if(activeCharacterId===fromFrame.id)openPicker();
  return;
 }
 if(fromFrame&&event.data?.type==='cosmos:popout-sheet'){
  if(activeCharacterId===fromFrame.id)openSheetWindow(fromFrame.id);
  return;
 }
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
 clearInterval(combatHistoryTimer);disposeSize?.();panel.close();initiativeView.close();trackerBus?.close();connection?.close();
 for(const sheet of openSheets.values())sheet.connection?.close();
 tabConnection?.close();
},{once:true});
