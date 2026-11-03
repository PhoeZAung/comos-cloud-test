import {preferences} from './preferences.mjs';
let active,cleanup,timer;
export function naturalResult(result){
 const attack=result.kind==='weapon'?result:result.attack;
 const main=attack||(!result.damage?result:null);if(!main)return null;
 const faces=(main.breakdown||[]).filter(term=>/^1?d20$/i.test(term.dice||'')).flatMap(term=>term.rolls||[]);
 // Damage dice and critical confirmation rolls never trigger a new celebration.
 return faces.includes(20)?20:faces.includes(1)?1:null;
}
export async function showCritical(value,{preview=false}={}){
 if(![1,20].includes(value)||!preview&&!preferences.diceOptions.critEffects)return;
 clearTimeout(timer);cleanup?.();cleanup=null;active?.remove();
 const options={...preferences.diceOptions},reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,kind=value===1?'fizzle':options.critStyle;
 const view=document.createElement('div');active=view;view.className='critical-fx '+(value===1?'critical-fail':'critical-success')+(reduced?' critical-still':'');view.setAttribute('popover','manual');view.setAttribute('role','status');
 view.innerHTML='<div class="critical-vortex"></div><div class="critical-drake"></div><div class="critical-banner"><span class="critical-number">'+value+'</span><strong>'+(value===20?'NATURAL TWENTY':'NATURAL ONE')+'</strong><span>'+(preview?'Effect preview':'')+'</span></div><button type="button" aria-label="Dismiss roll effect">×</button>';
 const asset=value===1?'arcane':kind==='arcane'?'arcane':'fire';
 if(!reduced){const image=new Image();image.src='/assets/roll-fx/'+asset+'.gif';image.alt='';image.onerror=()=>image.remove();view.querySelector('.critical-vortex').append(image);}
 document.body.append(view);view.showPopover?.();
 let sound;
 const close=()=>{clearTimeout(timer);sound?.pause();cleanup?.();cleanup=null;view.remove();if(active===view)active=null;document.removeEventListener('keydown',escape);};
 const escape=event=>{if(event.key==='Escape')close();};document.addEventListener('keydown',escape);view.querySelector('button').onclick=close;
 const previousCleanup=cleanup;cleanup=()=>{previousCleanup?.();sound?.pause();document.removeEventListener('keydown',escape);};
 timer=setTimeout(close,reduced?2200:4600);
 if(options.critSound){sound=new Audio('/assets/roll-fx/'+(value===1?'fizzle':asset)+'.ogg');sound.volume=options.volume;void sound.play().catch(()=>{});}
 if(value===20&&kind==='drake'&&!reduced){try{const {showDrake}=await import('./drake-fx.js'),stop=await showDrake(view.querySelector('.critical-drake'));if(active!==view){stop();return;}const base=cleanup;cleanup=()=>{base?.();stop();};}catch{view.classList.add('critical-no-drake');}}
}
