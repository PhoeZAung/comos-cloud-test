import { adminSession,adminJson } from '../auth/admin-requests.mjs';
import { createAuthThrottle } from '../auth/throttle.mjs';

export function createPostsRoutes({sessions,posts,origin,adminUids=[],throttle=createAuthThrottle()}) {
  const admins=new Set(adminUids);
  return async (req,res,pathname,send) => {
    const isFeed = pathname==='/api/v1/feed';
    const isCreate=pathname==='/api/v1/posts', pinRoute=/^\/api\/v1\/posts\/([0-9a-f-]+)\/pin$/i.exec(pathname);
    const deleteId=!pinRoute&&pathname.startsWith('/api/v1/posts/')?pathname.slice('/api/v1/posts/'.length):null;
    if (!isFeed && !isCreate && deleteId===null && !pinRoute) return false;
    if (!(isFeed&&req.method==='GET') && !(isCreate&&req.method==='POST') && !(deleteId!==null&&req.method==='DELETE') && !(pinRoute&&req.method==='PATCH')) {
      res.setHeader('Allow',isFeed?'GET':isCreate?'POST':pinRoute?'PATCH':'DELETE');send(405,{error:'method_not_allowed'});return true;
    }
    if (['POST','PATCH','DELETE'].includes(req.method) && (req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')) {
      send(403,{error:'origin_not_allowed'});return true;
    }
    const permit=throttle.enter(req.socket?.remoteAddress||'unknown',req.method==='GET'?'restore':'profile');
    if (!permit.allowed) {res.setHeader('Retry-After',String(permit.retryAfter));send(429,{error:'too_many_requests'});return true;}
    try {
      const session=await adminSession(req,sessions,admins);
      if(!session){send(401,{error:'sign_in_required'});return true;}
      const userId=session.user.id, admin=session.admin;
      if(isCreate&&session.user.profileState!=='complete'){send(403,{error:'profile_required'});return true;}
      if(isFeed){
        const url=new URL(req.url,origin);
        if ([...url.searchParams.keys()].some(x=>x!=='cursor')) {send(400,{error:'invalid_cursor'});return true;}
        send(200,{...posts.list(userId,{admin,cursor:url.searchParams.get('cursor')||''}),viewerId:userId,canPost:admin});
      }
      else if(pinRoute){
        if(!admin){send(403,{error:'admin_required'});return true;}
        const input=await adminJson(req,1024);
        if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==1||typeof input.pinned!=='boolean'){send(400,{error:'invalid_pin'});return true;}
        send(200,{post:posts.pin(userId,pinRoute[1],input.pinned,{admin})});
      }
      else if(isCreate){
        if(!admin){send(403,{error:'admin_required',message:'Only the Comos administrator can create posts.'});return true;}
        send(201,{post:posts.create(userId,await adminJson(req,8192),{admin})});
      }
      else {posts.remove(userId,deleteId);send(200,{deleted:true});}
    }catch(error){
      if(error.httpStatus)send(error.httpStatus,{error:error.error});
      else if(error.code==='POST_CONFLICT')send(409,{error:'post_conflict'});
      else if(error.code==='POST_FORBIDDEN')send(403,{error:'post_forbidden'});
      else if(error.code==='POST_NOT_FOUND')send(404,{error:'post_not_found'});
      else if(error.code==='POST_PIN_LIMIT')send(409,{error:'pin_limit',message:error.message});
      else if(error.code==='INVALID_POST')send(400,{error:'invalid_post',message:error.message});
      else send(503,{error:'service_unavailable'});
    }finally{permit.release();}
    return true;
  };
}