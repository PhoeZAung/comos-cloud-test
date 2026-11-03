import {preferences} from './preferences.mjs';
import {preloadDragon,showGalaxyDragon} from './galaxy-dragon.mjs';
import {playDragonWhoosh} from './dragon-whoosh.mjs';
export {preloadDragon};
let audioContext;const sounds=new Map();
export function unlockCriticalAudio(){
 if(!preferences.diceOptions.critSound)return;
 try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();void audioContext.resume().catch(()=>{});}catch{}
}
export function naturalResult(result){
 const attack=result.kind==='weapon'?result:result.attack,main=attack||(!result.damage?result:null);if(!main)return null;
 const faces=(main.breakdown||[]).filter(term=>/^1?d20$/i.test(term.dice||'')).flatMap(term=>term.rolls||[]);
 return faces.includes(20)?20:faces.includes(1)?1:null;
}
async function playSound(name,volume,view){
 if(!volume)return ()=>{};
 try{
  unlockCriticalAudio();const context=audioContext;if(!context)return ()=>{};
  if(!sounds.has(name))sounds.set(name,fetch('/assets/roll-fx/'+name+'.ogg').then(response=>{if(!response.ok)throw Error();return response.arrayBuffer();}).then(bytes=>context.decodeAudioData(bytes)).catch(error=>{sounds.delete(name);throw error;}));
  const buffer=await sounds.get(name);if(!view.isConnected)return ()=>{};
  const source=context.createBufferSource(),gain=context.createGain(),limiter=context.createDynamicsCompressor();source.buffer=buffer;gain.gain.value=volume*3;limiter.threshold.value=-8;limiter.ratio.value=5;source.connect(gain).connect(limiter).connect(context.destination);source.start();
  return ()=>{try{source.stop();}catch{}source.disconnect();gain.disconnect();limiter.disconnect();};
 }catch{return ()=>{};}
}
export function showCritical(value,{preview=false,options={...preferences.diceOptions},signal,result}={}){
 if(![1,20].includes(value)||signal?.aborted)return Promise.resolve();
 if(value===20&&(options.nat20Style||'dragon')==='dragon'){
  return showGalaxyDragon({signal,result,preview,onSound:()=>{
   if(!options.critSound||!preferences.diceOptions.critSound)return ()=>{};
   const stop=playDragonWhoosh(audioContext,options.volume),changed=()=>{if(!preferences.diceOptions.critSound||preferences.diceOptions.volume===0)stop();};
   document.addEventListener('comos:preferences',changed);
   return ()=>{stop();document.removeEventListener('comos:preferences',changed);};
  }});
 }
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,asset=value===1?'arcane':options.nat20Style==='arcane'?'arcane':'fire',view=document.createElement('div');
 view.className='critical-fx '+(value===1?'critical-fail':'critical-success')+(reduced?' critical-still':'');view.setAttribute('popover','manual');view.setAttribute('role','status');
 view.innerHTML='<div class="critical-circle"><div class="critical-vortex"></div><div class="critical-center"><span class="critical-label">NAT '+value+'</span><strong class="critical-number">'+value+'</strong><span data-critical-result></span><small>'+(preview?'Preview':'')+'</small></div></div><button type="button" aria-label="Dismiss roll effect">×</button>';
 const attack=result?.kind==='weapon'?result:result?.attack;view.querySelector('[data-critical-result]').textContent=[attack?'Attack '+attack.total:Number.isFinite(result?.total)?'Total '+result.total:'',result?.damage?'Damage '+result.damage.total:''].filter(Boolean).join(' · ');
 if(!reduced){const image=new Image();image.src='/assets/roll-fx/'+asset+'.gif';image.alt='';image.onerror=()=>image.remove();view.querySelector('.critical-vortex').append(image);}
 document.body.append(view);view.showPopover?.();
 return new Promise(resolve=>{
  let stop=()=>{},timer;const close=()=>{clearTimeout(timer);stop();signal?.removeEventListener('abort',close);document.removeEventListener('keydown',escape);view.remove();resolve();};
  const escape=event=>{if(event.key==='Escape')close();};document.addEventListener('keydown',escape);signal?.addEventListener('abort',close,{once:true});view.querySelector('button').onclick=close;timer=setTimeout(close,reduced?2200:3400);
  if(options.critSound)void playSound(value===1?'fizzle':asset,options.volume,view).then(dispose=>{if(!view.isConnected)dispose();else stop=dispose;});
 });
}
