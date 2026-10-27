import {purchaseFeedback,clearFeedback} from './feedback.mjs';
import {recordId} from './record-id.mjs';
import {renderCategoryTiles,ITEM_TAG_OPTIONS,SHOP_ITEM_CATEGORY_GROUPS} from '../features/sheet/item-categories.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gil=v=>v===null?'Price needed':Number(v).toLocaleString(undefined,{maximumFractionDigits:2})+' gil';
const safeLink=v=>{try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
export function mountItems({fixture=false}={}){
 const root=document.querySelector('[data-item-admin]'),controller=new AbortController();
 const buyerId=new URL(location.href).searchParams.get('characterId');
 let closed=false,busy=false,rows=[],counts={},selected='All',q='',cursor='',nextCursor=null,buyer=null,item=null,pendingPurchase=null,editingId=null,draftId=null;
 const status=message=>{if(!closed)for(const n of root.querySelectorAll('[data-item-status]'))n.textContent=message;};
 const dialog=()=>root.querySelector('[data-item-dialog]');
 const setBusy=v=>{busy=v;if(!closed)root.querySelectorAll('button,input,textarea,select').forEach(n=>n.disabled=v);if(!v){const buy=root.querySelector('[data-buy-form] button[type=submit]');if(buy)buy.disabled=!buyer||item?.priceGil===null;}};
 async function request(path='',body){
  if(fixture)throw Error('Open the signed-in site to manage items.');
  const r=await fetch('/api/v1/admin/items'+path,{signal:controller.signal,credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const data=await r.json();if(!r.ok)throw Object.assign(Error(data.message||({401:'Sign in to continue.',403:'Administrator access required.',404:'This record is unavailable.',409:'This record changed. Reopen it before buying.',429:'Wait a moment before trying again.'}[r.status]||'Could not connect. Try again.')),{status:r.status});return data;
 }
 function draw(){if(closed)return;
  root.innerHTML='<div class="item-control"><p data-item-status role="status"></p><div class="item-buyer-context"><strong data-buyer-name>'+esc(buyer?buyer.name:'Item catalog')+'</strong><span data-buyer-gil>'+esc(buyer?gil(buyer.gil):'')+'</span></div>'+(!buyerId?'<a class="back" href="admin.html">← Choose a character in Admin</a>':'<a class="back" href="admin.html">← Characters</a>')+'<div data-category-tiles>'+renderCategoryTiles(counts,selected,{attribute:'data-catalog-category',label:'Catalog categories',groups:true})+'</div><form class="item-search-row" data-item-search><input aria-label="Find item" name="q" maxlength="80" placeholder="Find item" value="'+esc(q)+'"><button class="button" type="submit">Find</button></form><div class="item-control-bar"><h2 data-catalog-count></h2><button class="button" type="button" data-new>Add item</button></div><div class="item-catalog-list" data-item-list></div><div class="item-pagination" data-item-pages></div><dialog class="item-dialog" data-item-dialog aria-labelledby="item-dialog-title"><header><h2 id="item-dialog-title"></h2><button type="button" class="item-close" aria-label="Close item" data-close>×</button></header><p role="status" data-item-status></p><div data-item-content></div></dialog></div>';
  drawList();
 }
 function drawList(){
  root.querySelector('[data-catalog-count]').textContent=(selected==='All'?'Items':selected)+' · '+(selected==='All'?Object.values(counts).reduce((a,b)=>a+b,0):SHOP_ITEM_CATEGORY_GROUPS[selected]?.reduce((a,k)=>a+(counts[k]||0),0)??counts[selected]??0).toLocaleString();
  root.querySelector('[data-item-list]').innerHTML=rows.map(r=>'<article class="item-catalog-row"><button type="button" class="item-open" data-open="'+r.id+'">'+esc(r.name)+'<small>'+esc(r.category)+'</small></button><span class="item-price">'+esc(r.priceGil===null?(r.costText||'Price needed'):gil(r.priceGil))+'</span><button class="button" type="button" data-buy-open="'+r.id+'">Buy</button></article>').join('')||'<p>No items found.</p>';
  root.querySelector('[data-item-pages]').innerHTML=(cursor?'<button type="button" class="button" data-first>First</button>':'')+(nextCursor?'<button type="button" class="button" data-next>Next</button>':'');
 }
 async function loadList(){
  const result=await request('?'+new URLSearchParams({q,cursor,category:selected==='All'?'':selected}));rows=result.items;nextCursor=result.nextCursor;if(!closed)drawList();
 }
 async function withBusy(fn){if(busy||closed)return;setBusy(true);status('');try{await fn();}catch(error){if(!closed)status(error.message);}finally{if(!closed)setBusy(false);}}
 async function freshBuyer(){if(!buyer)return;try{buyer=(await request('/buyer/'+encodeURIComponent(buyer.id))).character;}catch(error){buyer=null;throw error;}if(closed)return;root.querySelector('[data-buyer-name]').textContent=buyer.name;root.querySelector('[data-buyer-gil]').textContent=gil(buyer.gil);}
 function showItem(){
  if(closed)return;const c=item.catalog||{},details=c.details,fields=Object.entries(c).filter(([k,v])=>!['id','name','desc','special','raw','details','tags','tagFields','detailFields','sourceUrl','category','cost','priceGil'].includes(k)&&v!==null&&v!==''&&typeof v!=='object');
  root.querySelector('#item-dialog-title').textContent=item.name;
  root.querySelector('[data-item-content]').innerHTML='<p class="field-help">'+esc(item.category)+' · '+esc(item.priceGil===null?(item.costText||'Price needed'):gil(item.priceGil))+'</p><dl class="item-detail-grid">'+fields.map(([k,v])=>'<div><dt>'+esc(k.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase()))+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl><p class="item-description">'+esc(item.description)+'</p>'+(details?.length?'<details><summary>Item details</summary><pre>'+esc(JSON.stringify(details,null,2))+'</pre></details>':'')+(safeLink(c.sourceUrl)?'<a class="button" href="'+esc(safeLink(c.sourceUrl))+'" target="_blank" rel="noopener noreferrer">Source</a>':'')+'<details><summary>All source fields</summary><pre>'+esc(JSON.stringify(c,null,2))+'</pre></details><form class="item-buy-form" data-buy-form><div><p>'+esc(buyer?buyer.name+' · '+gil(buyer.gil):'Open the shop from a character in Admin')+'</p><label>Quantity<input name="quantity" type="number" min="1" max="999" step="1" value="1" required></label></div><strong data-buy-total>'+esc(gil(item.priceGil))+'</strong><button class="button primary" type="submit" '+(!buyer||item.priceGil===null?'disabled':'')+'>Buy</button></form><button class="button" type="button" data-edit-item>Edit item</button>';
  if(!dialog().open)dialog().showModal();
 }
 function editor(){
  const x=item;editingId=x?.id||null;draftId=x?.id||recordId();root.querySelector('#item-dialog-title').textContent=x?'Edit item':'Add item';
  root.querySelector('[data-item-content]').innerHTML='<form data-item-form><label for="item-name">Name</label><input id="item-name" name="name" maxlength="80" required value="'+esc(x?.name)+'"><label for="item-category">Category</label><select id="item-category" name="category">'+[...new Set([...ITEM_TAG_OPTIONS,...(x?.category?[x.category]:[])])].map(k=>'<option '+(x?.category===k?'selected':'')+'>'+esc(k)+'</option>').join('')+'</select><label for="item-price">Fixed gil price (blank = unavailable)</label><input id="item-price" name="priceGil" type="number" min="0" max="1000000000000" step="0.01" value="'+esc(x?.priceGil??'')+'"><label for="item-cost">Price label</label><input id="item-cost" name="costText" maxlength="120" value="'+esc(x?.costText)+'"><label for="item-description">Description</label><textarea id="item-description" name="description" rows="7" maxlength="30000">'+esc(x?.description)+'</textarea><details><summary>Source</summary><label for="item-source">Source ID</label><input id="item-source" name="sourceId" required maxlength="64" value="'+esc(x?.sourceId||'custom')+'"><label for="item-version">Version</label><input id="item-version" name="sourceVersion" required maxlength="64" value="'+esc(x?.sourceVersion||'1')+'"></details><button class="button primary" type="submit">Save item</button></form>';
  if(!dialog().open)dialog().showModal();root.querySelector('#item-name').focus();
 }
 root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||busy)return;
  if(b.hasAttribute('data-close')){dialog().close();return;}
  if(b.hasAttribute('data-new')){item=null;editor();return;}
  if(b.hasAttribute('data-edit-item')){editor();return;}
  void withBusy(async()=>{
   if(b.dataset.catalogCategory){selected=b.dataset.catalogCategory;cursor='';root.querySelector('[data-category-tiles]').innerHTML=renderCategoryTiles(counts,selected,{attribute:'data-catalog-category',label:'Catalog categories',groups:true});await loadList();}
   else if(b.hasAttribute('data-next')||b.hasAttribute('data-first')){cursor=b.hasAttribute('data-first')?'':nextCursor;await loadList();}
   else if(b.dataset.open||b.dataset.buyOpen){item=(await request('/'+encodeURIComponent(b.dataset.open||b.dataset.buyOpen))).item;pendingPurchase=null;await freshBuyer();showItem();}
  });
 },{signal:controller.signal});
 root.addEventListener('input',e=>{if(e.target.name==='quantity'&&item){pendingPurchase=null;root.querySelector('[data-buy-total]').textContent=gil(item.priceGil===null?null:Math.round(item.priceGil*100*Number(e.target.value))/100);}}, {signal:controller.signal});
 root.addEventListener('submit',e=>{e.preventDefault();if(busy)return;const form=e.target,d=new FormData(form);void withBusy(async()=>{
  if(form.hasAttribute('data-item-search')){q=String(d.get('q')).trim();cursor='';await loadList();}
  else if(form.hasAttribute('data-buy-form')){
   if(!buyer||item.priceGil===null)throw Error('Choose a character and set a fixed price first.');
   pendingPurchase??={op:'buy',requestId:recordId(),characterId:buyer.id,itemId:item.id,quantity:Number(d.get('quantity')),revision:buyer.revision,itemRevision:item.revision};
   const before=Number(buyer.gil),{receipt}=await request('',pendingPurchase);pendingPurchase=null;buyer={...buyer,gil:receipt.remainingGil,revision:receipt.revision};dialog().close();root.querySelector('[data-buyer-gil]').textContent=gil(buyer.gil);purchaseFeedback(receipt,before,root.querySelector('[data-buyer-gil]'));status('Purchased.');
  }else if(form.hasAttribute('data-item-form')){
   const change={op:'save',id:editingId||draftId,revision:editingId?item.revision:0,...Object.fromEntries(d)};change.priceGil=change.priceGil===''?null:Number(change.priceGil);
   item=(await request('',change)).item;pendingPurchase=null;const meta=await request('/categories');counts=Object.fromEntries(meta.categories.map(x=>[x.category,x.count]));root.querySelector('[data-category-tiles]').innerHTML=renderCategoryTiles(counts,selected,{attribute:'data-catalog-category',label:'Catalog categories',groups:true});await loadList();showItem();status('Item saved.');
  }
 });},{signal:controller.signal});
 draw();void withBusy(async()=>{if(buyerId){buyer={id:buyerId};await freshBuyer();}const meta=await request('/categories');counts=Object.fromEntries(meta.categories.map(x=>[x.category,x.count]));root.querySelector('[data-category-tiles]').innerHTML=renderCategoryTiles(counts,selected,{attribute:'data-catalog-category',label:'Catalog categories',groups:true});await loadList();await freshBuyer();});
 return ()=>{clearFeedback();closed=true;controller.abort();};
}
