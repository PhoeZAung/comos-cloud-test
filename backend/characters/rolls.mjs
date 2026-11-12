import {abilityGroup} from '../../src/features/sheet/ability-groups.mjs';
import {abilityKinds} from '../../src/features/sheet/pathfinder-defenses.mjs';
import {effectType} from '../../src/features/sheet/effect-types.mjs';
import {externalRollSource} from './external-rolls.mjs';
import {gunbreakerAmmoAbilityCost} from '../../src/features/characters/rules/gunbreaker-ammo.mjs';
import {isLimitBreak,limitBreakState} from '../../src/features/sheet/limit-breaks.mjs';
import {mergeSheetData} from './sheet-fields.mjs';
import {weaponAttackParts,attackTypes} from '../../src/features/sheet/model.mjs';
import {entryCalculations,damageExpression,diceTerms,damageTypeLine,criticalProfile,weaponDamageFormulas} from '../../src/features/sheet/calculations.mjs';
import {randomInt} from 'node:crypto';
const relay='https://weathered-term-1e39.phoeaung2076.workers.dev';
export function serverRoll(expression){
 const terms=diceTerms(expression),rolls=[],breakdown=[];let bonus=0,total=0;
 for(const term of terms){if(term.count){const values=Array.from({length:term.count},()=>randomInt(1,term.sides+1)),subtotal=term.sign*values.reduce((a,b)=>a+b,0);rolls.push(...values.map(v=>v*term.sign));total+=subtotal;breakdown.push({type:term.type,dice:term.count+'d'+term.sides,rolls:values,total:subtotal});}else{const n=term.sign*term.flat;bonus+=n;total+=n;breakdown.push({type:term.type,total:n});}}
 return {expression,rolls,bonus,total,breakdown};
}
export {criticalProfile};
export function criticalResult(row,attack,damage,expression,roll=serverRoll){
 const profile=criticalProfile(row),threat=!!attack&&attack.rolls[0]>=profile.minimum&&attack.rolls[0]!==1;
 const result={...profile,threat};if(threat){result.confirmation=roll(expression);if(damage)result.damage={...damage,expression:profile.multiplier+' × ('+damage.expression+')',rolls:[],bonus:0,total:damage.total*profile.multiplier,breakdown:(damage.breakdown||[]).map(part=>({...part,total:part.total*profile.multiplier}))};}
 return result;
}
export function weaponRoll(row,data,roll=serverRoll,options){
 const p=weaponAttackParts(row,data,options),profile=criticalProfile(row);
 const expression='1d20'+(p.total>=0?'+':'')+p.total,attack=roll(expression);
 const threat=p.type!=='cmb'&&attack.rolls[0]!==1&&attack.rolls[0]>=profile.minimum;
 const critical={...profile,threat};
 let formulas,damage=null,damageError='';
 try{formulas=weaponDamageFormulas(row,data,threat?profile.multiplier:0);}catch(error){damageError=error.message;}
 if(formulas?.normal)damage=roll(formulas.normal);
 if(threat){
  critical.confirmation=roll(expression);
  if(formulas?.critical)critical.damage=roll(formulas.critical);
  if(damageError||formulas?.criticalError)critical.damageError=damageError||formulas.criticalError;
 }
 return {...attack,kind:'weapon',weaponName:String(row.name||'Weapon'),attackType:p.type,critical,damage,damageError};
}
export function spellRoll(row,data,roll=serverRoll,{descriptionOnly=false}={}){
 const c=entryCalculations(row,data,'spells');
 if(c.mp===null)throw Error('Set the spell level before casting.');
 const chance=c.spellFailure,failureRoll=chance>0?roll('1d100'):null;
 const spellFailure=failureRoll?{chance,roll:failureRoll.total,failed:failureRoll.total<=chance}:null;
 const base={kind:'spell',spellName:String(row.name||'Spell'),mpAmount:c.mp,dc:c.dc,range:c.range,description:String(row.desc||''),expression:'cast',...(spellFailure?{spellFailure}:{})};
 if(descriptionOnly||spellFailure?.failed)return {...base,descriptionOnly:descriptionOnly&&!spellFailure?.failed,rolls:[],bonus:0,total:0};
 const attack=c.attack?roll('1d20'+(c.attack.bonus>=0?'+':'')+c.attack.bonus):null;
 let damage=null,damageError='';
 if(row.damage||row.dmg){try{damage=roll(damageExpression(String(row.damage||row.dmg),c.ctx));}catch(error){damageError=error.message;}}
 const critical=c.attack?.mode==='cmb'?{threat:false}:criticalResult(row,attack,damage,attack?.expression,roll);
 return {...base,critical,attack,damage,damageError,rolls:attack?.rolls||damage?.rolls||[],bonus:attack?.bonus||0,total:attack?.total??damage?.total??0};
}
export function abilityRoll(row,data,key,roll=serverRoll){
 const c=entryCalculations(row,data,key),attack=c.attack?roll('1d20'+(c.attack.bonus>=0?'+':'')+c.attack.bonus):null;
 // Invalid formulas fail before any use is spent or a receipt is committed.
 const damage=row.damage||row.dmg?roll(damageExpression(String(row.damage||row.dmg),c.ctx)):null;
 const critical=c.attack?.mode==='cmb'?{threat:false}:criticalResult(row,attack,damage,attack?.expression,roll);
 return {critical,kind:'ability',abilityName:String(row.name||'Ability'),dc:c.dc,attack,damage,description:String(row.desc||''),expression:'ability',rolls:attack?.rolls||damage?.rolls||[],bonus:attack?.bonus||0,total:attack?.total??damage?.total??0};
}
function diceLine(r,{typed=false}={}){
 const rolls=Array.isArray(r.rolls)?r.rolls.filter(Number.isFinite):[];
 const bonus=Number(r.bonus)||0,parts=[...rolls,...(bonus?[bonus]:[])];
 const calculation=parts.length<2&&parts[0]===r.total?String(r.total):parts.length?parts.map((n,i)=>i===0?String(n):n<0?' - '+Math.abs(n):' + '+n).join('')+' = '+r.total:String(r.total);
 const elements=typed?damageTypeLine(r):'';
 return calculation+(elements?' — '+elements:'');
}
export function entryReceipt(r){const attack=r.kind==='weapon'?r:r.attack;const lines=[];if(attack)lines.push('Attack Roll: '+diceLine(attack));if(r.damage)lines.push((r.effectType==='heal'?'Healing':r.effectType==='temp_hp'?'Temporary HP':'Dice Roll')+': '+diceLine(r.damage,{typed:true}));if(r.critical?.threat){lines.push('Critical threat');lines.push('Confirmation: '+diceLine(r.critical.confirmation));if(r.critical.damage)lines.push('Damage if confirmed: '+diceLine(r.critical.damage,{typed:true}));}return lines;}
export async function publishRoll({db,userId,character,change,origin,sendFetch=fetch,makeWeaponRoll=weaponRoll,makeSpellRoll=spellRoll,makeAbilityRoll=abilityRoll}){
 const weapon=change.kind==='weapon',spell=change.kind==='spell',ability=change.kind==='ability',entry=weapon||spell||ability;
 if(!/^[\da-f-]{36}$/i.test(change.requestId)||typeof change.discord!=='boolean'||(change.discordStats!==undefined&&typeof change.discordStats!=='boolean')||(change.kind!==undefined&&!entry))throw Error('Invalid roll.');
 if(entry){if(!Number.isInteger(change.index)||change.index<0||!Number.isInteger(change.revision)||change.revision<0)throw Error('Invalid entry roll.');}
 else if(typeof change.label!=='string'||!change.label.trim()||change.label.length>120||/[\u0000-\u001f]/.test(change.label))throw Error('Invalid roll.');
 if(ability&&(!['activeAbilities','passiveAbilities','racialAbilities','feats'].includes(change.collection)||typeof change.spendUse!=='boolean'))throw Error('Invalid ability roll.');
 const mode=change.mode||'legacy';if(!['legacy','send','use'].includes(mode)||(!entry&&change.mode!==undefined))throw Error('Invalid entry action.');
 const expression=(entry?change.kind+':'+(ability?change.collection+':'+(change.spendUse?'use':'roll')+':':'')+change.index+':'+change.revision:change.expression)+(entry&&mode!=='legacy'?':'+mode+':'+change.discord:'');
  const receiptKey=expression+(change.discordStats===false?':hide-stats':'');
 const old=db.prepare('SELECT * FROM sheet_rolls WHERE id=?').get(change.requestId);
 if(old){if(old.user_id!==userId||old.character_id!==character.id||old.expression!==receiptKey||(!entry&&old.label!==change.label))throw Error('Roll identifier already used.');return {roll:JSON.parse(old.result_json),discord:old.delivery};}
 if(entry&&(change.revision!==character.revision||change.revision!==db.prepare('SELECT revision FROM characters WHERE id=?').get(character.id)?.revision))throw Object.assign(Error('This character changed. Load the latest sheet before rolling.'),{httpStatus:409});
 const row=entry?character.data?.[weapon?'weapons':spell?'spells':change.collection]?.[change.index]:null;if(entry&&!row)throw Error('Entry not found.');
 const label=entry?String(row.name||'Weapon').slice(0,120):change.label;
 const last=db.prepare('SELECT created_at FROM sheet_rolls WHERE user_id=? ORDER BY created_at DESC LIMIT 1').get(userId);if(last&&Date.now()-last.created_at<1500)throw Error('Wait a moment before rolling again.');
 if(ability&&mode!=='send'&&isLimitBreak(row)){const gate=limitBreakState(character.data);if(!gate.allowed)throw Error(gate.reason);}
 const weaponUsage=weapon&&mode==='use'?entryCalculations(row,character.data,'weapons'):null;
  if(weaponUsage&&(row.uses_formula||weaponUsage.maxUses>0)&&(!Number.isInteger(weaponUsage.currentUses)||weaponUsage.currentUses<1))throw Error('No weapon uses remaining.');
  const external=change.owlbearRolls===undefined?null:externalRollSource(change.owlbearRolls);
 const diceRoll=external?expression=>external.roll(expression):serverRoll;
 const npc=character.kind==='npc';
 const weaponDice=external?(row,data)=>weaponRoll(row,data,diceRoll,{npc}):npc?(row,data)=>makeWeaponRoll(row,data,diceRoll,{npc}):makeWeaponRoll;
 const spellDice=external?(row,data,_,options)=>spellRoll(row,data,diceRoll,options):makeSpellRoll;
 const abilityDice=external?(row,data,key)=>abilityRoll(row,data,key,diceRoll):makeAbilityRoll;
 let updated=null;
 const descriptionOnly=entry&&(mode==='send'||mode==='use'&&!weapon&&!String(row.damage||row.dmg||'').trim());
 const delivery=change.discord?'pending':'off';
 let roll;
 if(spell&&mode==='use'){
  roll=spellDice(row,character.data,undefined,{descriptionOnly});
 }else if(descriptionOnly){
  const nameKey=weapon?'weaponName':spell?'spellName':'abilityName';
  roll={kind:change.kind,[nameKey]:label,description:String(row.desc||''),descriptionOnly:true,expression:'description',rolls:[],bonus:0,total:0};
 }else if(weapon)roll=weaponDice(row,character.data);
 else if(spell)roll=spellDice(row,character.data);
 else if(ability)roll=abilityDice(row,character.data,change.collection);
 else roll=diceRoll(expression);
 if(ability||spell)roll.effectType=effectType(row);
 if(entry){
  const calc=weapon?null:entryCalculations(row,character.data,spell?'spells':change.collection);
  const rawCl=calc?.ctx?.CL??character.data?.npcStats?.casterLevel;
  const rawKind=ability?row.ability_kind:'other';
  roll.resolution={
   abilityKind:weapon?'weapon':spell?'spell':Object.hasOwn(abilityKinds,rawKind)?rawKind:'other',
   srApplies:!/^no\b/i.test(String(row.spell_resist||'').trim()),
   casterLevel:Number.isInteger(rawCl)&&rawCl>0?rawCl:null,
   srBonus:Number.isFinite(row.sr_bonus)?row.sr_bonus:0,
   drBypass:String(row.dr_bypass||'').split(/[,;]/).map(x=>x.trim()).filter(Boolean).slice(0,12),
   damageTypes:Array.isArray(row.damage_types)?row.damage_types.slice(0,20):[]
  };
 }
 if(external){external.finish();roll.provider='owlbear-dice-plus';}
 if(mode==='use'&&roll.damageError)throw Error(roll.damageError);
 if(weapon&&mode==='use'&&(row.uses_formula||weaponUsage.maxUses>0)){
   updated=mergeSheetData(character.data,{action:'useWeapon',index:change.index});
   roll.used=true;roll.remainingUses=updated.weapons[change.index].u_curr;
  }
  if(spell&&mode==='use'){
  const calculation=entryCalculations(row,character.data,'spells'),level=calculation.mp;if(calculation.level===null)throw Error('Set the spell level before using it.');
  roll.mpAmount=level;roll.mpSpent=level;roll.used=true;
  if(level>0)updated=mergeSheetData(character.data,{action:'spendMp',amount:level});
 }
 const spendAbility=ability&&(isLimitBreak(row)&&mode!=='send'||mode==='use'||mode==='legacy'&&change.spendUse);
 if(spendAbility&&(abilityGroup(character.data,row,change.collection)||gunbreakerAmmoAbilityCost(character.data,row)>0||isLimitBreak(row)||String(row.uses_formula||'').trim()||Number(row.u_max)>0)){updated=mergeSheetData(character.data,{action:'useAbility',collection:change.collection,index:change.index});roll.used=true;if(!abilityGroup(character.data,row,change.collection)&&gunbreakerAmmoAbilityCost(character.data,row)>0)roll.remainingInfusedAmmo=updated.gunbreakerAmmo.infused;else roll.remainingUses=entryCalculations(updated[change.collection][change.index],updated,change.collection).currentUses;}
 if(updated)roll.characterRevision=character.revision+1;
 db.exec('BEGIN IMMEDIATE');try{
  if(entry&&db.prepare('SELECT revision FROM characters WHERE id=?').get(character.id)?.revision!==change.revision)throw Object.assign(Error('This character changed. Load the latest sheet.'),{httpStatus:409});
  if(updated){db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?) ON CONFLICT(character_id) DO UPDATE SET data_json=excluded.data_json').run(character.id,JSON.stringify(updated));db.prepare('UPDATE characters SET revision=revision+1,updated_at=? WHERE id=?').run(new Date().toISOString(),character.id);}
  db.prepare('INSERT INTO sheet_rolls VALUES(?,?,?,?,?,?,?,?,?)').run(change.requestId,userId,character.id,receiptKey,label,JSON.stringify(roll),delivery,Date.now(),change.discord?1:0);db.exec('COMMIT');
 }catch(error){db.exec('ROLLBACK');throw error;}
 if(!change.discord)return {roll,discord:'off'};
 const safe=s=>String(s).replaceAll('@','＠');
 const stats=change.discordStats!==false,lines=['🎲 '+safe(character.name)+' — '+safe(label)];if(external)lines.push('Dice+ client roll');
 if(roll.spellFailure){const f=roll.spellFailure;lines.push('Armor spell failure: '+f.roll+' vs '+f.chance+'% — '+(f.failed?'failed':'passed'));}
 if(descriptionOnly&&!roll.spellFailure?.failed){
  if(stats&&roll.mpSpent!==undefined)lines.push(roll.mpSpent+' MP');
  if(stats&&roll.remainingInfusedAmmo!==undefined)lines.push(roll.remainingInfusedAmmo+' infused rounds remaining');if(stats&&roll.remainingUses!==undefined)lines.push(roll.remainingUses+' usage remaining');
  lines.push(safe(row.desc||'No description.'));
  for(const [key,title]of Object.entries({effect:'Effect',action_type:'Action type',damage_types:'Damage Type',misfire:'Misfire',type:'Type',lvl:'Level',range:'Range',duration:'Duration',target:'Target',saving_throw:'Save',spell_resist:'Spell resistance',damage:'Dice Roll',at_higher_lvls:'At higher levels'}))if(row[key]!==undefined&&row[key]!==''&&(stats||key!=='damage'))lines.push(title+': '+safe(row[key]));
 }else if(entry){if(stats)lines.push(...entryReceipt(roll));if(stats&&roll.mpSpent!==undefined)lines.push(roll.mpSpent+' MP');if(stats&&roll.remainingInfusedAmmo!==undefined)lines.push(roll.remainingInfusedAmmo+' infused rounds remaining');if(stats&&roll.remainingUses!==undefined)lines.push(roll.remainingUses+' usage remaining');}
 else if(stats)lines.push(diceLine(roll,{typed:true}));
 // Send complete stored descriptions in bounded Discord messages. Receipt replay never resends or spends twice.
 const content=lines.join('\n').replaceAll('@','＠'),chunks=[];for(let start=0;start<content.length;){let end=Math.min(start+1900,content.length);if(end<content.length&&/[\uD800-\uDBFF]/.test(content[end-1]))end--;chunks.push(content.slice(start,end));start=end;}
 let state='sent';for(const chunk of chunks){try{const response=await sendFetch(relay,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({content:chunk,allowed_mentions:{parse:[]}}),signal:AbortSignal.timeout(7000)});if(!response.ok){state='failed';break;}}catch{state='failed';break;}}
 db.prepare('UPDATE sheet_rolls SET delivery=? WHERE id=?').run(state,change.requestId);return {roll,discord:state};
}
