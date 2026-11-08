import {chromium} from 'playwright';import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
let denied=false;const requests=[];
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://fixture');
 try{
  if(url.pathname.startsWith('/api/')){
   requests.push(url.search);res.setHeader('Content-Type','application/json');
   if(denied){res.statusCode=403;res.end(JSON.stringify({message:'Administrator access required.'}));return;}
   res.end(JSON.stringify(url.searchParams.has('partyTagId')?{characters:[{id:url.searchParams.get('cursor')?'second':'first',name:url.searchParams.get('cursor')?'Second player':'First player',tags:[]}],nextCursor:url.searchParams.get('cursor')?null:'next'}:{parties:[{id:'party-fixture',name:'Adventurers',characterCount:2}]}));return;
  }
  if(url.pathname==='/sheet.html'){res.setHeader('Content-Type','text/html');res.end('<h1>Fixture character sheet</h1>');return;}
  if(url.pathname==='/'||url.pathname==='/admin-sheets.html'){
   const viewer=url.pathname!=='/';res.setHeader('Content-Type','text/html');res.end('<main '+(viewer?'data-admin-sheets':'data-character-admin data-party-admin')+'></main><script type="module">import {'+(viewer?'mountAdminSheets':'mountCharacterAdmin')+'} from "/src/ui/'+(viewer?'admin-sheets':'directory')+'.mjs";'+(viewer?'mountAdminSheets':'mountCharacterAdmin')+'();</script>');return;
  }
  const file=path.resolve('.','.'+url.pathname);if(!file.startsWith(path.resolve('src')+path.sep))throw Error();res.setHeader('Content-Type','text/javascript');res.end(await fs.readFile(file));
 }catch{res.writeHead(404).end();}
});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.COSMOS_BROWSER_EXECUTABLE||undefined});
try{
 const page=await browser.newPage(),base='http://127.0.0.1:'+server.address().port;await page.goto(base);
 const popup=page.waitForEvent('popup');await page.getByRole('link',{name:'Open all sheets for Adventurers'}).click();const viewer=await popup;
 await viewer.waitForFunction(()=>document.querySelectorAll('iframe').length===2);
 assert.match(viewer.url(),/partyTagId=party-fixture/);assert.equal(await viewer.locator('iframe').count(),2);
 assert.ok(requests.some(query=>query.includes('cursor=next')));assert.ok(requests.filter(query=>query.includes('partyTagId')).every(query=>!query.includes('q=')));
 assert.match(await viewer.locator('iframe').first().getAttribute('src'),/characterId=first/);
 denied=true;await viewer.reload();await viewer.getByRole('status').filter({hasText:'Administrator access required.'}).waitFor();assert.equal(await viewer.locator('iframe').count(),0);
 console.log('Passed: group icon opens one tab with all paginated sheets; admin denial renders no sheets.');
}finally{await browser.close();server.close();}
