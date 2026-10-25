// Versioned, deliberately bounded FFD20 editor choices. Not a complete mechanics engine.
// Official references: https://www.finalfantasyd20.com/classes/ and /races/.
export const SOURCE_NAME='FFD20';
export const ALIGNMENTS=[
 'Lawful Good','Neutral Good','Chaotic Good',
 'Lawful Neutral','True Neutral','Chaotic Neutral',
 'Lawful Evil','Neutral Evil','Chaotic Evil','Unaligned'
];
export const CLASS_NAMES=[
 'Archer','Bard','Beastmaster','Black Mage','Dragoon','Knight','Monk','Red Mage','Thief','Warrior','White Mage',
 'Astrologian','Berserker','Blue Mage','Chemist','Chocobo Knight','Cleric','Dark Knight','Engineer','Gambler',
 'Geomancer','Gunner','Illusionist','Medic','Necromancer','Paladin','Psychic','Summoner','Time Mage',
 'Black Belt','Dancer','Druid','Fencer','Gunbreaker','Ninja','Samurai','Scholar','Sword Saint'
];
export const RACE_NAMES=[
 'Dwarf','Elvaan','Galka','Half-Breed','Hume','Mithra','Moogle','Tarutaru',
 'Aegyl','Al Bhed','Au Ra','Bangaa','Burmecian','Dracobaltian','Garif','Garlean','Genome','Gria','Guado','Hypello','Immortal','Lambkin','Mandragora','Moomba','Mutant',
 'Nu Mou','Palico','PuPu','Qu','Roegadyn','Ronso','Seeq','Seto Lion','Shindroid','Tonkin','Varg','Viera',
 "Amalj'aa",'Antica','Forgiven','Gnath','Goblin','Ixal','Kindred','Kobold','Kojin','Lamia','Loporrit','Matanga','Namazu','Orc','Qiqirn','Quadav','Sahagin','Sylph','Trollkin','Vanu Vanu','Velkk','Yagudo',
 'Half-Gigas','Lizardman','Syricta'
];
// Class-specific, verified archetype suggestions. Other archetypes are entered by name.
export const ARCHETYPES={
 'Black Mage':['Arcane Bomber','Arcane Trickster','Arcanist','Cryomancer','Dark Mage','Elementalist','Magitech Mage','Magus','Onyx Magister','Pyromancer','Script Master','Signifer','Sorcerer','Thaumaturge','Timekeeper','Void Mage','War Warlock','Wild Mage','Wind Sorcerer','Muscle Mage'],
 'Archer':['Ambusher','Arcane Archer','Battlefield Minstrel','Blackarrow','Bowgunner','Dwarven Crossbowyer','Hawkeye','Heaven Piercer','Hunter','Serpent Archer','Skirmisher','Sniper','Tech Bow Specialist','Yabbleshammy Archer','Zen Archer'],
 'Astrologian':['Globetrotter','Herald of Woe','Lantern-Bearer','Mystic','Oracle','Sage','Star Sibyl','Stargazer','Stellarian'],
 'Blue Mage':['Azure Hunter','Cerulean Lancer','Empty Vessel','Gun Mage'],
 'Time Mage':['Chronodancer','Chronotrigger','Clockwork Mage','Clone Master','Dimensional Hopper','Recreos','Speedster','Temporal Nomad','Temporal Reaper','Vanguard'],
 'Samurai':['Bladecaller','Blind Swordsman','Iaijutsu Master','Kensai','Onimusha'],
 'Ninja':['Chiknife','Darter','Nightblade','Nightshade','Nokizaru','Psyche'],
 'Geomancer':['Elemental Shaper'],
 'Dancer':['Akimbo','Winddancer'],
 'Fencer':['Bushi','Dervish','Duelist','Meowskateer','Musketeer'],
 'Paladin':['Archon','Ark Knight','Belmont','Celestial Knight','Temple Knight','Tranquil Guardian','White Knight'],
 'Chemist':['Bioinjector','Culinarian','Daemir Alchemist','Fire Bomber','Grenadier','Herbalist','Hermetic'],
 'Bard':['Abhorsen','Agent of Inquiry','Cacophonist','Dragon Herald','Dragonkin','Guitarist','Juggler','Marshal','Mediator','Orator','Pied Piper','Prankster','Princess','Rearguard','Rocker','Skald','Songhealer','Songstress','Storyteller','Watersinger'],
 'Dragoon':['Azure Dragoon','Dark Dragoon','Dragon Knight','Dragon Slayer','Drigagoonie','Elemental Dragoon','Farstriker','Holy Dragoon','Lancer','Lunar Vanguard','Spear Warden','Spearmaster','Valkyrie'],
 'Knight':['Aggressor','Azure Knight','Captain','Choco Guardian','Commandant','Commander','Foebreaker','Heavy Knight','Judge Magister','Juggernaut','Knave','Onion Knight','Pluto Knight','Primal Knight','Sentinel','Shell Knight','Shield Guardian','Tactical Guardian','Temporal Knight','Warlord'],
 'Monk':['Diminutive Adept','Elemental Fist Disciple','Featherweight','Fist of Rhalgr','Heavyweight','Ironskin Monk','Ki Master','Life Monk','Master of Many Styles','Meowfist','Monk of the Wild','Nimble Guardian','Peacekeeper','Scaled Fist','Streak','Student of the Stone','Treetop Monk','Wanderer','Weapon Adept','White Monk'],
 'Red Mage':['Animist','Daemonic Flayer','Elemental Knight','Generalist','Ishgardian Heretic','Mystic Knight','Outfitter','Paradigm Shifter','Red Warrior','Reserve Mage','Ruby Archer','Ruby Fist','Ruby Magister','Ruby Wizard','Shield Mage','Spell Dancer','Spellblade','Vermilion Duelist'],
 'Gunner':['Arcane Gunner','Buccaneer','Cowboy','Deadly Sniper','Desperado','Experimental Gunsmith'],
 'Medic':['Benefactor','Biohacker','Charlatan','Field Specialist','Medicine Woman','Plague Doctor','Salve-Maker','Surgeon','Toxifier','Vivisectionist'],
 'Necromancer':['Blood Mage','Bloodsucker','Bonedancer','Dollmaker','Warlock']
};
// Exact trait names from the FFD20 race pages for these verified examples.
// Never fabricate an unverified race's complete trait list; those can be entered manually.
export const RACE_TRAITS={
 Hume:{standard:['Ability Score Racial Traits','Size','Type','Base Speed','Languages','Bonus Feat','Curiosity','Integrated','Skilled','Sociable'],alternate:['Adoptive Parentage','Alchemically Enhanced','Awareness','Background Character','Comprehensive Education','Deep Magic','Distanced','Dual Talent','Emissary','Eye for Talent','Focused Study','Frontier Survivor','Heart of the Fields','Heart of the Mountains','Heart of the Sea','Heart of the Slums']},
 Dwarf:{standard:['Ability Score Racial Traits','Size','Type','Base Speed','Languages','Bond to the Land','Defensive Training','Hardy','Stability','Greed','Stonecunning','Master Tinker','Hatred','Weapon Familiarity','Darkvision'],alternate:['Barrow Scholar','Barrow Warden','Craftsman','Deep Warrior']},
 Elvaan:{standard:['Ability Score Racial Traits','Size','Type','Base Speed','Languages','Fearless','Keen Senses','Martial Background','Noble Upbringing','Gatecrasher','Hatred','Weapon Familiarity','Low-light Vision'],alternate:['Arcane Focus','Darkvision']}
};
export function defaultTraits(race){const item=RACE_TRAITS[race];return item?item.standard.map(name=>({name,enabled:true})):[];}
export function characterClasses(data={}){
 const from=Array.isArray(data.classes)?data.classes:[];
 if(from.length)return from.map(row=>({name:String(row.name||''),level:Number(row.level)||1,archetype:String(row.archetype||'')}));
 const name=String(data.class||data.className||'');
 return [{name,level:Number(data.class_level||data.level||data.character_level)||1,archetype:String(data.archetype||'')}];
}
export function totalClassLevel(classes){return classes.reduce((sum,row)=>sum+(Number.isInteger(+row.level)?Number(row.level):0),0);}