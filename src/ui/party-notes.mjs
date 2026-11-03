import * as Y from 'yjs';
const pack=bytes=>{let value='';for(let at=0;at<bytes.length;at+=8192)value+=String.fromCharCode(...bytes.subarray(at,at+8192));return btoa(value);};
const unpack=value=>Uint8Array.from(atob(value),ch=>ch.charCodeAt(0));
export function mountPartyNotes(root,{characterId,tagId}){
 const area=root.querySelector('textarea'),status=root.querySelector('[role=status]'),doc=new Y.Doc(),text=doc.getText('notes');
 const undo=new Y.UndoManager(text,{trackedOrigins:new Set(['local'])});
 const control=new AbortController(),key='cosmos-party-notes:'+characterId+':'+tagId,endpoint='/api/v1/party-notes/'+encodeURIComponent(tagId)+'?'+new URLSearchParams({characterId});
 let closed=false,ready=false,connected=false,blocked=false,source,timer,pollTimer,saving=false,pending=[],composing=false,deferred=[],retry=1000,seenRevision=0;
 const say=message=>{if(!closed)status.textContent=message;};
 function persist(){if(closed)return;try{if(pending.length)sessionStorage.setItem(key,pack(Y.mergeUpdates(pending)));else sessionStorage.removeItem(key);}catch{/* Notes still sync if browser storage is unavailable. */}}
 function repaint(){if(closed||composing)return;const value=text.toString();if(area.value===value)return;const start=area.selectionStart,end=area.selectionEnd;area.value=value;area.setSelectionRange(Math.min(start,value.length),Math.min(end,value.length));}
 function receive(update){
  if(closed)return;if(composing){deferred.push(update);return;}
  const focused=document.activeElement===area,start=Y.createRelativePositionFromTypeIndex(text,Math.min(area.selectionStart,text.length)),end=Y.createRelativePositionFromTypeIndex(text,Math.min(area.selectionEnd,text.length)),direction=area.selectionDirection,scroll=area.scrollTop;
  Y.applyUpdate(doc,update,'remote');repaint();
  if(focused){const a=Y.createAbsolutePositionFromRelativePosition(start,doc),b=Y.createAbsolutePositionFromRelativePosition(end,doc);if(a&&b)area.setSelectionRange(a.index,b.index,direction);area.scrollTop=scroll;}
 }
 function queueSave(delay=250){clearTimeout(timer);if(!closed&&!blocked)timer=setTimeout(()=>void flush(),delay);}
 async function flush(leaving=false){
  if(saving||!ready||!pending.length||blocked||(closed&&!leaving))return;
  saving=true;const batch=[...pending];say('Saving…');
  try{
   const update=pack(Y.mergeUpdates(batch));
   const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({update}),keepalive:leaving&&update.length<60000,signal:AbortSignal.timeout(12000)});
   if(!response.ok){const error=await response.json().catch(()=>({}));if([401,403,404].includes(response.status)){blocked=true;source?.close();if(!closed)area.readOnly=true;}throw Error(error.message||'Could not save.');}
   pending.splice(0,batch.length);persist();retry=1000;if(!blocked)say(pending.length?'Saving…':connected?'Connected':'Saved');
  }catch(error){say(blocked?error.message:'Not saved · '+error.message);retry=Math.min(12000,retry*2);}
  finally{saving=false;if(pending.length&&!closed&&!blocked)queueSave(retry);}
 }
 doc.on('update',(update,origin)=>{if(origin==='remote'||origin==='initial'||origin==='cache')return;pending.push(update);persist();if(origin!=='local')repaint();queueSave();});
 function edit(){
  if(!ready||blocked||composing)return;const before=text.toString(),after=area.value;if(before===after)return;
  let prefix=0,endBefore=before.length,endAfter=after.length;
  while(prefix<endBefore&&prefix<endAfter&&before[prefix]===after[prefix])prefix++;
  while(endBefore>prefix&&endAfter>prefix&&before[endBefore-1]===after[endAfter-1]){endBefore--;endAfter--;}
  doc.transact(()=>{if(endBefore>prefix)text.delete(prefix,endBefore-prefix);if(endAfter>prefix)text.insert(prefix,after.slice(prefix,endAfter));},'local');
 }
 area.addEventListener('input',edit,{signal:control.signal});
 area.addEventListener('compositionstart',()=>{composing=true;},{signal:control.signal});
 area.addEventListener('compositionend',()=>{composing=false;edit();for(const update of deferred)receive(update);deferred=[];},{signal:control.signal});
 area.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&!event.altKey&&['z','y'].includes(event.key.toLowerCase())&&!composing){event.preventDefault();if(event.shiftKey||event.key.toLowerCase()==='y')undo.redo();else undo.undo();}},{signal:control.signal});
 const reconnect=()=>{if(ready&&!blocked)void flush();};window.addEventListener('online',reconnect,{signal:control.signal});
 async function poll(){
  if(closed||blocked)return;
  try{if(!document.hidden){const response=await fetch(endpoint+'&revision='+seenRevision,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.any([control.signal,AbortSignal.timeout(10000)])});const data=await response.json();if(!response.ok){if([401,403,404].includes(response.status)){blocked=true;area.readOnly=true;}throw Error(data.message||'Could not sync notes.');}if(closed)return;if(!data.unchanged){receive(unpack(data.update));seenRevision=data.revision;}connected=true;if(!pending.length)say('Connected');}}
  catch(error){connected=false;if(!closed)say(error.message||'Reconnecting…');}
  finally{if(!closed&&!blocked)pollTimer=setTimeout(()=>void poll(),1000);}
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)void flush(true);else reconnect();},{signal:control.signal});
 window.addEventListener('pagehide',()=>void flush(true),{signal:control.signal});
 window.addEventListener('beforeunload',event=>{if(pending.length){void flush(true);event.preventDefault();event.returnValue='';}},{signal:control.signal});
 void(async()=>{
  try{
   const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.any([control.signal,AbortSignal.timeout(15000)])});
   const data=await response.json();if(!response.ok)throw Error(data.message||'Could not open notes.');if(closed)return;
   Y.applyUpdate(doc,unpack(data.update),'initial');seenRevision=data.revision;
   try{const cached=sessionStorage.getItem(key);if(cached&&cached.length<700000){const update=unpack(cached);Y.applyUpdate(doc,update,'cache');pending.push(update);}}catch{/* Ignore a damaged local draft. */}
   ready=true;area.readOnly=false;repaint();say('Connecting…');if(pending.length)queueSave(0);
   if(document.body.hasAttribute('data-owlbear-sheet')||typeof EventSource==='undefined'){void poll();return;}
   source=new EventSource(endpoint+'&stream=1',{withCredentials:true});
   source.onopen=()=>{connected=true;say(pending.length?'Saving…':'Connected');reconnect();};
   source.onmessage=event=>{try{const data=JSON.parse(event.data);receive(unpack(data.update));seenRevision=data.revision;if(!pending.length)say('Connected');}catch{say('Could not sync notes.');}};
   source.onerror=()=>{connected=false;say(pending.length?'Not saved · Reconnecting…':'Reconnecting…');};
   source.addEventListener('access-removed',()=>{blocked=true;connected=false;source.close();area.readOnly=true;say('Party access changed.');});
  }catch(error){if(!closed)say(error.message||'Could not open notes.');}
 })();
 return ()=>{if(composing){composing=false;edit();}closed=true;clearTimeout(timer);clearTimeout(pollTimer);source?.close();control.abort();void flush(true);undo.destroy();doc.destroy();};
}
