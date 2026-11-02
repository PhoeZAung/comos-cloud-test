export function peer(port,handle){
 const waiting=new Map();let closed=false;
 port.onmessage=async({data})=>{
  if(!data||typeof data.id!=='string')return;
  if(data.reply){const item=waiting.get(data.id);if(!item)return;waiting.delete(data.id);clearTimeout(item.timer);data.error?item.reject(Error(data.error)):item.resolve(data.value);return;}
  try{const value=await handle(data.method,data.value);if(!closed)port.postMessage({id:data.id,reply:true,value});}
  catch(error){if(!closed)port.postMessage({id:data.id,reply:true,error:error.message||'Connection failed.'});}
 };
 port.start();
 return {
  call(method,value,timeout=30000){
   if(closed)return Promise.reject(Error('Connection closed. Reconnect to Cosmos.'));
   const id=crypto.randomUUID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(id);reject(Error('Connection timed out. Keep the Cosmos sign-in window open.'));},timeout);waiting.set(id,{resolve,reject,timer});port.postMessage({id,method,value});});
  },
  close(){closed=true;port.close();for(const item of waiting.values()){clearTimeout(item.timer);item.reject(Error('Connection closed.'));}waiting.clear();}
 };
}
