import {mergeSheetData} from './sheet-fields.mjs';
import {weaponAttackParts,attackTypes} from '../../src/features/sheet/model.mjs';
import {entryCalculations,context,damageExpression,diceTerms} from '../../src/features/sheet/calculations.mjs';
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
export function criticalResult(row,attack,damage,expression,roll=serverRoll){
 const profile=criticalProfile(row),threat=!!attack&&attack.rolls[0]>=profile.minimum&&attack.rolls[0]!==1;
 const result={...profile,threat};if(threat){result.confirmation=roll(expression);if(damage)result.damage={...damage,expression:profile.multiplier+' × ('+damage.expression+')',rolls:[],bonus:0,total:damage.total*profile.multiplier,breakdown:[]};}
 return result;
}
export function weaponRoll(row,data,roll=serverRoll){
 const p=weaponAttackParts(row,data),expression='1d20'+(p.total>=0?'+':'')+p.total,attack=roll(expression),ctx=context(data,row);let damage=null,damageError='';
 if(row.damage||row.dmg){try{const formula=damageExpression(String(row.damage||row.dmg),ctx);diceTerms(formula);damage=roll(formula);}catch(error){damageError=error.message;}}
 const critical=p.type==='cmb'?{...criticalProfile(row),threat:false}:criticalResult(row,attack,damage,expression,roll);
 if(critical.threat&&!damage)critical.damageError=damageError;
 return {...attack,kind:'weapon',weaponName:String(row.name||'Weapon'),attackType:p.type,critical,damage,damageError};
}
export function spellRoll(row,data,roll=serverRoll){
 const c=entryCalculations(row,data,'spells');if(c.mp===null)throw Error('Set the spell level before casting.');
 const attack=c.attack?roll('1d20'+(c.attack.bonus>=0?'+':'')+c.attack.bonus):null;let damage=null,damageError='';
 if(row.damage||row.dmg){try{damage=roll(damageExpression(String(row.damage||row.dmg),c.ctx));}catch(error){damageError=error.message;}}
 const critical=c.attack?.mode==='cmb'?{threat:false}:criticalResult(row,attack,damage,attack?.expression,roll);
 return {critical,kind:'spell',spellName:String(row.name||'Spell'),mpAmount:c.mp,dc:c.dc,range:c.range,description:String(row.desc||''),attack,damage,damageError,expression:'cast',rolls:attack?.rolls||damage?.rolls||[],bonus:attack?.bonus||0,total:attack?.total??damage?.total??0};
}
export function abilityRoll(row,data,key,roll=serverRoll){
 const c=entryCalculations(row,data,key),attack=c.attack?roll('1d20'+(c.attack.bonus>=0?'+':'')+c.attack.bonus):null;
 // Invalid formulas fail before any use is spent or a receipt is committed.
 const damage=row.damage||row.dmg?roll(damageExpression(String(row.damage||row.dmg),c.ctx)):null;
 const critical=c.attack?.mode==='cmb'?{threat:false}:criticalResult(row,attack,damage,attack?.expression,roll);
 return {critical,kind:'ability',abilityName:String(row.name||'Ability'),dc:c.dc,attack,damage,description:String(row.desc||''),expression:'ability',rolls:attack?.rolls||damage?.rolls||[],bonus:attack?.bonus||0,total:attack?.total??damage?.total??0};
}
function diceLine(r){return r.total+' ('+r.expression+(r.rolls?.length?' · '+r.rolls.join(', '):'')+')';}
export function entryReceipt(r){const attack=r.kind==='weapon'?r:r.attack;const lines=[];if(attack)lines.push('Attack Roll: '+diceLine(attack));if(r.damage)lines.push('Dice Roll: '+diceLine(r.damage));if(r.critical?.threat){lines.push('Crit!');lines.push('Attack Roll: '+diceLine(r.critical.confirmation));if(r.critical.damage)lines.push('Dice Roll: '+diceLine(r.critical.damage));}return lines;}
export async function publishRoll({db,userId,character,change,origin,sendFetch=fetch,makeWeaponRoll=weaponRoll,makeSpellRoll=spellRoll,makeAbilityRoll=abilityRoll}){
 const weapon=change.kind==='weapon',spell=change.kind==='spell',ability=change.kind==='ability',entry=weapon||spell||ability;
 if(!/^[\da-f-]{36}$/i.test(change.requestId)||typeof change.discord!=='boolean'||(change.kind!==undefined&&!entry))throw Error('Invalid roll.');
 if(entry){if(!Number.isInteger(change.index)||change.index<0||!Number.isInteger(change.revision)||change.revision<0)throw Error('Invalid entry roll.');}
 else if(typeof change.label!=='string'||!change.label.trim()||change.label.length>120||/[\u0000-\u001f]/.test(change.label))throw Error('Invalid roll.');
 if(ability&&(!['activeAbilities','passiveAbilities','racialAbilities','feats'].includes(change.collection)||typeof change.spendUse!=='boolean'))throw Error('Invalid ability roll.');
 const mode=change.mode||'legacy';if(!['legacy','send','use'].includes(mode)||(!entry&&change.mode!==undefined))throw Error('Invalid entry action.');
 const expression=(entry?change.kind+':'+(ability?change.collection+':'+(change.spendUse?'use':'roll')+':':'')+change.index+':'+change.revision:change.expression)+(entry&&mode!=='legacy'?':'+mode+':'+change.discord:'');
 const old=db.prepare('SELECT * FROM sheet_rolls WHERE id=?').get(change.requestId);
 if(old){if(old.user_id!==userId||old.character_id!==character.id||old.expression!==expression||(!entry&&old.label!==change.label))throw Error('Roll identifier already used.');return {roll:JSON.parse(old.result_json),discord:old.delivery};}
 if(entry&&(change.revision!==character.revision||change.revision!==db.prepare('SELECT revision FROM characters WHERE id=?').get(character.id)?.revision))throw Object.assign(Error('This character changed. Load the latest sheet before rolling.'),{httpStatus:409});
 const row=entry?character.data?.[weapon?'weapons':spell?'spells':change.collection]?.[change.index]:null;if(entry&&!row)throw Error('Entry not found.');
 const label=entry?String(row.name||'Weapon').slice(0,120):change.label;
 const last=db.prepare('SELECT created_at FROM sheet_rolls WHERE user_id=? ORDER BY created_at DESC LIMIT 1').get(userId);if(last&&Date.now()-last.created_at<1500)throw Error('Wait a moment before rolling again.');
 let updated=null;
 const descriptionOnly=entry&&(mode==='send'||mode==='use'&&!String(row.damage||row.dmg||'').trim());
 const roll=descriptionOnly?{kind:change.kind,description:String(row.desc||''),descriptionOnly:true,expression:'description',rolls:[],bonus:0,total:0,...(weapon?{weaponName:label}:spell?{spellName:label}:{abilityName:label})}:weapon?makeWeaponRoll(row,character.data):spell?makeSpellRoll(row,character.data):ability?makeAbilityRoll(row,character.data,change.collection):serverRoll(expression),delivery=change.discord?'pending':'off';
 if(mode==='use'&&roll.damageError)throw Error(roll.damageError);
 if(spell&&mode==='use'){
  const calculation=entryCalculations(row,character.data,'spells'),level=calculation.mp;if(calculation.level===null)throw Error('Set the spell level before using it.');
  roll.mpAmount=level;roll.mpSpent=level;roll.used=true;
  if(level>0)updated=mergeSheetData(character.data,{action:'spendMp',amount:level});
 }
 const spendAbility=ability&&(mode==='use'||mode==='legacy'&&change.spendUse);
 if(spendAbility&&(String(row.uses_formula||'').trim()||Number(row.u_max)>0)){updated=mergeSheetData(character.data,{action:'useAbility',collection:change.collection,index:change.index});roll.used=true;roll.remainingUses=updated[change.collection][change.index].u_curr;}
 if(updated)roll.characterRevision=character.revision+1;
 db.exec('BEGIN IMMEDIATE');try{
  if(entry&&db.prepare('SELECT revision FROM characters WHERE id=?').get(character.id)?.revision!==change.revision)throw Object.assign(Error('This character changed. Load the latest sheet.'),{httpStatus:409});
  if(updated){db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?) ON CONFLICT(character_id) DO UPDATE SET data_json=excluded.data_json').run(character.id,JSON.stringify(updated));db.prepare('UPDATE characters SET revision=revision+1,updated_at=? WHERE id=?').run(new Date().toISOString(),character.id);}
  db.prepare('INSERT INTO sheet_rolls VALUES(?,?,?,?,?,?,?,?,?)').run(change.requestId,userId,character.id,expression,label,JSON.stringify(roll),delivery,Date.now(),change.discord?1:0);db.exec('COMMIT');
 }catch(error){db.exec('ROLLBACK');throw error;}
 if(!change.discord)return {roll,discord:'off'};
 const safe=s=>String(s).replaceAll('@','＠');
 const lines=['🎲 '+safe(character.name)+' — '+safe(label)];
 if(descriptionOnly){
  if(roll.mpSpent!==undefined)lines.push(roll.mpSpent+' MP');
  if(roll.remainingUses!==undefined)lines.push(roll.remainingUses+' usage remaining');
  lines.push(safe(row.desc||'No description.'));
  for(const [key,title]of Object.entries({type:'Type',lvl:'Level',range:'Range',duration:'Duration',target:'Target',saving_throw:'Save',spell_resist:'Spell resistance',damage:'Dice Roll',at_higher_lvls:'At higher levels'}))if(row[key]!==undefined&&row[key]!=='')lines.push(title+': '+safe(row[key]));
 }else if(entry){lines.push(...entryReceipt(roll));if(roll.mpSpent!==undefined)lines.push(roll.mpSpent+' MP');if(roll.remainingUses!==undefined)lines.push(roll.remainingUses+' usage remaining');}
 else lines.push(diceLine(roll));
 // Send complete stored descriptions in bounded Discord messages. Receipt replay never resends or spends twice.
 const content=lines.join('\n').replaceAll('@','＠'),chunks=[];for(let start=0;start<content.length;){let end=Math.min(start+1900,content.length);if(end<content.length&&/[\uD800-\uDBFF]/.test(content[end-1]))end--;chunks.push(content.slice(start,end));start=end;}
 let state='sent';for(const chunk of chunks){try{const response=await sendFetch(relay,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({content:chunk,allowed_mentions:{parse:[]}}),signal:AbortSignal.timeout(7000)});if(!response.ok){state='failed';break;}}catch{state='failed';break;}}
 db.prepare('UPDATE sheet_rolls SET delivery=? WHERE id=?').run(state,change.requestId);return {roll,discord:state};
}
