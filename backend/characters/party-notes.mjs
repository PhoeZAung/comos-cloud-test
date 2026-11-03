import * as Y from 'yjs';
import {adminSession,adminJson} from '../auth/admin-requests.mjs';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const bad=(status,message)=>Object.assign(Error(message),{httpStatus:status});
const maxState=512*1024,maxText=24000;
export function createPartyNotesRoutes({db,sessions,adminUids,origin}){
 const admins=new Set(adminUids),listeners=new Map(),counts=new Map();
 const read=db.prepare('SELECT state,revision FROM party_notes WHERE tag_id=?');
 const membership=db.prepare("SELECT t.id,t.name FROM character_tags t JOIN character_tag_links l ON l.tag_id=t.id JOIN characters c ON c.id=l.character_id WHERE t.id=? AND t.kind='party' AND c.id=? AND c.archived=0 AND (?=1 OR c.owner_id=?)");
 const allowed=(session,tagId,characterId)=>membership.get(tagId,characterId,Number(session.admin),session.user.id);
 const snapshot=id=>{const row=read.get(id);return {update:Buffer.from(row?.state||[0,0]).toString('base64'),revision:row?.revision||0};};
 return async(req,res,path,send)=>{
  if(!path.startsWith('/api/v1/party-notes/'))return false;
  try{
   if(!['GET','POST'].includes(req.method))throw bad(405,'Method not allowed.');
   if(req.method==='POST'&&req.headers.origin!==origin)throw bad(403,'Origin not allowed.');
   const session=await adminSession(req,sessions,admins);if(!session)throw bad(401,'Sign in to open party notes.');
   const id=path.slice('/api/v1/party-notes/'.length),url=new URL(req.url,origin),characterId=url.searchParams.get('characterId');
   if(!uuid.test(id)||!uuid.test(characterId||'')||[...url.searchParams.keys()].some(key=>!['characterId','stream','revision'].includes(key)))throw bad(400,'Invalid party notes.');
   const tag=allowed(session,id,characterId);if(!tag)throw bad(404,'Party notes unavailable.');
   if(req.method==='GET'&&url.searchParams.get('stream')==='1'){
    const key=session.user.id,count=counts.get(key)||0;if(count>=4)throw bad(429,'Too many open notes.');counts.set(key,count+1);
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();
    let ended=false;const write=payload=>{if(ended)return;if(!allowed(session,id,characterId)){res.write('event: access-removed\ndata: {}\n\n');close();return;}if(res.write('data: '+JSON.stringify(payload)+'\n\n')===false)close();};
    const close=()=>{if(ended)return;ended=true;clearInterval(heartbeat);clearTimeout(expiry);listeners.get(id)?.delete(write);if(!listeners.get(id)?.size)listeners.delete(id);const remaining=(counts.get(key)||1)-1;if(remaining)counts.set(key,remaining);else counts.delete(key);res.end();};
    const heartbeat=setInterval(()=>{try{if(!allowed(session,id,characterId)){res.write('event: access-removed\ndata: {}\n\n');close();}else res.write(': keepalive\n\n');}catch{close();}},1000),expiry=setTimeout(close,25000);
    if(!listeners.has(id))listeners.set(id,new Set());listeners.get(id).add(write);res.on('close',close);write({...snapshot(id),name:tag.name});return true;
   }
   if(req.method==='GET'){const row=read.get(id);send(200,url.searchParams.get('revision')===String(row?.revision||0)?{unchanged:true,revision:row?.revision||0}:{...snapshot(id),name:tag.name});return true;}
   const data=await adminJson(req,710000);
   // The request body is asynchronous: permissions may have changed while it arrived.
   if(!allowed(session,id,characterId))throw bad(404,'Party notes unavailable.');
   if(!data||Object.keys(data).join(',')!=='update'||typeof data.update!=='string'||data.update.length>700000||data.update.length%4)throw bad(400,'Invalid notes update.');
   const update=Buffer.from(data.update,'base64');if(update.toString('base64')!==data.update)throw bad(400,'Invalid notes update.');if(!update.length||update.length>maxState)throw bad(413,'Notes update is too large.');
   let revision,changed=false;const doc=new Y.Doc();
   db.exec('BEGIN IMMEDIATE');try{
    const previous=read.get(id);doc.getText('notes');if(previous)Y.applyUpdate(doc,previous.state);
    Y.applyUpdate(doc,update);
    if(doc.share.size!==1||!doc.share.has('notes')||doc.getText('notes').length>maxText||doc.getText('notes').toDelta().some(part=>typeof part.insert!=='string'||part.attributes)||doc.getSubdocs().size)throw bad(400,'Use up to 24,000 characters of plain text.');
    const state=Buffer.from(Y.encodeStateAsUpdate(doc));if(state.length>maxState)throw bad(413,'Party notes are too large.');
    revision=previous?.revision||0;changed=!previous||!state.equals(Buffer.from(previous.state));
    if(changed){revision++;db.prepare('INSERT INTO party_notes(tag_id,state,revision,updated_at) VALUES(?,?,?,?) ON CONFLICT(tag_id) DO UPDATE SET state=excluded.state,revision=excluded.revision,updated_at=excluded.updated_at').run(id,state,revision,new Date().toISOString());}
    db.exec('COMMIT');
   }catch(error){db.exec('ROLLBACK');throw error;}finally{doc.destroy();}
   if(changed)for(const listener of [...(listeners.get(id)||[])]){try{listener({update:data.update,revision});}catch{/* Other editors still receive their update. */}}
   send(200,{revision});
  }catch(error){if(res.headersSent)res.end();else send(error.httpStatus||400,{error:'party_notes_error',message:error.httpStatus?error.message:'Could not save party notes.'});}
  return true;
 };
}
