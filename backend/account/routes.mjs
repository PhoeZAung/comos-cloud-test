import { createAuthThrottle } from '../auth/throttle.mjs';
import { MAX_AVATAR_BYTES } from './service.mjs';
function sessionCookie(req) {
 const parts=(req.headers.cookie||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith('__Host-comos_session='));
 if(parts.length!==1)throw new Error('Session required.');return parts[0].slice('__Host-comos_session='.length);
}
async function bytes(req,max) {
 const chunks=[];let size=0;
 if(Number(req.headers['content-length']||0)>max)throw Object.assign(new Error(),{code:'TOO_LARGE'});
 for await(const chunk of req){size+=chunk.length;if(size>max)throw Object.assign(new Error(),{code:'TOO_LARGE'});chunks.push(chunk);}
 return Buffer.concat(chunks);
}
export function createAccountRoutes({sessions,account,origin,throttle=createAuthThrottle()}) {
 return async(req,res,pathname,send)=>{
  if(!['/api/v1/account','/api/v1/account/avatar'].includes(pathname))return false;
  const read=['GET','HEAD'].includes(req.method),avatar=pathname.endsWith('/avatar');
  if(!read&&!['POST','DELETE'].includes(req.method)||!avatar&&req.method==='DELETE'){send(405,{error:'method_not_allowed'});return true;}
  if(!read&&(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')){send(403,{error:'origin_not_allowed'});return true;}
  const admission=throttle.enter(req.socket?.remoteAddress||'unknown',read?'restore':'profile');
  if(!admission.allowed){res.setHeader('Retry-After',String(admission.retryAfter));send(429,{error:'too_many_requests'});return true;}
  try {
   let user;
   try{({user}=await sessions.restore(sessionCookie(req)));}
   catch(error){if(['auth/internal-error','auth/network-request-failed','app/network-error','auth/insufficient-permission'].includes(error.code))throw error;send(401,{error:'sign_in_required'});return true;}
   if(read){
    if(!avatar)send(200,{user:account.get(user.id)});
    else {
     const body=await account.avatar(user.id);
     if(!body)send(404,{error:'not_found'});
     else {res.writeHead(200,{'Content-Type':'image/jpeg','Content-Length':body.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});res.end(req.method==='HEAD'?undefined:body);}
    }
   } else if(avatar) {
    const revision=Number(req.headers['if-match']);
    const result=req.method==='DELETE'?await account.removeAvatar(user.id,revision):await account.uploadAvatar(user.id,await bytes(req,MAX_AVATAR_BYTES),req.headers['content-type']?.split(';')[0].trim(),revision);
    send(200,{user:result});
   } else {
    if(req.headers['content-type']?.split(';')[0].trim()!=='application/json'){send(400,{error:'invalid_request'});return true;}
    let data;try{data=JSON.parse((await bytes(req,18000)).toString());}catch(error){if(error.code==='TOO_LARGE')throw error;send(400,{error:'invalid_request'});return true;}
    send(200,{user:account.update(user.id,data)});
   }
  }catch(error){
   if(error.code==='IMAGE_BUSY'){res.setHeader('Retry-After','2');send(429,{error:'too_many_requests'});}
   else if(['INVALID_ACCOUNT','INVALID_PROFILE'].includes(error.code))send(400,{error:'invalid_account',message:error.message});
   else if(error.code==='REVISION_CONFLICT')send(409,{error:'account_conflict'});
   else if(error.code==='TOO_LARGE')send(413,{error:'image_too_large',message:'Choose an image up to 3 MB.'});
   else if(['auth/session-cookie-expired','auth/session-cookie-revoked','auth/argument-error'].includes(error.code)||error.message==='Session required.')send(401,{error:'sign_in_required'});
   else if(['auth/user-disabled','auth/user-not-found','auth/invalid-session-cookie'].includes(error.code))send(401,{error:'sign_in_required'});
   else send(503,{error:'service_unavailable'});
  }finally{admission.release();}
  return true;
 };
}
