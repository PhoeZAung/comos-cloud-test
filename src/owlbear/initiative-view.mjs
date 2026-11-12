import {resourceEditor,defenses} from './tracker-view.mjs';

// Shared initiative UI for the extension tab and legacy standalone view.
// State and permissions always come from the Owlbear background controller.
export function mountInitiative(view,send){
 const root=view.querySelector('tbody'),cards=new Map();
 let state={battle:[],party:[],turn:{},admin:false};
 const edits=resourceEditor(()=>state,value=>send(value));
 function render(){
  const active=new Set(),visible=Array.isArray(state.battle)?state.battle:[],turn=state.turn?.id||visible[0]?.id;
  for(const [index,row] of visible.entries()){
   active.add(row.id);let card=cards.get(row.id);
   if(!card){
    const node=document.createElement('tr');
    node.innerHTML='<td><input class="initiative-input" type="number" step="1" aria-label="Initiative"></td><td class="battle-name"></td><td><button data-key="hp" class="battle-resource hp"></button></td><td><button data-key="mp" class="battle-resource mp"></button></td><td class="ac-cell"><button class="battle-ac" aria-expanded="false"></button><div class="battle-defenses" hidden></div></td>';
    card={node,input:node.querySelector('input')};cards.set(row.id,card);
    const name=node.querySelector('.battle-name');name.tabIndex=0;name.setAttribute('aria-label','Highlight '+row.name+' on map');
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
   if(document.activeElement!==card.input)card.input.value=row.initiative;
   card.input.disabled=!state.admin;card.input.setAttribute('aria-label',row.name+' initiative');
   card.node.querySelector('.battle-name').textContent=row.name;
   for(const key of ['hp','mp']){
    const button=card[key],untracked=key==='hp'&&!row.trackHp;
    button.textContent=untracked?'—':String(row[key]);
    button.title=untracked?'HP not tracked':'Current '+key.toUpperCase()+' · max '+row[key==='hp'?'hpMax':'mpMax'];
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
 }
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
 view.querySelector('.battle-scroll').addEventListener('scroll',scroll);
 render();
 return {
  state(next){state=next;edits.confirm(next);render();},
  result(data){const handled=edits.result(data);render();return handled;},
  close(){edits.close();view.querySelector('footer').removeEventListener('click',turnClick);view.querySelector('.battle-scroll').removeEventListener('scroll',scroll);}
 };
}
