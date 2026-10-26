import {renderLoreLibrary} from '../features/lore/library.mjs';

export function mountLore({fixture=false}={}){
 const root=document.querySelector('[data-lore-library]');if(!root)return ()=>{};
 const controller=new AbortController();
 let closed=false,query='',searchOpen=false,tagsOpen=false,tagState=fixture?'ready':'loading';
 let tags=[],selectedTags=[],entries=[],cursor=null,canPublish=false,state=fixture?'ready':'loading';
 let generation=0,searchTimer=null;
 const draw=()=>{
   if(closed)return;
   root.innerHTML=renderLoreLibrary({
    entries,availableTags:tags,selectedTags,query,searchOpen,tagsOpen,tagState,
    state,preview:fixture,serverFiltered:!fixture,nextCursor:cursor,canPublish
   });
 };
 async function loadEntries(more=false){
   if(fixture||closed)return;
   const seq=++generation;
   if(!more){entries=[];cursor=null;state='loading';draw();}
   const params=new URLSearchParams();
   if(query.trim())params.set('query',query.trim());
   for(const id of selectedTags)params.append('tagId',id);
   if(more&&cursor)params.set('cursor',cursor);
   try{
     const res=await fetch('/api/v1/lore'+(params.size?'?'+params:''),{credentials:'same-origin',cache:'no-store',signal:controller.signal});
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
 root.addEventListener('click',event=>{
   const toggle=event.target.closest('[data-lore-toggle]');
   if(toggle){
     const control=toggle.dataset.loreToggle;
     if(control==='search'){searchOpen=!searchOpen;if(searchOpen)tagsOpen=false;}
     if(control==='tags'){tagsOpen=!tagsOpen;if(tagsOpen)searchOpen=false;}
     const shouldRetry=control==='tags'&&tagsOpen&&tagState==='error';
     draw();
     if(searchOpen)root.querySelector('[name=query]')?.focus();
     else root.querySelector('[data-lore-toggle="'+control+'"]')?.focus();
     if(shouldRetry)void loadTags();
     return;
   }
   if(event.target.closest('[data-lore-load-more]'))void loadEntries(true);
   const button=event.target.closest('[data-lore-page]');
   if(button){void loadEntries();}
 },{signal:controller.signal});
 root.addEventListener('input',event=>{
   if(!event.target.matches('[name=query]'))return;
   query=event.target.value.slice(0,120);
   if(searchTimer!==null)clearTimeout(searchTimer);
   searchTimer=setTimeout(()=>{searchTimer=null;void loadEntries();},260);
 },{signal:controller.signal});
 root.addEventListener('change',event=>{
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
 return ()=>{closed=true;generation++;if(searchTimer!==null)clearTimeout(searchTimer);controller.abort();};
}
