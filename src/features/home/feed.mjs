// Home renders authored posts only; all names and text are escaped.
import {relativePostTime} from './time.mjs';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const validDate = value => Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
export function pageFeed(posts,{offset=0,limit=6}={}) {
  if (!Array.isArray(posts)) throw new TypeError('Feed posts must be an array');
  const start=Number.isSafeInteger(offset)&&offset>=0?offset:0;
  const size=Number.isSafeInteger(limit)&&limit>0&&limit<=20?limit:6;
  const sorted=[...posts].sort((a,b)=>validDate(b.createdAt)-validDate(a.createdAt)||String(b.id??'').localeCompare(String(a.id??'')));
  return {items:sorted.slice(start,start+size),total:sorted.length,offset:start,hasPrevious:start>0,hasNext:start+size<sorted.length,pageSize:size};
}
function postMarkup(post,viewerId='',now=Date.now()) {
  const name=String(post.authorName || 'Comos member');
  const initials=name.trim().split(/\s+/u).slice(0,2).map(s=>Array.from(s)[0]||'').join('').toUpperCase()||'✦';
  const timestamp=validDate(post.createdAt)?new Date(post.createdAt).toISOString():'';
  const id=encodeURIComponent(String(post.id ?? ''));
  const title=String(post.title ?? '').trim();
  const own=Boolean(viewerId && post.authorId===viewerId);
  return `<article class="comos-post" aria-label="Post by ${escapeHtml(name)}">
    <div class="comos-post-avatar" aria-hidden="true">${escapeHtml(initials)}</div>
    <div class="comos-post-main">
      <a class="comos-post-link" href="post.html?id=${escapeHtml(id)}" aria-label="Open post${title?' — '+escapeHtml(title):' by '+escapeHtml(name)}">
        <div class="comos-post-header"><strong>${escapeHtml(name)}</strong><time${timestamp?` datetime="${timestamp}" data-relative-post`:''}>${escapeHtml(relativePostTime(post.createdAt,now))}</time></div>
        ${title?`<h2 class="comos-post-title">${escapeHtml(title)}</h2>`:''}
        <p class="comos-post-text comos-post-excerpt">${escapeHtml(post.text)}</p>
        <span class="comos-post-read-more">Open post · Reply</span>
      </a>
      ${own?`<button type="button" class="comos-post-delete" data-delete-post="${escapeHtml(post.id)}">Delete</button>`:''}
    </div></article>`;
}
export function renderHomeFeed({posts=[],preview=false,offset=0,pageSize=6,state='ready',viewerId='',nextCursor=null,signedOut=false,canPost=false,now=Date.now()}={}) {
  const states=new Set(['ready','loading','empty','error']);
  if(!states.has(state))throw new Error('Unknown feed state');
  if(!Array.isArray(posts))throw new TypeError('Posts must be an array');
  const page=preview?pageFeed(posts,{offset,limit:pageSize}):null;
  const items=preview?page.items:posts;
  const notices={loading:'Loading posts…',error:'Posts could not be loaded. Try again.',empty:'No posts to show yet.'};
  const showPosts=state==='ready'&&items.length>0;
  const message=state!=='ready'?notices[state]:signedOut?'Sign in to see posts.':'No posts to show yet.';
  return `<section class="comos-feed" aria-labelledby="comos-feed-title">
    <div class="comos-feed-heading"><h1 id="comos-feed-title">Home</h1></div>
    <div class="comos-feed-stream" aria-live="polite" aria-busy="${state==='loading'}">
      ${showPosts?items.map(post=>postMarkup(post,viewerId,now)).join(''):`<div class="comos-feed-empty" role="status"><p>${escapeHtml(message)}</p>${signedOut?'<a class="button primary" href="signin.html">Sign in</a>':''}</div>`}
    </div>
    ${showPosts&&(preview?page.hasNext:!!nextCursor)?'<div class="comos-feed-pagination"><button type="button" data-feed-more>Show more posts</button></div>':''}
    ${canPost?'<a class="fab" href="compose.html" aria-label="Write a post">+</a>':''}
  </section>`;
}