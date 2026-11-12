import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const id=n=>n.toString().padStart(36,'0');
const rows=[{id:id(1),name:'Astra'},{id:id(2),name:'Nyx'},{id:id(3),name:'<img src=x onerror=alert(1)>'}];
const script=await readFile('src/ui/admin-sheets.mjs');
let iframeLoads=0;
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/'){
  res.writeHead(200,{'content-type':'text/html'});
  res.end('<!doctype html><html><body><section data-admin-sheets></section><script type="module" src="/admin.js"></script><script type="module">import{mountAdminSheets}from"/admin.js";window.dispose=mountAdminSheets();</script></body></html>');
 }else if(url.pathname==='/admin.js'){res.writeHead(200,{'content-type':'text/javascript'});res.end(script);}
 else if(url.pathname==='/api/v1/admin/directory'){
  res.writeHead(200,{'content-type':'application/json'});
  res.end(JSON.stringify({characters:rows,nextCursor:null}));
 }else if(url.pathname==='/sheet.html'){
  iframeLoads++;
  res.writeHead(200,{'content-type':'text/html'});
  res.end('<!doctype html><html><body><div style="height:2000px">Sheet</div></body></html>');
 }else res.writeHead(404).end();
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})});
try{
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/?partyTagId=group-1');
 await page.waitForFunction(()=>document.querySelector('iframe')?.contentDocument?.body?.textContent.includes('Sheet'));
 assert.equal(await page.locator('[data-admin-sheet-tab]').count(),3);
 assert.equal(await page.locator('iframe').count(),1);
 assert.equal(iframeLoads,1);
 assert.equal(await page.locator('img').count(),0,'untrusted sheet names stay escaped');
 await page.evaluate(()=>document.querySelector('iframe').contentWindow.scrollTo(0,350));
 await page.locator('[data-admin-sheet-tab]').nth(1).click();
 await page.waitForFunction(()=>document.querySelectorAll('iframe').length===2);
 assert.equal(await page.locator('iframe:visible').count(),1);
 const section=await page.locator('[data-admin-sheet-tab]').nth(1).getAttribute('aria-selected');
 assert.equal(section,'true');

 await page.locator('[data-admin-sheet-tab]').first().click();
 assert.equal(await page.locator('iframe:visible').count(),1);
 assert.equal(await page.locator('iframe').count(),2,'visited sheets stay mounted');
 await page.waitForFunction(()=>document.querySelectorAll('iframe')[0]?.contentWindow?.scrollY>=330,null,{timeout:5000});
 await page.locator('[data-admin-sheet-tab]').nth(2).focus();
 await page.keyboard.press('Home');
 assert.equal(await page.locator('[data-admin-sheet-tab]').first().getAttribute('aria-selected'),'true');
 assert.deepEqual(errors,[]);
 console.log('Admin sheets: lazy named tabs, keyboard navigation, single visible iframe, escaping and preservation passed.');
}finally{
 await browser.close();await new Promise(resolve=>server.close(resolve));
}
