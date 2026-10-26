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
function validateBlocks(value,fallback){
 if(value===undefined)return {blocks:[],body:validateText(fallback,10000,'Description'),imageIds:[]};
 if(!Array.isArray(value)||value.length<1||value.length>40)throw fail('invalid_blocks','Use up to 40 text or image blocks.');
 const blocks=[],imageIds=new Set();let characters=0,textBlocks=0;
 for(const block of value){
  if(!plain(block))throw fail('invalid_blocks','Invalid Lore content block.');
  if(block.type==='text'){
   if(Object.keys(block).some(key=>!['type','text'].includes(key)))throw fail('invalid_blocks','Invalid text block.');
   const text=validateText(block.text,10000,'Paragraph');
   textBlocks++;characters+=[...text].length+2;
   blocks.push({type:'text',text});
  }else if(block.type==='image'){
   if(Object.keys(block).some(key=>!['type','mediaId','alt'].includes(key))||!uuid.test(block.mediaId)||typeof block.alt!=='string'||[...block.alt].length>140||badChars.test(block.alt)||imageIds.has(block.mediaId))throw fail('invalid_blocks','Invalid Lore picture.');
   imageIds.add(block.mediaId);
   blocks.push({type:'image',mediaId:block.mediaId,alt:block.alt.trim()});
  }else throw fail('invalid_blocks','Unsupported Lore content block.');
 }
 if(!textBlocks||characters>10002||imageIds.size>12)throw fail('invalid_blocks','Add text and use at most 12 images and 10,000 characters.');
 const body=blocks.filter(b=>b.type==='text').map(b=>b.text).join('\n\n');
 if([...(body)].length>10000)throw fail('invalid_blocks','Description must be at most 10,000 characters.');
 if(fallback!==undefined&&fallback!==body)throw fail('invalid_blocks','Description does not match the text blocks.');
 return {blocks,body,imageIds:[...imageIds]};
}
function cursorEncode(row,sort){
 return Buffer.from(JSON.stringify({sort,key:sort==='az'?row.title:row.createdAt,id:row.id})).toString('base64url');
}
function cursorDecode(raw,sort){
 if(!raw)return null;
 if(typeof raw!=='string'||raw.length>500)throw fail('invalid_cursor','Invalid Lore cursor.');
 try{
  const result=JSON.parse(Buffer.from(raw,'base64url').toString('utf8'));
  if(!plain(result)||result.sort!==sort||typeof result.key!=='string'||result.key.length>140||typeof result.id!=='string'||!uuid.test(result.id))throw Error('Invalid');
  return result;
 }catch{throw fail('invalid_cursor','Invalid Lore cursor.');}
}
export function createLoreService(db,{now=()=>new Date().toISOString(),ids=randomUUID}={}){
 const allowed=db.prepare('SELECT 1 FROM character_tag_links l JOIN characters c ON c.id=l.character_id WHERE c.owner_id=? AND c.archived=0 AND l.tag_id=? LIMIT 1');
 const imageOwned=db.prepare('SELECT 1 FROM lore_images m WHERE m.id=? AND m.owner_id=? AND NOT EXISTS(SELECT 1 FROM lore_entry_images e WHERE e.image_id=m.id)');
 const read=db.prepare('SELECT l.id,l.title,l.body AS text,l.blocks_json AS blocksJson,l.author_id AS authorId,u.display_name AS authorName,l.created_at AS createdAt,l.updated_at AS updatedAt FROM lore_entries l JOIN users u ON u.id=l.author_id WHERE l.id=?');
 const tags=db.prepare('SELECT t.id,t.name FROM lore_entry_tags l JOIN character_tags t ON t.id=l.tag_id WHERE l.entry_id=? ORDER BY t.name COLLATE NOCASE,t.id');
 function blocksFor(row){
  let parsed=[];try{parsed=JSON.parse(row.blocksJson||'[]');}catch{}
  return Array.isArray(parsed)&&parsed.length?parsed.map(b=>b.type==='image'?{type:'image',url:'/api/v1/lore-images/'+encodeURIComponent(b.mediaId),alt:b.alt||'',mediaId:b.mediaId}:{type:'text',text:b.text||''}):[{type:'text',text:row.text}];
 }
 const get=id=>{const entry=read.get(id);if(!entry)return null;const {blocksJson,...safe}=entry;return {...safe,blocks:blocksFor(entry),tags:tags.all(id)};};
 const owns=(ownerId,tagIds)=>tagIds.every(tag=>allowed.get(ownerId,tag));
 return Object.freeze({
  get,
  remove(id){
   if(typeof id!=='string'||!uuid.test(id))throw fail('not_found','Lore entry not found.',404);
   // The child tag/image links are deleted with the Lore row. Published images
   // become private to their uploader again because no published Lore references them.
   return db.prepare('DELETE FROM lore_entries WHERE id=?').run(id).changes>0;
  },
  list(ownerId,{query='',tagIds=[],cursor='',limit=40,sort='newest'}={}){
   if(!ownerId)throw fail('sign_in_required','Sign in to browse Lore.',401);
   if(!['newest','az'].includes(sort))throw fail('invalid_sort','Choose Latest or A–Z sorting.');
   if(typeof query!=='string'||[...query].length>120||badChars.test(query))throw fail('invalid_query','Search is too long.');
   const selected=validateTagIds(tagIds);
   if(!owns(ownerId,selected))throw fail('tag_not_available','Only tags from your active characters are available.',403);
   if(!Number.isInteger(limit)||limit<1||limit>40)throw fail('invalid_query','Invalid page size.');
   const after=cursorDecode(cursor,sort),where=[],args=[];
   if(query.trim()){where.push('(instr(lower(l.title),lower(?))>0 OR instr(lower(l.body),lower(?))>0)');args.push(query.trim(),query.trim());}
   if(selected.length){where.push('EXISTS (SELECT 1 FROM lore_entry_tags lt WHERE lt.entry_id=l.id AND lt.tag_id IN ('+selected.map(()=>'?').join(',')+'))');args.push(...selected);}
   if(after){
    if(sort==='az'){where.push('(l.title COLLATE NOCASE > ? COLLATE NOCASE OR (l.title COLLATE NOCASE = ? COLLATE NOCASE AND l.id>?))');args.push(after.key,after.key,after.id);}
    else{where.push('(l.created_at < ? OR (l.created_at = ? AND l.id < ?))');args.push(after.key,after.key,after.id);}
   }
   const order=sort==='az'?'l.title COLLATE NOCASE ASC,l.id ASC':'l.created_at DESC,l.id DESC';
   const sql='SELECT l.id,l.title,l.created_at AS createdAt,l.updated_at AS updatedAt FROM lore_entries l WHERE '+(where.length?where.join(' AND '):'1=1')+' ORDER BY '+order+' LIMIT ?';
   const rows=db.prepare(sql).all(...args,limit+1);
   const entries=rows.slice(0,limit).map(row=>({...row,tags:tags.all(row.id)}));
   return {entries,sort,nextCursor:rows.length>limit?cursorEncode(rows[limit-1],sort):null};
  },
  create(ownerId,input){
   if(!ownerId)throw fail('sign_in_required','Sign in to publish Lore.',401);
   if(!plain(input)||Object.keys(input).some(key=>!['title','text','blocks','tagIds','clientRequestId'].includes(key)))throw fail('invalid_lore','Invalid Lore fields.');
   const title=validateText(input.title,140,'Title');
   const {blocks,body,imageIds}=validateBlocks(input.blocks,input.text);
   const tagIds=validateTagIds(input.tagIds??[]);
   if(typeof input.clientRequestId!=='string'||!uuid.test(input.clientRequestId))throw fail('invalid_lore','Invalid publishing request.');
   db.exec('BEGIN IMMEDIATE');
   try{
    if(!owns(ownerId,tagIds))throw fail('tag_not_available','Only tags from your active characters can be added.',403);
    const prior=db.prepare('SELECT id,title,body,blocks_json AS blocksJson FROM lore_entries WHERE author_id=? AND client_request_id=?').get(ownerId,input.clientRequestId);
    if(prior){
     const existing=tags.all(prior.id).map(t=>t.id).sort();
     if(prior.title!==title||prior.body!==body||prior.blocksJson!==JSON.stringify(blocks)||JSON.stringify(existing)!==JSON.stringify(tagIds))throw fail('duplicate_request','This publishing request already saved different Lore.',409);
     db.exec('COMMIT');return get(prior.id);
    }
    if(imageIds.some(id=>!imageOwned.get(id,ownerId)))throw fail('invalid_images','Use only images you uploaded that have not been published elsewhere.',403);
    const id=ids(),date=now();
    db.prepare('INSERT INTO lore_entries(id,author_id,client_request_id,title,body,created_at,updated_at,blocks_json) VALUES(?,?,?,?,?,?,?,?)').run(id,ownerId,input.clientRequestId,title,body,date,date,JSON.stringify(blocks));
    const link=db.prepare('INSERT INTO lore_entry_tags(entry_id,tag_id) VALUES(?,?)');
    for(const tag of tagIds)link.run(id,tag);
    const linkImage=db.prepare('INSERT INTO lore_entry_images(entry_id,image_id,position) VALUES(?,?,?)');
    blocks.forEach((block,index)=>{if(block.type==='image')linkImage.run(id,block.mediaId,index);});
    db.exec('COMMIT');return get(id);
   }catch(error){db.exec('ROLLBACK');throw error;}
  }
 });
}
export function createLoreRoutes({db,sessions,origin,adminUids=[],throttle=createAuthThrottle()}){
 const admins=new Set(adminUids);
 const lore=createLoreService(db);
 return async(req,res,pathname,send)=>{
  const collection=pathname==='/api/v1/lore',id=pathname.startsWith('/api/v1/lore/')?pathname.slice('/api/v1/lore/'.length):null;
  if(!collection&&id===null)return false;
  const method=req.method;
  if(!(collection&&['GET','POST'].includes(method)||id&&['GET','DELETE'].includes(method))){
   res.setHeader('Allow',collection?'GET, POST':'GET, DELETE');send(405,{error:'method_not_allowed'});return true;
  }
  if(['POST','DELETE'].includes(method)&&(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')){
   send(403,{error:'origin_not_allowed'});return true;
  }
  const permit=throttle.enter(req.socket?.remoteAddress||'unknown',method==='GET'?'restore':'profile');
  if(!permit.allowed){res.setHeader('Retry-After',String(permit.retryAfter));send(429,{error:'too_many_requests'});return true;}
  try{
   const session=await adminSession(req,sessions,admins);
   if(!session){send(401,{error:'sign_in_required'});return true;}
   if(collection&&method==='POST'){
    if(session.user.profileState!=='complete'){send(403,{error:'profile_required'});return true;}
    const data=await adminJson(req,18500);
    send(201,{entry:lore.create(session.user.id,data)});
   }else if(id!==null){
    if(!uuid.test(id)){send(404,{error:'not_found'});return true;}
    if(method==='DELETE'){
      if(!session.admin){send(403,{error:'admin_required'});return true;}
      const deleted=lore.remove(id);
      send(deleted?200:404,deleted?{deleted:true}:{error:'not_found'});
    }else{
      const entry=lore.get(id);
      send(entry?200:404,entry?{entry,canDelete:session.admin}:{error:'not_found'});
    }
   }else{
    const params=new URL(req.url,origin).searchParams;
    if([...params.keys()].some(key=>!['query','tagId','cursor','sort'].includes(key))){send(400,{error:'invalid_query'});return true;}
    const result=lore.list(session.user.id,{query:params.get('query')||'',tagIds:params.getAll('tagId'),cursor:params.get('cursor')||'',sort:params.get('sort')||'newest'});
    send(200,result);
   }
  }catch(error){
   const status=error.status||error.httpStatus||503;
   send(status,{error:error.code||error.error||'service_unavailable',message:status===503?'Lore is temporarily unavailable.':error.message});
  }finally{permit.release();}
  return true;
 };
}
