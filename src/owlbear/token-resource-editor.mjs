import OBR from '@owlbear-rodeo/sdk';
import {trackerRows} from './tracker.mjs';
import {UI,esc} from './party-state.mjs';
const EDITOR='com.cosmos.party-status/resource-editor',params=new URLSearchParams(location.search),root=document.querySelector('main');
OBR.onReady(async()=>{
 try{
  if(await OBR.player.getRole()!=='GM')throw Error('GM only.');
  const view=params.get('view')==='battle'?'battle':'party',id=params.get('id'),key=params.get('key');if(!['hp','mp'].includes(key))throw Error('Invalid resource.');
  const metadata=await OBR.room.getMetadata(),row=trackerRows(metadata,view).find(row=>row.id===id);if(!row)throw Error('This token is no longer in the tracker.');
  root.innerHTML='<form class="token-resource-form"><label>'+esc(row.name)+' · '+key.toUpperCase()+'<input type="number" name="current" step="1" min="'+(key==='mp'?'0':'-9999999')+'" max="9999999" required value="'+esc(row[key])+'" aria-label="Current '+key.toUpperCase()+'"></label><div><button type="submit">Save</button><button type="button" data-cancel>Cancel</button></div></form>';
  const form=root.querySelector('form'),input=form.elements.current;input.focus();input.select();
  root.querySelector('[data-cancel]').onclick=()=>void OBR.popover.close(EDITOR);
  form.onsubmit=async event=>{event.preventDefault();const value=Number(input.value);if(!Number.isFinite(value)||Math.abs(value)>=1e7||key==='mp'&&value<0)return;await OBR.broadcast.sendMessage(UI,{view,id,revision:row.revision,stats:{[key]:value}},{destination:'LOCAL'});await OBR.popover.close(EDITOR);};
 }catch(e){root.textContent=e.message;}
});
