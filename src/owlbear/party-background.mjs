import OBR from '@owlbear-rodeo/sdk';
import {KEY,UI,HUD,stateFrom,gmConnections} from './party-state.mjs';
OBR.onReady(async()=>{
 const ownId=await OBR.player.getConnectionId(),preference='cosmos.party-status.layout.'+OBR.room.id;
 let metadata=await OBR.room.getMetadata(),gms=await gmConnections(OBR),layout={show:true,position:'left'},opened=false,shape='',working=false,pending=false;
 try{const saved=JSON.parse(localStorage.getItem(preference));if(typeof saved?.show==='boolean')layout.show=saved.show;if(['left','right'].includes(saved?.position))layout.position=saved.position;}catch{}
 async function render(){
  pending=true;if(working)return;working=true;
  try{while(pending){
   pending=false;const state=stateFrom(metadata),count=state&&gms.has(state.publisher)?state.characters.length:0;
   if(!count||!layout.show){if(opened)await OBR.popover.close(HUD);opened=false;shape='';continue;}
   const [vw,vh]=await Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]);
   const width=Math.max(220,Math.min(280,vw-80)),height=Math.max(100,Math.min(34+count*116,vh-150,730));
   const next=JSON.stringify([width,height,layout.position]);if(opened&&shape===next)continue;
   const right=layout.position==='right';
   await OBR.popover.open({id:HUD,url:new URL('/owlbear/party/overlay.html',location.origin).href,width,height,anchorReference:'POSITION',anchorPosition:{left:right?vw-24:68,top:90},anchorOrigin:{horizontal:right?'RIGHT':'LEFT',vertical:'TOP'},transformOrigin:{horizontal:right?'RIGHT':'LEFT',vertical:'TOP'},hidePaper:true,disableClickAway:true,marginThreshold:12});
   opened=true;shape=next;
  }}catch(error){console.error('Cosmos party overlay:',error.message);}finally{working=false;}
 }
 OBR.room.onMetadataChange(value=>{metadata=value;void render();});
 OBR.party.onChange(()=>{void gmConnections(OBR).then(value=>{gms=value;void render();});});
 OBR.player.onChange(()=>{void gmConnections(OBR).then(value=>{gms=value;void render();});});
 OBR.broadcast.onMessage(UI,event=>{
  if(event.connectionId!==ownId||!event.data)return;
  if(typeof event.data.show==='boolean')layout.show=event.data.show;
  if(['left','right'].includes(event.data.position))layout.position=event.data.position;
  try{localStorage.setItem(preference,JSON.stringify(layout));}catch{}
  void render();
 });
 setInterval(()=>void render(),5000);void render();
});
