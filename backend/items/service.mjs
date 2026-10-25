const invalid=message=>Object.assign(new Error(message),{code:'INVALID_ITEM'});
const conflict=()=>Object.assign(new Error('This item changed. Reload before saving.'),{code:'REVISION_CONFLICT'});
const validId=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
const record=row=>row?{id:row.id,name:row.name,sourceId:row.source_id,sourceVersion:row.source_version,category:row.category,archived:Boolean(row.archived),schemaVersion:row.schema_version,revision:row.revision,createdAt:row.created_at,updatedAt:row.updated_at,...('description' in row?{description:row.description}:{})}:null;
export function createItemsService(db){
 const get=id=>{if(!validId(id))throw invalid('Invalid item ID.');return record(db.prepare('SELECT * FROM items WHERE id=?').get(id));};
 function list({q='',sourceId='',cursor='',archived=false}={}){
  if(typeof q!=='string'||q.length>80||typeof sourceId!=='string'||(sourceId&&!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(sourceId))||(cursor&&!validId(cursor))||typeof archived!=='boolean')throw invalid('Invalid item search.');
  const columns='id,name,source_id,source_version,category,archived,schema_version,revision,created_at,updated_at';
  const filter=sourceId?' AND source_id=?':'';
  const params=[Number(archived),cursor,q,...(sourceId?[sourceId]:[])];
  const rows=db.prepare(`SELECT ${columns} FROM items WHERE archived=? AND id>? AND instr(lower(name),lower(?))>0${filter} ORDER BY id LIMIT 21`).all(...params);
  return {items:rows.slice(0,20).map(record),nextCursor:rows.length>20?rows[19].id:null};
 }
 function save(data){
  if(!data||typeof data!=='object'||Array.isArray(data)||!validId(data.id)||!Number.isSafeInteger(data.revision)||data.revision<0)throw invalid('Invalid item change.');
  const fields=data.op==='save'?['op','id','revision','name','sourceId','sourceVersion','category','description']:data.op==='archive'?['op','id','revision','archived']:[];
  if(!fields.length||Object.keys(data).some(k=>!fields.includes(k)))throw invalid('Invalid item fields.');
  const values={};
  if(data.op==='save'){
   for(const [field,max,required] of [['name',80,true],['category',40,false],['description',4000,false]]){
    const value=data[field]??'';
    if(typeof value!=='string'||value.length>max||(required&&!value.trim())||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)||(field!=='description'&&/[\r\n\t]/u.test(value)))throw invalid(`Enter a valid ${field} (up to ${max} characters).`);
    values[field]=value.trim();
   }
   for(const field of ['sourceId','sourceVersion']){
    if(typeof data[field]!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(data[field]))throw invalid('Source ID and version must use 1–64 letters, numbers, dots, dashes or underscores.');values[field]=data[field];
   }
  }else if(typeof data.archived!=='boolean'||data.revision<1)throw invalid('Invalid archive change.');
  db.exec('BEGIN IMMEDIATE');
  try{
   const old=get(data.id),now=new Date().toISOString();
   if(data.revision===0&&data.op==='save'){
    if(old){if(old.revision!==1||old.archived||Object.entries(values).some(([k,v])=>old[k]!==v))throw conflict();}
    else db.prepare('INSERT INTO items(id,name,source_id,source_version,category,description,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(data.id,values.name,values.sourceId,values.sourceVersion,values.category,values.description,now,now);
   }else{
    if(!old||old.revision!==data.revision)throw conflict();
    if(data.op==='save')db.prepare('UPDATE items SET name=?,source_id=?,source_version=?,category=?,description=?,revision=revision+1,updated_at=? WHERE id=?').run(values.name,values.sourceId,values.sourceVersion,values.category,values.description,now,data.id);
    else db.prepare('UPDATE items SET archived=?,revision=revision+1,updated_at=? WHERE id=?').run(Number(data.archived),now,data.id);
   }
   const item=get(data.id);db.exec('COMMIT');return item;
  }catch(error){db.exec('ROLLBACK');throw error;}
 }
 return {get,list,save};
}
