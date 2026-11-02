const KEY='cosmos.owlbear.panel-size.v1',PHONE={width:390,height:640};
export async function panelSize(OBR,onError){
 const form=document.querySelector('[data-panel-size]'),width=form.elements.width,height=form.elements.height,handle=document.querySelector('[data-resize]');
 const [roomWidth,roomHeight]=await Promise.all([OBR.viewport.getWidth(),OBR.viewport.getHeight()]);
 const maximum={width:Math.max(240,Math.min(1200,Math.floor(roomWidth*.85))),height:Math.max(320,Math.min(1000,Math.floor(roomHeight*.85)))};
 const minimum={width:Math.min(320,maximum.width),height:Math.min(400,maximum.height)};
 width.min=minimum.width;width.max=maximum.width;height.min=minimum.height;height.max=maximum.height;
 let desired=PHONE,current,pending,running=false,drag;
 try{const saved=JSON.parse(localStorage.getItem(KEY));if(Number.isFinite(saved?.width)&&Number.isFinite(saved?.height))desired=saved;}catch{}
 function clamp(value){return Object.fromEntries(['width','height'].map(key=>[key,Math.round(Math.min(maximum[key],Math.max(minimum[key],Number(value[key])||PHONE[key])))]));}
 async function flush(){
  if(running)return;running=true;
  try{while(pending){const next=pending;pending=null;await Promise.all([OBR.action.setWidth(next.width),OBR.action.setHeight(next.height)]);}}
  catch(error){pending=null;onError('Could not resize the panel: '+error.message);}
  finally{running=false;}
 }
 function resize(value){
  current=clamp(value);width.value=current.width;height.value=current.height;
  try{localStorage.setItem(KEY,JSON.stringify(current));}catch{}
  pending=current;void flush();
 }
 form.onsubmit=event=>{event.preventDefault();resize({width:width.value,height:height.value});};
 document.querySelector('[data-phone-size]').onclick=()=>resize(PHONE);
 document.querySelector('[data-medium-size]').onclick=()=>resize({width:560,height:700});
 handle.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();drag={x:event.screenX,y:event.screenY,...current};handle.setPointerCapture(event.pointerId);};
 handle.onpointermove=event=>{if(drag)resize({width:drag.width+event.screenX-drag.x,height:drag.height+event.screenY-drag.y});};
 handle.onpointerup=handle.onpointercancel=handle.onlostpointercapture=()=>{drag=null;};
 handle.onkeydown=event=>{const step=event.shiftKey?40:10,delta={ArrowRight:[step,0],ArrowLeft:[-step,0],ArrowDown:[0,step],ArrowUp:[0,-step]}[event.key];if(delta){event.preventDefault();resize({width:current.width+delta[0],height:current.height+delta[1]});}};
 resize(desired);
}
