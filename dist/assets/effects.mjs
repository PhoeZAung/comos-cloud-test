import {preferences,themes} from './preferences.mjs';
export function setupEffects() {
 if(document.body.dataset.layout==='sheet')return;
 const target=document.querySelector('[data-galaxy]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)').matches;
 const splashRoot=document.createElement('div');splashRoot.className='splash-effect';splashRoot.setAttribute('aria-hidden','true');document.body.append(splashRoot);
 let settings={...preferences},galaxyDispose,splashDispose,lastKey='',generation=0;
 async function render() {
  const key=JSON.stringify([settings,reduced.matches]);if(key===lastKey)return;lastKey=key;
  const ticket=++generation;
  galaxyDispose?.();galaxyDispose=null;splashDispose?.();splashDispose=null;splashRoot.replaceChildren();
  const {createGalaxy}=await import('./galaxy.mjs');if(ticket!==generation)return;
  const palette=settings.effectColors?themes[settings.theme].colors:undefined;
  try{galaxyDispose=createGalaxy(target,{density:1,glowIntensity:0.3,flareIntensity:1,starSpeed:0.5,starColors:palette,mouseRepulsion:true,clickWarp:!settings.pauseStars,mouseInteraction:!settings.pauseStars,intro:false,disableAnimation:settings.pauseStars||reduced.matches,dpr:coarse?0.75:1,layers:coarse?2:4});}catch{target.dataset.galaxyState='unavailable';target.replaceChildren();}
  if(settings.splashCursor&&!reduced.matches){
   const {createSplash}=await import('./splash.mjs');if(ticket!==generation)return;
   try{splashDispose=createSplash(splashRoot,{colors:palette,rainbow:!settings.effectColors,size:1,force:1,swirl:3,trail:1,clickSplash:true,intro:false,quality:coarse?'low':'medium'});}catch{splashRoot.replaceChildren();splashRoot.dataset.splashState='unavailable';}
  }
  document.dispatchEvent(new CustomEvent('comos:effects',{detail:{splashAvailable:splashRoot.dataset.splashState==='ready',reduced:reduced.matches}}));
 }
 reduced.addEventListener('change',()=>void render());
 document.addEventListener('comos:preferences',event=>{settings={...event.detail};void render();});
 if('requestIdleCallback' in window)requestIdleCallback(()=>void render(),{timeout:1500});else setTimeout(()=>void render(),250);
}
