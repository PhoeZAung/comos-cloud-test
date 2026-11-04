const KEY='cosmos.owlbear.panel-size.v2';
export function panelBounds(size,viewport){const width=Math.max(160,viewport.width-24),height=Math.max(180,viewport.height-24);return {width:Math.round(Math.max(Math.min(280,width),Math.min(width,size.width))),height:Math.round(Math.max(Math.min(320,height),Math.min(height,size.height)))};}
export async function panelSize(OBR,onError=()=>{}){
 const handle=document.querySelector('[data-resize]'),hint=document.createElement('output');hint.className='panel-resize-preview';hint.hidden=true;document.body.append(hint);
 let size={width:390,height:640},drag,pending,viewport,running=false,closed=false,wanted=size;
 try{const saved=JSON.parse(localStorage.getItem(KEY));if(Number.isFinite(saved?.width)&&Number.isFinite(saved?.height))size=saved;}catch{}
 async function flush(){
  if(running||closed)return;running=true;
  try{while(pending&&!closed){const requested=pending;pending=null;const [width,height]=await Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]);viewport={width,height};const next=panelBounds(requested,viewport);
   // Sequential host writes avoid applying stale width/height together.
   await OBR.action.setWidth(next.width);await OBR.action.setHeight(next.height);size=next;if(!pending)wanted=next;try{localStorage.setItem(KEY,JSON.stringify(size));}catch{}
  }}catch(error){if(!closed)onError(error.message);}finally{running=false;if(pending&&!closed)void flush();}
 }
 const commit=value=>{wanted=value;pending=value;void flush();};
 const move=event=>{if(!drag||event.pointerId!==drag.id)return;drag.next={width:Math.max(160,drag.width+event.clientX-drag.x),height:Math.max(180,drag.height+event.clientY-drag.y)};hint.textContent=Math.round(drag.next.width)+' × '+Math.round(drag.next.height);};
 const end=event=>{if(!drag||event&&event.pointerId!==drag.id)return;const next=drag.next;drag=null;hint.hidden=true;document.body.classList.remove('resizing');if(next)commit(next);};
 const down=event=>{if(event.button!==0||running)return;event.preventDefault();drag={id:event.pointerId,x:event.clientX,y:event.clientY,...size};hint.hidden=false;hint.textContent=size.width+' × '+size.height;document.body.classList.add('resizing');try{handle.setPointerCapture(event.pointerId);}catch{}};
 const cancel=event=>{if(drag&&event.pointerId===drag.id){drag=null;hint.hidden=true;document.body.classList.remove('resizing');}};
 const key=event=>{const delta={ArrowRight:[20,0],ArrowLeft:[-20,0],ArrowDown:[0,20],ArrowUp:[0,-20]}[event.key];if(delta){event.preventDefault();const base=wanted,step=event.shiftKey?3:1;commit({width:base.width+delta[0]*step,height:base.height+delta[1]*step});}};
 // Keep the host iframe steady until release: moving it mid-drag loses capture.
 handle.addEventListener('pointerdown',down);window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);window.addEventListener('pointercancel',cancel);handle.addEventListener('lostpointercapture',end);handle.addEventListener('keydown',key);
 const resized=async()=>{if(drag||closed||!viewport)return;try{const [width,height]=await Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]);if(!closed&&(width!==viewport.width||height!==viewport.height))commit(size);}catch{}};window.addEventListener('resize',resized);
 commit(size);
 return ()=>{closed=true;drag=null;hint.remove();document.body.classList.remove('resizing');handle.removeEventListener('pointerdown',down);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',cancel);handle.removeEventListener('lostpointercapture',end);handle.removeEventListener('keydown',key);window.removeEventListener('resize',resized);};
}
