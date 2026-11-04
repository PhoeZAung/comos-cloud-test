import {mergeRollHistory} from '../features/room-rolls.mjs';
export function mountPanel(root,{history}={}){
 let selected='character',admin=false,connected=false,loading=false,again=false,closed=false,generation=0,personal=[],shared=[],signature='';
 const buttons=[...root.querySelectorAll('[data-panel-tab]')],panels=[...root.querySelectorAll('[data-panel-view]')],list=root.querySelector('[data-roll-history]'),status=root.querySelector('[data-history-status]');
 function select(value){
  selected=value==='admin'&&!admin?'character':value;
  for(const button of buttons){const active=button.dataset.panelTab===selected;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}
  for(const panel of panels)panel.hidden=panel.dataset.panelView!==selected;
  if(selected==='roll')void refresh();
 }
 function render(rows){
  const next=JSON.stringify(rows);status.textContent=rows.length?'':'No rolls yet.';if(signature===next&&list.children.length===rows.length)return;signature=next;
  list.replaceChildren();
  for(const row of rows){
   const item=document.createElement('li'),header=document.createElement('header'),name=document.createElement('strong'),time=document.createElement('time'),label=document.createElement('p');
   name.textContent=row.character;time.dateTime=new Date(row.time).toISOString();time.textContent=new Date(row.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});time.title=new Date(row.time).toLocaleString();header.append(name,time);label.textContent=(row.player?row.player+' · ':'')+row.label;item.append(header,label);
   for(const part of row.parts){const line=document.createElement('div'),total=document.createElement('strong'),details=document.createElement('span');line.className='history-result';total.textContent=part.label+' '+part.total;details.textContent=part.expression+(part.faces.length?' · '+part.faces.join(', '):'');line.append(total,details);item.append(line);}
   list.append(item);
  }
  status.textContent=rows.length?'':'No rolls yet.';
 }
 async function refresh(){
  if(closed||selected!=='roll')return;
  if(!connected){render(shared);if(!shared.length)status.textContent='Connect Cosmos to see your rolls.';return;}
  if(loading){again=true;return;}loading=true;const own=generation;
  if(!list.children.length)status.textContent='Loading…';
  try{const result=await history();if(!closed&&connected&&own===generation){personal=result.rolls;render(mergeRollHistory(personal,shared));}}
  catch(error){if(!closed&&own===generation)status.textContent=error.message||'Could not load rolls.';}
  finally{loading=false;if(again){again=false;void refresh();}}
 }
 const click=event=>{const button=event.target.closest('[data-panel-tab]');if(button)select(button.dataset.panelTab);};root.addEventListener('click',click);
 const keydown=event=>{const button=event.target.closest('[data-panel-tab]');if(!button||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const visible=buttons.filter(node=>!node.hidden),at=visible.indexOf(button),index=event.key==='Home'?0:event.key==='End'?visible.length-1:(at+(event.key==='ArrowRight'?1:visible.length-1))%visible.length;select(visible[index].dataset.panelTab);visible[index].focus();};root.addEventListener('keydown',keydown);
 root.querySelector('[data-refresh-history]').onclick=()=>void refresh();
 const timer=setInterval(()=>void refresh(),5000);select('character');
 return {admin(value){admin=value===true;root.querySelector('[data-panel-tab="admin"]').hidden=!admin;if(!admin&&selected==='admin')select('character');},connected(value){generation++;connected=value===true;if(!connected){personal=[];list.replaceChildren();}void refresh();},shared(value){shared=Array.isArray(value)?value:[];if(selected==='roll')render(mergeRollHistory(personal,shared));},invalidate(){void refresh();},close(){closed=true;clearInterval(timer);root.removeEventListener('click',click);root.removeEventListener('keydown',keydown);}};
}
