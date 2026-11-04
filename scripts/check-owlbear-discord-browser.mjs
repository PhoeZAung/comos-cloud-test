// Real Owlbear sheet iframe, message-port bridge, sheet controls and roll backend.
// Synthetic account/dice and a captured Discord relay: no real messages or rolls.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharactersService} from '../backend/characters/service.mjs';
import {publishRoll} from '../backend/characters/rolls.mjs';
const db=await openDatabase(':memory:'),user=createUserRepository(db).create(),id=randomUUID(),messages=[],requests=[],checks=[],errors=[];
createCharactersService(db).save({op:'save',id,revision:0,name:'Owlbear Test',ownerId:user.id,sources:[]});
const character={id,name:'Owlbear Test',revision:1,data:{dex:14,hp_curr:10,hp_max:10,mp:5,mp_class:5,weapons:[{name:'Short Sword',attack_type:'melee',damage:'1d6',u_max:3,u_curr:2}],activeAbilities:[{name:'Arcane Ward',u_max:4,u_curr:2}]}},output=await mkdtemp(path.join(tmpdir(),'cosmos-owlbear-discord-'));
const host='<!doctype html><html><body><iframe title="Cosmos" style="width:900px;height:850px" src="/owlbear/sheet.html?characterId='+id+'&section=combat#test-discord"></iframe><script type="module" src="/_test/host.mjs"></script></body></html>';
const bridge=`import {peer} from '/_test/rpc.mjs';window.addEventListener('message',event=>{if(event.origin!==location.origin||event.data?.type!=='cosmos:sheet-ready'||event.data.nonce!=='test-discord')return;const channel=new MessageChannel();peer(channel.port1,async(method,value)=>{if(method==='roll-context')return {};if(method==='dice')return {groups:[{diceType:'d20',dice:[{value:17}]}]};if(method==='api'){const response=await fetch('/_test/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});return response.json();}throw Error('Unexpected bridge method');});event.source.postMessage({type:'cosmos:sheet-port',nonce:'test-discord'},location.origin,[channel.port2]);});`;
const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server=createServer(async(req,res)=>{
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return;}
  if(url.pathname==='/_test/api'){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);const value=JSON.parse(Buffer.concat(chunks));
   if(value.method==='POST'&&value.body?.op==='roll'){
    requests.push(value.body);db.prepare('UPDATE sheet_rolls SET created_at=0').run();
    const result=await publishRoll({db,userId:user.id,character,change:value.body,origin:'https://example.test',sendFetch:async(target,options)=>{messages.push(JSON.parse(options.body));return {ok:true};}});send(200,{status:200,data:result});return;
   }
   send(200,{status:200,data:value.path.includes('character-records')?{character,admin:false}:value.path==='/api/v1/auth/session'?{user:{id:user.id,preferences:{}}}:{}});return;
  }
  let bytes,type;
  if(url.pathname==='/'){bytes=host;type='text/html';}
  else if(url.pathname==='/_test/host.mjs'){bytes=bridge;type='text/javascript';}
  else if(url.pathname==='/_test/rpc.mjs'){bytes=await readFile('src/owlbear/rpc.mjs');type='text/javascript';}
  else{const file=path.resolve('dist-live','.'+url.pathname);if(!file.startsWith(path.resolve('dist-live')+path.sep)){res.writeHead(404).end();return;}bytes=await readFile(file);type=mime[path.extname(file)]||'application/octet-stream';}
  res.writeHead(200,{'Content-Type':type});res.end(bytes);
 }catch(error){errors.push(error.message);send(500,{message:'Synthetic test failed.'});}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})});
try{
 const page=await browser.newPage({viewport:{width:1000,height:1000}});page.on('pageerror',error=>errors.push(error.message));await page.goto('http://127.0.0.1:'+server.address().port);
 const sheet=page.frameLocator('iframe');await sheet.locator('[data-roll="Initiative"]').waitFor();assert.equal(await sheet.locator('[data-discord-rolls]').isChecked(),true);checks.push('actual extension sheet starts with Discord rolls enabled');
 await sheet.locator('[data-roll="Initiative"]').click();await sheet.locator('[data-sheet-status]').filter({hasText:'Rolled with Dice+'}).waitFor();
 assert.equal(requests.length,1);assert.equal(requests[0].discord,true);assert.deepEqual(requests[0].owlbearRolls,[{expression:'1d20+2',faces:[17]}]);assert.equal(messages.length,1);assert.match(messages[0].content,/19 \(1d20\+2 · 17\)/);assert.deepEqual(messages[0].allowed_mentions,{parse:[]});checks.push('Dice+ face and sheet modifier produce one matching Discord receipt');
 await sheet.locator('[data-recovery-menu]').click();await sheet.locator('[data-discord-rolls]').uncheck();await sheet.locator('[data-recovery-menu]').click();const posted=page.waitForResponse(response=>response.url().endsWith('/_test/api')&&response.request().postDataJSON()?.body?.op==='roll');await sheet.locator('[data-roll="Initiative"]').click();await posted;
 await page.waitForFunction(()=>!document.querySelector('iframe').contentDocument.querySelector('[data-sheet]')?.classList.contains('cs-saving'));assert.equal(requests.length,2);assert.equal(requests[1].discord,false);assert.equal(messages.length,1);checks.push('turning Discord rolls off prevents delivery while Dice+ still rolls');
 await sheet.locator('[data-sheet-tab="skills"]').click();assert.equal(await sheet.locator('[data-discord-rolls]').isChecked(),false);checks.push('sheet tab changes retain the chosen Discord switch');
 await sheet.locator('[data-sheet-tab="combat"]').click();const pencil=sheet.locator('[data-edit-entry="weapons:0"]');const style=await pencil.evaluate(node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect();return {border:s.borderTopWidth,background:s.backgroundColor,width:r.width,height:r.height,svg:!!node.querySelector('svg')};});assert.equal(style.border,'0px');assert.equal(style.background,'rgba(0, 0, 0, 0)');assert.ok(style.width<25&&style.height<28&&style.svg);await pencil.click();assert.equal(await sheet.locator('[data-sheet-dialog] input[name="name"]').inputValue(),'Short Sword');await sheet.locator('[data-sheet-dialog] [data-dialog-close]').first().click();checks.push('weapon pencil is borderless, text-sized, and opens its editor');
 await sheet.locator('[data-sheet-tab="abilities"]').click();await sheet.locator('[data-edit-entry="activeAbilities:0"]').click();assert.equal(await sheet.locator('[data-sheet-dialog] input[name="name"]').inputValue(),'Arcane Ward');await sheet.locator('[data-sheet-dialog] [data-dialog-close]').first().click();checks.push('ability pencil opens the matching editor');
 assert.deepEqual(errors,[]);await page.screenshot({path:path.join(output,'discord-setting.png')});console.log(JSON.stringify({checks,messagesCaptured:messages.length,errors,output},null,2));await writeFile(path.join(output,'results.json'),JSON.stringify({checks,errors},null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));db.close();}
