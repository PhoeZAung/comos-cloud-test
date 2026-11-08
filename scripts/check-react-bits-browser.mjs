// Isolated fixture API; exercises production-built sheet UI without live accounts.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';
const output=await mkdtemp(path.join(tmpdir(),'cosmos-react-bits-'));let archives=0,failArchive=true;
const character={id:'effect-fixture',name:'Storm Weaver',revision:1,data:{hp_curr:20,hp_max:30,activeAbilities:[],passiveAbilities:[],racialAbilities:[],feats:[],weapons:[],items:[],notesArea:'Lightning gathers above the observatory.'}};
const html=`<!doctype html><html data-notes-electric="true"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'"><link rel="stylesheet" href="/assets/sheet.css"><link rel="stylesheet" href="/assets/sheet-effects.css"><link rel="stylesheet" href="/assets/sheet-refinements.css"></head><body data-page="sheet"><main></main><script type="module" src="/fixture.mjs"></script></body></html>`;
const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://local');
 try{
  if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}
  if(url.pathname==='/fixture.mjs'){res.setHeader('Content-Type','text/javascript');res.end("import {mountSheet} from '/assets/sheet.mjs';window.EventSource=undefined;window.disposeSheet=mountSheet();");return;}
  if(url.pathname.startsWith('/api/')){
   if(req.method==='POST'){let input='';for await(const part of req)input+=part;const body=JSON.parse(input);if(body.op==='archive'){archives++;res.statusCode=failArchive?503:200;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(failArchive?{message:'Fixture archive failed.'}:{archived:true}));return;}}
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify({character}));return;
  }
  if(url.pathname==='/characters.html'){res.setHeader('Content-Type','text/html');res.end('<h1>Characters</h1>');return;}
  const file=path.resolve('dist','.'+url.pathname);if(!file.startsWith(path.resolve('dist')+path.sep))throw Error('Invalid file');
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
 }catch{res.writeHead(404).end();}
});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.COSMOS_BROWSER_EXECUTABLE||undefined,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1000,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:'+server.address().port+'/?characterId=effect-fixture';
 await page.goto(base+'&section=notes');
 const border=page.locator('.cs-note-electric-overlay .electric-border__canvas').first();await border.waitFor();
 await page.waitForFunction(()=>document.querySelector('.electric-border__canvas')?.width>300);
 const size=await border.evaluate(c=>({width:c.width,height:c.height,webgl:!!c.getContext('webgl2')}));assert.equal(size.webgl,true);
 const textarea=page.locator('.cs-notes-electric textarea').first();await textarea.fill('Notes remain editable beside real lightning.');
 await textarea.evaluate(el=>el.style.height='440px');
 await page.waitForFunction(h=>document.querySelector('.electric-border__canvas')?.height>h,size.height);
 assert.equal(await textarea.inputValue(),'Notes remain editable beside real lightning.');
 await page.waitForTimeout(300);await page.screenshot({path:path.join(output,'electric.png')});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Electric overlay must not create horizontal scrolling');
 await page.screenshot({path:path.join(output,'electric-mobile.png')});await page.setViewportSize({width:1000,height:900});
 await page.evaluate(()=>document.documentElement.dataset.notesElectric='false');await page.waitForFunction(()=>!document.querySelector('.electric-border__canvas'));
 await page.evaluate(()=>document.documentElement.dataset.notesElectric='true');await border.waitFor();
 await page.evaluate(()=>window.disposeSheet());assert.equal(await page.locator('.electric-border__canvas').count(),0);
 const open=async()=>{await page.goto(base+'&section=combat');await page.locator('[data-recovery-menu]').click();await page.locator('[data-setting-tab=site]').click();};
 const confirm=async()=>{const hold=page.locator('[data-delete-character]');await hold.focus();await page.keyboard.down('Enter');await page.waitForTimeout(1480);await page.keyboard.up('Enter');await page.locator('[data-delete-final]').click();};
 await open();await confirm();
 await page.locator('.cs-paper-crumple[data-phase=crumpling] .paper-crumple[data-status=ready]').waitFor({timeout:15000});
 assert.equal(archives,0);assert.equal(await page.locator('.cs-paper-fallback').count(),0);
 await page.screenshot({path:path.join(output,'paper-crumpling.png')});
 await page.locator('.cs-paper-crumple[data-phase=throwing]').waitFor();assert.equal(archives,0);
 await page.locator('[data-sheet-status]').filter({hasText:'Fixture archive failed.'}).waitFor();
 assert.equal(archives,1);assert.equal(await page.locator('.cs-paper-crumple').count(),0);
 assert.equal(await page.locator('[data-sheet]').evaluate(el=>getComputedStyle(el).visibility),'visible');
 failArchive=false;await confirm();
 await page.locator('.cs-paper-crumple[data-phase=throwing]').waitFor();assert.equal(archives,1);
 await page.waitForURL('**/characters.html');assert.equal(archives,2);
 // Navigating away during the mesh cancels deletion and releases the overlay.
 await open();await confirm();await page.locator('.cs-paper-crumple[data-phase=crumpling]').waitFor();
 await page.evaluate(()=>window.disposeSheet());await page.waitForFunction(()=>!document.querySelector('.cs-paper-crumple'));assert.equal(archives,2);
 // Reduced motion skips the mesh and still waits for the fade before archiving.
 await page.emulateMedia({reducedMotion:'reduce'});await open();await confirm();await page.waitForURL('**/characters.html');assert.equal(archives,3);
 // Devices without WebGL retain a local fold/throw fallback and usable notes.
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:original.call(this,type,...args);};});
 await open();await confirm();await page.locator('.cs-paper-fallback').waitFor();assert.equal(archives,3);
 await page.waitForURL('**/characters.html');assert.equal(archives,4);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({checks:['ElectricBorder WebGL, resize, editable notes, toggle/dispose','PaperCrumple real mesh then upward exit before archive','failed archive restores sheet','cancellation sends no archive','reduced motion and no-WebGL fallback'],output},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
