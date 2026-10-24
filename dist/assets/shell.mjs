import { createRouter } from './router.mjs';
import { refreshSession, setSessionUser, sessionUser } from './session.mjs';
let cleanup=()=>{};
let routeGeneration=0;
const live=document.body.dataset.mode==='live';
async function mountPage() {
  const generation=++routeGeneration;
  if(live)setSessionUser(sessionUser);
  const id=document.body.dataset.page;
  if(id==='admin-groups'){const {mountGroups}=await import('./groups.mjs');if(generation===routeGeneration)cleanup=mountGroups({fixture:!live});}
  if(!live && id==='account'){const {mountAccount}=await import('../account/editor.mjs');if(generation===routeGeneration)cleanup=mountAccount({fixture:true});}
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
