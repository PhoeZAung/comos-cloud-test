import { createRouter } from './router.mjs';
import { refreshSession, setSessionUser, sessionUser } from './session.mjs';
let cleanup=()=>{};
let routeGeneration=0;
const live=document.body.dataset.mode==='live';
async function mountPage() {
  const generation=++routeGeneration;
  setSessionUser(sessionUser);
  const id=document.body.dataset.page;
  if(live && ['signin','signup','account'].includes(id)) {
    const {mountAuth}=await import('./auth.js');
    if(generation!==routeGeneration)return;
    cleanup=mountAuth({onUser:setSessionUser});
  }
}
if(document.body.dataset.layout!=='sheet')createRouter({afterRender:mountPage,disposePage:()=>{routeGeneration++;cleanup();cleanup=()=>{};}});
void mountPage();
if(live){void refreshSession();void import('./install.mjs').then(m=>m.setupInstall());}
const motion=document.querySelector('[data-motion]');
if(document.body.dataset.layout!=='sheet') {
  const start=async()=>{
    const {createGalaxy}=await import('./galaxy.mjs');
    const target=document.querySelector('[data-galaxy]');
    let dispose;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const coarse=matchMedia('(pointer: coarse)').matches;
    let paused=false;
    const draw=()=>{
      dispose?.();
      try { dispose=createGalaxy(target,{density:1,glowIntensity:0.3,flareIntensity:1,starSpeed:0.5,mouseRepulsion:true,clickWarp:!paused,mouseInteraction:!paused,intro:false,disableAnimation:paused||reduced.matches,dpr:coarse?0.75:1,layers:coarse?2:4}); }
      catch { target.replaceChildren(); }
      motion.textContent=paused?'Resume stars':'Pause stars';motion.setAttribute('aria-pressed',String(paused));
      motion.hidden=reduced.matches||target.dataset.galaxyState!=='ready';
    };
    motion.addEventListener('click',()=>{paused=!paused;draw();});
    reduced.addEventListener('change',draw);draw();
  };
  if('requestIdleCallback' in window)requestIdleCallback(()=>void start(),{timeout:1500});else setTimeout(()=>void start(),250);
}
