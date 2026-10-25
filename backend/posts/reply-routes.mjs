import {adminSession,adminJson} from '../auth/admin-requests.mjs';
import {createAuthThrottle} from '../auth/throttle.mjs';

export function createReplyRoutes({sessions,posts,replies,origin,adminUids=[],throttle=createAuthThrottle()}) {
  const admins=new Set(adminUids);
  return async(req,res,pathname,send)=>{
    const postMatch=/^\/api\/v1\/posts\/([^/]+)$/.exec(pathname);
    const threadMatch=/^\/api\/v1\/posts\/([^/]+)\/replies$/.exec(pathname);
    const replyMatch=/^\/api\/v1\/replies\/([^/]+)$/.exec(pathname);
    // DELETE /posts/:id stays owned by the existing posts route.
    if(postMatch&&req.method!=='GET')return false;
    if(!postMatch&&!threadMatch&&!replyMatch)return false;
    const readPost=!!postMatch,readThread=!!threadMatch&&req.method==='GET';
    const writeThread=!!threadMatch&&req.method==='POST',deleteReply=!!replyMatch&&req.method==='DELETE';
    if(!readPost&&!readThread&&!writeThread&&!deleteReply){
      res.setHeader('Allow',postMatch?'GET':threadMatch?'GET, POST':'DELETE');
      send(405,{error:'method_not_allowed'});return true;
    }
    if((writeThread||deleteReply)&&(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')){
      send(403,{error:'origin_not_allowed'});return true;
    }
    const permit=throttle.enter(req.socket?.remoteAddress||'unknown',readPost||readThread?'restore':'profile');
    if(!permit.allowed){res.setHeader('Retry-After',String(permit.retryAfter));send(429,{error:'too_many_requests'});return true;}
    try{
      const session=await adminSession(req,sessions,admins);
      if(!session){send(401,{error:'sign_in_required'});return true;}
      const userId=session.user.id,admin=session.admin;
      if(writeThread&&session.user.profileState!=='complete'){send(403,{error:'profile_required'});return true;}
      if(readPost)send(200,{post:posts.get(userId,postMatch[1],{admin}),viewerId:userId});
      else if(readThread){
        const url=new URL(req.url,origin);
        if([...url.searchParams.keys()].some(key=>key!=='cursor')){send(400,{error:'invalid_cursor'});return true;}
        send(200,{...replies.list(userId,threadMatch[1],{admin,cursor:url.searchParams.get('cursor')||''}),viewerId:userId});
      }else if(writeThread)send(201,{reply:replies.create(userId,threadMatch[1],await adminJson(req,8192),{admin})});
      else{replies.remove(userId,replyMatch[1]);send(200,{deleted:true});}
    }catch(error){
      if(error.httpStatus)send(error.httpStatus,{error:error.error});
      else if(error.code==='POST_NOT_FOUND'||error.code==='REPLY_NOT_FOUND')send(404,{error:'not_found'});
      else if(error.code==='REPLY_CONFLICT')send(409,{error:'reply_conflict'});
      else if(error.code==='INVALID_REPLY')send(400,{error:'invalid_reply',message:error.message});
      else send(503,{error:'service_unavailable'});
    }finally{permit.release();}
    return true;
  };
}