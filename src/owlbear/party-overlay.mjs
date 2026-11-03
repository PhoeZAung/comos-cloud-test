import OBR from '@owlbear-rodeo/sdk';
import {trackerRows,TRACKER} from './tracker.mjs';
import {PORTRAITS,REQUEST,UI,HUD,esc,stateFrom,validThumbnail,gmConnections} from './party-state.mjs';
const root=document.querySelector('[data-status-cards]'),portraits=new Map(),expanded=new Set(),params=new URLSearchParams(location.search),cardId=params.get('id');document.body.dataset.density=params.get('density')||'normal';let gm=false;
const person='<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="22" r="11" fill="currentColor"/><path d="M12 58v-9a20 20 0 0140 0v9" fill="currentColor"/></svg>';
let metadata,state,gms=new Set(),signature='',requestTime=0,ready=false,resizeTimer;
function fit(){if(!ready||document.querySelector('.card-menu:not([hidden]),dialog[open]'))return;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{void OBR.viewport.getHeight().then(height=>OBR.popover.setHeight(HUD+'/'+cardId,Math.max(80,Math.min(root.scrollHeight+30,height-80,730)))).catch(()=>{});},40);}
function meter(label,current,max){const value=Math.min(Math.max(0,current),Math.max(0,max));return '<div class="status-resource '+label.toLowerCase()+'"><div><span>'+label+'</span><strong>'+esc(current)+' <small>/ '+esc(max)+'</small></strong></div><progress aria-label="'+label+'" max="'+esc(Math.max(1,max))+'" value="'+esc(value)+'"></progress></div>';}
function draw(){
 const candidate=stateFrom(metadata);state=candidate&&gms.has(candidate.publisher)?candidate:null;
 const characters=trackerRows(metadata).filter(c=>c.id===cardId);if(params.get('mode')==='battle'&&characters[0])document.querySelector('.hud-header span').textContent='BATTLE · '+characters[0].round;const next=JSON.stringify([characters,[...expanded],[...portraits]]);
 if(next===signature)return;signature=next;
 const focused=document.activeElement?.closest('[data-ac]')?.dataset.ac;
 root.innerHTML=characters.map(c=>{
  const portrait=portraits.get(c.sourceId||c.id),override=c.portraitOverride||c.tokenPortrait,photo=(typeof override==='string'&&(/^https:\/\//.test(override)||validThumbnail(override)))?'<img src="'+esc(override)+'" alt="Character portrait">':portrait?.hash===c.portraitHash&&validThumbnail(portrait.portrait)?'<img src="'+esc(portrait.portrait)+'" alt="'+esc(c.name)+' character portrait">':person,open=expanded.has(c.id);
  return '<article class="status-card '+(c.active?'active-turn':'')+'"><div class="status-portrait">'+photo+'</div><div class="status-body"><strong class="status-name" title="'+esc(c.name)+'">'+esc(c.name)+(c.active?' ◀':'')+'</strong>'+meter('HP',c.hp,c.hpMax)+meter('MP',c.mp,c.mpMax)+'<div class="status-footer"><button class="status-ac" data-ac="'+esc(c.id)+'" aria-expanded="'+open+'" aria-controls="ac-'+esc(c.id)+'" aria-label="Armor class details for '+esc(c.name)+'">'+
   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z"/></svg> AC '+esc(c.ac)+' <span>'+(open?'▴':'▾')+'</span></button>'+(c.hpTemp>0?'<span class="temp-hp">+'+esc(c.hpTemp)+' temp HP</span>':'')+'</div></div><dl class="status-defenses" id="ac-'+esc(c.id)+'" '+(open?'':'hidden')+'><div><dt>Touch</dt><dd>'+esc(c.touch)+'</dd></div><div><dt>Flat-footed</dt><dd>'+esc(c.flat)+'</dd></div><div><dt>CMD</dt><dd>'+esc(c.cmd)+'</dd></div></dl></article>';
 }).join('');
 if(focused)for(const button of root.querySelectorAll('[data-ac]'))if(button.dataset.ac===focused)button.focus({preventScroll:true});
 fit();
 const active=new Set(characters.flatMap(c=>[c.id,c.sourceId]));for(const id of portraits.keys())if(!active.has(id))portraits.delete(id);for(const id of expanded)if(!active.has(id))expanded.delete(id);
}
async function requestPortraits(){
 if(!state||Date.now()-requestTime<2500)return;
 const row=trackerRows(metadata).find(c=>c.id===cardId),source=row?.sourceId||cardId;
 const ids=state.characters.filter(c=>c.id===source&&c.portraitHash&&portraits.get(c.id)?.hash!==c.portraitHash).map(c=>c.id);
 if(ids.length){requestTime=Date.now();await OBR.broadcast.sendMessage(REQUEST,{ids},{destination:'ALL'});}
}
root.onclick=event=>{const button=event.target.closest('[data-ac]');if(!button)return;expanded.has(button.dataset.ac)?expanded.delete(button.dataset.ac):expanded.add(button.dataset.ac);draw();};
document.querySelector('[data-close-overlay]').hidden=true;
OBR.onReady(async()=>{
 ready=true;gm=await OBR.player.getRole()==='GM';gms=await gmConnections(OBR);metadata=await OBR.room.getMetadata();draw();
 OBR.room.onMetadataChange(value=>{metadata=value;draw();void requestPortraits().catch(()=>{});});
 OBR.party.onChange(()=>{void gmConnections(OBR).then(value=>{gms=value;draw();});});
 OBR.player.onChange(()=>{void gmConnections(OBR).then(value=>{gms=value;draw();});});
 OBR.broadcast.onMessage(PORTRAITS,event=>{
  const value=event.data,row=trackerRows(metadata).find(c=>c.id===cardId);if(!row||value?.id!==(row.sourceId||cardId)||event.connectionId!==state?.publisher||!value||!validThumbnail(value.portrait)||!state.characters.some(c=>c.id===value.id&&c.portraitHash===value.hash))return;
  portraits.set(value.id,value);draw();
 });
 setInterval(()=>{draw();void requestPortraits().catch(()=>{});},5000);void requestPortraits().catch(()=>{});
});
const send=value=>OBR.broadcast.sendMessage(UI,value,{destination:'LOCAL'});
let drag;
const header=document.querySelector('.hud-header');header.querySelector('span').textContent=params.get('mode')==='battle'?'BATTLE':'PARTY';
header.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();header.setPointerCapture(event.pointerId);drag={x:event.screenX,y:event.screenY};};
header.onpointerup=event=>{if(!drag)return;const move={x:Number(params.get('x'))+event.screenX-drag.x,y:Number(params.get('y'))+event.screenY-drag.y};drag=null;void send({id:cardId,move});};
header.onpointercancel=()=>{drag=null;};
const menu=document.createElement('div');menu.className='card-menu';menu.hidden=true;menu.innerHTML='<button data-density="normal">Full</button><button data-density="compact">Compact</button><button data-density="tiny">Small</button><button data-battle>Add to battle</button><button data-next>Next turn</button><button data-photo>Add photo / icon</button><button data-edit>Edit stats</button><button data-link>Link character</button><button data-remove>Remove</button><button data-dismiss>Close</button><input type="file" accept="image/png,image/jpeg,image/webp" hidden>';
document.querySelector('.party-hud').append(menu);
document.oncontextmenu=event=>{event.preventDefault();menu.hidden=false;for(const b of menu.querySelectorAll('[data-next],[data-battle],[data-photo],[data-edit],[data-link],[data-remove]'))b.hidden=!gm;void OBR.popover.setHeight(HUD+'/'+cardId,gm?360:190);};
menu.onclick=async event=>{
 const button=event.target.closest('button');if(!button)return;
 try{
  if(button.dataset.density)await send({id:cardId,density:button.dataset.density});
  if(button.hasAttribute('data-next'))await send({nextTurn:true});
  if(button.hasAttribute('data-battle'))await send({battle:cardId});
  if(button.hasAttribute('data-photo')){menu.querySelector('input').click();return;}
  if(button.hasAttribute('data-remove'))await send({remove:cardId});
  if(button.hasAttribute('data-edit')||button.hasAttribute('data-link')){
   const row=trackerRows(metadata).find(c=>c.id===cardId);if(!row)return;
   if(row.linked&&button.hasAttribute('data-edit')){await OBR.notification.show('Edit this character on its Cosmos sheet.','INFO');return;}
   const dialog=document.createElement('dialog');dialog.className='tracker-edit';
   if(button.hasAttribute('data-link'))dialog.innerHTML='<form method="dialog"><label>Character<select name="character">'+(state?.characters||[]).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('')+'</select></label><button value="save">Link</button><button value="cancel">Cancel</button></form>';
   else dialog.innerHTML='<form method="dialog">'+['hp','hpMax','mp','mpMax','ac','touch','flat','cmd','initiative'].map(k=>'<label>'+esc(k)+'<input name="'+k+'" type="number" value="'+esc(row[k]||0)+'"></label>').join('')+'<button value="save">Save</button><button value="cancel">Cancel</button></form>';
   document.body.append(dialog);await OBR.popover.setHeight(HUD+'/'+cardId,560);dialog.showModal();dialog.onclose=()=>{if(dialog.returnValue==='save'){const form=new FormData(dialog.querySelector('form'));if(button.hasAttribute('data-link'))void send({id:cardId,link:form.get('character')});else void send({id:cardId,stats:Object.fromEntries([...form].map(([k,v])=>[k,Number(v)]))});}dialog.remove();fit();};
  }
 }catch(e){await OBR.notification.show(e.message,'ERROR');}
 menu.hidden=true;if(!document.querySelector('dialog[open]'))fit();
};
menu.querySelector('input').onchange=async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{if(file.size>5000000)throw Error('Choose an image under 5 MB.');const image=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=canvas.height=56;const side=Math.min(image.width,image.height);canvas.getContext('2d').drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,56,56);image.close();await send({id:cardId,photo:canvas.toDataURL('image/jpeg',.45)});menu.hidden=true;fit();}catch(e){await OBR.notification.show(e.message,'ERROR');}
};
