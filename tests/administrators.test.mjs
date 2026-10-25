import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../backend/db/database.mjs';
import {resolveAdministrators} from '../backend/auth/administrators.mjs';

test('trusted email bootstrap resolves a verified Firebase account and pins its UID across restarts',async()=>{
 const db=await openDatabase(':memory:');try{
  const email='owner@example.test',env={COMOS_ADMIN_BOOTSTRAP_EMAIL:' Owner@Example.Test ',COMOS_ADMIN_FIREBASE_UIDS:'existing-admin'},user={uid:'firebase-owner',email,emailVerified:true,disabled:false};
  let emailLookups=0,uidLookups=0;
  const auth={getUserByEmail:async value=>{emailLookups++;assert.equal(value,email);return user;},getUser:async id=>{uidLookups++;assert.equal(id,user.uid);return user;}};
  const args={db,auth,env,projectId:'example-project'};
  assert.deepEqual(await resolveAdministrators(args),{uids:['existing-admin','firebase-owner'],status:'ready'});
  assert.deepEqual(await resolveAdministrators(args),{uids:['existing-admin','firebase-owner'],status:'ready'});
  assert.equal(emailLookups,1);assert.equal(uidLookups,1);
  const row=db.prepare('SELECT * FROM admin_bootstrap').get();assert.equal(row.firebase_subject,user.uid);assert.equal(row.email_fingerprint.includes(email),false);
  // Recreating an account at the same email must not inherit the pinned identity.
  auth.getUser=async()=>{throw Object.assign(Error(),{code:'auth/user-not-found'});};auth.getUserByEmail=async()=>{throw Error('Must not re-resolve an existing pin.');};
  assert.deepEqual(await resolveAdministrators(args),{uids:['existing-admin'],status:'account_not_found'});
  assert.deepEqual(await resolveAdministrators({...args,env:{}}),{uids:[],status:'not_configured'});
 }finally{db.close();}
});
test('unverified, disabled and mismatched Firebase records cannot create a bootstrap grant',async()=>{
 const db=await openDatabase(':memory:');try{
  let user={uid:'owner',email:'owner@example.test',emailVerified:false,disabled:false};
  const args={db,projectId:'example-project',env:{COMOS_ADMIN_BOOTSTRAP_EMAIL:'owner@example.test'},auth:{getUserByEmail:async()=>user}};
  assert.equal((await resolveAdministrators(args)).status,'verification_required');
  user={...user,emailVerified:true,disabled:true};assert.equal((await resolveAdministrators(args)).status,'account_disabled');
  user={...user,disabled:false,email:'other@example.test'};assert.equal((await resolveAdministrators(args)).status,'identity_mismatch');
  assert.equal(db.prepare('SELECT count(*) AS n FROM admin_bootstrap').get().n,0);
  await assert.rejects(resolveAdministrators({...args,auth:{getUserByEmail:async()=>{throw Object.assign(Error('provider outage'),{code:'auth/internal-error'});}}}),/provider outage/);
 }finally{db.close();}
});
