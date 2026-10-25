import { randomUUID } from 'node:crypto';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=(code,message)=>Object.assign(new Error(message),{code});
const plain=(value,allowed)=>value && typeof value==='object' && !Array.isArray(value)
  && Object.getPrototypeOf(value)===Object.prototype && Object.keys(value).every(key=>allowed.includes(key));

export function validateReply(data) {
  if(!plain(data,['text','clientRequestId'])||typeof data.text!=='string'||typeof data.clientRequestId!=='string'||!uuid.test(data.clientRequestId))
    throw fail('INVALID_REPLY','Invalid reply.');
  const text=data.text.trim();
  if(!text||[...text].length>2000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text))
    throw fail('INVALID_REPLY','Reply must be 1–2000 characters.');
  return {text,clientRequestId:data.clientRequestId};
}
function parseCursor(value) {
  if(!value)return null;
  if(typeof value!=='string'||value.length>256||!/^[A-Za-z0-9_-]+$/.test(value))throw fail('INVALID_REPLY','Invalid reply cursor.');
  try{
    const row=JSON.parse(Buffer.from(value,'base64url').toString('utf8'));
    if(!plain(row,['createdAt','id'])||Object.keys(row).length!==2||typeof row.createdAt!=='string'
      ||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(row.createdAt)||!uuid.test(row.id))throw Error();
    return row;
  }catch{throw fail('INVALID_REPLY','Invalid reply cursor.');}
}
const encodeCursor=row=>Buffer.from(JSON.stringify({createdAt:row.createdAt,id:row.id})).toString('base64url');

export function createRepliesService(db,{posts,now=()=>new Date().toISOString(),ids=randomUUID}={}) {
  if(typeof posts?.get!=='function')throw new TypeError('Authorized post reader required.');
  const lookup=db.prepare(`SELECT r.id,r.post_id AS postId,r.author_id AS authorId,u.display_name AS authorName,
    r.body AS text,r.created_at AS createdAt FROM feed_replies r JOIN users u ON u.id=r.author_id WHERE r.id=?`);
  const prior=db.prepare('SELECT id,post_id AS postId,body AS text FROM feed_replies WHERE author_id=? AND client_request_id=?');
  const page=db.prepare(`SELECT r.id,r.post_id AS postId,r.author_id AS authorId,u.display_name AS authorName,
    r.body AS text,r.created_at AS createdAt FROM feed_replies r JOIN users u ON u.id=r.author_id
    WHERE r.post_id=? AND (? IS NULL OR r.created_at<? OR (r.created_at=? AND r.id<?))
    ORDER BY r.created_at DESC,r.id DESC LIMIT 21`);
  return Object.freeze({
    list(userId,postId,{admin=false,cursor=''}={}) {
      // Never reveal existence, count, or contents until a member can read the parent post.
      posts.get(userId,postId,{admin});
      const previous=parseCursor(cursor);
      const rows=page.all(postId,previous?.createdAt??null,previous?.createdAt??null,previous?.createdAt??null,previous?.id??null);
      const replies=rows.slice(0,20);
      return {replies,nextCursor:rows.length>20?encodeCursor(replies.at(-1)):null};
    },
    create(userId,postId,data,{admin=false}={}) {
      posts.get(userId,postId,{admin});
      const value=validateReply(data);
      const old=prior.get(userId,value.clientRequestId);
      if(old){
        if(old.postId!==postId||old.text!==value.text)throw fail('REPLY_CONFLICT','Request ID reused for another reply.');
        return lookup.get(old.id);
      }
      const id=ids();
      db.prepare('INSERT INTO feed_replies(id,post_id,author_id,client_request_id,body,created_at) VALUES(?,?,?,?,?,?)')
        .run(id,postId,userId,value.clientRequestId,value.text,now());
      return lookup.get(id);
    },
    remove(userId,replyId) {
      if(!userId||typeof replyId!=='string'||!uuid.test(replyId))throw fail('REPLY_NOT_FOUND','Reply not found.');
      const deleted=db.prepare('DELETE FROM feed_replies WHERE id=? AND author_id=?').run(replyId,userId);
      if(!deleted.changes)throw fail('REPLY_NOT_FOUND','Reply not found.');
      return true;
    },
  });
}