import {randomUUID} from 'node:crypto';
import {adminSession,adminJson} from '../auth/admin-requests.mjs';
import {createAuthThrottle} from '../auth/throttle.mjs';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=(code,message,status=400)=>Object.assign(new Error(message),{code,status});
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
const badChars=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;
function validateText(value,max,label){
 if(typeof value!=='string')throw fail('invalid_lore',label+' is required.');
 const text=value.replace(/\r\n?/g,'\n').trim();
 if(!text||[...text].length>max||badChars.test(text))throw fail('invalid_lore',label+' must be 1–'+max+' characters.');
 return text;
}
function validateTagIds(ids){
 if(!Array.isArray(ids)||ids.length>20||ids.some(id=>typeof id!=='string'||!uuid.test(id)))throw fail('invalid_tags','Choose at most 20 valid character tags.');
 const unique=[...new Set(ids)];
 if(unique.length!==ids.length)throw fail('invalid_tags','Remove duplicate tags.');
 return unique.sort();
}
function cursorEncode(row){return Buffer.from(JSON.stringify({title:row.title,id:row.id})).toString('base64url');}
function cursorDecode(raw){
 if(!raw)return null;
 if(typeof raw!=='string'||raw.length>400)throw fail('invalid_cursor','Invalid Lore cursor.');
 try{
  const result=JSON.parse(Buffer.from(raw,'base64url').toString('utf8'));
  if(!plain(result)||typeof result.title!=='string'||result.title.length>140||typeof result.id!=='string'||!uuid.test(result.id))throw Error('Invalid');
  return result;
 }catch{throw fail('invalid_cursor','Invalid Lore cursor.');}
}
export function createLoreService(db,{now=()=>new Date().toISOString(),ids=randomUUID}={}){
 const allowed=db.prepare('SELECT 1 FROM character_tag_links l JOIN characters c ON c.id=l.character_id WHERE c.owner_id=? AND c.archived=0 AND l.tag_id=? LIMIT 1');
 const read=db.prepare('SELECT l.id,l.title,l.body AS text,l.author_id AS authorId,u.display_name AS authorName,l.created_at AS createdAt,l.updated_at AS updatedAt FROM lore_entries l JOIN users u ON u.id=l.author_id WHERE l.id=?');
 const tags=db.prepare('SELECT t.id,t.name FROM lore_entry_tags l JOIN character_tags t ON t.id=l.tag_id WHERE l.entry_id=? ORDER BY t.name COLLATE NOCASE,t.id');
 const get=id=>{const entry=read.get(id);return entry?{...entry,tags:tags.all(id)}:null;};
 const owns=(ownerId,tagIds)=>tagIds.every(tag=>allowed.get(ownerId,tag));
 return Object.freeze({
  get,
  list(ownerId,{query='',tagIds=[],cursor='',limit=40}={}){
   if(!ownerId)throw fail('sign_in_required','Sign in to browse Lore.',401);
   if(typeof query!=='string'||[...query].length>120||badChars.test(query))throw fail('invalid_query','Search is too long.');
   const selected=validateTagIds(tagIds);
   if(!owns(ownerId,selected))throw fail('tag_not_available','Only tags from your active characters are available.',403);
   if(!Number.isInteger(limit)||limit<1||limit>40)throw fail('invalid_query','Invalid page size.');
   const after=cursorDecode(cursor),where=[],args=[];
   if(query.trim()){where.push('(instr(lower(l.title),lower(?))>0 OR instr(lower(l.body),lower(?))>0)');args.push(query.trim(),query.trim());}
   if(selected.length){where.push('EXISTS (SELECT 1 FROM lore_entry_tags lt WHERE lt.entry_id=l.id AND lt.tag_id IN ('+selected.map(()=>'?').join(',')+'))');args.push(...selected);}
   if(after){where.push('(l.title COLLATE NOCASE > ? COLLATE NOCASE OR (l.title COLLATE NOCASE = ? COLLATE NOCASE AND l.id>?))');args.push(after.title,after.title,after.id);}
   const sql='SELECT l.id,l.title,l.updated_at AS updatedAt FROM lore_entries l WHERE '+(where.length?where.join(' AND '):'1=1')+' ORDER BY l.title COLLATE NOCASE ASC,l.id ASC LIMIT ?';
   const rows=db.prepare(sql).all(...args,limit+1);
   const entries=rows.slice(0,limit).map(row=>({...row,tags:tags.all(row.id)}));
   return {entries,nextCursor:rows.length>limit?cursorEncode(rows[limit-1]):null};
  },
  create(ownerId,input){
   if(!ownerId)throw fail('sign_in_required','Sign in to publish Lore.',401);
   if(!plain(input)||Object.keys(input).some(key=>!['title','text','tagIds','clientRequestId'].includes(key)))throw fail('invalid_lore','Invalid Lore fields.');
   const title=validateText(input.title,140,'Title'),body=validateText(input.text,10000,'Description');
   const tagIds=validateTagIds(input.tagIds??[]);
   if(typeof input.clientRequestId!=='string'||!uuid.test(input.clientRequestId))throw fail('invalid_lore','Invalid publishing request.');
   db.exec('BEGIN IMMEDIATE');
   try{
    if(!owns(ownerId,tagIds))throw fail('tag_not_available','Only tags from your active characters can be added.',403);
    const prior=db.prepare('SELECT id,title,body FROM lore_entries WHERE author_id=? AND client_request_id=?').get(ownerId,input.clientRequestId);
    if(prior){
     const existing=tags.all(prior.id).map(t=>t.id).sort();
     if(prior.title!==title||prior.body!==body||JSON.stringify(existing)!==JSON.stringify(tagIds))throw fail('duplicate_request','This publishing request already saved different Lore.',409);
     db.exec('COMMIT');return get(prior.id);
    }
    const id=ids(),date=now();
    db.prepare('INSERT INTO lore_entries(id,author_id,client_request_id,title,body,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(id,ownerId,input.clientRequestId,title,body,date,date);
    const link=db.prepare('INSERT INTO lore_entry_tags(entry_id,tag_id) VALUES(?,?)');
    for(const tag of tagIds)link.run(id,tag);
    db.exec('COMMIT');return get(id);
   }catch(error){db.exec('ROLLBACK');throw error;}
  }
 });
}
export function createLoreRoutes({db,sessions,origin,throttle=createAuthThrottle()}){
 const lore=createLoreService(db);
 return async(req,res,pathname,send)=>{
  const collection=pathname==='/api/v1/lore',id=pathname.startsWith('/api/v1/lore/')?pathname.slice('/api/v1/lore/'.length):null;
  if(!collection&&id===null)return false;
  const method=req.method;
  if(!(collection&&['GET','POST'].includes(method)||id&&method==='GET')){
   res.setHeader('Allow',collection?'GET, POST':'GET');send(405,{error:'method_not_allowed'});return true;
  }
  if(method==='POST'&&(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')){
   send(403,{error:'origin_not_allowed'});return true;
  }
  const permit=throttle.enter(req.socket?.remoteAddress||'unknown',method==='GET'?'restore':'profile');
  if(!permit.allowed){res.setHeader('Retry-After',String(permit.retryAfter));send(429,{error:'too_many_requests'});return true;}
  try{
   const session=await adminSession(req,sessions,new Set());
   if(!session){send(401,{error:'sign_in_required'});return true;}
   if(collection&&method==='POST'){
    if(session.user.profileState!=='complete'){send(403,{error:'profile_required'});return true;}
    const data=await adminJson(req,16000);
    send(201,{entry:lore.create(session.user.id,data)});
   }else if(id!==null){
    if(!uuid.test(id)){send(404,{error:'not_found'});return true;}
    const entry=lore.get(id);
    send(entry?200:404,entry?{entry}:{error:'not_found'});
   }else{
    const params=new URL(req.url,origin).searchParams;
    if([...params.keys()].some(key=>!['query','tagId','cursor'].includes(key))){send(400,{error:'invalid_query'});return true;}
    const result=lore.list(session.user.id,{query:params.get('query')||'',tagIds:params.getAll('tagId'),cursor:params.get('cursor')||''});
    send(200,result);
   }
  }catch(error){
   const status=error.status||error.httpStatus||503;
   send(status,{error:error.code||error.error||'service_unavailable',message:status===503?'Lore is temporarily unavailable.':error.message});
  }finally{permit.release();}
  return true;
 };
}
