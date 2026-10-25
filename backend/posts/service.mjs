import {randomUUID} from 'node:crypto';

const bad=(reason,code='INVALID_POST')=>Object.assign(new Error(reason),{code});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const keys=(value,fields)=>!!value&&typeof value==='object'&&!Array.isArray(value)
  &&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).every(field=>fields.includes(field));
const controls=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;

export function validatePostInput(data) {
  // Author identity is derived from the verified session.
  if(!keys(data,['title','text','clientRequestId','mediaIds'])
    ||(data.title!==undefined&&typeof data.title!=='string')
    ||typeof data.text!=='string'
    ||typeof data.clientRequestId!=='string'
    ||!uuid.test(data.clientRequestId))throw bad('Invalid post fields.');
  const title=(data.title||'').trim(),text=data.text.trim();
  if([...title].length>140||controls.test(title))throw bad('Title must be 140 characters or fewer.');
  if(!text||[...text].length>2000||controls.test(text))throw bad('Description must be 1–2000 characters.');
  if(data.mediaIds!==undefined&&(!Array.isArray(data.mediaIds)||data.mediaIds.length>4||data.mediaIds.some(id=>!uuid.test(id))||new Set(data.mediaIds).size!==data.mediaIds.length))throw bad('Choose up to four attachments.');
  return {title,text,clientRequestId:data.clientRequestId,mediaIds:data.mediaIds||[]};
}
function parseCursor(value) {
  if(!value)return null;
  if(typeof value!=='string'||value.length>256||!/^[A-Za-z0-9_-]+$/.test(value))throw bad('Invalid cursor.');
  try{
    const row=JSON.parse(Buffer.from(value,'base64url').toString('utf8'));
    if(!keys(row,['createdAt','id'])||Object.keys(row).length!==2
      ||typeof row.createdAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(row.createdAt)
      ||!uuid.test(row.id))throw Error();
    return row;
  }catch{throw bad('Invalid cursor.');}
}
const encodeCursor=post=>Buffer.from(JSON.stringify({createdAt:post.createdAt,id:post.id})).toString('base64url');

export function createPostsService(db,{now=()=>new Date().toISOString(),ids=randomUUID}={}) {
  const media=id=>db.prepare('SELECT m.id FROM home_post_media pm JOIN home_media m ON m.id=pm.media_id WHERE pm.post_id=? ORDER BY pm.position').all(id).map(m=>({id:m.id,url:'/api/v1/home-media/'+m.id}));
  const byRequest=db.prepare('SELECT id,title,body AS text FROM home_posts WHERE author_id=? AND client_request_id=?');
  const byId=db.prepare('SELECT p.id,p.author_id AS authorId,u.display_name AS authorName,p.title,p.body AS text,p.created_at AS createdAt FROM home_posts p JOIN users u ON u.id=p.author_id WHERE p.id=?');
  const decorate=p=>p?{...p,media:media(p.id)}:p;
  const timeline=db.prepare('SELECT p.id,p.author_id AS authorId,u.display_name AS authorName,p.title,p.body AS text,p.created_at AS createdAt FROM home_posts p JOIN users u ON u.id=p.author_id WHERE (? IS NULL OR p.created_at<? OR (p.created_at=? AND p.id<?)) ORDER BY p.created_at DESC,p.id DESC LIMIT 21');
  return Object.freeze({
    get(userId,id,{admin=false}={}) {
      if(!userId)throw bad('Sign in required.');
      if(typeof id!=='string'||!uuid.test(id))throw bad('Post not found.','POST_NOT_FOUND');
      const post=byId.get(id);
      if(!post)throw bad('Post not found.','POST_NOT_FOUND');
      return {...decorate(post),replyCount:db.prepare('SELECT COUNT(*) AS total FROM feed_replies WHERE post_id=?').get(post.id).total};
    },
    list(userId,{admin=false,cursor=''}={}) {
      if(!userId)throw bad('Sign in required.');
      const previous=parseCursor(cursor);
      const rows=timeline.all(previous?.createdAt??null,previous?.createdAt??null,previous?.createdAt??null,previous?.id??null);
      const posts=rows.slice(0,20).map(decorate);
      return {posts,nextCursor:rows.length>20?encodeCursor(posts.at(-1)):null};
    },
    create(userId,data,{admin=false}={}) {
      if(!userId)throw bad('Sign in required.');
      if(!admin)throw bad('Only Comos administrators can publish posts.','POST_FORBIDDEN');
      const input=validatePostInput(data);
      const existing=byRequest.get(userId,input.clientRequestId);
      if(existing) {
        if(existing.text!==input.text||existing.title!==input.title)
          throw bad('This request ID was used for a different post.','POST_CONFLICT');
        if(JSON.stringify(media(existing.id).map(m=>m.id))!==JSON.stringify(input.mediaIds))throw bad('Attachment retry conflict.','POST_CONFLICT');
        return decorate(byId.get(existing.id));
      }
      for(const mediaId of input.mediaIds)if(!db.prepare('SELECT 1 FROM home_media WHERE id=? AND owner_id=? AND NOT EXISTS(SELECT 1 FROM home_post_media WHERE media_id=?)').get(mediaId,userId,mediaId))throw bad('Attachment unavailable.');
      const id=ids();db.exec('BEGIN IMMEDIATE');
      try{
        db.prepare('INSERT INTO feed_posts(id,author_id,client_request_id,body,created_at,title) VALUES(?,?,?,?,?,?)').run(id,userId,input.clientRequestId,input.text,now(),input.title);
        input.mediaIds.forEach((m,i)=>db.prepare('INSERT INTO home_post_media VALUES(?,?,?)').run(id,m,i));db.exec('COMMIT');
      }catch(error){db.exec('ROLLBACK');throw error;}
      return decorate(byId.get(id));
    },
    remove(userId,id) {
      if(!userId)throw bad('Sign in required.');
      if(typeof id!=='string'||!uuid.test(id))throw bad('Invalid post ID.');
      const removed=db.prepare('DELETE FROM feed_posts WHERE id=? AND author_id=?').run(id,userId);
      if(!removed.changes)throw bad('Post not found.','POST_NOT_FOUND');
      return true;
    },
  });
}
