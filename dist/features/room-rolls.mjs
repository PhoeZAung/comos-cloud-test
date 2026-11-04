const text=(value,max)=>typeof value==='string'?value.slice(0,max):'';
export function publicReceipt({id,character,label,roll,time=Date.now()}){
 if(!roll||roll.descriptionOnly)return null;
 const parts=[],add=(label,value)=>{if(value&&Number.isFinite(value.total))parts.push({label,total:value.total,expression:text(value.expression,160),faces:Array.isArray(value.rolls)?value.rolls.filter(Number.isFinite).slice(0,50):[]});};
 const attack=roll.kind==='weapon'?roll:roll.attack;if(attack)add('Attack',attack);if(roll.damage)add('Damage',roll.damage);if(!attack&&!roll.damage)add('Roll',roll);if(roll.critical?.threat){add('Confirm',roll.critical.confirmation);add('Critical damage',roll.critical.damage);}
 return parts.length?{id,character:text(character,80),label:text(label||roll.weaponName||roll.spellName||roll.abilityName,100),time,parts}:null;
}
export function normalizePublicReceipt(value){
 if(!value||value.audience!=='everyone'||!/^[-\w]{1,100}$/.test(value.id||'')||!Number.isFinite(value.time)||value.time<0||value.time>8.64e15||typeof value.playerId!=='string'||value.playerId.length>128||!Array.isArray(value.parts)||value.parts.length<1||value.parts.length>4)return null;
 const parts=[];for(const part of value.parts){if(!part||!Number.isFinite(part.total)||Math.abs(part.total)>1e12||!Array.isArray(part.faces)||part.faces.length>50||part.faces.some(face=>!Number.isFinite(face)||Math.abs(face)>1e9))return null;parts.push({label:text(part.label,30),total:part.total,expression:text(part.expression,160),faces:[...part.faces]});}
 return {id:value.id,character:text(value.character,80),label:text(value.label,100),time:value.time,parts,playerId:value.playerId,player:text(value.player,80),audience:'everyone'};
}
export function mergeRollHistory(personal=[],shared=[]){const rows=new Map();for(const row of shared)rows.set(row.id,row);for(const row of personal)rows.set(row.id,{...rows.get(row.id),...row});return [...rows.values()].sort((a,b)=>b.time-a.time||b.id.localeCompare(a.id)).slice(0,100);}
export function receiptChunks(rows,maxBytes=10000){const chunks=[];let chunk=[];const bytes=value=>new TextEncoder().encode(JSON.stringify(value)).length;for(const row of rows){if(bytes([row])>maxBytes)continue;if(chunk.length&&bytes([...chunk,row])>maxBytes){chunks.push(chunk);chunk=[];}chunk.push(row);}if(chunk.length)chunks.push(chunk);return chunks;}
