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

// Fold the currently visible sheet into a small paper bundle only after the
// server confirms its archive. No screenshots, WebGL model, or remote assets.
// Simulated fold mesh: a lightweight native adaptation of React Bits' PaperCrumple.
// The sheet is only crumpled after its archive has been confirmed by the server.
export async function crumpleSheet(sheet){
 if(!sheet)return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){
  try{await sheet.animate([{opacity:1},{opacity:0}],{duration:160,fill:'forwards'}).finished;}catch{}return;
 }
 const bounds=sheet.getBoundingClientRect();
 const width=Math.max(1,bounds.width),height=Math.max(1,bounds.height);
 const overlay=document.createElement('div');overlay.className='cs-paper-crumple';overlay.setAttribute('aria-hidden','true');overlay.inert=true;
 const source=sheet.cloneNode(true);
 source.querySelectorAll('dialog').forEach(node=>node.remove());
 source.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
 source.classList.remove('cs-saving');
 const folds=[],columns=4,rows=4;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const pane=document.createElement('div');pane.className='cs-paper-fold';
  pane.style.cssText='width:'+width+'px;height:'+height+'px;left:'+bounds.left+'px;top:'+bounds.top+'px;';
  pane.style.clipPath='polygon('+(100*col/columns)+'% '+(100*row/rows)+'%,'+(100*(col+1)/columns)+'% '+(100*row/rows)+'%,'+(100*(col+1)/columns)+'% '+(100*(row+1)/rows)+'%,'+(100*col/columns)+'% '+(100*(row+1)/rows)+'%)';
  const printed=source.cloneNode(true);printed.style.width=width+'px';printed.style.height=height+'px';printed.style.margin='0';pane.append(printed);overlay.append(pane);
  const offsetX=(1.5-col)*width*.15,offsetY=(1.5-row)*height*.17,alternate=(row+col)%2?-1:1;
  const rotation=alternate*(16+(col+row)%3*8);
  const frames=[
   {offset:0,transform:'translate3d(0,0,0) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)',filter:'brightness(1)',opacity:1},
   {offset:.26,transform:'translate3d('+offsetX*.18+'px,'+offsetY*.18+'px,24px) rotateX('+rotation+'deg) rotateY('+(-rotation*1.2)+'deg) rotateZ('+alternate*2+'deg) scale(.97)',filter:'brightness('+(alternate>0?1.14:.8)+')',opacity:1},
   {offset:.68,transform:'translate3d('+offsetX+'px,'+offsetY+'px,90px) rotateX('+rotation*3+'deg) rotateY('+(-rotation*3)+'deg) rotateZ('+alternate*22+'deg) scale(.31)',filter:'brightness('+(alternate>0?1.25:.45)+')',opacity:.96},
   {offset:1,transform:'translate3d('+offsetX*.08+'px,'+offsetY*.08+height*.23+'px,-160px) rotateX('+rotation*4+'deg) rotateY('+rotation*5+'deg) rotateZ('+alternate*80+'deg) scale(.025)',opacity:0}
  ];
  folds.push({pane,frames});
 }
 const wad=document.createElement('div');wad.className='cs-paper-wad';wad.style.left=bounds.left+width/2+'px';wad.style.top=bounds.top+height/2+'px';overlay.append(wad);
 document.body.append(overlay);sheet.style.visibility='hidden';
 const easing='cubic-bezier(.25,.05,.4,1)',animations=folds.map(({pane,frames})=>pane.animate(frames,{duration:1050,easing,fill:'forwards'}).finished.catch(()=>{}));
 animations.push(wad.animate([{offset:0,opacity:0,transform:'translate(-50%,-50%) scale(.15) rotate(0deg)'},{offset:.55,opacity:0,transform:'translate(-50%,-50%) scale(.2) rotate(40deg)'},{offset:.76,opacity:1,transform:'translate(-50%,-50%) scale(1.05) rotate(175deg)'},{offset:1,opacity:0,transform:'translate(-50%,'+(height*.32)+'px) scale(.55) rotate(430deg)'}],{duration:1100,easing,fill:'forwards'}).finished.catch(()=>{}));
 try{await Promise.all(animations);}finally{overlay.remove();sheet.style.visibility='visible';}
}
