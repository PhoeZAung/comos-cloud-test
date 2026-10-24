import {createAccountClient} from './client.mjs';
import {applyPreferences,preferences} from '../ui/preferences.mjs';
let fixtureAccount={displayName:'Preview explorer',preferences:{theme:'cosmic',splashCursor:false,effectColors:true}};
export function mountAccount({user=null,fixture=false,onUser=()=>{}}={}) {
 if(fixture)user=fixtureAccount;
 const root=document.querySelector('[data-account-editor]');if(!root)return ()=>{};
 const controller=new AbortController(),signal=controller.signal;
 let disposed=false,previewURL,latestPreferences={...preferences},settingsDirty=false,settingsRunning=false;
 const name=root.querySelector('[data-account-name]'),profileStatus=root.querySelector('[data-profile-status]'),prefStatus=root.querySelector('[data-preferences-status]'),retry=root.querySelector('[data-settings-retry]');
 const photo=root.querySelector('[data-avatar-preview]'),placeholder=root.querySelector('[data-avatar-placeholder]'),remove=root.querySelector('[data-avatar-remove]'),fileInput=root.querySelector('[data-avatar-file]');
 const splash=root.querySelector('[data-splash-toggle]'),colors=root.querySelector('[data-effect-colors]');
 const say=(element,text)=>{if(!disposed)element.textContent=text;};
 const describe=error=>error.code==='conflict'?'Changed in another session. Your edits are not saved. Refresh and try again.':error.code==='signed-out'?'Your session expired. Sign in again to save.':error.code==='rate-limit'?'Too many changes. Wait a minute, then retry.':error.message||'Could not save. Check your connection and retry.';
 const client=fixture?null:createAccountClient({user,onUser:next=>{user=next;onUser(next,{applyTheme:disposed});}});
 function syncChoices(){
  for(const button of root.querySelectorAll('[data-theme-choice]'))button.setAttribute('aria-pressed',String(button.dataset.themeChoice===latestPreferences.theme));
  splash.checked=latestPreferences.splashCursor;colors.checked=latestPreferences.effectColors;
 }
 function syncPhoto(){
  if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null;}
  const present=Boolean(user?.avatarMediaId);
  photo.hidden=!present;placeholder.hidden=present;remove.hidden=!present;
  if(present)photo.src='/api/v1/account/avatar?v='+encodeURIComponent(user.avatarMediaId);else photo.removeAttribute('src');
 }
 async function savePreferences(){
  if(settingsRunning||disposed)return;
  settingsRunning=true;retry.hidden=true;
  while(settingsDirty){
   settingsDirty=false;const snapshot={...latestPreferences};say(prefStatus,fixture?'Preview updated.':'Saving…');
   try{if(!fixture)await client.update({preferences:snapshot});if(!settingsDirty)say(prefStatus,fixture?'Preview updated.':'Saved.');}
   catch(error){settingsDirty=true;say(prefStatus,describe(error));retry.hidden=false;break;}
  }
  settingsRunning=false;
 }
 const choose=patch=>{latestPreferences={...latestPreferences,...patch};applyPreferences(latestPreferences);syncChoices();if(fixture){user.preferences={...latestPreferences};fixtureAccount=user;}settingsDirty=true;void savePreferences();};
 for(const button of root.querySelectorAll('[data-theme-choice]'))button.addEventListener('click',()=>choose({theme:button.dataset.themeChoice}),{signal});
 splash.addEventListener('change',()=>choose({splashCursor:splash.checked}),{signal});colors.addEventListener('change',()=>choose({effectColors:colors.checked}),{signal});retry.addEventListener('click',()=>void savePreferences(),{signal});
 name.addEventListener('blur',async()=>{
  const value=name.value.trim();if(value===user?.displayName)return;
  if(!value||value.length>80||/[\u0000-\u001f\u007f]/u.test(value)){say(profileStatus,'Enter a display name of 1–80 characters.');name.setAttribute('aria-invalid','true');return;}
  say(profileStatus,fixture?'Preview updated.':'Saving name…');name.setAttribute('aria-invalid','false');
  try{if(!fixture)await client.update({displayName:value});else {user={...user,displayName:value};fixtureAccount=user;}say(profileStatus,fixture?'Preview updated.':'Name saved.');}catch(error){say(profileStatus,describe(error));}
 },{signal});
 fileInput.addEventListener('change',async()=>{
  const file=fileInput.files?.[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>3*1024*1024){say(profileStatus,'Choose a JPEG, PNG or WebP up to 3 MB.');fileInput.value='';return;}
  if(previewURL)URL.revokeObjectURL(previewURL);previewURL=URL.createObjectURL(file);photo.src=previewURL;photo.hidden=false;placeholder.hidden=true;
  if(fixture){say(profileStatus,'Photo preview updated.');return;}
  fileInput.disabled=true;remove.disabled=true;say(profileStatus,'Uploading photo…');
  try{await client.avatar(file);if(!disposed){syncPhoto();say(profileStatus,'Photo saved.');}}catch(error){say(profileStatus,describe(error));if(!disposed)syncPhoto();}
  finally{if(!disposed){fileInput.disabled=false;remove.disabled=false;fileInput.value='';}}
 },{signal});
 remove.addEventListener('click',async()=>{
  remove.disabled=true;say(profileStatus,'Removing photo…');
  try{await client.removeAvatar();if(!disposed){syncPhoto();say(profileStatus,'Photo removed.');}}catch(error){say(profileStatus,describe(error));}
  finally{if(!disposed)remove.disabled=false;}
 },{signal});
 document.addEventListener('comos:effects',event=>{const note=root.querySelector('[data-effect-availability]');note.textContent=latestPreferences.splashCursor?(event.detail.reduced?'Splash is paused by your reduced-motion setting.':event.detail.splashAvailable?'':'Splash is unavailable in this browser.') : '';},{signal});
 root.hidden=false;name.value=user?.displayName||'';latestPreferences={...(user?.preferences||preferences)};applyPreferences(latestPreferences);syncChoices();syncPhoto();
 return ()=>{disposed=true;controller.abort();if(previewURL)URL.revokeObjectURL(previewURL);};
}
