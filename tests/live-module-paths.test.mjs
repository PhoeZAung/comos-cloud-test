import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('live Home and post thread ship every transitive static relative module import',async()=>{
 const root=new URL('../',import.meta.url);execFileSync(process.execPath,['scripts/build-live.mjs','public-auth.json'],{cwd:fileURLToPath(root),stdio:'pipe'});
 const visited=new Set();
 async function inspect(url){if(visited.has(url.href))return;visited.add(url.href);assert.equal((await stat(url)).isFile(),true,url.href);const code=await readFile(url,'utf8');for(const m of code.matchAll(/from\s*['"](\.[^'"]+)['"]/g))await inspect(new URL(m[1],url));}
 await inspect(new URL('dist-live/assets/feed.mjs',root));await inspect(new URL('dist-live/assets/post-thread.mjs',root));assert.ok(visited.size>=5);
});
