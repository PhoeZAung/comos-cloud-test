import {renderAuthorAvatar} from './avatar.mjs';
// The post and its replies are loaded only after server authorization.
import {relativePostTime} from './time.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const stamp=(value,now)=>{
  const time=Date.parse(value);
  return Number.isFinite(time)?{iso:new Date(time).toISOString(),label:relativePostTime(value,now)}:{iso:'',label:'Recently'};
};
function messageCard(record,kind,viewerId,now,{depth=0,parentName=''}={}){
  const name=String(record.authorName||'Comos member');
  const when=stamp(record.createdAt,now);
  const own=kind==='reply'&&viewerId&&record.authorId===viewerId;
  return `<article class="comos-thread-entry comos-thread-${kind}"${kind==="reply"?` style="--reply-depth:${Math.min(depth,3)}"`:""}>
    ${renderAuthorAvatar(record)}
    <div class="comos-post-main"><div class="comos-post-header"><strong>${esc(name)}</strong><time${when.iso?` datetime="${esc(when.iso)}" data-relative-post`:''}>${esc(when.label)}</time></div>
      ${kind==="reply"&&record.parentReplyId?`<p class="comos-reply-context">↳ Replying to ${esc(parentName||"another reply")}</p>`:""}
      <p class="comos-post-text">${esc(record.text)}</p>
      ${(record.media||[]).filter(m=>typeof m.url==='string'&&(m.url.startsWith('/api/v1/home-media/')||m.url.startsWith('blob:'))).map(m=>`<img class="post-image" loading="lazy" src="${esc(m.url)}" alt="Post attachment">`).join('')}
      ${kind==="reply"?`<button type="button" class="comos-reply-to" data-reply-to="${esc(record.id)}">Reply</button>`:""}
      ${own?`<button type="button" class="comos-post-delete" data-reply-delete="${esc(record.id)}">Delete reply</button>`:""}
    </div></article>`;
}
function nestedReplies(replies,viewerId,now){
  const byId=new Map(replies.map(r=>[r.id,r]));
  const children=new Map(),roots=[];
  for(const reply of replies){
    const parent=byId.get(reply.parentReplyId);
    if(parent&&parent.id!==reply.id){const group=children.get(parent.id)||[];group.push(reply);children.set(parent.id,group);}
    else roots.push(reply);
  }
  const rendered=new Set();
  function visit(reply,depth){
    if(rendered.has(reply.id))return '';
    rendered.add(reply.id);
    const parent=byId.get(reply.parentReplyId);
    return messageCard(reply,'reply',viewerId,now,{depth,parentName:parent?.authorName})+
      (children.get(reply.id)||[]).map(child=>visit(child,depth+1)).join('');
  }
  return roots.map(reply=>visit(reply,0)).join('')+replies.filter(r=>!rendered.has(r.id)).map(reply=>visit(reply,0)).join('');
}
export function renderPostThread({post,replies=[],viewerId='',nextCursor=null,more=false,loading=false,replyTarget=null,now=Date.now()}={}) {
  if(!post||typeof post!=='object'||!Array.isArray(replies))throw new TypeError('A post and reply list are required.');
  const title=String(post.title||'').trim();
  return `<section class="comos-thread" aria-label="Post and replies">
    <a class="back" href="home.html">← Home</a>
    <h1 class="comos-thread-title">${esc(title||'Post')}</h1>
    ${messageCard(post,'original',viewerId,now)}
    <div class="comos-thread-replies"><h2>Replies</h2>
      ${replies.length?nestedReplies(replies,viewerId,now):'<p class="comos-thread-empty">No replies yet.</p>'}
      ${more||nextCursor?`<button type="button" class="button" data-more-replies ${loading?'disabled':''}>Show more replies</button>`:''}
    </div>
    <form data-reply-form class="comos-reply-form"><label for="comos-reply-text">${replyTarget?`Replying to ${esc(replyTarget.authorName||"a member")}`:"Write a reply"}</label>
      ${replyTarget?`<button class="comos-reply-cancel" type="button" data-cancel-reply>× Cancel reply-to</button>`:""}
      <textarea id="comos-reply-text" name="text" maxlength="2000" rows="3" required placeholder="Write a reply…"></textarea>
      <div class="comos-reply-bottom"><span data-reply-count>0 / 2000</span><button type="submit" class="button primary" data-reply-submit disabled>Reply</button></div>
      <p class="comos-reply-status" role="status" data-reply-status></p>
    </form></section>`;
}
export function renderThreadUnavailable(message='Post not available.') {
  return `<section class="comos-thread"><a class="back" href="home.html">← Home</a><p class="comos-thread-empty" role="status">${esc(message)}</p></section>`;
}
