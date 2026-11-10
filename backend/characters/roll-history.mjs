// Reuse saved authoritative receipts. No new roll, resource change or delivery.
export function rollHistory(db,userId,{admin=false}={}){
 const rows=db.prepare("SELECT r.id,r.label,r.result_json,r.created_at,c.name FROM sheet_rolls r JOIN characters c ON c.id=r.character_id WHERE r.user_id=? AND ((c.kind='player' AND c.owner_id=?) OR (c.kind='npc' AND ?=1)) ORDER BY r.created_at DESC,r.id DESC LIMIT 100").all(userId,userId,Number(admin));
 return rows.flatMap(row=>{
  let roll;try{roll=JSON.parse(row.result_json);}catch{return [];}
  if(roll.descriptionOnly)return [];
  const parts=[],add=(label,value)=>{if(value&&Number.isFinite(value.total))parts.push({label,total:value.total,expression:String(value.expression||'').slice(0,250),faces:Array.isArray(value.rolls)?value.rolls.filter(Number.isFinite).slice(0,100):[]});};
  const attack=roll.kind==='weapon'?roll:roll.attack;
  if(attack)add('Attack',attack);
  if(roll.damage)add('Damage',roll.damage);
  if(!attack&&!roll.damage)add('Roll',roll);
  if(roll.critical?.threat){add('Confirm',roll.critical.confirmation);add('Critical damage',roll.critical.damage);}
  return parts.length?[{id:row.id,character:String(row.name).slice(0,120),label:String(row.label).slice(0,120),time:row.created_at,parts}]:[];
 });
}
