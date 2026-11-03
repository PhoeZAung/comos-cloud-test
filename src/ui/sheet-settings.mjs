import {preferences,applyPreferences} from './preferences.mjs';
import {createAccountClient} from '../account/client.mjs';
import {mountAccount} from '../account/editor.mjs';
import {showCritical} from './critical-fx.mjs';
export function mountSheetSettings(root){
 const panel=root.querySelector('[data-recovery-panel]'),control=new AbortController();let disposeAccount,closed=false,accountLoading=false;
 const client=createAccountClient(),status=panel.querySelector('[data-dice-settings-status]');let queue=Promise.resolve();
 const options=preferences.diceOptions;
 panel.querySelector('[data-setting-dice-popup]').checked=preferences.dicePopup;
 for(const key of ['critEffects','critSound'])panel.querySelector('[data-dice-option='+key+']').checked=options[key];
 panel.querySelector('[data-dice-option=critStyle]').value=options.critStyle;
 panel.querySelector('[data-dice-option=volume]').value=options.volume;
 panel.addEventListener('click',async event=>{
  const tab=event.target.closest('[data-setting-tab]');if(tab){const site=tab.dataset.settingTab==='site';for(const node of panel.querySelectorAll('[data-setting-tab]'))node.setAttribute('aria-selected',String(node===tab));panel.querySelector('[data-settings-main]').hidden=site;panel.querySelector('[data-settings-site]').hidden=!site;
   if(!site){disposeAccount?.();disposeAccount=undefined;}
   if(site&&!disposeAccount&&!accountLoading){accountLoading=true;try{const user=await client.restore();if(!closed)disposeAccount=mountAccount({user});}catch(error){if(!closed)panel.querySelector('[data-site-settings-status]').textContent=error.message||'Sign in to load account settings.';}finally{accountLoading=false;}}return;
  }
  const preview=event.target.closest('[data-preview-critical]');if(preview)void showCritical(Number(preview.dataset.previewCritical),{preview:true});
 },{signal:control.signal});
 panel.addEventListener('change',event=>{
  const input=event.target;if(!input.matches('[data-setting-dice-popup],[data-dice-option]'))return;
  const patch=input.matches('[data-setting-dice-popup]')?{dicePopup:input.checked}:{diceOptions:{...preferences.diceOptions,[input.dataset.diceOption]:input.type==='checkbox'?input.checked:input.type==='range'?Number(input.value):input.value}};
  applyPreferences({...preferences,...patch});status.textContent='Saving…';queue=queue.catch(()=>{}).then(async()=>{try{const user=await client.restore(),snapshot={...user.preferences,...patch};await client.update({preferences:snapshot});if(!closed)status.textContent='Saved.';}catch(error){if(!closed)status.textContent=error.message||'Could not save settings.';}});
 },{signal:control.signal});
 return ()=>{closed=true;control.abort();disposeAccount?.();};
}
