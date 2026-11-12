const nonce=location.hash.slice(1),status=document.querySelector('[role=status]'),scope=new URL(location.href).searchParams.get('mode')==='party-status'?'party-status':'sheet';
let checking=false,lastChecked=0;
async function check(){
 if(checking||Date.now()-lastChecked<1500)return;
 checking=true;lastChecked=Date.now();
 try{
  if(!/^[a-f0-9]{64}$/.test(nonce)||!opener)throw Error('Open from the Owlbear extension.');
  const response=await fetch('/api/v1/owlbear/connect',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({scope})}),result=await response.json();
  if(!response.ok)throw Error(result.message||'Sign in to Cosmos, then try again.');
  opener.postMessage({type:'cosmos:connected',nonce,token:result.token},location.origin);status.textContent='Connected';
 }catch(error){status.textContent=error.message;}finally{checking=false;}
}
window.addEventListener('message',event=>{if(event.source===opener&&event.origin===location.origin&&event.data?.type==='cosmos:connected-ack'&&event.data.nonce===nonce)window.close();});
document.querySelector('[data-check-signin]').onclick=()=>void check();
window.addEventListener('focus',()=>void check());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check();});
void check();
