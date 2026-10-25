const invalid=message=>Object.assign(new Error(message),{code:'INVALID_CHARACTER'});
const conflict=()=>Object.assign(new Error('This character changed. Reload before saving.'),{code:'REVISION_CONFLICT'});
const validId=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
const record=row=>row?{id:row.id,ownerId:row.owner_id,ownerName:row.owner_name,name:row.name,sources:JSON.parse(row.sources_json),archived:Boolean(row.archived),schemaVersion:row.schema_version,revision:row.revision,createdAt:row.created_at,updatedAt:row.updated_at}:null;
export function createCharactersService(db){
 const get=id=>record(db.prepare('SELECT c.*,u.display_name AS owner_name FROM characters c JOIN users u ON u.id=c.owner_id WHERE c.id=?').get(id));
 function players({q='',userId=''}={}){
  if(typeof q!=='string'||q.length>80||typeof userId!=='string'||userId.length>128)throw invalid('Invalid player search.');
  const rows=db.prepare('SELECT id,display_name AS displayName FROM users WHERE instr(lower(display_name),lower(?))>0 OR id=? ORDER BY display_name,id LIMIT 51').all(q,q);
  const selectedUser=userId?db.prepare('SELECT id,display_name AS displayName FROM users WHERE id=?').get(userId):null;
  return {users:rows.slice(0,50),moreUsers:rows.length>50,selectedUser:selectedUser||null};
 }
 function list({q='',cursor='',archived=false}={}){
  if(typeof q!=='string'||q.length>80||(cursor&&!validId(cursor))||typeof archived!=='boolean')throw invalid('Invalid character search.');
  const rows=db.prepare('SELECT c.*,u.display_name AS owner_name FROM characters c JOIN users u ON u.id=c.owner_id WHERE c.archived=? AND c.id>? AND instr(lower(c.name),lower(?))>0 ORDER BY c.id LIMIT 21').all(Number(archived),cursor,q);
  return {characters:rows.slice(0,20).map(record),nextCursor:rows.length>20?rows[19].id:null};
 }
 function save(data){
  if(!data||typeof data!=='object'||Array.isArray(data)||!validId(data.id)||!Number.isSafeInteger(data.revision)||data.revision<0)throw invalid('Invalid character change.');
  const fields=data.op==='save'?['op','id','revision','name','ownerId','sources']:data.op==='archive'?['op','id','revision','archived']:[];
  if(!fields.length||Object.keys(data).some(k=>!fields.includes(k)))throw invalid('Invalid character fields.');
  let name,sources;
  if(data.op==='save'){
   if(typeof data.name!=='string'||!data.name.trim()||data.name.trim().length>80||/[\u0000-\u001f\u007f]/u.test(data.name))throw invalid('Enter a name of 1–80 characters.');name=data.name.trim();
   if(typeof data.ownerId!=='string'||!db.prepare('SELECT 1 FROM users WHERE id=?').get(data.ownerId))throw invalid('Choose an existing player.');
   if(!Array.isArray(data.sources)||data.sources.length>10)throw invalid('Choose up to ten sources.');
   const seen=new Set();sources=data.sources.map(s=>{
    if(!s||typeof s!=='object'||Array.isArray(s)||Object.keys(s).some(k=>!['id','version'].includes(k))||!['id','version'].every(k=>typeof s[k]==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(s[k]))||seen.has(s.id))throw invalid('Each source needs a unique ID and a version (letters, numbers, dots, dashes or underscores).');seen.add(s.id);return {id:s.id,version:s.version};
   });
  }else if(typeof data.archived!=='boolean'||data.revision<1)throw invalid('Invalid archive change.');
  db.exec('BEGIN IMMEDIATE');
  try{
   const old=get(data.id),now=new Date().toISOString();
   if(data.revision===0&&data.op==='save'){
    // Client-generated stable IDs make a lost-response retry idempotent.
    if(old){if(old.revision!==1||old.name!==name||old.ownerId!==data.ownerId||JSON.stringify(old.sources)!==JSON.stringify(sources)||old.archived)throw conflict();}
    else db.prepare('INSERT INTO characters(id,owner_id,name,sources_json,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(data.id,data.ownerId,name,JSON.stringify(sources),now,now);
   }else{
    if(!old||old.revision!==data.revision)throw conflict();
    if(data.op==='save')db.prepare('UPDATE characters SET name=?,owner_id=?,sources_json=?,revision=revision+1,updated_at=? WHERE id=?').run(name,data.ownerId,JSON.stringify(sources),now,data.id);
    else db.prepare('UPDATE characters SET archived=?,revision=revision+1,updated_at=? WHERE id=?').run(Number(data.archived),now,data.id);
   }
   const result=get(data.id);db.exec('COMMIT');return result;
  }catch(error){db.exec('ROLLBACK');throw error;}
 }
 return {list,players,save};
}
