import {chromium} from 'playwright';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';import os from 'node:os';
import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../dist/',import.meta.url)),output=await fs.mkdtemp(path.join(os.tmpdir(),'cosmos-dragon-')); // Isolated, synthetic preview: never opens an account or sends a roll.
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'"><link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/_test/style.css"></head><body><main><header><h1>Cosmos</h1><span>Character sheet</span></header><section><nav>Character · Combat · Abilities · Notes</nav><div class="cards"><article>HP<strong>24 / 32</strong></article><article>MP<strong>10 / 15</strong></article><article>AC<strong>17</strong></article></div><button id="underlying">Character action</button><p id="receipt">Ready</p></section><footer><button id="nat20">Natural 20</button><button id="normal">17 + 3</button><button id="nat1">Natural 1</button><button id="abort">Cancel effect</button><button id="sequence">Roll sequence</button><label><input type="checkbox" id="sound">Sound</label><label><input type="checkbox" id="effects" checked>Effects</label><label>Volume<input type="range" id="volume" min="0" max="1" step=".1" value=".8"></label></footer></main><script type="module" src="/_test/harness.mjs"></script></body></html>`;
const harness=`import {showCritical,naturalResult,unlockCriticalAudio} from '/assets/critical-fx.mjs';import {showDice} from '/assets/feedback.mjs';import {applyPreferences,preferences} from '/assets/preferences.mjs';
window.harness={clicks:0};let controller;
const configure=()=>applyPreferences({...preferences,diceOptions:{...preferences.diceOptions,critSound:document.querySelector('#sound').checked,critEffects:document.querySelector('#effects').checked,volume:Number(document.querySelector('#volume').value)}});
document.querySelector('#effects').onchange=configure;document.querySelector('#sound').onchange=()=>{configure();unlockCriticalAudio();};document.querySelector('#volume').onchange=configure;
window.harness.trigger=(face=20,total=27)=>{controller=new AbortController();const result={kind:'check',total,breakdown:[{dice:'1d20',rolls:[face]}]};const natural=naturalResult(result);window.harness.receipt=result;if(natural)void showCritical(natural,{options:{...preferences.diceOptions},result,signal:controller.signal});return natural;};
document.querySelector('#nat20').onclick=()=>{unlockCriticalAudio();window.harness.trigger();};document.querySelector('#normal').onclick=()=>window.harness.trigger(17,20);document.querySelector('#nat1').onclick=()=>window.harness.trigger(1,4);document.querySelector('#abort').onclick=()=>controller?.abort();document.querySelector('#underlying').onclick=()=>window.harness.clicks++;
window.harness.sequence=(face=20,total=27)=>{window.harness.order=[];window.__diceGate=new Promise(resolve=>window.harness.settle=resolve);void showDice({kind:'check',total,breakdown:[{dice:'1d20',rolls:[face]}]},{onResult:r=>{window.harness.order.push('receipt');document.querySelector('#receipt').textContent='Total '+r.total;}});};document.querySelector('#sequence').onclick=()=>window.harness.sequence();
configure();window.harness.ready=true;`;
const style=`body{margin:0;background:radial-gradient(ellipse at 30% 20%,#211b40,#080d18 70%);min-height:100vh;color:#eeeafa}main{margin:auto;padding:30px;max-width:1100px}header{display:flex;justify-content:space-between;align-items:center}section{border:1px solid #4d4768;border-radius:20px;padding:30px;margin-top:40px;background:#0d1222aa}nav{margin-bottom:30px}.cards{display:flex;gap:16px}.cards article{flex:1;border:1px solid #45445d;padding:20px;border-radius:16px;color:#b5afd1}.cards strong{display:block;font-size:28px;color:#ece9ff;margin-top:12px}button{background:#26223b;border:1px solid #817495;border-radius:10px;color:#eee;padding:12px;cursor:pointer}#underlying{display:block;margin:45px auto}footer{display:flex;flex-wrap:wrap;gap:8px;position:fixed;bottom:8px;left:8px;right:8px}footer label{padding:8px}#volume{width:80px}@media(max-width:500px){main{padding:14px}.cards{gap:8px}.cards article{padding:12px}.cards strong{font-size:18px}section{padding:16px}}`;
const mime={'.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.gif':'image/gif','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');let text;
 if(url.pathname==='/')text=html;else if(url.pathname==='/_test/harness.mjs')text=harness;else if(url.pathname==='/_test/style.css')text=style;
 else if(url.pathname==='/assets/dice-3d.mjs')text="export async function show3DDice(){window.harness.order.push('dice');await window.__diceGate;window.harness.order.push('settled');}";
 if(text!==undefined){res.writeHead(200,{'Content-Type':url.pathname==='/'?'text/html':url.pathname.endsWith('.css')?'text/css':'text/javascript'});res.end(text);return;}
 if(!/^\/(assets|features|account)\//.test(url.pathname)||url.pathname.includes('..')){res.writeHead(404).end();return;}
 const file=path.join(root,url.pathname),bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,...(process.env.COSMOS_BROWSER_EXECUTABLE?{executablePath:process.env.COSMOS_BROWSER_EXECUTABLE}:process.platform==='win32'?{channel:'msedge'}:{})});
const checks=[],errors=[];
async function pageFor(viewport,reducedMotion='no-preference'){
 const page=await browser.newPage({viewport,reducedMotion});page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{window.__audio={started:0,stopped:0,contexts:[]};const Native=window.AudioContext;window.AudioContext=class extends Native{constructor(...args){super(...args);window.__audio.contexts.push(this);}createBufferSource(){const source=super.createBufferSource();const start=source.start.bind(source),stop=source.stop.bind(source);source.start=(...args)=>{window.__audio.started++;return start(...args);};source.stop=(...args)=>{window.__audio.stopped++;return stop(...args);};return source;}};});
 await page.goto(base);await page.waitForFunction(()=>window.harness?.ready);await page.clock.install();return page;
}
try{
 {
  const page=await pageFor({width:1000,height:800});await page.evaluate(()=>{window.__wingCallbacks=new Map();let serial=0;window.requestAnimationFrame=callback=>{window.__wingBase??=performance.now();const id=++serial;window.__wingCallbacks.set(id,callback);return id;};window.cancelAnimationFrame=id=>window.__wingCallbacks.delete(id);window.__wingStep=time=>{const callbacks=[...window.__wingCallbacks.values()];window.__wingCallbacks.clear();for(const callback of callbacks)callback(window.__wingBase+time);};});await page.click('#nat20');await page.waitForSelector('.galaxy-dragon-fx');
  await page.evaluate(async()=>{const image=new Image();image.src='/assets/roll-fx/galaxy-nebula.webp';await image.decode();for(const animation of document.getAnimations()){animation.pause();animation.currentTime=575;}});
  await page.evaluate(()=>window.__wingStep(80));const poseA=await page.locator('.galaxy-wing-upper').getAttribute('transform'),first=await page.screenshot({path:path.join(output,'wings-folded.png')});
  await page.evaluate(()=>window.__wingStep(250));const poseB=await page.locator('.galaxy-wing-upper').getAttribute('transform'),second=await page.screenshot({path:path.join(output,'wings-extended.png')});assert.notEqual(poseA,poseB);
  const a=await sharp(first).ensureAlpha().raw().toBuffer(),b=await sharp(second).ensureAlpha().raw().toBuffer();let pixels=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>30)pixels++;assert.ok(pixels>15000,'mask must visibly repaint as the wings beat: '+pixels);
  checks.push('Ashwing wingbeat changes actual painted pixels while flight/texture stay fixed ('+pixels+' pixels)');await page.close();
 }
 for(const [name,viewport] of [['desktop',{width:1440,height:900}],['phone',{width:390,height:844}],['small-phone',{width:320,height:568}],['landscape',{width:844,height:390}]]){
  const page=await pageFor(viewport);await page.click('#nat20');await page.waitForSelector('.galaxy-dragon-fx');
  await page.evaluate(()=>{for(const a of document.getAnimations()){a.pause();a.currentTime=575;}});
  const box=await page.locator('.galaxy-dragon-art').boundingBox();assert.ok(box.x>=-1&&box.y>=-1&&box.x+box.width<=viewport.width+1&&box.y+box.height<=viewport.height+1,JSON.stringify({name,box}));
  await page.screenshot({path:path.join(output,name+'.png')});await page.click('#underlying');assert.equal(await page.evaluate(()=>window.harness.clicks),1);
  await page.evaluate(()=>window.harness.trigger());assert.equal(await page.locator('.galaxy-dragon-fx').count(),1);
  assert.equal(await page.evaluate(()=>window.__audio.started),0);
  await page.clock.runFor(1250);assert.equal(await page.locator('.galaxy-dragon-fx').count(),0);checks.push(name+': fits viewport, transparent/click-through, no overlap, sound off, removed at 1.25s');await page.close();
 }
 {
  const page=await pageFor({width:900,height:700});await page.click('#normal');assert.equal(await page.locator('.galaxy-dragon-fx').count(),0);checks.push('17 + 3 does not trigger');
  await page.click('#sequence');await page.waitForFunction(()=>window.harness.order.includes('dice'));assert.equal(await page.locator('.galaxy-dragon-fx').count(),0);
  await page.evaluate(()=>window.harness.settle());await page.waitForSelector('.galaxy-dragon-fx');assert.deepEqual(await page.evaluate(()=>window.harness.order),['dice','settled','receipt']);assert.equal(await page.locator('#receipt').textContent(),'Total 27');checks.push('actual presentation queue: dice settles → unchanged receipt → flyby');await page.clock.runFor(1250);
  await page.evaluate(()=>window.harness.sequence(17,20));await page.waitForFunction(()=>window.harness.order.includes('dice'));await page.evaluate(()=>window.harness.settle());await page.waitForSelector('.feedback-die');assert.equal(await page.locator('.galaxy-dragon-fx').count(),0);assert.equal(await page.locator('#receipt').textContent(),'Total 20');await page.click('.feedback-close');checks.push('normal roll keeps Cosmos Classic receipt');
  await page.uncheck('#effects');await page.click('#sequence');await page.waitForFunction(()=>window.harness.order.includes('dice'));await page.evaluate(()=>window.harness.settle());await page.waitForSelector('.feedback-die');assert.equal(await page.locator('.galaxy-dragon-fx').count(),0);await page.click('.feedback-close');await page.check('#effects');checks.push('effects toggle off falls back to Classic for natural 20');
  await page.click('#nat1');assert.equal(await page.locator('.galaxy-dragon-fx').count(),0);assert.equal(await page.locator('.critical-fail').count(),1);await page.click('.critical-fail button');checks.push('natural 1 retains legacy effect');
  await page.click('#nat20');await page.waitForSelector('.galaxy-dragon-fx');await page.click('#abort');assert.equal(await page.locator('.galaxy-dragon-fx').count(),0);checks.push('abort cleans up immediately');await page.close();
 }
 {
  const page=await pageFor({width:900,height:700});await page.check('#sound');await page.waitForFunction(()=>window.__audio.contexts[0]?.state==='running');await page.click('#nat20');assert.equal(await page.evaluate(()=>window.__audio.started),1);
  await page.uncheck('#sound');assert.ok(await page.evaluate(()=>window.__audio.stopped)>=1);checks.push('sound on plays original roar; switching off stops it immediately');await page.clock.runFor(1250);
  await page.check('#sound');await page.locator('#volume').fill('0');await page.locator('#volume').dispatchEvent('change');const before=await page.evaluate(()=>window.__audio.started);await page.click('#nat20');assert.equal(await page.evaluate(()=>window.__audio.started),before);checks.push('zero volume remains silent');await page.close();
 }
 {
  const page=await pageFor({width:390,height:844},'reduce');await page.check('#sound');await page.click('#nat20');assert.equal(await page.locator('.galaxy-dragon-still').count(),1);assert.equal(await page.locator('.galaxy-dragon-art').count(),0);assert.equal(await page.evaluate(()=>window.__audio.started),0);await page.screenshot({path:path.join(output,'reduced-motion.png')});await page.clock.runFor(900);assert.equal(await page.locator('.galaxy-dragon-fx').count(),0);checks.push('reduced motion: still result badge, no sweeping visuals/audio, cleanup at 0.9s');await page.close();
 }
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(output,'browser-results.json'),JSON.stringify({checks,errors},null,2));console.log(checks.map(check=>'PASS '+check).join('\n'));console.log('Preview screenshots and results: '+output);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
