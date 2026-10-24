import { createFirebaseClient } from './firebase.mjs';
import { createAuthService } from './service.mjs';
import { validateAuth, validateProfile, authMessage } from './validation.mjs';

// Replaced at build time with an allowlisted public configuration. No server credentials.
const config = COMOS_PUBLIC_AUTH;
const pageStatus = document.querySelector('[data-page-status]');
const retry = document.querySelector('[data-retry]');
let service, currentUser = null, busy = false;
const message = (element, text) => { if (element) element.textContent = text; };
function available() {
  for (const button of document.querySelectorAll('[type="submit"], .google-button, [data-signout]')) button.disabled = busy || !service;
}
function showUser(user, navigate = false) {
  currentUser = user;
  const entry = document.querySelector('[data-entry]');
  if (entry) entry.hidden = Boolean(user);
  const profile = document.querySelector('[data-profile]');
  if (profile) profile.hidden = !user || user.profileState === 'complete';
  const session = document.querySelector('[data-session]');
  if (session) session.hidden = !user;
  const name = document.querySelector('[data-session-name]');
  message(name, user ? (user.displayName ? `Signed in as ${user.displayName}` : 'Signed in. Finish your profile to continue.') : '');
  const next = document.querySelector('[data-continue]');
  if (next) next.hidden = user?.profileState !== 'complete';
  const input = document.querySelector('[name="displayName"]');
  if (input && user && !input.value) input.value = user.displayName;
  if (navigate && user?.profileState === 'complete') location.assign('home.html');
  else if (navigate && input) input.focus();
}
async function operation(action, status = pageStatus) {
  if (busy || !service) return;
  busy = true;available();message(status,'Please wait…');
  try { await action(); }
  catch (error) {
    message(status, authMessage(error));
    if (error?.code === 'session/required') { showUser(null); message(pageStatus, authMessage(error)); }
  } finally { busy = false;available(); }
}
for (const form of document.querySelectorAll('[data-auth-form]')) {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const kind = form.dataset.authForm, values = Object.fromEntries(new FormData(form));
    const errors = kind === 'profile' ? validateProfile(values) : validateAuth(kind,values);
    let first;
    for (const input of form.querySelectorAll('input')) {
      const error = errors[input.name] || '';
      message(document.getElementById(input.id+'-error'),error);
      input.setAttribute('aria-invalid',String(Boolean(error)));
      if (error && !first) first=input;
    }
    if (first) { first.focus();return; }
    const status=form.querySelector('.auth-status');
    void operation(async()=>{
      if (kind==='reset') { message(status,(await service.reset(values.email)).message);return; }
      if (kind==='profile') {
        if (!currentUser) throw Object.assign(new Error(),{code:'session/required'});
        const result=await service.completeProfile(values.displayName,currentUser.revision);
        message(status,'Profile saved.');showUser(result.user,true);return;
      }
      try {
        const result=await service.signIn(kind,values);
        message(status,'Signed in.');showUser(result.user,true);
      } catch(error) {
        if(kind==='signup' && (error.accountCreated || ['session/unavailable','session/required'].includes(error.code))) {
          message(status,'Your account may already be created. Sign in with the same email and password to resume setup.');return;
        }
        throw error;
      } finally { for(const input of form.querySelectorAll('input[type="password"], input[name="password"], input[name="confirm"]')) input.value=''; }
    },status);
  });
}
for(const button of document.querySelectorAll('.show-password'))button.addEventListener('click',()=>{
  const input=document.getElementById(button.getAttribute('aria-controls')),show=input.type==='password';
  input.type=show?'text':'password';button.textContent=show?'Hide':'Show';button.setAttribute('aria-pressed',String(show));
});
document.querySelector('.google-button')?.addEventListener('click',()=>void operation(async()=>{
  const result=await service.signIn('google');message(pageStatus,'Signed in.');showUser(result.user,true);
}));
document.querySelector('[data-signout]')?.addEventListener('click',()=>void operation(async()=>{
  await service.signOut();showUser(null);location.assign('signin.html');
},document.querySelector('[data-session-status]')));
async function restore() {
  if (busy) return;
  busy=true;available();retry.hidden=true;message(pageStatus,'Checking your session…');
  try {
    if(location.origin!==config.origin)throw Object.assign(new Error(),{code:'session/unavailable'});
    if(!service)service=createAuthService({provider:await createFirebaseClient(config.firebase),origin:config.origin});
    const result=await service.restore();showUser(result.user);message(pageStatus,'');
  }catch(error){
    if(error.code==='session/required'){showUser(null);message(pageStatus,'');}
    else{message(pageStatus,authMessage(error));retry.hidden=false;}
  }finally{busy=false;available();}
}
retry?.addEventListener('click',()=>void restore());
void restore();
