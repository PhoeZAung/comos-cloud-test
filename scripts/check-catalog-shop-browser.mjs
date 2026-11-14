import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const paid='00000000-0000-4000-8000-000000000001';
const unpriced='00000000-0000-4000-8000-000000000002';
const cosmosCatalog='legacy-master~fixture-v1',pathfinderCatalog='pathfinder-shopping~aon-v1';
const catalogs=[{id:cosmosCatalog,label:'Cosmos · Master catalog [fixture-v1]',count:1},{id:pathfinderCatalog,label:'Pathfinder 1e · Archives of Nethys [aon-v1]',count:1}];
const records={
 [paid]:{id:paid,name:'Potion of Healing',sourceId:'legacy-master',sourceVersion:'fixture-v1',category:'Alchemical Items',revision:2,description:'**Healing** potion.\n<script>evil()</script>',priceGil:3.25,costText:'3.25 gil',catalog:{raw:{Weight:'1 lb'}}},
 [unpriced]:{id:unpriced,name:'Unpriced artifact',sourceId:'pathfinder-shopping',sourceVersion:'aon-v1',category:'Artifacts',revision:1,description:'Ancient relic',priceGil:null,costText:'Variable',catalog:{raw:{Type:'Relic'}}}
};
let postCount=0;
const server=createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost'),pathname=u.pathname;
 const send=(status,data)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data));};
 if(pathname==='/'){
  res.writeHead(200,{'content-type':'text/html'});
  res.end('<!doctype html><html><body><main></main><script type="module">import {openInventoryPicker} from "/src/ui/inventory-shop-picker.mjs";window.purchases=[];window.freeAdds=[];window.receipts=[];window.customAdds=0;window.start=()=>openInventoryPicker(document.querySelector("main"),{signal:new AbortController().signal,getBalance:()=>20,onCustom:()=>{window.customAdds++;},onAdd:async(id,qty)=>{window.freeAdds.push({id,qty});return "";},onBuy:async(item,qty,key)=>{window.purchases.push({id:item.id,qty,key});return {itemName:item.name,totalGil:item.priceGil*qty,remainingGil:20-item.priceGil*qty};},onPurchased:async receipt=>window.receipts.push(receipt)});</script></body></html>');
 }else if(pathname.startsWith('/src/')&&pathname.endsWith('.mjs')&&!pathname.includes('..')){
  try{const content=await readFile('.'+pathname);res.writeHead(200,{'content-type':'text/javascript'});res.end(content);}catch{res.writeHead(404).end();}
 }else if(pathname==='/api/v1/item-catalog/catalogs')send(200,{catalogs});
 else if(pathname==='/api/v1/item-catalog/categories')send(200,{categories:u.searchParams.getAll('catalog').includes(cosmosCatalog)&&u.searchParams.getAll('catalog').includes(pathfinderCatalog)?[{category:'Alchemical Items',count:1},{category:'Artifacts',count:1}]:u.searchParams.getAll('catalog').includes(cosmosCatalog)?[{category:'Alchemical Items',count:1}]:[{category:'Artifacts',count:1}]});
 else if(pathname==='/api/v1/item-catalog'&&req.method==='GET')send(200,{items:Object.values(records).filter(item=>u.searchParams.getAll('catalog').includes(item.sourceId+'~'+item.sourceVersion)).map(({id,name,category,sourceId,sourceVersion,revision,priceGil})=>({id,name,category,sourceId,sourceVersion,revision,priceGil})),nextCursor:null});
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
 await page.locator('[data-picker-shop-toggle]').waitFor();
 assert.equal(await page.locator('[data-picker-shop-panel]:visible').count(),0,'shop choices must stay hidden until Choose Shop opens');
 assert.equal(await page.locator('.item-group-buttons').count(),0,'large text group buttons must not appear');
 assert.equal(await page.locator('[data-catalog-item]').count(),0,'the catalog starts empty');
 const toolbarOrder=await page.locator('.cs-catalog-toolbar button').evaluateAll(buttons=>buttons.map(b=>b.textContent.trim()));
 assert.match(toolbarOrder[0],/Choose Shop/);assert.match(toolbarOrder[1],/Custom Item/);
 await page.locator('[data-picker-shop-toggle]').click();
 await page.locator('[data-picker-catalog="'+cosmosCatalog+'"]').waitFor();
 assert.equal(await page.locator('[data-catalog-item]').count(),0,'no items should load until a catalog is selected');
 await page.locator('[data-picker-catalog="'+cosmosCatalog+'"]').click();
 assert.equal(await page.locator('[data-picker-shop-panel]:visible').count(),1,'selecting a shop must not dismiss the popup');
 await page.locator('[data-picker-shop-done]').click();
 assert.equal(await page.locator('[data-picker-shop-panel]:visible').count(),0,'Done closes the source popup');
 try{await page.waitForSelector('[data-catalog-item="'+paid+'"]',{timeout:5000});}
 catch(error){
  console.error('Picker diagnostics',JSON.stringify({
   pageErrors:errors,
   dialogVisible:await page.locator('.cs-catalog-picker').count(),
   pickerStatus:await page.locator('[data-picker-status]').allTextContents(),
   catalogs:await page.locator('[data-picker-catalog]').allTextContents(),
   renderedRows:await page.locator('[data-catalog-item]').count(),
   html:await page.locator('.cs-catalog-picker').first().innerHTML().catch(()=>null)
  },null,2));
  throw error;
 }
 assert.equal(await page.locator('[data-catalog-purchase]:visible').count(),0,'browse rows must not expose purchase controls until an item is clicked');
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
 await page.locator('[data-picker-shop-toggle]').click();
 await page.locator('[data-picker-catalog="'+pathfinderCatalog+'"]').click();
 await page.locator('[data-picker-shop-done]').click();
 await page.locator('[data-catalog-item="'+unpriced+'"]').click();
 await page.locator('.cs-catalog-preview[open]').waitFor();
 assert.equal(await page.locator('[data-catalog-confirm]').innerText(),'Add without a price');
 assert.match(await page.locator('[data-catalog-balance]').innerText(),/No Gil will be deducted/);
 await page.locator('[data-catalog-confirm]').click();
 await page.waitForFunction(()=>window.freeAdds.length===1);
 assert.deepEqual(await page.evaluate(()=>window.freeAdds),[{id:unpriced,qty:1}]);
 assert.equal(postCount,0);
 await page.evaluate(()=>window.start());
 await page.locator('[data-custom-item]').click();
 await page.waitForFunction(()=>window.customAdds===1);
 assert.equal(await page.locator('.cs-catalog-picker[open]').count(),0,'Custom Item opens without choosing any shop');
 assert.deepEqual(errors,[]);
 console.log('Catalog preview opens before purchase, displays description/total, and separates Buy from unpriced Add.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
