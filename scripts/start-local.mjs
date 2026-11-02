import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

if(Number(process.versions.node.split('.')[0])<24)throw new Error('Use START-LOCAL.cmd with the installed Node 24 runtime.');
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const state=path.join(process.env.USERPROFILE,'.cosmos-dev');
const settings=JSON.parse(await readFile(path.join(state,'settings.json'),'utf8'));
const publicConfig=JSON.parse(await readFile('public-auth.json','utf8'));
publicConfig.origin='https://localhost:4175';
const credential=JSON.parse(await readFile(path.join(state,'firebase-service-account.json'),'utf8'));
if(credential.type!=='service_account'||credential.project_id!==publicConfig.firebase.projectId)throw new Error('Firebase credential project mismatch.');
await mkdir(path.join(state,'data'),{recursive:true});
await writeFile(path.join(state,'public-auth.local.json'),JSON.stringify(publicConfig,null,2));
// Do not inherit production data paths, legacy imports, or server credentials.
for(const key of Object.keys(process.env))if(key.startsWith('COMOS_'))delete process.env[key];
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
Object.assign(process.env,{
  GOOGLE_APPLICATION_CREDENTIALS:path.join(state,'firebase-service-account.json'),
  COMOS_AUTH_MODE:'firebase', COMOS_AUTH_ORIGIN:publicConfig.origin,
  COMOS_FIREBASE_PROJECT_ID:publicConfig.firebase.projectId,
  COMOS_DATA_DIR:path.join(state,'data'),COMOS_MEDIA_ROOT:path.join(state,'data','media'),
  COMOS_LOCAL_DEVELOPMENT:'1',
});
for(const args of [['scripts/build.mjs'],['scripts/build-live.mjs',path.join(state,'public-auth.local.json')]]){
  const result=spawnSync(process.execPath,args,{stdio:'inherit',env:process.env});
  if(result.error||result.status!==0)throw new Error('Local build failed.');
}
const {startLocalServer}=await import('../backend/local.mjs');
await startLocalServer({pfx:await readFile(path.join(state,'localhost.pfx')),passphrase:settings.tlsPassphrase});
