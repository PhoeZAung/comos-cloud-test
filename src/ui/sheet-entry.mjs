// Fetch the character while the browser is still downloading the sheet
// module graph. Never persist private character data or share it across pages.
const firstId=new URL(location.href).searchParams.get('characterId');
const firstRequestControl=new AbortController();
const initialRequest=firstId&&/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(firstId)
 ?fetch('/api/v1/character-records/'+encodeURIComponent(firstId),{
   credentials:'same-origin',cache:'no-store',
   signal:AbortSignal.any([firstRequestControl.signal,AbortSignal.timeout(15000)])
  }).then(async response=>{
   const data=await response.json();
   if(!response.ok)throw Object.assign(Error(data.message||({
    401:'Sign in to open this sheet.',404:'Character unavailable.'
   })[response.status]||'Could not reach the character server.'),{status:response.status});
   if(data.character?.id!==firstId)throw Error('Character response does not match the open sheet.');
   return data;
  }).then(value=>({ok:true,value}),error=>({ok:false,error}))
 :null;
void import('./mobile-viewport.mjs').catch(()=>{});
// Load optional sheet modules behind an error boundary: a missing build asset
// must not leave the server-rendered loading animation running forever.
let dispose,disposeEffects,leaving=false;
window.addEventListener('pagehide',()=>{leaving=true;firstRequestControl.abort();dispose?.();disposeEffects?.();},{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
void import('./sheet.mjs').then(sheet=>{
 if(leaving)return;dispose=sheet.mountSheet({initialRequest});
 void import('./effects.mjs').then(module=>{if(!leaving)disposeEffects=module.setupEffects();}).catch(()=>{});
 // Preferences and session hydration must not delay mounting the actual sheet.
 void import('./preferences.mjs').then(prefs=>fetch('/api/v1/auth/session',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)}).then(async response=>{if(response.ok&&!leaving)prefs.applyPreferences((await response.json()).user?.preferences);})).catch(()=>{});
}).catch(()=>{
 if(leaving)return;const root=document.querySelector('main');if(!root)return;
 root.innerHTML='<section role="alert"><h1>Could not open the character sheet</h1><p>A sheet file could not load. Reload to try again.</p><button class="button" type="button" data-retry-sheet>Retry</button><a class="button" href="characters.html">Characters</a></section>';
 root.querySelector('[data-retry-sheet]').onclick=()=>location.reload();
});
document.addEventListener('click',event=>{
 const action=event.target.closest?.('[data-open-dice-themes]');if(!action)return;
 event.preventDefault();event.stopPropagation();
 void import('./dice-theme-picker.mjs').then(m=>m.openDiceThemes()).catch(()=>{action.textContent='Could not open dice themes. Try again.';});
},true);
