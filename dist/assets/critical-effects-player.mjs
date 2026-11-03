import {CriticalFrameClock,criticalEnabled} from '../features/critical-effects.mjs';
import {createCriticalFrames} from './critical-frames.mjs';
import {preferences} from './preferences.mjs';
let active=null;
export function showCriticalScreen(effect,{signal,result,preview=false,onSound}={}){
 if(!effect||signal?.aborted||active)return Promise.resolve();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),view=document.createElement('div'),timers=new Set(),shakes=[],seen=new Set();
 view.className='critical-screen '+(effect.value===1?'critical-failure':'critical-success')+(reduced.matches?' critical-screen-still':'');view.dataset.effect=effect.id;view.setAttribute('popover','manual');view.setAttribute('role','status');view.setAttribute('aria-label','Natural '+effect.value);
 view.innerHTML='<div class="critical-screen-stage"><canvas aria-hidden="true"></canvas><div class="critical-screen-result"><strong>NAT '+effect.value+'</strong><span data-critical-total></span>'+(preview?'<small>Preview</small>':'')+'</div></div>';
 const caption=view.querySelector('.critical-screen-result'),canvas=view.querySelector('canvas'),stage=view.querySelector('.critical-screen-stage'),context=canvas.getContext('2d'),attack=result?.kind==='weapon'?result:result?.attack;
 view.querySelector('[data-critical-total]').textContent=[attack?'Attack '+attack.total:Number.isFinite(result?.total)?'Total '+result.total:'',result?.damage?'Damage '+result.damage.total:''].filter(Boolean).join(' · ');
 let closed=false,fallback=false,frames,clock,raf,last,numberShown=false,stopSound=()=>{},resolve;const done=new Promise(r=>resolve=r);
 const later=(callback,delay)=>{const timer=setTimeout(()=>{timers.delete(timer);callback();},delay);timers.add(timer);return timer;};
 function close(){if(closed)return;closed=true;cancelAnimationFrame(raf);for(const timer of timers)clearTimeout(timer);for(const animation of shakes)animation.cancel();stopSound();frames?.close();signal?.removeEventListener('abort',close);document.removeEventListener('keydown',escape);document.removeEventListener('comos:preferences',changed);window.removeEventListener('resize',resize);reduced.removeEventListener?.('change',motion);view.remove();if(active===close)active=null;resolve();}
 const escape=event=>{if(event.key==='Escape')close();},changed=()=>{if(!preview&&!criticalEnabled(effect.value,preferences.diceOptions))close();if(!preferences.diceOptions.critSound||preferences.diceOptions.volume===0)stopSound();},motion=event=>{if(event.matches)close();};
 function shake(){
  if(reduced.matches)return;for(const animation of shakes)animation.cancel();shakes.length=0;const amount=innerWidth<600?4:7;
  const positions=[[0,0],[-1,.5],[1,-.7],[-.7,-.4],[.8,.7],[-.4,.3],[.3,-.3],[0,0]].map(([x,y])=>({translate:x*amount+'px '+y*amount+'px'}));
  for(const node of [document.body,stage])if(node.animate)shakes.push(node.animate(positions,{duration:340,easing:'linear'}));
 }
 function number(){if(numberShown)return;numberShown=true;caption.classList.add('is-impact');try{stopSound=onSound?.()||stopSound;}catch{}}
 function paint(){
  if(!frames||!clock||closed)return;const ratio=Math.min(devicePixelRatio||1,1.5),width=stage.clientWidth,height=stage.clientHeight;
  if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);context.setTransform(ratio,0,0,ratio,0,0);}
  frames.draw(context,clock.frame,width,height);canvas.dataset.frame=String(clock.frame);
  if(effect.impacts.includes(clock.frame)&&!seen.has(clock.frame)){seen.add(clock.frame);view.dataset.impactFrame=String(clock.frame);shake();}
  if(clock.frame>=effect.numberFrame)number();
 }
 const resize=()=>paint();
 function finish(){later(()=>{view.classList.add('is-leaving');later(close,200);},250);}
 function failed(){if(closed||fallback)return;fallback=true;frames?.close();frames=null;cancelAnimationFrame(raf);number();shake();later(finish,750);}
 function tick(now){
  if(closed||fallback)return;
  try{if(document.hidden){last=now;raf=requestAnimationFrame(tick);return;}const before=clock.frame;clock.tick(now-last,frame=>frames.ready(frame));last=now;if(clock.frame!==before)paint();if(clock.finished){finish();return;}raf=requestAnimationFrame(tick);}catch{failed();}
 }
 active=close;document.body.append(view);try{view.showPopover?.();}catch{}
 signal?.addEventListener('abort',close,{once:true});document.addEventListener('keydown',escape);document.addEventListener('comos:preferences',changed);window.addEventListener('resize',resize);reduced.addEventListener?.('change',motion);
 if(reduced.matches){caption.classList.add('is-impact');later(close,900);return done;}
 if(!context){failed();return done;}
 const deadline=later(failed,3500);
 void createCriticalFrames(effect).then(player=>{
  if(closed||fallback){player.close();return;}clearTimeout(deadline);timers.delete(deadline);frames=player;clock=new CriticalFrameClock(frames.entry.delays,effect.endFrame);paint();last=performance.now();raf=requestAnimationFrame(tick);
 }).catch(()=>{clearTimeout(deadline);timers.delete(deadline);failed();});
 return done;
}
