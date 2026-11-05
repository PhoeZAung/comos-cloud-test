// Native Cosmos adaptations of the React Bits Hold Button / Paper Crumple ideas.
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

export function confirmCharacterDelete({signal}={}){
 if(signal?.aborted)return Promise.resolve(false);
 return new Promise(resolve=>{
  const popup=document.createElement('dialog');popup.className='cs-dialog cs-delete-confirm cs-star-border';popup.setAttribute('aria-label','Confirm character deletion');
  popup.innerHTML='<button type="button" class="button cs-delete cs-hold-button" aria-label="Hold to confirm delete"><span class="cs-hold-fill" aria-hidden="true"></span><span>Delete</span></button>';
  let result=false;const cancel=()=>popup.close();
  const dispose=mountHoldButton(popup.querySelector('button'),()=>{result=true;popup.close();});
  popup.addEventListener('click',event=>{if(event.target===popup)popup.close();});
  popup.addEventListener('close',()=>{dispose();signal?.removeEventListener('abort',cancel);popup.remove();resolve(result);},{once:true});
  signal?.addEventListener('abort',cancel,{once:true});document.body.append(popup);popup.showModal();
 });
}

// Fold the currently visible sheet into a small paper bundle only after the
// server confirms its archive. No screenshots, WebGL model, or remote assets.
export async function crumpleSheet(sheet){
 if(!sheet)return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){await sheet.animate([{opacity:1},{opacity:0}],{duration:140,fill:'forwards'}).finished;return;}
 const bounds=sheet.getBoundingClientRect(),width=Math.min(innerWidth,bounds.width),height=innerHeight;
 const overlay=document.createElement('div');overlay.className='cs-paper-crumple';overlay.setAttribute('aria-hidden','true');overlay.inert=true;
 const source=sheet.cloneNode(true);source.querySelectorAll('dialog').forEach(node=>node.remove());source.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));source.classList.remove('cs-saving');
 const animations=[];
 for(let row=0;row<2;row++)for(let col=0;col<3;col++){
  const panel=document.createElement('div');panel.className='cs-paper-fold';panel.style.width=width+'px';panel.style.height=height+'px';panel.style.left=Math.max(0,bounds.left)+'px';
  panel.style.clipPath=`polygon(${col*100/3}% ${row*50}%,${(col+1)*100/3}% ${row*50}%,${(col+1)*100/3}% ${(row+1)*50}%,${col*100/3}% ${(row+1)*50}%)`;
  const content=source.cloneNode(true);content.style.width=bounds.width+'px';content.style.marginTop=bounds.top+'px';panel.append(content);overlay.append(panel);
  const dx=(1-col)*width*.28,dy=(.5-row)*height*.36,sign=(col+row)%2?1:-1;
  animations.push(panel.animate([{transform:'translate3d(0,0,0) rotateX(0) rotateY(0) scale(1)',filter:'brightness(1)'},{offset:.55,transform:`translate3d(${dx}px,${dy}px,${40+col*12}px) rotateX(${sign*58}deg) rotateY(${-sign*65}deg) rotateZ(${sign*14}deg) scale(.62)`,filter:`brightness(${.65+col*.18})`},{transform:`translate3d(${dx*.2}px,${dy*.2+height*.18}px,-140px) rotateX(${sign*125}deg) rotateY(${sign*145}deg) rotateZ(${sign*35}deg) scale(.015)`,opacity:0}],{duration:850,easing:'cubic-bezier(.5,0,.25,1)',fill:'forwards'}).finished);
 }
 document.body.append(overlay);sheet.style.visibility='hidden';
 try{await Promise.all(animations);}finally{overlay.remove();}
}
