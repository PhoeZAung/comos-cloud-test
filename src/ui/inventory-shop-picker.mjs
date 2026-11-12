import {renderCategoryTiles,itemCategorySymbol} from '../features/sheet/item-categories.mjs';
import {renderCatalogPreview,formatGil,catalogPurchaseTotal} from '../features/sheet/catalog-shop-preview.mjs';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function get(path,signal){
 const response=await fetch(path,{credentials:'same-origin',cache:'no-store',signal});
 const data=await response.json();
 if(!response.ok)throw Error(data.message||({401:'Sign in to Cosmos first.',404:'Item unavailable.',429:'Try again soon.'})[response.status]||'Could not load this item.');
 return data;
}
export function openInventoryPicker(root,{signal,onAdd,onBuy,onPurchased,onCustom,getBalance}){
 const dialog=document.createElement('dialog'),preview=document.createElement('dialog');
 dialog.className='cs-dialog cs-picker cs-catalog-picker';
 dialog.setAttribute('aria-label','Add an item');
 dialog.innerHTML='<header><h2>Item catalog</h2><button class="cs-icon" type="button" data-picker-close aria-label="Close">×</button></header>'+
 '<div data-picker-categories></div>'+
 '<form class="cs-picker-search"><input name="q" aria-label="Search items" placeholder="Search items" maxlength="80"><button class="button">Search</button></form>'+
 '<div class="cs-picker-list cs-catalog-list" data-picker-list></div>'+
 '<div class="cs-picker-footer"><button class="button" data-custom-item type="button">Custom item</button><button class="button" data-picker-next type="button" hidden>More</button></div>'+
 '<p class="cs-caption" role="status" data-picker-status></p>';
 preview.className='cs-dialog cs-star-border cs-catalog-preview';
 preview.setAttribute('aria-labelledby','cs-catalog-preview-title');
 preview.innerHTML='<div class="cs-catalog-preview-scroll"><header class="cs-catalog-heading"><h2 id="cs-catalog-preview-title" data-catalog-title></h2><button class="cs-icon" type="button" data-catalog-back aria-label="Close item preview">×</button></header>'+
 '<form data-catalog-purchase><div class="cs-catalog-purchase-summary"><label class="cs-catalog-quantity">Qty<input type="number" name="quantity" min="1" max="999" step="1" value="1" required aria-label="Quantity to buy"></label>'+
 '<div class="cs-catalog-amount"><span>Amount</span><strong data-catalog-total>—</strong><small data-catalog-unit></small></div></div>'+
 '<p class="cs-catalog-balance" data-catalog-balance></p><div data-catalog-description></div>'+
 '<p role="status" data-catalog-feedback></p><footer class="cs-catalog-actions"><button type="button" class="button" data-catalog-back>Back to items</button><button type="submit" class="button primary" data-catalog-confirm>Buy</button></footer></form></div>';
 root.append(dialog,preview);
 const request=new AbortController();
 const dispose=()=>{request.abort();if(preview.open)preview.close();preview.remove();dialog.remove();signal.removeEventListener('abort',dispose);};
 dialog.addEventListener('close',dispose,{once:true});
 signal.addEventListener('abort',dispose,{once:true});
 const list=dialog.querySelector('[data-picker-list]'),status=dialog.querySelector('[data-picker-status]');
 const categories=dialog.querySelector('[data-picker-categories]'),next=dialog.querySelector('[data-picker-next]');
 const form=preview.querySelector('[data-catalog-purchase]'),input=form.elements.quantity,confirm=form.querySelector('[data-catalog-confirm]'),feedback=preview.querySelector('[data-catalog-feedback]');
 let counts={},items=[],selected=null,category='All',query='',cursor=null,busy=false,requestId=null;
 const priceText=item=>item.priceGil===null?'No fixed price':formatGil(item.priceGil);
 const paintCategories=()=>{categories.innerHTML=renderCategoryTiles(counts,category,{attribute:'data-picker-category',label:'Item categories',groups:true,iconOnly:true});};
 function updateAmount(){
  if(!selected)return;
  const qty=Number(input.value),total=catalogPurchaseTotal(selected,qty),priced=selected.priceGil!==null;
  preview.querySelector('[data-catalog-total]').textContent=priced?(total===null?'—':formatGil(total)):'No listed price';
  preview.querySelector('[data-catalog-unit]').textContent=priced?'Unit price: '+priceText(selected):'The catalog does not provide a fixed Gil price.';
  const raw=getBalance?.(),balance=Number(raw),known=raw!==null&&raw!==undefined&&Number.isFinite(balance)&&balance>=0;
  const insufficient=priced&&known&&total!==null&&Math.round(balance*100)<Math.round(total*100);
  preview.querySelector('[data-catalog-balance]').textContent=(known?'Your Gil: '+formatGil(balance):'')+(insufficient?' · Not enough Gil':priced?'':' · No Gil will be deducted for unpriced items.');
  confirm.textContent=priced?'Buy':'Add without a price';
  confirm.disabled=busy||!Number.isSafeInteger(qty)||qty<1||qty>999||priced&&(total===null||insufficient);
 }
 async function load(append=false){
  if(busy)return;
  busy=true;status.textContent='Loading items…';
  if(!append){items=[];list.replaceChildren();next.hidden=true;}
  try{
   const params=new URLSearchParams({q:query,category:category==='All'?'':category,cursor:append?cursor:''});
   const result=await get('/api/v1/item-catalog?'+params,request.signal);
   if(!dialog.open)return;
   items=items.concat(result.items);cursor=result.nextCursor;next.hidden=!cursor;
   list.innerHTML=items.map(item=>'<button class="cs-picker-row cs-catalog-row" type="button" data-catalog-item="'+esc(item.id)+'" aria-haspopup="dialog"><span class="cs-catalog-row-icon" aria-hidden="true">'+itemCategorySymbol(item.category)+'</span><span class="cs-catalog-row-label"><strong>'+esc(item.name)+'</strong><small>'+esc(item.category)+'</small></span><span class="cs-catalog-row-price">'+esc(priceText(item))+'</span><span class="cs-catalog-row-arrow" aria-hidden="true">›</span></button>').join('');
   status.textContent=items.length?'':'No items found.';
  }catch(error){if(dialog.open)status.textContent=error.message;}
  finally{busy=false;}
 }
 async function showItem(itemId){
  if(busy||!dialog.open)return;
  busy=true;status.textContent='Loading item details…';
  try{
   const result=await get('/api/v1/item-catalog/'+encodeURIComponent(itemId),request.signal);
   if(!dialog.open||!result.item)return;
   selected=result.item;requestId=crypto.randomUUID();
   preview.querySelector('[data-catalog-title]').textContent=selected.name;
   preview.querySelector('[data-catalog-description]').innerHTML=renderCatalogPreview(selected);
   input.value='1';feedback.textContent='';
   busy=false;updateAmount();preview.showModal();input.focus();status.textContent='';
  }catch(error){if(dialog.open)status.textContent=error.message;}
  finally{busy=false;}
 }
 dialog.querySelector('[data-picker-close]').onclick=()=>dialog.close();
 dialog.querySelector('.cs-picker-search').onsubmit=event=>{
  event.preventDefault();if(busy)return;query=event.currentTarget.elements.q.value.trim();void load();
 };
 input.addEventListener('input',()=>{requestId=crypto.randomUUID();updateAmount();});
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const quantity=Number(input.value),total=catalogPurchaseTotal(selected,quantity),priced=selected?.priceGil!==null;
  if(busy||!selected||!Number.isSafeInteger(quantity)||quantity<1||quantity>999||priced&&total===null)return;
  busy=true;confirm.disabled=true;feedback.textContent=priced?'Buying…':'Adding item…';
  try{
   if(priced){
    const receipt=await onBuy(selected,quantity,requestId);
    if(preview.open)preview.close();
    if(dialog.open)dialog.close();
    await onPurchased(receipt);
   }else{
    const message=await onAdd(selected.id,quantity);
    if(message)throw Error(message);
    if(preview.open)preview.close();
    if(dialog.open)dialog.close();
   }
  }catch(error){if(preview.open)feedback.textContent=error.message||'Could not buy this item.';}
  finally{busy=false;if(preview.open)updateAmount();}
 });
 preview.addEventListener('click',event=>{if(event.target.closest('[data-catalog-back]'))preview.close();});
 dialog.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||busy)return;
  if(button.hasAttribute('data-custom-item')){dialog.close();onCustom();return;}
  if(button.hasAttribute('data-picker-next')){void load(true);return;}
  if(button.dataset.pickerCategory){category=button.dataset.pickerCategory;paintCategories();void load();return;}
  if(button.dataset.catalogItem)void showItem(button.dataset.catalogItem);
 });
 dialog.showModal();
 void get('/api/v1/item-catalog/categories',request.signal).then(result=>{
  if(!dialog.open)return;
  counts=Object.fromEntries(result.categories.map(item=>[item.category,item.count]));paintCategories();
 }).catch(()=>{if(dialog.open)paintCategories();});
 void load();
}
