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
   const cookies=(req.headers.cookie||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith('__Host-comos_session='));let session;
   try{if(cookies.length!==1)throw Error();session=await sessions.restore(cookies[0].slice(21));}catch(error){if(['auth/internal-error','auth/network-request-failed','app/network-error'].includes(error.code))throw error;send(401,{error:'sign_in_required'});return true;}
   const admin=admins.has(session.subject);
   if(pathname==='/api/v1/access'){send(200,{admin});return true;}
   if(!admin){send(403,{error:'admin_required'});return true;}
   const url=new URL(req.url,origin);
   if(req.method==='POST'){
    if(req.headers['content-type']?.split(';')[0].trim()!=='application/json'){send(400,{error:'invalid_request'});return true;}
    const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>18000){send(413,{error:'request_too_large'});return true;}chunks.push(chunk);}
    let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{send(400,{error:'invalid_request'});return true;}
    send(200,{character:characters.save(data)});return true;
   }
   if(pathname.endsWith('/players'))send(200,characters.players({q:url.searchParams.get('q')||'',userId:url.searchParams.get('userId')||''}));
   else{const archived=url.searchParams.get('archived')||'0';if(!['0','1'].includes(archived))throw Object.assign(Error('Invalid archive filter.'),{code:'INVALID_CHARACTER'});send(200,characters.list({q:url.searchParams.get('q')||'',cursor:url.searchParams.get('cursor')||'',archived:archived==='1'}));}
  }catch(error){if(error.code==='REVISION_CONFLICT')send(409,{error:'conflict',message:error.message});else if(error.code==='INVALID_CHARACTER')send(400,{error:'invalid_character',message:error.message});else send(503,{error:'service_unavailable'});}
  finally{permit.release();}return true;
 };
}
