import {recordId} from './record-id.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let ghost;
export function mountItems({fixture=false}={}){
 const root=document.querySelector('[data-item-admin]'),controller=new AbortController();
 let closed=false,busy=false,items=[],editing=null,draftId=null,q='',sourceId='',archived=false,cursor='',nextCursor=null;
 const status=message=>{if(!closed){const node=root.querySelector('[data-item-status]');if(node)node.textContent=message;}};
 function setBusy(value){busy=value;if(!closed)for(const input of root.querySelectorAll('input,select,textarea,button'))input.disabled=value;}
 async function request(path,body){
  const response=await fetch('/api/v1/admin/items'+path,{signal:controller.signal,credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const result=await response.json();if(!response.ok)throw Error(result.message||({401:'Sign in to continue.',403:'Administrator access required.',404:'Item not found. Reload the list.',409:'This item changed. Reload before saving.',429:'Too many changes. Wait a minute and try again.'}[response.status]||'Could not connect. Try again.'));return result;
 }
 function drawEditor(){
  if(closed)return;
  const item=editing;
  root.querySelector('[data-item-editor]').innerHTML=`<h2>${item?'Edit item':'Add item'}</h2><form data-item-form><label for="item-name">Item name</label><input type="text" id="item-name" name="name" required maxlength="80" value="${esc(item?.name)}"><div class="item-source-fields"><div><label for="item-source">Source ID</label><input type="text" id="item-source" name="sourceId" required maxlength="64" value="${esc(item?.sourceId)}"></div><div><label for="item-version">Source version</label><input type="text" id="item-version" name="sourceVersion" required maxlength="64" value="${esc(item?.sourceVersion)}"></div></div><label for="item-category">Category</label><input type="text" id="item-category" name="category" maxlength="40" value="${esc(item?.category)}"><label for="item-description">Description</label><textarea id="item-description" name="description" maxlength="4000" rows="6">${esc(item?.description)}</textarea><div class="actions"><button class="button primary" type="submit">Save item</button><button class="button" type="button" data-cancel>Cancel</button>${item?`<button class="button" type="button" data-archive>${item.archived?'Restore item':'Archive item'}</button>`:''}</div></form>${item?`<p class="field-help item-id">Item ID: ${esc(item.id)}</p>`:''}`;
 }
 function draw(){
  if(closed)return;
  root.innerHTML=`${fixture?'<p class="field-help">Ghost preview · Sample items. Changes reset on refresh and never reach real data.</p>':''}<p role="status" tabindex="-1" data-item-status></p><div class="actions"><button class="button" type="button" data-reload>Reload items</button><button class="button primary" type="button" data-new>Add item</button></div><form data-item-search class="character-search"><div><label for="item-search">Find item</label><input type="text" id="item-search" name="q" maxlength="80" value="${esc(q)}"></div><div><label for="source-search">Filter by source ID</label><input type="text" id="source-search" name="sourceId" maxlength="64" value="${esc(sourceId)}"></div><label class="group-check"><input type="checkbox" name="archived" ${archived?'checked':''}>Archived</label><button class="button" type="submit">Search</button></form><div class="character-admin-grid"><section class="account-section" aria-label="Item list">${items.map(item=>`<article class="character-record"><h2>${esc(item.name)}</h2><p>${esc(item.sourceId)} · ${esc(item.sourceVersion)}${item.category?' · '+esc(item.category):''}</p><button class="button" type="button" data-edit="${esc(item.id)}">Edit <span class="sr-only">${esc(item.name)}</span></button></article>`).join('')||'<p>No items found.</p>'}<div class="actions">${cursor?'<button class="button" type="button" data-first>First page</button>':''}${nextCursor?'<button class="button" type="button" data-next>Next page</button>':''}</div></section><section class="account-section" data-item-editor><p>Select an item or add one.</p></section></div>`;
 }
 async function load(message=''){
  if(busy||closed)return;setBusy(true);editing=null;draftId=null;
  try{
   if(fixture){
    ghost??=[{id:'fixture:item:1',name:'Preview item',sourceId:'preview',sourceVersion:'1',category:'Example',description:'Sample item description.',archived:false,revision:1,schemaVersion:1}];
    const rows=ghost.filter(item=>item.archived===archived&&item.name.toLowerCase().includes(q.toLowerCase())&&(!sourceId||item.sourceId===sourceId)&&(!cursor||item.id>cursor)).sort((a,b)=>a.id<b.id?-1:1);
    items=rows.slice(0,20).map(({description,...summary})=>structuredClone(summary));nextCursor=rows.length>20?rows[19].id:null;
   }else{const result=await request('?'+new URLSearchParams({q,sourceId,archived:archived?'1':'0',cursor}));items=result.items;nextCursor=result.nextCursor;}
   draw();status(message);
  }catch(error){if(!closed)root.innerHTML=`<p role="status">${esc(error.message)}</p><button class="button" type="button" data-reload>Reload</button>${fixture?'':'<a class="button" href="preview/admin-items.html">Ghost preview</a>'}`;}
  finally{setBusy(false);}
 }
 root.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button||busy)return;
  if(button.hasAttribute('data-reload')){void load();return;}
  if(button.hasAttribute('data-first')){cursor='';void load();return;}
  if(button.hasAttribute('data-next')){cursor=nextCursor;void load();return;}
  if(button.hasAttribute('data-new')){editing=null;draftId=recordId();drawEditor();root.querySelector('#item-name').focus();return;}
  if(button.hasAttribute('data-cancel')){editing=null;draftId=null;root.querySelector('[data-item-editor]').innerHTML='<p>Select an item or add one.</p>';return;}
  if(button.dataset.edit){
   setBusy(true);status('Loading item…');
   try{editing=fixture?structuredClone(ghost.find(item=>item.id===button.dataset.edit)):(await request('/'+encodeURIComponent(button.dataset.edit))).item;draftId=null;drawEditor();status('');if(!closed)root.querySelector('#item-name').focus();}catch(error){status(error.message);}finally{setBusy(false);}return;
  }
  if(button.hasAttribute('data-archive')&&editing){
   const item=editing;setBusy(true);status(item.archived?'Restoring…':'Archiving…');
   try{
    if(fixture)Object.assign(ghost.find(i=>i.id===item.id),{archived:!item.archived,revision:item.revision+1});
    else await request('',{op:'archive',id:item.id,revision:item.revision,archived:!item.archived});
    setBusy(false);cursor='';await load(item.archived?'Item restored.':'Item archived.');
   }catch(error){status(error.message);}finally{setBusy(false);}
  }
 },{signal:controller.signal});
 root.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;const form=event.target,data=new FormData(form);
  if(form.hasAttribute('data-item-search')){q=String(data.get('q')).trim();sourceId=String(data.get('sourceId')).trim();archived=data.has('archived');cursor='';void load();return;}
  if(!form.hasAttribute('data-item-form'))return;
  const change={op:'save',id:editing?.id||draftId,revision:editing?.revision||0,...Object.fromEntries(Array.from(data,([key,value])=>[key,String(value).trim()]))};
  if(!['sourceId','sourceVersion'].every(key=>/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(change[key]))){status('Source ID and version use letters, numbers, dots, dashes or underscores.');return;}
  setBusy(true);status('Saving…');
  try{
   if(fixture){const old=ghost.find(item=>item.id===change.id),record={...change,archived:old?.archived||false,revision:change.revision+1,schemaVersion:1};if(old)Object.assign(old,record);else ghost.push(record);}
   else await request('',change);
   setBusy(false);cursor='';await load(fixture?'Preview updated.':'Item saved.');
  }catch(error){status(error.message);}finally{setBusy(false);}
 },{signal:controller.signal});
 void load();return ()=>{closed=true;controller.abort();};
}
