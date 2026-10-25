import {renderHomeDashboard} from '../features/home/dashboard.mjs';
const worlds=Array.from({length:4},(_,i)=>({name:`World ${String(i+1).padStart(2,'0')}`,description:'Sample slot · Actual world names are configured by an administrator.'}));
export function mountHomePreview(){
  const root=document.querySelector('[data-home-dashboard]');
  if(root)root.innerHTML=renderHomeDashboard({worlds,preview:true});
  return ()=>{};
}