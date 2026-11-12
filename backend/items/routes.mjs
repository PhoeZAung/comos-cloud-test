import {createAuthThrottle} from '../auth/throttle.mjs';
import {adminSession,adminJson} from '../auth/admin-requests.mjs';
export function createItemsRoutes({sessions,items,origin,adminUids=[],purchases=null,throttle=createAuthThrottle()}){
 const admins=new Set(adminUids),base='/api/v1/admin/items',catalog='/api/v1/item-catalog';
 return async(req,res,pathname,send)=>{
  const playerCatalog=pathname===catalog||pathname.startsWith(catalog+'/');
  if(!playerCatalog&&pathname!==base&&!pathname.startsWith(base+'/'))return false;
  const id=pathname===(playerCatalog?catalog:base)?null:pathname.slice((playerCatalog?catalog:base).length+1);
  const buying=playerCatalog&&id==='purchase';
  if(!(req.method==='GET'&&!buying||req.method==='POST'&&(buying||!playerCatalog&&id===null))){send(405,{error:'method_not_allowed'});return true;}
  if(req.method==='POST'&&(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')){send(403,{error:'origin_not_allowed'});return true;}
  const permit=throttle.enter(req.socket?.remoteAddress||'unknown',req.method==='GET'?'restore':'profile');
  if(!permit.allowed){res.setHeader('Retry-After',String(permit.retryAfter));send(429,{error:'too_many_requests'});return true;}
  try{
   const session=await adminSession(req,sessions,admins);
   if(!session){send(401,{error:'sign_in_required'});return true;}
   if(playerCatalog){
    const query=new URL(req.url,origin).searchParams;
    if(buying){
     if(!purchases)throw Error('Purchases unavailable.');
     const change=await adminJson(req,12000);
     send(200,{receipt:purchases.purchase(session.user.id,change,{admin:false})});
    }else if(id==='categories')send(200,{categories:items.categories()});
    else if(id){
     if(query.size){send(400,{error:'invalid_request'});return true;}
     const item=items.get(id);
     send(item&&!item.archived?200:404,item&&!item.archived?{item}:{error:'item_not_found'});
    }else send(200,items.list({q:query.get('q')||'',cursor:query.get('cursor')||'',category:query.get('category')||''}));
    return true;
   }
   if(!session.admin){send(403,{error:'admin_required'});return true;}
   if(req.method==='POST'){const change=await adminJson(req,50000);if(change?.op==='buy'){if(!purchases)throw Error('Purchases unavailable.');send(200,{receipt:purchases.purchase(session.user.id,change,{admin:true})});}else send(200,{item:items.save(change)});return true;}
   const query=new URL(req.url,origin).searchParams;
   if(id==='categories'){send(200,{categories:items.categories()});return true;}
   if(id==='buyers'&&purchases){send(200,purchases.characters({q:query.get('q')||'',cursor:query.get('cursor')||''}));return true;}
   if(id?.startsWith('buyer/')&&purchases){send(200,{character:purchases.character(id.slice(6))});return true;}
   if(id!==null){const item=items.get(id);send(item?200:404,item?{item}:{error:'item_not_found'});return true;}
   const url=new URL(req.url,origin),archived=url.searchParams.get('archived')||'0';
   if(!['0','1'].includes(archived))throw Object.assign(Error('Invalid archive filter.'),{code:'INVALID_ITEM'});
   send(200,items.list({q:url.searchParams.get('q')||'',sourceId:url.searchParams.get('sourceId')||'',cursor:url.searchParams.get('cursor')||'',archived:archived==='1',category:url.searchParams.get('category')||''}));
  }catch(error){if(error.httpStatus)send(error.httpStatus,{error:error.error,message:error.message});else if(error.code==='REVISION_CONFLICT')send(409,{error:'conflict',message:error.message});else if(error.code==='INVALID_ITEM')send(400,{error:'invalid_item',message:error.message});else send(503,{error:'service_unavailable'});}
  finally{permit.release();}return true;
 };
}
