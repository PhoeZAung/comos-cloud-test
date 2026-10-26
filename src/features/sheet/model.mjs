// Small, host-independent calculations matching the saved Mount Aetheria sheet.
export const abilities=['str','dex','con','int','wis','cha'];
export const number=value=>Number.isFinite(Number(value))?Number(value):0;
export const modifier=value=>Math.floor((number(value)-10)/2);
export const signed=value=>(number(value)>=0?'+':'')+number(value);
export const sizes=['Fine','Diminutive','Tiny','Small','Medium','Large','Huge','Gargantuan','Colossal'];
export function sheetStats(d={}){
 const n=k=>number(d[k]),mod=k=>d[k]===''||d[k]===undefined?0:modifier(d[k]);
 const si=sizes.findIndex(s=>s.toLowerCase()===String(d.size_category||d.size||'Medium').toLowerCase());
 const size=[8,4,2,1,0,-1,-2,-4,-8][si<0?4:si],special=-size,bab=n('bab')+n('bab_temp');
 const has=(...keys)=>keys.some(k=>d[k]!==undefined&&d[k]!=='');
 const total=(saved,keys,calc)=>!has(...keys)&&has(saved)?n(saved):calc;
 const attack=(prefix,fallback)=>bab+mod(abilities.includes(d[prefix+'_ability'])?d[prefix+'_ability']:fallback)+size+n(prefix+'_temp');
 return {
  mods:Object.fromEntries(abilities.map(a=>[a,mod(a)])),hp:n('hp_curr'),hpMax:Math.max(0,n('hp_max')+n('hp_max_temp')),hpTemp:n('hp_temp'),
  mp:has('mp')?n('mp')+n('mp_temp'):n('mp_curr'),mpMax:Math.max(0,has('mp_class','mp_bonus')?n('mp_class')+n('mp_bonus')+n('mp_max_temp'):number(d.mp_total_max??d.mp_max??d.mp_effective_max)),
  initiative:total('init_bonus',['dex','init_temp'],mod('dex')+n('init_temp')),bab,speed:n('speed'),
  ac:total('ac_total',['dex','ac_armor','ac_natural','ac_deflect','ac_dodge','ac_temp'],10+mod('dex')+size+n('ac_armor')+n('ac_natural')+n('ac_deflect')+n('ac_dodge')+n('ac_temp')),
  touch:total('touch_ac_total',['dex','ac_deflect','ac_dodge','touch_temp'],10+mod('dex')+size+n('ac_deflect')+n('ac_dodge')+n('touch_temp')),
  flat:total('flat_ac_total',['ac_armor','ac_natural','ac_deflect','flat_temp'],10+size+n('ac_armor')+n('ac_natural')+n('ac_deflect')+n('flat_temp')),
  cmd:total('cmd_total',['str','dex','cmd_temp'],10+mod('str')+mod('dex')+special+n('cmd_temp')),
  cmb:total('cmb',['str','dex','bab','cmb_temp'],bab+mod('str')+mod('dex')+special+n('cmb_temp')),
  melee:attack('ar_melee','str'),ranged:attack('ar_ranged','dex'),touchAttack:attack('ar_touch','str'),rangedTouch:attack('ar_ranged_touch','dex'),
  fort:total('fort_bonus',['con','fort_base','fort_enhance','fort_temp'],mod('con')+n('fort_base')+n('fort_enhance')+n('fort_temp')),
  ref:total('ref_bonus',['dex','ref_base','ref_enhance','ref_temp'],mod('dex')+n('ref_base')+n('ref_enhance')+n('ref_temp')),
  will:total('will_bonus',['wis','will_base','will_enhance','will_temp'],mod('wis')+n('will_base')+n('will_enhance')+n('will_temp'))
 };
}
export function skillTotal(row,d){const ranks=number(row.lvl??row.ranks);return (d[row.stat]===undefined||d[row.stat]===''?0:modifier(d[row.stat]))+ranks+number(row.temp)+(row.cs&&ranks>0?3:0);}
export const attackTypes={melee:'Melee',ranged:'Ranged',touch:'Touch attack',ranged_touch:'Ranged touch',cmb:'CMB'};
export function attackType(value){const key=String(value||'melee').trim().toLowerCase().replace(/[ -]+/g,'_');return key==='touch_attack'?'touch':Object.hasOwn(attackTypes,key)?key:'melee';}
export function weaponAttackParts(row,d){
 const s=sheetStats(d),type=attackType(row.attack_type),prefix={melee:'ar_melee',ranged:'ar_ranged',touch:'ar_touch',ranged_touch:'ar_ranged_touch'}[type];
 const base={melee:s.melee,ranged:s.ranged,touch:s.touchAttack,ranged_touch:s.rangedTouch,cmb:s.cmb}[type];
 const defaultAbility=prefix&&abilities.includes(d[prefix+'_ability'])?d[prefix+'_ability']:['ranged','ranged_touch'].includes(type)?'dex':'str';
 const saved=String(row.ability_mod||row.mod||'auto').toLowerCase(),ability=abilities.includes(saved)?saved:defaultAbility;
 const replacement=s.mods[ability]-s.mods[defaultAbility],misc=number(row.attack_misc);
 return {type,base,ability,replacement,misc,total:base+replacement+misc};
}
export function weaponAttack(row,d){return weaponAttackParts(row,d).total;}

