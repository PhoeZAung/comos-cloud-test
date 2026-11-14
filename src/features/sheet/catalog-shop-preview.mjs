import {shopCatalogShortLabel} from './shop-catalogs.mjs';
import {inventoryItemValue} from './inventory-fields.mjs';
import {formatSheetText} from './rich-text.mjs';
import {shopUnitPriceGil,FFD20_SHOP_PRICE_MODE} from './shop-pricing.mjs';

const safeItemLink=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Only values that affect play appear before purchase. Source/category/version,
// bulk, item level and repeated scraped "Source: ..." columns are intentionally hidden.
const MECHANICAL_FIELDS=Object.freeze([
 ['Damage','dmg'],['Damage (Small)','dmgS'],['Damage (Medium)','dmgM'],
 ['Critical','crit'],['Range','range'],['Damage type','damageType'],['Weapon traits','traits'],
 ['Attack / Damage','attackDmg'],['Misfire','misfire'],['Capacity','capacity'],['Ammunition','ammo'],
 ['Armor bonus','acBonus'],['Max Dex','maxDex'],['Check penalty','checkPenalty'],['Spell failure','spellFailure'],
 ['Speed (30 ft.)','speed30Ft'],['Speed (20 ft.)','speed20Ft'],['Speed','speed'],['Full speed','fullSpeed'],
 ['AC / CMD','acCmd'],['Hit Points','hp'],['Hardness','hardness'],
 ['Save DC','dcSave'],['Healing','healing'],['Effect','effect'],['Duration','duration'],
 ['Bonus','bonus'],['Caster level','cl'],['Craft DC','craftDc'],
 ['Aim','aim'],['Load','load'],['Passengers / Crew','passengersCrew'],['Fuel','fuel'],['Mileage','mileage'],
 ['Proficiency','proficiency'],['Usage','usageType'],['Tier','tier'],['Weight (lb)','weight']
]);
export function catalogMechanicalFacts(item={}){
 const catalog=item.catalog||item.sourceCatalog||{};
 const record={...catalog,...item,sourceCatalog:catalog};
 const facts=[],seenKeys=new Set();
 for(const [label,key] of MECHANICAL_FIELDS){
  let value=inventoryItemValue(record,key);
  if((value===undefined||value===null||String(value).trim()==='')&&key==='healing')value=catalog.healing;
  if(value===undefined||value===null||typeof value==='object'||!String(value).trim())continue;
  // Different-size damage is only useful if it differs from the generic damage field.
  if((key==='dmgS'||key==='dmgM')&&String(value)===String(inventoryItemValue(record,'dmg')??''))continue;
  if(key==='attackDmg'&&String(value)===String(inventoryItemValue(record,'dmg')??''))continue;
  if(seenKeys.has(key))continue;
  seenKeys.add(key);
  facts.push([label,key==='weight'?String(value)+' lb':String(value).slice(0,600)]);
 }
 return facts;
}
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
export function renderCatalogPreview(item,{pricingMode=null}={}){
 const catalog=item.catalog||{},facts=catalogMechanicalFacts(item);
 const ffConversion=pricingMode===FFD20_SHOP_PRICE_MODE&&item.priceGil===null&&shopUnitPriceGil(item,pricingMode)!==null;
 const details=facts.length?'<section class="cs-catalog-details"><h3>Gameplay details</h3><dl class="cs-inventory-facts">'+facts.map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl></section>':'';
 const link=safeItemLink(catalog.detailUrl||catalog.sourceUrl||catalog.link);
 return '<p class="cs-catalog-category">'+esc(shopCatalogShortLabel(item))+'</p>'+
  (item.priceGil===null&&item.costText?'<p class="cs-catalog-original-price">Original price: <strong>'+esc(item.costText)+'</strong> · '+(ffConversion?'FFd20 shop: 1 gp = 1 Gil':'No Gil conversion configured')+'</p>':'')+
  details+
  '<div class="cs-catalog-item-description"><h3>Description</h3><div class="cs-prose">'+formatSheetText(item.description||'No description available.')+'</div></div>'+
  (link?'<p class="cs-catalog-link"><a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">View original item</a></p>':'');
}
