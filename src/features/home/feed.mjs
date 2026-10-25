// Step 5.1: presentation-only feed. The API must authorize and scope records server-side.
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const validDate = value => Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
const pageLimit = value => Number.isSafeInteger(value) && value > 0 && value <= 20 ? value : 6;

export function pageFeed(posts, {offset=0,limit=6}={}) {
  if (!Array.isArray(posts)) throw new TypeError('Feed posts must be an array');
  const start = Number.isSafeInteger(offset) && offset >= 0 ? offset : 0;
  const size = pageLimit(limit);
  const sorted = [...posts].sort((a,b)=>validDate(b.createdAt)-validDate(a.createdAt) || String(b.id ?? '').localeCompare(String(a.id ?? '')));
  return {items:sorted.slice(start,start+size),total:sorted.length,offset:start,hasPrevious:start>0,hasNext:start+size<sorted.length,pageSize:size};
}

function postMarkup(post) {
  const name=String(post.authorName || 'Explorer');
  const initials=name.trim().split(/\s+/u).slice(0,2).map(s=>s.codePointAt(0)?String.fromCodePoint(s.codePointAt(0)):'' ).join('').toUpperCase() || '✦';
  const date=validDate(post.createdAt) ? new Date(post.createdAt).toISOString() : '';
  const dateLabel=date ? new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(date)) : 'Recently';
  return `<article class="comos-post" aria-label="Post by ${escapeHtml(name)}">
    <div class="comos-post-avatar" aria-hidden="true">${escapeHtml(initials)}</div>
    <div class="comos-post-main"><div class="comos-post-header"><strong>${escapeHtml(name)}</strong>${post.persona ? `<span class="comos-post-persona">${escapeHtml(post.persona)}</span>` : ''}<time${date?` datetime="${date}"`:''}>${escapeHtml(dateLabel)}</time></div>
    ${post.scopeLabel?`<div class="comos-post-scope">${escapeHtml(post.scopeLabel)}</div>`:''}
    <p class="comos-post-text">${escapeHtml(post.text)}</p>
    <a class="comos-post-reply" href="post.html" aria-label="Open post preview by ${escapeHtml(name)}"><span aria-hidden="true">↪</span> Replies ${Number.isSafeInteger(post.replyCount) && post.replyCount>=0 ? post.replyCount : 0}</a>
    </div></article>`;
}

export function renderHomeFeed({posts=[],preview=false,offset=0,pageSize=6,state='ready'}={}) {
  const states=new Set(['ready','loading','empty','error']);
  if (!states.has(state)) throw new Error('Unknown feed state');
  const page=pageFeed(posts,{offset,limit:pageSize});
  const notices={loading:'Loading posts…',error:'The feed could not be loaded. Please try again.',empty:'No posts to show yet.'};
  const showPosts=state==='ready' && page.total>0;
  const message=state!=='ready'?notices[state]:(!page.total?'No posts to show yet.':'');
  return `<section class="comos-feed" aria-labelledby="comos-feed-title">
    <div class="comos-feed-heading"><h1 id="comos-feed-title">Home</h1><span class="comos-feed-phase">5.1 · FEED</span></div>
    ${preview?'<p class="comos-feed-preview" role="note">Ghost preview · Everything below is fictional sample content.</p>':''}
    <div class="comos-feed-stream" aria-live="polite" aria-busy="${state==='loading'}">
      ${showPosts?page.items.map(postMarkup).join(''):`<div class="comos-feed-empty" role="status"><span aria-hidden="true">✧</span><p>${escapeHtml(message)}</p>${!preview&&state==='ready'?'<small>Posts from your worlds and parties will appear here when the scoped feed API is ready.</small>':''}</div>`}
    </div>
    ${showPosts&&(page.hasPrevious||page.hasNext)?`<nav class="comos-feed-pagination" aria-label="Feed pages"><button type="button" data-feed-page="prev" ${page.hasPrevious?'':'disabled'}>Newer</button><span>${Math.floor(page.offset/page.pageSize)+1} / ${Math.ceil(page.total/page.pageSize)}</span><button type="button" data-feed-page="next" ${page.hasNext?'':'disabled'}>Older</button></nav>`:''}
    <a class="fab" href="compose.html" aria-label="Compose post">+</a>
  </section>`;
}