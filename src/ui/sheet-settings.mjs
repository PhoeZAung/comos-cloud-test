import {preferences,applyPreferences} from './preferences.mjs';
import {createAccountClient} from '../account/client.mjs';
import {mountAccount} from '../account/editor.mjs';
import {showDice} from './feedback.mjs';
export function mountSheetSettings(root){
 const panel=root.querySelector('[data-recovery-panel]'),control=new AbortController();let disposeAccount,closed=false,accountLoading=false,queue=Promise.resolve();
 const client=createAccountClient(),status=panel.querySelector('[data-dice-settings-status]');
 function paint(){
  const options=preferences.diceOptions;
  panel.querySelector('[data-setting-dice-popup]').checked=preferences.dicePopup;
  panel.querySelector('[data-setting-discord-stats]').checked=preferences.discordRollStats;
   panel.querySelector('[data-setting-notes-electric]').checked=preferences.notesElectricBorder;
  for(const key of ['nat20Effects','nat1Effects','critSound'])panel.querySelector('[data-dice-option='+key+']').checked=options[key];
  const volume=panel.querySelector('[data-dice-option=volume]');if(document.activeElement!==volume)volume.value=options.volume;
  panel.querySelector('[data-volume-label]').textContent=Math.round(Number(volume.value)*100)+'%';
  for(const node of panel.querySelectorAll('[data-sheet-theme]'))node.setAttribute('aria-pressed',String(node.dataset.sheetTheme===preferences.theme));
 }
 function choose(patch){
  applyPreferences({...preferences,...patch});status.textContent='Saving…';
  queue=queue.catch(()=>{}).then(async()=>{try{const user=await client.restore();await client.update({preferences:{...user.preferences,...patch}});if(!closed)status.textContent='Saved.';}catch(error){if(!closed)status.textContent=error.message||'Could not save settings.';}});
 }
 panel.addEventListener('click',async event=>{
  const tab=event.target.closest('[data-setting-tab]');if(tab){
   const name=tab.dataset.settingTab;for(const node of panel.querySelectorAll('[data-setting-tab]'))node.setAttribute('aria-selected',String(node===tab));for(const key of ['main','theme','site'])panel.querySelector('[data-settings-'+key+']').hidden=key!==name;
   if(name!=='site'){disposeAccount?.();disposeAccount=undefined;}
   if(name==='site'&&!disposeAccount&&!accountLoading){accountLoading=true;try{const user=await client.restore();if(!closed)disposeAccount=mountAccount({user});}catch(error){if(!closed)panel.querySelector('[data-site-settings-status]').textContent=error.message||'Sign in to load settings.';}finally{accountLoading=false;}}return;
  }
  const theme=event.target.closest('[data-sheet-theme]');if(theme){choose({theme:theme.dataset.sheetTheme});return;}
  const preview=event.target.closest('[data-preview-critical]');if(preview){const value=Number(preview.dataset.previewCritical);void showDice({kind:'check',total:value,breakdown:[{dice:'1d20',rolls:[value]}]},{preview:true});}
 },{signal:control.signal});
 panel.addEventListener('input',event=>{if(event.target.matches('[data-dice-option=volume]'))panel.querySelector('[data-volume-label]').textContent=Math.round(Number(event.target.value)*100)+'%';},{signal:control.signal});
 panel.addEventListener('change',event=>{
  const input=event.target;if(!input.matches('[data-setting-dice-popup],[data-dice-option],[data-setting-notes-electric],[data-setting-discord-stats]'))return;
  choose(input.matches('[data-setting-discord-stats]')?{discordRollStats:input.checked}:input.matches('[data-setting-notes-electric]')?{notesElectricBorder:input.checked}:input.matches('[data-setting-dice-popup]')?{dicePopup:input.checked}:{diceOptions:{...preferences.diceOptions,[input.dataset.diceOption]:input.type==='checkbox'?input.checked:input.type==='range'?Number(input.value):input.value}});
 },{signal:control.signal});
 document.addEventListener('comos:preferences',paint,{signal:control.signal});paint();
 return ()=>{closed=true;control.abort();disposeAccount?.();};
}
