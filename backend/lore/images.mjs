import sharp from 'sharp';
import {randomUUID} from 'node:crypto';
import {adminSession} from '../auth/admin-requests.mjs';
import {createAuthThrottle} from '../auth/throttle.mjs';
import {createFileStore} from '../media/filesystem.mjs';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BYTES=5*1024*1024;
const fail=(code,status,message)=>Object.assign(new Error(message),{code,status});
async function readImage(req){
 const mime=req.headers['content-type']?.split(';')[0].trim();
 if(!['image/jpeg','image/png','image/webp'].includes(mime))throw fail('invalid_image',400,'Choose a JPEG, PNG or WebP.');
 if(Number(req.headers['content-length']||0)>MAX_BYTES)throw fail('image_too_large',413,'Choose an image up to 5 MB.');
 const chunks=[];let size=0;
 for await(const chunk of req){size+=chunk.length;if(size>MAX_BYTES)throw fail('image_too_large',413,'Choose an image up to 5 MB.');chunks.push(chunk);}
 if(!size)throw fail('invalid_image',400,'Choose a JPEG, PNG or WebP.');
 const bytes=Buffer.concat(chunks);
 let output;
 try{
  const image=sharp(bytes,{limitInputPixels:16000000,failOn:'warning',animated:false});
  const meta=await image.metadata();
  const expected={'image/jpeg':'jpeg','image/png':'png','image/webp':'webp'}[mime];
  if(meta.format!==expected||!meta.width||!meta.height||(meta.pages||1)>1||meta.width*meta.height>16000000)throw Error('Image type or size invalid');
  output=await image.rotate().resize(1800,1800,{fit:'inside',withoutEnlargement:true}).webp({quality:82,effort:4}).toBuffer();
 }catch{throw fail('invalid_image',400,'Choose a valid still JPEG, PNG or WebP up to 16 megapixels.');}
 if(output.length>MAX_BYTES)throw fail('image_too_large',413,'Image output is too large.');
 return output;
}
export async function createLoreImageRoutes({db,sessions,origin,mediaRoot,throttle=createAuthThrottle()}){
 const files=await createFileStore(mediaRoot,MAX_BYTES);
 const get=db.prepare('SELECT m.file_key AS key,m.mime AS mime FROM lore_images m WHERE m.id=? AND (m.owner_id=? OR EXISTS(SELECT 1 FROM lore_entry_images e WHERE e.image_id=m.id))');
 const pending=db.prepare('SELECT count(*) AS total FROM lore_images m WHERE m.owner_id=? AND NOT EXISTS(SELECT 1 FROM lore_entry_images e WHERE e.image_id=m.id)');
 let processing=0;
 return async(req,res,pathname,send)=>{
  const root='/api/v1/lore-images';
  const upload=pathname===root&&req.method==='POST';
  const imageId=pathname.startsWith(root+'/')?pathname.slice(root.length+1):null;
  if(!upload&&imageId===null)return false;
  if(!(upload||imageId!==null&&req.method==='GET')){
   res.setHeader('Allow',imageId!==null?'GET':'POST');send(405,{error:'method_not_allowed'});return true;
  }
  if(upload&&(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')){
   send(403,{error:'origin_not_allowed'});return true;
  }
  const permit=throttle.enter(req.socket?.remoteAddress||'unknown',upload?'profile':'restore');
  if(!permit.allowed){res.setHeader('Retry-After',String(permit.retryAfter));send(429,{error:'too_many_requests'});return true;}
  try{
   const session=await adminSession(req,sessions,new Set());
   if(!session){send(401,{error:'sign_in_required'});return true;}
   if(upload){
    if(session.user.profileState!=='complete'){send(403,{error:'profile_required'});return true;}
    if(pending.get(session.user.id).total>=60){send(429,{error:'image_limit',message:'Too many unpublished images. Try again later.'});return true;}
    if(processing>=2){send(429,{error:'upload_busy'});return true;}
    processing++;
    try{
     const bytes=await readImage(req),stored=await files.put(bytes),id=randomUUID();
     try{
      db.prepare('INSERT INTO lore_images(id,owner_id,file_key,mime,created_at) VALUES(?,?,?,?,?)')
        .run(id,session.user.id,stored.key,'image/webp',new Date().toISOString());
     }catch(error){await files.remove(stored.key).catch(()=>{});throw error;}
     send(201,{id,url:'/api/v1/lore-images/'+id});
    }finally{processing--;}
   }else{
    if(!uuid.test(imageId)){send(404,{error:'not_found'});return true;}
    const media=get.get(imageId,session.user.id);
    if(!media){send(404,{error:'not_found'});return true;}
    const bytes=await files.read(media.key);
    res.writeHead(200,{
     'Content-Type':media.mime,'Content-Length':bytes.length,
     'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',
     'Cross-Origin-Resource-Policy':'same-origin'
    });
    res.end(bytes);
   }
  }catch(error){
   const status=error.status||503;
   send(status,{error:error.code||'service_unavailable',message:error.status?error.message:'Image storage temporarily unavailable.'});
  }finally{permit.release();}
  return true;
 };
}
