import {mergeRollHistory} from '../features/room-rolls.mjs';
export function mountPanel(root,{history,onSheetTab=()=>{},onCloseSheet=()=>{},onView=()=>{}}={}){
 let selected='character',admin=false,connected=false,loading=false,again=false,closed=false,generation=0,personal=[],shared=[],signature='',sheets=[];
 const buttons=()=>[...root.querySelectorAll('[data-panel-tab]')],panels=[...root.querySelectorAll('[data-panel-view]')],first=root.querySelector('[data-panel-tab="character"]'),adminButton=root.querySelector('[data-panel-tab="admin"]'),list=root.querySelector('[data-roll-history]'),status=root.querySelector('[data-history-status]'),historyDetails=root.querySelector('[data-history-details]');
 const historyVisible=()=>selected==='settings'&&historyDetails.open;
 function selectedSheetId(){return selected.startsWith('sheet:')?selected.slice(6):sheets[0]?.id||null;}
 function syncTabs(){
  for(const button of buttons()){const active=button.dataset.panelTab===selected;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}
 }
 function select(value){
  if(value==='admin'&&!admin)value='character';
  if(value.startsWith('sheet:')&&!sheets.some(sheet=>sheet.id===value.slice(6)))value='character';
  const leavingSheet=(selected==='character'||selected.startsWith('sheet:'))&&value!=='character'&&!value.startsWith('sheet:');
  // Capture scroll before hiding the iframe's container.
  if(leavingSheet)onView(value);
  selected=value;syncTabs();
  for(const panel of panels)panel.hidden=panel.dataset.panelView!==(value==='character'||value.startsWith('sheet:')?'character':value);
  if(value==='character'||value.startsWith('sheet:'))onSheetTab(selectedSheetId());
  else if(!leavingSheet)onView(value);
  if(historyVisible())void refresh();
 }
 function syncSheets(next){
  sheets=next.map(item=>({id:item.id,name:item.name}));
  // Keep the permanent Character button stable, but place each open sheet's
  // tab and close control inside the same styled chip.
  const oldFirst=root.querySelector('[data-first-sheet-tab-group]');
  if(oldFirst)oldFirst.replaceWith(first);
  first.classList.remove('cosmos-sheet-tab-button');
  for(const group of root.querySelectorAll('[data-extension-sheet-tab]'))group.remove();
  first.textContent=sheets.length>1?sheets[0].name:'Character';
  first.title=sheets.length>1?sheets[0].name:'Character';
  if(sheets.length>1){
   const wrap=(button,sheet,{initial=false}={})=>{
    const group=document.createElement('span');group.className='cosmos-sheet-tab-group';
    if(initial)group.dataset.firstSheetTabGroup='true';else group.dataset.extensionSheetTab='true';
    button.classList.add('cosmos-sheet-tab-button');
    const close=document.createElement('button');close.type='button';
    close.dataset.closeExtensionSheet=sheet.id;close.className='extension-sheet-close';
    close.title='Close '+sheet.name;close.setAttribute('aria-label','Close '+sheet.name);close.textContent='×';
    group.append(button,close);
    return group;
   };
   const position=document.createComment('First Cosmos sheet tab');first.replaceWith(position);
   position.replaceWith(wrap(first,sheets[0],{initial:true}));
   for(const sheet of sheets.slice(1)){
    const button=document.createElement('button');button.type='button';button.setAttribute('role','tab');
    button.dataset.panelTab='sheet:'+sheet.id;button.setAttribute('aria-controls','panel-character');
    button.id='tab-sheet-'+sheet.id;button.title=sheet.name;button.textContent=sheet.name;
    adminButton.before(wrap(button,sheet));
   }
  }
  if(selected.startsWith('sheet:')&&(!sheets.some(sheet=>sheet.id===selected.slice(6))||selected.slice(6)===sheets[0]?.id))select('character');
  else syncTabs();
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
  if(closed||!historyVisible())return;
  if(!connected){render(shared);if(!shared.length)status.textContent='Connect Cosmos to see your rolls.';return;}
  if(loading){again=true;return;}loading=true;const own=generation;
  if(!list.children.length)status.textContent='Loading…';
  try{const result=await history();if(!closed&&connected&&own===generation){personal=result.rolls;render(mergeRollHistory(personal,shared));}}
  catch(error){if(!closed&&own===generation)status.textContent=error.message||'Could not load rolls.';}
  finally{loading=false;if(again){again=false;void refresh();}}
 }
 const click=event=>{const close=event.target.closest('[data-close-extension-sheet]');if(close){onCloseSheet(close.dataset.closeExtensionSheet);return;}const button=event.target.closest('[data-panel-tab]');if(button)select(button.dataset.panelTab);};root.addEventListener('click',click);
 const keydown=event=>{const button=event.target.closest('[data-panel-tab]');if(!button||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const visible=buttons().filter(node=>!node.hidden),at=visible.indexOf(button),index=event.key==='Home'?0:event.key==='End'?visible.length-1:(at+(event.key==='ArrowRight'?1:visible.length-1))%visible.length;select(visible[index].dataset.panelTab);visible[index].focus();};root.addEventListener('keydown',keydown);
 root.querySelector('[data-refresh-history]').onclick=()=>void refresh();
 historyDetails.addEventListener('toggle',()=>{if(historyVisible())void refresh();});
 const timer=setInterval(()=>void refresh(),5000);select('character');
 return {select,syncSheets,admin(value){admin=value===true;root.querySelector('[data-panel-tab="admin"]').hidden=!admin;if(!admin&&selected==='admin')select('character');},connected(value){generation++;connected=value===true;if(!connected){personal=[];list.replaceChildren();}void refresh();},shared(value){shared=Array.isArray(value)?value:[];if(historyVisible())render(mergeRollHistory(personal,shared));},invalidate(){void refresh();},close(){closed=true;clearInterval(timer);root.removeEventListener('click',click);root.removeEventListener('keydown',keydown);}};
}
