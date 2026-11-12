import {loadSheetEffect} from './react-bits-loader.mjs';
// React owns only the overlays. Notes and Limit Break controls stay native.
export function mountNotesElectric(root){
 let disposed=false,generation=0,cleanups=[];
 const clear=()=>{for(const cleanup of cleanups)cleanup();cleanups=[];};
 async function sync(){
  const ticket=++generation;clear();
  const wrappers=[...root.querySelectorAll('.cs-limit-breaks[data-limit-ready="true"]')];
  if(document.documentElement.dataset.notesElectric==='true')wrappers.push(...root.querySelectorAll('.cs-notes-electric'));
  if(!wrappers.length)return;
  try{
   const {mountElectricBorder}=await loadSheetEffect('electric');
   if(disposed||ticket!==generation)return;
   for(const wrapper of wrappers){
    const host=document.createElement('div');host.className=wrapper.matches('.cs-limit-breaks')?'cs-limit-electric-overlay':'cs-note-electric-overlay';host.setAttribute('aria-hidden','true');wrapper.append(host);
    const unmount=mountElectricBorder(host,{borderRadius:wrapper.matches('.cs-limit-breaks')?14:24});
    cleanups.push(()=>{unmount();host.remove();});
   }
  }catch{ /* Static note outline remains available when WebGL/assets cannot load. */ }
 }
 const observer=new MutationObserver(()=>void sync());
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-notes-electric']});
 void sync();return ()=>{disposed=true;generation++;observer.disconnect();clear();};
}
