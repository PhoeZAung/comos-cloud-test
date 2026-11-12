// Pathfinder 1e attack/effect defense rules. Source metadata is copied into
// recorded roll receipts on the server; target defenses come from saved sheets.
export const abilityKinds=Object.freeze({other:'Unspecified',sp:'Spell-like (Sp)',su:'Supernatural (Su)',ex:'Extraordinary (Ex)'});
export const srModes=Object.freeze({yes:'Yes (check SR)',no:'No (ignores SR)'});
export const physicalTypes=new Set(['bludgeoning','piercing','slashing']);
export const energyTypes=new Set(['acid','cold','electricity','fire','sonic','earth','ice','lightning','water','wind','holy','shadow','force','positive','negative']);
const canonical=value=>{
 const s=String(value||'').trim().toLowerCase().replace(/[_-]/g,' ').replace(/\s+/g,' ');
 return ({b:'bludgeoning',p:'piercing',s:'slashing',electric:'electricity',lightning:'electricity',ice:'cold'}[s]||s);
};
export function parseDr(value){
 const text=String(value||'').trim().replace(/\u2014/g,'-');
 const match=/(?:\bdr\s*)?(\d{1,3})\s*\/\s*([\w\s,+/&-]+?)(?=\s*;|\s*,\s*(?:sr|resist|immune|weak|dr)\b|$)/i.exec(text);
 if(!match)return null;
 return {amount:Number(match[1]),bypass:match[2].trim()};
}
export function parseSr(value){
 const match=/\bsr\s*(\d{1,3})\b/i.exec(String(value||''));
 return match?Number(match[1]):null;
}
export function defenseProfile(data,{npc=false}={}){
 const stats=npc?data?.npcStats||{}:data||{};
 const details=npc?data?.npcText||{}:{};
 const note=[details.defenses,details.saveDetail,data?.resistances].filter(Boolean).join('; ');
 const parsed=parseDr(note);
 const amount=Number.isFinite(stats.dr)?Math.max(0,stats.dr):parsed?.amount??0;
 const sr=Number.isFinite(stats.sr)?Math.max(0,stats.sr):parseSr(note)||0;
 const bypass=String(details.drBypass||data?.drBypass||parsed?.bypass||'').trim();
 const energy=String(details.energyResistances||data?.energyResistances||data?.resistances||'');
 const immunities=String(details.immunities||data?.immunities||'');
 return {dr:amount,drBypass:bypass,sr,energyResistances:energy,immunities,
  vulnerabilities:String(details.vulnerabilities||data?.vulnerabilities||'')};
}
export function bypassesDr(required,tags=[]){
 if(!required||required.trim()==='-'||required.trim()==='—')return false;
 const owned=new Set(tags.map(canonical).filter(Boolean));
 // Explicit AND conditions require every material, alignment, or damage type;
 // explicit OR allows either. An unknown tag never gets a free bypass.
 const parts=required.toLowerCase().replace(/\//g,' or ').split(/\s+or\s+/);
 return parts.some(part=>part.split(/\s+and\s+/).map(canonical).every(tag=>owned.has(tag)));
}
function typedBuckets(roll,result){
 const weapon=roll.kind==='weapon';
 const damage=result.critical&&roll.critical?.damage?roll.critical.damage:roll.damage;
 const parts=Array.isArray(damage?.breakdown)?damage.breakdown:[];
 const tags=(Array.isArray(roll.damageTypes)?roll.damageTypes:[]).map(canonical);
 const buckets=new Map();let untyped=0;
 if(parts.length){
  for(const part of parts){
   const type=canonical(part.type),total=Number(part.total)||0;
   if(type)buckets.set(type,(buckets.get(type)||0)+total);
   else untyped+=total;
  }
 }else untyped=result.amount;
 const types=[...buckets.keys()],hasPhysical=types.some(type=>physicalTypes.has(type));
 const primary=tags.filter(type=>physicalTypes.has(type)||energyTypes.has(type));
 const inherited=weapon?primary.find(type=>physicalTypes.has(type))||
  (primary.length===1?primary[0]:'bludgeoning'):
  primary.length===1?primary[0]:'untyped';
 // Treat untyped weapon bonuses as part of the main weapon damage, but never
 // silently classify an untyped magical spell as physical.
 buckets.set(inherited,(buckets.get(inherited)||0)+untyped);
 // Force each subtotal to be nonnegative and keep the roll total authoritative.
 const output=[...buckets].map(([type,total])=>({type,total:Math.max(0,total)}));
 return output;
}
function parseEnergyResistance(text,type){
 const normalized=String(text||'').toLowerCase().replace(/\b(?:resist|resistance|energy resistance)\b/g,' ');
 const m=new RegExp('(?:^|[,;\\s])'+type+'\\s*(\\d{1,3})(?=$|[,;\\s])','i').exec(normalized);
 return m?Number(m[1]):0;
}
function isImmune(text,type){
 return new RegExp('(?:^|[,;\\s])'+type+'(?=$|[,;\\s])','i').test(String(text||''));
}
export function resolveDefenses(roll,effect,target,{srRoll=null}={}){
 if(effect.kind!=='damage'&&effect.kind!=='heal'&&effect.kind!=='temp_hp')return {...effect,mitigation:[]};
 if(!effect.hit)return {...effect,mitigation:[]};
 const resolution=roll.resolution||{};
 const source=resolution.abilityKind|| (roll.kind==='spell'?'spell':roll.kind==='weapon'?'weapon':'other');
 const checksSr=(source==='spell'||source==='sp')&&resolution.srApplies!==false;
 const sr=Number(target?.sr)||0;
 const mitigation=[];
 if(checksSr&&sr>0){
  const cl=Number(resolution.casterLevel);
  if(!Number.isInteger(cl)||cl<=0)throw Error('Set the ability or spell caster level to resolve SR '+sr+'.');
  if(!Number.isInteger(srRoll)||srRoll<1||srRoll>20)throw Error('A verified caster-level die is required for SR.');
  const bonus=Number.isFinite(resolution.srBonus)?resolution.srBonus:0;
  const check=srRoll+cl+bonus;
  mitigation.push({type:'sr',sr,roll:srRoll,casterLevel:cl,bonus,total:check,passed:check>=sr});
  if(check<sr)return {...effect,hit:false,amount:0,reason:'Spell resisted',mitigation};
 }
 if(effect.kind!=='damage')return {...effect,mitigation};
 const dr=Math.max(0,Number(target?.dr)||0);
 let amount=0,physical=0,energy=0;
 const buckets=typedBuckets(roll,effect);
 const tags=[...(resolution.drBypass||[]),...(resolution.damageTypes||[])].map(canonical);
 const ignored=dr>0&&bypassesDr(String(target?.drBypass||''),tags);
 for(const part of buckets){
  const type=part.type;
  if(physicalTypes.has(type))physical+=part.total;
  else if(energyTypes.has(type))energy+=part.total;
  let after=part.total;
  if(energyTypes.has(type)){
   const resist=parseEnergyResistance(target?.energyResistances,type);
   if(isImmune(target?.immunities,type))after=0;
   else after=Math.max(0,after-resist);
   if(after!==part.total)mitigation.push({type:'energy',energy:type,before:part.total,after,resist,immune:after===0&&isImmune(target?.immunities,type)});
  }
  amount+=after;
 }
 if(dr>0&&physical>0&&!ignored){
  const reduced=Math.min(dr,physical);
  amount=Math.max(0,amount-reduced);
  mitigation.push({type:'dr',dr,damageType:'physical',reduced,bypass:target.drBypass||''});
 }else if(dr>0&&physical>0&&ignored)mitigation.push({type:'dr',dr,reduced:0,bypassed:true});
 // Vulnerability is intentionally not multiplied without an explicit GM rule.
 if(target?.vulnerabilities&&energy>0)mitigation.push({type:'review',reason:'Check elemental vulnerability: '+String(target.vulnerabilities).slice(0,80)});
 return {...effect,amount:Math.min(1000000,Math.max(0,Math.floor(amount))),mitigation};
}
