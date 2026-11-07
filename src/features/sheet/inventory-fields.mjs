// Category-specific inventory fields, ported from Mount Aetheria's item editor.
// Keep category names identical to the shared original-shop taxonomy.
import {itemCategoryForItem,normalizeItemTagLabel} from './item-categories.mjs';

export const ITEM_EDIT_FIELDS_BY_CATEGORY=Object.freeze({
  Weapon:[['Proficiency','proficiency'],['Usage','usageType'],['Damage','dmg'],['Critical','crit'],['Range','range']],
  'Ranged Weapon':[['Proficiency','proficiency'],['Usage','usageType'],['Damage','dmg'],['Critical','crit'],['Range','range'],['Ammunition','ammo']],
  Armor:[['Armor Bonus','acBonus'],['Max Dex','maxDex'],['Check Penalty','checkPenalty'],['Spell Failure','spellFailure'],['Speed (30 ft. base / 20 ft. base)','speed']],
  Machine:[['Full Speed','fullSpeed'],['Passengers/Crew','passengersCrew'],['Fuel','fuel'],['Mileage','mileage'],['AC/CMD','acCmd'],['HP','hp'],['Hardness','hardness'],['Attack/Damage','attackDmg'],['Critical','critical'],['Range','range'],['Damage Type','damageType'],['Aim','aim'],['Load','load']],
  'Alchemical Items':[['Tier','tier'],['Range','range'],['DC/Save','dcSave']]
});
export const ITEM_COMMON_FIELDS=Object.freeze([
 ['Type','type'],['Subtype','secondaryType'],['Image URL','img'],['Amount','amount'],['Cost','cost'],['Weight (lb)','weight'],['Caster Level','cl'],['Rarity','rarity']
]);
const noSubtype=new Set(['Weapon','Ranged Weapon','Ammunition','Armor','Machine']);
const noCasterLevel=new Set(['Weapon','Ranged Weapon','Ammunition','Armor','Food']);
export const itemEditableColumns=Object.freeze([
 ...new Set([...ITEM_COMMON_FIELDS.map(([,key])=>key),...Object.values(ITEM_EDIT_FIELDS_BY_CATEGORY).flat().map(([,key])=>key),'special'])
]);
export function inventoryEditorFields(category){
 const normalized=normalizeItemTagLabel(category);
 const common=ITEM_COMMON_FIELDS.filter(([,key])=>!(key==='secondaryType'&&noSubtype.has(normalized))&&!(key==='cl'&&noCasterLevel.has(normalized)));
 const extras=(ITEM_EDIT_FIELDS_BY_CATEGORY[normalized]||[]).filter(([,key])=>!common.some(([,existing])=>existing===key));
 return {category:normalized,common,extras,allowTwoHanded:['Gear','Weapon','Ranged Weapon'].includes(normalized)};
}
export function inventoryEditorKeys(category){
 const fields=inventoryEditorFields(category);
 return ['sourceCategory','name',...fields.common.map(([,key])=>key),...fields.extras.map(([,key])=>key),...(fields.allowTwoHanded?['two_handed']:[]),'carried','desc','special'];
}
// Read legacy shop aliases without changing the saved schema until the user edits the field.
const legacyAliases={
 secondaryType:['filterTag','secondary type'],img:['image','imageUrl','imgUrl','image_url','image url','icon','picture'],cost:['priceGil','unitPriceGil','price'],
 weight:['weightLb','weight_lb','weightlbs','bulk'],cl:['casterLevel','caster level'],
 dmg:['damage','damageDice','damage_dice','dmgM','dmgS','damageM','damageS','damage (m)','attackDmg'],crit:['critical','crit_range','critRange'],
 proficiency:['proficiency'],usageType:['usage','use'],ammo:['ammunition','capacity'],
 acBonus:['armorBonus','shieldBonus','Armor/Shield Bonus'],maxDex:['maxDexBonus','maximumDexterityBonus','maximumDexBonus'],checkPenalty:['armorCheckPenalty'],
 spellFailure:['arcaneSpellFailure'],speed:['speedPenalty','speed30Ft','speed20Ft'],
 fullSpeed:['full speed'],passengersCrew:['passengers','crew'],acCmd:['ac/cmd'],critical:['crit'],
 damageType:['damage type'],dcSave:['saveDc','dc saves'],range:['rangeIncrement','range_increment'],special:['Special','Special Properties','specialProperties','properties']
};
export function inventoryItemValue(item={},key){
 const candidates=[key,...(legacyAliases[key]||[])];
 const normalize=label=>String(label||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const normalized=new Set(candidates.map(normalize));
 const present=val=>val!==undefined&&val!==null&&typeof val!=='object'&&String(val).trim()!=='';
 const lookup=source=>{
  if(!source||typeof source!=='object')return undefined;
  for(const candidate of candidates)if(present(source[candidate]))return source[candidate];
  for(const [label,val] of Object.entries(source))if(normalized.has(normalize(label))&&present(val))return val;
  return undefined;
 };
 const lookupDetails=source=>{
  if(!Array.isArray(source))return undefined;
  for(const detail of source){
   if(!detail||typeof detail!=='object')continue;
   const name=detail.name??detail.label??detail.key??detail.title;
   const val=detail.val??detail.value??detail.text;
   if(normalized.has(normalize(name))&&present(val))return val;
  }
  return undefined;
 };
 const catalog=item.sourceCatalog??item.catalog;
 const value=[item,item.raw,catalog,catalog?.raw].map(lookup).find(present)
    ??[item.details,catalog?.details,item.attrs].map(lookupDetails).find(present);
 if(key==='weight'&&value!==undefined){
  const fraction=/^\s*(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)/.exec(String(value));
  if(fraction&&Number(fraction[3])>0)return Number(fraction[1]||0)+Number(fraction[2])/Number(fraction[3]);
  const parsed=Number.parseFloat(String(value));return Number.isFinite(parsed)?parsed:value;
 }
 return value;
}
// An image URL is optional display metadata. Never block an item save because
// imported catalog data contains an oversized image, data URI, or unsupported URL.
export function usableItemImageUrl(value){
 if(typeof value!=='string')return '';
 const raw=value.trim();
 if(!raw||raw.length>2048||/[\u0000-\u001f\u007f]/u.test(raw))return '';
 try{
  const url=new URL(raw);
  return ['http:','https:'].includes(url.protocol)&&url.hostname&&!url.username&&!url.password?url.href:'';
 }catch{return '';}
}
// Catalog values are often imported from unstructured text. All optional item
// metadata is display-only and must not prevent changes to unrelated fields.
export function normalizeInventoryText(value,key=''){
 const max=['desc','special'].includes(key)?30000:12000;
 if(value===null||value===undefined)return '';
 const raw=typeof value==='string'?value:typeof value==='number'&&Number.isFinite(value)||typeof value==='boolean'?String(value):'';
 return raw.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu,'').slice(0,max);
}
export function inventoryFieldLabel(key){
 return [...ITEM_COMMON_FIELDS,...Object.values(ITEM_EDIT_FIELDS_BY_CATEGORY).flat(),['Name','name'],['Description','desc'],['Special','special']].find(([,field])=>field===key)?.[0]||key;
}
export function inventoryItemDetails(item={}){
 const {common,extras}=inventoryEditorFields(itemCategoryForItem(item));
 const values=[['Category',itemCategoryForItem(item)],...common.filter(([,key])=>!['img','amount'].includes(key)),...extras].map(([label,key])=>[label,key==='Category'?itemCategoryForItem(item):inventoryItemValue(item,key)]);
 const seen=new Set();return values.filter(([label,value])=>{
  if(value===undefined||value===null||value==='')return false;
  if(seen.has(label))return false;seen.add(label);return true;
 });
}
