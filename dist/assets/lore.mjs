import {renderLoreLibrary} from '../features/lore/library.mjs';
import {renderLoreEntry} from './lore-entry.mjs';

export function mountLore({fixture=false}={}){
 const root=document.querySelector('[data-lore-library]');if(!root)return ()=>{};
 const controller=new AbortController();
 let closed=false,query='',searchOpen=false,tagsOpen=false,sortOpen=false,readerOpen=false,tagState=fixture?'ready':'loading',sort='newest';
 let readerId=null,readerEntry=null,readerCanDelete=false,readerCanEdit=false,readerError='',readerSerial=0;
 let tags=[],selectedTags=[],entries=[],cursor=null,canPublish=false,state=fixture?'ready':'loading';
 let generation=0,searchTimer=null;
 const modal=name=>root.querySelector(name==='tags'?'[data-lore-tags-dialog]':name==='sort'?'[data-lore-sort-dialog]':'[data-lore-reader-dialog]');
 const showModal=(name)=>{
  const dialog=modal(name);
  if(dialog&&!dialog.open)dialog.showModal();
 };
 const readerHtml=()=>readerError?'<p role="status" class="comos-lore-popup-status"></p>':readerEntry?renderLoreEntry(readerEntry,{canDelete:readerCanDelete,canEdit:readerCanEdit}):'<p role="status">Loading Lore…</p>';
 const paintReader=()=>{
  const content=root.querySelector('[data-lore-reader-content]');if(!content)return;
  content.innerHTML=readerHtml();
  if(readerError)content.querySelector('p').textContent=readerError;
 };
 const draw=()=>{
   if(closed)return;
   const keepSearchFocus=document.activeElement?.matches('[name=query]')===true;
   const selection=keepSearchFocus?document.activeElement.selectionStart:null;
   root.innerHTML=renderLoreLibrary({
    entries,availableTags:tags,selectedTags,query,searchOpen,tagsOpen,sortOpen,tagState,sort,
    state,preview:fixture,serverFiltered:!fixture,nextCursor:cursor,canPublish
   });
   paintReader();
   if(tagsOpen)showModal('tags');
   else if(sortOpen)showModal('sort');
   else if(readerOpen)showModal('reader');
   if(keepSearchFocus){const field=root.querySelector('[name=query]');field?.focus();if(Number.isInteger(selection))field?.setSelectionRange(selection,selection);}
 };
 async function loadEntries(more=false){
   if(fixture||closed)return;
   const seq=++generation;
   if(!more){entries=[];cursor=null;state='loading';draw();}
   const params=new URLSearchParams();
   params.set('sort',sort);
   if(query.trim())params.set('query',query.trim());
   for(const id of selectedTags)params.append('tagId',id);
   if(more&&cursor)params.set('cursor',cursor);
   try{
     const res=await fetch('/api/v1/lore?'+params,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
     if(seq!==generation||closed)return;
     if(res.status===401){canPublish=false;throw Error('Sign in to browse Lore.');}
     if(!res.ok)throw Error('Could not load Lore.');
     const data=await res.json();
     if(!Array.isArray(data.entries))throw Error('Invalid Lore response.');
     entries=more?[...entries,...data.entries]:data.entries;
     cursor=typeof data.nextCursor==='string'?data.nextCursor:null;
     canPublish=true;state='ready';draw();
   }catch(error){
     if(seq!==generation||closed||controller.signal.aborted)return;
     state='error';draw();
     const status=document.createElement('p');
     status.className='comos-lore-error';status.role='status';status.textContent=error.message;
     root.querySelector('.comos-lore-results')?.append(status);
   }
 }
 async function loadTags(){
   if(fixture||closed)return;
   tagState='loading';draw();
   try{
     const res=await fetch('/api/v1/my/lore-tags',{credentials:'same-origin',cache:'no-store',signal:controller.signal});
     if(!res.ok)throw Error('Your character tags are unavailable.');
     const data=await res.json();
     if(!Array.isArray(data.tags))throw Error('Invalid character tags.');
     tags=data.tags.filter(t=>t&&typeof t.id==='string'&&typeof t.name==='string');
     const allowed=new Set(tags.map(t=>t.id));
     selectedTags=selectedTags.filter(id=>allowed.has(id));
     tagState='ready';
   }catch(error){if(closed||controller.signal.aborted)return;tags=[];selectedTags=[];tagState='error';}
   draw();
 }
 async function openReader(id){
   if(!(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)))return;
   tagsOpen=false;sortOpen=false;readerOpen=true;readerEntry=null;readerCanDelete=false;readerCanEdit=false;readerError='';readerId=id;
   const ticket=++readerSerial;
   draw();
   try{
     const res=await fetch('/api/v1/lore/'+encodeURIComponent(id),{credentials:'same-origin',cache:'no-store',signal:controller.signal});
     if(!res.ok)throw Error(res.status===401?'Sign in to read Lore.':res.status===404?'Lore entry not found.':'Could not load Lore.');
     const data=await res.json();
     if(!data.entry)throw Error('Invalid Lore response.');
     if(ticket!==readerSerial||!readerOpen||closed)return;
     readerEntry=data.entry;readerCanDelete=data.canDelete===true;readerCanEdit=data.canEdit===true;paintReader();
   }catch(error){
     if(ticket!==readerSerial||!readerOpen||closed||controller.signal.aborted)return;
     readerError=error.message||'Could not load Lore.';paintReader();
   }
 }
 async function deleteReader(){
   if(!readerOpen||!readerEntry||!readerCanDelete||!readerId||!confirm('Delete this Lore permanently?'))return;
   const button=root.querySelector('[data-delete-lore]');
   if(!button||button.disabled)return;
   button.disabled=true;
   try{
     const res=await fetch('/api/v1/lore/'+encodeURIComponent(readerId),{
       method:'DELETE',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'},signal:controller.signal
     });
     if(!res.ok)throw Error(res.status===403?'Only admins can delete Lore.':res.status===404?'This Lore is already gone.':'Could not delete Lore.');
     modal('reader')?.close();
     readerOpen=false;readerEntry=null;readerCanDelete=false;readerCanEdit=false;readerSerial++;
     await loadEntries();
   }catch(error){
     if(closed||controller.signal.aborted)return;
     button.disabled=false;
     const status=document.createElement('p');status.role='status';status.className='comos-lore-delete-status';status.textContent=error.message;
     root.querySelector('.comos-lore-admin-actions')?.append(status);
   }
 }
 root.addEventListener('click',event=>{
   const deletion=event.target.closest('[data-delete-lore]');
   if(deletion){void deleteReader();return;}
   const reading=event.target.closest('[data-lore-read]');
   if(reading){
     event.preventDefault();
     if(!fixture)void openReader(reading.dataset.loreRead);
     return;
   }
   const close=event.target.closest('[data-lore-close]');
   if(close){modal(close.dataset.loreClose)?.close();return;}
   const clickedDialog=event.target.closest('dialog');
   if(event.target===clickedDialog&&clickedDialog){clickedDialog.close();return;}
   const toggle=event.target.closest('[data-lore-toggle]');
   if(toggle){
     const control=toggle.dataset.loreToggle;
     if(control==='search'){searchOpen=!searchOpen;if(searchOpen){tagsOpen=false;sortOpen=false;}}
     if(control==='tags'){tagsOpen=!tagsOpen;sortOpen=false;searchOpen=false;}
     if(control==='sort'){sortOpen=!sortOpen;tagsOpen=false;searchOpen=false;}
     const retry=control==='tags'&&tagsOpen&&tagState==='error';
     draw();
     if(searchOpen)root.querySelector('[name=query]')?.focus();
     if(retry)void loadTags();
     return;
   }
   if(event.target.closest('[data-lore-load-more]'))void loadEntries(true);
 },{signal:controller.signal});
 root.addEventListener('close',event=>{
   if(event.target.matches('[data-lore-tags-dialog]')){tagsOpen=false;root.querySelector('[data-lore-toggle=tags]')?.focus();}
   if(event.target.matches('[data-lore-sort-dialog]')){sortOpen=false;root.querySelector('[data-lore-toggle=sort]')?.focus();}
   if(event.target.matches('[data-lore-reader-dialog]')){
     readerOpen=false;readerSerial++;
     const opener=[...root.querySelectorAll('[data-lore-read]')].find(a=>a.dataset.loreRead===readerId);
     opener?.focus();
   }
 },{signal:controller.signal,capture:true});
 root.addEventListener('input',event=>{
   if(!event.target.matches('[name=query]'))return;
   query=event.target.value.slice(0,120);
   if(searchTimer!==null)clearTimeout(searchTimer);
   searchTimer=setTimeout(()=>{searchTimer=null;void loadEntries();},260);
 },{signal:controller.signal});
 root.addEventListener('change',event=>{
   const chosenSort=event.target.closest('[data-lore-sort]');
   if(chosenSort){
     if(!['newest','az'].includes(chosenSort.value))return;
     sort=chosenSort.value;modal('sort')?.close();sortOpen=false;void loadEntries();return;
   }
   const input=event.target.closest('[data-lore-tag]');if(!input)return;
   const allowed=new Set(tags.map(t=>t.id));
   if(!allowed.has(input.value)){draw();return;}
   selectedTags=input.checked?[...new Set([...selectedTags,input.value])]:selectedTags.filter(id=>id!==input.value);
   void loadEntries();
 },{signal:controller.signal});
 root.addEventListener('submit',event=>{
   if(!event.target.matches('[data-lore-search]'))return;
   event.preventDefault();
   if(searchTimer!==null){clearTimeout(searchTimer);searchTimer=null;}
   query=String(event.target.elements.query.value||'').slice(0,120);
   void loadEntries();
 },{signal:controller.signal});
 draw();
 if(!fixture){void loadTags();void loadEntries();}
 return ()=>{closed=true;generation++;readerSerial++;if(searchTimer!==null)clearTimeout(searchTimer);controller.abort();};
}
