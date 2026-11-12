// Real sheet controls and server save/archive routes, isolated SQLite and fake
// administrator session. Never opens Firebase or sends a Discord message.
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
import {createDirectoryRoutes} from '../backend/characters/directory.mjs';
import {createUserDeletionRoutes} from '../backend/characters/user-deletion.mjs';

const db=await openDatabase(':memory:'),users=createUserRepository(db),admin=users.create({displayName:'Test Admin'}),player=users.create({displayName:'Test Player'}),id=randomUUID(),checks=[],errors=[];
const output=await mkdtemp(path.join(tmpdir(),'cosmos-sheet-entry-'));let origin,failArchive=false,archives=0;
createCharactersService(db).save({op:'save',id,revision:0,name:'Test Character',ownerId:player.id,sources:[]});
db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(id,JSON.stringify({str:14,dex:12,hp_max:10,hp_curr:10,mp_class:4,mp_curr:4,weapons:[{name:'Celestial Gunblade',damage:'1d8',attack_type:'melee',u_curr:2,u_max:6,desc:'A blade of starlight.'}],activeAbilities:[{name:'Celestial Ward',type:'Su',action_type:'Swift',desc:'Raise a shield.',effect:'Absorb the next strike.',at_higher_lvls:'The shield grows stronger.',u_curr:2,u_max:3}]}));
const sessions={restore:async()=>({user:users.get(admin.id),subject:'admin'})};let directory,removeUser;
const mime={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server=createServer(async(req,res)=>{
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try{
  const url=new URL(req.url,origin);req.headers.cookie='__Host-comos_session=admin';
  if(url.pathname==='/api/v1/auth/session'||url.pathname==='/api/v1/account'){send(200,{user:users.get(admin.id)});return;}
  if(url.pathname==='/api/v1/access'){send(200,{admin:true});return;}
  if(req.method==='POST'&&url.pathname.startsWith('/api/v1/character-records/')){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=JSON.parse(Buffer.concat(chunks));
   if(body.op==='archive'){archives++;if(failArchive){send(503,{message:'Synthetic archive failure.'});return;}}
   const {Readable}=await import('node:stream');const proxy=Readable.from([Buffer.from(JSON.stringify(body))]);Object.assign(proxy,{headers:req.headers,method:req.method,url:req.url,socket:req.socket});await directory(proxy,res,url.pathname,send);return;
  }
  if(await removeUser(req,res,url.pathname,send)||await directory(req,res,url.pathname,send))return;
  if(url.pathname.startsWith('/api/')){send(200,{characters:[],items:[]});return;}
  if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return;}
  const file=path.resolve('dist-live','.'+(url.pathname==='/'?'/sheet.html':url.pathname));if(!file.startsWith(path.resolve('dist-live')+path.sep)){res.writeHead(404).end();return;}
  const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);
 }catch(error){errors.push(error.message);send(500,{message:error.message});}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
directory=createDirectoryRoutes({db,sessions,adminUids:['admin'],origin});removeUser=createUserDeletionRoutes({db,sessions,adminUids:['admin'],origin});

let page;const browser=await chromium.launch({headless:true});
try{
 page=await browser.newPage({viewport:{width:800,height:850}});
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(origin+'/sheet.html?characterId='+id+'&section=combat');
 await page.locator('[data-entry-preview="weapons:0"]').waitFor();
 await page.locator('[data-edit-entry="weapons:0"]').click();
 const editor=page.locator('[data-sheet-dialog]');
 await editor.locator('[data-weapon-ar-mod]').waitFor();
 assert.match(await editor.locator('[name=ability_mod]').locator('xpath=..').innerText(),/AR Mod/);
 assert.match(await editor.locator('[name=damage_ability]').locator('xpath=..').innerText(),/DMG Mod/);
 assert.equal(await editor.locator('[data-weapon-ar-mod]').innerText(),'STR: +2');
 assert.equal(await editor.locator('[data-weapon-dmg-mod]').innerText(),'None: +0');
 assert.equal(await editor.locator('[data-weapon-ar-mod]').evaluate(node=>getComputedStyle(node).fontWeight),'700');
 assert.equal(await editor.locator('[data-weapon-dmg-mod]').evaluate(node=>getComputedStyle(node).fontWeight),'700');
 assert.equal(await editor.locator('.cs-weapon-ability-preview').count(),0);
 assert.doesNotMatch(await editor.innerText(),/Melee starts with STR/);
 await editor.locator('[name=damage_ability]').selectOption('str');
 assert.equal(await editor.locator('[data-weapon-dmg-mod]').innerText(),'STR: +2');
 await editor.locator('[name=damage_style]').selectOption('two_handed');
 assert.equal(await editor.locator('[data-weapon-dmg-mod]').innerText(),'STR: +3');
 await editor.locator('[data-dialog-close]').first().click();
 checks.push('weapon AR Mod and DMG Mod bold labels show only effective ability modifiers, never total attack roll');

 await page.locator('[data-sheet-tab=abilities]').click();
 const categories=['activeAbilities','passiveAbilities','feats','racialAbilities'];
 for(const category of categories){
  await page.locator('[data-ability-category="'+category+'"]').click();
  const button=page.locator('[data-collection="'+category+'"] [data-add-manual-ability]');
  assert.equal(await button.textContent(),'+');
  assert.equal(await page.locator('[data-collection="'+category+'"] [data-add-ability-group]').count(),1);
  assert.equal(await page.locator('.cs-ability-add-menu').count(),0);
  await button.click();await editor.waitFor({state:'visible'});
  assert.equal(await editor.locator('[data-editor-premade]').isVisible(),true);
  assert.equal(await editor.locator('details.cs-ability-advanced').evaluate(n=>n.open),false);
  const fields=await editor.locator('.cs-manual-ability-editor').evaluate(node=>[...node.children].map(el=>el.tagName.toLowerCase()));
  assert.deepEqual(fields,['label','details','div']);
  const labels=await editor.locator('.cs-ability-prose-card .cs-rich-heading label').allTextContents();
  assert.deepEqual(labels,['Description','Effect','At Higher Lvls']);
  const advanced=editor.locator('details.cs-ability-advanced');
  await advanced.locator('summary').click();
  assert.equal(await advanced.evaluate(n=>n.open),true);
  assert.equal(await editor.locator('[name=action_type]').isVisible(),true);
  await editor.locator('[data-dialog-close]').first().click();
 }
 checks.push('each ability category opens manual directly with name, collapsed advanced settings and three matching prose cards');
 await page.locator('[data-ability-category=activeAbilities]').click();
 const add=page.locator('[data-collection=activeAbilities] [data-add-manual-ability]');
 await add.click();
 page.once('dialog',dialog=>dialog.accept());
 await editor.locator('[name=name]').fill('Unsaved homebrew');
 await editor.locator('[data-editor-premade]').click();
 await page.locator('.cs-ability-library').waitFor({state:'visible'});
 assert.equal(await editor.isVisible(),false);
 await page.locator('[data-library-close]').click();
 checks.push('Add Premade in manual dialog opens rule library after confirming unsaved edits');

 await page.setViewportSize({width:320,height:720});
 await add.click();await editor.waitFor({state:'visible'});
 assert.ok(await editor.evaluate(n=>n.scrollWidth<=n.clientWidth+2),'manual ability dialog must not overflow small screens');
 await editor.locator('[data-dialog-close]').first().click();
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({checks,errors},null,2));
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
 db.close();
}
