import {gunzipSync} from 'node:zlib';
import {randomUUID} from 'node:crypto';
import {createUserRepository,createIdentityRepository} from '../repositories/users.mjs';
import {reserveName} from '../repositories/names.mjs';
export async function importDirectory({db,auth,projectId,env=process.env}){
 for(const u of db.prepare("SELECT id,display_name FROM users WHERE display_name<>'' AND display_name_key IS NULL ORDER BY created_at,id").all())reserveName(db,u.display_name,u.id);
 const count=Number(env.COMOS_LEGACY_IMPORT_PARTS||0);if(!count)return;
 if(!Number.isInteger(count)||count<1||count>30)throw Error('Invalid private import configuration.');
 const packed=Array.from({length:count},(_,i)=>env['COMOS_LEGACY_IMPORT_'+i]||'').join('');
 const backup=JSON.parse(gunzipSync(Buffer.from(packed,'base64'),{maxOutputLength:16000000}).toString());
 if(!Array.isArray(backup.users)||!Array.isArray(backup.characters)||backup.users.length>10000||backup.characters.length>10000)throw Error('Invalid legacy import.');
 const live=[];let token;do{const page=await auth.listUsers(1000,token);live.push(...page.users);token=page.pageToken;}while(token);
 const users=createUserRepository(db),identities=createIdentityRepository(db),issuer='https://securetoken.google.com/'+projectId;let imported=0;
 db.exec('BEGIN IMMEDIATE');
 try{
  for(const account of live){const key={provider:'firebase',issuer,subject:account.uid};let id=identities.find(key);
   if(!id){id=users.create().id;identities.link(key,id);}
   const user=users.get(id);if(!user.displayName)reserveName(db,backup.users.find(u=>u.uid===account.uid)?.displayName||account.displayName||'Player',id);
  }
  for(const c of backup.characters){
   const owner=identities.find({provider:'firebase',issuer,subject:c.uid});if(!owner||!c.data||typeof c.legacyId!=='string')continue;
   const key=c.uid+'/'+c.legacyId;if(db.prepare('SELECT 1 FROM character_details WHERE legacy_key=?').get(key))continue;
   const id=randomUUID(),now=new Date().toISOString(),name=String(c.data.charName||c.data.name||'Unnamed character').slice(0,80);
   db.prepare('INSERT INTO characters(id,owner_id,name,sources_json,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(id,owner,name,'[]',now,now);
   db.prepare('INSERT INTO character_details VALUES(?,?,?)').run(id,JSON.stringify(c.data),key);
   for(const label of (Array.isArray(c.data.group_tags)?c.data.group_tags:[])){if(typeof label!=='string'||!label.trim()||label.length>80)continue;let tag=db.prepare('SELECT id FROM character_tags WHERE name=? COLLATE NOCASE').get(label.trim());if(!tag){tag={id:randomUUID()};db.prepare('INSERT INTO character_tags VALUES(?,?)').run(tag.id,label.trim());}db.prepare('INSERT OR IGNORE INTO character_tag_links VALUES(?,?)').run(id,tag.id);}
   imported++;
  }
  db.exec('COMMIT');console.info('Comos directory import: '+live.length+' accounts, '+imported+' new characters.');
 }catch(error){db.exec('ROLLBACK');throw error;}
}
