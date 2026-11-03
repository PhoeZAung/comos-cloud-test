import {createHash,randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {statusRoster,characterPortrait} from './owlbear-status.mjs';
// Only the administrator-published Party projection is public. No sessions,
// full sheets, account profiles or write methods are exposed by these routes.
export function createPublicPartyRoutes(db){
 const epoch=randomUUID(),base='/api/v1/owlbear/party',clients=new Set(),images=new Map();let timer,lastRead=0,signature='',characters=[],lastHeartbeat=0,version=0;
 const snapshot=()=>({publisher:'cosmos-public-party',epoch,version,updatedAt:Date.now(),characters});
 function emit(client,value){if(client.res.destroyed||client.res.writableEnded||client.res.writableLength>262144){client.close();return;}client.res.write('data: '+JSON.stringify(value)+'\n\n');}
 function read(force=false){
  if(force||Date.now()-lastRead>500){const next=statusRoster(db),key=JSON.stringify(next),changed=key!==signature;if(changed)version++;characters=next;signature=key;lastRead=Date.now();
   if(changed||Date.now()-lastHeartbeat>15000){const value=snapshot();for(const client of clients)emit(client,value);lastHeartbeat=Date.now();}
  }
  return snapshot();
 }
 function refresh(){try{read(true);}catch{for(const client of clients)client.close();}}
 const route=async(req,res,path,send)=>{
  if(path!==base&&path!==base+'/events'&&!path.startsWith(base+'/portrait/'))return false;
  res.setHeader('Access-Control-Allow-Origin','*');
  if(!['GET','HEAD'].includes(req.method)||path.endsWith('/events')&&req.method!=='GET'){send(405,{error:'method_not_allowed'});return true;}
  try{
   if(path===base){send(200,read());return true;}
   if(path===base+'/events'){
    if(clients.size>=256){send(503,{error:'party_busy'});return true;}
    const value=read();res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no','X-Content-Type-Options':'nosniff'});
    res.write('retry: 1000\n\n');let expiry,ended=false;
    const client={res,close(){if(ended)return;ended=true;clearTimeout(expiry);clients.delete(client);if(!clients.size){clearInterval(timer);timer=null;}res.end();}};
    clients.add(client);res.on('close',client.close);res.on('error',client.close);expiry=setTimeout(client.close,600000);expiry.unref?.();emit(client,value);
    if(!timer){timer=setInterval(refresh,1000);timer.unref?.();}return true;
   }
   const id=path.slice((base+'/portrait/').length);if(!/^[0-9a-f-]{36}$/i.test(id)){send(404,{error:'not_found'});return true;}
   const row=db.prepare('SELECT d.data_json FROM characters c JOIN character_details d ON d.character_id=c.id WHERE c.id=? AND c.archived=0').get(id),data=row?JSON.parse(row.data_json):null;
   const portrait=data?.owlbearStatusVisible===true?characterPortrait(data):'';
   const hash=portrait?createHash('sha256').update(portrait).digest('hex'):'';
   if(!portrait||new URL(req.url,'http://localhost').searchParams.get('v')!==hash){send(404,{error:'not_found'});return true;}
   if(!images.has(hash)){
    if(images.size>=80)images.delete(images.keys().next().value);
    const image=sharp(Buffer.from(portrait.slice(portrait.indexOf(',')+1),'base64'),{limitInputPixels:16000000}).rotate().resize(80,80,{fit:'cover'}).jpeg({quality:70}).toBuffer();images.set(hash,image);image.catch(()=>{});
   }
   const bytes=await images.get(hash);res.writeHead(200,{'Content-Type':'image/jpeg','Content-Length':bytes.length,'Cache-Control':'private, max-age=300','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{if(res.headersSent)res.end();else send(503,{error:'party_unavailable'});}
  return true;
 };
 route.refresh=refresh;return route;
}
