import {renderLoreLibrary} from '../features/lore/library.mjs';

// Live Lore records are not connected yet. Only eligible character tag choices
// are fetched; the future Lore API must authorize each returned entry server-side.
export function mountLore({fixture=false}={}){
  const root=document.querySelector('[data-lore-library]');if(!root)return ()=>{};
  const controller=new AbortController();
  let closed=false,query='',searchOpen=false,tagsOpen=false,page=1;
  let tags=[],selectedTags=[],tagState=fixture?'ready':'loading';
  const entries=[];
  const draw=()=>{
    if(closed)return;
    root.innerHTML=renderLoreLibrary({entries,availableTags:tags,selectedTags,query,searchOpen,tagsOpen,tagState,page,preview:fixture});
  };
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
    const button=event.target.closest('[data-lore-page]');
    if(button){page+=button.dataset.lorePage==='next'?1:-1;draw();}
  },{signal:controller.signal});
  root.addEventListener('input',event=>{
    if(!event.target.matches('[name=query]'))return;
    query=event.target.value.slice(0,120);page=1;
    const caret=event.target.selectionStart;
    draw();
    const input=root.querySelector('[name=query]');
    input?.focus();
    if(Number.isInteger(caret))input?.setSelectionRange(caret,caret);
  },{signal:controller.signal});
  root.addEventListener('change',event=>{
    const input=event.target.closest('[data-lore-tag]');if(!input)return;
    const allowed=new Set(tags.map(t=>t.id));
    if(!allowed.has(input.value)){draw();return;}
    selectedTags=input.checked?[...new Set([...selectedTags,input.value])]:selectedTags.filter(id=>id!==input.value);
    page=1;draw();
    [...root.querySelectorAll('[data-lore-tag]')].find(node=>node.value===input.value)?.focus();
  },{signal:controller.signal});
  root.addEventListener('submit',event=>{if(event.target.matches('[data-lore-search]'))event.preventDefault();},{signal:controller.signal});
  draw();
  if(!fixture)void loadTags();
  return ()=>{closed=true;controller.abort();};
}
