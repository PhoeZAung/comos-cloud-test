import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('admin navigation and player-row management omit Item Controls and buy icon',async()=>{
 const site=await readFile('src/layouts/site.mjs','utf8');
 const directory=await readFile('src/ui/directory.mjs','utf8');
 assert.doesNotMatch(site,/\['admin-items',\s*'Item controls'\]/);
 assert.doesNotMatch(directory,/href="admin-items\.html\?characterId=/);
 assert.doesNotMatch(directory,/Shop as/);
 assert.match(directory,/data-owlbear-status/);
 assert.match(directory,/data-character-tags/);
 assert.match(directory,/create-identity\.html\?characterId=/);
});

test('auto connection uses existing server session cookie, not persistent bearer storage',async()=>{
 const action=await readFile('src/owlbear/action.mjs','utf8');
 const connect=await readFile('src/owlbear/connect.mjs','utf8');
 assert.match(action,/async function autoConnect\(\)/);
 assert.match(action,/fetch\('\/api\/v1\/owlbear\/connect'/);
 assert.match(action,/credentials:'same-origin'/);
 assert.match(action,/scope:'sheet'/);
 assert.match(action,/trackerBus\.send\(\{type:'hello'\}\)/);
 assert.doesNotMatch(action,/localStorage|sessionStorage/);
 assert.match(connect,/addEventListener\('focus'/);
 assert.match(connect,/visibilitychange/);
});
