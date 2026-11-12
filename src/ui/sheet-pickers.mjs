import {escape} from '../features/sheet/view.mjs';
import {renderCategoryTiles} from '../features/sheet/item-categories.mjs';

function openPicker(root,title,content,signal){
 const dialog=document.createElement('dialog');
 dialog.className='cs-dialog cs-picker';
 dialog.setAttribute('aria-labelledby','cs-picker-title');
 dialog.innerHTML='<header><h2 id="cs-picker-title">'+escape(title)+'</h2><button class="cs-icon" type="button" data-picker-close aria-label="Close">×</button></header>'+content+'<p class="cs-caption" role="status"></p>';
 root.append(dialog);
 dialog.querySelector('[data-picker-close]').onclick=()=>dialog.close();
 const request=new AbortController();
 const dispose=()=>{request.abort();dialog.remove();signal.removeEventListener('abort',dispose);};
 dialog.addEventListener('close',dispose,{once:true});
 signal.addEventListener('abort',dispose,{once:true});
 dialog.showModal();
 return {dialog,request:request.signal};
}

async function get(path,signal){
 const response=await fetch(path,{signal,credentials:'same-origin',cache:'no-store'});
 if(!response.ok)throw Error(response.status===401?'Sign in and try again.':response.status===429?'Wait a moment and try again.':'Could not load this list.');
 return response.json();
}

export function openInventoryPicker(root,{signal,onAdd,onCustom}){
 const {dialog,request}=openPicker(root,'Add item',`<div data-picker-categories></div>
  <form class="cs-picker-search"><input name="q" aria-label="Search items" placeholder="Search items" maxlength="80"><button class="button">Search</button></form>
  <div class="cs-picker-list" data-picker-list></div>
  <div class="cs-picker-footer"><button class="button" data-custom-item type="button">Custom item</button><button class="button" data-picker-next type="button" hidden>More</button></div>
  <form class="cs-picker-footer" data-item-quantity hidden><strong data-item-name></strong><label>Qty <input name="quantity" type="number" min="1" max="999" value="1" required></label><button class="button primary">Add item</button></form>`,signal);
 const status=dialog.querySelector('[role=status]'),list=dialog.querySelector('[data-picker-list]');
 const categories=dialog.querySelector('[data-picker-categories]'),next=dialog.querySelector('[data-picker-next]');
 const quantity=dialog.querySelector('[data-item-quantity]');
 let counts={},items=[],selected=null,category='All',query='',cursor=null,busy=false;
 const paintCategories=()=>{categories.innerHTML=renderCategoryTiles(counts,category,{attribute:'data-picker-category',label:'Item categories',groups:true,iconOnly:true});};
 async function load(append=false){
  if(busy)return;
  busy=true;status.textContent='Loading items…';
  if(!append){items=[];selected=null;quantity.hidden=true;list.replaceChildren();next.hidden=true;}
  try{
   const params=new URLSearchParams({q:query,category:category==='All'?'':category,cursor:append?cursor:''});
   const result=await get('/api/v1/item-catalog?'+params,request);
   if(!dialog.open)return;
   items=items.concat(result.items);cursor=result.nextCursor;next.hidden=!cursor;
   list.innerHTML=items.map(item=>'<button class="cs-picker-row" type="button" data-catalog-item="'+escape(item.id)+'" aria-pressed="'+(selected?.id===item.id)+'"><span>'+escape(item.name)+'</span><small>'+escape(item.category)+'</small></button>').join('');
   status.textContent=items.length?'':'No items found.';
  }catch(error){if(dialog.open)status.textContent=error.message;}
  finally{busy=false;}
 }
 dialog.querySelector('.cs-picker-search').onsubmit=event=>{
  event.preventDefault();if(busy)return;query=event.currentTarget.elements.q.value.trim();void load();
 };
 quantity.onsubmit=async event=>{
  event.preventDefault();if(!selected||busy)return;
  busy=true;
  try{
   const message=await onAdd(selected.id,Number(quantity.elements.quantity.value));
   if(message&&dialog.open)status.textContent=message;
   else if(dialog.open)dialog.close();
  }finally{busy=false;}
 };
 dialog.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||busy)return;
  if(button.hasAttribute('data-custom-item')){dialog.close();onCustom();return;}
  if(button.hasAttribute('data-picker-next')){void load(true);return;}
  if(button.dataset.pickerCategory){category=button.dataset.pickerCategory;paintCategories();void load();return;}
  if(button.dataset.catalogItem){
   selected=items.find(item=>item.id===button.dataset.catalogItem);if(!selected)return;
   for(const row of list.children)row.setAttribute('aria-pressed',String(row===button));
   quantity.querySelector('[data-item-name]').textContent=selected.name;
   quantity.hidden=false;quantity.elements.quantity.value='1';
  }
 });
 void get('/api/v1/item-catalog/categories',request).then(result=>{
  if(!dialog.open)return;
  counts=Object.fromEntries(result.categories.map(item=>[item.category,item.count]));paintCategories();
 }).catch(()=>{if(dialog.open)paintCategories();});
 void load();
}

export function openCharacterPicker(root,{signal,hasTab,onSelect}){
 const {dialog,request}=openPicker(root,'Open character sheet',`<div class="cs-picker-list" data-picker-list></div>
  <div class="cs-picker-footer"><button class="button" type="button" data-picker-next hidden>More</button></div>`,signal);
 const list=dialog.querySelector('[data-picker-list]'),status=dialog.querySelector('[role=status]'),next=dialog.querySelector('[data-picker-next]');
 const characters=new Map();let cursor='',busy=false;
 async function load(){
  if(busy)return;busy=true;status.textContent='Loading characters…';
  try{
   const result=await get('/api/v1/my/characters'+(cursor?'?'+new URLSearchParams({cursor}):''),request);
   if(!dialog.open)return;
   for(const character of result.characters)if(!hasTab(character.id))characters.set(character.id,character);
   list.innerHTML=[...characters.values()].map(character=>'<button type="button" class="cs-picker-row" data-pick-character="'+escape(character.id)+'">'+escape(character.name)+'</button>').join('');
   cursor=result.nextCursor||'';next.hidden=!cursor;
   status.textContent=characters.size?'':cursor?'More characters are available.':'No other sheets to open.';
  }catch(error){if(dialog.open)status.textContent=error.message;}
  finally{busy=false;}
 }
 dialog.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||busy)return;
  if(button.hasAttribute('data-picker-next')){void load();return;}
  const character=characters.get(button.dataset.pickCharacter);
  if(character){dialog.close();onSelect(character);}
 });
 void load();
}
