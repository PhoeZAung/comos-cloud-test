// Impact frames are authored against the supplied GIFs' original 30/40 ms delays.
export const criticalEffects=Object.freeze([
 {id:'void-rift',value:1,frames:78,numberFrame:28,impacts:[28,69],sound:'fizzle'},
 {id:'crystal-shatter-blast',value:1,frames:48,numberFrame:4,impacts:[4],sound:'fizzle'},
 {id:'planet-shatter',value:1,frames:108,endFrame:83,fit:'cover',numberFrame:41,impacts:[41],sound:'fizzle'},
 {id:'thunder-god-strike',value:20,frames:84,numberFrame:42,impacts:[42],sound:'fire'},
 {id:'starfall-barrage',value:20,frames:90,numberFrame:40,impacts:[40,48,55,63],sound:'arcane'},
 {id:'thousand-cuts',value:20,frames:72,numberFrame:52,impacts:[10,22,34,52],sound:'arcane'}
]);
export function criticalEnabled(value,options={}){const key=value===20?'nat20Effects':value===1?'nat1Effects':null;return Boolean(key&&(typeof options[key]==='boolean'?options[key]:options.critEffects!==false));}
export function chooseCriticalEffect(value,random=Math.random){const choices=criticalEffects.filter(effect=>effect.value===value);return choices.length?choices[Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)))]:null;}
export class CriticalFrameClock{
 constructor(delays,endFrame=delays.length){this.delays=delays;this.end=Math.min(delays.length,endFrame);this.frame=0;this.elapsed=0;this.finished=false;}
 tick(delta,ready=()=>true){
  if(this.finished)return this.frame;
  this.elapsed+=Math.max(0,Math.min(80,delta));
  if(this.elapsed>=this.delays[this.frame]){
   if(this.frame+1>=this.end){this.finished=true;return this.frame;}
   if(ready(this.frame+1)){this.elapsed-=this.delays[this.frame];this.frame++;}
   else this.elapsed=Math.min(this.elapsed,this.delays[this.frame]);
  }
  return this.frame;
 }
}
