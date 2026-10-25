import sharp from 'sharp';
import {randomUUID} from 'node:crypto';
import {adminSession} from '../auth/admin-requests.mjs';
import {createFileStore} from '../media/filesystem.mjs';
export async function createHomeMediaRoutes({db,sessions,adminUids,origin,mediaRoot}){
 const files=await createFileStore(mediaRoot,6*1024*1024),admins=new Set(adminUids);let processing=0;
 return async(req,res,pathname,send)=>{
  const base='/api/v1/home-media';if(pathname!==base&&!pathname.startsWith(base+'/'))return false;
  const write=pathname===base&&req.method==='POST';
  if(!write&&req.method!=='GET'){send(405,{error:'method_not_allowed'});return true;}
  if(write&&req.headers.origin!==origin){send(403,{error:'origin_not_allowed'});return true;}
  try{
   const session=await adminSession(req,sessions,admins);if(!session){send(401,{error:'sign_in_required'});return true;}
   if(write){
    if(!session.admin){send(403,{error:'admin_required'});return true;}
    if(processing>=2){send(429,{error:'upload_busy'});return true;}processing++;
    try{
     const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>6*1024*1024){send(413,{error:'image_too_large'});return true;}chunks.push(chunk);}
     const bytes=Buffer.concat(chunks),meta=await sharp(bytes,{animated:true,limitInputPixels:16000000}).metadata();
     if(!['jpeg','png','webp','gif'].includes(meta.format)||meta.width*meta.height>16000000||(meta.pages||1)>150)throw Error('Invalid image');
     const output=meta.format==='gif'?await sharp(bytes,{animated:true,limitInputPixels:16000000}).gif().toBuffer():await sharp(bytes,{limitInputPixels:16000000}).rotate().resize(1800,1800,{fit:'inside',withoutEnlargement:true}).webp().toBuffer();
     if(output.length>6*1024*1024)throw Error('Image too large');const saved=await files.put(output),id=randomUUID(),mime=meta.format==='gif'?'image/gif':'image/webp';
     try{db.prepare('INSERT INTO home_media VALUES(?,?,?,?)').run(id,session.user.id,saved.key,mime);}catch(error){await files.remove(saved.key);throw error;}
     send(201,{id});
    }finally{processing--;}
   }else{
    const id=pathname.slice(base.length+1);if(!/^[a-f0-9-]{36}$/.test(id)){send(404,{error:'not_found'});return true;}
    const m=db.prepare('SELECT * FROM home_media WHERE id=? AND (owner_id=? OR EXISTS(SELECT 1 FROM home_post_media p JOIN home_posts h ON h.id=p.post_id WHERE p.media_id=home_media.id))').get(id,session.user.id);
    if(!m){send(404,{error:'not_found'});return true;}const bytes=await files.read(m.file_key);res.writeHead(200,{'Content-Type':m.mime,'Content-Length':bytes.length,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});res.end(bytes);
   }
  }catch{send(400,{error:'invalid_image',message:'Choose a JPEG, PNG, WebP or GIF under 6 MB.'});}return true;
 };
}
