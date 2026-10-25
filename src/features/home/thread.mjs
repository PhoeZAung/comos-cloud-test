// Only called after server membership checks (or isolated Ghost fixture reads).
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const stamp=value=>{
  const time=Date.parse(value);
  if(!Number.isFinite(time))return {iso:'',label:'Recently'};
  const date=new Date(time);
  return {iso:date.toISOString(),label:new Intl.DateTimeFormat('en-US',{dateStyle:'medium'}).format(date)};
};
const initials=name=>Array.from(String(name||'Comos member').trim().split(/\s+/).slice(0,2).map(x=>[...x][0]||'').join('')).slice(0,2).join('').toUpperCase()||'✦';
function messageCard(record,kind,viewerId){
  const name=String(record.authorName||'Comos member');
  const when=stamp(record.createdAt);
  const own=kind==='reply'&&viewerId&&record.authorId===viewerId;
  return `<article class="comos-thread-entry comos-thread-${kind}">
    <div class="comos-post-avatar" aria-hidden="true">${esc(initials(name))}</div>
    <div class="comos-post-main"><div class="comos-post-header"><strong>${esc(name)}</strong><time${when.iso?` datetime="${esc(when.iso)}"`:''}>${esc(when.label)}</time></div>
      <p class="comos-post-text">${esc(record.text)}</p>
      ${own?`<button type="button" class="comos-post-delete" data-reply-delete="${esc(record.id)}">Delete reply</button>`:''}
    </div></article>`;
}
export function renderPostThread({post,replies=[],viewerId='',nextCursor=null,more=false,loading=false}={}) {
  if(!post||typeof post!=='object'||!Array.isArray(replies))throw new TypeError('A post and reply list are required.');
  return `<section class="comos-thread" aria-label="Post and replies">
    <a class="back" href="home.html">← Home</a>
    <h1 class="comos-thread-title">Post</h1>
    ${messageCard(post,'original',viewerId)}
    <div class="comos-thread-replies"><h2>Replies</h2>
      ${replies.length?replies.map(reply=>messageCard(reply,'reply',viewerId)).join(''):'<p class="comos-thread-empty">No replies yet.</p>'}
      ${more||nextCursor?`<button type="button" class="button" data-more-replies ${loading?'disabled':''}>Show more replies</button>`:''}
    </div>
    <form data-reply-form class="comos-reply-form"><label for="comos-reply-text">Write a reply</label>
      <textarea id="comos-reply-text" name="text" maxlength="2000" rows="3" required placeholder="Write a reply…"></textarea>
      <div class="comos-reply-bottom"><span data-reply-count>0 / 2000</span><button type="submit" class="button primary" data-reply-submit disabled>Reply</button></div>
      <p class="comos-reply-status" role="status" data-reply-status></p>
    </form></section>`;
}
export function renderThreadUnavailable(message='Post not available.') {
  return `<section class="comos-thread"><a class="back" href="home.html">← Home</a><p class="comos-thread-empty" role="status">${esc(message)}</p></section>`;
}