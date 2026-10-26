import {uniqueName,nameKey} from '../repositories/names.mjs';
import sharp from 'sharp';
import { createUserRepository } from '../repositories/users.mjs';
import { createMediaRepository } from '../repositories/media.mjs';
const invalid=message=>Object.assign(new Error(message),{code:'INVALID_ACCOUNT'});
export const MAX_AVATAR_BYTES=3*1024*1024;
export async function normalizeAvatar(bytes,mime) {
 if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>MAX_AVATAR_BYTES)throw invalid('Choose an image up to 3 MB.');
 const formats={'image/jpeg':'jpeg','image/png':'png','image/webp':'webp'};
 if(!formats[mime])throw invalid('Use JPEG, PNG or WebP.');
 // Verify the signature before invoking an image decoder. SVG/GIF/HEIC are not accepted.
 const detected=bytes[0]===0xff&&bytes[1]===0xd8?'jpeg':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'webp':null;
 if(detected!==formats[mime])throw invalid('This file does not match its image type.');
 try {
  const image=sharp(bytes,{limitInputPixels:16000000,failOn:'warning'});
  const meta=await image.metadata();
  if(meta.format!==detected||!meta.width||!meta.height||(meta.pages||1)>1)throw invalid('Choose a still image, up to 16 megapixels.');
  return await image.rotate().resize(512,512,{fit:'cover'}).flatten({background:'#101625'}).jpeg({quality:85}).toBuffer();
 } catch(error){if(error.code==='INVALID_ACCOUNT')throw error;throw invalid('This image could not be read. Choose a JPEG, PNG or WebP up to 16 megapixels.');}
}
export function createAccountService({db,files}) {
 const users=createUserRepository(db),media=createMediaRepository(db);
 let activeUploads=0;
 function revision(value){if(!Number.isSafeInteger(value)||value<1)throw invalid('Invalid revision.');}
 function transaction(id,expected,change) {
  revision(expected);db.exec('BEGIN IMMEDIATE');
  try {
   const user=users.get(id);
   if(!user||user.revision!==expected)throw Object.assign(new Error('Account changed in another session.'),{code:'REVISION_CONFLICT'});
   change(user);
   db.prepare('UPDATE users SET revision=revision+1,updated_at=? WHERE id=?').run(new Date().toISOString(),id);
   const result=users.get(id);db.exec('COMMIT');return result;
  }catch(error){db.exec('ROLLBACK');throw error;}
 }
 async function discard(item) {
  if(!item)return;
  // Only unreferenced former avatars from this account are eligible for removal.
  if(db.prepare('SELECT id FROM users WHERE avatar_media_id=?').get(item.id))return;
  try {await files.remove(item.key);db.prepare('DELETE FROM media WHERE id=? AND owner_id=?').run(item.id,item.ownerId);}catch {/* Keep metadata for later reconciliation if disk cleanup fails. */}
 }
 return Object.freeze({
  get:id=>users.get(id),
  update(id,data) {
   if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!['revision','displayName','preferences'].includes(k))||(!Object.hasOwn(data,'displayName')&&!Object.hasOwn(data,'preferences')))throw invalid('Invalid account fields.');
   let name;
   if(Object.hasOwn(data,'displayName')) {
    if(typeof data.displayName!=='string'||!data.displayName.trim()||data.displayName.trim().length>80||/[\u0000-\u001f\u007f]/u.test(data.displayName))throw invalid('Enter a display name of 1–80 characters.');
    name=data.displayName.trim();
   }
   const p=data.preferences;
   if(Object.hasOwn(data,'preferences')&&(!p||typeof p!=='object'||Array.isArray(p)||!['effectColors,splashCursor,theme','effectColors,pauseStars,splashCursor,theme'].includes(Object.keys(p).sort().join(','))||!['cosmic','ocean','ember','forest'].includes(p.theme)||typeof p.splashCursor!=='boolean'||typeof p.effectColors!=='boolean'||(p.pauseStars!==undefined&&typeof p.pauseStars!=='boolean')))throw invalid('Invalid preferences.');
   return transaction(id,data.revision,current=>{
    if(name!==undefined){try{uniqueName(db,name,id);}catch(error){throw invalid(error.message);}db.prepare("UPDATE users SET display_name=?,display_name_key=?,profile_state='complete' WHERE id=?").run(name,nameKey(name),id);}
    if(p)db.prepare('INSERT INTO user_preferences(user_id,theme_choice,splash_cursor,effect_colors,pause_stars) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET theme_choice=excluded.theme_choice,splash_cursor=excluded.splash_cursor,effect_colors=excluded.effect_colors,pause_stars=excluded.pause_stars').run(id,p.theme,Number(p.splashCursor),Number(p.effectColors),Number(p.pauseStars??current.preferences.pauseStars));
   });
  },
  async uploadAvatar(id,bytes,mime,expected) {
   revision(expected);
   if(users.get(id)?.revision!==expected)throw Object.assign(new Error('Account changed.'),{code:'REVISION_CONFLICT'});
   if(activeUploads>=2)throw Object.assign(new Error(),{code:'IMAGE_BUSY'});
   activeUploads++;
   try {
   const normalized=await normalizeAvatar(bytes,mime);
   const stored=await files.put(normalized);
   let old,created;
   try {
    const user=transaction(id,expected,current=>{
     old=current.avatarMediaId?media.getOwned(current.avatarMediaId,id):null;
     created=media.create({ownerId:id,...stored,mimeType:'image/jpeg'});
     db.prepare('UPDATE users SET avatar_media_id=? WHERE id=?').run(created,id);
    });
    await discard(old);return user;
   }catch(error){await files.remove(stored.key).catch(()=>{});throw error;}
   }finally{activeUploads--;}
  },
  async removeAvatar(id,expected) {
   let old;const user=transaction(id,expected,current=>{old=current.avatarMediaId?media.getOwned(current.avatarMediaId,id):null;db.prepare('UPDATE users SET avatar_media_id=NULL WHERE id=?').run(id);});
   await discard(old);return user;
  },
  async avatar(id) {
   const user=users.get(id),item=user?.avatarMediaId?media.getOwned(user.avatarMediaId,id):null;
   return item?await files.read(item.key):null;
  }
 });
}
