export function setupInstall() {
 let prompt=null;
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const update=()=>{for(const button of document.querySelectorAll('[data-install]'))button.hidden=standalone()||!(prompt||document.body.dataset.page==='account');};
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;update();});
 window.addEventListener('appinstalled',()=>{prompt=null;update();document.querySelector('[data-install-help]')?.close();});
 matchMedia('(display-mode: standalone)').addEventListener('change',update);
 document.addEventListener('comos:route',update);
 document.addEventListener('click',async event=>{
  if(!event.target.closest('[data-install]'))return;
  const help=document.querySelector('[data-install-help]');
  if(!prompt){help?.showModal();return;}
  const current=prompt;prompt=null;
  try{await current.prompt();const choice=await current.userChoice;if(choice.outcome!=='accepted')help?.showModal();}catch{help?.showModal();}finally{update();}
 });
 update();if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
}
