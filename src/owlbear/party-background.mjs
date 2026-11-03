import OBR from '@owlbear-rodeo/sdk';
import {UI,HUD} from './party-state.mjs';
import {TRACKER,trackerRows,saveTracker} from './tracker.mjs';
OBR.onReady(async()=>{
 const ownId=await OBR.player.getConnectionId(),preference='cosmos.tracker.layout.'+OBR.room.id;
 let metadata=await OBR.room.getMetadata(),layout={},opened=new Map(),pending=false,working=false;
 try{layout=JSON.parse(localStorage.getItem(preference))||{};}catch{}
 const save=()=>{try{localStorage.setItem(preference,JSON.stringify(layout));}catch{}};
 async function render(){
  pending=true;if(working)return;working=true;
  try{while(pending){pending=false;
   const rows=trackerRows(metadata),mode=metadata[TRACKER]?.mode||'party',wanted=new Set(rows.map(c=>HUD+'/'+c.id));
   for(const id of opened.keys())if(!wanted.has(id)){await OBR.popover.close(id);opened.delete(id);}
   const [vw,vh]=await Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]);
   for(let i=0;i<rows.length;i++){
    const row=rows[i],id=HUD+'/'+row.id,key=mode+'/'+row.id,settings=layout[key]||{},density=settings.density||'normal';
    const width={normal:270,compact:220,tiny:180}[density]||270,height={normal:154,compact:117,tiny:92}[density]||154;
    const x=Math.max(8,Math.min(vw-width-8,settings.x??(66+Math.floor(i/4)*(width+10)))),y=Math.max(8,Math.min(vh-height-8,settings.y??(80+(i%4)*(height+8))));
    const shape=JSON.stringify([x,y,width,height,density,mode]);if(opened.get(id)===shape)continue;
    const url=new URL('/owlbear/party/overlay.html',location.origin);url.search=new URLSearchParams({id:row.id,mode,density,x:String(x),y:String(y)});
    await OBR.popover.open({id,url:url.href,width,height,anchorReference:'POSITION',anchorPosition:{left:x,top:y},anchorOrigin:{horizontal:'LEFT',vertical:'TOP'},transformOrigin:{horizontal:'LEFT',vertical:'TOP'},hidePaper:true,disableClickAway:true,marginThreshold:8});opened.set(id,shape);
   }
  }}catch(e){console.error(e.message);}finally{working=false;}
 }
 OBR.room.onMetadataChange(value=>{metadata=value;void render();});
 OBR.broadcast.onMessage(UI,async event=>{
  if(event.connectionId!==ownId||!event.data)return;const d=event.data;
  try{
   if(d.id&&(d.move||d.density)){const mode=metadata[TRACKER]?.mode||'party',key=mode+'/'+d.id;layout[key]||={};if(d.move&&Number.isFinite(d.move.x)&&Number.isFinite(d.move.y)){layout[key].x=d.move.x;layout[key].y=d.move.y;}if(['normal','compact','tiny'].includes(d.density))layout[key].density=d.density;save();void render();}
   if(d.mode&&['party','battle','off'].includes(d.mode))await saveTracker(OBR,c=>{c.mode=d.mode;if(d.mode==='party')c.hidden=[];});
   if(d.battle)await saveTracker(OBR,c=>{const token=c.tokens?.find(t=>t.id===d.battle);if(token)token.mode='battle';else c.battle=[...new Set([...(c.battle||[]),d.battle])];c.mode='battle';});
   if(d.nextTurn)await saveTracker(OBR,c=>{const rows=trackerRows(metadata);if(!rows.length)return;const index=rows.findIndex(row=>row.id===c.turn),next=(index+1)%rows.length;c.turn=rows[next].id;c.round=(c.round||1)+(index===rows.length-1?1:0);});
   if(d.link)await saveTracker(OBR,c=>{const token=c.tokens?.find(t=>t.id===d.id);if(token)token.characterId=d.link;});
   if(d.remove)await saveTracker(OBR,c=>{c.tokens=(c.tokens||[]).filter(t=>t.id!==d.remove);c.battle=(c.battle||[]).filter(id=>id!==d.remove);if((metadata[TRACKER]?.mode||'party')==='party')c.hidden=[...new Set([...(c.hidden||[]),d.remove])];});
   if(d.photo&&typeof d.id==='string'&&typeof d.photo==='string'&&d.photo.length<4000&&/^data:image\/jpeg;base64,/.test(d.photo))await saveTracker(OBR,c=>{c.photos||={};c.photos[d.id]=d.photo;});
   if(d.stats&&typeof d.id==='string')await saveTracker(OBR,c=>{const token=c.tokens?.find(t=>t.id===d.id);if(token&&!token.characterId)for(const k of ['hp','hpMax','mp','mpMax','ac','touch','flat','cmd','initiative'])if(Number.isFinite(d.stats[k])&&Math.abs(d.stats[k])<1e7)token[k]=d.stats[k];});
  }catch(e){await OBR.notification.show(e.message,'ERROR');}
 });
 for(const mode of ['party','battle'])await OBR.contextMenu.create({id:TRACKER+'/'+mode,icons:[{icon:new URL('/owlbear/party-action.svg',location.origin).href,label:mode==='battle'?'Add to Cosmos combat':'Add to Cosmos party',filter:{roles:['GM'],every:[{key:'type',value:'IMAGE'}]}}],onClick:async({items})=>{
  try{await saveTracker(OBR,c=>{c.tokens||=[];for(const item of items){if(c.tokens.some(t=>t.id===item.id&&t.mode===mode))continue;const linked=trackerRows(metadata).find(row=>row.linked&&row.name.toLowerCase()===item.name.toLowerCase());c.tokens=c.tokens.filter(t=>t.id!==item.id);c.tokens.push({id:item.id,name:item.name.slice(0,80),mode,characterId:linked?.id||'',portrait:/^https:\/\//.test(item.image?.url||'')?item.image.url:'',hp:0,hpMax:0,hpTemp:0,mp:0,mpMax:0,ac:10,touch:10,flat:10,cmd:10,initiative:0});}c.mode=mode;});}catch(e){await OBR.notification.show(e.message,'ERROR');}
 }});
 setInterval(()=>void render(),5000);void render();
});
