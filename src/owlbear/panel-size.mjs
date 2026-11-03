const KEY='cosmos.owlbear.panel-size.v2';
export async function panelSize(OBR,onError){
 const handle=document.querySelector('[data-resize]');let size={width:390,height:640},drag,timer,running=false,pending;
 try{const saved=JSON.parse(localStorage.getItem(KEY));if(Number.isFinite(saved?.width)&&Number.isFinite(saved?.height))size=saved;}catch{}
 const [vw,vh]=await Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]);
 async function flush(){timer=null;if(running||!pending)return;running=true;const next=pending;pending=null;try{await Promise.all([OBR.action.setWidth(next.width),OBR.action.setHeight(next.height)]);}catch(e){onError(e.message);}finally{running=false;if(pending)timer=setTimeout(flush,60);}}
 function resize(w,h){size={width:Math.round(Math.max(280,Math.min(vw-32,w))),height:Math.round(Math.max(320,Math.min(vh-32,h)))};pending={...size};if(!timer)timer=setTimeout(flush,60);}
 resize(size.width,size.height);
 handle.onpointerdown=async event=>{if(event.button!==0)return;event.preventDefault();handle.setPointerCapture(event.pointerId);drag={x:event.screenX,y:event.screenY,...size};document.body.classList.add('resizing');};
 handle.onpointermove=event=>{if(drag)resize(drag.width+event.screenX-drag.x,drag.height+event.screenY-drag.y);};
 handle.onpointerup=handle.onpointercancel=()=>{drag=null;document.body.classList.remove('resizing');try{localStorage.setItem(KEY,JSON.stringify(size));}catch{}clearTimeout(timer);void flush();};
 handle.onkeydown=event=>{const d={ArrowRight:[20,0],ArrowLeft:[-20,0],ArrowDown:[0,20],ArrowUp:[0,-20]}[event.key];if(d){event.preventDefault();resize(size.width+d[0],size.height+d[1]);}};
}
