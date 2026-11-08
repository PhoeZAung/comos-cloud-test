// Keep the app at its layout scale on touch devices, including Safari gestures.
if(typeof document!=='undefined'){
 const preventZoom=event=>event.preventDefault();
 for(const type of ['gesturestart','gesturechange'])document.addEventListener(type,preventZoom,{passive:false});
 for(const type of ['touchstart','touchmove'])document.addEventListener(type,event=>{
  if(event.touches.length>1)event.preventDefault();
 },{passive:false});
}
