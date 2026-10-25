const unavailable=new Set(['auth/internal-error','auth/network-request-failed','app/network-error','app/network-timeout','app/invalid-credential','auth/insufficient-permission']);
export async function adminSession(req,sessions,admins){
 const prefix='__Host-comos_session=';
 const found=(req.headers.cookie||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(prefix));
 if(found.length!==1)return null;
 try{const session=await sessions.restore(found[0].slice(prefix.length));return {...session,admin:admins.has(session.subject)};}
 catch(error){if(unavailable.has(error.code))throw error;return null;}
}
export async function adminJson(req,maxBytes=24000){
 const bad=(status,error)=>Object.assign(Error(error),{httpStatus:status,error});
 if(req.headers['content-type']?.split(';')[0].trim()!=='application/json')throw bad(400,'invalid_request');
 const chunks=[];let size=0;
 for await(const chunk of req){size+=chunk.length;if(size>maxBytes)throw bad(413,'request_too_large');chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw bad(400,'invalid_request');}
}
