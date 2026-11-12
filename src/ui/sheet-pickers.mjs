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

export {openInventoryPicker} from './inventory-shop-picker.mjs';

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
