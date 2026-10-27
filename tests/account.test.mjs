import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {openDatabase} from '../backend/db/database.mjs';
import {createFileStore} from '../backend/media/filesystem.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createAccountService,normalizeAvatar} from '../backend/account/service.mjs';
import {createAccountRoutes} from '../backend/account/routes.mjs';
import {createApiServer} from '../backend/http/app.mjs';
import {createAccountClient} from '../src/account/client.mjs';

test('account edits, preferences and processed avatars survive restart; replacements clean up old media',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'comos-account-')),database=path.join(dir,'db.sqlite');let db;
 try {
  db=await openDatabase(database);const files=await createFileStore(path.join(dir,'media'));
  const repo=createUserRepository(db);let user=repo.create();const service=createAccountService({db,files});
  assert.deepEqual(user.preferences,{theme:'cosmic',splashCursor:false,effectColors:true,pauseStars:false,dicePopup:true});
  user=service.update(user.id,{revision:user.revision,displayName:'  Explorer  ',preferences:{theme:'ocean',splashCursor:true,effectColors:false,pauseStars:true,dicePopup:true}});
  assert.equal(user.displayName,'Explorer');assert.equal(user.profileState,'complete');
  assert.throws(()=>service.update(user.id,{revision:1,displayName:'Stale'}),{code:'REVISION_CONFLICT'});
  for(const patch of [{ownerId:'other'},{preferences:{theme:'arbitrary',splashCursor:false,effectColors:true}},{displayName:'\u0000bad'},{preferences:{theme:'cosmic',splashCursor:'yes',effectColors:true}}])assert.throws(()=>service.update(user.id,{revision:user.revision,...patch}),{code:'INVALID_ACCOUNT'});
  const image=await sharp({create:{width:30,height:45,channels:3,background:'#ff8844'}}).png().toBuffer();
  user=await service.uploadAvatar(user.id,image,'image/png',user.revision);assert.ok(user.avatarMediaId);
  const meta=await sharp(await service.avatar(user.id)).metadata();assert.equal(meta.width,512);assert.equal(meta.height,512);assert.equal(meta.format,'jpeg');assert.equal(meta.exif,undefined);
  assert.equal(await service.avatar(repo.create().id),null);
  const old=user.avatarMediaId;user=await service.uploadAvatar(user.id,image,'image/png',user.revision);assert.notEqual(user.avatarMediaId,old);
  assert.equal(db.prepare('SELECT count(*) AS n FROM media').get().n,1);assert.equal((await readdir(path.join(dir,'media'))).length,1);
  db.close();db=await openDatabase(database);const restored=createUserRepository(db).get(user.id);assert.equal(restored.preferences.theme,'ocean');assert.equal(restored.preferences.splashCursor,true);assert.equal(restored.preferences.pauseStars,true);assert.equal(restored.avatarMediaId,user.avatarMediaId);
  user=await createAccountService({db,files}).removeAvatar(user.id,restored.revision);assert.equal(user.avatarMediaId,null);assert.equal((await readdir(path.join(dir,'media'))).length,0);
 }finally{db?.close();await rm(dir,{recursive:true,force:true});}
});

test('avatar decoder rejects scripts, forged types, oversized, animated and damaged images',async()=>{
 const image=await sharp({create:{width:10,height:10,channels:3,background:'red'}}).png().toBuffer();
 for(const [bytes,type] of [[Buffer.from('<svg/>'),'image/svg+xml'],[Buffer.from('bad'),'image/jpeg'],[image,'image/webp'],[Buffer.alloc(3*1024*1024+1),'image/png'],[image.subarray(0,25),'image/png']])await assert.rejects(normalizeAvatar(bytes,type),{code:'INVALID_ACCOUNT'});
 const large=await sharp({create:{width:4100,height:4100,channels:3,background:'red'}}).png().toBuffer();await assert.rejects(normalizeAvatar(large,'image/png'),{code:'INVALID_ACCOUNT'});
});

test('account routes enforce cookie identity, origin, revision and private avatar responses',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'comos-account-http-'));const db=await openDatabase(':memory:');
 const repo=createUserRepository(db),a=repo.create(),b=repo.create();const account=createAccountService({db,files:await createFileStore(dir)});
 const sessions={restore:async cookie=>{if(!['a','b'].includes(cookie))throw Error('Session required.');return {user:repo.get(cookie==='a'?a.id:b.id)};}};
 const server=createApiServer({db,accountRoutes:createAccountRoutes({sessions,account,origin:'https://example.test',throttle:{enter:()=>({allowed:true,release(){}})}})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/api/v1/account`;
 const headers={'Content-Type':'application/json',Origin:'https://example.test',Cookie:'__Host-comos_session=a'};
 try {
  assert.equal((await fetch(base)).status,401);
  assert.equal((await fetch(base,{method:'POST',headers:{...headers,Origin:'https://evil.test'},body:'{}'})).status,403);
  let r=await fetch(base,{method:'POST',headers,body:JSON.stringify({revision:1,displayName:'A',ownerId:b.id})});assert.equal(r.status,400);
  r=await fetch(base,{method:'POST',headers,body:JSON.stringify({revision:1,displayName:'A'})});assert.equal(r.status,200);assert.equal(repo.get(b.id).displayName,'');
  r=await fetch(base,{method:'POST',headers,body:JSON.stringify({revision:1,displayName:'Stale'})});assert.equal(r.status,409);
  const image=await sharp({create:{width:8,height:8,channels:3,background:'blue'}}).png().toBuffer();
  r=await fetch(base+'/avatar',{method:'POST',headers:{...headers,'Content-Type':'image/png','If-Match':'2'},body:image});assert.equal(r.status,200);
  r=await fetch(base+'/avatar',{headers});assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('content-type'),'image/jpeg');
  r=await fetch(base+'/avatar',{headers:{Cookie:'__Host-comos_session=b'}});assert.equal(r.status,404);
  r=await fetch(base+'/avatar',{headers:{Cookie:'__Host-comos_session=a; __Host-comos_session=b'}});assert.equal(r.status,401);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();await rm(dir,{recursive:true,force:true});}
});

test('account client queues changes using the latest revision and never retries failed writes silently',async()=>{
 const requests=[];let revision=1;
 const client=createAccountClient({user:{revision:1},request:async(_url,options)=>{const data=JSON.parse(options.body);requests.push(data);assert.equal(data.revision,revision);revision++;return {ok:true,json:async()=>({user:{revision}})};}});
 await Promise.all([client.update({displayName:'Explorer'}),client.update({preferences:{theme:'forest',splashCursor:false,effectColors:true}})]);
 assert.deepEqual(requests.map(x=>x.revision),[1,2]);
 let count=0;const broken=createAccountClient({user:{revision:3},request:async()=>{count++;return {ok:false,status:409,json:async()=>({})};}});
 await assert.rejects(broken.update({displayName:'X'}),{code:'conflict'});assert.equal(count,1);
});

test('Pause stars is a saved account switch, not a global footer button',async()=>{
 const {accountEditor}=await import('../src/account/view.mjs');
 const {normalizedPreferences}=await import('../src/ui/preferences.mjs');
 const {renderPage}=await import('../src/layouts/site.mjs');
 const {default:page}=await import('../src/pages/account.mjs');
 const markup=accountEditor({fixture:true});
 assert.match(markup,/data-pause-stars/);
 assert.ok(markup.indexOf('data-splash-toggle')<markup.indexOf('data-pause-stars'));
 assert.deepEqual(normalizedPreferences({pauseStars:true,dicePopup:true}),{theme:'cosmic',splashCursor:false,effectColors:true,pauseStars:true,dicePopup:true});
 const pageHtml=renderPage(page);
 assert.doesNotMatch(pageHtml,/data-motion|Pause stars<\/button>/);
});
