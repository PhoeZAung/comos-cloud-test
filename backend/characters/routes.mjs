import {adminSession,adminJson} from '../auth/admin-requests.mjs';
import {createAuthThrottle} from '../auth/throttle.mjs';
export function createCharactersRoutes({sessions,characters,origin,adminUids=[],throttle=createAuthThrottle()}){
 const admins=new Set(adminUids),paths=['/api/v1/access','/api/v1/admin/characters','/api/v1/admin/players'];
 return async(req,res,pathname,send)=>{
  if(!paths.includes(pathname))return false;
  const writable=pathname==='/api/v1/admin/characters';
  if(req.method!=='GET'&&!(writable&&req.method==='POST')){send(405,{error:'method_not_allowed'});return true;}
  if(req.method==='POST'&&(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')){send(403,{error:'origin_not_allowed'});return true;}
  const permit=throttle.enter(req.socket?.remoteAddress||'unknown',req.method==='GET'?'restore':'profile');
  if(!permit.allowed){res.setHeader('Retry-After',String(permit.retryAfter));send(429,{error:'too_many_requests'});return true;}
  try{
   const session=await adminSession(req,sessions,admins);
   if(!session){send(401,{error:'sign_in_required'});return true;}
   const admin=session.admin;
   if(pathname==='/api/v1/access'){send(200,{admin});return true;}
   if(!admin){send(403,{error:'admin_required'});return true;}
   const url=new URL(req.url,origin);
   if(req.method==='POST'){
    const data=await adminJson(req,18000);
    send(200,{character:characters.save(data)});return true;
   }
   if(pathname.endsWith('/players'))send(200,characters.players({q:url.searchParams.get('q')||'',userId:url.searchParams.get('userId')||''}));
   else{const archived=url.searchParams.get('archived')||'0';if(!['0','1'].includes(archived))throw Object.assign(Error('Invalid archive filter.'),{code:'INVALID_CHARACTER'});send(200,characters.list({q:url.searchParams.get('q')||'',cursor:url.searchParams.get('cursor')||'',archived:archived==='1'}));}
  }catch(error){if(error.httpStatus)send(error.httpStatus,{error:error.error});else if(error.code==='REVISION_CONFLICT')send(409,{error:'conflict',message:error.message});else if(error.code==='INVALID_CHARACTER')send(400,{error:'invalid_character',message:error.message});else send(503,{error:'service_unavailable'});}
  finally{permit.release();}return true;
 };
}
