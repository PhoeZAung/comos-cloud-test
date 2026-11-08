import {loadSheetEffect} from './react-bits-loader.mjs';
// React owns only the decorative overlay. Notes and their event handlers stay native.
export function mountNotesElectric(root){
 let disposed=false,generation=0,cleanups=[];
 const clear=()=>{for(const cleanup of cleanups)cleanup();cleanups=[];};
 async function sync(){
  const ticket=++generation;clear();
  if(document.documentElement.dataset.notesElectric!=='true')return;
  try{
   const {mountElectricBorder}=await loadSheetEffect('electric');
   if(disposed||ticket!==generation)return;
   for(const wrapper of root.querySelectorAll('.cs-notes-electric')){
    const host=document.createElement('div');host.className='cs-note-electric-overlay';host.setAttribute('aria-hidden','true');wrapper.append(host);
    const unmount=mountElectricBorder(host);
    cleanups.push(()=>{unmount();host.remove();});
   }
  }catch{ /* Static note outline remains available when WebGL/assets cannot load. */ }
 }
 const observer=new MutationObserver(()=>void sync());
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-notes-electric']});
 void sync();return ()=>{disposed=true;generation++;observer.disconnect();clear();};
}
