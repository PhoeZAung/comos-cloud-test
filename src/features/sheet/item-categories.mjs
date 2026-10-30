/**
 * Inventory categories from the original Mount Aetheria shop (tools.html).
 * Keep these labels in sync with SHOP_GROUPS in tools-parts/scripts/tools-js-002-firebase-tools-module.mjs.
 * Collection and Misc are retained for items created in older character sheets.
 */
export const SHOP_ITEM_CATEGORY_GROUPS = Object.freeze({
  Tools: Object.freeze(['Gear', 'Food', 'Weapon', 'Ranged Weapon', 'Ammunition', 'Armor', 'Enchantment', 'Machine']),
  Magic: Object.freeze(['Alchemical Items', 'Artifacts', 'Magic Items']),
  Other: Object.freeze(['Collection', 'Misc'])
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
  'Misc': '📦'
});

const aliases = new Map();
for (const category of ITEM_TAG_OPTIONS) {
  aliases.set(category.toLowerCase(), category);
}
for (const [alias, category] of Object.entries({
  'equipment':'Gear', 'adventuring gear':'Gear', 'general gear':'Gear',
  'foods':'Food', 'consumable':'Food', 'consumables':'Food',
  'weapons':'Weapon', 'melee weapon':'Weapon', 'melee weapons':'Weapon',
  'ranged weapons':'Ranged Weapon', 'firearm':'Ranged Weapon', 'firearms':'Ranged Weapon',
  'ammo':'Ammunition', 'arrows':'Ammunition', 'bullets':'Ammunition',
  'armour':'Armor', 'shield':'Armor', 'shields':'Armor',
  'enchantments':'Enchantment', 'weapon enchantment':'Enchantment', 'armor enchantment':'Enchantment',
  'machines':'Machine', 'vehicle':'Machine', 'vehicles':'Machine',
  'alchemical item':'Alchemical Items', 'alchemical':'Alchemical Items', 'alchemy':'Alchemical Items',
  'artifact':'Artifacts', 'magic item':'Magic Items', 'wondrous':'Magic Items',
  'wondrous item':'Magic Items', 'wondrous items':'Magic Items',
  'collections':'Collection', 'collectible':'Collection', 'collectibles':'Collection',
  'miscellaneous':'Misc', 'other':'Misc'
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

export function renderCategoryTiles(counts={},selected='All',{attribute='data-item-tag',label='Item categories',groups=false}={}){
 const total=Object.values(counts).reduce((sum,value)=>sum+Number(value||0),0);
 if(total===0)return '';
 const categories=[...ITEM_TAG_OPTIONS,...Object.keys(counts).filter(tag=>!ITEM_TAG_OPTIONS.includes(tag)&&tag!=='All')].filter(tag=>Number(counts[tag]||0)>0);
 const visible=visibleInventoryCategory(counts,selected);
 const groupsMarkup=groups?'<nav class="item-group-buttons" aria-label="Item groups">'+Object.entries(SHOP_ITEM_CATEGORY_GROUPS).filter(([,tags])=>tags.some(tag=>Number(counts[tag]||0)>0)).map(([name])=>'<button type="button" '+attribute+'="'+name+'" aria-pressed="'+(visible===name)+'">'+name+'</button>').join('')+'</nav>':'';
 return groupsMarkup+'<nav class="item-category-tiles" aria-label="'+escape(label)+'">'
  +'<button type="button" class="item-category-all" '+attribute+'="All" aria-pressed="'+(visible==='All')+'"><span aria-hidden="true">▦</span><strong>All</strong><small>'+total+'</small></button>'
  +categories.map(tag=>'<button type="button" '+attribute+'="'+escape(tag)+'" aria-pressed="'+(visible===tag)+'"><span aria-hidden="true">'+itemCategorySymbol(tag)+'</span><span>'+escape(tag)+'</span><small>'+Number(counts[tag]||0)+'</small></button>').join('')
  +'</nav>';
}
