import {adminSession,adminJson} from '../auth/admin-requests.mjs';

export function removeCosmosUser({db,adminUids,actorId,userId,confirmName,revision}){
 const row=db.prepare('SELECT * FROM users WHERE id=? AND deleted_at IS NULL').get(userId);
 if(!row)throw Error('User not found.');
 if(row.id===actorId)throw Error('You cannot delete your own account.');
 const identities=db.prepare("SELECT subject FROM external_identities WHERE user_id=? AND provider='firebase'").all(row.id);
 if(identities.some(identity=>adminUids.includes(identity.subject)))throw Error('Administrator accounts cannot be deleted here.');
 if(typeof confirmName!=='string'||confirmName!==row.display_name)throw Error('The user name did not match.');
 if(!Number.isSafeInteger(revision)||row.revision!==revision)throw Error('User changed. Refresh and try again.');
 const now=new Date().toISOString();db.exec('BEGIN IMMEDIATE');
 try{
  const archived=db.prepare('UPDATE characters SET archived=1,revision=revision+1,updated_at=? WHERE owner_id=? AND archived=0').run(now,row.id).changes;
  db.prepare('DELETE FROM party_memberships WHERE user_id=?').run(row.id);
  db.prepare('DELETE FROM world_memberships WHERE user_id=?').run(row.id);
  db.prepare('UPDATE group_state SET revision=revision+1,updated_at=? WHERE id=1').run(now);
  const changed=db.prepare("UPDATE users SET deleted_at=?,deleted_by=?,display_name='Deleted user',display_name_key=NULL,avatar_media_id=NULL,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND deleted_at IS NULL").run(now,actorId,now,row.id,revision);
  if(changed.changes!==1)throw Error('User changed. Refresh and try again.');
  db.exec('COMMIT');return {removed:true,archivedCharacters:archived,firebaseDeleted:false};
 }catch(error){db.exec('ROLLBACK');throw error;}
}

export function createUserDeletionRoutes({db,sessions,adminUids,origin}){
 const admins=new Set(adminUids);
 return async(req,res,path,send)=>{
  if(path!=='/api/v1/admin/users/remove')return false;
  if(req.method!=='POST'){send(405,{error:'method_not_allowed'});return true;}
  if(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site'){send(403,{error:'origin_not_allowed'});return true;}
  try{
   const session=await adminSession(req,sessions,admins);
   if(!session){send(401,{error:'sign_in_required'});return true;}
   if(!session.admin){send(403,{error:'admin_required'});return true;}
   const body=await adminJson(req);
   if(!body||Object.keys(body).some(k=>!['userId','confirmName','revision'].includes(k))||typeof body.userId!=='string')throw Error('Invalid user.');
   send(200,removeCosmosUser({db,adminUids,actorId:session.user.id,...body}));
  }catch(error){send(error.httpStatus||400,{error:'invalid_request',message:error.message||'Could not remove user.'});}
  return true;
 };
}
