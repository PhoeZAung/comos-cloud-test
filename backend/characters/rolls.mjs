import {weaponAttackParts,attackTypes} from '../../src/features/sheet/model.mjs';
import {context,damageExpression,diceTerms} from '../../src/features/sheet/calculations.mjs';
import {randomInt} from 'node:crypto';
const relay='https://weathered-term-1e39.phoeaung2076.workers.dev';
export function serverRoll(expression){
 const terms=diceTerms(expression),rolls=[],breakdown=[];let bonus=0,total=0;
 for(const term of terms){if(term.count){const values=Array.from({length:term.count},()=>randomInt(1,term.sides+1)),subtotal=term.sign*values.reduce((a,b)=>a+b,0);rolls.push(...values.map(v=>v*term.sign));total+=subtotal;breakdown.push({type:term.type,dice:term.count+'d'+term.sides,rolls:values,total:subtotal});}else{const n=term.sign*term.flat;bonus+=n;total+=n;breakdown.push({type:term.type,total:n});}}
 return {expression,rolls,bonus,total,breakdown};
}
export function criticalProfile(row){
 const range=String(row.crit_range||'20').trim().replace(/[–—]/g,'-'),match=/^(\d{1,2})(?:\s*-\s*20)?$/.exec(range),minimum=Number(match?.[1]);
 const mult=/^(?:[x×]\s*)?(\d{1,2})$/i.exec(String(row.crit_mult||'x2').trim()),multiplier=Number(mult?.[1]);
 if(!match||minimum<2||minimum>20||!mult||multiplier<2||multiplier>10)throw Error('Set a critical range from 2-20 to 20 and a multiplier from x2 to x10.');
 return {minimum,multiplier};
}
const joinRolls=(parts,expression)=>({expression,rolls:parts.flatMap(p=>p.rolls),bonus:parts.reduce((s,p)=>s+p.bonus,0),total:parts.reduce((s,p)=>s+p.total,0),breakdown:parts.flatMap(p=>p.breakdown||[])});
export function weaponRoll(row,data,roll=serverRoll){
 const p=weaponAttackParts(row,data),profile=criticalProfile(row),expression='1d20'+(p.total>=0?'+':'')+p.total,attack=roll(expression),ctx=context(data,row);
 let damage=null,damageError='',base='',extra='';
 try{base=damageExpression(String(row.damage||row.dmg||''),ctx);diceTerms(base);if(row.extra_damage){extra=damageExpression(row.extra_damage,ctx);diceTerms(extra);}damage=joinRolls([roll(base),...(extra?[roll(extra)]:[])],[base,extra].filter(Boolean).join(' + '));}catch(err){damageError=err.message;}
 const threat=p.type!=='cmb'&&attack.rolls[0]>=profile.minimum&&attack.rolls[0]!==1,critical={...profile,threat};
 if(threat){
  critical.confirmation=roll(expression);
  try{
   if(!damage)throw Error(damageError);
   if(diceTerms(base).filter(t=>t.count).length!==1)throw Error('Separate bonus dice into Extra damage before calculating critical damage.');
   // Roll the base damage afresh for each multiplier; extra dice apply once.
   critical.damage=joinRolls([...Array.from({length:profile.multiplier},()=>roll(base)),...(extra?[roll(extra)]:[])],profile.multiplier+' × ('+base+')'+(extra?' + '+extra:''));
  }catch(err){critical.damageError=err.message;}
 }
 return {...attack,kind:'weapon',weaponName:String(row.name||'Weapon'),attackType:p.type,critical,damage,damageError};
}
function diceLine(r){return r.expression+': ['+r.rolls.join(', ')+'] '+(r.bonus>=0?'+':'−')+' '+Math.abs(r.bonus)+' = '+r.total+(r.breakdown?.some(p=>p.type)?' ('+r.breakdown.filter(p=>p.type).map(p=>p.type+' '+p.total).join(', ')+')':'');}
export async function publishRoll({db,userId,character,change,origin,sendFetch=fetch,makeWeaponRoll=weaponRoll}){
 const weapon=change.kind==='weapon';
 if(!/^[\da-f-]{36}$/i.test(change.requestId)||typeof change.discord!=='boolean'||(change.kind!==undefined&&!weapon))throw Error('Invalid roll.');
 if(weapon){if(!Number.isInteger(change.index)||change.index<0||!Number.isInteger(change.revision)||change.revision<0)throw Error('Invalid weapon roll.');}
 else if(typeof change.label!=='string'||!change.label.trim()||change.label.length>120||/[\u0000-\u001f]/.test(change.label))throw Error('Invalid roll.');
 const expression=weapon?'weapon:'+change.index+':'+change.revision:change.expression;
 const old=db.prepare('SELECT * FROM sheet_rolls WHERE id=?').get(change.requestId);
 if(old){if(old.user_id!==userId||old.character_id!==character.id||old.expression!==expression||(!weapon&&old.label!==change.label))throw Error('Roll identifier already used.');return {roll:JSON.parse(old.result_json),discord:old.delivery};}
 if(weapon&&(change.revision!==character.revision||change.revision!==db.prepare('SELECT revision FROM characters WHERE id=?').get(character.id)?.revision))throw Object.assign(Error('This character changed. Load the latest sheet before rolling.'),{httpStatus:409});
 const row=weapon?character.data?.weapons?.[change.index]:null;if(weapon&&!row)throw Error('Weapon not found.');
 const label=weapon?String(row.name||'Weapon').slice(0,120):change.label;
 const last=db.prepare('SELECT created_at FROM sheet_rolls WHERE user_id=? ORDER BY created_at DESC LIMIT 1').get(userId);if(last&&Date.now()-last.created_at<1500)throw Error('Wait a moment before rolling again.');
 const roll=weapon?makeWeaponRoll(row,character.data):serverRoll(expression),delivery=change.discord?'pending':'off';
 db.prepare('INSERT INTO sheet_rolls VALUES(?,?,?,?,?,?,?,?,?)').run(change.requestId,userId,character.id,expression,label,JSON.stringify(roll),delivery,Date.now(),change.discord?1:0);
 if(!change.discord)return {roll,discord:'off'};
 const safe=s=>String(s).replaceAll('@','＠').replace(/[\r\n]/g,' ').replace(/[*_`~|<>]/g,'').slice(0,120);
 const lines=['🎲 '+safe(character.name)+' — '+safe(label)];
 if(weapon){
  lines.push(attackTypes[roll.attackType]+' attack · '+diceLine(roll)+(roll.rolls[0]===20?' · Natural 20':roll.rolls[0]===1?' · Natural 1':''));
  lines.push(roll.damage?'Damage · '+diceLine(roll.damage):'Damage · '+roll.damageError);
  if(roll.critical.threat){lines.push('Critical threat · confirmation '+diceLine(roll.critical.confirmation));lines.push('Critical damage ×'+roll.critical.multiplier+' (if confirmed) · '+(roll.critical.damage?diceLine(roll.critical.damage):roll.critical.damageError));lines.push('Compare attack and confirmation against target AC.');}
 }else lines.push(diceLine(roll));
 // Escape the entire receipt, including saved damage labels, and stay within Discord's message limit.
 const content=lines.join('\n').replaceAll('@','＠').replace(/[*_`~|<>]/g,'').slice(0,1950);
 let state='failed';try{const response=await sendFetch(relay,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({content,allowed_mentions:{parse:[]}}),signal:AbortSignal.timeout(7000)});state=response.ok?'sent':'failed';}catch{}
 db.prepare('UPDATE sheet_rolls SET delivery=? WHERE id=?').run(state,change.requestId);return {roll,discord:state};
}
