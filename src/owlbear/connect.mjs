import {peer} from './rpc.mjs';
const nonce=location.hash.slice(1),status=document.querySelector('[role=status]'),partyMode=new URL(location.href).searchParams.get('mode')==='party-status';
let connection,ready=false;
if(partyMode){document.querySelector('h1').textContent='Connect Cosmos Party Status';document.querySelector('.connect-note').textContent='Sign in with the Cosmos administrator account, then return here. Keep this window open to sync party cards. Only enabled character names, character portraits, HP, MP, and armor class are shared with the Owlbear room.';}
const api=async(path,options={})=>{
 const response=await fetch(path,{...options,credentials:'same-origin',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
 const data=await response.json();return {status:response.status,data};
};
async function owned(){
 const characters=[];let cursor='';
 do{const result=await api('/api/v1/my/characters'+(cursor?'?cursor='+encodeURIComponent(cursor):''));if(result.status!==200)throw Error('Sign in to Cosmos first.');characters.push(...result.data.characters);cursor=result.data.nextCursor||'';}while(cursor&&characters.length<1000);
 return characters;
}
async function check(){
 try{
  if(!/^[a-f0-9]{64}$/.test(nonce)||!window.opener)throw Error('Open this connection window from the Cosmos Owlbear extension.');
  const session=await api('/api/v1/auth/session');
  if(session.status!==200)throw Error('Sign in using the button below, then choose Check sign-in.');
  if(session.data.user?.profileState!=='complete')throw Error('Finish your Cosmos profile, then choose Check sign-in.');
  if(partyMode){const access=await api('/api/v1/access');if(access.status!==200||access.data.admin!==true)throw Error('Sign in with the Cosmos administrator account to share party status.');}
  status.textContent='Connected as '+session.data.user.displayName+'. Keep this window open while using your sheet in Owlbear.';
  ready=true;window.opener.postMessage({type:'cosmos:connect-ready',nonce},location.origin);
 }catch(error){status.textContent=error.message;}
}
window.addEventListener('message',event=>{
 if(!ready||event.origin!==location.origin||event.source!==window.opener||event.data?.type!=='cosmos:connect-port'||event.data.nonce!==nonce||!event.ports[0])return;
 connection?.close();
 connection=peer(event.ports[0],async(method,value)=>{
  if(partyMode){
   let path;
   if(method==='party-status')path='/api/v1/admin/owlbear-status';
   else if(method==='party-portrait'&&/^[0-9a-f-]{36}$/i.test(value?.id||''))path='/api/v1/admin/owlbear-portrait?characterId='+encodeURIComponent(value.id);
   else throw Error('This connection only shares enabled party status cards.');
   const result=await api(path);if(result.status!==200)throw Error(result.status===403?'Cosmos administrator access required.':result.status===404?'This character is no longer shared.':result.data.message||'Could not sync party status. Reconnect your Cosmos account.');return result.data;
  }
  if(method==='list')return owned();
  if(method!=='api'||!value||typeof value.path!=='string'||!['GET','POST'].includes(value.method))throw Error('Unsupported sheet request.');
  const url=new URL(value.path,location.origin);if(url.origin!==location.origin)throw Error('Invalid request origin.');
  const record=/^\/api\/v1\/character-records\/([0-9a-f-]{36})$/i.exec(url.pathname);
  if(record){
   const characters=await owned();if(!characters.some(c=>c.id===record[1]))throw Error('This character does not belong to your Cosmos account.');
   if([...url.searchParams.keys()].some(k=>k!=='revision'))throw Error('Unsupported sheet query.');
   if(value.method==='POST'&&!['sheet','roll'].includes(value.body?.op))throw Error('Use the Cosmos website for this action.');
  }else if(url.pathname==='/api/v1/auth/session'&&value.method==='GET'&&!url.search){}
  else if(url.pathname==='/api/v1/account'&&!url.search){
   if(value.method==='POST'&&(!value.body||Object.keys(value.body).some(k=>!['revision','preferences'].includes(k))||!value.body.preferences))throw Error('Only dice/account preferences can be changed here.');
  }else throw Error('This API is not available inside Owlbear.');
  const result=await api(url.pathname+url.search,{method:value.method,...(value.method==='POST'?{headers:{'Content-Type':'application/json'},body:JSON.stringify(value.body)}:{})});
  if(result.data&&typeof result.data==='object')result.data.admin=false;
  return result;
 });
});
document.querySelector('[data-check-signin]').onclick=()=>void check();
window.addEventListener('pagehide',()=>connection?.close(),{once:true});
void check();
