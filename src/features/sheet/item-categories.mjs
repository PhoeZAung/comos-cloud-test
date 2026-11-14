/**
 * Inventory categories from the original Mount Aetheria shop (tools.html).
 * Nine browse groups preserve the original per-item category tags for compatibility.
 * Collection and Misc are retained for items created in older character sheets.
 */
// Nine browse groups; existing category tags remain valid for saved characters.
export const SHOP_ITEM_CATEGORY_GROUPS = Object.freeze({
 'Weapons & Ammunition':Object.freeze(['Weapon','Ranged Weapon','Ammunition']),
 'Armor & Shields':Object.freeze(['Armor']),
 'Consumables':Object.freeze(['Food','Alchemical Items','Consumables']),
 'Gear & Tools':Object.freeze(['Gear']),
 'Magic Items':Object.freeze(['Magic Items','Artifacts']),
 'Enhancements':Object.freeze(['Enchantment','Enhancements']),
 'Materials & Crafting':Object.freeze(['Materials & Crafting']),
 'Vehicles & Mounts':Object.freeze(['Machine','Vehicles & Mounts']),
 'Services & Other':Object.freeze(['Collection','Misc','Services & Other'])
});
export const ITEM_TAG_OPTIONS = Object.freeze(Object.values(SHOP_ITEM_CATEGORY_GROUPS).flat());

export const ITEM_CATEGORY_SYMBOLS = Object.freeze({
  'Gear': '🎒',
  'Food': '🍖',
  'Weapon': '⚔️',
  'Ranged Weapon': '🏹',
  'Ammunition': '🎯',
  'Armor': '🛡️',
  'Enchantment': '✨',
  'Machine': '⚙️',
  'Alchemical Items': '⚗️',
  'Artifacts': '🏺',
  'Magic Items': '🔮',
  'Collection': '📜',
  'Misc': '📦',
  'Consumables':'🧪', 'Enhancements':'✨', 'Materials & Crafting':'🧱', 'Vehicles & Mounts':'🚙', 'Services & Other':'🧾'
});

const aliases = new Map();
for (const category of ITEM_TAG_OPTIONS) {
  aliases.set(category.toLowerCase(), category);
}
for (const [alias, category] of Object.entries({
  'equipment':'Gear', 'adventuring gear':'Gear', 'general gear':'Gear',
  'foods':'Food', 'consumable':'Consumables', 'consumables':'Consumables', 'potions':'Consumables', 'potion':'Consumables',
  'weapons':'Weapon', 'melee weapon':'Weapon', 'melee weapons':'Weapon',
  'ranged weapons':'Ranged Weapon', 'firearm':'Ranged Weapon', 'firearms':'Ranged Weapon',
  'ammo':'Ammunition', 'arrows':'Ammunition', 'bullets':'Ammunition',
  'armour':'Armor', 'shield':'Armor', 'shields':'Armor',
  'enchantments':'Enchantment', 'weapon enchantment':'Enchantment', 'armor enchantment':'Enchantment',
  'machines':'Machine', 'vehicle':'Vehicles & Mounts', 'vehicles':'Vehicles & Mounts', 'mount':'Vehicles & Mounts', 'mounts':'Vehicles & Mounts',
  'alchemical item':'Alchemical Items', 'alchemical':'Alchemical Items', 'alchemy':'Alchemical Items',
  'artifact':'Artifacts', 'magic item':'Magic Items', 'wondrous':'Magic Items',
  'wondrous item':'Magic Items', 'wondrous items':'Magic Items',
  'collections':'Collection', 'collectible':'Collection', 'collectibles':'Collection',
  'miscellaneous':'Misc', 'other':'Misc', 'materials':'Materials & Crafting', 'crafting':'Materials & Crafting', 'service':'Services & Other', 'services':'Services & Other'
})) aliases.set(alias, category);

function individualValues(raw) {
  if (Array.isArray(raw)) return raw.flatMap(individualValues);
  if (raw === null || raw === undefined) return [];
  return String(raw).split(/[,|;\n]+/).map(value => value.trim()).filter(Boolean);
}

function recognizeCategory(value) {
  return aliases.get(String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')) || '';
}

export function normalizeItemTagLabel(raw) {
  for (const value of individualValues(raw)) {
    const matched = recognizeCategory(value);
    if (matched && matched !== 'Misc') return matched;
  }
  return 'Misc';
}

export function itemCategoryForItem(item = {}) {
  const explicit=recognizeCategory(item.sourceCategory);if(explicit)return explicit;
  // The shop writes the original category to sourceCategory and should take
  // precedence over the legacy tags field, which used to combine categories.
  for (const key of ['sourceCategory', 'category', 'tags', 'tagList', 'type']) {
    const category = normalizeItemTagLabel(item?.[key]);
    if (category !== 'Misc') return category;
  }
  return 'Misc';
}

export function itemCategorySymbol(value) {
  return ITEM_CATEGORY_SYMBOLS[normalizeItemTagLabel(value)] || ITEM_CATEGORY_SYMBOLS.Misc;
}

const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/** Counts distinct inventory records for each category, rather than quantities in a stack. */
export function inventoryCategoryCounts(items=[]){
 const counts=Object.fromEntries(ITEM_TAG_OPTIONS.map(tag=>[tag,0]));
 for(const item of Array.isArray(items)?items:[])counts[itemCategoryForItem(item)]++;
 return counts;
}

/** An empty category or group should not remain selected after its last item is removed. */
export function visibleInventoryCategory(counts={},selected='All'){
 if(selected==='All')return 'All';
 if(Object.hasOwn(SHOP_ITEM_CATEGORY_GROUPS,selected))
  return SHOP_ITEM_CATEGORY_GROUPS[selected].some(tag=>Number(counts[tag]||0)>0)?selected:'All';
 return Number(counts[selected]||0)>0?selected:'All';
}

export function renderCategoryTiles(counts={},selected='All',{attribute='data-item-tag',label='Item categories',groups=false,iconOnly=false}={}){
 const total=Object.values(counts).reduce((sum,value)=>sum+Number(value||0),0);
 if(total===0)return '';
 const categories=[...ITEM_TAG_OPTIONS,...Object.keys(counts).filter(tag=>!ITEM_TAG_OPTIONS.includes(tag)&&tag!=='All')].filter(tag=>Number(counts[tag]||0)>0);
 const visible=visibleInventoryCategory(counts,selected);
 const groupsMarkup=groups?'<nav class="item-group-buttons" aria-label="Item groups">'+Object.entries(SHOP_ITEM_CATEGORY_GROUPS).filter(([,tags])=>tags.some(tag=>Number(counts[tag]||0)>0)).map(([name])=>'<button type="button" '+attribute+'="'+name+'" aria-pressed="'+(visible===name)+'">'+escape(name)+'</button>').join('')+'</nav>':'';
 return groupsMarkup+'<nav class="item-category-tiles'+(iconOnly?' item-category-icon-only':'')+'" aria-label="'+escape(label)+'">'
  +'<button type="button" class="item-category-all" '+attribute+'="All" aria-pressed="'+(visible==='All')+'" aria-label="All inventory items" title="All items"><span aria-hidden="true">▦</span>'+(iconOnly?'':'<strong>All</strong>')+'<small>'+total+'</small></button>'
  +categories.map(tag=>'<button type="button" '+attribute+'="'+escape(tag)+'" aria-pressed="'+(visible===tag)+'" aria-label="'+escape(tag)+'" title="'+escape(tag)+'"><span aria-hidden="true">'+itemCategorySymbol(tag)+'</span>'+(iconOnly?'':'<span>'+escape(tag)+'</span>')+'<small>'+Number(counts[tag]||0)+'</small></button>').join('')
  +'</nav>';
}
