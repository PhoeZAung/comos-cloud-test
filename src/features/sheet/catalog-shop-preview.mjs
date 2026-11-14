import {shopSourceLabel} from './shop-sources.mjs';
import {safeSheetLink} from './rich-text.mjs';
import {inventoryItemDetails} from './inventory-fields.mjs';
import {formatSheetText} from './rich-text.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function formatGil(value){
 if(typeof value!=='number'||!Number.isFinite(value)||value<0)return 'Not priced';
 return new Intl.NumberFormat('en-US',{maximumFractionDigits:2,minimumFractionDigits:0}).format(value)+' Gil';
}
export function catalogPurchaseTotal(item,quantity){
 if(!Number.isSafeInteger(quantity)||quantity<1||quantity>999||typeof item?.priceGil!=='number'||!Number.isFinite(item.priceGil)||item.priceGil<0)return null;
 const units=Math.round(item.priceGil*100),total=units*quantity;
 if(!Number.isSafeInteger(total)||Math.abs(item.priceGil*100-units)>0.0001)return null;
 return total/100;
}
export function renderCatalogPreview(item){
 const record={name:item.name,shopSource:item.shopSource,sourceCategory:item.category,sourceCatalog:item.catalog,cost:item.costText};
 const facts=inventoryItemDetails(record).filter(([label])=>!['Category','Cost'].includes(label));
 const name=esc(item.name),category=esc(item.category||'Item');
 const details=facts.length?'<section class="cs-catalog-details"><h3>Item details</h3><dl class="cs-inventory-facts">'+facts.map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+(label==='Source link'&&safeSheetLink(value)?'<a href="'+esc(safeSheetLink(value))+'" target="_blank" rel="noopener noreferrer">Open original item page</a>':esc(value))+'</dd></div>').join('')+'</dl></section>':'';
 return '<p class="cs-catalog-category">'+category+' · '+esc(shopSourceLabel(item))+'</p>'+
  '<div class="cs-catalog-item-description"><h3>Description</h3><div class="cs-prose">'+formatSheetText(item.description||'No description available.')+'</div></div>'+
  details;
}
