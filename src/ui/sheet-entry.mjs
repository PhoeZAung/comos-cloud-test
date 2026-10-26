// The embedded/standalone sheet does not initialize the main app, effects or SDKs.
import {mountSheet} from './sheet.mjs';
import {applyPreferences} from './preferences.mjs';
const dispose=mountSheet();
void fetch('/api/v1/auth/session',{credentials:'same-origin',cache:'no-store'}).then(async response=>{if(response.ok)applyPreferences((await response.json()).user?.preferences);}).catch(()=>{});
window.addEventListener('pagehide',dispose,{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
