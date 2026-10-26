import { createRouter } from './router.mjs';
import { refreshSession, setSessionUser, sessionUser } from './session.mjs';
let cleanup=()=>{};
let routeGeneration=0;
const live=document.body.dataset.mode==='live';
async function mountPage() {
  const generation=++routeGeneration;
  if(live)setSessionUser(sessionUser);
  const id=document.body.dataset.page;
  if(id==='characters'){const {mountCharacterLibrary}=await import('./character-library.mjs');if(generation===routeGeneration)cleanup=mountCharacterLibrary({fixture:!live});}
  if(id==='lore'){const {mountLore}=await import('./lore.mjs');if(generation===routeGeneration)cleanup=mountLore({fixture:!live});}
  if(id==='lore-compose'){const {mountLoreCompose}=await import('./lore-compose.mjs');if(generation===routeGeneration)cleanup=mountLoreCompose({fixture:!live});}
  if(id==='lore-entry'){const {mountLoreEntry}=await import('./lore-entry.mjs');if(generation===routeGeneration)cleanup=mountLoreEntry({fixture:!live});}
  if(live&&id==='home'){const {mountFeed}=await import('./feed.mjs');if(generation===routeGeneration)cleanup=mountFeed();}
  if(id==='post'){const {mountPostThread}=await import('./post-thread.mjs');if(generation===routeGeneration)cleanup=mountPostThread({fixture:!live});}
  if(id==='compose'){const {mountCompose}=await import('./compose.mjs');if(generation===routeGeneration)cleanup=mountCompose({fixture:!live});}
  if(id==='admin-items'){const {mountItems}=await import('./items.mjs');if(generation===routeGeneration)cleanup=mountItems({fixture:!live});}
  if(id==='admin-tags'){const {mountTags}=await import('./directory.mjs');if(generation===routeGeneration)cleanup=mountTags();}
  if(id.startsWith('sheet')){const {mountSheet}=await import('./sheet.mjs');if(generation===routeGeneration)cleanup=mountSheet();}
  if(id.startsWith('create-')){const {mountCharacterView}=await import('./character-view.mjs');if(generation===routeGeneration)cleanup=mountCharacterView();}
  if(id==='admin'){const {mountCharacterAdmin}=await import('./directory.mjs');if(generation===routeGeneration)cleanup=mountCharacterAdmin({fixture:!live});}
  if(id==='admin-groups'){const {mountGroups}=await import('./groups.mjs');if(generation===routeGeneration)cleanup=mountGroups({fixture:!live});}

  if(live && ['signin','signup','account'].includes(id)) {
    const {mountAuth}=await import('./auth.js');
    if(generation!==routeGeneration)return;
    cleanup=mountAuth({onUser:setSessionUser});
  }
}
if(document.body.dataset.layout!=='sheet')createRouter({afterRender:mountPage,disposePage:()=>{routeGeneration++;cleanup();cleanup=()=>{};}});
void mountPage();
if(live){void refreshSession();void import('./install.mjs').then(m=>m.setupInstall());}
void import('./effects.mjs').then(m=>m.setupEffects());
