import {adminSession} from '../auth/admin-requests.mjs';
import {createAuthThrottle} from '../auth/throttle.mjs';

// Private, read-only export. Never includes Firebase password hashes, credentials,
// access tokens, session cookies, or physical image/video bytes.
const tables=[
  'item_purchases','item_catalog_imports','sheet_rolls','users','external_identities','user_preferences','characters',
  'worlds','parties','world_memberships','party_memberships',
  'items','feed_posts','feed_replies','media','legacy_record_map',
  'admin_bootstrap','group_state','schema_migrations','character_details','character_tags','character_tag_links','home_media','home_post_media',
];
export function snapshotComosData(db,{now=()=>new Date().toISOString()}={}) {
  const records={};
  db.exec('BEGIN');
  try{
    for(const table of tables)records[table]=db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table)?db.prepare(`SELECT * FROM ${table}`).all():[];
    db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
  return {format:'comos-admin-export-v1',exportedAt:now(),records};
}
export async function listFirebaseAccounts(auth,{maxAccounts=100000}={}){
  const accounts=[];
  let token;
  do{
    const page=await auth.listUsers(1000,token);
    if(!page||!Array.isArray(page.users))throw Error('Invalid Firebase directory response');
    if(accounts.length+page.users.length>maxAccounts)throw Error('Firebase account export exceeds the supported size');
    for(const user of page.users){
      accounts.push({
        uid:user.uid,
        email:user.email||null,
        emailVerified:!!user.emailVerified,
        displayName:user.displayName||null,
        disabled:!!user.disabled,
        providers:(user.providerData||[]).map(p=>p.providerId),
        createdAt:user.metadata?.creationTime||null,
        lastSignInAt:user.metadata?.lastSignInTime||null,
      });
    }
    token=page.pageToken||undefined;
  }while(token);
  return accounts;
}
export function createAdminBackupRoutes({db,sessions,auth,adminUids=[],throttle=createAuthThrottle(),now=()=>new Date().toISOString()}) {
  const admins=new Set(adminUids);
  return async(req,res,pathname,send)=>{
    if(pathname!=='/api/v1/admin/backup')return false;
    if(req.method!=='GET'){res.setHeader('Allow','GET');send(405,{error:'method_not_allowed'});return true;}
    const permit=throttle.enter(req.socket?.remoteAddress||'unknown','restore');
    if(!permit.allowed){res.setHeader('Retry-After',String(permit.retryAfter));send(429,{error:'too_many_requests'});return true;}
    try{
      const session=await adminSession(req,sessions,admins);
      if(!session){send(401,{error:'sign_in_required'});return true;}
      if(!session.admin){send(403,{error:'admin_required'});return true;}
      let firebaseAccounts=null;
      const warnings=['Media file bytes are not included. Firebase passwords, tokens and credentials are never exported.'];
      try{firebaseAccounts=await listFirebaseAccounts(auth);}
      catch{warnings.push('Firebase account directory could not be exported. The SQLite user records are still included.');}
      const backup={...snapshotComosData(db,{now}),firebaseAccounts,warnings};
      res.setHeader('Content-Disposition',`attachment; filename="comos-users-characters-${now().slice(0,10)}.json"`);
      res.setHeader('Content-Security-Policy',"default-src 'none'");
      send(200,backup);
    }catch{
      send(503,{error:'backup_unavailable'});
    }finally{permit.release();}
    return true;
  };
}