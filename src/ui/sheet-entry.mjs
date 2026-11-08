void import('./mobile-viewport.mjs').catch(()=>{});
// Load optional sheet modules behind an error boundary: a missing build asset
// must not leave the server-rendered loading animation running forever.
let dispose,disposeEffects,leaving=false;
window.addEventListener('pagehide',()=>{leaving=true;dispose?.();disposeEffects?.();},{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
void Promise.all([import('./sheet.mjs'),import('./preferences.mjs')]).then(([sheet,prefs])=>{
 if(leaving)return;dispose=sheet.mountSheet();
 void import('./effects.mjs').then(module=>{if(!leaving)disposeEffects=module.setupEffects();}).catch(()=>{});
 void fetch('/api/v1/auth/session',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)}).then(async response=>{if(response.ok&&!leaving)prefs.applyPreferences((await response.json()).user?.preferences);}).catch(()=>{});
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
