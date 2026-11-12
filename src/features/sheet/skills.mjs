export const legacySkillCount=46;
// Append new FFD20 rows instead of inserting them: existing wizard rank arrays
// store skill positions, so indices for older characters MUST remain stable.
export const fixedSkills=[{"name": "Acrobatics", "stat": "dex"}, {"name": "Appraise", "stat": "int"}, {"name": "Bluff", "stat": "cha"}, {"name": "Climb", "stat": "str"}, {"name": "Craft", "stat": "int"}, {"name": "Craft", "stat": "int"}, {"name": "Craft", "stat": "int"}, {"name": "Diplomacy", "stat": "cha"}, {"name": "Disable Device", "stat": "dex"}, {"name": "Disguise", "stat": "cha"}, {"name": "Drive", "stat": "dex"}, {"name": "Escape Artist", "stat": "dex"}, {"name": "Fly", "stat": "dex"}, {"name": "Handle Animal", "stat": "cha"}, {"name": "Heal", "stat": "wis"}, {"name": "Intimidate", "stat": "cha"}, {"name": "Knw: Arcana", "stat": "int"}, {"name": "Knw: Dungeoneering", "stat": "int"}, {"name": "Knw: Engineering", "stat": "int"}, {"name": "Knw: Geography", "stat": "int"}, {"name": "Knw: History", "stat": "int"}, {"name": "Knw: Local", "stat": "int"}, {"name": "Knw: Nature", "stat": "int"}, {"name": "Knw: Nobility", "stat": "int"}, {"name": "Knw: Planes", "stat": "int"}, {"name": "Knw: Religion", "stat": "int"}, {"name": "Knw: Technology", "stat": "int"}, {"name": "Linguistics", "stat": "int"}, {"name": "Navigate", "stat": "int"}, {"name": "Perception", "stat": "wis"}, {"name": "Perform", "stat": "cha"}, {"name": "Perform", "stat": "cha"}, {"name": "Perform", "stat": "cha"}, {"name": "Pilot", "stat": "dex"}, {"name": "Profession", "stat": "wis"}, {"name": "Profession", "stat": "wis"}, {"name": "Profession", "stat": "wis"}, {"name": "Repair", "stat": "int"}, {"name": "Ride", "stat": "dex"}, {"name": "Sense Motive", "stat": "wis"}, {"name": "Sleight of Hand", "stat": "dex"}, {"name": "Spellcraft", "stat": "int"}, {"name": "Stealth", "stat": "dex"}, {"name": "Survival", "stat": "wis"}, {"name": "Swim", "stat": "str"}, {"name": "Use Magic Device", "stat": "cha"}, {"name":"Computers","stat":"int"}, {"name":"Craft (Alchemy)","stat":"int"}, {"name":"Craft (Ammunition)","stat":"int"}, {"name":"Craft (Armor)","stat":"int"}, {"name":"Craft (Bows)","stat":"int"}, {"name":"Craft (Calligraphy)","stat":"int"}, {"name":"Craft (Electronic)","stat":"int"}, {"name":"Craft (Explosive)","stat":"int"}, {"name":"Craft (Firearms)","stat":"int"}, {"name":"Craft (Mechanical)","stat":"int"}, {"name":"Craft (Structural)","stat":"int"}, {"name":"Craft (Traps)","stat":"int"}, {"name":"Craft (Weapons)","stat":"int"}];
export function sheetSkills(data){
 const rows=Array.isArray(data.skills)?structuredClone(data.skills):[];const counts=new Map();for(const r of rows){const key=r.name+'::'+r.stat;counts.set(key,(counts.get(key)||0)+1);}const used=new Map();
 for(const skill of fixedSkills){const key=skill.name+'::'+skill.stat,occurrence=(used.get(key)||0)+1;used.set(key,occurrence);if((counts.get(key)||0)<occurrence)rows.push({...skill,skillKey:key+'::'+occurrence,lvl:0,temp:0,cs:false,subName:''});}
 return rows;
}

/** Only these Pathfinder skills have named specializations. */
export const skillSupportsSpecialization=name=>['craft','profession','perform'].includes(String(name||'').trim().toLowerCase());

// FFD20 uses Pathfinder 1e skills plus computers, technology and new
// technical Craft specializations. "Trained Only" = at least one *rank*;
// class-skill flags, racial bonuses or miscellaneous modifiers do not train.
// FFD20 permits exceptional Knowledge checks without ranks at DC <= 10,
// which a GM may handle separately from the normal trained-only roll button.
const trainedSkills=new Set([
 'computers','disable device','drive','handle animal','linguistics',
 'pilot','profession','sleight of hand','spellcraft','use magic device'
]);
const trainedCrafts=new Set(['electronic','electronics','explosive','explosives','mechanical','structural']);
export function skillDisplayName(row={}){
 const base=String(row.name||'').trim(),sub=String(row.subName||'').trim();
 return skillSupportsSpecialization(base)&&sub?base+' ('+sub+')':base;
}
export function skillRequiresTraining(row={}){
 const name=skillDisplayName(row).toLowerCase().replace(/\s+/g,' ').trim();
 if(name.startsWith('knw:')||/^knowledge\s*(?:\(|:|$)/.test(name))return true;
 if(trainedSkills.has(name))return true;
 if(name==='profession'||/^profession\s*\(/.test(name))return true;
 const craft=/^craft\s*\(([^)]+)\)$/.exec(name);
 return Boolean(craft&&trainedCrafts.has(craft[1].trim()));
}
export function skillCanRoll(row={}){
 if(!skillRequiresTraining(row))return true;
 const ranks=Number(row.lvl??row.ranks??row.rank??0);
 return Number.isInteger(ranks)&&ranks>=1;
}
