import {abilityUsageGroup} from './ability-groups.mjs';
import {isLimitBreak,limitBreakState} from './limit-breaks.mjs';
import {spellMpAmount} from './spell-mp.mjs';
import {abilities,attackType,number,sheetStats} from './model.mjs';
import {characterClasses,totalClassLevel} from '../characters/ffd20.mjs';
// Bounded arithmetic parser, never JavaScript evaluation. All fractional results floor.
export function arithmetic(source,values={}){
 if(typeof source!=='string'||source.length>180)throw Error('Formula must be 180 characters or fewer.');
 const text=source.replace(/\{([A-Z_]+)\}/gi,(_,key)=>{const value=values[key.toUpperCase()];if(!Number.isFinite(value))throw Error('Set '+key.toUpperCase()+' before using this formula.');return '('+value+')';}).replaceAll('−','-');
 const tokens=text.match(/\d+(?:\.\d+)?|[()+*/-]/g)||[];if(tokens.join('')!==text.replace(/\s/g,'')||tokens.length>100)throw Error('Use numbers, {STR}/{DEX}/{CON}/{INT}/{WIS}/{CHA}, {LEVEL}, {CL}, and + − × / parentheses.');let at=0,depth=0;
 function atom(){if(++depth>20)throw Error('Formula is too complex.');let value;const token=tokens[at++];if(token==='-')value=-atom();else if(token==='+')value=atom();else if(token==='('){value=sum();if(tokens[at++]!==')')throw Error('Close the formula parentheses.');}else if(token!==undefined&&/^\d/.test(token))value=Number(token);else throw Error('Invalid formula.');depth--;return value;}
 function product(){let v=atom();while(['*','/'].includes(tokens[at])){const op=tokens[at++],n=atom();if(op==='/'&&n===0)throw Error('Cannot divide by zero.');v=op==='*'?v*n:v/n;}return v;}
 function sum(){let v=product();while(['+','-'].includes(tokens[at])){const op=tokens[at++],n=product();v=op==='+'?v+n:v-n;}return v;}
 const result=sum();if(at!==tokens.length||!Number.isFinite(result)||Math.abs(result)>1000000)throw Error('Invalid or excessive formula.');return Math.floor(result);
}
export function context(data,row={}){
 const classes=characterClasses(data).filter(c=>c.name),s=sheetStats(data),source=String(row.sourceClass||row.sourceName||'').toLowerCase(),match=classes.find(c=>c.name.toLowerCase()===source);
 const profile=(data.castingProfiles||[]).find(p=>source?p.className?.toLowerCase()===source:classes.length===1&&p.className?.toLowerCase()===classes[0].name.toLowerCase());
 const explicitCl=row.caster_level!==undefined&&row.caster_level!==null&&row.caster_level!==''?Number(row.caster_level):null;
 const npcCl=Number.isFinite(data?.npcStats?.casterLevel)?data.npcStats.casterLevel:null;
 const cl=profile?number(profile.casterLevel):Number.isFinite(explicitCl)&&explicitCl>0?explicitCl:
  Number.isFinite(npcCl)&&npcCl>0?npcCl:match?number(match.level):classes.length===1?number(classes[0].level):undefined;
 return {...Object.fromEntries(abilities.map(k=>[k.toUpperCase(),data[k]===undefined||data[k]===null||data[k]===''?undefined:s.mods[k]])),LEVEL:totalClassLevel(classes)||number(data.character_level||data.level)||1,CL:cl};
}
export function spellLevel(value){if(value===0||/^(?:0|cantrip)$/i.test(String(value).trim()))return 0;const m=/^(\d)(?:st|nd|rd|th)?$/i.exec(String(value).trim());return m?Number(m[1]):null;}
export function armorSpellFailure(data,row,armor=sheetStats(data).encumbrance.armor){
 if(row.spell_failure!==undefined&&row.spell_failure!==null&&row.spell_failure!=='')return Math.min(100,Math.max(0,number(row.spell_failure)));
 const classes=characterClasses(data),source=String(row.sourceClass||row.sourceName||'').toLowerCase();
 const caster=source?classes.find(c=>c.name.toLowerCase()===source):classes.length===1?classes[0]:null;
 const className=!caster?.archetype?caster?.name.toLowerCase():'';
 const chance=armor.spellFailure.reduce((total,part)=>{
  if(className==='bard'&&!part.shield&&part.category==='light')return total;
  if(className==='red mage'){
   const exempt=part.shield?part.category==='light'||part.category==='heavy'&&caster.level>=10:part.category==='light'||part.category==='medium'&&caster.level>=7;
   if(exempt)return total;
  }
  return total+part.chance;
 },0);
 return Math.min(100,chance);
}
export function entryCalculations(row,data,key){
 const s=sheetStats(data),ctx=context(data,row),spell=key==='spells',level=spellLevel(row.lvl),profile=(data.castingProfiles||[]).find(p=>p.className?.toLowerCase()===String(row.sourceClass||row.sourceName||'').toLowerCase()),stat=abilities.includes(row.casting_ability)?row.casting_ability:abilities.includes(profile?.ability)?profile.ability:abilities.includes(data.spell_dc_base)?data.spell_dc_base:'int';
 const raw=String(row.attack_type||'').toLowerCase().trim().replace(/[ -]+/g,'_');const modes={melee:s.melee,ranged:s.ranged,touch:s.touchAttack,ranged_touch:s.rangedTouch,cmb:s.cmb};
 const explicitAttack=row.attack_bonus_override!==undefined&&row.attack_bonus_override!==null&&row.attack_bonus_override!==''?Number(row.attack_bonus_override):null;
 const attack=Object.hasOwn(modes,raw)?{mode:raw,bonus:Number.isFinite(explicitAttack)?explicitAttack:modes[raw]+number(row.attack_misc),manual:Number.isFinite(explicitAttack)}:null;
 const explicitDc=row.save_dc_override!==undefined&&row.save_dc_override!==null&&row.save_dc_override!==''?Number(row.save_dc_override):null;
 const formulaDc=row.dc_formula?arithmetic(row.dc_formula,ctx):null;
 const calculatedDc=spell&&level!==null&&ctx[stat.toUpperCase()]!==undefined?10+level+s.mods[stat]+number(row.dc_misc):null;
 const npcDc=Number.isFinite(data?.npcStats?.spellDC)?data.npcStats.spellDC:null;
 const dc=Number.isFinite(explicitDc)?explicitDc:formulaDc??calculatedDc??npcDc;
 const dcSource=Number.isFinite(explicitDc)?'Manual override':formulaDc!==null?'Custom formula':calculatedDc!==null?'Spell level + casting ability':npcDc!==null?'NPC default DC':'Not set';
 const mp=spell&&level!==null?spellMpAmount(row,level):null;
 let range=String(row.range||'');if(ctx.CL!==undefined){if(/^close\b/i.test(range))range=(25+5*Math.floor(ctx.CL/2))+' ft';else if(/^medium\b/i.test(range))range=(100+10*ctx.CL)+' ft';else if(/^long\b/i.test(range))range=(400+40*ctx.CL)+' ft';}
 const group=abilityUsageGroup(data,row,key);
 const usage=group||row;
 const maxUses=group?group.u_max:row.uses_formula?Math.max(0,number(row.uses_min),arithmetic(row.uses_formula,ctx)):Math.max(0,number(row.u_max));
 const limit=isLimitBreak(row)?limitBreakState(data):null;
 return {ctx,level,stat,dc,dcSource,mp,spellFailure:spell?armorSpellFailure(data,row,s.encumbrance.armor):null,attack,range,maxUses:limit?.max??maxUses,currentUses:limit?.current??(usage.u_curr===undefined?maxUses:Math.min(maxUses,Math.max(0,number(usage.u_curr)))),limit,dispel:ctx.CL??null,dispelDC:ctx.CL===undefined?null:11+ctx.CL,concentration:ctx.CL===undefined||ctx[stat.toUpperCase()]===undefined?null:ctx.CL+s.mods[stat]};
}
// Explicit formulas only: e.g. {CL}d6 + {INT}, or ({CL}/2)d6 + 1d4 fire.
export function damageExpression(source,values={}){
 if(typeof source!=='string'||source.length>300)throw Error('Damage formula is too long.');
 let out=source.replace(/\(([^()]+)\)(?=d\d)/gi,(_,f)=>String(arithmetic(f,values))).replace(/\{([A-Z_]+)\}/gi,(_,key)=>{const n=values[key.toUpperCase()];if(!Number.isFinite(n))throw Error('Set '+key.toUpperCase()+' for this damage formula.');return String(n);});
 out=out.replace(/\+\s*-/g,'-').replace(/-\s*-/g,'+').replace(/([a-z])\s+(?=\d*d\d+\b)/gi,'$1 + ');if(!/^[\d\sd+\-.a-z/]+$/i.test(out))throw Error('Use a dice expression with supported numeric variables.');return out;
}
export function diceTerms(source,{requireDice=true}={}){
 if(typeof source!=='string'||source.length>500)throw Error('Invalid dice expression.');const text=source.replaceAll('−','-').replace(/([a-z])\s+(?=\d*d\d+\b)/gi,'$1 + ').trim(),parts=text.match(/[+-]?[^+-]+/g)||[];if(!parts.length||parts.length>16||parts.join('')!==text)throw Error('Invalid dice expression.');let dice=0;
 const terms=parts.map(part=>{const sign=part.trim().startsWith('-')?-1:1,body=part.trim().replace(/^[+-]\s*/,'');let m=/^(\d*)d(\d+)(?:\s+([a-z][a-z /]*))?$/i.exec(body);if(m){const count=Number(m[1]||1),sides=Number(m[2]);dice+=count;if(count<1||dice>50||sides<2||sides>1000)throw Error('Use at most 50 dice, with 2–1,000 sides.');return {sign,count,sides,type:m[3]||''};}m=/^(\d+)(?:\s+([a-z][a-z /]*))?$/i.exec(body);if(!m||Number(m[1])>1000000)throw Error('Invalid dice term.');return {sign,flat:Number(m[1]),type:m[2]||''};});if(requireDice&&!dice)throw Error('A roll needs at least one die.');return terms;
}

export function criticalProfile(row){
 const range=String(row.crit_range===undefined||row.crit_range===null||row.crit_range===''?'20':row.crit_range).trim().replace(/[–—]/g,'-');
 const minimum=Number(/^(\d{1,2})(?:\s*-\s*20)?$/.exec(range)?.[1]);
 const multiplier=Number(/^(?:[x×]\s*)?(\d{1,2})$/i.exec(String(row.crit_mult||'x2').trim())?.[1]);
 if(!Number.isInteger(minimum)||minimum<1||minimum>20||!Number.isInteger(multiplier)||multiplier<2||multiplier>5)throw Error('Set a critical range from 1-20 to 20 and a multiplier from x2 to x5.');
 return {minimum,multiplier};
}

export const weaponDamageAbilities=['auto','none',...abilities];
export const weaponDamageStyles={
 standard:'Standard',
 thrown:'Thrown or sling',
 two_handed:'Two-handed melee',
 off_hand:'Off-hand melee',
 bow:'Bow (STR penalty only in Automatic mode)'
};

export function weaponDamageFormulas(row,data,multiplier){
 const ctx=context(data,row),strength=ctx.STR;
 if(strength!==undefined){
  ctx.STR_TWO_HANDED=strength>0?Math.floor(strength*1.5):strength;
  ctx.STR_OFF_HAND=strength>0?Math.floor(strength/2):strength;
 }
 const resolve=value=>String(value||'').trim()?damageExpression(String(value),ctx).trim():'';
 const join=(base,extra)=>base&&extra?base+(extra.startsWith('-')?' - '+extra.slice(1).trimStart():' + '+extra.replace(/^\+\s*/,'')):base||extra;
 const melee=attackType(row.attack_type)==='melee';
 const style=Object.hasOwn(weaponDamageStyles,row.damage_style)?row.damage_style:row.two_handed&&melee?'two_handed':'standard';
 const autoStrength=style!=='standard'||melee;
 const ability=row.damage_ability==='auto'?(autoStrength?'str':null):abilities.includes(row.damage_ability)?row.damage_ability:null;
 let abilityBonus=ability?ctx[ability.toUpperCase()]??0:0;
 if(ability==='str'){
  if(style==='two_handed')abilityBonus=ctx.STR_TWO_HANDED??0;
  else if(style==='off_hand')abilityBonus=ctx.STR_OFF_HAND??0;
  else if(style==='bow'&&row.damage_ability==='auto')abilityBonus=Math.min(0,abilityBonus);
 }
 const formula=resolve(row.damage||row.dmg),extra=resolve(row.extra_damage);
 const base=formula&&abilityBonus?join(formula,String(abilityBonus)):formula;
 const normal=join(base,extra);
 if(normal)diceTerms(normal);
 let critical='';
 if(multiplier&&base){
  // The base part can be flat when the extra portion supplies the normal hit's dice.
  const terms=diceTerms(base,{requireDice:false});
  critical=terms.map((term,index)=>{
   const sign=term.sign<0?'- ':index?'+ ':'';
   return sign+(term.count?term.count*multiplier+'d'+term.sides:term.flat*multiplier)+(term.type?' '+term.type:'');
  }).join(' ');
 }
 const criticalFormula=multiplier?join(critical,extra):'';
 if(criticalFormula){try{diceTerms(criticalFormula);}catch(error){return {normal,critical:'',criticalError:error.message,ability,abilityBonus};}}
 return {normal,critical:criticalFormula,ability,abilityBonus};
}

export function maximumSpellLevel(data){
 const classes=characterClasses(data).filter(c=>c.name),profiles=data.castingProfiles||[];
 const levels=classes.map(c=>{const p=profiles.find(p=>p.className?.toLowerCase()===c.name.toLowerCase());if(p)return p.mode==='none'?0:Number.isInteger(p.highestSpellLevel)?p.highestSpellLevel:null;if(/^black mage$/i.test(c.name)&&!c.archetype)return Math.min(9,Math.ceil(c.level/2));return null;});
 const known=levels.filter(n=>n!==null);return known.length?Math.max(...known):null;
}

/**
 * Combine like damage types, preserving the recorded totals (never reroll dice).
 * Untyped terms are shown only when a typed component is present.
 * This is used by the sheet and Discord receipt for every roll kind.
 */
export function damageTypeTotals(roll){
 const parts=Array.isArray(roll?.breakdown)?roll.breakdown:[];
 if(!parts.some(part=>String(part.type||'').trim()))return [];
 const grouped=new Map();
 for(const part of parts){
  if(!Number.isFinite(part.total))continue;
  const type=String(part.type||'').trim().replace(/\s+/g,' ').toLowerCase()||'untyped';
  grouped.set(type,(grouped.get(type)||0)+part.total);
 }
 return [...grouped].map(([type,total])=>({type,total}));
}
export function damageTypeLine(roll){
 const totals=damageTypeTotals(roll);
 return totals.length?totals.map(part=>part.total+' '+part.type).join(' + ').replace(/\+ -/g,'− ')+' damage':'';
}
