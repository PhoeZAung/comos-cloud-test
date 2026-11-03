import OBR from '@owlbear-rodeo/sdk';
import {trackerRows} from './tracker.mjs';
import {KEY,UI,HUD} from './party-state.mjs';
const root=document.querySelector('[data-status-cards]'),header=document.querySelector('.hud-header'),params=new URLSearchParams(location.search),widget=HUD+'/party';
document.documentElement.classList.add('portrait-strip');document.body.dataset.density=params.get('density')||'compact';
const person='<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="22" r="11" fill="currentColor"/><path d="M12 58v-9a20 20 0 0140 0v9" fill="currentColor"/></svg>';
let gm=false,metadata={},expiry,drag;const cards=new Map(),pending=new Map();
const send=data=>OBR.broadcast.sendMessage(UI,data,{destination:'LOCAL'});
const text=(node,value)=>{value=String(value);if(node.textContent!==value)node.textContent=value;};
function discard(id){const item=pending.get(id);if(item)clearTimeout(item.timer);pending.delete(id);}
function create(row){
 const node=document.createElement('article');node.className='party-person';node.innerHTML='<div class="party-face"><div class="party-portrait"></div><button class="party-ac" aria-expanded="false"><small>AC</small><strong></strong></button></div><strong class="party-name"></strong><div class="party-values"><button class="party-value hp" data-key="hp"><span>HP</span><strong></strong></button><button class="party-value mp" data-key="mp"><span>MP</span><strong></strong></button></div><dl class="party-defenses" hidden><div><dt>Touch</dt><dd></dd></div><div><dt>Flat</dt><dd></dd></div><div><dt>CMD</dt><dd></dd></div></dl>';
 node.dataset.row=row.id;node.querySelector('.party-portrait').innerHTML=person;
 const card={node,name:node.querySelector('.party-name'),photo:node.querySelector('.party-portrait'),ac:node.querySelector('.party-ac'),hp:node.querySelector('[data-key=hp]'),mp:node.querySelector('[data-key=mp]'),details:node.querySelector('dl'),source:''};
 card.ac.onclick=()=>{const open=card.details.hidden;card.details.hidden=!open;card.ac.setAttribute('aria-expanded',String(open));};
 for(const key of ['hp','mp'])card[key].onclick=()=>edit(row.id,key,card);
 return card;
}
function render(){
 const rows=trackerRows(metadata),active=new Map(rows.map(row=>[row.id,row]));
 for(const [id,item] of pending){const row=active.get(item.id);if(!row||item.revision&&row.revision>=item.revision)discard(id);}
 document.body.classList.toggle('empty-party',!rows.length);
 rows.forEach((raw,index)=>{
  const row=raw;
  let card=cards.get(row.id);if(!card){card=create(row);cards.set(row.id,card);}
  if(root.children[index]!==card.node)root.insertBefore(card.node,root.children[index]||null);
  text(card.name,row.name);card.name.title=row.name;text(card.ac.querySelector('strong'),row.ac);card.ac.setAttribute('aria-label','Armor class details for '+row.name);
  const source=row.portraitHash?'/api/v1/owlbear/party/portrait/'+encodeURIComponent(row.id)+'?v='+row.portraitHash:'';
  if(source!==card.source){card.source=source;if(source){const image=new Image();image.src=source;image.alt=row.name+' character portrait';image.decoding='async';image.onerror=()=>{if(card.source===source)card.photo.innerHTML=person;};card.photo.replaceChildren(image);}else card.photo.innerHTML=person;}
  for(const key of ['hp','mp']){const button=card[key];button.classList.toggle('saving',[...pending.values()].some(item=>item.id===row.id&&item.key===key));text(button.querySelector('strong'),row[key]);button.disabled=!gm;button.title=key.toUpperCase()+' '+row[key]+' / '+row[key==='hp'?'hpMax':'mpMax'];button.setAttribute('aria-label',(gm?'Edit current ':'Current ')+key.toUpperCase()+' for '+row.name);}
  card.details.querySelectorAll('dd').forEach((node,i)=>text(node,row[['touch','flat','cmd'][i]]));
 });
 for(const [id,card] of cards)if(!active.has(id)){card.node.remove();cards.delete(id);}
}
function edit(id,key,card){
 if(!gm||card.node.querySelector('input'))return;const row=trackerRows(metadata).find(row=>row.id===id);if(!row)return;
 const previous=[...pending.values()].filter(item=>item.id===id&&item.key===key).at(-1),input=document.createElement('input');input.className='party-resource-input';input.type='number';input.step='1';input.min=key==='mp'?'0':'-9999999';input.max='9999999';input.value=previous?.value??row[key];input.setAttribute('aria-label','Current '+key.toUpperCase()+' for '+row.name);card[key].replaceWith(input);input.focus();input.select();let cancelled=false,done=false;
 input.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();cancelled=true;input.blur();}else if(event.key==='Enter'){event.preventDefault();input.blur();}};
 input.onblur=()=>{
  if(done)return;done=true;input.replaceWith(card[key]);const value=Number(input.value);
  if(!cancelled&&input.value!==''&&Number.isFinite(value)&&Math.abs(value)<1e7&&(key!=='mp'||value>=0)&&value!==(previous?.value??row[key])){
   const requestId=crypto.randomUUID(),item={id,key,value,timer:setTimeout(()=>{discard(requestId);render();void OBR.notification.show('Reconnect Cosmos to save this change.','ERROR');},10000)};pending.set(requestId,item);render();
   void send({id,revision:row.revision,stats:{[key]:value},requestId}).catch(error=>{discard(requestId);render();void OBR.notification.show(error.message,'ERROR');});
  }else render();
 };
}
function changed(value){metadata=value;render();clearTimeout(expiry);if(Number.isFinite(value[KEY]?.updatedAt))expiry=setTimeout(render,Math.max(100,value[KEY].updatedAt+45100-Date.now()));}
header.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();header.setPointerCapture(event.pointerId);drag={x:event.screenX,y:event.screenY};};
header.onpointerup=event=>{if(!drag)return;const move={x:Number(params.get('x'))+event.screenX-drag.x,y:Number(params.get('y'))+event.screenY-drag.y};drag=null;void send({move});};header.onpointercancel=()=>{drag=null;};
const menu=document.createElement('div');menu.className='party-menu';menu.hidden=true;menu.innerHTML='<button data-density="normal">Full</button><button data-density="compact">Compact</button><button data-density="tiny">Small</button><button data-close>Close</button>';document.querySelector('.party-hud').append(menu);
document.oncontextmenu=event=>{event.preventDefault();menu.hidden=false;};menu.onclick=event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.density)void send({density:b.dataset.density});menu.hidden=true;};
OBR.onReady(async()=>{
 gm=await OBR.player.getRole()==='GM';const ownId=await OBR.player.getConnectionId();
 OBR.broadcast.onMessage(UI+'/public-state',event=>{if(event.connectionId!==ownId||!event.data?.snapshot)return;changed({[KEY]:event.data.snapshot});});
 OBR.broadcast.onMessage(UI+'/edit-result',event=>{
  if(event.connectionId!==ownId)return;const result=event.data,item=pending.get(result?.requestId);if(!item)return;
  if(result.error){discard(result.requestId);void OBR.notification.show(result.error,'ERROR');}else item.revision=result.revision;
  render();
 });
 OBR.player.onChange(player=>{if(gm!==(player.role==='GM')){gm=player.role==='GM';render();}});
 await send({stateRequest:true});
});
window.addEventListener('pagehide',()=>{clearTimeout(expiry);for(const id of pending.keys())discard(id);},{once:true});
