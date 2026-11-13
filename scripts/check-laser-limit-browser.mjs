// Isolated fixtures exercise the production-built effects and sheet renderer.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const output=await mkdtemp(path.join(tmpdir(),'cosmos-laser-limit-'));
const mime={'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
const fixture=`import {setupEffects} from '/assets/effects.mjs';
import {preferences} from '/assets/preferences.mjs';
import {renderSection,renderSheetFrame} from '/features/sheet/view.mjs';
import {mountNotesElectric} from '/assets/sheet-notes-electric.mjs';
window.toggleLaser=enabled=>document.dispatchEvent(new CustomEvent('comos:preferences',{detail:{...preferences,laserFlow:enabled}}));
window.disposeEffects=setupEffects();
let dispose=()=>{};
window.drawLimit=(hp=5,spent=0)=>{dispose();document.querySelector('main').innerHTML=renderSection({data:{classes:[{name:'Black Mage',level:1}],hp_max:10,hp_curr:hp,limitBreakPool:{spent},activeAbilities:[{name:'Mana Wall (Limit Break)',limitBreak:true}],notesArea:'Editable notes'}},'abilities');dispose=mountNotesElectric(document.querySelector('main'));};
window.drawNotes=()=>{dispose();document.querySelector('main').innerHTML=renderSection({data:{notesArea:'Editable notes'}},'notes');dispose=mountNotesElectric(document.querySelector('main'));};
window.clearSheet=()=>{dispose();document.querySelector('main').replaceChildren();};
window.drawSheet=(section='overview')=>{dispose();document.querySelector('main').innerHTML=renderSheetFrame({id:'laser-fixture',name:'Storm Weaver',data:{classes:[{name:'Black Mage',level:1}],hp_max:10,hp_curr:5,activeAbilities:[{name:'Mana Wall (Limit Break)',limitBreak:true}]}},section);dispose=mountNotesElectric(document.querySelector('main'));};
document.querySelector('main').onclick=event=>{const tab=event.target.closest('[data-sheet-tab]');if(tab)window.drawSheet(tab.dataset.sheetTab);};
window.drawLimit(6);`;
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://local');
  if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html data-notes-electric="true"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/sheet.css"><link rel="stylesheet" href="/assets/sheet-effects.css"></head><body class="sheet" data-layout="sheet"><div data-galaxy></div><main></main><button id="test-click">Test control</button><script type="module" src="/fixture.mjs"></script></body></html>`);return;}
  if(url.pathname==='/fixture.mjs'){res.setHeader('Content-Type','text/javascript');res.end(fixture);return;}
  const file=path.resolve('dist','.'+url.pathname);if(!file.startsWith(path.resolve('dist')+path.sep))throw Error('Invalid path');
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.COSMOS_BROWSER_EXECUTABLE||undefined,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>!!window.toggleLaser);
 assert.equal(await page.locator('.laser-flow-canvas').count(),0);
 await page.evaluate(()=>window.toggleLaser(true));await page.locator('.laser-flow-canvas').waitFor();
 await page.waitForFunction(()=>document.querySelector('.laser-flow-canvas')?.width>500);
 await page.waitForFunction(()=>performance.getEntriesByType('resource').some(r=>r.name.endsWith('/assets/comos-universe.png')));
 assert.equal(await page.locator('.laser-flow-canvas').evaluate(c=>!!c.getContext('webgl2')),true);
 await page.locator('#test-click').click();
 // Follow the real sheet navigation, including replacement DOM on tab switches.
 const aligned=()=>page.waitForFunction(()=>{
  const tabs=document.querySelector('.cs-tabs[aria-label="Character sheet"]')?.getBoundingClientRect();
  const surface=document.querySelector('.cosmos-laser-surface')?.getBoundingClientRect();
  return tabs&&surface&&Math.abs(surface.left-tabs.left)<2&&Math.abs(surface.width-tabs.width)<2&&Math.abs(surface.top-Math.max(0,tabs.top))<2;
 });
 await page.evaluate(()=>window.drawSheet());await aligned();
 for(const name of ['combat','favorites','overview']){
  await page.locator('.cs-tabs[aria-label="Character sheet"] [data-sheet-tab="'+name+'"]').click();await aligned();
 }

 // Short pages must not cut off the pour before the bottom of the viewport.
 await page.evaluate(()=>window.drawSheet('favorites'));await aligned();
 await page.waitForFunction(()=>{
  const surface=document.querySelector('.cosmos-laser-surface')?.getBoundingClientRect();
  return surface&&surface.bottom>=innerHeight+94;
 });
 const flowing=await page.locator('.cosmos-laser-surface').evaluate(element=>{
  const left=getComputedStyle(element,'::before'),right=getComputedStyle(element,'::after');
  return {leftContent:left.content,rightContent:right.content,
   leftAnimation:left.animationName,rightAnimation:right.animationName,
   leftHeight:parseFloat(left.height),rightHeight:parseFloat(right.height)};
 });
 assert.equal(flowing.leftContent,'""');
 assert.equal(flowing.rightContent,'""');
 assert.match(flowing.leftAnimation,/cosmos-laser-waterfall/);
 assert.match(flowing.rightAnimation,/cosmos-laser-waterfall/);
 assert.ok(flowing.leftHeight>0&&flowing.rightHeight>0);

 // Simulate a tall Skills/Inventory tab; the observed sheet height must
 // stretch the side barrier automatically, and scrolling must not sever it.
 await page.evaluate(()=>{
  window.drawSheet('skills');
  const sheet=document.querySelector('[data-sheet]');
  const content=document.createElement('div');
  content.dataset.laserTallFixture='true';
  content.style.height='2600px';
  sheet.append(content);
 });await aligned();
 await page.waitForFunction(()=>{
  const sheet=document.querySelector('[data-sheet]')?.getBoundingClientRect();
  const surface=document.querySelector('.cosmos-laser-surface')?.getBoundingClientRect();
  return sheet&&surface&&sheet.bottom>innerHeight*2&&Math.abs(surface.bottom-sheet.bottom)<3;
 });
 // A fixed-height in-panel scroll area models pop-out/embedded long tabs.
 // Browser fixture window scrolling is not a reliable proxy for nested scroll.
 await page.evaluate(()=>{
  const main=document.querySelector('main');
  main.style.height='640px';
  main.style.overflowY='auto';
  main.scrollTop=950;
 });await aligned();
 await page.waitForFunction(()=>{
  const main=document.querySelector('main');
  const tabs=document.querySelector('.cs-tabs[aria-label="Character sheet"]')?.getBoundingClientRect();
  const surface=document.querySelector('.cosmos-laser-surface')?.getBoundingClientRect();
  return main.scrollTop>500&&tabs&&tabs.top<0&&surface&&Math.abs(surface.top)<2&&surface.bottom>=innerHeight+94;
 });
 await page.evaluate(()=>{
  const main=document.querySelector('main');
  main.scrollTop=0;
  main.style.removeProperty('height');
  main.style.removeProperty('overflow-y');
  window.drawSheet('overview');
 });await aligned();

 await page.waitForTimeout(2200);await page.screenshot({path:path.join(output,'laser-desktop.png')});
 await page.setViewportSize({width:390,height:844});await aligned();await page.waitForTimeout(200);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:path.join(output,'laser-mobile.png')});
 await page.evaluate(()=>window.scrollTo(0,300));await aligned();
 await page.evaluate(()=>{window.scrollTo(0,0);window.drawLimit(6);});
 await page.waitForFunction(()=>document.querySelector('[data-laser-surface="ambient"]'));

 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!document.querySelector('.laser-flow-canvas'));
 await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('.laser-flow-canvas').waitFor();
 await page.evaluate(()=>{window.toggleLaser(false);window.toggleLaser(true);window.toggleLaser(false);});
 await page.waitForFunction(()=>!document.querySelector('.laser-flow-canvas'));
 await page.evaluate(()=>window.toggleLaser(true));await page.locator('.laser-flow-canvas').waitFor();
 await page.evaluate(()=>window.disposeEffects());assert.equal(await page.locator('.laser-flow').count(),0);
 const border=page.locator('.cs-limit-electric-overlay .electric-border__canvas');
 assert.equal(await border.count(),0);assert.equal(await page.locator('.cs-limit-entry .cs-entry-use').isDisabled(),true);
 await page.evaluate(()=>window.drawLimit(5,0));await border.waitFor();
 assert.equal(await page.locator('.cs-limit-entry .cs-entry-use').isEnabled(),true);
 await page.waitForFunction(()=>document.querySelector('.electric-border__canvas')?.width>100);
 await page.screenshot({path:path.join(output,'limit-ready-mobile.png')});
 await page.evaluate(()=>document.documentElement.dataset.notesElectric='false');await border.waitFor();
 await page.evaluate(()=>window.drawLimit(5,1));assert.equal(await border.count(),0);
 assert.equal(await page.locator('.cs-limit-entry .cs-entry-use').isDisabled(),true);
 await page.evaluate(()=>window.drawLimit(5,0));await border.waitFor();
 await page.evaluate(()=>window.drawLimit(6,0));assert.equal(await border.count(),0);
 await page.setViewportSize({width:1100,height:800});await page.evaluate(()=>window.drawLimit(0,0));await border.waitFor();
 await page.screenshot({path:path.join(output,'limit-ready-desktop.png')});
 await page.evaluate(()=>{document.documentElement.dataset.notesElectric='true';window.drawNotes();});
 await page.locator('.cs-note-electric-overlay .electric-border__canvas').waitFor();
 await page.locator('textarea').fill('Still editable');assert.equal(await page.locator('textarea').inputValue(),'Still editable');
 await page.evaluate(()=>window.clearSheet());assert.equal(await page.locator('.electric-border__canvas').count(),0);
 await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};});
 await page.reload();await page.waitForFunction(()=>!!window.drawLimit);
 await page.evaluate(()=>{window.toggleLaser(true);window.drawLimit(5,0);});await page.locator('.laser-flow-canvas').waitFor();
 await page.locator('#test-click').click();assert.equal(await page.locator('.cs-limit-entry .cs-entry-use').isEnabled(),true);
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 console.log(JSON.stringify({checks:['LaserFlow WebGL, reveal asset, desktop/mobile, click-through','Tab impact and side barrier follow resize, scrolling and replacement sheet tabs','Toggle races, reduced motion and disposal','Limit border follows threshold, spent pool, refill and healing','Notes toggle stays independent; notes remain editable','No-WebGL keeps controls usable'],output},null,2));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
