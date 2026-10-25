import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, writeFile, mkdir, symlink, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createStaticHandler } from '../backend/http/static.mjs';
import { createApiServer } from '../backend/http/app.mjs';
import { initializeAuthentication } from '../backend/auth/firebase.mjs';

test('cloud host isolates preview CSP and blocks private files, traversal, symlinks and writes', async () => {
 const temp = await mkdtemp(path.join(os.tmpdir(), 'comos-cloud-'));
 const root = path.join(temp, 'public'); await mkdir(root); await mkdir(path.join(root, 'preview'));
 await writeFile(path.join(root, 'auth-headers.json'), JSON.stringify({'Content-Security-Policy': "connect-src 'self'"}));
 await writeFile(path.join(root, 'index.html'), '<h1>Live</h1>');
 await writeFile(path.join(root, 'preview/index.html'), '<h1>Preview</h1>');
 await writeFile(path.join(temp, 'private.html'), 'private');
 await symlink(path.join(temp, 'private.html'), path.join(root, 'escape.html'));
 const handler = await createStaticHandler(root);
 const server = createApiServer({db: {}, staticHandler:handler});
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const base = `http://127.0.0.1:${server.address().port}`;
 try {
  let r = await fetch(base); assert.equal(r.status, 200); assert.equal(r.headers.get('content-security-policy'), "connect-src 'self'");
  r = await fetch(base+'/preview/'); assert.equal(r.status,404);
  for(const name of ['/escape.html','/auth-headers.json','/%2e%2e%2fprivate.html','/.env','/backend/cloud.mjs']) assert.equal((await fetch(base+name)).status,404,name);
  assert.equal((await fetch(base+'/',{method:'POST'})).status,405);
  assert.equal((await fetch(base+'/api/v1/characters')).status,401);
  r=await fetch(base,{method:'HEAD'}); assert.equal(r.status,200); assert.equal(await r.text(),'');
 } finally { await new Promise(resolve => server.close(resolve)); await rm(temp,{recursive:true,force:true}); }
});

test('cloud server credentials reject malformed JSON and wrong project before provider use', async () => {
 const env={COMOS_AUTH_MODE:'firebase',COMOS_FIREBASE_PROJECT_ID:'mount-aetheria',COMOS_AUTH_ORIGIN:'https://example.test'};
 await assert.rejects(initializeAuthentication({db:{},env:{...env,COMOS_FIREBASE_SERVICE_ACCOUNT_JSON:'invalid'}}),/Invalid server credential JSON/);
 await assert.rejects(initializeAuthentication({db:{},env:{...env,COMOS_FIREBASE_SERVICE_ACCOUNT_JSON:JSON.stringify({type:'service_account',project_id:'wrong-project'})}}),/project mismatch/);
});
