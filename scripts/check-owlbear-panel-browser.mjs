// Real extension markup/action controller with a synthetic room and account.
// No Owlbear room, Firebase login, real rolls or character writes are used.
import {chromium} from 'playwright';
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFile,mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const output=await mkdtemp(path.join(tmpdir(),'cosmos-owlbear-panel-'));
const stubs={
 '@owlbear-rodeo/sdk':`export default {onReady:callback=>{window.testReady=callback();},action:{setIcon:async()=>{}}};`,
 './panel-size.mjs':`export async function panelSize(){}`,
 './local-channel.mjs':`export async function localChannel(OBR,receive){window.deliver=receive;return {send(value){if(value.type==='hello')receive(window.roomState);},close(){}};}`,
 './connection.mjs':`export function connection(){return {close(){},async call(method){if(method==='list')return [{id:'character-1',name:'Astra'}];if(method==='roll-history'){window.historyCalls++;return {rolls:window.rollRows};}throw Error('Unexpected account request');}};}`,
 './dice-plus.mjs':`export function dicePlus(){return {ready:async()=>{},roll:async()=>{throw Error('No test rolls');}};}`
};
const bundle=await build({entryPoints:['src/owlbear/action.mjs'],bundle:true,format:'esm',write:false,plugins:[{name:'synthetic-room',setup(builder){builder.onResolve({filter:/.*/},args=>Object.hasOwn(stubs,args.path)?{path:args.path,namespace:'synthetic'}:null);builder.onLoad({filter:/.*/,namespace:'synthetic'},args=>({contents:stubs[args.path],loader:'js'}));}}]});
const html=(await readFile('dist-live/owlbear/index.html','utf8')).replace('src="/owlbear/action.js"','src="/_test/action.mjs"');
const server=createServer(async(req,res)=>{try{let bytes,type;if(req.url==='/'){bytes=html;type='text/html';}else if(req.url==='/_test/action.mjs'){bytes=bundle.outputFiles[0].contents;type='text/javascript';}else if(/^\/owlbear\/[a-z.-]+$/.test(req.url)){bytes=await readFile('public'+req.url);type=req.url.endsWith('.css')?'text/css':'image/svg+xml';}else{res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':type});res.end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})}),checks=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:640}});page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{window.historyCalls=0;window.roomState={type:'state',admin:false,feed:'Live',layout:{party:false,initiative:false,partyDock:'top',initiativeDock:'left'}};window.rollRows=[{id:'roll-1',character:'Astra',label:'<img src=x onerror=alert(1)>',time:Date.now(),parts:[{label:'Attack',total:27,expression:'1d20+7',faces:[20]},{label:'Damage',total:8,expression:'2d6',faces:[3,5]}]}];});
 await page.goto('http://127.0.0.1:'+server.address().port);await page.evaluate(()=>window.testReady);
 assert.equal(await page.locator('[data-panel-tab="admin"]').isVisible(),false);assert.equal(await page.locator('[data-admin-controls]').isVisible(),false);checks.push('player never sees Admin tab or display controls');
 await page.locator('[data-panel-tab="roll"]').click();assert.match(await page.locator('[data-history-status]').textContent(),/Connect Cosmos/);assert.equal(await page.evaluate(()=>window.historyCalls),0);checks.push('disconnected history asks for account without fetching private receipts');
 await page.evaluate(()=>window.deliver({type:'grant',token:'a'.repeat(64)}));await page.waitForSelector('.roll-history li');
 assert.equal(await page.locator('.history-result strong').first().textContent(),'Attack 27');assert.equal(await page.locator('.history-result strong').nth(1).textContent(),'Damage 8');assert.equal(await page.locator('.roll-history img').count(),0);checks.push('connected history renders original totals/faces and escapes user labels');
 await page.evaluate(()=>{window.rollRows=[{...window.rollRows[0],id:'roll-2',label:'Saving throw',parts:[{label:'Roll',total:17,expression:'1d20+3',faces:[14]}]},...window.rollRows];});await page.locator('[data-refresh-history]').click();await page.waitForFunction(()=>document.querySelectorAll('.roll-history li').length===2);checks.push('refresh adds newest saved roll without rolling again');
 await page.evaluate(()=>window.deliver({...window.roomState,admin:true}));await page.locator('[data-panel-tab="admin"]').click();assert.equal(await page.locator('[data-admin-controls]').isVisible(),true);checks.push('verified admin can open display controls');
 await page.evaluate(()=>window.deliver(window.roomState));assert.equal(await page.locator('[data-panel-tab="admin"]').isVisible(),false);assert.equal(await page.locator('[data-admin-controls]').isVisible(),false);assert.equal(await page.locator('[data-panel-tab="character"]').getAttribute('aria-selected'),'true');checks.push('revoked admin immediately loses controls and returns to Character');
 await page.locator('[data-panel-tab="character"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-panel-tab="roll"]').getAttribute('aria-selected'),'true');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks.push('phone layout and keyboard tabs skip hidden Admin');
 await page.screenshot({path:path.join(output,'roll-history-phone.png')});assert.deepEqual(errors,[]);console.log(JSON.stringify({checks,errors,output},null,2));await writeFile(path.join(output,'results.json'),JSON.stringify({checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
