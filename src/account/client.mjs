export function createAccountClient({request=fetch,onUser=()=>{},user=null}={}) {
 let current=user,queue=Promise.resolve();
 const error=(code,message)=>Object.assign(new Error(message),{code});
 async function api(method='GET',data,avatar=false,revision=current?.revision) {
  const response=await request('/api/v1/account'+(avatar?'/avatar':''),{method,credentials:'same-origin',cache:'no-store',headers:avatar?{'Content-Type':data?.type||'application/octet-stream','If-Match':String(revision)}:{'Content-Type':'application/json'},...(data===undefined?{}:{body:avatar?data:JSON.stringify(data)})});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw error(response.status===409?'conflict':response.status===401?'signed-out':response.status===429?'rate-limit':response.status===400||response.status===413?'invalid':'network',result.message||'');
  current=result.user;onUser(current);return current;
 }
 function enqueue(action){const pending=queue.catch(()=>{}).then(action);queue=pending;return pending;}
 return {
  get user(){return current;},
  restore:()=>enqueue(()=>api()),
  update:patch=>enqueue(()=>api('POST',{...patch,revision:current.revision})),
  avatar:file=>enqueue(()=>api('POST',file,true)),
  removeAvatar:()=>enqueue(()=>api('DELETE',undefined,true))
 };
}
