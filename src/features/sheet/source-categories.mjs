/** Category labels found in the user's 96 archived PF1e AoN pages.
 * Original pages, columns and query-string values remain in sourceCatalog.
 * This list is a convenience for editing, NOT a claim of complete AoN coverage.
 */
export const AON_PF1E_CATEGORIES=Object.freeze({
 'Armor': ['Extra','Heavy','Light','Medium','Mod','Shield'],
 'Weapons': ['Ammo','Exotic','Firearm','Martial','Mod','Siege','Simple','Special'],
 'Miscellaneous Equipment': ['', 'AdventuringGear','AlchemicalRemedies','AlchemicalTools','AlchemicalWeapons','AnimalGear','BlackMarket','ChannelFoci','Clothing','Concoction','Dragoncraft','DungeonGuides','Entertainment','FoodDrink','Herbs','Kit','LodgingServices','MountsPets','PFChronicle','Tincture','Tools','Torture','TransportAir','TransportLand','TransportSea'],
 'Magic Armor': ['ArmorQuality','ShieldQuality','SpecificArmor','SpecificShield'],
 'Magic Weapons': ['MeleeWeaponQuality','RangedWeaponQuality','SpecificWeapon'],
 'Magic Rods': ['Metamagic','Other'],
 'Magic Artifacts': ['Minor','Major','Metagame','Transcendent'],
 'Wondrous Items': ['Chest','Eyes','Feet','Belts','Body','Hands','Head','Headband','Neck','Shoulders','Wrist','Other','Ioun'],
 'Other AoN sections': ['Alchemical Reagents','Fungal Grafts','Special Materials','Spellbooks','Vehicles','Magic Altars','Magic Artifacts','Construct Mods','Cursed Items','Demonic Implants','Devil Talismans','Elemental Augmentations','Magic Favors','Fleshcrafting','Genie Seals','Infused Poisons','Intelligent Items','Juju Fetishes','Magic Item Index','Magic Sets','Necrografts','Necrotoxins','Magic Plants','Potions/Oils','Relics','Magic Rings','Scaling Items','Shadow Piercings','Magic Staves','Magic Tattoos','Thassilonian Runes','Magic Thrones','Wondrous Items']
});
export const FFD20_SOURCE_CATEGORIES=Object.freeze([
 'Alchemical Items / Consumables','Adventuring Gear','Arrows','Chocobo Food','Chocobo Mounts',
 'Cybertech','Firearms','Gun Arms','Magitek Upgrades','Masterwork Tools','Materia',
 'Royal Arms','Wondrous Items','Rings','Technological Gear','Vehicles','Airships',
 'Weapons','Melee Weapons','Religious Items / Toys','Magical Weapons','Magical Armor',
 'Special Materials','Artifacts','Goods & Services'
]);
export function sourceCategorySuggestions(source){
 if(source==='pathfinder-1e')return Object.entries(AON_PF1E_CATEGORIES)
   .flatMap(([section,types])=>types.map(type=>type?section+' — '+type:section));
 if(source==='ffd20')return [...FFD20_SOURCE_CATEGORIES];
 return [];
}
