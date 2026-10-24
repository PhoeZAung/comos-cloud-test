export function setupInstall() {
  const button=document.querySelector('[data-install]');
  const help=document.querySelector('[data-install-help]');
  let prompt;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
  button.hidden=standalone();
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;button.hidden=standalone();});
  window.addEventListener('appinstalled',()=>{prompt=null;button.hidden=true;help.close();});
  matchMedia('(display-mode: standalone)').addEventListener('change',()=>{button.hidden=standalone();});
  button.addEventListener('click',async()=>{
    if(!prompt){help.showModal();return;}
    const current=prompt;prompt=null;
    try { await current.prompt(); const choice=await current.userChoice; if(choice.outcome==='accepted')button.hidden=true; }
    catch {help.showModal();}
  });
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
}
