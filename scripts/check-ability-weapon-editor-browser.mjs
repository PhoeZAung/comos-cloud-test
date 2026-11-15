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
db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(id,JSON.stringify({str:14,dex:12,hp_max:10,hp_curr:10,mp_class:4,mp_curr:4,weapons:[{name:'Celestial Gunblade',damage:'1d8',attack_type:'melee',u_curr:2,u_max:6,desc:'A blade of starlight.'}],items:[
 {name:'Steel Blade',sourceCategory:'Weapon',amount:1,weight:4,cost:'12 Gil',dmg:'1d8',crit:'20/x2',rarity:'Uncommon',shopSource:'pathfinder-1e',sourceCategoryDetail:'Weapons',sourceItemId:'pf1e:sword',sourceCatalog:{raw:{Weight:'4 lb'}},desc:'A steel blade.'},
 {name:'Round Shield',sourceCategory:'Armor',amount:1,weight:6,acBonus:'2',spellFailure:'15%',desc:'A small shield.'},
 {name:'Rope',sourceCategory:'Gear',amount:2,weight:1,cost:'3 Gil',desc:'Useful rope.'},
 {name:'Celestial Cartridge',sourceCategory:'Ammunition',amount:8,weight:0.02}
 ],activeAbilities:[{name:'Celestial Ward',type:'Su',action_type:'Swift',desc:'Raise a shield.',effect:'Absorb the next strike.',at_higher_lvls:'The shield grows stronger.',u_curr:2,u_max:3}]}));
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

const readData=()=>JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id).data_json);
let page;const browser=await chromium.launch({headless:true});
try{
 page=await browser.newPage({viewport:{width:800,height:850}});
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(origin+'/sheet.html?characterId='+id+'&section=combat');
 await page.locator('[data-entry-preview="weapons:0"]').waitFor();
 await page.locator('[data-edit-entry="weapons:0"]').click();
 const editor=page.locator('[data-sheet-dialog]');
 assert.deepEqual(await editor.locator('[data-entry-edit-tab]').allTextContents(),['Basic Info','Weapon Stats','Ammunition','Saves']);
 assert.equal(await editor.locator('[data-entry-edit-tab=details]').getAttribute('aria-selected'),'true');
 await editor.locator('[data-entry-edit-tab=stats]').click();
 await editor.locator('[data-weapon-ar-mod]').waitFor();
 assert.match(await editor.locator('[name=ability_mod]').locator('xpath=..').innerText(),/Attack Stat/);
 assert.match(await editor.locator('[name=damage_ability]').locator('xpath=..').innerText(),/Damage Stat/);
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
 await editor.locator('[data-entry-edit-tab=details]').click();
 await editor.locator('[name=sourceCategory]').selectOption('Ranged Weapon');
 assert.equal(await editor.locator('[name=type]').count(),0);
 await editor.locator('[data-entry-edit-tab=stats]').click();
 assert.equal(await editor.locator('[name=misfire]').isVisible(),true);
 await editor.locator('[name=misfire]').fill('1–2');
 await editor.locator('[data-entry-edit-tab=ammunition]').click();
 assert.equal(await editor.locator('[data-entry-edit-panel=details]').isVisible(),false);
 assert.equal(await editor.locator('[data-entry-edit-panel=ammunition]').isVisible(),true);
 assert.match(await editor.locator('[name=u_curr]').locator('xpath=..').innerText(),/Ammo/);
 assert.match(await editor.locator('[name=u_max]').locator('xpath=..').innerText(),/Max Ammo/);
 await editor.locator('[name=ammoType]').fill('Celestial Cartridge');
 assert.match(await editor.locator('[data-ammo-summary]').innerText(),/2 \/ 6 · Inventory 8/);
 await editor.locator('[name=u_curr]').fill('9');
 assert.match(await editor.locator('[data-ammo-summary]').innerText(),/Ammo cannot exceed Max Ammo/);
 await editor.locator('[data-sheet-form] button[type=submit]').click();
 assert.equal(await editor.isVisible(),true);
 assert.match(await editor.locator('[data-dialog-status]').innerText(),/Ammo cannot exceed Max Ammo/);
 await editor.locator('[name=u_curr]').fill('4');
 await editor.locator('[name=u_max]').fill('8');
 assert.match(await editor.locator('[data-ammo-summary]').innerText(),/4 \/ 8 · Inventory 8/);
 await editor.locator('[data-entry-edit-tab=saves]').click();
 assert.equal(await editor.locator('[name=save_type]').isVisible(),true);
 assert.match(await editor.locator('.cs-save-help summary').innerText(),/How weapon saves work/);
 await editor.locator('[data-sheet-form] button[type=submit]').click();
  await editor.waitFor({state:'hidden',timeout:12000}).catch(async()=>{throw Error('Weapon save stayed open. Dialog status: '+await editor.locator('[data-dialog-status]').innerText()+'; sheet status: '+await page.locator('[data-sheet-status]').innerText());});
  assert.equal(readData().weapons[0].sourceCategory,'Ranged Weapon');
 assert.equal(readData().weapons[0].type,undefined);
 assert.equal(readData().weapons[0].u_curr,4);
 assert.equal(readData().weapons[0].u_max,8);
 assert.equal(readData().weapons[0].misfire,'1–2');
 assert.equal(readData().weapons[0].ammoType,'Celestial Cartridge');
 await page.locator('[data-weapon-view="Ranged Weapon"]').click();
 await page.locator('[data-weapon-reload="0"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-action-feedback]')?.textContent?.includes('Reloaded'));
 assert.equal(readData().weapons[0].u_curr,8);
 assert.equal(readData().items[3].amount,4);
 checks.push('weapon four-tab editor saves stats and reload consumes exact inventory ammunition');

 await page.locator('[data-sheet-tab=items]').click();
 const popup=page.locator('[data-item-description-dialog]');
 await page.locator('[data-item-description="items:0"]').click();
 await popup.locator('[data-item-popup-edit]').click();
 await editor.waitFor({state:'visible'});
 assert.equal(await editor.locator('[role=tab][data-item-edit-tab]').count(),2);
 assert.equal(await editor.locator('[data-item-edit-tab=details]').getAttribute('aria-selected'),'true');
 assert.equal(await editor.locator('[data-item-edit-tab=stats]').innerText(),'Weapon Stats');
 await editor.locator('[name=name]').fill('Steel Blade +1');
 await editor.locator('[name=amount]').fill('3');
 await editor.locator('[data-item-edit-tab=stats]').click();
 assert.equal(await editor.locator('[data-item-edit-panel=details]').isVisible(),false);
 assert.equal(await editor.locator('[data-item-edit-panel=stats]').isVisible(),true);
 await editor.locator('[name=dmg]').fill('2d6');
 await editor.locator('[name=crit]').fill('19-20/x2');
 await editor.locator('[name=special]').fill('Tested enchantment');
 assert.equal(await editor.locator('[type=submit]').isVisible(),true,'Save stays visible when Stats is selected');
 await editor.locator('[type=submit]').click();
 await editor.waitFor({state:'hidden'});
 assert.equal(readData().items[0].name,'Steel Blade +1');
 assert.equal(readData().items[0].amount,3);
 assert.equal(readData().items[0].dmg,'2d6');
 assert.equal(readData().items[0].crit,'19-20/x2');
 assert.equal(readData().items[0].rarity,'Uncommon','unrendered imported metadata remains unchanged');
 assert.equal(readData().items[0].sourceCategoryDetail,'Weapons');
 checks.push('imported weapon item saves across Item Details and Weapon Stats tabs without losing hidden source metadata');

 await page.locator('[data-item-description="items:1"]').click();
 await popup.locator('[data-item-popup-edit]').click();
 await editor.waitFor({state:'visible'});
 assert.equal(await editor.locator('[data-item-edit-tab=stats]').innerText(),'Armor Stats');
 await editor.locator('[data-item-edit-tab=stats]').click();
 await editor.locator('[name=acBonus]').fill('3');
 await editor.locator('[name=spellFailure]').fill('20%');
 await editor.locator('[type=submit]').click();
 await editor.waitFor({state:'hidden'});
 assert.equal(readData().items[1].acBonus,'3');
 assert.equal(readData().items[1].spellFailure,'20%');
 checks.push('armor save works from Stats tab with Item Details hidden');

 await page.locator('[data-item-description="items:2"]').click();
 await popup.locator('[data-item-popup-edit]').click();
 await editor.waitFor({state:'visible'});
 assert.equal(await editor.locator('[data-item-edit-tab=stats]').innerText(),'Gear Stats');
 assert.equal(await editor.locator('[data-item-edit-panel=details] [name=amount]').count(),1);
 assert.equal(await editor.locator('[data-item-edit-panel=details] [name=cost]').count(),1);
 assert.equal(await editor.locator('[data-item-edit-panel=details] [name=weight]').count(),1);
 assert.equal(await editor.locator('[data-item-edit-panel=details] [name=rarity]').count(),0);
 await editor.locator('[name=name]').fill('');
 await editor.locator('[data-item-edit-tab=stats]').click();
 await editor.locator('[type=submit]').click();
 assert.equal(await editor.isVisible(),true,'invalid name keeps editor open');
 assert.equal(await editor.locator('[data-item-edit-tab=details]').getAttribute('aria-selected'),'true','validation switches to Item Details');
 assert.match(await editor.locator('[data-dialog-status]').innerText(),/Enter an item name/);
 await editor.locator('[name=name]').fill('Silk Rope');
 await editor.locator('[name=weight]').fill('2');
 await editor.locator('[data-item-edit-tab=stats]').click();
 await editor.locator('[name=special]').fill('Custom stats');
 await editor.locator('[type=submit]').click();
 await editor.waitFor({state:'hidden'});
 assert.equal(readData().items[2].name,'Silk Rope');
 assert.equal(readData().items[2].weight,2);
 assert.equal(readData().items[2].special,'Custom stats');
 checks.push('custom item Save works with minimal fields and validation from either tab');

 await page.locator('[data-sheet-tab=combat]').click();
 await page.locator('[data-move-inventory-weapons]').click();
 await page.waitForFunction(()=>document.querySelector('[data-sheet-status]')?.textContent?.includes('moved into Weapons'));
 assert.equal(readData().weapons.length,3);
 assert.equal(readData().weapons[1].name,'Steel Blade +1');
 assert.equal(readData().weapons[1].sourceItemId,'pf1e:sword');
 assert.equal(readData().items.length,2,'armor and rope stay in Inventory; ammunition is shown with weapons');
 checks.push('legacy purchased weapons and ammo move into Armory, keeping provenance and quantities');
 await page.locator('[data-weapon-add-toggle]').click();
 assert.equal(await page.locator('[data-weapon-add-panel]').isVisible(),true);
 assert.deepEqual(await page.locator('[data-weapon-add-panel] button').allTextContents(),['Weapon','Ranged','Ammunition']);
 await page.locator('[data-add-weapon-kind="Ammunition"]').click();
 await editor.waitFor({state:'visible'});
 assert.deepEqual(await editor.locator('[data-entry-edit-tab]').allTextContents(),['Basic Info','Ammunition Stats']);
 await editor.locator('[name=name]').fill('New Bolts');
 await editor.locator('[data-entry-edit-tab=ammo-stats]').click();
 assert.equal(await editor.locator('[name=amount]').isVisible(),true);
 assert.equal(await editor.locator('[name=damage]').count(),0);
 await editor.locator('[name=amount]').fill('9');
 await editor.locator('[name=ammo_ar_bonus]').fill('3');
 await editor.locator('[name=ammo_dmg_bonus]').fill('2');
 await editor.locator('[data-add-damage-type]').selectOption('Other');
 assert.equal(await editor.locator('[name=damage_type_other]').isVisible(),true);
 await editor.locator('[name=damage_type_other]').fill('Arcane');
 await editor.locator('[data-sheet-form] button[type=submit]').click();
 await editor.waitFor({state:'hidden'});
 assert.equal(readData().weapons[3].name,'New Bolts');
 assert.equal(readData().weapons[3].amount,9);
 assert.equal(readData().weapons[3].ammo_ar_bonus,3);
 assert.equal(readData().weapons[3].ammo_dmg_bonus,2);
 assert.deepEqual(readData().weapons[3].damage_types,['Other']);
 assert.equal(readData().weapons[3].damage_type_other,'Arcane');
 assert.equal(readData().weapons[3].sourceCategory,'Ammunition');
 await page.locator('[data-weapon-view="Ammunition"]').click();
 assert.equal(await page.locator('[data-edit-weapon-ammo="weapons:3"]').count(),1);
 checks.push('three-choice weapon Add and ammunition-only Amount editor save into armory');
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
  assert.deepEqual(await editor.locator('[data-entry-edit-tab]').allTextContents(),['Details','Combat','Saves','Resources']);
  assert.equal(await editor.locator('[data-entry-edit-panel=details] [name=name]').count(),1);
  const labels=await editor.locator('.cs-ability-prose-card .cs-rich-heading label').allTextContents();
  assert.deepEqual(labels,['Description','Effect','Higher Levels']);
  assert.doesNotMatch(await editor.innerText(),/Sp = spell-like|Advanced Settings/);
  await editor.locator('[data-entry-edit-tab=combat]').click();
  assert.equal(await editor.locator('[name=action_type]').isVisible(),true);
  await editor.locator('[data-entry-edit-tab=saves]').click();
  assert.equal(await editor.locator('[name=save_type]').isVisible(),true);
  assert.match(await editor.locator('.cs-save-help summary').innerText(),/How saves work in Owlbear/);
  await editor.locator('[data-entry-edit-tab=resources]').click();
  assert.equal(await editor.locator('[name=u_curr]').isVisible(),true);
  assert.equal(await editor.locator('[name=u_max]').isVisible(),true);
  await editor.locator('[data-entry-edit-tab=details]').click();
  await editor.locator('[data-dialog-close]').first().click();
 }
 checks.push('every ability category has Details, Combat, Resources and Saves tabs');
 await page.locator('[data-ability-category=activeAbilities]').click();
 await page.locator('[data-edit-entry="activeAbilities:0"]').click();
 await editor.waitFor({state:'visible'});
 await editor.locator('[name=name]').fill('Celestial Ward II');
 await editor.locator('[data-entry-edit-tab=combat]').click();
 await editor.locator('[name=action_type]').selectOption('Move');
 await editor.locator('[data-entry-edit-tab=resources]').click();
 await editor.locator('[name=u_max]').fill('5');
 await editor.locator('[name=u_curr]').fill('3');
 await editor.locator('[data-entry-edit-tab=saves]').click();
 await editor.locator('[name=save_type]').selectOption('ref');
 await editor.locator('[name=save_success]').selectOption('half');
 await editor.locator('[name=save_dc_override]').fill('14');
 await editor.locator('[data-sheet-form] button[type=submit]').click();
 await editor.waitFor({state:'hidden'});
 assert.equal(readData().activeAbilities[0].name,'Celestial Ward II');
 assert.equal(readData().activeAbilities[0].action_type,'Move');
 assert.equal(readData().activeAbilities[0].u_curr,3);
 assert.equal(readData().activeAbilities[0].u_max,5);
 assert.equal(readData().activeAbilities[0].save_type,'ref');
 assert.equal(readData().activeAbilities[0].save_success,'half');
 assert.equal(readData().activeAbilities[0].save_dc_override,14);
 checks.push('ability Save persists changes across Details, Combat, Resources and Saves');
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
