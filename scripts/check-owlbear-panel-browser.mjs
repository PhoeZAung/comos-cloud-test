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
 './local-channel.mjs':`export async function localChannel(OBR,receive){window.deliver=receive;return {send(value){if(value.type==='hello')receive(window.roomState);if(value.type==='roll-receipt')window.receipts.push(value);if(['turn','initiative','stats','highlight','locate'].includes(value.type))window.commands.push(value);},close(){}};}`,
 './connection.mjs':`export function connection(){return {close(){},async call(method){if(method==='list'){window.listCalls++;return [{id:'character-1',name:'Astra'},{id:'character-2',name:'Nyx'}];}if(method==='npc-list')return [{id:'npc-1',name:'A very long NPC name that should scroll rather than squeeze characters'}];if(method==='roll-history'){window.historyCalls++;return {rolls:window.rollRows};}if(method==='api')return {status:200,data:{roll:{total:22,expression:'1d20+5',rolls:[17]}}};throw Error('Unexpected account request');}};}`,
 './dice-plus.mjs':`export function dicePlus(){return {ready:async()=>{},roll:async(notation,target)=>{window.diceTargets.push(target);return {groups:[{diceType:'d20',dice:[{value:17}]}]};}};}`
};
const bundle=await build({entryPoints:['src/owlbear/action.mjs'],bundle:true,format:'esm',write:false,plugins:[{name:'synthetic-room',setup(builder){builder.onResolve({filter:/.*/},args=>Object.hasOwn(stubs,args.path)?{path:args.path,namespace:'synthetic'}:null);builder.onLoad({filter:/.*/,namespace:'synthetic'},args=>({contents:stubs[args.path],loader:'js'}));}}]});
const html=(await readFile('dist-live/owlbear/index.html','utf8')).replace('src="/owlbear/action.js"','src="/_test/action.mjs"');
const server=createServer(async(req,res)=>{try{let bytes,type;if(req.url==='/'||req.url==='/owlbear/index.html'){bytes=html;type='text/html';}else if(req.url==='/_test/action.mjs'){bytes=bundle.outputFiles[0].contents;type='text/javascript';}else if(req.url.startsWith('/owlbear/sheet.html')){bytes='<!doctype html><html><body><main style="height:2000px"><div class="cs-quick-tools"><button data-toggle-stars>Star</button><button data-open-rest>Rest</button><button data-add-sheet>+</button><a data-sheet-popout href="/owlbear/sheet.html">Pop out</a></div>Sheet test content</main><script type="module" src="/_test/sheet.mjs"></script></body></html>';type='text/html';}else if(req.url==='/_test/rpc.mjs'){bytes=await readFile('src/owlbear/rpc.mjs');type='text/javascript';}else if(req.url==='/_test/sheet.mjs'){bytes="import {peer} from '/_test/rpc.mjs';document.addEventListener('click',e=>{const add=e.target.closest('[data-add-sheet]'),pop=e.target.closest('[data-sheet-popout]');if(add||pop){e.preventDefault();e.stopImmediatePropagation();parent.postMessage({type:add?'cosmos:add-sheet':'cosmos:popout-sheet',nonce:location.hash.slice(1)},location.origin);}},true);window.addEventListener('message',event=>{if(event.data?.type==='cosmos:sheet-port'){window.call=peer(event.ports[0],()=>{}).call;}});parent.postMessage({type:'cosmos:sheet-ready',nonce:location.hash.slice(1)},location.origin);";type='text/javascript';}else if(/^\/owlbear\/[a-z.-]+$/.test(req.url)){bytes=await readFile('public'+req.url);type=req.url.endsWith('.css')?'text/css':'image/svg+xml';}else{res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':type});res.end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})}),checks=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:640}});page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{window.historyCalls=0;window.listCalls=0;window.receipts=[];window.diceTargets=[];window.commands=[];window.roomState={type:'state',admin:false,feed:'Live',layout:{party:false,initiative:false,partyDock:'top',initiativeDock:'left'}};window.rollRows=[{id:'roll-1',character:'Astra',label:'<img src=x onerror=alert(1)>',time:Date.now(),parts:[{label:'Attack',total:27,expression:'1d20+7',faces:[20]},{label:'Damage',total:8,expression:'2d6',faces:[3,5]}]}];});
 await page.goto('http://127.0.0.1:'+server.address().port+'/owlbear/index.html');await page.evaluate(()=>window.testReady);
 assert.equal(await page.locator('[data-panel-tab="admin"]').isVisible(),false);assert.equal(await page.locator('[data-admin-controls]').isVisible(),false);checks.push('player never sees Admin tab or display controls');
 assert.deepEqual(await page.locator('[data-panel-tab]').allTextContents(),['Character','Admin','Initiative','Settings']);checks.push('four ordered tabs with no Roll or Account header');
  const navTheme=await page.locator('.cosmos-tabs').evaluate(node=>({background:getComputedStyle(node).backgroundImage,radius:getComputedStyle(node).borderRadius,selected:getComputedStyle(node.querySelector('[aria-selected=true]')).backgroundImage}));
  assert.match(navTheme.background,/linear-gradient/);assert.match(navTheme.selected,/linear-gradient/);checks.push('Cosmos-themed tab gradients and active state are rendered');
 assert.equal(await page.locator('[data-connect]').isVisible(),true);assert.equal(await page.locator('[data-connect]').count(),1);await page.locator('[data-panel-tab="settings"]').click();assert.equal(await page.locator('[data-connect]').isVisible(),false);assert.equal(await page.locator('[data-refresh]').count(),0);assert.equal(await page.locator('a[href="/"]').count(),0);await page.locator('[data-panel-tab="character"]').click();checks.push('Connect only on Character before authentication; no Refresh or Open Cosmos');
 await page.evaluate(()=>window.deliver({...window.roomState,battle:[{id:'token-1',name:'Goblin',initiative:13,hp:17,hpMax:20,mp:4,mpMax:6,ac:14,touch:12,flat:11,cmd:17,trackHp:true,available:true}],turn:{id:'token-1',round:2}}));
 await page.locator('[data-panel-tab="initiative"]').click();assert.match(await page.locator('[data-initiative-panel]').textContent(),/Goblin/);assert.equal(await page.locator('.initiative-input').isDisabled(),true);checks.push('player initiative tab renders battle read-only');
 await page.locator('.battle-locate').hover();assert.deepEqual((await page.evaluate(()=>window.commands)).at(-1),{type:'highlight',id:'token-1'});await page.locator('[data-panel-tab="settings"]').hover();assert.deepEqual((await page.evaluate(()=>window.commands)).at(-1),{type:'highlight',id:null});checks.push('hover and exit highlight the matching map token without changing initiative');
 await page.locator('.battle-locate').click();assert.deepEqual((await page.evaluate(()=>window.commands)).at(-1),{type:'locate',id:'token-1'});checks.push('players can click initiative names to focus their own Owlbear camera');
 await page.locator('[data-panel-tab="settings"]').click();await page.locator('[data-history-details] summary').click();await page.waitForFunction(()=>document.querySelector('[data-history-status]')?.textContent?.includes('Connect Cosmos'));assert.match(await page.locator('[data-history-status]').textContent(),/Connect Cosmos/);assert.equal(await page.evaluate(()=>window.historyCalls),0);checks.push('disconnected history asks for account without fetching private receipts');
 await page.evaluate(()=>window.deliver({type:'room-rolls',rolls:[{id:'other-1',character:'Onyx',player:'Bob',time:1,label:'Stealth',parts:[{label:'Roll',total:16,expression:'1d20+4',faces:[12]}]}]}));assert.match(await page.locator('.roll-history').textContent(),/Bob/);checks.push('public rolls from another player appear before account connection');
 await page.evaluate(()=>window.deliver({type:'grant',token:'a'.repeat(64)}));await page.waitForFunction(()=>document.querySelector('[data-connect-prompt]')?.hidden===true);assert.equal(await page.locator('[data-panel-tab="character"]').getAttribute('aria-selected'),'true');await page.locator('[data-panel-tab="settings"]').click();await page.waitForSelector('.roll-history li');checks.push('successful connection returns to Character and hides Connect');
 assert.equal(await page.locator('.history-result strong').first().textContent(),'Attack 27');assert.equal(await page.locator('.history-result strong').nth(1).textContent(),'Damage 8');assert.equal(await page.locator('.roll-history img').count(),0);checks.push('connected history renders original totals/faces and escapes user labels');
 await page.evaluate(()=>{window.rollRows=[{...window.rollRows[0],id:'roll-2',label:'Saving throw',parts:[{label:'Roll',total:17,expression:'1d20+3',faces:[14]}]},...window.rollRows];});await page.locator('[data-refresh-history]').click();await page.waitForFunction(()=>document.querySelectorAll('.roll-history li').length===3);checks.push('refresh adds newest saved roll without rolling again');
 await page.evaluate(()=>window.deliver({...window.roomState,admin:true}));await page.locator('[data-panel-tab="admin"]').click();assert.equal(await page.locator('[data-admin-controls]').isVisible(),true);checks.push('verified admin can open display controls');
 assert.equal(await page.evaluate(()=>window.listCalls),1);checks.push('admin state does not duplicate the character roster request');
 await page.locator('[data-panel-tab="character"]').click();
 await page.waitForSelector('[data-npc-group] [data-character]');
 await page.setViewportSize({width:225,height:250});
 const rosterBounds=await page.evaluate(()=>{
  const scroll=document.querySelector('[data-character-roster]');
  const player=document.querySelector('[data-characters] .character-card');
  const npc=document.querySelector('[data-npc-characters] .character-card');
  return {scrollHeight:scroll.scrollHeight,clientHeight:scroll.clientHeight,clientWidth:scroll.clientWidth,
    playerWidth:player.getBoundingClientRect().width,npcWidth:npc.getBoundingClientRect().width,
    playerHeight:player.getBoundingClientRect().height};
 });
 assert.ok(rosterBounds.scrollHeight>rosterBounds.clientHeight,'roster must scroll instead of crushing players');
 assert.ok(Math.abs(rosterBounds.playerWidth-rosterBounds.npcWidth)<3,'player and NPC cards must share full width');
 assert.ok(rosterBounds.playerHeight>=53,'character cards stay legible in compact viewport');
 await page.setViewportSize({width:390,height:640});
 await page.locator('[data-panel-tab="admin"]').click();
 checks.push('compact roster scrolls both characters and NPCs at equal width');

 await page.locator('[data-panel-tab="character"]').click();
 await page.locator('[data-characters] [data-character]').first().click();
 await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.call);
 assert.equal(await page.locator('[data-panel-tab="character"]').textContent(),'Astra');
 assert.equal(await page.locator('.cosmos-sheet-tab-group').count(),1);
 assert.equal(await page.locator('[data-back],[data-add-sheet],[data-open-sheet-tab]').count(),0);
 const toolbar=page.frameLocator('iframe[data-sheet-inactive="false"]').locator('.cs-quick-tools');
 assert.equal(await toolbar.locator('[data-toggle-stars]').count(),1);
 assert.equal(await toolbar.locator('[data-open-rest]').count(),1);
 assert.equal(await toolbar.locator('[data-add-sheet]').count(),1);
 assert.equal(await toolbar.locator('[data-sheet-popout]').count(),1);
 const popupPromise=page.waitForEvent('popup');
 await toolbar.locator('[data-sheet-popout]').click();
 const newWindow=await popupPromise;await newWindow.close();
 await toolbar.locator('[data-add-sheet]').click();
 await page.locator('[data-sheet-search]').fill('long NPC');await page.locator('[data-sheet-search-go]').click();
 assert.equal(await page.locator('[data-pick-sheet="npc-1"]').isVisible(),true);
 await page.locator('[data-sheet-search]').fill('not a character');
 assert.equal(await page.locator('[data-pick-sheet]').count(),0);
 await page.locator('[data-sheet-picker] form button').click();
 const single=page.locator('.cosmos-sheet-tab-group');
 assert.equal(await single.locator('.extension-sheet-close').evaluate(n=>getComputedStyle(n).visibility),'hidden');
 await single.locator('[data-panel-tab="character"]').hover();
 assert.equal(await single.locator('.extension-sheet-close').evaluate(n=>getComputedStyle(n).visibility),'visible');
 await single.locator('.extension-sheet-close').click();
 assert.equal(await page.locator('.cosmos-sheet-tab-group').count(),0);
 assert.equal(await page.locator('[data-panel-tab="character"]').textContent(),'Character');
 await page.locator('[data-panel-tab="admin"]').click();
 checks.push('admin-only NPC is searchable; search filters unmatched names');


 await page.evaluate(()=>window.deliver({...window.roomState,admin:true,battle:[{id:'token-1',name:'Goblin',initiative:13,hp:17,hpMax:20,mp:4,mpMax:6,ac:14,touch:12,flat:11,cmd:17,trackHp:true,available:true}],turn:{id:'token-1',round:2}}));
 await page.locator('[data-panel-tab="initiative"]').click();assert.equal(await page.locator('.initiative-input').isEnabled(),true);await page.locator('[data-turn="1"]').click();assert.equal((await page.evaluate(()=>window.commands)).at(-1).type,'turn');checks.push('authorized GM can change initiative and send turn commands');
 await page.locator('[data-panel-tab="admin"]').click();
 await page.evaluate(()=>window.deliver(window.roomState));assert.equal(await page.locator('[data-panel-tab="admin"]').isVisible(),false);assert.equal(await page.locator('[data-admin-controls]').isVisible(),false);assert.equal(await page.locator('[data-panel-tab="character"]').getAttribute('aria-selected'),'true');checks.push('revoked admin immediately loses controls and returns to Character');assert.equal(await page.locator('[data-npc-characters] [data-character]').count(),0);
 assert.equal(await page.locator('[data-turn="1"]').isVisible(),false);checks.push('role revocation disables initiative controls');
 await page.locator('[data-panel-tab="character"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-panel-tab="initiative"]').getAttribute('aria-selected'),'true');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks.push('phone layout and keyboard tabs skip hidden Admin');
 await page.locator('[data-panel-tab="character"]').click();await page.locator('[data-character]').first().click();await page.waitForFunction(()=>typeof document.querySelector('iframe')?.contentWindow.call==='function');
 assert.equal(await page.locator('[data-panel-tab="character"]').textContent(),'Astra');assert.equal(await page.locator('.cosmos-sheet-tab-group').count(),1);assert.equal(await page.frameLocator('iframe[data-sheet-inactive="false"]').locator('[data-add-sheet]').isVisible(),true);assert.equal(await page.frameLocator('iframe[data-sheet-inactive="false"]').locator('[data-sheet-popout]').isVisible(),true);assert.equal(await page.locator('[data-panel-tab^="sheet:"]').count(),0);
 await page.locator('[data-add-sheet]').click();assert.equal(await page.locator('[data-pick-sheet="npc-1"]').count(),0);await page.locator('[data-sheet-search]').fill('Nyx');assert.equal(await page.locator('[data-pick-sheet="character-2"]').isVisible(),true);await page.locator('[data-pick-sheet="character-2"]').click();await page.waitForFunction(()=>document.querySelectorAll('iframe').length===2);await page.waitForFunction(()=>typeof document.querySelectorAll('iframe')[1]?.contentWindow.call==='function');
 assert.equal(await page.locator('[data-panel-tab="character"]').textContent(),'Astra');assert.equal(await page.locator('[data-panel-tab="sheet:character-2"]').textContent(),'Nyx');assert.equal(await page.locator('iframe:visible').count(),1);
  assert.equal(await page.locator('.cosmos-sheet-tab-group').count(),2);
  assert.equal(await page.locator('.cosmos-sheet-tab-group >button[role=tab]').count(),2);
  assert.equal(await page.locator('.cosmos-sheet-tab-group >.extension-sheet-close').count(),2);
  assert.equal(await page.locator('.cosmos-sheet-tab-group:has(>button[aria-selected=true])').count(),1);
  const chipStyles=await page.locator('.cosmos-sheet-tab-group').first().evaluate(node=>({background:getComputedStyle(node).backgroundImage,radius:getComputedStyle(node).borderRadius}));
  assert.match(chipStyles.background,/linear-gradient/);
  assert.notEqual(chipStyles.radius,'0px');
  checks.push('extra character tabs use matching Cosmos chips with joined close controls and active gradients');
 await page.locator('[data-panel-tab="character"]').click();assert.equal(await page.locator('iframe:visible').count(),1);assert.equal(await page.evaluate(()=>document.querySelectorAll('iframe')[0].hidden),false);
 await page.evaluate(()=>{const child=document.querySelectorAll('iframe')[0].contentWindow;const url=new URL(child.location.href);url.searchParams.set('section','items');child.history.replaceState(null,'',url);child.scrollTo(0,420);});
 const scrollDebug=()=>page.evaluate(()=>{const frame=document.querySelectorAll('iframe')[0],child=frame?.contentWindow,doc=child?.document;return {y:child?.scrollY,frameHeight:frame?.getBoundingClientRect().height,frameHidden:frame?.hidden,inactive:frame?.dataset.sheetInactive,saved:frame?.dataset.savedScroll,target:frame?.dataset.restoreTarget,actual:frame?.dataset.restoreActual,docScroll:doc?.scrollingElement?.scrollTop,docHeight:doc?.scrollingElement?.scrollHeight,clientHeight:doc?.scrollingElement?.clientHeight,url:child?.location.href};});
 const initialScroll=await scrollDebug();console.log('First sheet before switching',initialScroll);
 assert.ok(initialScroll.y>=390,'First sheet must actually scroll before testing restoration');
 await page.locator('[data-panel-tab="sheet:character-2"]').click();
 await page.locator('[data-panel-tab="character"]').click();
 assert.equal(await page.evaluate(()=>document.querySelectorAll('iframe')[0].contentWindow.location.search.includes('section=items')),true);
 try{await page.waitForFunction(()=>document.querySelectorAll('iframe')[0]?.contentWindow?.scrollY>=390,null,{timeout:5000});}
 catch(error){console.error('First sheet after switching',await scrollDebug());throw error;}
 checks.push('switching sheets restores the previous scroll position and internal section tab');
 await page.locator('[data-panel-tab="sheet:character-2"]').click();await page.locator('[data-close-extension-sheet="character-2"]').click();assert.equal(await page.locator('iframe').count(),1);assert.equal(await page.locator('[data-panel-tab^="sheet:"]').count(),0);assert.equal(await page.locator('[data-panel-tab="character"]').textContent(),'Character');assert.equal(await page.locator('.cosmos-sheet-tab-group').count(),0);checks.push('Add Sheet beside popout uses named main tabs, switching preserves iframes, and single sheet hides extra tabs');
 const requestId=await page.evaluate(()=>crypto.randomUUID());await page.evaluate(async requestId=>{const sheet=document.querySelector('iframe').contentWindow;await sheet.call('roll-context',{requestId});await sheet.call('dice',{requestId,notation:'1d20+5'});},requestId);
 await page.locator('[data-panel-tab="settings"]').click();await page.locator('[data-roll-audience]').selectOption('self');await page.evaluate(async requestId=>{const sheet=document.querySelector('iframe').contentWindow;await sheet.call('dice',{requestId,notation:'1d20+5'});await sheet.call('api',{path:'/api/v1/character-records/character-1',method:'POST',body:{op:'roll',requestId,label:'Attack'}});},requestId);
 assert.deepEqual(await page.evaluate(()=>window.diceTargets),['everyone','everyone']);assert.equal(await page.evaluate(()=>window.receipts[0].target),'everyone');assert.equal(await page.evaluate(()=>window.receipts[0].entry.parts[0].total),22);checks.push('one logical roll keeps its initial audience through every die and shared receipt');
 await page.evaluate(async()=>{const requestId=crypto.randomUUID(),sheet=document.querySelector('iframe').contentWindow;await sheet.call('roll-context',{requestId});await sheet.call('api',{path:'/api/v1/character-records/character-1',method:'POST',body:{op:'roll',requestId,label:'Private'}});});assert.equal(await page.evaluate(()=>window.receipts[1].target),'self');checks.push('next private roll remains private when recorded');
 await page.locator('[data-panel-tab="settings"]').click();
 await page.screenshot({path:path.join(output,'roll-history-phone.png')});assert.deepEqual(errors,[]);console.log(JSON.stringify({checks,errors,output},null,2));await writeFile(path.join(output,'results.json'),JSON.stringify({checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
