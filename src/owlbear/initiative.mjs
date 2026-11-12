import OBR from '@owlbear-rodeo/sdk';
import {localChannel} from './local-channel.mjs';
import {mountInitiative} from './initiative-view.mjs';

// Legacy standalone initiative view: shares the exact same tracker as the
// embedded extension tab, should an older manifest still reference it.
let bus;
const tracker=mountInitiative(document.querySelector('.initiative-panel'),value=>bus?.send(value));
OBR.onReady(async()=>{
 bus=await localChannel(OBR,data=>{
  if(data?.type==='state')tracker.state(data);
  else if(data?.type==='result'){
   const handled=tracker.result(data);
   if(data.error&&!handled)void OBR.notification.show(data.error,'ERROR');
  }
 });
 bus.send({type:'hello'});
});
window.addEventListener('pagehide',()=>{bus?.close();tracker.close();},{once:true});
