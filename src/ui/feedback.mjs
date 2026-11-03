import {naturalResult,showCritical,unlockCriticalAudio,preloadDragon} from './critical-fx.mjs';
import {preferences} from './preferences.mjs';
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let hideTimer,animation,presentations=Promise.resolve(),generation=0,activePresentation;
function host(){if(!document.querySelector('[data-feedback-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('feedback.css',import.meta.url).href;link.dataset.feedbackStyle='';document.head.append(link);}let node=document.querySelector('[data-action-feedback]');if(!node){node=document.createElement('div');node.dataset.actionFeedback='';node.className='comos-feedback';node.setAttribute('role','status');node.setAttribute('aria-live','polite');document.body.append(node);}clearTimeout(hideTimer);node.hidden=false;return node;}
export function notify(message){const node=host();node.innerHTML='<span>'+e(message)+'</span>';hideTimer=setTimeout(()=>node.hidden=true,2100);}
export function showDice(result,{preview=false,onResult=()=>{}}={}){
 unlockCriticalAudio();
 const own=generation,options={...preferences.diceOptions},animate=preferences.dicePopup!==false||preview;
 if(naturalResult(result)===20&&(preview||options.critEffects)&&(options.nat20Style||'dragon')==='dragon')preloadDragon();
 const work=async()=>{
  if(own!==generation)return;const controller=new AbortController();activePresentation=controller;
  try{
   document.querySelector('[data-action-feedback]')?.setAttribute('hidden','');
   if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){try{const {show3DDice}=await import('./dice-3d.mjs');await show3DDice(result,{options,signal:controller.signal});}catch{/* The recorded result remains available if WebGL cannot start. */}}
   if(own!==generation||controller.signal.aborted)return;
   onResult(result);const natural=naturalResult(result);
   if(natural&&(preview||options.critEffects))await showCritical(natural,{preview,options,signal:controller.signal,result});
   else await showClassicDice(result,{signal:controller.signal});
  }finally{if(activePresentation===controller)activePresentation=null;}
 };
 presentations=presentations.catch(()=>{}).then(work);return presentations;
}
function showClassicDice(result,{signal}={}){
 const node=host(),attack=result.kind==='weapon'?result:result.attack,damage=result.damage;
 const dice=[...(attack?[['Attack Roll',attack.total]]:[]),...(damage?[['Dice Roll',damage.total]]:[])];if(!dice.length&&Number.isFinite(result.total))dice.push(['Dice Roll',result.total]);
 node.innerHTML='<button type="button" class="feedback-close" aria-label="Close dice result">×</button><div class="feedback-dice">'+dice.map(([label,value])=>'<div><span class="feedback-die"><svg viewBox="0 0 100 110" aria-hidden="true"><path d="M50 3 95 28v54l-45 25L5 82V28Z"/></svg><strong>'+e(value)+'</strong></span><small>'+label+'</small></div>').join('')+'</div>';
 return new Promise(resolve=>{let timer;const close=()=>{clearTimeout(timer);signal?.removeEventListener('abort',close);if(node.isConnected)node.hidden=true;resolve();};node.querySelector('button').onclick=close;signal?.addEventListener('abort',close,{once:true});timer=setTimeout(close,2600);});
}
export function purchaseFeedback(receipt,before,currencyNode){const node=host();node.innerHTML='<strong>'+e(receipt.itemName)+' × '+e(receipt.quantity)+'</strong><span>−'+e(receipt.totalGil)+' gil</span><span data-gil-counter></span>';const counter=node.querySelector('[data-gil-counter]'),after=Number(receipt.remainingGil),start=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;cancelAnimationFrame(animation);const paint=now=>{const t=reduced?1:Math.min(1,(now-start)/700),value=before+(after-before)*(1-(1-t)**3),text=value.toLocaleString(undefined,{maximumFractionDigits:2})+' gil';counter.textContent=text;if(currencyNode?.isConnected)currencyNode.textContent=text;if(t<1)animation=requestAnimationFrame(paint);};animation=requestAnimationFrame(paint);hideTimer=setTimeout(()=>node.hidden=true,2600);}
export function clearFeedback(){generation++;activePresentation?.abort();clearTimeout(hideTimer);cancelAnimationFrame(animation);document.querySelector('[data-action-feedback]')?.remove();}
