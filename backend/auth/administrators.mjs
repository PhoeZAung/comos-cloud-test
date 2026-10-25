import {createHash} from 'node:crypto';
// Trusted host configuration only. Never accept administrator identities from a request.
export async function resolveAdministrators({db,auth,projectId,env=process.env,requireGoogleProvider=false}){
 const uids=new Set((env.COMOS_ADMIN_FIREBASE_UIDS||'').split(',').map(s=>s.trim()).filter(Boolean));
 const email=(env.COMOS_ADMIN_BOOTSTRAP_EMAIL||'').trim().toLowerCase();
 if(!email)return {uids:[...uids],status:uids.size?'manual':'not_configured'};
 if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))throw Error('Invalid administrator bootstrap configuration.');
 const fingerprint=createHash('sha256').update(projectId+'\0'+email).digest('hex');
 const pinned=db.prepare('SELECT firebase_subject AS subject FROM admin_bootstrap WHERE email_fingerprint=?').get(fingerprint);
 let user;
 try{user=pinned?await auth.getUser(pinned.subject):await auth.getUserByEmail(email);}
 catch(error){if(error.code==='auth/user-not-found')return {uids:[...uids],status:'account_not_found'};throw error;}
 if(user.disabled)return {uids:[...uids],status:'account_disabled'};
 if(user.email?.trim().toLowerCase()!==email)return {uids:[...uids],status:'identity_mismatch'};
 if(user.emailVerified!==true)return {uids:[...uids],status:'verification_required'};
 if(requireGoogleProvider&&!user.providerData?.some(p=>p.providerId==='google.com'&&p.email?.trim().toLowerCase()===email))return {uids:[...uids],status:'google_provider_required'};
 if(typeof user.uid!=='string'||!user.uid||user.uid.length>128)throw Error('Invalid administrator identity.');
 // A future account with the same email cannot inherit an existing pinned grant.
 db.prepare('INSERT INTO admin_bootstrap VALUES(?,?,?) ON CONFLICT(email_fingerprint) DO NOTHING').run(fingerprint,user.uid,new Date().toISOString());
 const saved=db.prepare('SELECT firebase_subject AS subject FROM admin_bootstrap WHERE email_fingerprint=?').get(fingerprint);
 if(saved.subject!==user.uid)throw Error('Administrator identity changed during setup.');
 uids.add(user.uid);return {uids:[...uids],status:'ready'};
}
