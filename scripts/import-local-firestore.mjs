// One-account restore into the explicitly isolated Windows development database.
// No Firebase Admin client, account changes, or production database access.
import { readFile, mkdir, cp, writeFile } from 'node:fs/promises';
import { DatabaseSync, backup } from 'node:sqlite';
import { randomUUID, createHash } from 'node:crypto';
import path from 'node:path';
import { createUserRepository } from '../backend/repositories/users.mjs';
import { createAccountService } from '../backend/account/service.mjs';
import { createFileStore } from '../backend/media/filesystem.mjs';

const [source, mode] = process.argv.slice(2);
if (!source || !['--check', '--apply'].includes(mode)) throw Error('Usage: node scripts/import-local-firestore.mjs BACKUP.json --check|--apply');
const state = path.join(process.env.USERPROFILE, '.cosmos-dev');
const dataDir = path.join(state, 'data');
const raw = await readFile(source);
const input = JSON.parse(raw);
if (input.projectId !== 'mount-aetheria' || !Array.isArray(input.collections?.users)) throw Error('Expected the Mount Aetheria Firestore backup.');
const db = new DatabaseSync(path.join(dataDir, 'comos.sqlite'), {readOnly:mode==='--check'});
db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
try {
  const identities = db.prepare("SELECT user_id,subject FROM external_identities WHERE provider='firebase' AND issuer='https://securetoken.google.com/mount-aetheria'").all();
  if (identities.length !== 1) throw Error('Expected exactly one signed-in local account. Choose an account explicitly before using this importer with multiple users.');
  const identity = identities[0];
  const profile = input.collections.users.find(u=>u.id===identity.subject);
  if (!profile || !Array.isArray(profile.subcollections?.characters)) throw Error('No matching backed-up profile/character collection.');
  const users = createUserRepository(db);
  const currentUser = users.get(identity.user_id);
  const displayName = profile.data?.displayName;
  if (typeof displayName !== 'string' || !displayName.trim() || displayName.length>80 || /[\u0000-\u001f\u007f]/.test(displayName)) throw Error('Invalid backup display name.');
  // Legacy sheets can exceed the UI file-import limit; retain their full content.
  // Apply field/depth validation and a separate bounded backup-record size limit.
  function validate(value, depth=0) {
    if(depth>30)throw Error('Backup nesting exceeds the supported limit.');
    if(Array.isArray(value)){if(value.length>10000)throw Error('Oversized backup array.');for(const item of value)validate(item,depth+1);}
    else if(value && typeof value==='object')for(const [key,item] of Object.entries(value)){
      if(['__proto__','constructor','prototype'].includes(key))throw Error('Unsafe backup field.');
      validate(item,depth+1);
    }
  }
  const seen = new Set();
  const characters = profile.subcollections.characters.map(c=>{
    if(typeof c.id!=='string'||!c.id||seen.has(c.id)||!c.data||typeof c.data!=='object'||Array.isArray(c.data))throw Error('Invalid/duplicate backup character.');
    seen.add(c.id); validate(c.data);
    if(Buffer.byteLength(JSON.stringify(c.data))>2000000)throw Error('Oversized backup character.');
    const data=structuredClone(c.data);
    if(Array.isArray(data.group_tags))data.group_tags=data.group_tags.filter(t=>typeof t==='string'&&t.trim().toLowerCase()!=='admin');
    const name=String(data.charName||data.name||'').trim();
    if(!name||name.length>80||/[\u0000-\u001f\u007f]/.test(name))throw Error('Invalid character name.');
    const legacyKey=identity.subject+'/'+c.id;
    const existing=db.prepare('SELECT character_id FROM character_details WHERE legacy_key=?').get(legacyKey);
    return {name,data,legacyKey,existing};
  });
  console.log(JSON.stringify({profile:displayName,backupExportedAt:input.exportedAt,characters:characters.map(c=>({name:c.name,alreadyImported:!!c.existing})),mode}));
  if(mode==='--apply'){
    const snapshot=path.join(state,'backups','before-firestore-import-'+new Date().toISOString().replace(/[:.]/g,'-'));
    await mkdir(snapshot,{recursive:true});
    await backup(db,path.join(snapshot,'comos.sqlite'));
    await cp(path.join(dataDir,'media'),path.join(snapshot,'media'),{recursive:true});
    const imported=[];
    db.exec('BEGIN IMMEDIATE');
    try{
      if(currentUser.profileState==='incomplete')users.completeProfile(currentUser.id,displayName,currentUser.revision);
      for(const c of characters){
        if(c.existing)continue;
        const id=randomUUID(),now=new Date().toISOString();
        db.prepare('INSERT INTO characters(id,owner_id,name,sources_json,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(id,currentUser.id,c.name,'[]',now,now);
        db.prepare('INSERT INTO character_details(character_id,data_json,legacy_key) VALUES(?,?,?)').run(id,JSON.stringify(c.data),c.legacyKey);
        for(const label of (Array.isArray(c.data.group_tags)?c.data.group_tags:[])){
          const name=label.trim();if(!name||name.length>80||/[\u0000-\u001f\u007f]/.test(name))continue;
          let tag=db.prepare('SELECT id FROM character_tags WHERE name=? COLLATE NOCASE').get(name);
          if(!tag){tag={id:randomUUID()};db.prepare('INSERT INTO character_tags(id,name) VALUES(?,?)').run(tag.id,name);}
          db.prepare('INSERT OR IGNORE INTO character_tag_links(character_id,tag_id) VALUES(?,?)').run(id,tag.id);
        }
        imported.push({id,name:c.name});
      }
      db.exec('COMMIT');
    }catch(error){db.exec('ROLLBACK');throw error;}
    let avatar='not present in backup';
    if(users.get(currentUser.id).avatarMediaId)avatar='existing local avatar preserved';
    else if(typeof profile.data.pfp==='string'){
      try{
        const url=new URL(profile.data.pfp);
        if(url.protocol!=='https:'||url.hostname!=='firebasestorage.googleapis.com')throw Error('unsupported host');
        const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)});
        if(!response.ok)throw Error('unavailable');
        let total=0;const chunks=[];
        for await(const chunk of response.body){total+=chunk.length;if(total>3*1024*1024)throw Error('oversized');chunks.push(chunk);}
        const account=createAccountService({db,files:await createFileStore(path.join(dataDir,'media'))});
        await account.uploadAvatar(currentUser.id,Buffer.concat(chunks),response.headers.get('content-type')?.split(';')[0],users.get(currentUser.id).revision);
        avatar='restored as a local image';
      }catch{avatar='not restored: backup image URL unavailable or unsupported';}
    }
    const integrity=db.prepare('PRAGMA integrity_check').get().integrity_check;
    if(integrity!=='ok'||db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Post-import database validation failed; snapshot: '+snapshot);
    for(const c of characters){
      const stored=db.prepare('SELECT c.owner_id,d.data_json FROM character_details d JOIN characters c ON c.id=d.character_id WHERE d.legacy_key=?').get(c.legacyKey);
      if(!stored||stored.owner_id!==currentUser.id||(!c.existing&&stored.data_json!==JSON.stringify(c.data)))throw Error('Character verification failed.');
    }
    const report={sourceSha256:createHash('sha256').update(raw).digest('hex'),backupExportedAt:input.exportedAt,imported,avatar,integrity,snapshot};
    await writeFile(path.join(snapshot,'import-report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));
  }
}finally{db.close();}
