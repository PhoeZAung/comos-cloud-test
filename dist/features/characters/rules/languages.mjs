// FFd20's own language tables. Pathfinder languages are additional, not a subset of these tables.
// Source: https://finalfantasyd20.com/skills/ (Linguistics, 2026-10-31)
export const FFD20_LANGUAGE_SOURCE='https://finalfantasyd20.com/skills/';
export const ffd20LanguageGroups=[
 {name:'Beast tribe languages',entries:[
 ['Amalij\u0027aa','Amalj\u0027aas'],['Antican','Anticas'],['Goblin','Goblins'],['Kojin','Kojins'],['Loporrit','Loporrits'],['Matanga','Matanga'],['Orc','Orcs'],['Qiqirn','Qiqirns'],['Quadav','Quadavs'],['Sahagin','Sahagins'],['Sylvan','Sylphs'],['Vanu','Vanu Vanus'],['Yagudo','Ixals and Yagudos']
 ]},
 {name:'Common FFd20 languages',entries:[
 ['Aegyllan','Aegyls'],['Albhedian','Al Bheds'],['Banganese','Bangaas'],['Burmecian','Burmecians'],['Draconese','Dracobaltians'],['Draconic','Dragons, Auri and Grias'],['Dwarven','Dwarves'],['Elvaan','Elvaans'],['Galkan','Galkas'],['Garif','Garif'],['Guado','Guado'],['Hypello','Hypello'],['Lambkin','Lambkin'],['Lalafellan','Tarutarus'],['Lionese','Seto Lions'],['Lupin','Vargs'],['Mandragoran','Mandragoras'],['Mithran','Mithras'],['Moogle','Moogles'],['Numish','Nu Mous'],['Queran','Qus'],['Pupon','PuPus'],['Roegadyn','Roegadyns'],['Ronsaur','Ronsos'],['Seeq','Seeq'],['Tonberry','Tonkins and Tonberries (telepathic)'],['Vieran','Vieras']
 ]},
 {name:'Elemental languages',entries:[
 ['Aquan','Water and aquatic creatures'],['Auran','Air and flying creatures'],['Auroran','Ice-based creatures'],['Enochian','Divine and holy creatures'],['Ignan','Fire-based creatures'],['Runic','Arcane and non-elemental creatures'],['Terran','Earth and underground creatures'],['Thorian','Lightning-based creatures'],['Umbran','Shadow and unholy creatures']
 ]}
];
export const ffd20LanguageNames=[...new Set(ffd20LanguageGroups.flatMap(group=>group.entries.map(row=>row[0])))].sort((a,b)=>a.localeCompare(b));
