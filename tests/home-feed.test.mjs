import test from 'node:test';
import assert from 'node:assert/strict';
import {renderHomeFeed,pageFeed} from '../src/features/home/feed.mjs';
const posts=Array.from({length:9},(_,i)=>({id:`fixture:post:${i+1}`,authorName:`Explorer ${i}`,createdAt:new Date(Date.UTC(2026,9,24-i)).toISOString(),text:`Post ${i}`,scopeLabel:'World 01'}));
test('Step 5.1 timeline sorts newest first with stable cursor-style pages',()=>{
  const shuffled=[...posts].reverse();const page=pageFeed(shuffled,{limit:4});assert.equal(page.total,9);assert.equal(page.items[0].id,'fixture:post:1');assert.equal(page.items[3].id,'fixture:post:4');assert.equal(page.hasNext,true);
  const later=pageFeed(shuffled,{limit:4,offset:4});assert.deepEqual(later.items.map(x=>x.id),posts.slice(4,8).map(x=>x.id));assert.equal(later.hasPrevious,true);
});
test('Step 5.1 renders a timeline only, without old world dashboard content',()=>{
  const markup=renderHomeFeed({posts:posts.slice(0,2),preview:true});assert.match(markup,/comos-post/);assert.match(markup,/aria-labelledby="comos-feed-title"/);assert.doesNotMatch(markup,/cosmos-hero|cosmos-world-grid|Continue exploring|Latest activity|Explore worlds/);
  assert.match(markup,/compose.html/);
});
test('Step 5.1 escapes human-authored text and excludes old persona metadata',()=>{
  const markup=renderHomeFeed({posts:[{id:'fixture:x',authorName:'<img onerror=alert(1)>',persona:'<script>x</script>',scopeLabel:'World <secret>',text:'<svg/onload=alert(1)>',createdAt:'bad'}],preview:true});
  assert.doesNotMatch(markup,/<script>|<svg|<img onerror/);
  assert.match(markup,/&lt;svg/);
  assert.match(markup,/&lt;img/);
  assert.doesNotMatch(markup,/&lt;script&gt;|&lt;secret&gt;|comos-post-persona/);
});
test('Step 5.1 never renders fabricated posts in live empty state',()=>{
  const live=renderHomeFeed();assert.match(live,/No posts to show yet/);assert.doesNotMatch(live,/comos-post-main|Ghost preview|Astra Vale/);
  for(const state of ['loading','empty','error'])assert.match(renderHomeFeed({posts,state}),/role="status"/);
});