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
