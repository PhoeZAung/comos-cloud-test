import {resourceEditor,defenses} from './tracker-view.mjs';
import {initiativeLinkStatus} from './initiative-link.mjs';
import {combatEventVerdict} from '../features/sheet/combat-verdict.mjs';
import {historyPage,nextHistoryLimit} from './history-window.mjs';

// Shared initiative UI for the extension tab and legacy standalone view.
// State and permissions always come from the Owlbear background controller.
export function mountInitiative(view,send,{historyRoot=view}={}){
 const root=view.querySelector('tbody'),cards=new Map();
 let state={battle:[],party:[],turn:{},admin:false,approvals:[]},events=[],combatLimit=5;
 const combatHistory=historyRoot.querySelector('[data-combat-history]')||view.querySelector('[data-combat-history]');
 const combatList=combatHistory.querySelector('[data-combat-events]'),combatMore=combatHistory.querySelector('[data-combat-load-more]');
 const edits=resourceEditor(()=>state,value=>send(value));
 function render(){
  const active=new Set(),visible=Array.isArray(state.battle)?state.battle:[],turn=state.turn?.id===undefined?visible[0]?.id:state.turn.id;
  for(const [index,row] of visible.entries()){
   active.add(row.id);let card=cards.get(row.id);
   if(!card){
    const node=document.createElement('tr');
    node.innerHTML='<td><input class="initiative-input" type="number" step="1" aria-label="Initiative"></td><td class="battle-name"><button type="button" class="battle-locate"><span class="battle-link-indicator" aria-hidden="true"></span><span class="battle-locate-label"></span></button></td><td class="battle-hp-cell"><span class="battle-hp-controls"><button type="button" class="battle-hp-privacy" title="Hide NPC HP, MP and AC from players" aria-label="Hide NPC HP, MP and AC from players" aria-pressed="false" hidden><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><path class="eye-slash" d="M3 3 21 21"/></svg></button><button data-key="hp" class="battle-resource hp"></button></span></td><td><button data-key="mp" class="battle-resource mp"></button></td><td class="ac-cell"><button class="battle-ac" aria-expanded="false"></button><div class="battle-defenses" hidden></div></td>';
    card={node,input:node.querySelector('input')};cards.set(row.id,card);
    const name=node.querySelector('.battle-locate');name.setAttribute('aria-label','Center camera on '+row.name);name.title='Center camera on '+row.name;name.onclick=()=>send({type:'locate',id:row.id});
    name.onpointerenter=()=>send({type:'highlight',id:row.id});
    name.onpointerleave=()=>send({type:'highlight',id:null});
    name.onfocus=()=>send({type:'highlight',id:row.id});
    name.onblur=()=>send({type:'highlight',id:null});
    card.input.onchange=()=>{const value=Number(card.input.value);if(card.input.value!==''&&Number.isFinite(value))send({type:'initiative',id:row.id,value,requestId:crypto.randomUUID()});};
    for(const key of ['hp','mp']){card[key]=node.querySelector('[data-key='+key+']');card[key].onclick=()=>edits.edit(row.id,key,card[key],true);}
    card.hpPrivacy=node.querySelector('.battle-hp-privacy');
    card.hpPrivacy.onclick=()=>{
     const current=state.battle?.find(entry=>entry.id===row.id);
     if(!state.admin||!current||current.siteId||!current.available)return;
     send({type:'npc-hp-visibility',id:row.id,hidden:current.hpHidden!==true,requestId:crypto.randomUUID()});
    };
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
   const locateButton=card.node.querySelector('.battle-locate');locateButton.querySelector('.battle-locate-label').textContent=row.name;
   const hidden=row.visible===false&&state.gm===true;
   card.node.querySelector('.battle-name').classList.toggle('hidden-from-players',hidden);
   locateButton.setAttribute('aria-label','Center camera on '+row.name+(hidden?' (hidden from players)':'')+' · '+linkStatus.label);
   locateButton.title=(hidden?'Hidden from players · ':'')+'Center camera on '+row.name+' · '+linkStatus.label;
   const indicator=locateButton.querySelector('.battle-link-indicator');indicator.title=linkStatus.label;indicator.dataset.linkStatus=linkStatus.kind;
   const hpPrivacy=card.hpPrivacy,canHideHp=state.admin===true&&!row.siteId&&row.available!==false;
   hpPrivacy.hidden=!canHideHp;hpPrivacy.disabled=!canHideHp;
   hpPrivacy.classList.toggle('is-hidden',row.hpHidden===true);
   hpPrivacy.setAttribute('aria-pressed',String(row.hpHidden===true));
   hpPrivacy.setAttribute('aria-label',(row.hpHidden===true?'Show':'Hide')+' '+row.name+' HP, MP and AC to players');
   hpPrivacy.title=(row.hpHidden===true?'NPC HP, MP and AC hidden from players · click to show':'Click to hide NPC HP, MP and AC from players')+(state.layout?.npcHp!==true?' · room-wide NPC HP sharing is off':'');
   for(const key of ['hp','mp']){
    const button=card[key],untracked=row[key]===null||key==='hp'&&!row.trackHp;
    button.textContent=untracked?'—':String(row[key]);
    button.title=untracked?(row[key]===null?key.toUpperCase()+' hidden by GM':'HP not tracked'):'Current '+key.toUpperCase()+' · max '+row[key==='hp'?'hpMax':'mpMax'];
    button.disabled=!state.admin||!row.available||untracked;
    button.classList.toggle('saving',edits.pending(row.id,key));
   }
   const ac=card.node.querySelector('.battle-ac'),defenseView=card.node.querySelector('.battle-defenses');
   ac.textContent=row.ac===null?'—':row.ac;
   ac.disabled=row.ac===null;
   if(ac.disabled){defenseView.hidden=true;ac.setAttribute('aria-expanded','false');}
   defenseView.textContent=row.ac===null?'':defenses(row);
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
  const {rows:recent,hasMore,remaining}=historyPage(events,combatLimit);
  combatList.replaceChildren();
  for(const event of recent){
   const li=document.createElement('li'),headline=document.createElement('strong'),details=document.createElement('small');
   if(event.kind==='end'){
    headline.textContent='Battle ended';details.textContent='Battle '+event.battle;
   }else{
    headline.textContent=(combatEventVerdict(event)||'RESULT')+' · '+event.actor+' → '+event.target;
    details.textContent='Round '+event.round+' · '+(event.action||event.source||'Action')+
      ' · '+(event.kind==='heal'?'Healed':event.kind==='temp_hp'?'Temp HP':'Damage')+
      ' '+(event.hpUntracked?event.amount+' · HP not tracked · GM decides':event.applied??0)+(event.hit===false?' ('+(event.reason||'missed')+')':'')+(event.critical?' · Critical':'')+
      (event.mitigation||[]).map(part=>part.type==='sr'?' · SR '+part.total+'/'+part.sr+(part.passed?' passed':' resisted'):part.type==='dr'?' · DR '+(part.reduced||0)+' blocked':part.type==='energy'?' · '+part.energy+' '+(part.before-part.after)+' resisted':part.type==='save'?' · '+(part.save==='fort'?'Fort':part.save==='ref'?'Ref':'Will')+' '+part.total+' vs DC '+part.dc+(part.passed?' saved':' failed'):part.type==='review'?' · GM review needed':'').join('');
   }
   li.append(headline,details);combatList.append(li);
  }
  combatHistory.querySelector('[data-combat-empty]').hidden=events.length>0;
  if(combatMore){combatMore.hidden=!hasMore;combatMore.textContent='Load 5 more'+(remaining?' ('+remaining+' older)':'');}
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
 const loadCombatMore=()=>{combatLimit=nextHistoryLimit(combatLimit);render();};
 combatMore?.addEventListener('click',loadCombatMore);
 view.querySelector('footer').addEventListener('click',turnClick);
 view.addEventListener('click',decisionClick);
 view.querySelector('.battle-scroll').addEventListener('scroll',scroll);
 render();
 return {
  state(next){state=next;edits.confirm(next);render();},
  history(value){events=Array.isArray(value)?value.slice(0,120):[];render();},
  result(data){const handled=edits.result(data);render();return handled;},
  close(){edits.close();combatMore?.removeEventListener('click',loadCombatMore);view.removeEventListener('click',decisionClick);view.querySelector('footer').removeEventListener('click',turnClick);view.querySelector('.battle-scroll').removeEventListener('scroll',scroll);}
 };
}
