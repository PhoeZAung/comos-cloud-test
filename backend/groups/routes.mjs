import {createAuthThrottle} from '../auth/throttle.mjs';
export function createGroupsRoutes({sessions,groups,origin,adminUids=[],throttle=createAuthThrottle()}){
 const admins=new Set(adminUids);
 return async(req,res,pathname,send)=>{
  if(pathname!=='/api/v1/admin/groups')return false;
  if(!['GET','POST'].includes(req.method)){send(405,{error:'method_not_allowed'});return true;}
  if(req.method==='POST'&&(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')){send(403,{error:'origin_not_allowed'});return true;}
  const permit=throttle.enter(req.socket?.remoteAddress||'unknown',req.method==='GET'?'restore':'profile');
  if(!permit.allowed){res.setHeader('Retry-After',String(permit.retryAfter));send(429,{error:'too_many_requests'});return true;}
  try{
   const cookies=(req.headers.cookie||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith('__Host-comos_session='));let session;
   try{if(cookies.length!==1)throw Error();session=await sessions.restore(cookies[0].slice(21));}catch(error){if(['auth/internal-error','auth/network-request-failed','app/network-error'].includes(error.code))throw error;send(401,{error:'sign_in_required'});return true;}
   if(!admins.has(session.subject)){send(403,{error:'admin_required'});return true;}
   const url=new URL(req.url,origin);
   if(req.method==='POST'){
    if(req.headers['content-type']?.split(';')[0]!=='application/json'){send(400,{error:'invalid_request'});return true;}
    let body='',bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>18000){send(413,{error:'request_too_large'});return true;}body+=chunk.toString();}
    let data;try{data=JSON.parse(body);}catch{send(400,{error:'invalid_request'});return true;}groups.update(data);
   }
   send(200,groups.snapshot({q:url.searchParams.get('q')||'',userId:url.searchParams.get('userId')||''}));
  }catch(error){if(error.code==='REVISION_CONFLICT')send(409,{error:'conflict',message:error.message});else if(error.code==='INVALID_GROUP')send(400,{error:'invalid_group',message:error.message});else send(503,{error:'service_unavailable'});}
  finally{permit.release();}return true;
 };
}
