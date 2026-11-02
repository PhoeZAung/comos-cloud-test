import {diceThemes} from '../features/dice-themes.mjs';
import {preferences,applyPreferences} from './preferences.mjs';
import {createAccountClient} from '../account/client.mjs';
export async function openDiceThemes({onChoose}={}){
 const existing=document.querySelector('[data-dice-theme-dialog]');if(existing){if(!existing.open)existing.showModal();return;}
 const dialog=document.createElement('dialog');dialog.dataset.diceThemeDialog='';dialog.className='dice-theme-dialog';dialog.setAttribute('aria-label','Dice themes');
 dialog.innerHTML='<header><div><p class="dice-eyebrow">MAKE EVERY ROLL YOURS</p><h2>Dice theme</h2></div><button type="button" class="button" data-close-dice aria-label="Close dice themes">×</button></header><p>Choose your dice. Every 3D set uses the original models and textures.</p><p class="dice-picker-status" role="status" aria-live="polite"></p><div class="dice-theme-grid">'+diceThemes.map(t=>'<button type="button" class="dice-theme-card" data-dice-choice="'+t.id+'" aria-pressed="'+(preferences.diceTheme===t.id)+'"><span class="dice-theme-art">'+(t.texture?'<img class="dice-theme-texture" src="'+t.texture+'" alt="" loading="lazy">':'')+'<svg viewBox="0 0 100 110" aria-hidden="true" class="dice-swatch dice-swatch-'+t.id+'"><path d="M50 3 95 28v54l-45 25L5 82V28Z M50 3 25 70 95 28 M5 28l70 42-25 37 M5 82l20-12h50l20 12 M50 3l25 67"/><text x="50" y="59">20</text></svg></span><strong>'+t.name+'</strong><small>'+t.description+'</small><span class="dice-theme-selected">Selected</span></button>').join('')+'</div><footer><label>Preview roll <select data-preview-die><option>2d6</option><option>1d20</option><option>1d4</option><option>1d8</option><option>1d10</option><option>1d12</option><option>1d100</option></select></label><button type="button" class="button" data-preview-roll>Roll on page</button></footer>';
 document.body.append(dialog);dialog.showModal();let saves=Promise.resolve(),version=0;
 const close=()=>{dialog.close();dialog.remove();};dialog.querySelector('[data-close-dice]').onclick=close;dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('click',event=>{
  const button=event.target.closest('[data-dice-choice]');if(!button)return;
  event.preventDefault();const id=button.dataset.diceChoice,patch={diceTheme:id},ticket=++version;
  applyPreferences({...preferences,...patch});
  for(const card of dialog.querySelectorAll('[data-dice-choice]'))card.setAttribute('aria-pressed',String(card===button));
  const status=dialog.querySelector('[role=status]');status.textContent='Selected '+diceThemes.find(t=>t.id===id).name+' · Saving…';
  saves=saves.catch(()=>{}).then(async()=>{
   try{
    if(onChoose)await onChoose(patch);
    else {const client=createAccountClient({request:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(10000)})});const user=await client.restore();await client.update({preferences:{...user.preferences,...patch}});}
    if(ticket===version)status.textContent='Saved.';
   }catch{if(ticket===version)status.textContent='Selected for this page. Could not save to your account; click the theme to retry.';}
  });
 });
 dialog.querySelector('[data-preview-roll]').onclick=async()=>{
  const theme=preferences.diceTheme,notation=dialog.querySelector('select').value;
  if(theme==='classic'){
   const [qty,sides]=notation.split('d').map(Number),values=Array.from({length:qty},()=>1+Math.floor(crypto.getRandomValues(new Uint32Array(1))[0]/4294967296*sides));
   dialog.querySelector('[role=status]').textContent='Classic: '+values.join(' + ')+' = '+values.reduce((a,b)=>a+b,0);return;
  }
  close();const {show3DDice}=await import('./dice-3d.mjs');
  void show3DDice(null,{theme,notation:theme==='genesys'?[{qty:1,sides:'ability'},{qty:1,sides:'proficiency'},{qty:1,sides:'boost'}]:notation});
 };
}
