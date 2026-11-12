import OBR,{buildLine,buildLabel} from '@owlbear-rodeo/sdk';
import {localChannel} from './local-channel.mjs';
import {adminMenu} from './admin-menu.mjs';
import {roomHistory} from './room-history.mjs';
import {connection} from './connection.mjs';
import {publicPartyClient} from './public-party-client.mjs';
import {dockedPanels} from './docking.mjs';
import {initiativeFocus} from './initiative-focus.mjs';
import {uniqueNpcForToken,npcBattleStats} from './npc-battle.mjs';
import {BATTLE,TURN,LAYOUT,BAR,layoutFrom,battleRows,tokenName,normalizeName} from './battle-state.mjs';
const PREFIX='com.cosmos.character-sheets',PARTY=PREFIX+'/party',INIT=PREFIX+'/initiative';
async function start(){
 let bus,token='',grant,admin=false,editableIds=new Set(),gm=await OBR.player.getRole()==='GM',party=[],feed='Connecting…',room={},scene={},items=[],ready=false,grid=150,view=[800,600],epoch=0,queue=Promise.resolve(),rendering=false,again=false,timer,recoverBars=false;
 const popovers=new Map(),bars=new Map(),commits=new Map(),focus=initiativeFocus(OBR);let syncMenu=()=>Promise.resolve(),npcDirectory=null,npcDirectoryAt=0;
 const error=e=>void OBR.notification.show(e.message||String(e),'ERROR');
 const allowed=()=>gm&&admin;
  const canEditParty=id=>Boolean(grant&&(allowed()||editableIds.has(id)));
 const rows=()=>battleRows(items,party);
 const history=await roomHistory(OBR,(rolls,{remote,row})=>{bus?.send({type:'room-rolls',rolls});if(remote&&row)void OBR.notification.show((row.character+' · '+row.parts.map(part=>part.label+' '+part.total).join(' · ')).slice(0,220),'INFO').catch(()=>{});});
 const publish=()=>{void syncMenu();const battle=rows().filter(row=>gm||row.visible),turn=scene[TURN]||{};focus.update(ready?items:[],ready?(turn.id||battle[0]?.id):null);bus?.send({type:'state',admin:allowed(),editableIds:party.filter(row=>canEditParty(row.id)).map(row=>row.id),connected:!!grant,feed,party,battle,turn,layout:layoutFrom(room),ready});};
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>{publish();void render();},40);};
 async function widget(id,path,rectangle){
  const old=popovers.get(id);
  if(!rectangle){if(old){await OBR.popover.close(id);popovers.delete(id);}return;}
  const value=JSON.stringify(rectangle);if(old===value)return;
  const {x,y,width,height,vertical=false}=rectangle,url=new URL(path,location.origin);if(vertical)url.searchParams.set('vertical','1');
  await OBR.popover.open({id,url:url.href,width,height,anchorReference:'POSITION',anchorPosition:{left:x,top:y},anchorOrigin:{horizontal:'LEFT',vertical:'TOP'},transformOrigin:{horizontal:'LEFT',vertical:'TOP'},hidePaper:true,disableClickAway:true,marginThreshold:8});popovers.set(id,value);
 }
 function geometry(){
  return dockedPanels(view,{...layoutFrom(room),initiative:false},party.length,rows().filter(row=>gm||row.visible).length,ready);
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
   if((!gm&&!row.visible)||!row.available||!row.trackHp)continue;const item=items.find(item=>item.id===row.id);if(!item)continue;active.add(row.id);
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
  const candidate=connection(value),capabilities=await candidate.call('capabilities');grant?.close();grant=candidate;token=value;admin=capabilities.admin===true;npcDirectory=null;npcDirectoryAt=0;editableIds=new Set();if(capabilities.scope==='sheet'){const owned=await candidate.call('list');editableIds=new Set(owned.map(row=>row.id));}commits.clear();publish();bus.send({type:'grant',token});
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
 async function command(d){
  if(d.type!=='stats'&&!allowed())throw Error('Connect a Cosmos administrator account as GM.');
  if(d.epoch!==undefined&&d.epoch!==epoch)throw Error('The scene changed. Try again in this scene.');
  if(d.type==='layout'){
   const l=layoutFrom(room);if(['party','initiative'].includes(d.key)&&typeof d.value==='boolean')l[d.key]=d.value;
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
   if(!site&&!npc&&!d.stats){bus.send({type:'setup',id:item.id,name:tokenName(item)});await OBR.popover.open({id:PREFIX+'/setup',url:new URL('/owlbear/battle-add.html?id='+encodeURIComponent(item.id)+'&name='+encodeURIComponent(tokenName(item)),location.origin).href,width:280,height:320});return;}
   const stats=site||npc||d.stats,trackHp=!!site||stats.hp!==null&&stats.hp!==undefined&&stats.hp>0;
   if(['mp','ac',...(trackHp?['hp']:[])].some(key=>!Number.isFinite(stats[key])||Math.abs(stats[key])>=1e7)||stats.initiative!==undefined&&(!Number.isFinite(stats.initiative)||Math.abs(stats.initiative)>9999)||!site&&(stats.mp<0||stats.hp!==null&&stats.hp!==undefined&&(!Number.isFinite(stats.hp)||stats.hp<0)))throw Error('Enter valid starting stats, or leave HP blank.');
   const data={enabled:true,siteId:site?.id||null,...(npc?{npcId:npc.npcId,hpRoll:npc.hpRoll}:{}),trackHp,hp:trackHp?stats.hp:0,hpMax:trackHp?stats.hp:0,mp:stats.mp,mpMax:stats.mp,ac:stats.ac,touch:stats.touch??stats.ac,flat:stats.flat??stats.ac,cmd:stats.cmd??10,initiative:stats.initiative||0,order:Date.now()};
   await OBR.scene.items.updateItems([item.id],drafts=>{for(const draft of drafts)draft.metadata[BATTLE]=data;});await OBR.popover.close(PREFIX+'/setup');
   if(npc){const text='NPC '+tokenName(item)+' added · HP '+npc.hp+(npc.hpRoll?' (rolled '+npc.hpRoll.expression+')':' (printed)');void OBR.notification.show(text.slice(0,220),'INFO').catch(()=>{});}
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
  if(d?.type==='highlight'){const row=rows().find(row=>row.id===d.id&&(gm||row.visible));focus.hover(ready&&row?row.id:null);return;}
  if(d?.type==='grant-set'){queue=queue.then(()=>setGrant(d.token)).catch(e=>{admin=false;publish();error(e);});return;}
  if(!['layout','stats','initiative','turn','add','remove'].includes(d?.type))return;
  d.epoch=epoch;queue=queue.then(async()=>{try{const result=await command(d);bus.send({type:'result',requestId:d.requestId,revision:result?.revision});}catch(e){bus.send({type:'result',requestId:d.requestId,error:e.message});if(!d.requestId)error(e);}});
 });
 async function refreshAccess(){const current=grant;if(!current)return;try{const cap=await current.call('capabilities'),owned=cap.scope==='sheet'?await current.call('list'):[];if(grant!==current)return;admin=cap.admin===true;editableIds=new Set(owned.map(row=>row.id));publish();}catch{if(grant!==current)return;admin=false;editableIds.clear();publish();}}
 const accessTimer=setInterval(()=>void refreshAccess(),30000);
 const stop=publicPartyClient(snapshot=>{party=snapshot.characters;schedule();},status=>{feed=status;publish();});
 room=await OBR.room.getMetadata();OBR.room.onMetadataChange(value=>{room=value;schedule();});
 async function loadScene(){
  const current=++epoch;ready=false;bars.clear();items=[];scene={};schedule();void OBR.popover.close(PREFIX+'/setup').catch(()=>{});
  const loaded=await OBR.scene.isReady();if(current!==epoch)return;
  if(loaded){const result=await Promise.all([OBR.scene.items.getItems(),OBR.scene.getMetadata(),OBR.scene.grid.getDpi()]);if(current!==epoch)return;[items,scene,grid]=result;
   const obsolete=await OBR.scene.local.getItems(item=>!!item.metadata[BAR]||!!item.metadata['com.cosmos.party-status/token-resource']);if(current!==epoch)return;if(obsolete.length)await OBR.scene.local.deleteItems(obsolete.map(item=>item.id));
  }if(current===epoch){ready=loaded;schedule();}
 }
 OBR.scene.onReadyChange(()=>{void loadScene().catch(error);});OBR.scene.items.onChange(value=>{if(ready){items=value;schedule();}});OBR.scene.onMetadataChange(value=>{scene=value;schedule();});OBR.scene.grid.onChange(value=>{grid=value.dpi;schedule();});
 OBR.player.onChange(value=>{gm=value.role==='GM';publish();schedule();});
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
 publish();window.addEventListener('pagehide',()=>{stopped=true;history.close();clearInterval(accessTimer);clearInterval(viewportTimer);window.removeEventListener('resize',resize);stop();bus.close();grant?.close();void focus.close();clearTimeout(timer);},{once:true});
}
OBR.onReady(()=>void start().catch(e=>console.error('Cosmos:',e)));
