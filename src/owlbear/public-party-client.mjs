import {KEY,stateFrom} from './party-state.mjs';
export function publicPartyClient(onData,onStatus){
 let source,open=false,stopped=false,timer,loading=false,lastReceived=0,statusValue,epoch,version=-1;
 const report=value=>{if(statusValue!==value){statusValue=value;onStatus(value);}};
 function accept(value){
  const snapshot={...value,updatedAt:Date.now()};
  if(typeof snapshot.epoch!=='string'||snapshot.epoch.length>64||!Number.isSafeInteger(snapshot.version))throw Error('Invalid party version.');
  if(epoch===snapshot.epoch&&snapshot.version<version)return;
  if(snapshot.publisher!=='cosmos-public-party'||!stateFrom({[KEY]:snapshot}))throw Error('Invalid party feed.');
  epoch=snapshot.epoch;version=snapshot.version;lastReceived=Date.now();onData(snapshot);report('Live');
 }
 async function fallback(){
  if(stopped||loading)return;loading=true;
  try{const response=await fetch('/api/v1/owlbear/party',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Party unavailable.');const value=await response.json();if(!stopped)accept(value);}catch{if(!stopped)report('Reconnecting…');}
  finally{loading=false;if(!stopped&&!open)timer=setTimeout(fallback,1000);}
 }
 function streaming(){
  if(stopped||typeof EventSource==='undefined')return;source?.close();open=false;source=new EventSource('/api/v1/owlbear/party/events');
  source.onmessage=event=>{try{accept(JSON.parse(event.data));open=true;clearTimeout(timer);}catch{open=false;void fallback();}};
  source.onerror=()=>{open=false;report('Reconnecting…');clearTimeout(timer);void fallback();};
 }
 streaming();timer=setTimeout(()=>{if(!lastReceived)void fallback();},1200);
 const watchdog=setInterval(()=>{if(!stopped&&Date.now()-lastReceived>25000){open=false;void fallback();streaming();}},10000);
 const visible=()=>{if(document.visibilityState==='visible'&&Date.now()-lastReceived>5000){open=false;void fallback();streaming();}};document.addEventListener('visibilitychange',visible);
 return ()=>{stopped=true;source?.close();clearTimeout(timer);clearInterval(watchdog);document.removeEventListener('visibilitychange',visible);};
}
