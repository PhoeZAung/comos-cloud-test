import OBR from '@owlbear-rodeo/sdk';
import {publicPartyClient} from './public-party-client.mjs';
import {UI,HUD,KEY} from './party-state.mjs';
import {trackerRows} from './tracker.mjs';
OBR.onReady(async()=>{
 const ownId=await OBR.player.getConnectionId(),preference='cosmos.party.layout.v4.'+OBR.room.id,id=HUD+'/party';
 let metadata={},layout={show:true,density:'compact'},opened=false,shape='',last=null,busy=false,again=false,feedStatus='Connecting…';
 let dimensions=await Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]);
 try{const saved=JSON.parse(localStorage.getItem(preference));if(saved&&typeof saved==='object')layout={...layout,...saved};}catch{}
 const persist=()=>{try{localStorage.setItem(preference,JSON.stringify(layout));}catch{}};
 const announce=()=>OBR.broadcast.sendMessage(UI+'/layout',{show:layout.show},{destination:'LOCAL'}).catch(()=>{});
 const publish=()=>OBR.broadcast.sendMessage(UI+'/public-state',{snapshot:metadata[KEY],status:feedStatus},{destination:'LOCAL'}).catch(()=>{});
 async function render(){
  again=true;if(busy)return;busy=true;
  try{while(again){again=false;
   if(!layout.show){if(opened)await OBR.popover.close(id);opened=false;shape='';continue;}
   const [vw,vh]=dimensions,count=trackerRows(metadata).length,density=['normal','compact','tiny'].includes(layout.density)?layout.density:'compact',cardWidth={normal:112,compact:100,tiny:90}[density];
   const width=Math.min(vw-24,count?Math.min(880,vw-80,24+count*cardWidth):160),height=Math.min(vh-70,count?{normal:158,compact:144,tiny:132}[density]:40);
   const x=Math.max(8,Math.min(vw-width-8,layout.x??last?.x??Math.max(68,(vw-width)/2))),y=Math.max(8,Math.min(vh-height-8,layout.y??last?.y??16));
   const next=JSON.stringify([x,y,width,height,density]);
   if(!opened||next!==shape){const url=new URL('/owlbear/party/overlay.html',location.origin);url.search=new URLSearchParams({density,x:String(x),y:String(y)});
    if(opened&&last?.x===x&&last?.y===y&&last?.density===density)await Promise.all([OBR.popover.setWidth(id,width),OBR.popover.setHeight(id,height)]);
    else await OBR.popover.open({id,url:url.href,width,height,anchorReference:'POSITION',anchorPosition:{left:x,top:y},anchorOrigin:{horizontal:'LEFT',vertical:'TOP'},transformOrigin:{horizontal:'LEFT',vertical:'TOP'},hidePaper:true,disableClickAway:true,marginThreshold:8});
    opened=true;shape=next;last={x,y,density};
   }
  }}catch(e){console.error(e.message);}finally{busy=false;}
 }
 let edits=Promise.resolve();
 OBR.broadcast.onMessage(UI,event=>{
  if(event.connectionId!==ownId||!event.data)return;const d=event.data;
  if(d.layoutRequest){void announce();return;}if(d.stateRequest){void publish();return;}
  if(d.move||d.density||d.toggle==='party'){
   if(d.move&&Number.isFinite(d.move.x)&&Number.isFinite(d.move.y))Object.assign(layout,d.move);
   if(['normal','compact','tiny'].includes(d.density))layout.density=d.density;
   if(d.toggle==='party')layout.show=!layout.show;
   persist();void announce();void render();
  }
  if(d.stats&&d.id)edits=edits.then(async()=>{
   if(await OBR.player.getRole()!=='GM')throw Error('GM only.');
   if(!trackerRows(metadata).some(c=>c.id===d.id))throw Error('This character is no longer shared.');
   if(Object.keys(d.stats).some(k=>!['hp','mp'].includes(k)))throw Error('Edit other stats on the Cosmos sheet.');
   await OBR.broadcast.sendMessage(UI+'/sheet-stats',{id:d.id,revision:d.revision,stats:d.stats,requestId:d.requestId},{destination:'LOCAL'});
  }).catch(e=>OBR.broadcast.sendMessage(UI+'/edit-result',{requestId:d.requestId,id:d.id,error:e.message},{destination:'LOCAL'}));
 });
 const stop=publicPartyClient(snapshot=>{metadata={[KEY]:snapshot};void publish();void render();},status=>{feedStatus=status;void publish();});
 window.addEventListener('pagehide',stop,{once:true});void render();void announce();
 // Remove obsolete private relays and widgets, leaving the site's party selection intact.
 const oldRoom=await OBR.room.getMetadata();if(await OBR.player.getRole()==='GM'&&(oldRoom['com.cosmos.party-status/tracker']||oldRoom[KEY]))await OBR.room.setMetadata({'com.cosmos.party-status/tracker':null,[KEY]:null});
 await Promise.allSettled([OBR.popover.close(HUD+'/battle'),OBR.popover.close('com.cosmos.party-status/resource-editor'),...['party/add','party/remove','battle/add','battle/remove','party','battle'].map(suffix=>OBR.contextMenu.remove('com.cosmos.party-status/tracker/'+suffix)),OBR.contextMenu.remove('com.cosmos.party-status/token-resource/edit')]);
 if(await OBR.scene.isReady()){const old=await OBR.scene.local.getItems(item=>Boolean(item.metadata['com.cosmos.party-status/token-resource']));if(old.length)await OBR.scene.local.deleteItems(old.map(item=>item.id));}
 window.addEventListener('resize',()=>{void Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]).then(value=>{dimensions=value;void render();});});
});
