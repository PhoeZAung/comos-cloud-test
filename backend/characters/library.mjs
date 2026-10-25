import {randomUUID} from 'node:crypto';
import {adminSession,adminJson} from '../auth/admin-requests.mjs';
import {createAuthThrottle} from '../auth/throttle.mjs';
const fail=(code,message)=>Object.assign(new Error(message),{code});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const hasControls=/[\u0000-\u001f\u007f]/u;
const validPortrait=v=>typeof v==='string'&&v.length<160000&&/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(v);
function safeData(value,depth=0){
  if(depth>15)throw fail('INVALID_IMPORT','Character data is too deeply nested.');
  if(Array.isArray(value)){if(value.length>5000)throw fail('INVALID_IMPORT','Too many character entries.');return value.map(x=>safeData(x,depth+1));}
  if(plain(value)){
    const keys=Object.keys(value);if(keys.length>400)throw fail('INVALID_IMPORT','Too many character fields.');
    const out=Object.create(null);
    for(const key of keys){if(['__proto__','prototype','constructor'].includes(key)||key.length>100||hasControls.test(key))throw fail('INVALID_IMPORT','Invalid character field.');out[key]=safeData(value[key],depth+1);}
    return out;
  }
  if(typeof value==='string'){if(value.length>200000)throw fail('INVALID_IMPORT','Character text too long.');return value;}
  if(value===null||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))return value;
  throw fail('INVALID_IMPORT','Character file contains unsupported values.');
}
export function parseCharacterImport(input){
  if(!plain(input))throw fail('INVALID_IMPORT','Choose a JSON object containing character data.');
  const payload=plain(input.character)?input.character:input;
  const data=safeData(plain(payload.data)?payload.data:payload);
  const size=Buffer.byteLength(JSON.stringify(data));
  if(size>250000)throw fail('INVALID_IMPORT','Character file must be under 250 KB of data.');
  const name=String(data.charName||payload.name||data.name||'').trim();
  if(!name||name.length>80||hasControls.test(name))throw fail('INVALID_IMPORT','Character needs a name of 1–80 characters.');
  const sourceList=Array.isArray(payload.sources)?payload.sources:[];
  const sources=[];const seen=new Set();
  for(const source of sourceList.slice(0,10)){
    if(!plain(source)||!['id','version'].every(k=>typeof source[k]==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(source[k]))||seen.has(source.id))continue;
    sources.push({id:source.id,version:source.version});seen.add(source.id);
  }
  const rawTags=Array.isArray(data.group_tags)?data.group_tags:(Array.isArray(payload.tags)?payload.tags:[]);
  const tagNames=[...new Set(rawTags.filter(t=>typeof t==='string'&&t.trim()&&t.length<=80&&!hasControls.test(t)).slice(0,20).map(t=>t.trim()))];
  return {name,data,sources,tagNames};
}
const portraitFrom=data=>{for(const key of ['portrait','portraitUrl','characterImage','image','img','avatar']){const v=data[key];if(validPortrait(v))return v;}return null;};
export function createCharacterLibraryService(db){
  const page=db.prepare('SELECT c.id,c.name,c.created_at AS createdAt,c.updated_at AS updatedAt,d.data_json AS dataJson FROM characters c LEFT JOIN character_details d ON d.character_id=c.id WHERE c.owner_id=? AND c.archived=0 AND c.id>? ORDER BY c.id LIMIT 41');
  const tags=db.prepare('SELECT t.name FROM character_tags t JOIN character_tag_links l ON l.tag_id=t.id WHERE l.character_id=? ORDER BY t.name');
  const namedTag=db.prepare('SELECT id FROM character_tags WHERE name=? COLLATE NOCASE');
  const roster=row=>{
    const data=JSON.parse(row.dataJson||'{}');
    const attached=tags.all(row.id).map(t=>t.name);
    const extra=Array.isArray(data.group_tags)?data.group_tags.filter(t=>typeof t==='string'&&t.length<=80).slice(0,20):[];
    return {id:row.id,name:row.name,level:data.level||data.character_level||null,race:data.race||'',className:data.class||data.className||'',portraitUrl:portraitFrom(data),tags:attached.length?attached:extra,bio:typeof data.bio==='string'?data.bio.slice(0,280):'',createdAt:row.createdAt,updatedAt:row.updatedAt};
  };
  return Object.freeze({
    list(ownerId,cursor=''){
      if(!ownerId||cursor&&!uuid.test(cursor))throw fail('INVALID_IMPORT','Invalid character cursor.');
      const rows=page.all(ownerId,cursor);
      return {characters:rows.slice(0,40).map(roster),nextCursor:rows.length>40?rows[39].id:null};
    },
    import(ownerId,raw){
      if(!ownerId)throw fail('INVALID_IMPORT','Sign in first.');
      const character=parseCharacterImport(raw),id=randomUUID(),now=new Date().toISOString();
      db.exec('BEGIN IMMEDIATE');
      try{
        db.prepare('INSERT INTO characters(id,owner_id,name,sources_json,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(id,ownerId,character.name,JSON.stringify(character.sources),now,now);
        db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(id,JSON.stringify(character.data));
        for(const name of character.tagNames){const t=namedTag.get(name);if(t)db.prepare('INSERT OR IGNORE INTO character_tag_links(character_id,tag_id) VALUES(?,?)').run(id,t.id);}
        db.exec('COMMIT');
      }catch(error){db.exec('ROLLBACK');throw error;}
      return {id,name:character.name};
    }
  });
}
export function createCharacterLibraryRoutes({db,sessions,origin,throttle=createAuthThrottle()}){
  const service=createCharacterLibraryService(db);
  return async(req,res,pathname,send)=>{
    const list=pathname==='/api/v1/my/characters',upload=pathname==='/api/v1/my/characters/import';
    if(!list&&!upload)return false;
    if(!(list&&req.method==='GET')&&!(upload&&req.method==='POST')){res.setHeader('Allow',list?'GET':'POST');send(405,{error:'method_not_allowed'});return true;}
    if(upload&&(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')){send(403,{error:'origin_not_allowed'});return true;}
    const permit=throttle.enter(req.socket?.remoteAddress||'unknown',list?'restore':'profile');
    if(!permit.allowed){res.setHeader('Retry-After',String(permit.retryAfter));send(429,{error:'too_many_requests'});return true;}
    try{
      const session=await adminSession(req,sessions,new Set());
      if(!session){send(401,{error:'sign_in_required'});return true;}
      const userId=session.user.id;
      if(list){
        const url=new URL(req.url,origin);
        if([...url.searchParams.keys()].some(key=>key!=='cursor')){send(400,{error:'invalid_cursor'});return true;}
        send(200,service.list(userId,url.searchParams.get('cursor')||''));
      }else{
        if(session.user.profileState!=='complete'){send(403,{error:'profile_required'});return true;}
        const body=await adminJson(req,270000);
        send(201,{character:service.import(userId,body)});
      }
    }catch(error){
      if(error.httpStatus)send(error.httpStatus,{error:error.error});
      else if(error.code==='INVALID_IMPORT')send(400,{error:'invalid_import',message:error.message});
      else send(503,{error:'service_unavailable'});
    }finally{permit.release();}
    return true;
  };
}
