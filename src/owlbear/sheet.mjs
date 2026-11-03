import {peer} from './rpc.mjs';
const nativeFetch=window.fetch.bind(window),nonce=location.hash.slice(1),controller=window.opener||parent;let connection,character;
const connected=new Promise(resolve=>{
 window.addEventListener('message',function receive(event){
  if(event.origin!==location.origin||event.source!==controller||event.data?.type!=='cosmos:sheet-port'||event.data.nonce!==nonce||!event.ports[0])return;
  connection=peer(event.ports[0],()=>{throw Error('Unsupported request.');});window.removeEventListener('message',receive);resolve();
 });
});
window.fetch=async(input,options={})=>{
 const url=new URL(typeof input==='string'?input:input.url,location.href);
 if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return nativeFetch(input,options);
 await connected;
 const method=options.method||'GET',body=options.body?JSON.parse(options.body):undefined;
 const result=await connection.call('api',{path:url.pathname+url.search,method,body},30000);
 if(result.data?.character)character=result.data.character;
 return new Response(JSON.stringify(result.data),{status:result.status,headers:{'Content-Type':'application/json'}});
};
document.addEventListener('click',event=>{
 const link=event.target.closest('a[href]');if(!link)return;const url=new URL(link.href);
 if(url.origin!==location.origin)return;
 event.preventDefault();
 if(url.pathname==='/characters.html'){controller.postMessage({type:'cosmos:back',nonce},location.origin);if(window.opener)window.close();}
 else window.open(url.href,'_blank','noopener');
},true);
controller.postMessage({type:'cosmos:sheet-ready',nonce},location.origin);
await connected;
await import(new URL('/assets/sheet-entry.mjs',location.origin).href);
window.addEventListener('pagehide',()=>connection?.close(),{once:true});
