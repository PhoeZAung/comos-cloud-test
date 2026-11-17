// Real browser regression: revisiting an open sheet should paint before
// the revision check returns, and not reload the entire page.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';

const first=randomUUID(),second=randomUUID();
const names=new Map([[first,'Astra'],[second,'Nyx']]);
const calls=new Map();
const problems=[];
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.woff2':'font/woff2'};
let origin='';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,origin||'http://127.0.0.1');
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try{
  if(url.pathname.startsWith('/api/v1/character-records/')){
   if(url.searchParams.get('stream')==='1'){
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive'});
    res.write(': sheet stream connected\n\n');req.on('close',()=>res.end());return;
   }
   const id=url.pathname.slice('/api/v1/character-records/'.length);
   calls.set(id,(calls.get(id)||0)+1);
   if(!names.has(id)){send(404,{message:'Unknown sheet'});return;}
   if(url.searchParams.has('revision')){await delay(1200);send(200,{unchanged:true});return;}
   send(200,{character:{id,name:names.get(id),revision:1,kind:'player',owned:true,data:{str:12,dex:12,con:12,int:12,wis:12,cha:12,hp_curr:12,hp_max:12}},admin:false});return;
  }
  if(url.pathname==='/api/v1/my/characters'){
   send(200,{characters:[...names].map(([id,name])=>({id,name})),nextCursor:null});return;
  }
  if(url.pathname==='/api/v1/auth/session'){
   send(200,{user:{preferences:{}}});return;
  }
  if(url.pathname.startsWith('/api/')){send(200,{items:[],characters:[],notes:[]});return;}
  if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return;}
  const base=path.resolve('dist-live');
  const file=path.resolve(base,'.'+(url.pathname==='/'?'/sheet.html':url.pathname));
  if(!file.startsWith(base+path.sep)){res.writeHead(403).end();return;}
  const contents=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(contents);
 }catch(error){problems.push(error.message);send(500,{message:error.message});}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.COSMOS_BROWSER_EXECUTABLE||undefined});
try{
 const page=await browser.newPage();
 const errors=[],modules=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('request',request=>{const url=new URL(request.url());if(url.pathname.endsWith('.mjs')&&url.pathname.startsWith('/assets/'))modules.push(url.pathname);});
 await page.goto(origin+'/sheet.html?characterId='+first);
 await page.locator('[data-sheet] h1').filter({hasText:'Astra'}).waitFor();
 assert.equal(calls.get(first),1,'first load makes one character request');
 assert.ok(modules.includes('/assets/sheet-entry.mjs'),'load the bundled production sheet entry');
 assert.ok(modules.some(path=>path.startsWith('/assets/sheet-chunks/')),'load deferred sheet chunk');
 assert.ok(modules.length<=20,'cold entry must not fetch the former dozens of sheet modules: '+JSON.stringify(modules));
 await page.locator('[data-add-sheet]').click();
 await page.locator('[data-pick-character="'+second+'"]').click();
 await page.locator('[data-sheet] h1').filter({hasText:'Nyx'}).waitFor();
 assert.equal(calls.get(second),1,'second character gets its own first fetch');
 await page.locator('[data-switch-sheet="'+first+'"]').click();
 await page.locator('[data-sheet] h1').filter({hasText:'Astra'}).waitFor({timeout:650});
 assert.equal(await page.locator('[data-sheet] h1').filter({hasText:'Astra'}).count(),1);
 assert.equal(calls.get(first),2,'warm sheet checks the latest revision once');
 await page.locator('[data-switch-sheet="'+second+'"]').click();
 await page.locator('[data-sheet] h1').filter({hasText:'Nyx'}).waitFor({timeout:450});
 assert.equal(calls.get(second),2,'second warm sheet checks latest revision once');
 await delay(1250);
 assert.deepEqual(errors,[],'browser rendering has no errors');
 assert.deepEqual(problems,[],'fixture server has no errors');
 console.log('Passed: multi-sheet tabs paint from warm data, refresh asynchronously and avoid full-page reload.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
