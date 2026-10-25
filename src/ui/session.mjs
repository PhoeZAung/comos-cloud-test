import {applyPreferences,defaults} from './preferences.mjs';
// Header state is presentation only; the API remains the authorization boundary.
export let sessionUser = null;
let pending;
let accessUserId=null,accessGeneration=0,adminAccess=false;
function showAdmin(){for(const link of document.querySelectorAll('[data-admin-entry]'))link.hidden=!adminAccess;}
function refreshAccess(user){
 const id=user?.id||null;if(accessUserId===id){showAdmin();return;}
 accessUserId=id;adminAccess=false;showAdmin();const generation=++accessGeneration;
 if(!id)return;
 void fetch('/api/v1/access',{credentials:'same-origin',cache:'no-store'}).then(async response=>{
  if(!response.ok)return;const access=await response.json();if(generation!==accessGeneration)return;adminAccess=access.admin===true;showAdmin();
 }).catch(()=>{});
}
export function setSessionUser(user,{applyTheme=true}={}) {
  sessionUser = user || null;
  refreshAccess(sessionUser);
  if(applyTheme)applyPreferences(user?.preferences||defaults);
  for(const link of document.querySelectorAll('.account')){
    let image=link.querySelector('img');const svg=link.querySelector('svg');
    if(user?.avatarMediaId){if(!image){image=document.createElement('img');image.alt='';image.width=32;image.height=32;link.prepend(image);}image.src='/api/v1/account/avatar?v='+encodeURIComponent(user.avatarMediaId);if(svg)svg.setAttribute('hidden','');}
    else{image?.remove();if(svg)svg.removeAttribute('hidden');}
  }
  for (const entry of document.querySelectorAll('[data-public-entry]')) entry.hidden = Boolean(user);
  for (const account of document.querySelectorAll('[data-public-account]')) account.hidden = !user;
  for (const action of document.querySelectorAll('[data-signed-out-only]')) action.hidden = Boolean(user);
}
export async function refreshSession() {
  if (document.body.dataset.mode !== 'live') return null;
  if (pending) return pending;
  pending = (async () => {
    try {
      const response = await fetch('/api/v1/auth/session', { credentials:'same-origin', cache:'no-store', headers:{Accept:'application/json'} });
      if (response.status === 401) { setSessionUser(null); return null; }
      if (!response.ok) return sessionUser;
      const result = await response.json(); setSessionUser(result.user); return sessionUser;
    } catch { return sessionUser; }
    finally { pending = null; }
  })();
  return pending;
}
