import OBR from '@owlbear-rodeo/sdk';
import {localChannel} from './local-channel.mjs';
import {resourceEditor,defenses,person,portrait} from './tracker-view.mjs';
const root=document.querySelector('[data-status-cards]'),cards=new Map();
const handle=document.querySelector('[data-party-drag]');let state={party:[],admin:false},bus,drag=null;
const move=(dx,dy)=>{if(!state.admin||!bus||!Number.isFinite(dx)||!Number.isFinite(dy))return;
 bus.send({type:'party-move',dx:Math.round(dx),dy:Math.round(dy),requestId:crypto.randomUUID()});};
function stopDrag(commit=false){
 if(!drag)return;
 const gesture=drag;drag=null;handle.textContent='⠿ Move';handle.removeAttribute('data-dragging');
 if(commit&&(Math.abs(gesture.dx)>=3||Math.abs(gesture.dy)>=3))move(gesture.dx,gesture.dy);
}
handle.addEventListener('pointerdown',event=>{
 if(!state.admin||event.button!==0)return;
 drag={id:event.pointerId,x:event.screenX,y:event.screenY,dx:0,dy:0};
 handle.setPointerCapture(event.pointerId);handle.dataset.dragging='true';event.preventDefault();
});
handle.addEventListener('pointermove',event=>{
 if(!drag||drag.id!==event.pointerId)return;
 drag.dx=event.screenX-drag.x;drag.dy=event.screenY-drag.y;
 handle.textContent='Move '+Math.round(drag.dx)+', '+Math.round(drag.dy);
});
handle.addEventListener('pointerup',event=>{
 if(!drag||drag.id!==event.pointerId)return;
 drag.dx=event.screenX-drag.x;drag.dy=event.screenY-drag.y;stopDrag(true);
});
handle.addEventListener('pointercancel',()=>stopDrag(false));
handle.addEventListener('lostpointercapture',()=>stopDrag(false));
handle.addEventListener('keydown',event=>{
 const deltas={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
 const direction=deltas[event.key];if(!direction||!state.admin)return;
 event.preventDefault();move(direction[0]*(event.shiftKey?80:24),direction[1]*(event.shiftKey?80:24));
});
document.body.classList.toggle('vertical',new URLSearchParams(location.search).has('vertical'));
const edits=resourceEditor(()=>state,b=>bus.send(b));
function render(){
 handle.hidden=!state.admin;if(!state.admin)stopDrag(false);
 const active=new Set();for(const [index,row] of state.party.entries()){
  active.add(row.id);let card=cards.get(row.id);
  if(!card){const node=document.createElement('article');node.className='party-person';node.innerHTML='<div class="party-portrait">'+person+'</div><div class="party-info"><strong class="party-name"></strong><div class="party-values"><button class="hp" data-key="hp"></button><button class="mp" data-key="mp"></button></div><button class="party-ac" aria-expanded="false"></button><div class="party-defenses" hidden></div></div>';card={node,photo:node.querySelector('.party-portrait')};cards.set(row.id,card);
   const health=document.createElement('div');health.className='party-health';health.setAttribute('role','meter');health.setAttribute('aria-label',row.name+' HP');health.innerHTML='<span></span>';node.querySelector('.party-values').before(health);card.health=health;
   node.querySelector('.party-ac').onclick=()=>{const details=node.querySelector('.party-defenses'),open=details.hidden;details.hidden=!open;node.querySelector('.party-ac').setAttribute('aria-expanded',String(open));};
   for(const key of ['hp','mp']){card[key]=node.querySelector('[data-key='+key+']');card[key].onclick=()=>edits.edit(row.id,key,card[key],false);}
  }
  if(root.children[index]!==card.node)root.insertBefore(card.node,root.children[index]||null);
  card.node.querySelector('.party-name').textContent=row.name;card.node.querySelector('.party-name').title=row.name;portrait(card,row);
  const maximum=Math.max(0,row.hpMax),current=Math.max(0,Math.min(maximum,row.hp)),missing=Math.max(0,maximum-row.hp);card.health.hidden=maximum===0;card.health.setAttribute('aria-valuemin','0');card.health.setAttribute('aria-valuemax',String(maximum));card.health.setAttribute('aria-valuenow',String(current));card.health.title='HP '+row.hp+' / '+maximum+' · '+missing+' missing';card.health.firstElementChild.style.width=(maximum?100*current/maximum:0)+'%';
  for(const key of ['hp','mp']){const button=card[key],editable=state.admin||state.editableIds?.includes(row.id);button.textContent=key.toUpperCase()+' '+row[key]+(editable?' ✎':'');button.title=editable?'Edit '+(key==='hp'?'your character’s HP':'current MP')+' · '+row[key]+' / '+row[key==='hp'?'hpMax':'mpMax']:'Read-only · '+row[key]+' / '+row[key==='hp'?'hpMax':'mpMax']+' · Connect the owning Cosmos account to edit';button.setAttribute('aria-label',(editable?'Edit ':'View ')+row.name+' '+key.toUpperCase()+' '+row[key]);button.disabled=!editable;button.classList.toggle('editable',!!editable);button.classList.toggle('saving',edits.pending(row.id,key));}
  card.node.querySelector('.party-ac').textContent='AC '+row.ac;card.node.querySelector('.party-defenses').textContent=defenses(row);
 }
 for(const [id,card] of cards)if(!active.has(id)){card.node.remove();cards.delete(id);}
}
OBR.onReady(async()=>{bus=await localChannel(OBR,data=>{if(data?.type==='state'){state=data;edits.confirm(state);render();}else if(data?.type==='result'){edits.result(data);render();}});bus.send({type:'hello'});});
window.addEventListener('pagehide',()=>{bus?.close();edits.close();},{once:true});
