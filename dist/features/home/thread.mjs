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
  return `<article class="comos-thread-entry comos-thread-${kind}"${kind==="reply"?` style="--reply-depth:${Math.min(depth,8)}"`:""}>
    ${renderAuthorAvatar(record)}
    <div class="comos-post-main"><div class="comos-post-header"><strong>${esc(name)}</strong><time${when.iso?` datetime="${esc(when.iso)}" data-relative-post`:''}>${esc(when.label)}</time></div>
      ${kind==="reply"&&record.parentReplyId?`<p class="comos-reply-context">↳ Replying to ${esc(parentName||"another reply")}</p>`:""}
      <p class="comos-post-text">${esc(record.text)}</p>
      ${(record.media||[]).filter(m=>typeof m.url==='string'&&(m.url.startsWith('/api/v1/home-media/')||m.url.startsWith('blob:'))).map(m=>`<img class="post-image" loading="lazy" src="${esc(m.url)}" alt="Post attachment">`).join('')}
      ${kind==="reply"?`<button type="button" class="comos-reply-to" data-reply-to="${esc(record.id)}">Reply</button>`:""}
      ${own?`<button type="button" class="comos-post-delete" data-reply-delete="${esc(record.id)}">Delete reply</button>`:""}
    </div></article>`;
}
function replyComposer(replyTarget=null){
  return `<form data-reply-form class="comos-reply-form"><label for="comos-reply-text">${replyTarget?`Replying to ${esc(replyTarget.authorName||"a member")}`:"Write a reply"}</label>
      ${replyTarget?`<button class="comos-reply-cancel" type="button" data-cancel-reply>× Cancel reply-to</button>`:""}
      <textarea id="comos-reply-text" name="text" maxlength="2000" rows="3" required placeholder="Write a reply…"></textarea>
      <div class="comos-reply-bottom"><span data-reply-count>0 / 2000</span><button type="submit" class="button primary" data-reply-submit disabled>Reply</button></div>
      <p class="comos-reply-status" role="status" data-reply-status></p>
    </form>`;
}
function nestedReplies(replies,viewerId,now,replyTarget=null,collapsedIds=[]){
  const byId=new Map(replies.map(reply=>[reply.id,reply]));
  const children=new Map(),roots=[];
  // Keep API order (newest first) within each branch, rather than letting
  // recently posted deep replies break away from their parent thread.
  for(const reply of replies){
    const parent=byId.get(reply.parentReplyId);
    if(parent&&parent.id!==reply.id){
      const group=children.get(parent.id)||[];
      group.push(reply);children.set(parent.id,group);
    }else roots.push(reply);
  }
  const rendered=new Set(),collapsed=new Set(collapsedIds);
  function descendantCount(reply,visited=new Set()){
    if(visited.has(reply.id))return 0;
    visited.add(reply.id);
    return (children.get(reply.id)||[]).reduce((total,child)=>total+1+descendantCount(child,visited),0);
  }
  function visit(reply,depth){
    if(rendered.has(reply.id))return '';
    rendered.add(reply.id);
    const parent=byId.get(reply.parentReplyId);
    const direct=children.get(reply.id)||[];
    const descendantTotal=direct.length?descendantCount(reply):0;
    const isCollapsed=descendantTotal>0&&collapsed.has(reply.id);
    const descendants=direct.map(child=>visit(child,depth+1)).join('');
    // On small screens, stop shifting the text farther right after depth 3;
    // guide lines and "Replying to" labels still show the true relationship.
    const guide=descendants?'<div class="comos-reply-children" id="comos-branch-'+esc(reply.id)+'" style="--step-wide:'+(depth<5?1:0)+';--step-small:'+(depth<3?1:0)+'" role="group" aria-label="Replies to '+esc(reply.authorName||'comment')+'" '+(isCollapsed?'hidden':'')+'>'+descendants+'</div>':'';
    const toggle=descendantTotal?'<button type="button" class="comos-thread-collapse" data-collapse-thread="'+esc(reply.id)+'" aria-expanded="'+(!isCollapsed)+'" aria-controls="comos-branch-'+esc(reply.id)+'" aria-label="'+(isCollapsed?'Expand':'Collapse')+' replies to '+esc(reply.authorName||'comment')+'">'+(isCollapsed?'＋ Show ':'− Hide ')+descendantTotal+' '+(descendantTotal===1?'reply':'replies')+'</button>':'';
    return '<div class="comos-reply-branch'+(depth?' has-parent':'')+'" data-reply-branch="'+esc(reply.id)+'" data-reply-level="'+depth+'">'+
      messageCard(reply,'reply',viewerId,now,{depth,parentName:parent?.authorName||reply.parentAuthorName||''})+
      (replyTarget?.id===reply.id?'<div class="comos-reply-inline">'+replyComposer(replyTarget)+'</div>':'')+
      toggle+guide+'</div>';
  }
  return roots.map(reply=>visit(reply,0)).join('')+
    replies.filter(reply=>!rendered.has(reply.id)).map(reply=>visit(reply,0)).join('');
}
export function renderPostThread({post,replies=[],viewerId='',nextCursor=null,more=false,loading=false,replyTarget=null,collapsedIds=[],now=Date.now()}={}) {
  if(!post||typeof post!=='object'||!Array.isArray(replies))throw new TypeError('A post and reply list are required.');
  const title=String(post.title||'').trim();
  return `<section class="comos-thread" aria-label="Post and replies">
    <a class="back" href="home.html">← Home</a>
    <h1 class="comos-thread-title">${esc(title||'Post')}</h1>
    ${messageCard(post,'original',viewerId,now)}
    <div class="comos-thread-replies"><h2>Replies</h2>
      ${replies.length?nestedReplies(replies,viewerId,now,replyTarget,collapsedIds):'<p class="comos-thread-empty">No replies yet.</p>'}
      ${more||nextCursor?`<button type="button" class="button" data-more-replies ${loading?'disabled':''}>Show more replies</button>`:''}
    </div>
    ${replyTarget?"":replyComposer()}</section>`;
}
export function renderThreadUnavailable(message='Post not available.') {
  return `<section class="comos-thread"><a class="back" href="home.html">← Home</a><p class="comos-thread-empty" role="status">${esc(message)}</p></section>`;
}
