import OBR from '@owlbear-rodeo/sdk';
import {localChannel} from './local-channel.mjs';

const id=new URLSearchParams(location.search).get('characterId'),form=document.querySelector('[data-ac-form]'),status=document.querySelector('[data-ac-status]'),title=document.querySelector('[data-ac-character]');
const keys=['ac','touch','flat','cmd'],popoverId='com.cosmos.character-sheets/party-ac-editor';
let bus,state={party:[],admin:false},character=null,pending=null,edited=false;
const close=()=>void OBR.popover.close(popoverId).catch(()=>{});
document.querySelector('[data-ac-close]').onclick=close;
form.querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>{edited=true;}));
function render(){
 const current=state.party.find(row=>row.id===id),editable=state.admin===true||state.editableIds?.includes(id);
 if(!current||!editable){form.hidden=true;status.textContent='This sheet is not shared or you cannot edit it.';return;}
 character=current;form.hidden=false;title.textContent=current.name;
 if(!edited&&!pending)for(const key of keys)form.elements[key].value=String(current[key]);
 if(!pending)status.textContent='Adjust totals; base sheet bonuses are preserved.';
}
form.addEventListener('submit',event=>{
 event.preventDefault();if(pending||!character||!bus)return;
 const stats={};
 for(const key of keys){
  const value=Number(form.elements[key].value);
  if(form.elements[key].value===''||!Number.isSafeInteger(value)||Math.abs(value)>=1e7){status.textContent='Enter a whole-number defense total.';form.elements[key].focus();return;}
  stats[key]=value;
 }
 pending=crypto.randomUUID();status.textContent='Saving defenses…';
 form.querySelector('[type="submit"]').disabled=true;
 bus.send({type:'stats',id,stats,revision:character.revision,requestId:pending});
});
OBR.onReady(async()=>{
 if(!/^[0-9a-f-]{36}$/i.test(id||'')){status.textContent='Invalid character.';return;}
 bus=await localChannel(OBR,data=>{
  if(data?.type==='state'){state=data;render();}
  else if(data?.type==='result'&&data.requestId===pending){
   pending=null;form.querySelector('[type="submit"]').disabled=false;
   if(data.error)status.textContent=data.error;
   else{edited=false;status.textContent='Saved';close();}
  }
 });
 bus.send({type:'hello'});
});
window.addEventListener('pagehide',()=>bus?.close(),{once:true});
