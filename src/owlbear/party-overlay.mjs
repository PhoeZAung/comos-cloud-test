import OBR from '@owlbear-rodeo/sdk';
import {PORTRAITS,REQUEST,UI,HUD,esc,stateFrom,validThumbnail,gmConnections} from './party-state.mjs';
const root=document.querySelector('[data-status-cards]'),portraits=new Map(),expanded=new Set();
const person='<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="22" r="11" fill="currentColor"/><path d="M12 58v-9a20 20 0 0140 0v9" fill="currentColor"/></svg>';
let metadata,state,gms=new Set(),signature='',requestTime=0,ready=false,resizeTimer;
function fit(){if(!ready)return;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{void OBR.viewport.getHeight().then(height=>OBR.popover.setHeight(HUD,Math.max(100,Math.min(root.scrollHeight+38,height-150,730)))).catch(()=>{});},40);}
function meter(label,current,max){const value=Math.min(Math.max(0,current),Math.max(0,max));return '<div class="status-resource '+label.toLowerCase()+'"><div><span>'+label+'</span><strong>'+esc(current)+' <small>/ '+esc(max)+'</small></strong></div><progress aria-label="'+label+'" max="'+esc(Math.max(1,max))+'" value="'+esc(value)+'"></progress></div>';}
function draw(){
 const candidate=stateFrom(metadata);state=candidate&&gms.has(candidate.publisher)?candidate:null;
 const characters=state?.characters||[],next=JSON.stringify([characters,[...expanded],characters.map(c=>portraits.get(c.id)?.hash===c.portraitHash?portraits.get(c.id).portrait:'')]);
 if(next===signature)return;signature=next;
 const focused=document.activeElement?.closest('[data-ac]')?.dataset.ac;
 root.innerHTML=characters.map(c=>{
  const portrait=portraits.get(c.id),photo=portrait?.hash===c.portraitHash&&validThumbnail(portrait.portrait)?'<img src="'+esc(portrait.portrait)+'" alt="'+esc(c.name)+' character portrait">':person,open=expanded.has(c.id);
  return '<article class="status-card"><div class="status-portrait">'+photo+'</div><div class="status-body"><strong class="status-name" title="'+esc(c.name)+'">'+esc(c.name)+'</strong>'+meter('HP',c.hp,c.hpMax)+meter('MP',c.mp,c.mpMax)+'<div class="status-footer"><button class="status-ac" data-ac="'+esc(c.id)+'" aria-expanded="'+open+'" aria-controls="ac-'+esc(c.id)+'" aria-label="Armor class details for '+esc(c.name)+'">'+
   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z"/></svg> AC '+esc(c.ac)+' <span>'+(open?'▴':'▾')+'</span></button>'+(c.hpTemp>0?'<span class="temp-hp">+'+esc(c.hpTemp)+' temp HP</span>':'')+'</div></div><dl class="status-defenses" id="ac-'+esc(c.id)+'" '+(open?'':'hidden')+'><div><dt>Touch</dt><dd>'+esc(c.touch)+'</dd></div><div><dt>Flat-footed</dt><dd>'+esc(c.flat)+'</dd></div><div><dt>CMD</dt><dd>'+esc(c.cmd)+'</dd></div></dl></article>';
 }).join('');
 if(focused)for(const button of root.querySelectorAll('[data-ac]'))if(button.dataset.ac===focused)button.focus({preventScroll:true});
 fit();
 const active=new Set(characters.map(c=>c.id));for(const id of portraits.keys())if(!active.has(id))portraits.delete(id);for(const id of expanded)if(!active.has(id))expanded.delete(id);
}
async function requestPortraits(){
 if(!state||Date.now()-requestTime<2500)return;
 const ids=state.characters.filter(c=>c.portraitHash&&portraits.get(c.id)?.hash!==c.portraitHash).map(c=>c.id);
 if(ids.length){requestTime=Date.now();await OBR.broadcast.sendMessage(REQUEST,{ids},{destination:'ALL'});}
}
root.onclick=event=>{const button=event.target.closest('[data-ac]');if(!button)return;expanded.has(button.dataset.ac)?expanded.delete(button.dataset.ac):expanded.add(button.dataset.ac);draw();};
document.querySelector('[data-close-overlay]').onclick=()=>void OBR.broadcast.sendMessage(UI,{show:false},{destination:'LOCAL'});
OBR.onReady(async()=>{
 ready=true;gms=await gmConnections(OBR);metadata=await OBR.room.getMetadata();draw();
 OBR.room.onMetadataChange(value=>{metadata=value;draw();void requestPortraits().catch(()=>{});});
 OBR.party.onChange(()=>{void gmConnections(OBR).then(value=>{gms=value;draw();});});
 OBR.player.onChange(()=>{void gmConnections(OBR).then(value=>{gms=value;draw();});});
 OBR.broadcast.onMessage(PORTRAITS,event=>{
  const value=event.data;if(event.connectionId!==state?.publisher||!value||!validThumbnail(value.portrait)||!state.characters.some(c=>c.id===value.id&&c.portraitHash===value.hash))return;
  portraits.set(value.id,value);draw();
 });
 setInterval(()=>{draw();void requestPortraits().catch(()=>{});},5000);void requestPortraits().catch(()=>{});
});
