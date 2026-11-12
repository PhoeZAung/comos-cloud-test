// Small, host-independent calculations matching the saved Mount Aetheria sheet.
import {carryingCapacity} from './carrying.mjs';
export const abilities=['str','dex','con','int','wis','cha'];
export const number=value=>Number.isFinite(Number(value))?Number(value):0;
export const modifier=value=>Math.floor((number(value)-10)/2);
export const signed=value=>(number(value)>=0?'+':'')+number(value);
export const sizes=['Fine','Diminutive','Tiny','Small','Medium','Large','Huge','Gargantuan','Colossal'];
const sizeIndex=data=>sizes.findIndex(size=>size.toLowerCase()===String(data.size_category||data.size||'Medium').toLowerCase());
const hasUncannyDodge=data=>['activeAbilities','passiveAbilities','racialAbilities','feats'].some(key=>(data[key]||[]).some(row=>/^(?:improved )?uncanny dodge$/i.test(String(row.rulesName||row.name||'').trim())));
const bakedStealthSizeRaces=new Set(['ffd20:race:tarutaru','ffd20:race:lambkin']);
export function sheetStats(d={}){
 const n=k=>number(d[k]),mod=k=>d[k]===''||d[k]===undefined?0:modifier(d[k]);
 const encumbrance=carryingCapacity(d),dexAcModifier=Math.min(mod('dex'),encumbrance.maxDex),armorBonus=encumbrance.armor.worn?encumbrance.armorBonus:n('ac_armor');
 const dodgeAcBonus=encumbrance.load==='over'?0:n('ac_dodge');
 const uncannyDodge=d.uncanny_dodge==='on'||d.uncanny_dodge!=='off'&&hasUncannyDodge(d);
 const flatDexModifier=uncannyDodge?dexAcModifier:Math.min(0,dexAcModifier),flatDodgeBonus=uncannyDodge?dodgeAcBonus:0;
 const si=sizeIndex(d);
 const size=[8,4,2,1,0,-1,-2,-4,-8][si<0?4:si],special=-size,bab=n('bab')+n('bab_temp');
 const has=(...keys)=>keys.some(k=>d[k]!==undefined&&d[k]!=='');
 const total=(saved,keys,calc)=>!has(...keys)&&has(saved)?n(saved):calc;
 const armorClass=(saved,keys,calc)=>encumbrance.armor.worn?calc:total(saved,keys,calc);
 const attack=(prefix,fallback)=>bab+mod(abilities.includes(d[prefix+'_ability'])?d[prefix+'_ability']:fallback)+size+n(prefix+'_temp');
 return {
  mods:Object.fromEntries(abilities.map(a=>[a,mod(a)])),hp:n('hp_curr'),hpMax:Math.max(0,n('hp_max')+n('hp_max_temp')),hpTemp:n('hp_temp'),
  mp:has('mp')?n('mp')+n('mp_temp'):n('mp_curr'),mpMax:Math.max(0,has('mp_class','mp_bonus')?n('mp_class')+n('mp_bonus')+n('mp_max_temp'):number(d.mp_total_max??d.mp_max??d.mp_effective_max)),
  initiative:total('init_bonus',['dex','init_temp'],mod('dex')+n('init_temp')),bab,speed:encumbrance.effectiveSpeed,baseSpeed:encumbrance.baseSpeed,encumbrance,dexAcModifier,armorBonus,dodgeAcBonus,flatDexModifier,flatDodgeBonus,uncannyDodge,
  ac:armorClass('ac_total',['dex','ac_armor','ac_natural','ac_deflect','ac_dodge','ac_temp'],10+dexAcModifier+size+armorBonus+n('ac_natural')+n('ac_deflect')+dodgeAcBonus+n('ac_temp')),
  touch:armorClass('touch_ac_total',['dex','ac_deflect','ac_dodge','touch_temp'],10+dexAcModifier+size+n('ac_deflect')+dodgeAcBonus+n('touch_temp')),
  flat:armorClass('flat_ac_total',['dex','ac_armor','ac_natural','ac_deflect','ac_dodge','flat_temp'],10+flatDexModifier+size+armorBonus+n('ac_natural')+n('ac_deflect')+flatDodgeBonus+n('flat_temp')),
  cmd:total('cmd_total',['str','dex','ac_deflect','ac_dodge','cmd_temp'],10+bab+mod('str')+mod('dex')+special+n('ac_deflect')+dodgeAcBonus+n('cmd_temp')),
  cmb:total('cmb',['str','dex','bab','cmb_temp'],bab+mod('str')+mod('dex')+special+n('cmb_temp')),
  melee:attack('ar_melee','str'),ranged:attack('ar_ranged','dex'),touchAttack:attack('ar_touch','str'),rangedTouch:attack('ar_ranged_touch','dex'),
  fort:total('fort_bonus',['con','fort_base','fort_enhance','fort_temp'],mod('con')+n('fort_base')+n('fort_enhance')+n('fort_temp')),
  ref:total('ref_bonus',['dex','ref_base','ref_enhance','ref_temp'],mod('dex')+n('ref_base')+n('ref_enhance')+n('ref_temp')),
  will:total('will_bonus',['wis','will_base','will_enhance','will_temp'],mod('wis')+n('will_base')+n('will_enhance')+n('will_temp'))
 };
}
export function skillTotal(row,d){
 const ranks=number(row.lvl??row.ranks),stat=String(row.stat||'').toLowerCase();
 const base=d[stat]===undefined||d[stat]===''?0:modifier(d[stat]);
 const checkPenalty=['str','dex'].includes(stat)?carryingCapacity(d).checkPenalty:0;
 const name=String(row.name||'').trim().toLowerCase(),si=sizeIndex(d),sizeStep=si<0?0:4-si;
 // These wizard builds saved the Small size bonus as part of the racial adjustment.
 const bakedSizeBonus=number(row.rulesBonus)>=4&&bakedStealthSizeRaces.has(d.rulesBuild?.input?.raceId)?4:0;
 const sizeBonus=name==='fly'?sizeStep*2:name==='stealth'?sizeStep*4-bakedSizeBonus:0;
 return base+ranks+number(row.temp)+(row.cs&&ranks>0?3:0)+checkPenalty+sizeBonus;
}
export const attackTypes={melee:'Melee',ranged:'Ranged',touch:'Touch attack',ranged_touch:'Ranged touch',cmb:'CMB'};
export function attackType(value){const key=String(value||'melee').trim().toLowerCase().replace(/[ -]+/g,'_');return key==='touch_attack'?'touch':Object.hasOwn(attackTypes,key)?key:'melee';}
export function weaponDefaultAbilities(type,data={}){
 const normalized=attackType(type),prefix={melee:'ar_melee',ranged:'ar_ranged',touch:'ar_touch',ranged_touch:'ar_ranged_touch'}[normalized];
 const attack=prefix&&abilities.includes(data[prefix+'_ability'])?data[prefix+'_ability']:['ranged','ranged_touch'].includes(normalized)?'dex':'str';
 return {attack,damage:['melee','touch'].includes(normalized)?'str':'none'};
}
export function weaponAttackParts(row,d,{npc=false}={}){
 const s=sheetStats(d),type=attackType(row.attack_type),prefix={melee:'ar_melee',ranged:'ar_ranged',touch:'ar_touch',ranged_touch:'ar_ranged_touch'}[type];
 const base={melee:s.melee,ranged:s.ranged,touch:s.touchAttack,ranged_touch:s.rangedTouch,cmb:s.cmb}[type];
 const defaultAbility=prefix&&abilities.includes(d[prefix+'_ability'])?d[prefix+'_ability']:['ranged','ranged_touch'].includes(type)?'dex':'str';
 const saved=String(row.ability_mod||row.mod||'auto').toLowerCase(),ability=saved==='none'?'none':abilities.includes(saved)?saved:defaultAbility;
 const replacement=(ability==='none'?0:s.mods[ability])-s.mods[defaultAbility],misc=number(row.attack_misc);
 return {type,base,ability,replacement,misc,total:npc&&Number.isFinite(row.npcAttackBonus)?row.npcAttackBonus:base+replacement+misc};
}
export function weaponAttack(row,d){return weaponAttackParts(row,d).total;}

