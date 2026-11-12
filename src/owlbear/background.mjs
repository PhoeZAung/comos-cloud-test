import OBR,{buildLine,buildLabel,buildShape} from '@owlbear-rodeo/sdk';
import {localChannel} from './local-channel.mjs';
import {adminMenu} from './admin-menu.mjs';
import {roomHistory} from './room-history.mjs';
import {connection} from './connection.mjs';
import {publicPartyClient} from './public-party-client.mjs';
import {dockedPanels} from './docking.mjs';
import {initiativeFocus} from './initiative-focus.mjs';
import {recommendTarget} from './target-recommendation.mjs';
import {COMBAT_CHANNEL,VALIDATION,validationFrom} from './combat-effects.mjs';
import {applyNpcTokenReceipt} from './combat-npc.mjs';
import {uniqueNpcForToken,npcBattleStats,rollNpcInitiative} from './npc-battle.mjs';
import {BATTLE,TURN,LAYOUT,BAR,layoutFrom,battleRows,battleForViewer,battleHpForViewer,turnForViewer,tokenName,normalizeName} from './battle-state.mjs';
const PREFIX='com.cosmos.character-sheets',PARTY=PREFIX+'/party',INIT=PREFIX+'/initiative',RECOMMEND_SETTING=PREFIX+'/recommend-target';
async function start(){
 let bus,token='',grant,admin=false,editableIds=new Set(),gm=await OBR.player.getRole()==='GM',party=[],feed='Connecting…',room={},scene={},items=[],ready=false,grid=150,view=[800,600],epoch=0,queue=Promise.resolve(),rendering=false,again=false,timer,recoverBars=false;
 let recommendEnabled=false;try{recommendEnabled=localStorage.getItem(RECOMMEND_SETTING)==='true';}catch{}
 const npcIntCache=new Map(),approvals=new Map();
 const popovers=new Map(),bars=new Map(),commits=new Map(),focus=initiativeFocus(OBR,buildShape);focus.setShowHidden(gm);let syncMenu=()=>Promise.resolve(),npcDirectory=null,npcDirectoryAt=0;
 const error=e=>void OBR.notification.show(e.message||String(e),'ERROR');
 const allowed=()=>gm&&admin;
  const canEditParty=id=>Boolean(grant&&(allowed()||editableIds.has(id)));
 const rows=()=>battleRows(items,party);
 // Intelligence stays in GM memory, never in the shared token metadata.
 function npcIntelligence(id){
  if(typeof id!=='string'||!(/^[0-9a-f-]{36}$/i.test(id))||!allowed()||!grant)return null;
  if(npcIntCache.has(id))return npcIntCache.get(id);
  const current=grant;
  npcIntCache.set(id,null); // One in-flight request per NPC.
  void current.call('api',{method:'GET',path:'/api/v1/character-records/'+id}).then(response=>{
   if(grant!==current)return;
   const character=response.status===200?response.data?.character:null;
   const value=character?.kind==='npc'?(character.data?.npcStats?.int??character.data?.int):null;
   npcIntCache.set(id,Number.isFinite(value)?value:null);
   schedule();
  }).catch(()=>{if(grant===current)npcIntCache.set(id,null);});
  return null;
 }
 const history=await roomHistory(OBR,(rolls,{remote,row})=>{bus?.send({type:'room-rolls',rolls});if(remote&&row)void OBR.notification.show((row.character+' · '+row.parts.map(part=>part.label+' '+part.total).join(' · ')).slice(0,220),'INFO').catch(()=>{});});
 const publish=()=>{
  void syncMenu();
  const visible=battleForViewer(rows(),gm),battle=battleHpForViewer(visible,{gm,npcHp:layoutFrom(room).npcHp}),turn=turnForViewer(scene[TURN],battle,gm);
  const activeId=ready?(turn.id===null?null:(turn.id||battle[0]?.id)):null;
  focus.update(ready?items:[],activeId);
  const active=visible.find(row=>row.id===activeId);
  const npcId=active?.isNpc?items.find(item=>item.id===activeId)?.metadata?.[BATTLE]?.npcId:null;
  const target=ready&&allowed()&&recommendEnabled&&active?.isNpc?
   recommendTarget({attacker:active,battle:visible,items,intelligence:npcIntelligence(npcId),grid}):null;
  focus.recommend(target?.id||null);
  // NPC record IDs are visible only to an authenticated GM, for matching
  // their opened Cosmos sheet to the acting Owlbear token.
  const viewerBattle=allowed()?battle.map(row=>row.isNpc?{...row,npcId:items.find(item=>item.id===row.id)?.metadata?.[BATTLE]?.npcId||null}:row):battle;
  bus?.send({type:'state',admin:allowed(),gm,recommendTarget:allowed()&&recommendEnabled,
   validation:validationFrom(room),approvals:allowed()?[...approvals.values()].map(({requestId,actorName,targetName,kind,at})=>({requestId,actorName,targetName,kind,at})):[],
   editableIds:party.filter(row=>canEditParty(row.id)).map(row=>row.id),
   connected:!!grant,feed,party,battle:viewerBattle,turn,layout:layoutFrom(room),ready});
 };
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>{publish();void render();},40);};
 async function widget(id,path,rectangle){
  const old=popovers.get(id);
  if(!rectangle){if(old){await OBR.popover.close(id);popovers.delete(id);}return;}
  const value=JSON.stringify(rectangle);if(old===value)return;
  const {x,y,width,height,vertical=false}=rectangle,url=new URL(path,location.origin);if(vertical)url.searchParams.set('vertical','1');
  await OBR.popover.open({id,url:url.href,width,height,anchorReference:'POSITION',anchorPosition:{left:x,top:y},anchorOrigin:{horizontal:'LEFT',vertical:'TOP'},transformOrigin:{horizontal:'LEFT',vertical:'TOP'},hidePaper:true,disableClickAway:true,marginThreshold:8});popovers.set(id,value);
 }
 function geometry(){
  return dockedPanels(view,{...layoutFrom(room),initiative:false},party.length,battleForViewer(rows(),gm).length,ready);
 }
 function healthItems(item,row){
  const ratio=grid/(item.grid?.dpi||grid),sx=ratio*Math.abs(item.scale?.x||1),sy=ratio*Math.abs(item.scale?.y||1),angle=(item.rotation||0)*Math.PI/180;
  const dx=((item.image?.width||grid)/2-(item.grid?.offset?.x||0))*sx,dy=((item.image?.height||grid)/2-(item.grid?.offset?.y||0))*sy;
  const cx=item.position.x+dx*Math.cos(angle)-dy*Math.sin(angle),cy=item.position.y+dx*Math.sin(angle)+dy*Math.cos(angle),extent=(Math.abs((item.image?.height||grid)*sy*Math.cos(angle))+Math.abs((item.image?.width||grid)*sx*Math.sin(angle)))/2;
  const width=Math.max(grid*.65,Math.min(grid*1.4,(item.image?.width||grid)*sx)),h=grid*.055,left=cx-width/2,top=cy-extent-grid*.17,fraction=Math.max(0,Math.min(1,row.hp/Math.max(1,row.hpMax))),base=()=>({[BAR]:{tokenId:item.id}});
  const common=builder=>builder.layer('TEXT').attachedTo(item.id).disableAttachmentBehavior(['ROTATION','SCALE','COPY']).disableHit(true).locked(true).visible(item.visible!==false).zIndex(item.zIndex+10).disableAutoZIndex(true).metadata(base());
  const line=(length,color,z)=>common(buildLine()).zIndex(item.zIndex+z).position({x:left,y:top}).startPosition({x:0,y:0}).endPosition({x:Math.max(.01,length),y:0}).strokeColor(color).strokeWidth(h).build();
  return [line(width,'#6b3347',10),line(width*fraction,fraction>.5?'#6adb8f':fraction>.25?'#efc467':'#f47e91',11),common(buildLabel()).zIndex(item.zIndex+12).position({x:cx,y:top-h}).width(width).height(grid*.15).plainText(String(row.hp)+' / '+row.hpMax).fontSize(grid*.105).fontWeight(700).padding(0).pointerWidth(0).pointerHeight(0).backgroundOpacity(0).textAlign('CENTER').fillColor('#ffffff').strokeColor('#151020').strokeWidth(2).build()];
 }
 async function health(){
  if(!ready)return;const generation=epoch,l=layoutFrom(room),active=new Set(),add=[],updates=[],remove=[];
  if(recoverBars){const old=await OBR.scene.local.getItems(item=>!!item.metadata[BAR]);if(generation!==epoch||!ready)return;if(old.length)await OBR.scene.local.deleteItems(old.map(item=>item.id));bars.clear();recoverBars=false;}
  if(l.initiative)for(const row of rows()){
   if((!gm&&!row.visible)||!row.available||!row.trackHp||!gm&&!row.siteId&&!l.npcHp)continue;const item=items.find(item=>item.id===row.id);if(!item)continue;active.add(row.id);
   const desired=healthItems(item,row),signature=JSON.stringify(desired.map(({id,lastModified,lastModifiedUserId,...value})=>value)),old=bars.get(row.id);
   if(old?.signature===signature)continue;
   if(old){desired.forEach((value,index)=>updates.push({...value,id:old.ids[index]}));bars.set(row.id,{ids:old.ids,signature});}
   else{add.push(...desired);bars.set(row.id,{ids:desired.map(value=>value.id),signature});}
  }
  for(const [id,old] of bars)if(!active.has(id)){remove.push(...old.ids);bars.delete(id);}
  if(generation!==epoch||!ready)return;
  if(remove.length)await OBR.scene.local.deleteItems(remove);
  if(generation!==epoch||!ready)return;
  if(updates.length){const map=new Map(updates.map(item=>[item.id,item]));await OBR.scene.local.updateItems([...map.keys()],drafts=>{for(const item of drafts){const value=map.get(item.id);for(const key of ['position','visible','startPosition','endPosition','style','text','zIndex'])if(value[key]!==undefined)item[key]=value[key];}});}
  if(generation!==epoch||!ready)return;
  if(add.length)await OBR.scene.local.addItems(add);
 }
 async function render(){
  again=true;if(rendering)return;rendering=true;
  try{while(again){again=false;const rectangles=geometry();await widget(PARTY,'/owlbear/party/overlay.html',rectangles.party);await widget(INIT,'/owlbear/initiative.html',null);await health();}}
  catch(e){recoverBars=true;console.error('Cosmos display:',e.message);}finally{rendering=false;}
 }
 async function setGrant(value){
  if(typeof value!=='string'||!/^[a-f0-9]{64}$/.test(value))return;
  const candidate=connection(value),capabilities=await candidate.call('capabilities');grant?.close();grant=candidate;token=value;admin=capabilities.admin===true;npcDirectory=null;npcDirectoryAt=0;npcIntCache.clear();editableIds=new Set();if(capabilities.scope==='sheet'){const owned=await candidate.call('list');editableIds=new Set(owned.map(row=>row.id));}commits.clear();publish();bus.send({type:'grant',token});
 }
 async function npcStatsForToken(name){
  if(!allowed()||!grant)return null;
  const current=grant;
  if(!npcDirectory||Date.now()-npcDirectoryAt>30000){
   npcDirectory=current.call('npc-list').catch(error=>{if(grant===current)npcDirectory=null;throw error;});
   npcDirectoryAt=Date.now();
  }
  const all=await npcDirectory;
  if(grant!==current||!allowed())throw Error('NPC access changed. Reconnect Cosmos.');
  const npc=uniqueNpcForToken(name,all);
  if(!npc)return null;
  const response=await current.call('api',{method:'GET',path:'/api/v1/character-records/'+npc.id});
  if(grant!==current||!allowed())throw Error('NPC access changed. Reconnect Cosmos.');
  if(response.status!==200||response.data?.character?.id!==npc.id)throw Error('Could not read matching NPC sheet.');
  return npcBattleStats(response.data.character);
 }
 async function siteStats(id,revision,stats){
  if(!canEditParty(id))throw Error('Connect your Cosmos account to edit your own character.');
  const last=commits.get(id),expected=last&&revision===last.from?last.to:revision;
  const result=await grant.call('party-stats',{id,revision:expected,stats});commits.set(id,{from:last&&revision===last.from?last.from:revision,to:result.revision});return result;
 }
 async function applyReceipt(request){
  if(!grant)throw Error('Connect your Cosmos account before resolving combat.');
  const actor=rows().find(row=>row.id===request.actorTokenId);
  const target=rows().find(row=>row.id===request.targetTokenId);
  if(!actor||!target||!actor.available||!target.available)throw Error('Combatants are no longer in battle.');
  const actorSheetId=actor.isNpc?items.find(item=>item.id===actor.id)?.metadata?.[BATTLE]?.npcId:actor.siteId;
  if(actorSheetId!==request.actorSheetId)throw Error('The actor token no longer matches its character.');
  const payload={
   roomId:OBR.room.id,requestId:request.requestId,actorSheetId,actorTokenId:actor.id,
   targetTokenId:target.id,targetSheetId:target.siteId||null,targetName:target.name,
   targetAc:target[request.defense],targetHp:target.hp,targetHpMax:target.hpMax,targetHpTemp:target.hpTemp??0,
   defense:request.defense,round:request.round
  };
  const response=await grant.call('combat-apply',payload);
  let event=response.event;
  if(response.needsNpcUpdate){
   const result=await applyNpcTokenReceipt(OBR,{tokenId:target.id,receiptId:request.requestId,effect:event});
   event=await grant.call('combat-finalize',{roomId:OBR.room.id,requestId:request.requestId,
    before:result.before||event.before,after:result.after||event.after});
  }
  schedule();bus?.send({type:'combat-refresh'});
  return event;
 }
 async function command(d){
  if(d.type!=='stats'&&!allowed())throw Error('Connect a Cosmos administrator account as GM.');
  if(d.epoch!==undefined&&d.epoch!==epoch)throw Error('The scene changed. Try again in this scene.');
  if(d.type==='combat-validation'){
   if(!['weapon','ability'].includes(d.key)||typeof d.enabled!=='boolean')throw Error('Choose a valid validation setting.');
   const settings={...validationFrom(room),[d.key]:d.enabled};
   await grant.call('combat-settings',{roomId:OBR.room.id,settings});
   await OBR.room.setMetadata({[VALIDATION]:settings});room={...room,[VALIDATION]:settings};schedule();return;
  }
  if(d.type==='combat-decision'){
   const request=approvals.get(d.id);
   if(!request)throw Error('This approval request has expired or was already handled.');
   approvals.delete(d.id);
   if(d.approve===true){
    try{await applyReceipt(request);void OBR.broadcast.sendMessage(COMBAT_CHANNEL,{type:'decision',requestId:d.id,approved:true},{destination:'REMOTE'}).catch(()=>{});}
    catch(error){approvals.set(d.id,request);throw error;}
   }else void OBR.broadcast.sendMessage(COMBAT_CHANNEL,{type:'decision',requestId:d.id,approved:false},{destination:'REMOTE'}).catch(()=>{});
   schedule();return;
  }
  if(d.type==='end-battle'){
   const all=rows();if(!all.length)throw Error('There is no active battle to end.');
   await OBR.scene.items.updateItems(all.map(row=>row.id),drafts=>{for(const item of drafts)delete item.metadata[BATTLE];});
   const cleared={id:null,round:1};await OBR.scene.setMetadata({[TURN]:cleared});scene={...scene,[TURN]:cleared};
   approvals.clear();
   await grant.call('combat-end',{roomId:OBR.room.id});
   schedule();bus?.send({type:'combat-refresh'});return;
  }
  if(d.type==='recommend-setting'){
   if(typeof d.enabled!=='boolean')throw Error('Choose whether to recommend a target.');
   recommendEnabled=d.enabled;
   try{localStorage.setItem(RECOMMEND_SETTING,String(recommendEnabled));}catch{}
   schedule();return;
  }
  if(d.type==='layout'){
   const l=layoutFrom(room);if(['party','initiative','npcHp'].includes(d.key)&&typeof d.value==='boolean')l[d.key]=d.value;
   else if(d.key==='partyDock'&&['left','right','top','bottom'].includes(d.value))l.partyDock=d.value;
   else if(d.key==='initiativeDock'&&['left','right'].includes(d.value))l.initiativeDock=d.value;
   else throw Error('Invalid display setting.');await OBR.room.setMetadata({[LAYOUT]:l});room={...room,[LAYOUT]:l};schedule();return;
  }
  if(d.type==='stats'){
   if(!['hp','mp'].includes(d.key)||!Number.isFinite(d.value)||Math.abs(d.value)>=1e7||d.key==='mp'&&d.value<0)throw Error('Enter a valid current value.');
   const battle=d.battle?rows().find(row=>row.id===d.id):null,siteId=battle?.siteId||(!d.battle?d.id:null);
   if(battle?.linked&&!battle.available)throw Error('This sheet is no longer shared.');
   if(battle&&d.key==='hp'&&!battle.trackHp)throw Error('HP is not tracked for this combatant.');
   if(siteId){const row=party.find(row=>row.id===siteId);if(!row)throw Error('This sheet is no longer shared.');if(!canEditParty(siteId))throw Error('Only the character owner or GM can edit this value.');return siteStats(siteId,d.revision??row.revision,{[d.key]:d.value});}
   if(!allowed())throw Error('Only the GM can edit unlinked combatants.');
    if(!battle)throw Error('Combatant not found.');await OBR.scene.items.updateItems([battle.id],drafts=>{for(const item of drafts){if(item.metadata[BATTLE]?.enabled)item.metadata[BATTLE][d.key]=d.value;}});return;
  }
  if(!ready)throw Error('Open a scene first.');
  if(d.type==='initiative'){
   if(!Number.isFinite(d.value)||Math.abs(d.value)>9999)throw Error('Enter a valid initiative.');
   await OBR.scene.items.updateItems([d.id],drafts=>{for(const item of drafts)if(item.metadata[BATTLE]?.enabled)item.metadata[BATTLE].initiative=d.value;});return;
  }
  if(d.type==='turn'){
   const sorted=rows();if(!sorted.length)return;const turn=scene[TURN]||{},index=Math.max(0,sorted.findIndex(row=>row.id===turn.id));let next=index,round=Math.max(1,Number(turn.round)||1);
   if(d.direction===-1){next=(index-1+sorted.length)%sorted.length;if(index===0)round=Math.max(1,round-1);}
   else{next=(index+1)%sorted.length;if(next===0)round++;}
   const value={id:sorted[next].id,round};await OBR.scene.setMetadata({[TURN]:value});scene={...scene,[TURN]:value};schedule();await focus.locate(value.id);return;
  }
  if(d.type==='add'){
   const item=items.find(item=>item.id===d.id);if(!item||item.type!=='IMAGE'||item.layer!=='CHARACTER')throw Error('Select a character token.');
   if(item.metadata?.[BATTLE]?.enabled)return;
   if(rows().length>=100)throw Error('This scene already has 100 combatants.');
   const matches=party.filter(row=>normalizeName(row.name)===normalizeName(tokenName(item))),site=matches.length===1?matches[0]:null;
   const npc=!site&&!d.stats?await npcStatsForToken(tokenName(item)):null;
   if(npc)npcIntCache.set(npc.npcId,npc.intelligence);
   if(!site&&!npc&&!d.stats){bus.send({type:'setup',id:item.id,name:tokenName(item)});await OBR.popover.open({id:PREFIX+'/setup',url:new URL('/owlbear/battle-add.html?id='+encodeURIComponent(item.id)+'&name='+encodeURIComponent(tokenName(item)),location.origin).href,width:280,height:320});return;}
   const stats=site||npc||d.stats,trackHp=!!site||stats.hp!==null&&stats.hp!==undefined&&stats.hp>0;
    const rolledInitiative=npc?rollNpcInitiative(npc.initiative):null;
   if(['mp','ac',...(trackHp?['hp']:[])].some(key=>!Number.isFinite(stats[key])||Math.abs(stats[key])>=1e7)||stats.initiative!==undefined&&(!Number.isFinite(stats.initiative)||Math.abs(stats.initiative)>9999)||!site&&(stats.mp<0||stats.hp!==null&&stats.hp!==undefined&&(!Number.isFinite(stats.hp)||stats.hp<0)))throw Error('Enter valid starting stats, or leave HP blank.');
   const data={enabled:true,siteId:site?.id||null,...(npc?{npcId:npc.npcId,hpRoll:npc.hpRoll}:{}),trackHp,hp:trackHp?stats.hp:0,hpMax:trackHp?stats.hp:0,mp:stats.mp,mpMax:stats.mp,ac:stats.ac,touch:stats.touch??stats.ac,flat:stats.flat??stats.ac,cmd:stats.cmd??10,initiative:rolledInitiative?.total??(stats.initiative||0),...(rolledInitiative?{initiativeRoll:rolledInitiative}:{}),order:Date.now()};
   await OBR.scene.items.updateItems([item.id],drafts=>{for(const draft of drafts)draft.metadata[BATTLE]=data;});await OBR.popover.close(PREFIX+'/setup');
   if(npc){const text='NPC '+tokenName(item)+' added · Initiative '+rolledInitiative.total+' (d20 '+rolledInitiative.d20+' + '+rolledInitiative.bonus+') · HP '+npc.hp+(npc.hpRoll?' (rolled '+npc.hpRoll.expression+')':' (printed)');void OBR.notification.show(text.slice(0,220),'INFO').catch(()=>{});}
   return;
  }
  if(d.type==='remove'){
   const sorted=rows(),index=sorted.findIndex(row=>row.id===d.id),current=scene[TURN];
   await OBR.scene.items.updateItems([d.id],drafts=>{for(const item of drafts)delete item.metadata[BATTLE];});
   if(current?.id===d.id){const remaining=sorted.filter(row=>row.id!==d.id);await OBR.scene.setMetadata({[TURN]:{id:remaining[Math.max(0,index)%Math.max(1,remaining.length)]?.id||null,round:Math.max(1,Number(current.round)||1)}});}
  }
 }
 bus=await localChannel(OBR,d=>{
  if(d?.type==='hello'){publish();bus.send({type:'room-rolls',rolls:history.rows()});if(token)bus.send({type:'grant',token});void refreshAccess();return;}
  if(d?.type==='roll-receipt'){void history.publish(d.entry,d.target).catch(error);return;}
  if(d?.type==='highlight'){const row=battleForViewer(rows(),gm).find(row=>row.id===d.id);focus.hover(ready&&row?row.id:null);return;}
  // Center only this viewer's camera. Players cannot locate GM-hidden combatants.
  if(d?.type==='locate'){const row=ready?battleForViewer(rows(),gm).find(row=>row.id===d.id):null;if(row)void focus.locate(row.id).catch(error=>console.warn('Initiative locate:',error.message));return;}
  if(d?.type==='grant-set'){queue=queue.then(()=>setGrant(d.token)).catch(e=>{admin=false;publish();error(e);});return;}
  if(!['layout','recommend-setting','combat-validation','combat-decision','end-battle','stats','initiative','turn','add','remove'].includes(d?.type))return;
  d.epoch=epoch;queue=queue.then(async()=>{try{const result=await command(d);bus.send({type:'result',requestId:d.requestId,revision:result?.revision});}catch(e){bus.send({type:'result',requestId:d.requestId,error:e.message});if(!d.requestId)error(e);}});
 });
 async function refreshAccess(){const current=grant;if(!current)return;try{const cap=await current.call('capabilities'),owned=cap.scope==='sheet'?await current.call('list'):[];if(grant!==current)return;admin=cap.admin===true;editableIds=new Set(owned.map(row=>row.id));publish();}catch{if(grant!==current)return;admin=false;editableIds.clear();publish();}}
 const accessTimer=setInterval(()=>void refreshAccess(),30000);
 const stop=publicPartyClient(snapshot=>{party=snapshot.characters;schedule();},status=>{feed=status;publish();});
 const stopApprovals=OBR.broadcast.onMessage(COMBAT_CHANNEL,event=>{
  const d=event.data;
  if(d?.type==='decision'){
   bus?.send({type:'combat-decision',requestId:d.requestId,approved:d.approved===true});return;
  }
  if(!allowed()||d?.type!=='request'||typeof d?.request?.requestId!=='string')return;
  const request=d.request;
  if(!/^[0-9a-f-]{36}$/i.test(request.requestId)||!['weapon','ability','spell'].includes(request.source)||
    !['damage','heal','temp_hp'].includes(request.kind)||!['ac','touch','cmd'].includes(request.defense)||
    typeof request.actorSheetId!=='string'||typeof request.actorTokenId!=='string'||typeof request.targetTokenId!=='string'||
    request.actorTokenId.length>128||request.targetTokenId.length>128||
    !Number.isInteger(request.round)||request.round<1)return;
  const wanted=request.source==='weapon'?'weapon':'ability';
  if(!validationFrom(room)[wanted]&&!request.forceReview)return;
  const actual=rows(),actor=actual.find(row=>row.id===request.actorTokenId),target=actual.find(row=>row.id===request.targetTokenId);
  if(!actor||!target||!actor.available||!target.available)return;
  const sheetId=actor.isNpc?items.find(item=>item.id===actor.id)?.metadata?.[BATTLE]?.npcId:actor.siteId;
  if(sheetId!==request.actorSheetId)return;
  if(approvals.size>=40)approvals.delete(approvals.keys().next().value);
  approvals.set(request.requestId,{...request,actorName:actor.name,targetName:target.name,at:Date.now()});
  schedule();
 });
 room=await OBR.room.getMetadata();OBR.room.onMetadataChange(value=>{room=value;schedule();});
 async function loadScene(){
  const current=++epoch;ready=false;bars.clear();approvals.clear();items=[];scene={};schedule();void OBR.popover.close(PREFIX+'/setup').catch(()=>{});
  const loaded=await OBR.scene.isReady();if(current!==epoch)return;
  if(loaded){const result=await Promise.all([OBR.scene.items.getItems(),OBR.scene.getMetadata(),OBR.scene.grid.getDpi()]);if(current!==epoch)return;[items,scene,grid]=result;
   const obsolete=await OBR.scene.local.getItems(item=>!!item.metadata[BAR]||!!item.metadata['com.cosmos.party-status/token-resource']);if(current!==epoch)return;if(obsolete.length)await OBR.scene.local.deleteItems(obsolete.map(item=>item.id));
  }if(current===epoch){ready=loaded;schedule();}
 }
 OBR.scene.onReadyChange(()=>{void loadScene().catch(error);});OBR.scene.items.onChange(value=>{if(ready){items=value;schedule();}});OBR.scene.onMetadataChange(value=>{scene=value;schedule();});OBR.scene.grid.onChange(value=>{grid=value.dpi;schedule();});
 OBR.player.onChange(value=>{gm=value.role==='GM';focus.setShowHidden(gm);publish();schedule();});
 // Background iframes do not reliably receive parent-window resize/zoom events.
 // Read only dimensions, not scene data, and redraw only when they change.
 let measuring=false,stopped=false;
 const resize=async()=>{if(measuring||stopped)return;measuring=true;try{const next=await Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]);if(!stopped&&next.every(value=>Number.isFinite(value)&&value>0)&&(next[0]!==view[0]||next[1]!==view[1])){view=next;schedule();}}catch(e){console.debug('Cosmos viewport:',e.message);}finally{measuring=false;}};
 window.addEventListener('resize',resize);const viewportTimer=setInterval(()=>void resize(),750);await resize();await loadScene();
 syncMenu=adminMenu(OBR,allowed,{id:PREFIX+'/battle-toggle',icons:[{icon:new URL('/owlbear/battle-add.svg',location.origin).href,label:'Add to battle',filter:{roles:['GM'],min:1,max:1,every:[{key:'type',value:'IMAGE'},{key:'layer',value:'CHARACTER'},{key:['metadata',BATTLE,'enabled'],value:true,operator:'!='}]}},{icon:new URL('/owlbear/battle-remove.svg',location.origin).href,label:'Remove from battle',filter:{roles:['GM'],min:1,max:1,every:[{key:'type',value:'IMAGE'},{key:'layer',value:'CHARACTER'},{key:['metadata',BATTLE,'enabled'],value:true}]}}],onClick:context=>{
  const item=context.items[0];if(!item)return;if(!allowed()){void OBR.action.open();error(Error('Connect a Cosmos administrator account first.'));return;}
  const generation=epoch;queue=queue.then(()=>command({type:item.metadata?.[BATTLE]?.enabled?'remove':'add',id:item.id,epoch:generation})).catch(error);
 }},error);
 await syncMenu();
 // Close widgets left by the retired standalone Party extension in this browser.
 await Promise.allSettled([INIT,'com.cosmos.party-status/hud/party','com.cosmos.party-status/hud/battle'].map(id=>OBR.popover.close(id)));
 publish();window.addEventListener('pagehide',()=>{stopped=true;stopApprovals();history.close();clearInterval(accessTimer);clearInterval(viewportTimer);window.removeEventListener('resize',resize);stop();bus.close();grant?.close();void focus.close();clearTimeout(timer);},{once:true});
}
OBR.onReady(()=>void start().catch(e=>console.error('Cosmos:',e)));
