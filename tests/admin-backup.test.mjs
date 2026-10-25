import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {resolveAdministrators} from '../backend/auth/administrators.mjs';
import {createAdminBackupRoutes,snapshotComosData,listFirebaseAccounts} from '../backend/backup/routes.mjs';
const email='phoeaung2076@gmail.com';
function sqlite(){
 const db=new DatabaseSync(':memory:');
 for(const t of ['users','external_identities','user_preferences','characters','worlds','parties','world_memberships','party_memberships','items','feed_posts','feed_replies','media','legacy_record_map','group_state','schema_migrations'])db.exec(`CREATE TABLE ${t}(id TEXT) STRICT`);
 db.exec('CREATE TABLE admin_bootstrap(email_fingerprint TEXT PRIMARY KEY, firebase_subject TEXT, created_at TEXT) STRICT');
 db.exec("INSERT INTO users VALUES('one'); INSERT INTO characters VALUES('character-one');");
 return db;
}
test('Google owner is validated from Firebase Admin and pinned by UID',async()=>{
 const db=sqlite();try{
  let calls=0;
  const owner={uid:'google-owner-uid',email,emailVerified:true,disabled:false,providerData:[{providerId:'google.com',email}]};
  const auth={getUserByEmail:async e=>{assert.equal(e,email);calls++;return owner;},getUser:async uid=>{assert.equal(uid,owner.uid);return owner;}};
  const args={db,auth,projectId:'mount-aetheria',env:{COMOS_ADMIN_BOOTSTRAP_EMAIL:email},requireGoogleProvider:true};
  assert.deepEqual(await resolveAdministrators(args),{uids:['google-owner-uid'],status:'ready'});
  assert.deepEqual(await resolveAdministrators(args),{uids:['google-owner-uid'],status:'ready'});
  assert.equal(calls,1);
  const fake={...owner,providerData:[{providerId:'password',email}]};
  assert.deepEqual(await resolveAdministrators({...args,db:sqlite(),auth:{getUserByEmail:async()=>fake}}),{uids:[],status:'google_provider_required'});
  const unverified={...owner,emailVerified:false};
  assert.equal((await resolveAdministrators({...args,db:sqlite(),auth:{getUserByEmail:async()=>unverified}})).status,'verification_required');
 }finally{db.close();}
});
test('Backup contains registered users and archived characters, no password/token fields',()=>{
 const db=sqlite();try{const snap=snapshotComosData(db);assert.equal(snap.records.users.length,1);assert.equal(snap.records.characters.length,1);assert.equal(snap.records.feed_posts.length,0);assert.ok(!JSON.stringify(snap).includes('passwordHash'));}finally{db.close();}
});
test('Firebase directory uses all pages and exports safe fields only',async()=>{
 const auth={listUsers:async(n,token)=>token?{users:[{uid:'b',email:'b@example.test'}]}:{users:[{uid:'a',email:'a@example.test',passwordHash:'NOT-ALLOWED'}],pageToken:'next'}};
 const users=await listFirebaseAccounts(auth);assert.equal(users.length,2);assert.equal(users[0].uid,'a');assert.equal(JSON.stringify(users).includes('NOT-ALLOWED'),false);
});
test('Backup endpoint requires verified admin cookie',async()=>{
 const db=sqlite();try{
  const sessions={restore:async cookie=>({subject:cookie,user:{id:cookie}})};
  const auth={listUsers:async()=>({users:[{uid:'google-owner-uid',email}]})};
  const route=createAdminBackupRoutes({db,sessions,auth,adminUids:['google-owner-uid']});
  const send=async(cookie,method='GET')=>{
   const req={method,headers:{cookie:cookie?`__Host-comos_session=${cookie}`:''},socket:{remoteAddress:'127.0.0.1'}};
   const headers={};const res={setHeader:(k,v)=>headers[k]=v};
   let result;const handled=await route(req,res,'/api/v1/admin/backup',(code,payload)=>{result={code,payload};});
   assert.equal(handled,true);return {...result,headers};
  };
  assert.equal((await send(null)).code,401);
  assert.equal((await send('visitor')).code,403);
  const owner=await send('google-owner-uid');assert.equal(owner.code,200);assert.equal(owner.payload.records.characters.length,1);
  assert.equal(owner.payload.firebaseAccounts[0].uid,'google-owner-uid');
  assert.match(owner.headers['Content-Disposition'],/attachment/);
  assert.equal((await send('google-owner-uid','POST')).code,405);
 }finally{db.close();}
});