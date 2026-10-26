import {characterClasses,totalClassLevel} from '../../src/features/characters/ffd20.mjs';
import {sheetStats,abilities,sizes,number} from '../../src/features/sheet/model.mjs';
export const numericFields=[...abilities,'hp_curr','hp_temp','hp_max','hp_max_temp','mp','mp_curr','mp_temp','mp_class','mp_bonus','mp_max','mp_total_max','mp_max_temp','mp_max_spell_level','init_temp','bab','bab_temp','speed','ac_armor','ac_natural','ac_deflect','ac_dodge','ac_temp','touch_temp','flat_temp','cmd_temp','ar_melee_temp','ar_ranged_temp','ar_touch_temp','ar_ranged_touch_temp','cmb_temp','fort_base','fort_enhance','fort_temp','ref_base','ref_enhance','ref_temp','will_base','will_enhance','will_temp','currency_gil','currency_moogle','slot_cap'];
const textFields=['languages','senses','resistances','proficiencies','notesArea'];
const enumFields={size_category:sizes,spell_dc_base:abilities,ar_melee_ability:['str','dex'],ar_ranged_ability:['str','dex'],ar_touch_ability:['str','dex'],ar_ranged_touch_ability:['str','dex']};
export const collections=['items','weapons','spells','activeAbilities','passiveAbilities','racialAbilities','feats','skills'];
const entryText=['name','desc','damage','range','type','crit_range','crit_mult','attack_type','duration','target','saving_throw','school','spell_resist','at_higher_lvls','subName'];
const entryNumber=['amount','u_curr','u_max','lvl','temp','attack_misc'];
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const bad=message=>{throw Error(message);};
function numeric(v){if(!['string','number'].includes(typeof v)||v===''||!Number.isFinite(Number(v))||Math.abs(Number(v))>100000000)bad('Enter a valid number.');return Number(v);}
function text(v,max=12000){if(typeof v!=='string'||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v))bad('Text is too long or invalid.');return v;}
export function mergeSheetData(original,change){
 const data=structuredClone(original);
 if(change.action==='fields'){
  if(!plain(change.fields)||!Object.keys(change.fields).length||Object.keys(change.fields).length>90)bad('Invalid sheet fields.');
  for(const [key,value] of Object.entries(change.fields)){
   if(numericFields.includes(key)){data[key]=numeric(value);if(abilities.includes(key)&&(data[key]<0||data[key]>999))bad('Ability score must be 0–999.');}
   else if(textFields.includes(key))data[key]=text(value);
   else if(Object.hasOwn(enumFields,key)&&enumFields[key].includes(value))data[key]=value;
   else bad('Invalid sheet field.');
  }
  if(Object.hasOwn(change.fields,'size_category'))data.size=data.size_category;
  if(Object.hasOwn(change.fields,'currency_gil'))data.gil=data.currency_gil;
  if(Object.hasOwn(change.fields,'mp_curr')&&!Object.hasOwn(change.fields,'mp'))data.mp=data.mp_curr-number(data.mp_temp);
 }else if(change.action==='entry'){
  if(!collections.includes(change.collection)||!['add','update','remove'].includes(change.mode))bad('Invalid sheet entry.');
  const rows=Array.isArray(data[change.collection])?data[change.collection]:[];
  if(change.mode!=='add'&&(!Number.isInteger(change.index)||change.index<0||change.index>=rows.length))bad('Entry no longer exists.');
  if(change.mode==='remove')rows.splice(change.index,1);
  else{
   if(!plain(change.fields)||!Object.keys(change.fields).length||Object.keys(change.fields).length>30)bad('Invalid entry fields.');
   const safe={};
   for(const [key,value] of Object.entries(change.fields)){
    if(entryText.includes(key)){safe[key]=text(value,key==='name'?120:12000);if(key==='name'&&!safe[key].trim())bad('Enter a name.');}
    else if(entryNumber.includes(key)){safe[key]=numeric(value);if(['amount','u_max','lvl'].includes(key)&&safe[key]<0)bad('Value cannot be negative.');}
    else if(['equipped','cs','restoreOnLongRest','favorite'].includes(key)&&typeof value==='boolean')safe[key]=value;
    else if(['stat','ability_mod'].includes(key)&&abilities.includes(value))safe[key]=value;
    else bad('Invalid entry field.');
   }
   if(change.mode==='add'){
    if(rows.length>=1000||!safe.name?.trim())bad('Enter a name; maximum 1,000 entries per section.');rows.push(safe);
   }else rows[change.index]={...rows[change.index],...safe};
  }
  data[change.collection]=rows;
 }else if(change.action==='damage'||change.action==='heal'){
  const amount=numeric(change.amount);if(amount<=0)bad('Enter a positive amount.');const current=sheetStats(data);
  if(change.action==='damage'){const absorbed=Math.min(Math.max(0,current.hpTemp),amount);data.hp_temp=current.hpTemp-absorbed;data.hp_curr=current.hp-(amount-absorbed);}
  else data.hp_curr=Math.min(current.hpMax,current.hp+amount);
 }else if(change.action==='spendMp'){
  const cost=numeric(change.amount),current=sheetStats(data).mp;if(cost<=0||cost>current)bad('Not enough MP, or invalid cost.');data.mp=current-cost-number(data.mp_temp);
 }else if(change.action==='rest'){
  const current=sheetStats(data),level=totalClassLevel(characterClasses(data))||number(data.character_level||data.level)||1;
  data.hp_curr=Math.min(current.hpMax,current.hp+Math.max(1,level));data.mp=current.mpMax;data.mp_temp=0;
  for(const row of data.activeAbilities||[])if(row.restoreOnLongRest!==false&&number(row.u_max)>0)row.u_curr=number(row.u_max);
 }else bad('Invalid sheet action.');
 const s=sheetStats(data);Object.assign(data,{hp_effective_max:s.hpMax,mp_curr:s.mp,mp_total_max:s.mpMax,mp_effective_max:s.mpMax,ac_total:s.ac,touch_ac_total:s.touch,flat_ac_total:s.flat,cmd_total:s.cmd,ar_total:s.melee,ar_ranged_total:s.ranged,ar_touch_total:s.touchAttack,ar_ranged_touch_total:s.rangedTouch,cmb:s.cmb,fort_bonus:s.fort,ref_bonus:s.ref,will_bonus:s.will});
 if(Buffer.byteLength(JSON.stringify(data))>500000)bad('Character data is too large.');
 return data;
}
