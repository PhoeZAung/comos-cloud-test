import {randomUUID} from 'node:crypto';

const bad=(reason,code='INVALID_POST')=>Object.assign(new Error(reason),{code});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const keys=(value,fields)=>!!value&&typeof value==='object'&&!Array.isArray(value)
  &&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).every(field=>fields.includes(field));
const controls=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;

export function validatePostInput(data) {
  // The user-facing composer has no worlds, parties, or client-chosen author.
  if(!keys(data,['title','text','clientRequestId'])
    ||(data.title!==undefined&&typeof data.title!=='string')
    ||typeof data.text!=='string'
    ||typeof data.clientRequestId!=='string'
    ||!uuid.test(data.clientRequestId))throw bad('Invalid post fields.');
  const title=(data.title||'').trim(),text=data.text.trim();
  if([...title].length>140||controls.test(title))throw bad('Title must be 140 characters or fewer.');
  if(!text||[...text].length>2000||controls.test(text))throw bad('Description must be 1–2000 characters.');
  return {title,text,clientRequestId:data.clientRequestId};
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
  const availableWorlds=db.prepare('SELECT id,name FROM worlds WHERE id IN (SELECT world_id FROM world_memberships WHERE user_id=?) ORDER BY name,id');
  const adminWorlds=db.prepare('SELECT id,name FROM worlds ORDER BY name,id');
  const availableParties=db.prepare('SELECT p.id,p.world_id AS worldId,p.name FROM parties p JOIN party_memberships m ON m.party_id=p.id WHERE m.user_id=? ORDER BY p.name,p.id');
  const adminParties=db.prepare('SELECT id,world_id AS worldId,name FROM parties ORDER BY name,id');
  const validWorld=db.prepare('SELECT 1 FROM world_memberships WHERE user_id=? AND world_id=?');
  const validParty=db.prepare('SELECT 1 FROM party_memberships m JOIN parties p ON p.id=m.party_id WHERE m.user_id=? AND p.id=? AND p.world_id=?');
  const byRequest=db.prepare('SELECT id,title,body AS text FROM feed_posts WHERE author_id=? AND client_request_id=?');
  const byId=db.prepare(`SELECT p.id,p.author_id AS authorId,u.display_name AS authorName,p.title,
    p.world_id AS worldId,w.name AS worldName,p.party_id AS partyId,pa.name AS partyName,
    p.body AS text,p.created_at AS createdAt
    FROM feed_posts p JOIN users u ON u.id=p.author_id
    LEFT JOIN worlds w ON w.id=p.world_id LEFT JOIN parties pa ON pa.id=p.party_id WHERE p.id=?`);
  // Global posts are visible to all authenticated accounts. Preserve visibility of historical scoped posts.
  const visible=(viewerId,admin,worldId,partyId)=>Boolean(admin||worldId===null||(validWorld.get(viewerId,worldId)&&(!partyId||validParty.get(viewerId,partyId,worldId))));
  const timeline=db.prepare(`SELECT p.id,p.author_id AS authorId,u.display_name AS authorName,p.title,
    p.world_id AS worldId,w.name AS worldName,p.party_id AS partyId,pa.name AS partyName,
    p.body AS text,p.created_at AS createdAt
    FROM feed_posts p JOIN users u ON u.id=p.author_id
    LEFT JOIN worlds w ON w.id=p.world_id LEFT JOIN parties pa ON pa.id=p.party_id
    WHERE (p.world_id IS NULL OR ?=1 OR EXISTS(SELECT 1 FROM world_memberships wm WHERE wm.user_id=? AND wm.world_id=p.world_id))
      AND (p.party_id IS NULL OR ?=1 OR EXISTS(SELECT 1 FROM party_memberships pm WHERE pm.user_id=? AND pm.party_id=p.party_id))
      AND (? IS NULL OR p.created_at<? OR (p.created_at=? AND p.id<?))
    ORDER BY p.created_at DESC,p.id DESC LIMIT 21`);
  return Object.freeze({
    get(userId,id,{admin=false}={}) {
      if(!userId)throw bad('Sign in required.');
      if(typeof id!=='string'||!uuid.test(id))throw bad('Post not found.','POST_NOT_FOUND');
      const post=byId.get(id);
      if(!post||!visible(userId,admin,post.worldId,post.partyId))throw bad('Post not found.','POST_NOT_FOUND');
      return {...post,replyCount:db.prepare('SELECT COUNT(*) AS total FROM feed_replies WHERE post_id=?').get(post.id).total};
    },
    scopes(userId,{admin=false}={}) {
      if(!userId)throw bad('Sign in required.');
      // Retained for backward compatibility with the existing API. The new composer does not use scopes.
      return {admin:Boolean(admin),worlds:admin?adminWorlds.all():availableWorlds.all(userId),parties:admin?adminParties.all():availableParties.all(userId)};
    },
    list(userId,{admin=false,cursor=''}={}) {
      if(!userId)throw bad('Sign in required.');
      const previous=parseCursor(cursor);
      const rows=timeline.all(Number(admin),userId,Number(admin),userId,previous?.createdAt??null,previous?.createdAt??null,previous?.createdAt??null,previous?.id??null);
      const posts=rows.slice(0,20);
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
        return byId.get(existing.id);
      }
      const id=ids();
      db.prepare('INSERT INTO feed_posts(id,author_id,client_request_id,world_id,party_id,body,created_at,title) VALUES(?,?,?,NULL,NULL,?,?,?)')
        .run(id,userId,input.clientRequestId,input.text,now(),input.title);
      return byId.get(id);
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