import {preferences} from './preferences.mjs';
import {chooseCriticalEffect,criticalEnabled} from '../features/critical-effects.mjs';
import {preloadCriticalFrames} from './critical-frames.mjs';
import {showCriticalScreen} from './critical-effects-player.mjs';
let audioContext;const sounds=new Map();
export {chooseCriticalEffect,criticalEnabled};
export function unlockCriticalAudio(){
 if(!preferences.diceOptions.critSound)return;
 try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();void audioContext.resume().catch(()=>{});}catch{}
}
export function naturalResult(result){
 const attack=result.kind==='weapon'?result:result.attack,main=attack||(!result.damage?result:null);if(!main)return null;
 const faces=(main.breakdown||[]).filter(term=>/^1?d20$/i.test(term.dice||'')).flatMap(term=>term.rolls||[]);
 return faces.includes(20)?20:faces.includes(1)?1:null;
}
function preloadSound(name){
 if(!audioContext||!preferences.diceOptions.critSound)return;
 if(!sounds.has(name)){const entry={};sounds.set(name,entry);entry.ready=fetch('/assets/critical-fx/'+name+'.ogg').then(response=>{if(!response.ok)throw Error();return response.arrayBuffer();}).then(bytes=>audioContext.decodeAudioData(bytes)).then(buffer=>{entry.buffer=buffer;}).catch(()=>{sounds.delete(name);});}
}
export function preloadCritical(effect){if(!effect||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();preloadSound(effect.sound);return preloadCriticalFrames(effect);}
function playImpact(effect,options){
 const buffer=sounds.get(effect.sound)?.buffer,context=audioContext;if(!buffer||!context||context.state!=='running'||!options.critSound||!preferences.diceOptions.critSound||options.volume<=0||preferences.diceOptions.volume<=0)return ()=>{};
 const source=context.createBufferSource(),gain=context.createGain(),limiter=context.createDynamicsCompressor();source.buffer=buffer;gain.gain.value=Math.min(options.volume,preferences.diceOptions.volume)*2;limiter.threshold.value=-8;limiter.ratio.value=5;source.connect(gain).connect(limiter).connect(context.destination);source.start(context.currentTime,0,Math.min(1.1,buffer.duration));
 let stopped=false;const stop=()=>{if(stopped)return;stopped=true;try{source.stop();}catch{}source.disconnect();gain.disconnect();limiter.disconnect();};source.onended=stop;return stop;
}
export function showCritical(value,{preview=false,options={...preferences.diceOptions},signal,result,effect}={}){
 if(![1,20].includes(value)||signal?.aborted||(!preview&&!criticalEnabled(value,options)))return Promise.resolve();
 const selected=effect?.value===value?effect:chooseCriticalEffect(value);void preloadCritical(selected)?.catch(()=>{});
 return showCriticalScreen(selected,{preview,signal,result,onSound:()=>playImpact(selected,options)});
}
