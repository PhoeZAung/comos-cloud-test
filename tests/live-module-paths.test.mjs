import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('live Home and post thread ship every transitive static relative module import',async()=>{
 const root=new URL('../',import.meta.url);execFileSync(process.execPath,['scripts/build-live.mjs','public-auth.json'],{cwd:fileURLToPath(root),stdio:'pipe'});
 const visited=new Set();
 async function inspect(url){if(visited.has(url.href))return;visited.add(url.href);assert.equal((await stat(url)).isFile(),true,url.href);const code=await readFile(url,'utf8');for(const m of code.matchAll(/from\s*['"](\.[^'"]+)['"]/g))await inspect(new URL(m[1],url));}
 await inspect(new URL('dist-live/assets/feed.mjs',root));await inspect(new URL('dist-live/assets/post-thread.mjs',root));await inspect(new URL('dist-live/assets/directory.mjs',root));await inspect(new URL('dist-live/assets/character-view.mjs',root));await inspect(new URL('dist-live/assets/sheet.mjs',root));assert.ok(visited.size>=8);
});

test('live sheet has a small isolated entry and stylesheet, without the app shell or effects',async()=>{
 const root=new URL('../',import.meta.url),html=await readFile(new URL('dist-live/sheet.html',root),'utf8');
 assert.match(html,/assets\/sheet-entry.mjs/);assert.match(html,/assets\/sheet.css/);assert.doesNotMatch(html,/src="assets\/(?:shell|auth|galaxy)/);
 const css=await readFile(new URL('dist-live/assets/sheet.css',root),'utf8');assert.ok(Buffer.byteLength(css)<40000,'standalone sheet CSS should stay below 40 KB after the equipment and inventory UI additions');assert.match(css,/data-theme="ocean"/);
 const seen=new Set();async function inspect(url){if(seen.has(url.href))return;seen.add(url.href);const code=await readFile(url,'utf8');assert.doesNotMatch(code,/firebase\/|createGalaxy|createSplash|createRouter|\/api\/v1\/(?:items|feed|lore)/);for(const m of code.matchAll(/from\s*['"](\.[^'"]+)['"]/g))await inspect(new URL(m[1],url));}
 await inspect(new URL('dist-live/assets/sheet-entry.mjs',root));assert.ok(seen.size>=4);
});
