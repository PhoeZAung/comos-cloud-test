import OBR from '@owlbear-rodeo/sdk';
import {localChannel} from './local-channel.mjs';
import {resourceEditor,defenses,person,portrait} from './tracker-view.mjs';

// HUD has fixed safe-area docking from GM settings. It does not drag or
// intercept pointer gestures intended for the Owlbear scene below it.
const root=document.querySelector('[data-status-cards]'),cards=new Map();
let state={party:[],admin:false},bus;
const size=new URLSearchParams(location.search).get('size');
document.body.dataset.partySize=['large','medium','small','compact'].includes(size)?size:'medium';
const edits=resourceEditor(()=>state,value=>bus?.send(value));
function render(){
 const active=new Set();
 for(const [index,row] of state.party.entries()){
  active.add(row.id);
  let card=cards.get(row.id);
  if(!card){
   const node=document.createElement('article');
   node.className='party-person';
   node.innerHTML='<div class="party-portrait">'+person+'</div><div class="party-info"><strong class="party-name"></strong><div class="party-health" role="meter"><span></span></div><div class="party-values"><button class="hp" data-key="hp"></button><button class="mp" data-key="mp"></button></div><button class="party-ac" aria-expanded="false"></button><div class="party-defenses" hidden><span class="party-defense-values"></span><button type="button" class="party-defense-edit" aria-label="Edit AC defenses" title="Edit AC, Touch, Flat-footed and CMD">✎</button></div></div>';
   card={node,photo:node.querySelector('.party-portrait'),health:node.querySelector('.party-health')};cards.set(row.id,card);
   const ac=node.querySelector('.party-ac'),details=node.querySelector('.party-defenses');
   ac.onclick=()=>{
    const open=details.hidden;
    for(const other of root.querySelectorAll('.party-defenses'))other.hidden=true;
    for(const button of root.querySelectorAll('.party-ac'))button.setAttribute('aria-expanded','false');
    details.hidden=!open;ac.setAttribute('aria-expanded',String(open));
   };
   node.querySelector('.party-defense-edit').onclick=event=>{
    event.stopPropagation();
    const latest=state.party.find(value=>value.id===row.id);
    if(!latest||(state.admin!==true&&!state.editableIds?.includes(row.id)))return;
    bus?.send({type:'party-ac-popup',id:row.id,requestId:crypto.randomUUID()});
   };
   for(const key of ['hp','mp']){
    card[key]=node.querySelector('[data-key='+key+']');
    card[key].onclick=()=>edits.edit(row.id,key,card[key],false);
   }
  }
  if(root.children[index]!==card.node)root.insertBefore(card.node,root.children[index]||null);
  card.node.querySelector('.party-name').textContent=row.name;
  card.node.querySelector('.party-name').title=row.name;
  portrait(card,row);
  const maximum=Math.max(0,row.hpMax),current=Math.max(0,Math.min(maximum,row.hp));
  card.health.hidden=maximum===0;
  card.health.setAttribute('aria-label',row.name+' HP');
  card.health.setAttribute('aria-valuemin','0');
  card.health.setAttribute('aria-valuemax',String(maximum));
  card.health.setAttribute('aria-valuenow',String(current));
  card.health.title='HP '+row.hp+' / '+maximum;
  card.health.firstElementChild.style.width=(maximum?100*current/maximum:0)+'%';
  for(const key of ['hp','mp']){
   const button=card[key],editable=state.admin||state.editableIds?.includes(row.id);
   button.textContent=key.toUpperCase()+' '+row[key]+(editable&&size!=='compact'?' ✎':'');
   button.title=editable?'Edit '+row.name+' '+key.toUpperCase():'Read-only '+key.toUpperCase();
   button.setAttribute('aria-label',(editable?'Edit ':'View ')+row.name+' '+key.toUpperCase()+' '+row[key]);
   button.disabled=!editable;
   button.classList.toggle('editable',!!editable);
   button.classList.toggle('saving',edits.pending(row.id,key));
  }
  card.node.querySelector('.party-ac').textContent='AC '+row.ac;
  card.node.querySelector('.party-defense-values').textContent=defenses(row);
  const edit=card.node.querySelector('.party-defense-edit'),editable=state.admin||state.editableIds?.includes(row.id);
  edit.hidden=!editable;
  edit.setAttribute('aria-label','Edit '+row.name+' AC, Touch, Flat-footed and CMD');
 }
 for(const [id,card] of cards)if(!active.has(id)){card.node.remove();cards.delete(id);}
}
OBR.onReady(async()=>{
 bus=await localChannel(OBR,data=>{
  if(data?.type==='state'){state=data;edits.confirm(state);render();}
  else if(data?.type==='result'){edits.result(data);if(data.error)void OBR.notification.show(data.error,'ERROR');render();}
 });
 bus.send({type:'hello'});
});
window.addEventListener('pagehide',()=>{bus?.close();edits.close();},{once:true});
