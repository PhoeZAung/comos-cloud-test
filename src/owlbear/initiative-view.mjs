import {resourceEditor,defenses} from './tracker-view.mjs';
import {initiativeLinkStatus} from './initiative-link.mjs';
import {combatEventVerdict} from '../features/sheet/combat-verdict.mjs';

// Shared initiative UI for the extension tab and legacy standalone view.
// State and permissions always come from the Owlbear background controller.
export function mountInitiative(view,send){
 const root=view.querySelector('tbody'),cards=new Map();
 let state={battle:[],party:[],turn:{},admin:false,approvals:[]},events=[];
 const edits=resourceEditor(()=>state,value=>send(value));
 function render(){
  const active=new Set(),visible=Array.isArray(state.battle)?state.battle:[],turn=state.turn?.id===undefined?visible[0]?.id:state.turn.id;
  for(const [index,row] of visible.entries()){
   active.add(row.id);let card=cards.get(row.id);
   if(!card){
    const node=document.createElement('tr');
    node.innerHTML='<td><input class="initiative-input" type="number" step="1" aria-label="Initiative"></td><td class="battle-name"><button type="button" class="battle-locate"><span class="battle-link-indicator" aria-hidden="true"></span><span class="battle-locate-label"></span><svg class="battle-hidden-eye" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" hidden><path d="M3 3l18 18"/><path d="M10.7 10.7a2 2 0 002.6 2.6"/><path d="M9.9 5.4A11 11 0 0112 5c4.6 0 8 3 10 7a15.8 15.8 0 01-3.4 4.3"/><path d="M6.2 6.2A16.8 16.8 0 002 12c2 4 5.5 7 10 7a10.6 10.6 0 005.1-1.3"/></svg></button></td><td><button data-key="hp" class="battle-resource hp"></button></td><td><button data-key="mp" class="battle-resource mp"></button></td><td class="ac-cell"><button class="battle-ac" aria-expanded="false"></button><div class="battle-defenses" hidden></div></td>';
    card={node,input:node.querySelector('input')};cards.set(row.id,card);
    const name=node.querySelector('.battle-locate');name.setAttribute('aria-label','Center camera on '+row.name);name.title='Center camera on '+row.name;name.onclick=()=>send({type:'locate',id:row.id});
    name.onpointerenter=()=>send({type:'highlight',id:row.id});
    name.onpointerleave=()=>send({type:'highlight',id:null});
    name.onfocus=()=>send({type:'highlight',id:row.id});
    name.onblur=()=>send({type:'highlight',id:null});
    card.input.onchange=()=>{const value=Number(card.input.value);if(card.input.value!==''&&Number.isFinite(value))send({type:'initiative',id:row.id,value,requestId:crypto.randomUUID()});};
    for(const key of ['hp','mp']){card[key]=node.querySelector('[data-key='+key+']');card[key].onclick=()=>edits.edit(row.id,key,card[key],true);}
    node.querySelector('.battle-ac').onclick=()=>{
     const details=node.querySelector('.battle-defenses'),open=details.hidden;
     for(const other of root.querySelectorAll('.battle-defenses'))other.hidden=true;
     for(const button of root.querySelectorAll('.battle-ac'))button.setAttribute('aria-expanded','false');
     details.hidden=!open;node.querySelector('.battle-ac').setAttribute('aria-expanded',String(open));
     const rect=node.querySelector('.battle-ac').getBoundingClientRect();
     details.style.position='fixed';details.style.right='auto';
     details.style.left=Math.max(4,Math.min(innerWidth-194,rect.right-190))+'px';
     details.style.top=Math.max(4,Math.min(innerHeight-38,rect.bottom+3))+'px';
    };
   }
   if(root.children[index]!==card.node)root.insertBefore(card.node,root.children[index]||null);
   card.node.classList.toggle('current-turn',row.id===turn);card.node.classList.toggle('unavailable',!row.available);
   const linkStatus=initiativeLinkStatus(row);card.node.dataset.linkStatus=linkStatus.kind;
   if(document.activeElement!==card.input)card.input.value=row.initiative;
   card.input.disabled=!state.admin;card.input.setAttribute('aria-label',row.name+' initiative');
   const locateButton=card.node.querySelector('.battle-locate');locateButton.querySelector('.battle-locate-label').textContent=row.name;const hidden=row.visible===false&&state.gm===true;locateButton.querySelector('.battle-hidden-eye').hidden=!hidden;locateButton.setAttribute('aria-label','Center camera on '+row.name+(hidden?' (hidden from players)':''));locateButton.title=(hidden?'Hidden from players · ':'')+'Center camera on '+row.name+' · '+linkStatus.label;
   locateButton.setAttribute('aria-label','Center camera on '+row.name+' · '+linkStatus.label);
   const indicator=locateButton.querySelector('.battle-link-indicator');indicator.title=linkStatus.label;indicator.dataset.linkStatus=linkStatus.kind;
   for(const key of ['hp','mp']){
    const button=card[key],untracked=key==='hp'&&(!row.trackHp||row.hp===null);
    button.textContent=untracked?'—':String(row[key]);
    button.title=untracked?(row.hp===null?'HP hidden by GM':'HP not tracked'):'Current '+key.toUpperCase()+' · max '+row[key==='hp'?'hpMax':'mpMax'];
    button.disabled=!state.admin||!row.available||untracked;
    button.classList.toggle('saving',edits.pending(row.id,key));
   }
   card.node.querySelector('.battle-ac').textContent=row.ac;
   card.node.querySelector('.battle-defenses').textContent=defenses(row);
  }
  for(const [id,card] of cards)if(!active.has(id)){card.node.remove();cards.delete(id);}
  view.querySelector('[data-round]').textContent='Round '+Math.max(1,Number(state.turn?.round)||1);
  view.querySelector('[data-empty]').hidden=!!visible.length;
  for(const button of view.querySelectorAll('[data-turn]')){button.hidden=!state.admin;button.disabled=!visible.length;}
  const end=view.querySelector('[data-end-battle]');end.hidden=!state.admin||!visible.length;end.disabled=!visible.length;
  const approvals=view.querySelector('[data-combat-approvals]'),list=view.querySelector('[data-combat-approval-list]');
  approvals.hidden=!state.admin||!state.approvals?.length;
  list.replaceChildren();
  if(state.admin)for(const request of state.approvals||[]){
   const line=document.createElement('div'),description=document.createElement('p');
   line.className='combat-approval-row';description.textContent=request.actorName+' → '+request.targetName+' · '+request.kind;
   const approve=document.createElement('button'),reject=document.createElement('button');
   approve.type='button';approve.textContent='Approve';approve.dataset.approveCombat=request.requestId;
   reject.type='button';reject.textContent='Reject';reject.dataset.rejectCombat=request.requestId;
   line.append(description,approve,reject);list.append(line);
  }
  const eventList=view.querySelector('[data-combat-events]');eventList.replaceChildren();
  for(const event of events){
   const li=document.createElement('li'),headline=document.createElement('strong'),details=document.createElement('small');
   if(event.kind==='end'){
    headline.textContent='Battle ended';details.textContent='Battle '+event.battle;
   }else{
    headline.textContent=(combatEventVerdict(event)||'RESULT')+' · '+event.actor+' → '+event.target;
    details.textContent='Round '+event.round+' · '+(event.action||event.source||'Action')+
      ' · '+(event.kind==='heal'?'Healed':event.kind==='temp_hp'?'Temp HP':'Damage')+
      ' '+(event.applied??0)+(event.hit===false?' ('+(event.reason||'missed')+')':'')+(event.critical?' · Critical':'')+
      (event.mitigation||[]).map(part=>part.type==='sr'?' · SR '+part.total+'/'+part.sr+(part.passed?' passed':' resisted'):part.type==='dr'?' · DR '+(part.reduced||0)+' blocked':part.type==='energy'?' · '+part.energy+' '+(part.before-part.after)+' resisted':part.type==='save'?' · '+(part.save==='fort'?'Fort':part.save==='ref'?'Ref':'Will')+' '+part.total+' vs DC '+part.dc+(part.passed?' saved':' failed'):part.type==='review'?' · GM review needed':'').join('');
   }
   li.append(headline,details);eventList.append(li);
  }
  view.querySelector('[data-combat-empty]').hidden=events.length>0;
 }
 const decisionClick=event=>{
  const end=event.target.closest('[data-end-battle]');
  if(end&&state.admin&&state.battle?.length){
   if(confirm('End this battle? All combatants will leave initiative, but combat history will be kept.'))
    send({type:'end-battle',requestId:crypto.randomUUID()});
   return;
  }
  if(!state.admin)return;
  const approve=event.target.closest('[data-approve-combat]'),reject=event.target.closest('[data-reject-combat]');
  const id=approve?.dataset.approveCombat||reject?.dataset.rejectCombat;
  if(id)send({type:'combat-decision',id,approve:!!approve,requestId:crypto.randomUUID()});
 };
 const turnClick=event=>{
  const button=event.target.closest('[data-turn]');
  if(!button||!view.contains(button)||!state.admin||button.disabled)return;
  const direction=Number(button.dataset.turn);
  if(direction)send({type:'turn',direction,requestId:crypto.randomUUID()});
 };
 const scroll=()=>{
  for(const node of root.querySelectorAll('.battle-defenses'))node.hidden=true;
  for(const button of root.querySelectorAll('.battle-ac'))button.setAttribute('aria-expanded','false');
 };
 view.querySelector('footer').addEventListener('click',turnClick);
 view.addEventListener('click',decisionClick);
 view.querySelector('.battle-scroll').addEventListener('scroll',scroll);
 render();
 return {
  state(next){state=next;edits.confirm(next);render();},
  history(value){events=Array.isArray(value)?value.slice(0,120):[];render();},
  result(data){const handled=edits.result(data);render();return handled;},
  close(){edits.close();view.removeEventListener('click',decisionClick);view.querySelector('footer').removeEventListener('click',turnClick);view.querySelector('.battle-scroll').removeEventListener('scroll',scroll);}
 };
}
