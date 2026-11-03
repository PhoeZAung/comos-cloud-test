import {synthesizeDragonRoar,DRAGON_ROAR_SECONDS} from '../features/dragon-roar.mjs';
const buffers=new WeakMap();
export function playDragonRoar(context,volume=0){
 if(!context||context.state!=='running'||!Number.isFinite(volume)||volume<=0)return ()=>{};
 const nodes=[];let source,stopped=false;
 const stop=()=>{if(stopped)return;stopped=true;try{source?.stop();}catch{}for(const node of nodes)try{node.disconnect();}catch{}};
 try{
  if(!buffers.has(context)){const samples=synthesizeDragonRoar(context.sampleRate),buffer=context.createBuffer(1,samples.length,context.sampleRate);buffer.getChannelData(0).set(samples);buffers.set(context,buffer);}
  source=context.createBufferSource();const gain=context.createGain();nodes.push(source,gain);source.buffer=buffers.get(context);gain.gain.value=Math.min(1,volume)*.6;source.connect(gain).connect(context.destination);source.onended=stop;source.start(context.currentTime);source.stop(context.currentTime+DRAGON_ROAR_SECONDS);return stop;
 }catch{stop();return ()=>{};}
}
