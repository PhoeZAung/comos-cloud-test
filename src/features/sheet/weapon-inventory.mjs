import {itemCategoryForItem} from './item-categories.mjs';

/** Weapon entries live in the Weapons collection. Ammunition stays in Inventory.
 * Preserve the original catalog provenance and equipment state when moving.
 */
export function isWeaponInventoryItem(item){
 return item&&['Weapon','Ranged Weapon','Ammunition'].includes(itemCategoryForItem(item));
}
export function weaponFromInventory(item){
 if(!isWeaponInventoryItem(item))throw Error('Only weapons and ammunition can be moved to Weapons.');
 const category=itemCategoryForItem(item);
 return {...item,
  sourceCategory:category,
  ...(category==='Ammunition'?{}:{attack_type:item.attack_type|| (category==='Ranged Weapon'?'ranged':'melee')}),
  ...(category==='Ammunition'?{}:{damage:String(item.damage||item.dmg||'').slice(0,300)}),
  u_curr:Number.isSafeInteger(item.u_curr)&&item.u_curr>=0?item.u_curr:0,
  u_max:Number.isSafeInteger(item.u_max)&&item.u_max>=0?item.u_max:0
 };
}
export function moveInventoryWeapons(data){
 const items=Array.isArray(data.items)?data.items:[],weapons=Array.isArray(data.weapons)?data.weapons:[];
 const selected=items.filter(isWeaponInventoryItem);
 if(!selected.length)throw Error('No weapons or ammunition found in Inventory to move.');
 if(weapons.length+selected.length>1000)throw Error('Weapons list is full.');
 data.items=items.filter(item=>!isWeaponInventoryItem(item));
 data.weapons=[...weapons,...selected.map(weaponFromInventory)];
 return selected.length;
}

const normalizeAmmoName=value=>String(value??'').trim().normalize('NFKC').replace(/\s+/g,' ').toLocaleLowerCase('en-US');
const validCount=v=>Number.isSafeInteger(Number(v))&&Number(v)>=0;

/** A weapon's Ammo Type is a precise name link to inventory items whose
 * category is Ammunition. No fuzzy matches or unrelated item consumption. */
export function ammoStock(data,ammoType){
 const target=normalizeAmmoName(ammoType);
 if(!target)return {name:'',total:0,stacks:[]};
 const stacks=['weapons','items'].flatMap(collection=>(Array.isArray(data[collection])?data[collection]:[])
  .map((item,index)=>({item,index,collection})))
  .filter(({item})=>itemCategoryForItem(item)==='Ammunition'&&normalizeAmmoName(item.name)===target&&validCount(item.amount));
 return {name:target,total:stacks.reduce((n,{item})=>n+Number(item.amount),0),stacks};
}
export function reloadWeaponFromInventory(data,index){
 if(!Number.isInteger(index)||index<0||!Array.isArray(data.weapons)||!data.weapons[index])throw Error('Weapon not found.');
 const weapon=data.weapons[index],max=Number(weapon.u_max??0),current=Number(weapon.u_curr??0);
 if(!Number.isSafeInteger(max)||max<=0)throw Error('Set Max Ammo before reloading.');
 if(!Number.isSafeInteger(current)||current<0||current>max)throw Error('Set a valid Ammo count before reloading.');
 if(current===max)throw Error('Ammo is already full.');
 if(typeof weapon.ammoType!=='string'||!weapon.ammoType.trim())throw Error('Set Ammo Type in the weapon editor first.');
 const stock=ammoStock(data,weapon.ammoType);
 if(!stock.total)throw Error('No '+weapon.ammoType.trim()+' left in Inventory.');
 const loaded=Math.min(max-current,stock.total);
 let remaining=loaded;
 for(const {item} of stock.stacks){
  const used=Math.min(Number(item.amount),remaining);
  item.amount-=used;remaining-=used;
  if(!remaining)break;
 }
 weapon.u_curr=current+loaded;
 // Keep empty stacks (amount 0) in place so saved indices and source metadata remain stable.
 return {loaded,current:weapon.u_curr,max,stockRemaining:stock.total-loaded,ammoType:weapon.ammoType};
}
