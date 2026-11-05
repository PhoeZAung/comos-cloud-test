// Category-specific inventory fields, ported from Mount Aetheria's item editor.
// Keep category names identical to the shared original-shop taxonomy.
import {itemCategoryForItem,normalizeItemTagLabel} from './item-categories.mjs';

export const ITEM_EDIT_FIELDS_BY_CATEGORY=Object.freeze({
  Weapon:[['Proficiency','proficiency'],['Usage','usageType'],['Damage','dmg'],['Critical','crit'],['Range','range']],
  'Ranged Weapon':[['Proficiency','proficiency'],['Usage','usageType'],['Damage','dmg'],['Critical','crit'],['Range','range'],['Ammunition','ammo']],
  Armor:[['AC Bonus','acBonus'],['Max Dex','maxDex'],['Check Penalty','checkPenalty'],['Spell Failure','spellFailure'],['Speed','speed']],
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
 return ['sourceCategory','name',...fields.common.map(([,key])=>key),...fields.extras.map(([,key])=>key),...(fields.allowTwoHanded?['two_handed']:[]),'desc','special'];
}
export function inventoryFieldLabel(key){
 return [...ITEM_COMMON_FIELDS,...Object.values(ITEM_EDIT_FIELDS_BY_CATEGORY).flat(),['Special','special']].find(([,field])=>field===key)?.[0]||key;
}
export function inventoryItemDetails(item={}){
 const {common,extras}=inventoryEditorFields(itemCategoryForItem(item));
 const values=[['Category',itemCategoryForItem(item)],...common.filter(([,key])=>!['img','amount'].includes(key)),...extras].map(([label,key])=>[label,key==='Category'?itemCategoryForItem(item):item[key]]);
 const seen=new Set();return values.filter(([label,value])=>{
  if(value===undefined||value===null||value==='')return false;
  if(seen.has(label))return false;seen.add(label);return true;
 });
}
