import {abilities,number,sheetStats} from './model.mjs';
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
 const cl=row.caster_level!==undefined&&row.caster_level!==''?number(row.caster_level):match?number(match.level):classes.length===1?number(classes[0].level):undefined;
 return {...Object.fromEntries(abilities.map(k=>[k.toUpperCase(),data[k]===undefined||data[k]===null||data[k]===''?undefined:s.mods[k]])),LEVEL:totalClassLevel(classes)||number(data.character_level||data.level)||1,CL:cl};
}
export function spellLevel(value){if(value===0||/^(?:0|cantrip)$/i.test(String(value).trim()))return 0;const m=/^(\d)(?:st|nd|rd|th)?$/i.exec(String(value).trim());return m?Number(m[1]):null;}
export function entryCalculations(row,data,key){
 const s=sheetStats(data),ctx=context(data,row),spell=key==='spells',level=spellLevel(row.lvl),stat=abilities.includes(row.casting_ability)?row.casting_ability:abilities.includes(data.spell_dc_base)?data.spell_dc_base:'int';
 const raw=String(row.attack_type||'').toLowerCase().trim().replace(/[ -]+/g,'_');const modes={melee:s.melee,ranged:s.ranged,touch:s.touchAttack,ranged_touch:s.rangedTouch,cmb:s.cmb};
 const attack=Object.hasOwn(modes,raw)?{mode:raw,bonus:modes[raw]+number(row.attack_misc)}:null;
 const dc=spell&&level!==null&&ctx[stat.toUpperCase()]!==undefined?10+level+s.mods[stat]+number(row.dc_misc):row.dc_formula?arithmetic(row.dc_formula,ctx):null;
 const mp=spell&&level!==null?Math.max(0,level+number(row.mp_adjustment)):null;
 let range=String(row.range||'');if(ctx.CL!==undefined){if(/^close\b/i.test(range))range=(25+5*Math.floor(ctx.CL/2))+' ft';else if(/^medium\b/i.test(range))range=(100+10*ctx.CL)+' ft';else if(/^long\b/i.test(range))range=(400+40*ctx.CL)+' ft';}
 const maxUses=row.uses_formula?Math.max(0,arithmetic(row.uses_formula,ctx)):Math.max(0,number(row.u_max));
 return {ctx,level,stat,dc,mp,attack,range,maxUses,currentUses:row.u_curr===undefined?maxUses:Math.min(maxUses,Math.max(0,number(row.u_curr))),concentration:ctx.CL===undefined||ctx[stat.toUpperCase()]===undefined?null:ctx.CL+s.mods[stat]};
}
// Explicit formulas only: e.g. {CL}d6 + {INT}, or ({CL}/2)d6 + 1d4 fire.
export function damageExpression(source,values={}){
 if(typeof source!=='string'||source.length>300)throw Error('Damage formula is too long.');
 let out=source.replace(/\(([^()]+)\)(?=d\d)/gi,(_,f)=>String(arithmetic(f,values))).replace(/\{([A-Z_]+)\}/gi,(_,key)=>{const n=values[key.toUpperCase()];if(!Number.isFinite(n))throw Error('Set '+key.toUpperCase()+' for this damage formula.');return String(n);});
 out=out.replace(/\+\s*-/g,'-').replace(/-\s*-/g,'+');if(!/^[\d\sd+\-.a-z/]+$/i.test(out))throw Error('Use a dice expression with supported numeric variables.');return out;
}
export function diceTerms(source){
 if(typeof source!=='string'||source.length>500)throw Error('Invalid dice expression.');const text=source.replaceAll('−','-').trim(),parts=text.match(/[+-]?[^+-]+/g)||[];if(!parts.length||parts.length>16||parts.join('')!==text)throw Error('Invalid dice expression.');let dice=0;
 const terms=parts.map(part=>{const sign=part.trim().startsWith('-')?-1:1,body=part.trim().replace(/^[+-]\s*/,'');let m=/^(\d*)d(\d+)(?:\s+([a-z][a-z /]*))?$/i.exec(body);if(m){const count=Number(m[1]||1),sides=Number(m[2]);dice+=count;if(count<1||dice>50||sides<2||sides>1000)throw Error('Use at most 50 dice, with 2–1,000 sides.');return {sign,count,sides,type:m[3]||''};}m=/^(\d+)(?:\s+([a-z][a-z /]*))?$/i.exec(body);if(!m||Number(m[1])>1000000)throw Error('Invalid dice term.');return {sign,flat:Number(m[1]),type:m[2]||''};});if(!dice)throw Error('A roll needs at least one die.');return terms;
}
