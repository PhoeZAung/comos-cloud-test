import {randomBytes} from 'node:crypto';
import {Readable} from 'node:stream';
import {adminSession,adminJson} from './admin-requests.mjs';
// Session credentials remain on the server. Grants are scoped, memory-only and
// disappear on server restart; every use revalidates the original login session.
export function createOwlbearRoutes({db,sessions,adminUids,origin,handlers}){
 const grants=new Map(),admins=new Set(adminUids);
 return async(req,res,path,send)=>{
  if(!['/api/v1/owlbear/connect','/api/v1/owlbear/request'].includes(path))return false;
  if(req.method!=='POST'){send(405,{error:'method_not_allowed'});return true;}
  if(req.headers.origin!==origin){send(403,{error:'origin_not_allowed'});return true;}
  try{
   for(const [key,value] of grants)if(value.expires<Date.now())grants.delete(key);
   const body=await adminJson(req,240000);
   if(path.endsWith('/connect')){
    const session=await adminSession(req,sessions,admins);
    if(!session){send(401,{message:'Sign in to Cosmos first.'});return true;}
    if(!['sheet','party-status'].includes(body.scope)||body.scope==='party-status'&&!session.admin){send(403,{message:'Administrator access required.'});return true;}
    if(grants.size>=1000){send(429,{message:'Too many extension connections.'});return true;}
    const token=randomBytes(32).toString('hex'),expires=Date.now()+8*3600000;
    const cookie=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('__Host-comos_session='));
    grants.set(token,{cookie,expires,scope:body.scope,userId:session.user.id});send(200,{token,expires});return true;
   }
   const grant=grants.get((req.headers.authorization||'').replace(/^Bearer /,''));
   if(!grant){send(401,{message:'Reconnect Cosmos.'});return true;}
   const session=await adminSession({headers:{cookie:grant.cookie}},sessions,admins);
   if(!session||session.user.id!==grant.userId){send(401,{message:'Reconnect Cosmos.'});return true;}
   let target,method='GET',payload;
   if(grant.scope==='party-status'){
    if(!session.admin)throw Error('Administrator access required.');
    if(body.method==='party-status')target='/api/v1/admin/owlbear-status';
    else if(body.method==='party-portrait'&&/^[0-9a-f-]{36}$/i.test(body.value?.id||''))target='/api/v1/admin/owlbear-portrait?characterId='+encodeURIComponent(body.value.id);
   }else if(body.method==='list')target='/api/v1/my/characters'+(body.value?.cursor?'?cursor='+encodeURIComponent(body.value.cursor):'');
   else if(body.method==='api'){
    const value=body.value||{},url=new URL(value.path,origin);method=value.method;payload=value.body;
    if(url.origin!==origin||!['GET','POST'].includes(method))throw Error('Unsupported request.');
    const match=/^\/api\/v1\/character-records\/([0-9a-f-]{36})$/i.exec(url.pathname);
    if(match){
     const row=db.prepare('SELECT owner_id,archived FROM characters WHERE id=?').get(match[1]);
     if(!row||row.archived||row.owner_id!==grant.userId)throw Error('This character does not belong to you.');
     if([...url.searchParams.keys()].some(k=>k!=='revision')||method==='POST'&&!['sheet','roll'].includes(payload?.op))throw Error('Unsupported sheet operation.');
    }else if(url.pathname==='/api/v1/auth/session'&&method==='GET'&&!url.search){}
    else if(url.pathname==='/api/v1/account'&&!url.search){if(method==='POST'&&(!payload?.preferences||Object.keys(payload).some(k=>!['revision','preferences'].includes(k))))throw Error('Unsupported account operation.');}
    else throw Error('Unsupported request.');
    target=url.pathname+url.search;
   }
   if(!target)throw Error('Unsupported request.');
   const proxy=Readable.from(payload?[Buffer.from(JSON.stringify(payload))]:[]);
   Object.assign(proxy,{method,url:target,headers:{cookie:grant.cookie,origin,'content-type':'application/json'},socket:req.socket});
   const reply=(status,data)=>{if(grant.scope==='sheet'&&data&&typeof data==='object')data.admin=false;send(200,{status,data});};
   for(const handler of handlers)if(handler&&await handler(proxy,res,new URL(target,origin).pathname,reply))return true;
   throw Error('Unsupported request.');
  }catch(error){send(error.httpStatus||403,{message:error.message||'Reconnect Cosmos.'});}
  return true;
 };
}
