// Local fixture UI exercise; never connects to a live account or deploys.
import {fileURLToPath} from 'node:url';
import os from 'node:os';import path from 'node:path';
import {chromium} from 'playwright';
import http from 'node:http';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,'');const output=await fs.mkdtemp(path.join(os.tmpdir(),'cosmos-groups-')); let character={id:'test',name:'Ability workshop',revision:0,data:{activeAbilities:[{name:'Flame',rulesOwned:true,sourceRuleId:'ffd20:class:fixture:feature:flame',desc:'A focused burst of flame.',damage:'1d6',action_type:'Standard',u_max:3,u_curr:3},{name:'Frost',desc:'A wave of frost.',action_type:'Move'},{name:'Limit Break: Storm',limitBreak:true}],passiveAbilities:[],racialAbilities:[],feats:[],weapons:[],items:[]}};
// Optional real Doom Slayer fixture reproduces the account-specific ammo rejection.
if(process.env.COSMOS_DOOM_AMMO==='1'){
 const {newBuild,compileBuild,previewBuild,choiceEvents,eligibleOptions}=await import('../src/features/characters/rules/build.mjs');
 const {GUNBREAKER_ID,DOOM_SLAYER_ID}=await import('../src/features/characters/rules/martial-progression.mjs');
 const {gunbreakerAmmoProfiles,MAGICKED_AMMO_ID}=await import('../src/features/characters/rules/gunbreaker-ammo.mjs');
 const {fixedSkills}=await import('../src/features/sheet/skills.mjs');
 const b=newBuild();Object.assign(b,{name:'Doom Slayer fixture',raceId:'ffd20:race:galka',classId:GUNBREAKER_ID,archetypeId:DOOM_SLAYER_ID,level:1,hpRolls:[10]});
 for(let n=0;n<100;n++){const event=choiceEvents(b).find(e=>!b.choices[e.id]);if(!event)break;b.choices[event.id]=[eligibleOptions(b,event)[0].id];}
 let ranks=previewBuild(b).skillBudget;b.skillRanks=fixedSkills.map(()=>{const rank=Math.min(1,ranks);ranks-=rank;return rank;});b.reviewed=true;
 let data=compileBuild(b);data=mergeSheetData(data,{action:'gunbreakerAmmo',operation:'configure',profileId:gunbreakerAmmoProfiles(data)[0].id});data=mergeSheetData(data,{action:'gunbreakerAmmo',operation:'reload'});
 const ammo=data.activeAbilities.find(row=>row.sourceRuleId===MAGICKED_AMMO_ID);
 data.activeAbilities=[{...ammo,name:'Flame'},...character.data.activeAbilities.slice(1)];character.data=data;
}
const html=`<html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">${['tokens','themes','sheet-base','sheet','sheet-refinements'].map(x=>'<link rel="stylesheet" href="/src/styles/'+x+'.css">').join('')}</head><body data-page="sheet-abilities"><main></main><script type="module">import '/src/ui/mobile-viewport.mjs';window.EventSource=undefined;import {mountSheet} from '/src/ui/sheet.mjs';mountSheet();</script></body></html>`;
const server=http.createServer(async(req,res)=>{try{let path=new URL(req.url,'http://local').pathname;if(path.startsWith('/api/')){if(req.method==='POST'){let body='';for await(const c of req)body+=c;let change=JSON.parse(body);assert.equal(change.revision,character.revision);character={...character,data:mergeSheetData(character.data,change),revision:character.revision+1};}res.setHeader('Content-Type','application/json');res.end(JSON.stringify({character}));return;}if(path==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}res.setHeader('Content-Type',path.endsWith('.mjs')?'text/javascript':path.endsWith('.css')?'text/css':'application/octet-stream');res.end(await fs.readFile(root+path));}catch(e){res.statusCode=400;res.end(JSON.stringify({message:e.message}));}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({...(process.env.COSMOS_BROWSER_EXECUTABLE?{executablePath:process.env.COSMOS_BROWSER_EXECUTABLE}:{}),headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1024,height:1366},hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const cdp=await page.context().newCDPSession(page);
 async function drag(handle,target,{touch=false,bottom=false}={}){
  await handle.scrollIntoViewIfNeeded();
  const a=await handle.boundingBox(),b=await target.boundingBox();
  const start={x:a.x+a.width/2,y:a.y+a.height/2},end={x:b.x+b.width/2,y:bottom?b.y+b.height-5:b.y+b.height/2};
  const revision=character.revision;
  if(touch){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
   for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/12,y:start.y+(end.y-start.y)*i/12}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:12});await page.mouse.up();}
  await page.waitForFunction(()=>document.querySelector('[data-sheet-status]')?.textContent.startsWith('Saved'));
  await page.waitForTimeout(100);assert.ok(character.revision>revision,'drag must save');
 }
 const index=name=>character.data.activeAbilities.findIndex(r=>r.name===name);
 const grip=name=>page.locator('[data-ability-drag="activeAbilities:'+index(name)+'"]');
 const flow=()=>page.locator('[data-ability-group=""]');
 await page.goto('http://127.0.0.1:'+server.address().port+'/?characterId=test');
 assert.equal(await page.locator('.cs-ability-wheel .cs-ability-add-menu').count(),0);
 const addBounds=await page.locator('.cs-ability-add-menu summary').boundingBox(),groupBounds=await page.locator('[data-add-ability-group]').boundingBox();
 assert.ok(Math.abs(addBounds.y-groupBounds.y)<8,'Add ability and Add group are adjacent');
 await page.locator('.cs-ability-add-menu summary').click();await page.locator('[data-rule-abilities]').click();
 await page.getByRole('dialog',{name:'Race and class abilities'}).waitFor();await page.locator('[data-library-close]').click();
 await page.locator('.cs-ability-add-menu summary').click();await page.locator('[data-add-manual-ability]').click();
 await page.locator('[data-sheet-dialog][open]').waitFor();await page.keyboard.press('Escape');
 await page.locator('[data-add-ability-group]').click();
 await page.locator('[name=name]').fill('Elemental arts');await page.locator('[name=u_max]').fill('3');await page.locator('[name=u_curr]').fill('3');
 await page.locator('[data-sheet-form] button[type=submit]').click();await page.locator('[data-edit-ability-group]').waitFor();
 const id=character.data.abilityGroups[0].id,zone=()=>page.locator('[data-ability-group="'+id+'"]');
 assert.equal(await page.locator('[data-move-ability]').count(),0);
 assert.equal(await page.getByRole('heading',{name:'Ungrouped',exact:true}).count(),0);
 assert.equal(await page.locator('[data-edit-ability-group]').innerText(),'');
 const search=page.locator('[data-sheet-search]');
 await search.fill('Flame');
 await drag(grip('Flame'),page.locator('[data-ability-group-card="'+id+'"] .cs-group-header'),{touch:true});
 await search.fill('');
 assert.equal(character.data.activeAbilities[index('Flame')].abilityGroupId,id);
 assert.equal(await page.locator('.cs-ability-group .cs-entry .cs-usage-count').count(),0);
 await page.locator('[data-edit-entry="activeAbilities:'+index('Flame')+'"]').click();
 assert.equal(await page.locator('[data-sheet-form] [name=u_curr]').count(),0);assert.equal(await page.locator('[data-sheet-form] [name=uses_formula]').count(),0);
 await page.screenshot({path:path.join(output,'ability-editor.png')});await page.keyboard.press('Escape');
 await page.locator('[data-entry-preview="activeAbilities:'+index('Flame')+'"]').click();
 await page.screenshot({path:path.join(output,'ability-preview.png')});await page.locator('[data-entry-popup-close]').click();
 // A real touch gesture moves the entire group after the standalone ability.
 await drag(page.locator('[data-group-drag]'),flow(),{touch:true,bottom:true});
 assert.equal(await flow().locator(':scope > :last-child').getAttribute('data-ability-group-card'),id);
 assert.equal(character.data.activeAbilities[index('Flame')].abilityGroupId,id);
 assert.equal(character.data.abilityGroups[0].u_curr,3);
 await page.reload();await page.locator('[data-group-drag]').waitFor();
 assert.equal(await flow().locator(':scope > :last-child').getAttribute('data-ability-group-card'),id);
 await drag(grip('Frost'),zone());
 assert.equal(character.data.activeAbilities[index('Frost')].abilityGroupId,id);
 await drag(grip('Frost'),flow(),{bottom:true});
 assert.equal(character.data.activeAbilities[index('Frost')].abilityGroupId,undefined);
 // Arrow keys move whole groups too.
 await page.locator('[data-group-drag]').focus();await page.keyboard.press('ArrowDown');
 await page.waitForTimeout(150);
 assert.equal(await flow().locator(':scope > :last-child').getAttribute('data-ability-group-card'),id);
 await page.screenshot({path:path.join(output,'ability-groups.png')});
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.ok(await page.evaluate(()=>document.querySelector('[data-sheet-search]').getBoundingClientRect().top<document.querySelector('.cs-limit-breaks').getBoundingClientRect().top));
 assert.ok(await page.locator('.cs-limit-breaks').evaluate(el=>parseFloat(getComputedStyle(el).paddingTop)<=6));
 await page.locator('[data-sheet-search]').focus();
 assert.equal(await page.locator('[data-sheet-search]').evaluate(el=>getComputedStyle(el).fontSize),'16px');
 assert.equal(await page.evaluate(()=>visualViewport.scale),1);
 assert.equal(await page.evaluate(()=>{const event=new Event('gesturestart',{cancelable:true});document.dispatchEvent(event);return event.defaultPrevented;}),true);
 const hit=await page.evaluate(()=>{
  document.querySelector('.cs-ability-add-menu').open=true;
  const tab=document.querySelector('[data-sheet-tab="combat"]'),r=tab.getBoundingClientRect();
  return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-sheet-tab]')?.dataset.sheetTab;
 });assert.equal(hit,'combat');
 await page.screenshot({path:path.join(output,'ability-groups-mobile.png')});
 await page.locator('[data-edit-ability-group]').click();await page.locator('[data-delete-ability-group]').click();
 await page.waitForFunction(()=>!document.querySelector('[data-edit-ability-group]'));
 assert.equal(character.data.activeAbilities.length,3);assert.equal(character.data.abilityGroups.length,0);
 assert.deepEqual(errors,[]);
 console.log('Browser passed: compact cards, icon edit, no move menus, touch group drag, individual drag in/out, mixed order after reload, keyboard, mobile layout and deletion. Screenshots: '+output);
}finally{await browser.close();server.close();}
