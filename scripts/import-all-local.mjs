import {readFile,mkdir,cp,writeFile} from 'node:fs/promises';
import {DatabaseSync,backup} from 'node:sqlite';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
import {importDirectory} from '../backend/import/legacy.mjs';
const state=path.join(process.env.USERPROFILE,'.cosmos-dev');
const folder=process.argv[2];
if(!folder)throw Error('Pass the backup folder.');
const firestore=JSON.parse(await readFile(path.join(folder,'mount-aetheria-firestore.json'),'utf8'));
const accounts=JSON.parse(await readFile(path.join(folder,'mount-aetheria-users.json'),'utf8'));
if(firestore.projectId!=='mount-aetheria'||!Array.isArray(accounts.users)||!Array.isArray(firestore.collections.users))throw Error('Invalid backup.');
const payload={users:firestore.collections.users.map(u=>({uid:u.id,displayName:u.data?.displayName})),characters:firestore.collections.users.flatMap(u=>(u.subcollections?.characters||[]).map(c=>({uid:u.id,legacyId:c.id,data:c.data})))};
const db=new DatabaseSync(path.join(state,'data','comos.sqlite'));db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
try{
 const snapshot=path.join(state,'backups','before-all-users-'+new Date().toISOString().replace(/[:.]/g,'-'));await mkdir(snapshot,{recursive:true});
 await backup(db,path.join(snapshot,'comos.sqlite'));await cp(path.join(state,'data','media'),path.join(snapshot,'media'),{recursive:true});
 // The adapter lists backed-up identities only; it never contacts or modifies Firebase.
 await importDirectory({db,projectId:'mount-aetheria',auth:{async listUsers(){return {users:accounts.users.map(u=>({uid:u.localId,displayName:u.displayName}))};}},env:{COMOS_LEGACY_IMPORT_PARTS:'1',COMOS_LEGACY_IMPORT_0:gzipSync(JSON.stringify(payload)).toString('base64')}});
 const report={users:db.prepare('SELECT count(*) n FROM users').get().n,characters:db.prepare('SELECT count(*) n FROM characters').get().n,integrity:db.prepare('PRAGMA integrity_check').get().integrity_check,foreignKeyErrors:db.prepare('PRAGMA foreign_key_check').all().length,snapshot};
 if(report.integrity!=='ok'||report.foreignKeyErrors)throw Error('Import verification failed.');
 await writeFile(path.join(snapshot,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{db.close();}
