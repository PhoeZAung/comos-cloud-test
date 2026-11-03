import OBR from '@owlbear-rodeo/sdk';
import {trackerRows,trackerConfig} from './tracker.mjs';
import {PORTRAITS,REQUEST,UI,HUD,esc,stateFrom,validThumbnail} from './party-state.mjs';
const root=document.querySelector('[data-status-cards]'),params=new URLSearchParams(location.search),view=params.get('mode')==='battle'?'battle':'party',portraits=new Map(),expanded=new Set();
const header=document.querySelector('.hud-header'),label=header.querySelector('span');document.body.dataset.density=params.get('density')||'normal';document.body.dataset.view=view;
let gm=false,ready=false,metadata={},signature='',requestTime=0,selectedId,drag;
const person='<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="22" r="11" fill="currentColor"/><path d="M12 58v-9a20 20 0 0140 0v9" fill="currentColor"/></svg>';
const send=value=>OBR.broadcast.sendMessage(UI,{view,...value},{destination:'LOCAL'}).catch(e=>OBR.notification.show(e.message,'ERROR'));
const size=async height=>OBR.popover.setHeight(HUD+'/'+view,Math.max(100,Math.min(height,(await OBR.viewport.getHeight())-70)));
const restoreSize=()=>{if(ready)void size(view==='party'?({normal:190,compact:146,tiny:112}[params.get('density')]||190):480);};
function meter(name,value,max){return '<div class="status-resource '+name.toLowerCase()+'"><div><span>'+name+'</span><strong>'+esc(value)+' <small>/ '+esc(max)+'</small></strong></div><progress aria-label="'+name+'" max="'+esc(Math.max(1,max))+'" value="'+esc(Math.max(0,Math.min(value,max)))+'"></progress></div>';}
function defenses(c){return '<dl class="status-defenses"><div><dt>Touch</dt><dd>'+esc(c.touch)+'</dd></div><div><dt>Flat-footed</dt><dd>'+esc(c.flat)+'</dd></div><div><dt>CMD</dt><dd>'+esc(c.cmd)+'</dd></div></dl>';}
function ac(c){return '<button class="status-ac" data-ac="'+esc(c.id)+'" aria-expanded="'+expanded.has(c.id)+'" aria-label="Armor class details for '+esc(c.name)+'">'+esc(c.ac)+' <span>'+(expanded.has(c.id)?'▴':'▾')+'</span></button>';}
function photo(c){const cached=portraits.get(c.sourceId||c.id),src=c.portraitOverride||c.tokenPortrait||(cached?.hash===c.portraitHash?cached.portrait:'');return typeof src==='string'&&(/^https:\/\//.test(src)||validThumbnail(src))?'<img src="'+esc(src)+'" alt="'+esc(c.name)+' character portrait">':person;}
const turns=document.createElement('div');turns.className='battle-turns';turns.innerHTML='<span data-round>Round 1</span><button data-step="-1" aria-label="Previous turn">← Back</button><button data-step="1" aria-label="Next turn">Next →</button>';header.append(turns);turns.hidden=view!=='battle';
function draw(){
 const rows=trackerRows(metadata,view),config=trackerConfig(metadata),round=Math.max(1,config.round||1),active=rows.findIndex(c=>c.active);
 label.textContent=view==='party'?'PARTY':'BATTLE';turns.querySelector('[data-round]').textContent='Round '+round;
 for(const b of turns.querySelectorAll('button')){b.hidden=!gm;b.disabled=!rows.length||(b.dataset.step==='-1'&&round===1&&active===0);}
 const next=JSON.stringify([rows,[...expanded],[...portraits],gm]);if(signature===next||root.querySelector('input:focus'))return;signature=next;
 if(view==='battle')root.innerHTML='<table class="battle-table"><thead><tr><th scope="col">Init</th><th scope="col">Name</th><th scope="col">HP</th><th scope="col">MP</th><th scope="col">AC</th></tr></thead><tbody>'+rows.map(c=>'<tr data-row="'+esc(c.id)+'" class="'+(c.active?'current-turn':c.upNext?'next-turn':'')+'" '+(c.active?'aria-current="step"':'')+'><td><input type="number" step="1" min="-9999" max="9999" data-initiative="'+esc(c.id)+'" aria-label="Initiative for '+esc(c.name)+'" value="'+esc(c.initiative)+'" '+(gm?'':'readonly')+'></td><th scope="row" title="'+esc(c.name)+(c.active?' · Current turn':c.upNext?' · Up next':'')+'">'+(c.active?'<span class="turn-marker" aria-hidden="true">▶</span>':c.upNext?'<span class="turn-marker next" aria-hidden="true">›</span>':'')+esc(c.name)+'</th><td>'+esc(c.hp)+'<small>/'+esc(c.hpMax)+'</small></td><td>'+esc(c.mp)+'<small>/'+esc(c.mpMax)+'</small></td><td>'+ac(c)+'</td></tr>'+(expanded.has(c.id)?'<tr class="battle-defenses"><td colspan="5">'+defenses(c)+'</td></tr>':'')).join('')+'</tbody></table>';
 else root.innerHTML=rows.map(c=>'<article class="status-card" data-row="'+esc(c.id)+'"><div class="status-portrait">'+photo(c)+'</div><div class="status-body"><strong class="status-name" title="'+esc(c.name)+'">'+esc(c.name)+'</strong>'+meter('HP',c.hp,c.hpMax)+meter('MP',c.mp,c.mpMax)+'<div class="status-footer"><span class="ac-label">AC</span>'+ac(c)+(c.hpTemp>0?'<span class="temp-hp">+'+esc(c.hpTemp)+' temp HP</span>':'')+'</div></div>'+(expanded.has(c.id)?defenses(c):'')+'</article>').join('');
 const ids=new Set(rows.map(c=>c.sourceId||c.id));for(const id of portraits.keys())if(!ids.has(id))portraits.delete(id);
}
root.onclick=event=>{const b=event.target.closest('[data-ac]');if(b){expanded.has(b.dataset.ac)?expanded.delete(b.dataset.ac):expanded.add(b.dataset.ac);draw();}};
root.onchange=event=>{const input=event.target.closest('[data-initiative]');if(input){const value=Number(input.value);if(input.value!==''&&Number.isFinite(value)&&Math.abs(value)<10000)void send({id:input.dataset.initiative,initiative:value});else{signature='';input.blur();draw();}}};
root.onfocusout=()=>setTimeout(draw,0);
turns.onclick=event=>{const b=event.target.closest('[data-step]');if(b)void send({step:Number(b.dataset.step)});};
header.onpointerdown=event=>{if(event.button!==0||event.target.closest('button'))return;event.preventDefault();header.setPointerCapture(event.pointerId);drag={x:event.screenX,y:event.screenY};};
header.onpointerup=event=>{if(!drag)return;const move={x:Number(params.get('x'))+event.screenX-drag.x,y:Number(params.get('y'))+event.screenY-drag.y};drag=null;void send({move});};header.onpointercancel=()=>{drag=null;};
document.querySelector('[data-close-overlay]').hidden=true;
const menu=document.createElement('div');menu.className='card-menu';menu.hidden=true;menu.innerHTML='<button data-density="normal">Full</button><button data-density="compact">Compact</button><button data-density="tiny">Small</button><button data-battle>Add to battle</button><button data-photo>Add photo / icon</button><button data-edit>Edit stats</button><button data-link>Link character</button><button data-remove>Remove from '+view+'</button><button data-dismiss>Close</button><input type="file" accept="image/png,image/jpeg,image/webp" hidden>';document.querySelector('.party-hud').append(menu);
document.oncontextmenu=event=>{event.preventDefault();selectedId=event.target.closest('[data-row]')?.dataset.row;menu.hidden=false;for(const b of menu.querySelectorAll('[data-battle],[data-photo],[data-edit],[data-link],[data-remove]'))b.hidden=!gm||!selectedId;menu.querySelector('[data-battle]').hidden=!gm||!selectedId||view==='battle';void size(view==='party'?340:480);};
menu.onclick=async event=>{
 const b=event.target.closest('button');if(!b)return;
 try{
  if(b.dataset.density)await send({density:b.dataset.density});
  if(b.hasAttribute('data-battle'))await send({battle:selectedId});
  if(b.hasAttribute('data-photo')){menu.querySelector('input').click();return;}
  if(b.hasAttribute('data-remove'))await send({remove:selectedId});
  if(b.hasAttribute('data-edit')||b.hasAttribute('data-link')){
   const row=trackerRows(metadata,view).find(c=>c.id===selectedId),id=selectedId;if(!row)return;
   if(row.linked&&b.hasAttribute('data-edit')){await OBR.notification.show('Edit this character on its Cosmos sheet.','INFO');return;}
   const dialog=document.createElement('dialog');dialog.className='tracker-edit';
   if(b.hasAttribute('data-link'))dialog.innerHTML='<form method="dialog"><label>Character<select name="character">'+(stateFrom(metadata)?.characters||[]).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('')+'</select></label><button value="save">Link</button><button value="cancel">Cancel</button></form>';
   else dialog.innerHTML='<form method="dialog">'+['hp','hpMax','mp','mpMax','ac','touch','flat','cmd'].map(k=>'<label>'+esc(k)+'<input name="'+k+'" type="number" value="'+esc(row[k]||0)+'"></label>').join('')+'<button value="save">Save</button><button value="cancel">Cancel</button></form>';
   document.body.append(dialog);await size(560);dialog.showModal();dialog.onclose=()=>{if(dialog.returnValue==='save'){const form=new FormData(dialog.querySelector('form'));if(b.hasAttribute('data-link'))void send({id,link:form.get('character')});else void send({id,stats:Object.fromEntries([...form].map(([k,v])=>[k,Number(v)]))});}dialog.remove();restoreSize();};
  }
 }catch(e){await OBR.notification.show(e.message,'ERROR');}
 menu.hidden=true;if(!document.querySelector('dialog[open]'))restoreSize();
};
menu.querySelector('input').onchange=async event=>{
 const file=event.target.files?.[0],id=selectedId;if(!file||!id)return;
 try{if(file.size>5000000)throw Error('Choose an image under 5 MB.');const image=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=canvas.height=56;const side=Math.min(image.width,image.height);canvas.getContext('2d').drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,56,56);image.close();await send({id,photo:canvas.toDataURL('image/jpeg',.45)});menu.hidden=true;restoreSize();}catch(e){await OBR.notification.show(e.message,'ERROR');}
};
async function requestPortraits(){
 if(view!=='party'||Date.now()-requestTime<2500)return;const state=stateFrom(metadata);if(!state)return;
 const ids=trackerRows(metadata,view).filter(c=>c.portraitHash&&!c.portraitOverride&&portraits.get(c.sourceId||c.id)?.hash!==c.portraitHash).map(c=>c.sourceId||c.id);
 if(ids.length){requestTime=Date.now();await OBR.broadcast.sendMessage(REQUEST,{ids:[...new Set(ids)]},{destination:'ALL'});}
}
OBR.onReady(async()=>{
 ready=true;gm=await OBR.player.getRole()==='GM';metadata=await OBR.room.getMetadata();draw();
 OBR.room.onMetadataChange(value=>{metadata=value;draw();void requestPortraits().catch(()=>{});});
 OBR.player.onChange(()=>{void OBR.player.getRole().then(role=>{gm=role==='GM';draw();});});
 OBR.broadcast.onMessage(PORTRAITS,event=>{const state=stateFrom(metadata),value=event.data;if(view!=='party'||event.connectionId!==state?.publisher||!value||!validThumbnail(value.portrait)||!trackerRows(metadata,view).some(c=>(c.sourceId||c.id)===value.id&&c.portraitHash===value.hash))return;portraits.set(value.id,value);draw();});
 setInterval(()=>{draw();void requestPortraits().catch(()=>{});},5000);void requestPortraits().catch(()=>{});
});
