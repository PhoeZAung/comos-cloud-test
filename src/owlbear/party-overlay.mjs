import OBR from '@owlbear-rodeo/sdk';
import {localChannel} from './local-channel.mjs';
import {resourceEditor,defenses,person,portrait} from './tracker-view.mjs';
const root=document.querySelector('[data-status-cards]'),cards=new Map();let state={party:[],admin:false},bus;
document.body.classList.toggle('vertical',new URLSearchParams(location.search).has('vertical'));
const edits=resourceEditor(()=>state,b=>bus.send(b));
function render(){
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
  for(const key of ['hp','mp']){const button=card[key];button.textContent=key.toUpperCase()+' '+row[key];button.title=row[key]+' / '+row[key==='hp'?'hpMax':'mpMax'];button.disabled=!state.admin;button.classList.toggle('saving',edits.pending(row.id,key));}
  card.node.querySelector('.party-ac').textContent='AC '+row.ac;card.node.querySelector('.party-defenses').textContent=defenses(row);
 }
 for(const [id,card] of cards)if(!active.has(id)){card.node.remove();cards.delete(id);}
}
OBR.onReady(async()=>{bus=await localChannel(OBR,data=>{if(data?.type==='state'){state=data;edits.confirm(state);render();}else if(data?.type==='result'){edits.result(data);render();}});bus.send({type:'hello'});});
window.addEventListener('pagehide',()=>{bus?.close();edits.close();},{once:true});
