export function connection(token){
 let closed=false;
 async function request(method,value){
  if(closed)throw Error('Reconnect Cosmos.');
  const response=await fetch('/api/v1/owlbear/request',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({method,value}),signal:AbortSignal.timeout(30000)}),result=await response.json();
  if(!response.ok)throw Error(result.message||'Reconnect Cosmos.');return result;
 }
 return {async call(method,value){
  if(['list','npc-list'].includes(method)){const rows=[];let cursor='';do{const page=await request(method,{cursor});if(page.status!==200)throw Error('Reconnect Cosmos.');rows.push(...page.data.characters);cursor=page.data.nextCursor;}while(cursor);return rows;}
  const result=await request(method,value);if(method!=='api'&&result.status>=400)throw Error(result.data?.message||'Reconnect Cosmos.');return method==='api'?result:result.data;
 },close(){closed=true;token='';}};
}
