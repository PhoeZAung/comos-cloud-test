// Local fixture only: exercises the built sheet, source browser and server merge.
import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {manualSourceFamilies} from '../src/features/characters/rules/manual-source-library.mjs';
const root=fileURLToPath(new URL('../dist/',import.meta.url)),output=await fs.mkdtemp(path.join(os.tmpdir(),'cosmos-core-manual-'));
let character={id:'test',name:'Manual source fixture',revision:1,data:{manualCharacter:true,hp_max:20,hp_curr:8,bab:2,str:10,dex:10,con:10,int:10,wis:10,cha:10}};
const html='<html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><link rel="stylesheet" href="/assets/sheet.css"><link rel="stylesheet" href="/assets/sheet-refinements.css"></head><body data-page="sheet-abilities"><main></main><script type="module">window.EventSource=undefined;import {mountSheet} from "/assets/sheet.mjs";mountSheet();</script></body></html>';
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://local').pathname;
  if(pathname.startsWith('/api/')){
   if(req.method==='POST'){let body='';for await(const chunk of req)body+=chunk;const change=JSON.parse(body);assert.equal(change.revision,character.revision);character={...character,data:mergeSheetData(character.data,change),revision:character.revision+1};}
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify({character}));return;
  }
  if(pathname==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}
  if(!/^\/(assets|features|account)\//.test(pathname)||pathname.includes('..')){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',pathname.endsWith('.mjs')?'text/javascript':pathname.endsWith('.css')?'text/css':'application/octet-stream');
  res.end(await fs.readFile(path.join(root,pathname)));
 }catch(error){res.writeHead(400,{'Content-Type':'application/json'}).end(JSON.stringify({message:error.message}));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:process.env.COSMOS_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1024,height:1366},hasTouch:true}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const family=slug=>manualSourceFamilies.find(f=>f.id.endsWith(':'+slug));
 const open=async()=>{await page.locator('.cs-ability-add-menu summary').click();await page.locator('[data-rule-abilities]').click();await page.getByRole('dialog',{name:'Add abilities',exact:true}).waitFor();};
 const choose=async(slug,pageId)=>{await page.locator('[data-library-search]').fill('');await page.locator('[data-source-family]').selectOption(family(slug).id);await page.locator('[data-source-page]').selectOption(pageId);};
 const add=async card=>{const selector=page.locator('[data-source-card="'+card.id+'"]');await selector.locator('summary').click();await selector.locator('[data-source-add]').click();await page.getByText('Added. Full source text is in Description.',{exact:true}).waitFor();};
 await page.goto('http://127.0.0.1:'+server.address().port+'/?characterId=test');await open();
 assert.equal(await page.locator('[data-library-mode]').inputValue(),'manual');
 assert.equal(await page.locator('[data-source-page] option').count(),17);
 const limit=family('archer').pages[0].cards.find(c=>c.name==='Shell Piercer');
 await page.locator('[data-library-search]').fill('Shell Piercer');
 const limitCard=page.locator('[data-source-card="'+limit.id+'"]');await limitCard.locator('summary').click();
 assert.equal(await limitCard.locator('[data-source-maximum]').count(),0);await limitCard.getByText('Uses the shared Limit Break pool',{exact:true}).waitFor();
 await limitCard.locator('[data-source-add]').click();await page.getByText('Added. Full source text is in Description.',{exact:true}).waitFor();
 assert.equal(character.data.activeAbilities[0].limitBreak,true);assert.equal(character.data.activeAbilities[0].u_max,1);
 const rocker=family('bard').pages.find(p=>p.kind==='archetype'&&p.name==='Rocker'),card=rocker.cards[0];
 await choose('bard',rocker.id);assert.equal(await page.locator('[data-source-page] option').count(),24);
 await page.locator('[data-library-search]').fill(card.name);
 const node=page.locator('[data-source-card="'+card.id+'"]');await node.locator('summary').click();
 await node.locator('[data-source-destination]').selectOption('activeAbilities');await node.locator('[data-source-maximum]').fill('3');
 await node.locator('[data-source-add]').click();await page.getByText('Added. Full source text is in Description.',{exact:true}).waitFor();
 const copied=character.data.activeAbilities.find(r=>r.manualSourceId===card.id);
 assert.equal(copied.desc,card.description);assert.equal(copied.u_max,3);assert.equal(character.data.hp_max,20);
 await page.locator('[data-library-close]').click();await page.reload();await open();await choose('bard',rocker.id);
 assert.equal(await page.locator('[data-source-add="'+card.id+'"]').isDisabled(),true);
 const songs=family('bard').pages.find(p=>p.kind==='songs'),song=songs.cards.find(c=>c.level===6);
 await choose('bard',songs.id);await page.locator('[data-library-search]').fill(song.name);await add(song);
 assert.equal(character.data.spells[0].desc,song.description);assert.equal(character.data.spells[0].lvl,6);
 await choose('beastmaster',family('beastmaster').id);await page.locator('[data-library-search]').fill('Natural Savagery');
 const savagery=family('beastmaster').pages[0].cards.find(c=>/^Natural Savagery/.test(c.name));
 await page.locator('[data-source-card="'+savagery.id+'"] summary').click();
 await page.getByText(/Use the class table: Natural Savagery/).waitFor();
 await page.locator('[data-source-add="'+savagery.id+'"]').click();await page.getByText('Added. Full source text is in Description.',{exact:true}).waitFor();
 assert.equal(character.data.passiveAbilities[0].desc,savagery.description);assert.match(character.data.passiveAbilities[0].effect,/5\/8\/11\/14\/17\/20/);
 const longPage=family('bard').pages.find(p=>p.cards.some(c=>c.description.length>20000)),long=longPage.cards.find(c=>c.description.length>20000);
 await choose('bard',longPage.id);await page.locator('[data-library-search]').fill(long.name);
 const longCard=page.locator('[data-source-card="'+long.id+'"]');await longCard.locator('summary').click();await longCard.locator('[data-source-destination]').selectOption('activeAbilities');
 await longCard.locator('[data-source-add]').click();await page.getByText('Added. Full source text is in Description.',{exact:true}).waitFor();
 await page.locator('[data-library-close]').click();
 const index=character.data.activeAbilities.findIndex(c=>c.manualSourceId===long.id);
 await page.locator('[data-edit-entry="activeAbilities:'+index+'"]').click();
 assert.equal(await page.locator('[name=desc]').getAttribute('maxlength'),'100000');assert.equal(await page.locator('[name=desc]').inputValue(),long.description);
 await page.locator('[name=desc]').fill(long.description+'\nPersonal note.');await page.locator('[data-sheet-form] button[type=submit]').click();
 await page.locator('[data-sheet-dialog][open]').waitFor({state:'hidden'});
 assert.equal(character.data.activeAbilities[index].desc,long.description+'\nPersonal note.');assert.equal(character.data.activeAbilities[index].sourceTextHash,long.textSha256);
 await open();
 await choose('bard',family('bard').id);await page.locator('.cs-library-guide>summary').click();
 await page.getByText('Table: Bard',{exact:true}).click();assert.equal(await page.locator('.cs-source-table table').count(),1);
 for(const width of [1024,390,320]){
  await page.setViewportSize({width,height:844});
  assert(await page.locator('.cs-ability-library').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'dialog overflow at '+width);
  assert.equal(await page.locator('[data-library-search]').evaluate(el=>getComputedStyle(el).fontSize),'16px');
  await page.screenshot({path:path.join(output,'source-browser-'+width+'.png')});
 }
 assert.equal(character.data.rulesBuild,undefined);assert.equal(character.data.hp_curr,8);assert.equal(character.data.bab,2);assert.deepEqual(errors,[]);
 console.log('PASS: built modules, all source selectors, archetype copy, usage maximum, save/reload duplicate guard, level-6 song, Natural Savagery table choice, long-description editor/save, readable progression table, 1024/390/320px layout. Local fixture screenshots: '+output);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
