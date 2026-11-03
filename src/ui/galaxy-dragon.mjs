import {dragonArtwork,DRAGON_DURATION} from '../features/galaxy-dragon-art.mjs';
let active=null,serial=0,texture;
export function preloadDragon(){if(!texture&&typeof Image!=='undefined'){texture=new Image();texture.decoding='async';texture.src='/assets/roll-fx/galaxy-nebula.webp';}}
export function showGalaxyDragon({signal,result,preview=false,onSound}={}){
 if(signal?.aborted||active)return Promise.resolve();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,view=document.createElement('div');
 view.className='galaxy-dragon-fx'+(reduced?' galaxy-dragon-still':'');view.setAttribute('popover','manual');view.setAttribute('role','status');view.setAttribute('aria-label','Natural 20');
 const points=Array.from({length:32},(_,i)=>{const x=i*34-30,y=1000-x*.9+Math.sin(i*7)*34;return '<circle cx="'+x+'" cy="'+y+'" r="'+(i%4===0?1.8:1)+'"/>';}).join('');
 view.innerHTML=(reduced?'':'<div class="galaxy-dragon-halo"></div><svg class="galaxy-dragon-trail" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><path d="M-120 1090C180 830 650 400 1130 -80" pathLength="1"/>'+points+'</svg><div class="galaxy-dragon-flight">'+dragonArtwork('cosmos-dragon-'+(++serial))+'</div>')+'<div class="galaxy-dragon-receipt"><strong>NAT 20</strong><span data-dragon-result></span>'+(preview?'<small>Preview</small>':'')+'</div>';
 view.querySelectorAll('.galaxy-dragon-trail circle').forEach((point,index)=>point.style.setProperty('--spark-delay',(.12+index*.029)+'s'));
 const attack=result?.kind==='weapon'?result:result?.attack;
 view.querySelector('[data-dragon-result]').textContent=[attack?'Attack '+attack.total:Number.isFinite(result?.total)?'Total '+result.total:'',result?.damage?'Damage '+result.damage.total:''].filter(Boolean).join(' · ');
 let finish,stop=()=>{},timer,closed=false;const done=new Promise(resolve=>finish=resolve);
 const close=()=>{if(closed)return;closed=true;clearTimeout(timer);stop();signal?.removeEventListener('abort',close);document.removeEventListener('keydown',escape);media.removeEventListener?.('change',motionChanged);view.remove();if(active===close)active=null;finish();};
 const escape=event=>{if(event.key==='Escape')close();},media=matchMedia('(prefers-reduced-motion: reduce)'),motionChanged=event=>{if(event.matches)close();};
 active=close;document.body.append(view);try{view.showPopover?.();}catch{/* Fixed overlay remains available without the Popover API. */}
 signal?.addEventListener('abort',close,{once:true});document.addEventListener('keydown',escape);media.addEventListener?.('change',motionChanged);
 timer=setTimeout(close,reduced?900:DRAGON_DURATION);
 if(!reduced){preloadDragon();try{stop=onSound?.()||stop;}catch{/* Audio never holds up the visual or the roll. */}}
 return done;
}
