import {loadSheetEffect} from './react-bits-loader.mjs';
// Cosmos hold/confirmation controls with the React Bits PaperCrumple component.
// See docs/THIRD-PARTY-UI.md for source references and license.
export function mountHoldButton(button,onHold,{signal,duration=1400}={}){
 if(!button)return ()=>{};
 const events=new AbortController();let timer=0,holding=false,done=false,pointer=null;
 const reset=()=>{clearTimeout(timer);timer=0;holding=false;pointer=null;button.classList.remove('is-holding');};
 const start=()=>{if(holding||done||button.disabled)return;holding=true;button.classList.add('is-holding');timer=setTimeout(()=>{if(!holding||button.disabled)return reset();done=true;reset();onHold();done=false;},duration);};
 button.addEventListener('pointerdown',event=>{if(event.button!==0)return;pointer=event.pointerId;button.setPointerCapture(pointer);start();},{signal:events.signal});
 button.addEventListener('pointermove',event=>{if(!holding||pointer!==event.pointerId)return;const r=button.getBoundingClientRect();if(event.clientX<r.left-10||event.clientX>r.right+10||event.clientY<r.top-10||event.clientY>r.bottom+10)reset();},{signal:events.signal});
 for(const type of ['pointerup','pointercancel','lostpointercapture','blur'])button.addEventListener(type,reset,{signal:events.signal});
 button.addEventListener('keydown',event=>{if(![' ','Enter'].includes(event.key))return;event.preventDefault();if(!event.repeat)start();},{signal:events.signal});
 button.addEventListener('keyup',event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();reset();}},{signal:events.signal});
 button.addEventListener('click',event=>event.preventDefault(),{signal:events.signal});
 window.addEventListener('blur',reset,{signal:events.signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();},{signal:events.signal});
 const dispose=()=>{reset();events.abort();signal?.removeEventListener('abort',dispose);};
 if(signal?.aborted)dispose();else signal?.addEventListener('abort',dispose,{once:true});return dispose;
}

/**
 * The destructive hold gesture is on the settings control.
 * The second, explicit confirmation is a regular click.
 */
export function confirmCharacterDelete({signal,name='this character'}={}){
 if(signal?.aborted)return Promise.resolve(false);
 return new Promise(resolve=>{
  const popup=document.createElement('dialog');popup.className='cs-dialog cs-delete-confirm cs-star-border';popup.setAttribute('aria-label','Confirm character deletion');
  popup.innerHTML='<h2>Delete character?</h2><p>Deleting <strong data-deleting-name></strong> cannot be undone.</p><div class="cs-delete-confirm-actions"><button type="button" class="button" data-delete-cancel>Cancel</button><button type="button" class="button cs-delete" data-delete-final>Delete character</button></div>';
  popup.querySelector('[data-deleting-name]').textContent=String(name);
  let result=false;const cancel=()=>popup.close();
  popup.querySelector('[data-delete-cancel]').addEventListener('click',cancel);
  popup.querySelector('[data-delete-final]').addEventListener('click',()=>{result=true;popup.close();});
  popup.addEventListener('click',event=>{if(event.target===popup)cancel();});
  popup.addEventListener('close',()=>{signal?.removeEventListener('abort',cancel);popup.remove();resolve(result);},{once:true});
  signal?.addEventListener('abort',cancel,{once:true});document.body.append(popup);popup.showModal();popup.querySelector('[data-delete-cancel]').focus();
 });
}

// Resolve only after folding and the upward exit. The caller archives afterward.
const abortError=()=>new DOMException('Deletion cancelled.','AbortError');
function waitFor(promise,signal,timeout=6000){
 return new Promise((resolve,reject)=>{
  let timer;const stop=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);};
  const abort=()=>{stop();reject(abortError());};
  if(signal?.aborted){abort();return;}
  signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>{stop();reject(Error('Animation unavailable.'));},timeout);
  promise.then(value=>{stop();resolve(value);},error=>{stop();reject(error);});
 });
}
async function animate(element,frames,options,signal){
 const animation=element.animate(frames,{...options,fill:'forwards'});
 try{await waitFor(animation.finished,signal);}catch(error){animation.cancel();throw error;}
}
export async function crumpleSheet(sheet,{signal}={}){
 if(!sheet)return ()=>{};
 if(signal?.aborted)throw abortError();
 const original=sheet.style.visibility,restore=()=>{sheet.style.visibility=original;};
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){
  const fade=sheet.animate([{opacity:1},{opacity:0}],{duration:160,fill:'forwards'});
  try{await waitFor(fade.finished,signal);sheet.style.visibility='hidden';}finally{fade.cancel();}
  return restore;
 }
 const overlay=document.createElement('div');overlay.className='cs-paper-crumple';overlay.setAttribute('aria-hidden','true');overlay.inert=true;
 const stage=document.createElement('div');stage.className='cs-paper-stage';overlay.append(stage);
 let component;
 try{
  const effect=await waitFor(loadSheetEffect('paper'),signal);
  const src=await waitFor(effect.sheetImage(sheet),signal);
  document.body.append(overlay);overlay.dataset.phase='loading';
  component=effect.mountPaperCrumple(stage,src);
  try{
   const controller=await waitFor(component.ready,signal);
   sheet.style.visibility='hidden';overlay.dataset.phase='crumpling';
   controller.crumple();await waitFor(component.folded,signal,4000);
  }catch(error){
   if(signal?.aborted)throw error;
   component.dispose();component=null;stage.replaceChildren();
   const paper=document.createElement('img');paper.src=src;paper.alt='';paper.className='cs-paper-fallback';stage.append(paper);
   sheet.style.visibility='hidden';overlay.dataset.phase='crumpling';
   await animate(paper,[{transform:'scale(1) rotate(0deg)',borderRadius:'0'},{transform:'scale(.22) rotate(24deg)',borderRadius:'38% 46% 33% 42%',filter:'contrast(1.25)'}],{duration:550,easing:'ease-in-out'},signal);
  }
  overlay.dataset.phase='throwing';
  await animate(stage,[{transform:'translateY(0) rotate(0deg)',opacity:1},{transform:'translateY(-'+(innerHeight+560)+'px) rotate(-28deg)',opacity:1}],{duration:400,easing:'cubic-bezier(.5,0,.8,.5)'},signal);
  overlay.dataset.phase='complete';return restore;
 }catch(error){restore();throw error;}
 finally{component?.dispose();overlay.remove();}
}
