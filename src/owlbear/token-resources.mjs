import {buildLabel} from '@owlbear-rodeo/sdk';
import {trackerRows,memberships,TRACKER} from './tracker.mjs';
export const RESOURCE_EDITOR='com.cosmos.party-status/resource-editor',BAR_META='com.cosmos.party-status/token-resource';
export async function tokenResources(OBR){
 let metadata=await OBR.room.getMetadata(),ready=await OBR.scene.isReady(),gm=await OBR.player.getRole()==='GM',pending=false,running=false,timer,opening=false,epoch=0,recover=false;
 const labels=new Map(),selection=new Map();
 async function render(){
  pending=true;if(running)return;running=true;
  try{while(pending){pending=false;if(!ready)continue;const generation=epoch;if(recover){const old=await OBR.scene.local.getItems(item=>Boolean(item.metadata[BAR_META]));if(old.length)await OBR.scene.local.deleteItems(old.map(item=>item.id));labels.clear();selection.clear();recover=false;}
   const rows=new Map([...trackerRows(metadata,'party'),...trackerRows(metadata,'battle')].map(row=>[row.id,row]));
   const tokens=(metadata[TRACKER]?.tokens||[]).filter(t=>{const m=memberships(t);return m.party||m.battle;});
   const parents=await OBR.scene.items.getItems(tokens.map(t=>t.id)),parentMap=new Map(parents.map(item=>[item.id,item]));
   const wanted=new Set(),add=[],update=[],remove=[];
   const positions=await Promise.all(tokens.map(async token=>{const parent=parentMap.get(token.id);if(!parent||!rows.has(token.id))return null;return {token,parent,row:rows.get(token.id),bounds:await OBR.scene.items.getItemBounds([token.id])};}));
   if(!ready||generation!==epoch)continue;
   for(const entry of positions){if(!entry)continue;const {token,parent,row,bounds}=entry;
    for(const [index,key] of ['hp','mp'].entries()){
     const name=token.id+'/'+key,current=row[key],maximum=key==='hp'?row.hpMax:row.mpMax,filled=Math.round(Math.max(0,Math.min(1,maximum>0?current/maximum:0))*12);
     const text=key.toUpperCase()+' '+current+' / '+maximum+'\n'+'█'.repeat(filled)+'░'.repeat(12-filled),position={x:bounds.center.x,y:bounds.min.y-12-(1-index)*37};
     const width=Math.max(120,Math.min(180,bounds.width*1.15)),visible=parent.visible!==false;
     const signature=JSON.stringify([text,position,width,visible,gm]),old=labels.get(name),id=old?.id||crypto.randomUUID();wanted.add(name);
     selection.set(id,{id:token.id,key,position});if(old?.signature===signature)continue;
     const item=buildLabel().id(id).name('Cosmos '+key.toUpperCase()+' · '+row.name).plainText(text).width(width).height(34).fontFamily('monospace').fontSize(14).fontWeight(700).lineHeight(1).padding(2).fillColor(key==='hp'?'#ffb4c5':'#a8d3ff').backgroundColor('#161323').backgroundOpacity(.9).cornerRadius(5).pointerWidth(0).pointerHeight(0).textAlign('CENTER').position(position).attachedTo(token.id).disableAttachmentBehavior(['ROTATION','SCALE','LOCKED','COPY']).layer('TEXT').zIndex(100000).disableAutoZIndex(true).locked(false).disableHit(!gm).visible(visible).metadata({[BAR_META]:{id:token.id,key}}).build();
     (old?update:add).push(item);labels.set(name,{id,signature});
    }
   }
   for(const [name,item] of labels)if(!wanted.has(name)){remove.push(item.id);selection.delete(item.id);labels.delete(name);}
   if(!ready)continue;
   if(remove.length)await OBR.scene.local.deleteItems(remove);
   if(add.length)await OBR.scene.local.addItems(add);
   if(update.length){const targets=new Map(update.map(item=>[item.id,item]));await OBR.scene.local.updateItems([...targets.keys()],items=>{for(const item of items){const next=targets.get(item.id);if(next)for(const key of ['name','position','attachedTo','disableAttachmentBehavior','disableHit','visible','text','style','zIndex','locked','metadata'])item[key]=next[key];}});}
  }}catch(e){console.error('Cosmos token resources:',e.message);labels.clear();selection.clear();recover=true;}finally{running=false;}
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(()=>void render(),80);}
 async function openEditor(value){
  if(opening||await OBR.player.getRole()!=='GM')return;opening=true;
  try{const current=await OBR.room.getMetadata(),view=trackerRows(current,'party').some(row=>row.id===value.id)?'party':'battle',point=await OBR.viewport.transformPoint(value.position),url=new URL('/owlbear/party/resource.html',location.origin);url.search=new URLSearchParams({id:value.id,key:value.key,view});await OBR.popover.open({id:RESOURCE_EDITOR,url:url.href,width:240,height:160,anchorReference:'POSITION',anchorPosition:{left:point.x,top:point.y},anchorOrigin:{horizontal:'CENTER',vertical:'TOP'},transformOrigin:{horizontal:'CENTER',vertical:'BOTTOM'},disableClickAway:false});}
  finally{opening=false;}
 }
 if(ready){const old=await OBR.scene.local.getItems(item=>Boolean(item.metadata[BAR_META]));if(old.length)await OBR.scene.local.deleteItems(old.map(item=>item.id));}
 OBR.room.onMetadataChange(value=>{metadata=value;schedule();});
 OBR.scene.items.onChange(schedule);
 OBR.scene.onReadyChange(value=>{epoch++;recover=true;ready=value;if(!ready){clearTimeout(timer);labels.clear();selection.clear();void OBR.popover.close(RESOURCE_EDITOR).catch(()=>{});}else schedule();});
 OBR.player.onChange(player=>{const role=player.role==='GM';if(role!==gm){gm=role;schedule();}if(!gm)return;const id=player.selection?.find(id=>selection.has(id));if(id){const value=selection.get(id);void OBR.player.deselect([id]).then(()=>openEditor(value)).catch(e=>console.error(e.message));}});
 // The native context menu also offers an explicit editor on the attached number.
 await OBR.contextMenu.create({id:BAR_META+'/edit',icons:[{icon:new URL('/owlbear/party-action.svg',location.origin).href,label:'Edit current HP / MP',filter:{roles:['GM'],some:[{key:['metadata',BAR_META,'key'],value:'hp'},{key:['metadata',BAR_META,'key'],value:'mp',coordinator:'||'}]}}],onClick:({items})=>{const item=items.find(item=>item.metadata[BAR_META]);if(item)void openEditor({...item.metadata[BAR_META],position:item.position});}});
 void render();
}
