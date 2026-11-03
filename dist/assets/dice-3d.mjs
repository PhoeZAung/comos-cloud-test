import {preferences} from './preferences.mjs';
import {resultDice} from '../features/dice-themes.mjs';
let queue=Promise.resolve(),overlay,enginePromise,engine;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function stage(){
 if(overlay)return overlay;
 overlay=document.createElement('div');overlay.className='dice-page-overlay';overlay.setAttribute('popover','manual');overlay.setAttribute('aria-label','Dice roll');
 overlay.innerHTML='<div id="cosmos-dice-stage" class="dice-page-stage" aria-hidden="true"></div><div class="dice-page-receipt"><p role="status" aria-live="polite">Preparing dice…</p><button type="button" aria-label="Dismiss dice">×</button></div>';
 document.body.append(overlay);return overlay;
}
export function show3DDice(result,{theme=preferences.diceTheme,notation=null,options={...preferences.diceOptions},signal}={}){
 const work=()=>signal?.aborted?undefined:run(result,theme,notation,options,signal);queue=queue.catch(()=>{}).then(work);return queue;
}
async function run(result,theme,notation,custom,signal){
 const view=stage(),status=view.querySelector('[role=status]');
 view.classList.remove('dice-page-leaving');view.hidden=false;
 if(view.showPopover&&!view.matches(':popover-open'))view.showPopover();
 let dismissed=false,release;const cancelled=new Promise(resolve=>release=resolve);
 const dismiss=()=>{dismissed=true;view.classList.add('dice-page-leaving');release();};
 view.querySelector('button').onclick=dismiss;
 signal?.addEventListener('abort',dismiss,{once:true});
 const escape=event=>{if(event.key==='Escape')dismiss();};document.addEventListener('keydown',escape);
 status.textContent='Preparing dice…';
 try{
  if(!enginePromise)enginePromise=(async()=>{
   const {default:DiceBox}=await import(new URL('./dice-box/lib/dice-box.es.js',import.meta.url).href);
   engine=new DiceBox({container:'#cosmos-dice-stage',assetPath:'/assets/dice-box/',theme:'default',themeColor:'#c9b7ff',offscreen:false,scale:diceScale(),enableShadows:true,settleTimeout:4000});
   await engine.init();return engine;
  })();
  const box=await Promise.race([enginePromise,cancelled.then(()=>null),sleep(18000).then(()=>{throw Error('3D dice could not start.');})]);
  if(!box||dismissed)return;
  await box.updateConfig({theme:'cosmos-'+custom.shape+'-'+custom.material,themeColor:custom.color,scale:diceScale()});
  if(dismissed)return;
  box.show();status.textContent='Rolling…';
  let dice=notation||resultDice(result);
  if(!notation&&!dice.length){status.textContent=summary(result);await Promise.race([sleep(2400),cancelled]);return;}
  const rolls=await Promise.race([box.roll(dice),cancelled.then(()=>null),sleep(15000).then(()=>{throw Error('The dice took too long to settle.');})]);
  if(!rolls||dismissed)return;
  if(notation){const values=rolls.map(d=>d.value);status.textContent=values.join(' + ')+' = '+values.reduce((a,b)=>a+b,0);}
  else {const expected=dice.map(d=>d.data.targetValue),actual=[...rolls].sort((a,b)=>a.rollId-b.rollId).map(d=>d.value);if(expected.some((v,i)=>v!==actual[i]))throw Error('Showing the recorded result.');status.textContent=summary(result);}
  // Keep settled faces readable, then remove the whole toss automatically.
  await Promise.race([sleep(800),cancelled]);
 }catch(error){status.textContent=(result?summary(result)+' · ':'')+error.message;await Promise.race([sleep(3200),cancelled]);}
 finally{
  signal?.removeEventListener('abort',dismiss);document.removeEventListener('keydown',escape);view.classList.add('dice-page-leaving');await sleep(250);
  try{engine?.clear();engine?.hide();}catch{}
  if(view.hidePopover&&view.matches(':popover-open'))view.hidePopover();view.hidden=true;
 }
}
function diceScale(){return innerWidth<600?10:13;}
function summary(r){const attack=r.kind==='weapon'?r:r.attack;return [attack?'Attack: '+attack.total:'',r.damage?'Dice: '+r.damage.total:'',!attack&&!r.damage?'Total: '+r.total:'',r.critical?.threat?'Critical threat!':''].filter(Boolean).join(' · ');}
