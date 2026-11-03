import OBR from '@owlbear-rodeo/sdk';
import {UI,HUD,stateFrom} from './party-state.mjs';
import {TRACKER,trackerConfig,trackerRows,memberships,removeMember,advanceTurn,saveTracker} from './tracker.mjs';
OBR.onReady(async()=>{
 const ownId=await OBR.player.getConnectionId(),preference='cosmos.tracker.panels.v2.'+OBR.room.id;
 let metadata=await OBR.room.getMetadata(),layout={},opened=new Map(),pending=false,working=false;
 try{layout=JSON.parse(localStorage.getItem(preference))||{};}catch{}
 async function render(){
  pending=true;if(working)return;working=true;
  try{while(pending){pending=false;
   const config=trackerConfig(metadata),[vw,vh]=await Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]);
   for(const mode of ['party','battle']){
    const id=HUD+'/'+mode;if(!config.views[mode]){if(opened.has(id)){await OBR.popover.close(id);opened.delete(id);}continue;}
    const settings=layout[mode]||{},density=settings.density||(mode==='battle'?'compact':'normal');
    const count=trackerRows(metadata,mode).length,cardWidth={normal:243,compact:205,tiny:165}[density]||243;
    const width=Math.min(vw-24,mode==='party'?(count?Math.min(880,vw-80,24+count*cardWidth):160):410),height=Math.min(vh-100,mode==='party'?(count?({normal:190,compact:146,tiny:112}[density]||190):40):480);
    const x=Math.max(8,Math.min(vw-width-8,settings.x??(mode==='party'?Math.max(68,(vw-width)/2):68))),y=Math.max(8,Math.min(vh-height-8,settings.y??(mode==='party'?16:220)));
    const shape=JSON.stringify([width,height,x,y,density]);if(opened.get(id)===shape)continue;
    const url=new URL('/owlbear/party/overlay.html',location.origin);url.search=new URLSearchParams({mode,density,x:String(x),y:String(y)});
    await OBR.popover.open({id,url:url.href,width,height,anchorReference:'POSITION',anchorPosition:{left:x,top:y},anchorOrigin:{horizontal:'LEFT',vertical:'TOP'},transformOrigin:{horizontal:'LEFT',vertical:'TOP'},hidePaper:true,disableClickAway:true,marginThreshold:8});opened.set(id,shape);
   }
  }}catch(e){console.error(e.message);}finally{working=false;}
 }
 OBR.room.onMetadataChange(value=>{metadata=value;void render();});
 // Serialize edits so quick initiative changes and membership clicks cannot overwrite one another.
 let edits=Promise.resolve();
 OBR.scene.onReadyChange(ready=>{
  if(ready)return;
  edits=edits.then(async()=>{
   if(await OBR.player.getRole()!=='GM')return;
   await saveTracker(OBR,c=>{
    const tokenIds=new Set((c.tokens||[]).map(t=>t.id));c.tokens=[];c.battle=[];c.battleHidden=[];c.initiatives={};c.round=1;delete c.turn;
    c.hidden=(c.hidden||[]).filter(id=>!tokenIds.has(id));
    for(const id of tokenIds)if(c.photos)delete c.photos[id];
   });
  }).catch(e=>OBR.notification.show(e.message,'ERROR'));
 });
 OBR.broadcast.onMessage(UI,event=>{
  if(event.connectionId!==ownId||!event.data)return;const d=event.data;
  edits=edits.then(async()=>{
   const mode=d.view==='battle'?'battle':'party';
   if(d.move||d.density){layout[mode]||={};if(d.move&&Number.isFinite(d.move.x)&&Number.isFinite(d.move.y))Object.assign(layout[mode],d.move);if(['normal','compact','tiny'].includes(d.density))layout[mode].density=d.density;try{localStorage.setItem(preference,JSON.stringify(layout));}catch{}void render();}
   if(d.toggle&&['party','battle'].includes(d.toggle))await saveTracker(OBR,c=>{c.views[d.toggle]=!c.views[d.toggle];});
   if(d.battle)await saveTracker(OBR,c=>{const token=c.tokens?.find(t=>t.id===d.battle);if(token)token.memberships={...memberships(token),battle:true};c.battleHidden=(c.battleHidden||[]).filter(id=>id!==d.battle&&id!==token?.characterId);c.views.battle=true;});
   if(d.step===1||d.step===-1)await saveTracker(OBR,(c,current)=>advanceTurn(c,current,d.step));
   if(d.id&&Number.isFinite(d.initiative)&&Math.abs(d.initiative)<10000)await saveTracker(OBR,c=>{c.initiatives||={};c.initiatives[d.id]=d.initiative;});
   if(d.link)await saveTracker(OBR,c=>{const token=c.tokens?.find(t=>t.id===d.id);if(token)token.characterId=d.link;});
   if(d.remove)await saveTracker(OBR,c=>removeMember(c,d.remove,mode));
   if(d.photo&&typeof d.id==='string'&&typeof d.photo==='string'&&d.photo.length<4000&&/^data:image\/jpeg;base64,/.test(d.photo))await saveTracker(OBR,c=>{c.photos||={};c.photos[d.id]=d.photo;});
   if(d.stats&&d.id){
    const row=trackerRows(await OBR.room.getMetadata(),mode).find(c=>c.id===d.id);
    if(row?.linked){if(await OBR.player.getRole()!=='GM')throw Error('GM only.');await OBR.broadcast.sendMessage(UI+'/sheet-stats',{id:row.sourceId||row.id,revision:d.revision,stats:d.stats},{destination:'LOCAL'});}
    else await saveTracker(OBR,c=>{const token=c.tokens?.find(t=>t.id===d.id);if(token&&!token.characterId)for(const k of ['hp','hpMax','mp','mpMax','ac','touch','flat','cmd'])if(Number.isFinite(d.stats[k])&&Math.abs(d.stats[k])<1e7)token[k]=d.stats[k];});
   }
  }).catch(e=>OBR.notification.show(e.message,'ERROR'));
 });
 for(const mode of ['party','battle'])for(const remove of [false,true])await OBR.contextMenu.create({id:TRACKER+'/'+mode+(remove?'/remove':'/add'),icons:[{icon:new URL('/owlbear/party-action.svg',location.origin).href,label:(remove?'Remove from Cosmos ':'Add to Cosmos ')+(mode==='battle'?'battle':'party'),filter:{roles:['GM'],every:[{key:'type',value:'IMAGE'}]}}],onClick:({items})=>{
  edits=edits.then(()=>saveTracker(OBR,(c,current)=>{
   c.tokens||=[];
   for(const item of items){
    if(remove){removeMember(c,item.id,mode);continue;}
    let token=c.tokens.find(t=>t.id===item.id);
    if(!token){const linked=stateFrom(current)?.characters.find(row=>row.name.toLowerCase()===item.name.toLowerCase());token={id:item.id,name:item.name.slice(0,80),characterId:linked?.id||'',portrait:/^https:\/\//.test(item.image?.url||'')?item.image.url:'',hp:0,hpMax:0,hpTemp:0,mp:0,mpMax:0,ac:10,touch:10,flat:10,cmd:10,initiative:0,memberships:{party:false,battle:false}};c.tokens.push(token);}
    token.memberships={...memberships(token),[mode]:true};c.hidden=(c.hidden||[]).filter(id=>id!==token.id&&id!==token.characterId);
    if(mode==='battle')c.battleHidden=(c.battleHidden||[]).filter(id=>id!==token.id&&id!==token.characterId);
   }
   if(!remove)c.views[mode]=true;
  })).catch(e=>OBR.notification.show(e.message,'ERROR'));
 }});
 setInterval(()=>void render(),5000);void render();
});
