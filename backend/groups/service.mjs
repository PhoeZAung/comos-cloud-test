import {randomUUID} from 'node:crypto';
const invalid=message=>Object.assign(new Error(message),{code:'INVALID_GROUP'});
function name(value){if(typeof value!=='string'||!value.trim()||value.trim().length>80||/[\u0000-\u001f\u007f]/u.test(value))throw invalid('Enter a name of 1–80 characters.');return value.trim();}
export function createGroupsService(db){
 const revision=()=>db.prepare('SELECT revision FROM group_state WHERE id=1').get().revision;
 const worlds=()=>db.prepare('SELECT id,name FROM worlds ORDER BY created_at,id').all();
 const parties=()=>db.prepare('SELECT id,world_id AS worldId,name FROM parties ORDER BY name,id').all();
 function snapshot({q='',userId=''}={}){
  if(typeof q!=='string'||q.length>80||typeof userId!=='string'||userId.length>128)throw invalid('Invalid search.');
  const users=db.prepare('SELECT id,display_name AS displayName FROM users WHERE instr(lower(display_name),lower(?))>0 OR id=? ORDER BY display_name,id LIMIT 51').all(q,q);
  const selected=userId||users[0]?.id;
  const user=selected?db.prepare('SELECT id,display_name AS displayName FROM users WHERE id=?').get(selected):null;
  return {revision:revision(),worlds:worlds(),parties:parties(),users:users.slice(0,50),moreUsers:users.length>50,selectedUser:user||null,
   memberships:user?{worldIds:db.prepare('SELECT world_id AS id FROM world_memberships WHERE user_id=?').all(user.id).map(r=>r.id),partyIds:db.prepare('SELECT party_id AS id FROM party_memberships WHERE user_id=?').all(user.id).map(r=>r.id)}:{worldIds:[],partyIds:[]}};
 }
 function update(data){
  if(!data||typeof data!=='object'||Array.isArray(data)||!Number.isSafeInteger(data.revision))throw invalid('Invalid change.');
  const fields={world:['revision','op','id','name'],party:['revision','op','id','worldId','name'],memberships:['revision','op','userId','worldIds','partyIds']}[data.op];
  if(!fields||Object.keys(data).some(k=>!fields.includes(k)))throw invalid('Invalid fields.');
  db.exec('BEGIN IMMEDIATE');
  try{
   if(data.revision!==revision())throw Object.assign(new Error('Groups changed. Reload before saving.'),{code:'REVISION_CONFLICT'});
   if(data.op==='world'){
    const value=name(data.name);
    if(data.id){if(!db.prepare('SELECT id FROM worlds WHERE id=?').get(data.id))throw invalid('World not found.');db.prepare('UPDATE worlds SET name=? WHERE id=?').run(value,data.id);}
    else {if(worlds().length>=4)throw invalid('The four worlds are configured. Rename an existing world.');db.prepare('INSERT INTO worlds VALUES(?,?,?)').run(randomUUID(),value,new Date().toISOString());}
   }else if(data.op==='party'){
    const value=name(data.name);if(!db.prepare('SELECT id FROM worlds WHERE id=?').get(data.worldId))throw invalid('Select a world.');
    if(data.id){const old=db.prepare('SELECT world_id FROM parties WHERE id=?').get(data.id);if(!old||old.world_id!==data.worldId)throw invalid('An existing party must stay in its world.');db.prepare('UPDATE parties SET name=? WHERE id=?').run(value,data.id);}
    else {if(parties().length>=200)throw invalid('Party limit reached.');db.prepare('INSERT INTO parties VALUES(?,?,?,?)').run(randomUUID(),data.worldId,value,new Date().toISOString());}
   }else{
    if(!db.prepare('SELECT id FROM users WHERE id=?').get(data.userId))throw invalid('Select a player.');
    for(const [key,max] of [['worldIds',4],['partyIds',200]])if(!Array.isArray(data[key])||data[key].length>max||data[key].some(id=>typeof id!=='string')||new Set(data[key]).size!==data[key].length)throw invalid('Invalid memberships.');
    for(const id of data.worldIds)if(!db.prepare('SELECT id FROM worlds WHERE id=?').get(id))throw invalid('Unknown world.');
    for(const id of data.partyIds){const party=db.prepare('SELECT world_id FROM parties WHERE id=?').get(id);if(!party||!data.worldIds.includes(party.world_id))throw invalid('Party access requires membership in its world.');}
    db.prepare('DELETE FROM party_memberships WHERE user_id=?').run(data.userId);db.prepare('DELETE FROM world_memberships WHERE user_id=?').run(data.userId);
    for(const id of data.worldIds)db.prepare('INSERT INTO world_memberships VALUES(?,?)').run(data.userId,id);
    for(const id of data.partyIds)db.prepare('INSERT INTO party_memberships VALUES(?,?)').run(data.userId,id);
   }
   db.prepare('UPDATE group_state SET revision=revision+1,updated_at=? WHERE id=1').run(new Date().toISOString());db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
 }
 return {snapshot,update,
  canView(userId,scope){
   if(!scope?.worldId||!db.prepare('SELECT 1 FROM world_memberships WHERE user_id=? AND world_id=?').get(userId,scope.worldId))return false;
   if(scope.playerId&&scope.playerId!==userId)return false;
   if(scope.partyId&&!db.prepare('SELECT 1 FROM party_memberships m JOIN parties p ON p.id=m.party_id WHERE m.user_id=? AND p.id=? AND p.world_id=?').get(userId,scope.partyId,scope.worldId))return false;
   return true;
  }
 };
}
