import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const paid='00000000-0000-4000-8000-000000000001';
const unpriced='00000000-0000-4000-8000-000000000002';
const records={
 [paid]:{id:paid,name:'Potion of Healing',category:'Alchemical Items',revision:2,description:'**Healing** potion.\n<script>evil()</script>',priceGil:3.25,costText:'3.25 gil',catalog:{raw:{Weight:'1 lb'}}},
 [unpriced]:{id:unpriced,name:'Unpriced artifact',category:'Artifacts',revision:1,description:'Ancient relic',priceGil:null,costText:'Variable',catalog:{raw:{Type:'Relic'}}}
};
let postCount=0;
const server=createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost'),pathname=u.pathname;
 const send=(status,data)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data));};
 if(pathname==='/'){
  res.writeHead(200,{'content-type':'text/html'});
  res.end('<!doctype html><html><body><main></main><script type="module">import {openInventoryPicker} from "/src/ui/inventory-shop-picker.mjs";window.purchases=[];window.freeAdds=[];window.receipts=[];window.start=()=>openInventoryPicker(document.querySelector("main"),{signal:new AbortController().signal,getBalance:()=>20,onCustom:()=>{},onAdd:async(id,qty)=>{window.freeAdds.push({id,qty});return "";},onBuy:async(item,qty,key)=>{window.purchases.push({id:item.id,qty,key});return {itemName:item.name,totalGil:item.priceGil*qty,remainingGil:20-item.priceGil*qty};},onPurchased:async receipt=>window.receipts.push(receipt)});</script></body></html>');
 }else if(pathname.startsWith('/src/')&&pathname.endsWith('.mjs')&&!pathname.includes('..')){
  try{const content=await readFile('.'+pathname);res.writeHead(200,{'content-type':'text/javascript'});res.end(content);}catch{res.writeHead(404).end();}
 }else if(pathname==='/api/v1/item-catalog/categories')send(200,{categories:[{category:'Alchemical Items',count:1},{category:'Artifacts',count:1}]});
 else if(pathname==='/api/v1/item-catalog'&&req.method==='GET')send(200,{items:Object.values(records).map(({id,name,category,revision,priceGil})=>({id,name,category,revision,priceGil})),nextCursor:null});
 else if(pathname.startsWith('/api/v1/item-catalog/')&&req.method==='GET')send(records[pathname.slice('/api/v1/item-catalog/'.length)]?200:404,{item:records[pathname.slice('/api/v1/item-catalog/'.length)]});
 else if(pathname==='/api/v1/item-catalog/purchase'&&req.method==='POST'){postCount++;send(500,{message:'Unexpected direct payment in fixture'});}
 else res.writeHead(404).end();
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.waitForFunction(()=>typeof window.start==='function');
 await page.evaluate(()=>window.start());
 await page.waitForSelector('[data-catalog-item="'+paid+'"]');
 assert.equal(await page.locator('[data-catalog-purchase]').count(),0,'browse rows must not contain purchase controls');
 await page.locator('[data-catalog-item="'+paid+'"]').click();
 await page.locator('.cs-catalog-preview[open]').waitFor();
 assert.equal(postCount,0,'clicking a row must only preview, never purchase');
 assert.match(await page.locator('[data-catalog-description]').innerText(),/Healing potion/);
 assert.equal(await page.locator('.cs-catalog-preview script').count(),0,'catalog descriptions cannot execute HTML');
 assert.equal(await page.locator('[data-catalog-total]').innerText(),'3.25 Gil');
 await page.locator('[data-catalog-purchase] input[name=quantity]').fill('4');
 assert.equal(await page.locator('[data-catalog-total]').innerText(),'13 Gil');
 assert.equal(await page.locator('[data-catalog-confirm]').innerText(),'Buy');
 await page.locator('[data-catalog-confirm]').click();
 await page.waitForFunction(()=>window.receipts.length===1);
 assert.deepEqual(await page.evaluate(()=>window.purchases.map(p=>({id:p.id,qty:p.qty}))),[{id:paid,qty:4}]);
 assert.equal(await page.locator('.cs-catalog-preview[open]').count(),0);
 await page.evaluate(()=>window.start());
 await page.locator('[data-catalog-item="'+unpriced+'"]').click();
 await page.locator('.cs-catalog-preview[open]').waitFor();
 assert.equal(await page.locator('[data-catalog-confirm]').innerText(),'Add without a price');
 assert.match(await page.locator('[data-catalog-balance]').innerText(),/No Gil will be deducted/);
 await page.locator('[data-catalog-confirm]').click();
 await page.waitForFunction(()=>window.freeAdds.length===1);
 assert.deepEqual(await page.evaluate(()=>window.freeAdds),[{id:unpriced,qty:1}]);
 assert.equal(postCount,0);
 assert.deepEqual(errors,[]);
 console.log('Catalog preview opens before purchase, displays description/total, and separates Buy from unpriced Add.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
