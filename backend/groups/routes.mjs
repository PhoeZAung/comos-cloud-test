import {adminSession,adminJson} from '../auth/admin-requests.mjs';
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
   const session=await adminSession(req,sessions,admins);
   if(!session){send(401,{error:'sign_in_required'});return true;}
   if(!session.admin){send(403,{error:'admin_required'});return true;}
   const url=new URL(req.url,origin);
   if(req.method==='POST'){
    groups.update(await adminJson(req,18000));
   }
   send(200,groups.snapshot({q:url.searchParams.get('q')||'',userId:url.searchParams.get('userId')||''}));
  }catch(error){if(error.httpStatus)send(error.httpStatus,{error:error.error});else if(error.code==='REVISION_CONFLICT')send(409,{error:'conflict',message:error.message});else if(error.code==='INVALID_GROUP')send(400,{error:'invalid_group',message:error.message});else send(503,{error:'service_unavailable'});}
  finally{permit.release();}return true;
 };
}
