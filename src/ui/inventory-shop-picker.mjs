import {catalogKey,shopCatalogChoiceLabel} from '../features/sheet/shop-catalogs.mjs';
import {renderCategoryTiles,itemCategorySymbol} from '../features/sheet/item-categories.mjs';
import {renderCatalogPreview,formatGil,catalogPurchaseTotal} from '../features/sheet/catalog-shop-preview.mjs';
import {shopUnitPriceGil} from '../features/sheet/shop-pricing.mjs';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const moneyHtml=value=>{
 const label=formatGil(value);
 if(label==='Not priced')return esc(label);
 return '<span class="cs-shop-money" aria-label="'+esc(label)+'"><span aria-hidden="true">🪙</span> '+esc(label.replace(/ Gil$/,''))+'</span>';
};
const weightHtml=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0?'<span class="cs-shop-weight">⚖️ '+esc(new Intl.NumberFormat('en-US',{maximumFractionDigits:4}).format(value))+' lb</span>':'';
const rememberedShopTags=new WeakMap();
const tagStorageKey=key=>key&&/^[0-9a-f-]{36}$/i.test(String(key))?'cosmos.shop.tags.'+key:null;
async function get(path,signal){
 const response=await fetch(path,{credentials:'same-origin',cache:'no-store',signal});
 const data=await response.json();
 if(!response.ok)throw Error(data.message||({401:'Sign in to Cosmos first.',404:'Item unavailable.',429:'Try again soon.'})[response.status]||'Could not load this item.');
 return data;
}
export function openInventoryPicker(root,{signal,onAdd,onBuy,onPurchased,onCustom,getBalance,pricingMode=null,shopSelectionKey=null}){
 const dialog=document.createElement('dialog'),preview=document.createElement('dialog'),shopDialog=document.createElement('dialog');
 dialog.className='cs-dialog cs-picker cs-catalog-picker';
 dialog.setAttribute('aria-label','Add an item');
 dialog.innerHTML='<header><h2>Item catalog</h2><button class="cs-icon" type="button" data-picker-close aria-label="Close">×</button></header>'+
 '<div class="cs-catalog-shop-controls"><div class="cs-catalog-toolbar"><button type="button" class="button cs-shop-trigger" data-picker-shop-toggle aria-haspopup="dialog" aria-controls="cs-picker-shop-options" aria-expanded="false">Choose Shop <span data-picker-shop-count></span><span aria-hidden="true">⌄</span></button><button type="button" class="button cs-custom-trigger" data-custom-item>+ Custom Item</button></div></div>'+   
 '<div data-picker-categories></div>'+
 '<form class="cs-picker-search"><input name="q" aria-label="Search items" placeholder="Search items" maxlength="80"><button class="button">Search</button></form>'+
 '<div class="cs-picker-list cs-catalog-list" data-picker-list></div>'+
 '<div class="cs-picker-footer"><button class="button" data-picker-next type="button" hidden>More</button></div>'+ 
 '<p class="cs-caption" role="status" data-picker-status></p>';
 preview.className='cs-dialog cs-star-border cs-catalog-preview';
 preview.setAttribute('aria-labelledby','cs-catalog-preview-title');
 preview.innerHTML='<div class="cs-catalog-preview-scroll"><header class="cs-catalog-heading"><h2 id="cs-catalog-preview-title" data-catalog-title></h2><button class="cs-icon" type="button" data-catalog-back aria-label="Close item preview">×</button></header>'+
 '<form data-catalog-purchase><div class="cs-catalog-purchase-summary"><label class="cs-catalog-quantity">Qty<input type="number" name="quantity" min="1" max="999" step="1" value="1" required aria-label="Quantity to buy"></label>'+
 '<div class="cs-catalog-amount"><span>Amount</span><strong data-catalog-total>—</strong><small data-catalog-unit></small></div></div>'+
 '<p class="cs-catalog-balance" data-catalog-balance></p><div data-catalog-description></div>'+
 '<p role="status" data-catalog-feedback></p><footer class="cs-catalog-actions"><button type="button" class="button" data-catalog-back>Back to items</button><button type="submit" class="button primary" data-catalog-confirm>Buy</button></footer></form></div>';
 shopDialog.id='cs-picker-shop-options';
 shopDialog.className='cs-dialog cs-shop-tag-dialog';
 shopDialog.setAttribute('aria-labelledby','cs-picker-shop-title');
 shopDialog.innerHTML='<header><h2 id="cs-picker-shop-title">Choose Shops</h2><button type="button" class="cs-icon" data-picker-shop-cancel aria-label="Close shops">×</button></header><p class="cs-caption">Choose one or more catalogs</p><nav class="cs-shop-source-tabs" aria-label="Shop tags" data-picker-sources></nav><footer><button class="button primary" type="button" data-picker-shop-done>Done</button></footer>';
 root.append(dialog,preview,shopDialog);
 const request=new AbortController();
 const dispose=()=>{request.abort();if(shopDialog.open)shopDialog.close();if(preview.open)preview.close();shopDialog.remove();preview.remove();dialog.remove();signal.removeEventListener('abort',dispose);};
 dialog.addEventListener('close',dispose,{once:true});
 signal.addEventListener('abort',dispose,{once:true});
 const list=dialog.querySelector('[data-picker-list]'),status=dialog.querySelector('[data-picker-status]');
 const categories=dialog.querySelector('[data-picker-categories]'),next=dialog.querySelector('[data-picker-next]');
 const shopPanel=shopDialog,shopToggle=dialog.querySelector('[data-picker-shop-toggle]');
 const setShopPopup=open=>{if(open&&!shopPanel.open){chosen=new Set(appliedChosen);shopPanel.returnValue='';paintSources();shopPanel.showModal();}else if(!open&&shopPanel.open)shopPanel.close();shopToggle.setAttribute('aria-expanded',String(open));};
 const form=preview.querySelector('[data-catalog-purchase]'),input=form.elements.quantity,confirm=form.querySelector('[data-catalog-confirm]'),feedback=preview.querySelector('[data-catalog-feedback]');
 let catalogs=[],chosen=new Set(),appliedChosen=new Set(),counts={},items=[],selected=null,category='All',query='',cursor=null,busy=false,queuedLoad=false,requestId=null,selectionVersion=0;
 const priceText=item=>{const unit=shopUnitPriceGil(item,pricingMode);return unit===null?(item.costText?String(item.costText)+' · no Gil price':'No fixed price'):formatGil(unit);};
 const priceHtml=item=>{const unit=shopUnitPriceGil(item,pricingMode);return unit===null?esc(priceText(item)):moneyHtml(unit);};
 const paintSources=()=>{shopPanel.querySelector('[data-picker-sources]').innerHTML=catalogs.map(source=>'<button type="button" class="button" data-picker-catalog="'+esc(source.id)+'" title="'+esc(source.label)+'" aria-pressed="'+chosen.has(source.id)+'"><span>'+esc(shopCatalogChoiceLabel(source,catalogs))+'</span><small>'+Number(source.count||0).toLocaleString()+'</small></button>').join('');dialog.querySelector('[data-picker-shop-count]').textContent=appliedChosen.size?' ('+appliedChosen.size+')':'';};
 const selectedParams=()=>{
  const params=new URLSearchParams(),ids=new Set();
  for(const choice of catalogs)if(appliedChosen.has(choice.id))for(const id of choice.catalogIds||[choice.id])ids.add(id);
  for(const id of ids)params.append('catalog',id);
  return params;
 };
 const rememberTags=()=>{
  const selection=[...appliedChosen];rememberedShopTags.set(root,selection);
  const key=tagStorageKey(shopSelectionKey);
  if(key){try{localStorage.setItem(key,JSON.stringify(selection));}catch{}}
 };
 const restoreTags=()=>{
  let selected=rememberedShopTags.get(root);
  const key=tagStorageKey(shopSelectionKey);
  if(!selected&&key){try{selected=JSON.parse(localStorage.getItem(key)||'[]');}catch{}}
  const valid=new Set(catalogs.map(entry=>entry.id));
  appliedChosen=new Set(Array.isArray(selected)?selected.filter(x=>typeof x==='string'&&valid.has(x)):[]);
  chosen=new Set(appliedChosen);
 };
 const loadCounts=async()=>{if(!appliedChosen.size)return;const version=selectionVersion,params=selectedParams();const result=await get('/api/v1/item-catalog/categories?'+params,request.signal);if(!dialog.open||version!==selectionVersion)return;counts=Object.fromEntries(result.categories.map(row=>[row.category,row.count]));paintCategories();};
 const paintCategories=()=>{categories.innerHTML=renderCategoryTiles(counts,category,{attribute:'data-picker-category',label:'Item categories',groups:false,iconOnly:true});};
 function updateAmount(){
  if(!selected)return;
  const qty=Number(input.value),unit=shopUnitPriceGil(selected,pricingMode),total=catalogPurchaseTotal({...selected,priceGil:unit},qty),priced=unit!==null;
  preview.querySelector('[data-catalog-total]').innerHTML=priced?(total===null?'—':moneyHtml(total)):'No listed price';
  preview.querySelector('[data-catalog-unit]').innerHTML=priced?'Unit: '+moneyHtml(unit):'No price set · item can be added without payment.';
  const raw=getBalance?.(),balance=Number(raw),known=raw!==null&&raw!==undefined&&Number.isFinite(balance)&&balance>=0;
  const insufficient=priced&&known&&total!==null&&Math.round(balance*100)<Math.round(total*100);
  preview.querySelector('[data-catalog-balance]').innerHTML=(known?'<span class="cs-shop-balance-label">Balance</span> '+moneyHtml(balance):'')+(insufficient?' · Not enough Gil':priced?'':' · No payment required');
  confirm.textContent=priced?'Buy':'Add without a price';
  confirm.disabled=busy||!Number.isSafeInteger(qty)||qty<1||qty>999||priced&&(total===null||insufficient);
 }
 async function load(append=false){
  if(!appliedChosen.size)return;
  if(busy){queuedLoad=true;return;}
  const version=selectionVersion;
  busy=true;status.textContent='Loading items…';
  if(!append){items=[];list.replaceChildren();next.hidden=true;}
  try{
   const params=new URLSearchParams({q:query,category:category==='All'?'':category,cursor:append?cursor:''});
   for(const [,id] of selectedParams())params.append('catalog',id);
   const result=await get('/api/v1/item-catalog?'+params,request.signal);
   if(!dialog.open||version!==selectionVersion)return;
   items=items.concat(result.items);cursor=result.nextCursor;next.hidden=!cursor;
   list.innerHTML=items.map(item=>'<button class="cs-picker-row cs-catalog-row" type="button" data-catalog-item="'+esc(item.id)+'" aria-haspopup="dialog"><span class="cs-catalog-row-icon" aria-hidden="true">'+itemCategorySymbol(item.category)+'</span><span class="cs-catalog-row-label"><strong>'+esc(item.name)+'</strong><small>'+esc(item.category)+' · '+esc(shopCatalogChoiceLabel(catalogs.find(source=>(source.catalogIds||[source.id]).includes(catalogKey(item.sourceId,item.sourceVersion)))||{shortLabel:'Catalog'},catalogs))+'</small>'+weightHtml(item.weightLb)+'</span><span class="cs-catalog-row-price">'+priceHtml(item)+'</span><span class="cs-catalog-row-arrow" aria-hidden="true">›</span></button>').join('');
   status.textContent=items.length?'':'No items found.';
  }catch(error){if(dialog.open)status.textContent=error.message;}
  finally{busy=false;if(queuedLoad){queuedLoad=false;void load();}}
 }
 async function showItem(itemId){
  if(busy||!dialog.open)return;
  busy=true;status.textContent='Loading item details…';
  try{
   const result=await get('/api/v1/item-catalog/'+encodeURIComponent(itemId),request.signal);
   if(!dialog.open||!result.item)return;
   selected=result.item;requestId=crypto.randomUUID();
   preview.querySelector('[data-catalog-title]').textContent=selected.name;
   preview.querySelector('[data-catalog-description]').innerHTML=renderCatalogPreview(selected,{pricingMode});
   input.value='1';feedback.textContent='';
   busy=false;updateAmount();preview.showModal();input.focus();status.textContent='';
  }catch(error){if(dialog.open)status.textContent=error.message;}
  finally{busy=false;}
 }
 dialog.querySelector('[data-picker-close]').onclick=()=>dialog.close();
 dialog.querySelector('.cs-picker-search').onsubmit=event=>{
  event.preventDefault();if(busy)return;query=event.currentTarget.elements.q.value.trim();if(!appliedChosen.size){status.textContent='Choose one or more shops first.';return;}void load();
 };
 input.addEventListener('input',()=>{requestId=crypto.randomUUID();updateAmount();});
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const quantity=Number(input.value),unit=shopUnitPriceGil(selected,pricingMode),total=catalogPurchaseTotal({...selected,priceGil:unit},quantity),priced=unit!==null;
  if(busy||!selected||!Number.isSafeInteger(quantity)||quantity<1||quantity>999||priced&&total===null)return;
  busy=true;confirm.disabled=true;feedback.textContent=priced?'Buying…':'Adding item…';
  try{
   if(priced){
    const receipt=await onBuy(selected,quantity,requestId,pricingMode);
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
  const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-custom-item')){dialog.close();onCustom();return;}
  if(button.hasAttribute('data-picker-shop-toggle')){setShopPopup(true);return;}
  if(busy)return;
  if(button.hasAttribute('data-picker-next')){void load(true);return;}
  if(button.dataset.pickerCategory){category=button.dataset.pickerCategory;paintCategories();void load();return;}
  if(button.dataset.catalogItem)void showItem(button.dataset.catalogItem);
 });
 shopPanel.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.pickerCatalog){const key=button.dataset.pickerCatalog;if(chosen.has(key))chosen.delete(key);else chosen.add(key);paintSources();return;}
  if(button.hasAttribute('data-picker-shop-done')){shopPanel.close('apply');return;}
  if(button.hasAttribute('data-picker-shop-cancel'))shopPanel.close();
 });
 shopPanel.addEventListener('close',()=>{
  shopToggle.setAttribute('aria-expanded','false');
  if(shopPanel.returnValue!=='apply'){chosen=new Set(appliedChosen);paintSources();return;}
  const changed=chosen.size!==appliedChosen.size||[...chosen].some(id=>!appliedChosen.has(id));
  if(!changed)return;
  appliedChosen=new Set(chosen);rememberTags();selectionVersion++;category='All';cursor=null;counts={};items=[];
  list.replaceChildren();next.hidden=true;paintSources();paintCategories();
  if(!appliedChosen.size){status.textContent='Choose Shop to browse items.';return;}
  void loadCounts().catch(error=>{if(dialog.open)status.textContent=error.message;});
  void load();
 });
 dialog.showModal();
 status.textContent='Choose Shop to browse items.';
 void (async()=>{try{const result=await get('/api/v1/item-catalog/catalogs',request.signal);if(!dialog.open)return;catalogs=result.catalogs||[];restoreTags();paintSources();if(!catalogs.length)status.textContent='No catalogs are available yet.';else if(appliedChosen.size){void loadCounts();void load();}}catch(error){if(dialog.open)status.textContent=error.message;}})();
}
