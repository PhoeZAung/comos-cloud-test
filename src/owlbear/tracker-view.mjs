import OBR from '@owlbear-rodeo/sdk';
export const person='<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="22" r="11"/><path d="M12 58v-9a20 20 0 0140 0v9"/></svg>';
export const defenses=row=>'Touch '+row.touch+' · Flat '+row.flat+' · CMD '+row.cmd;
export function portrait(card,row){
 const source=row.portraitHash?'/api/v1/owlbear/party/portrait/'+encodeURIComponent(row.id)+'?v='+row.portraitHash:'';if(card.source===source)return;card.source=source;
 if(!source){card.photo.innerHTML=person;return;}const image=new Image();image.src=source;image.alt=row.name;image.decoding='async';image.onerror=()=>{if(card.source===source)card.photo.innerHTML=person;};card.photo.replaceChildren(image);
}
export function resourceEditor(getState,send){
 const pending=new Map();
 const remove=id=>{clearTimeout(pending.get(id)?.timer);pending.delete(id);};
 return {
  pending:(id,key)=>[...pending.values()].some(value=>value.id===id&&value.key===key),
  confirm(state){for(const [id,value] of pending){const row=(value.battle?state.battle:state.party).find(row=>row.id===value.id);if(!row||value.revision&&row.revision>=value.revision||!row.siteId&&value.battle&&row[value.key]===value.value)remove(id);}},
  result(data){const value=pending.get(data.requestId);if(!value)return false;if(data.error){remove(data.requestId);void OBR.notification.show(data.error,'ERROR');}else if(data.revision){value.revision=data.revision;const state=getState(),row=(value.battle?state.battle:state.party).find(row=>row.id===value.id);if(row?.revision>=value.revision)remove(data.requestId);}else remove(data.requestId);return true;},
  edit(id,key,button,battle){
   const state=getState(),row=(battle?state.battle:state.party).find(row=>row.id===id);if(!state.admin||!row||row.available===false||battle&&key==='hp'&&!row.trackHp||button.parentNode.querySelector('input'))return;
   const input=document.createElement('input');input.type='number';input.step='1';input.className='resource-input';input.value=row[key];input.setAttribute('aria-label','Current '+key.toUpperCase()+' for '+row.name);input.min=key==='mp'?'0':'-9999999';input.max='9999999';button.replaceWith(input);input.focus();input.select();let cancelled=false,done=false;
   input.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();cancelled=true;input.blur();}if(event.key==='Enter'){event.preventDefault();input.blur();}};
   input.onblur=()=>{if(done)return;done=true;input.replaceWith(button);const value=Number(input.value);if(cancelled||input.value===''||!Number.isFinite(value)||Math.abs(value)>=1e7||key==='mp'&&value<0||value===row[key])return;
    const requestId=crypto.randomUUID();button.classList.add('saving');pending.set(requestId,{id,key,value,battle,timer:setTimeout(()=>{remove(requestId);button.classList.remove('saving');void OBR.notification.show('This change has not been confirmed. Reconnect Cosmos.','ERROR');},15000)});send({type:'stats',id,key,value,battle,revision:row.revision,requestId});
   };
  },
  close(){for(const id of pending.keys())remove(id);}
 };
}
