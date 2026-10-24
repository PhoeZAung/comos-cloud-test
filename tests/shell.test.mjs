import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { routeId } from '../src/ui/router.mjs';

test('soft navigation stays in the current live or fixture root and excludes the focused sheet',()=>{
 const live=new URL('https://example.test/');
 for(const id of ['index','home','lore','characters','account','admin-groups','create-class'])assert.equal(routeId(new URL(id+'.html',live),live),id);
 for(const address of ['https://other.test/home.html','https://example.test/preview/home.html','https://example.test/sheet.html','https://example.test/api/v1/health'])assert.equal(routeId(new URL(address),live),null);
 const fixture=new URL('https://example.test/preview/');
 assert.equal(routeId(new URL('https://example.test/preview/home.html'),fixture),'home');
 assert.equal(routeId(new URL('https://example.test/home.html'),fixture),null);
});

test('header uses verified session responses, resets on 401 and avoids duplicate requests',async t=>{
 const entry={hidden:false},account={hidden:true};
 t.mock.method(globalThis,'fetch',async()=>({status:200,ok:true,json:async()=>({user:{id:'synthetic-user'}})}));
 t.after(()=>{delete globalThis.document;});
globalThis.document={documentElement:{dataset:{}},dispatchEvent:()=>{},body:{dataset:{mode:'live'}},querySelectorAll:selector=>selector==='[data-public-entry]'?[entry]:selector==='[data-public-account]'?[account]:[]};
 const session=await import('../src/ui/session.mjs');
 await Promise.all([session.refreshSession(),session.refreshSession()]);
 assert.equal(fetch.mock.callCount(),1);assert.equal(entry.hidden,true);assert.equal(account.hidden,false);
 assert.equal(fetch.mock.calls[0].arguments[0],'/api/v1/auth/session');
 assert.equal(fetch.mock.calls[0].arguments[1].cache,'no-store');
 fetch.mock.mockImplementation(async()=>({status:401,ok:false}));
 await session.refreshSession();assert.equal(session.sessionUser,null);assert.equal(entry.hidden,false);assert.equal(account.hidden,true);
 document.body.dataset.mode='fixture';await session.refreshSession();assert.equal(fetch.mock.callCount(),2);
});

test('service worker never intercepts API requests or caches authenticated pages',async()=>{
 const source=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
 const listeners={},stored=[],network=[];
 const sandbox={self:{location:{origin:'https://example.test'},addEventListener:(name,fn)=>listeners[name]=fn,skipWaiting(){},clients:{claim:async()=>{}}},caches:{open:async()=>({add:async path=>stored.push(path)}),keys:async()=>[],match:async()=>({offline:true})},fetch:async request=>{network.push(request);return {ok:true};},URL};
 vm.runInNewContext(source,sandbox);
 let pending;listeners.install({waitUntil:p=>pending=p});await pending;
 assert.deepEqual(stored,['/offline.html']);
 let intercepted=false;
 listeners.fetch({request:{url:'https://example.test/api/v1/auth/session',mode:'navigate',method:'GET'},respondWith:()=>intercepted=true});
 assert.equal(intercepted,false);
 const req={url:'https://example.test/account.html',mode:'navigate',method:'GET'};
 listeners.fetch({request:req,respondWith:p=>pending=p});await pending;assert.equal(network[0],req);assert.deepEqual(stored,['/offline.html']);
 sandbox.fetch=async()=>{throw new Error('offline');};
 listeners.fetch({request:req,respondWith:p=>pending=p});assert.equal((await pending).offline,true);
});

test('install manifest has valid icons and same-origin shortcuts; live-only policies allow registration',async()=>{
 const root=new URL('../',import.meta.url);
 const manifest=JSON.parse(await readFile(new URL('public/manifest.webmanifest',root),'utf8'));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/');
 for(const icon of manifest.icons){const bytes=await readFile(new URL('public'+icon.src,root));assert.equal(bytes.subarray(1,4).toString(),'PNG');}
 for(const item of manifest.shortcuts)assert.ok(item.url.startsWith('/')&&!item.url.startsWith('//'));
 const html=await readFile(new URL('dist/index.html',root),'utf8');
 assert.doesNotMatch(html,/rel="manifest"/);assert.match(html,/connect-src &#39;none&#39;/);
});
