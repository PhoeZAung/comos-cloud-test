import {skillBudget} from '../../src/features/sheet/skill-budget.mjs';
import {ITEM_TAG_OPTIONS} from '../../src/features/sheet/item-categories.mjs';
import {updateManagedStats} from '../../src/features/characters/managed-stats.mjs';
import {sheetSkills} from '../../src/features/sheet/skills.mjs';
import {entryCalculations} from '../../src/features/sheet/calculations.mjs';
import {characterClasses,totalClassLevel} from '../../src/features/characters/ffd20.mjs';
import {sheetStats,abilities,sizes,number} from '../../src/features/sheet/model.mjs';
import {equipmentSlotIds,equipmentRows,occupiesSlot} from '../../src/features/sheet/equipment.mjs';
export const numericFields=[...abilities,'hp_curr','hp_temp','hp_max','hp_max_temp','mp','mp_curr','mp_temp','mp_class','mp_bonus','mp_max','mp_total_max','mp_max_temp','mp_max_spell_level','init_temp','bab','bab_temp','speed','ac_armor','ac_natural','ac_deflect','ac_dodge','ac_temp','touch_temp','flat_temp','cmd_temp','ar_melee_temp','ar_ranged_temp','ar_touch_temp','ar_ranged_touch_temp','cmb_temp','fort_base','fort_enhance','fort_temp','ref_base','ref_enhance','ref_temp','will_base','will_enhance','will_temp','currency_gil','currency_moogle','slot_cap'];
const booleanFields=['hp_favorite','mp_favorite'];
const textFields=['languages','senses','resistances','proficiencies','notesArea'];
const enumFields={size_category:sizes,spell_dc_base:abilities,ar_melee_ability:['str','dex'],ar_ranged_ability:['str','dex'],ar_touch_ability:['str','dex'],ar_ranged_touch_ability:['str','dex']};
export const collections=['items','weapons','spells','activeAbilities','passiveAbilities','racialAbilities','feats','skills'];
const entryText=['name','desc','damage','range','type','crit_range','crit_mult','attack_type','duration','target','saving_throw','school','spell_resist','at_higher_lvls','subName','dc_formula','uses_formula','casting_ability','extra_damage'];
const entryNumber=['amount','u_curr','u_max','lvl','temp','attack_misc','dc_misc','mp_adjustment','caster_level','mp_cost'];
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const bad=message=>{throw Error(message);};
function numeric(v){if(!['string','number'].includes(typeof v)||v===''||!Number.isFinite(Number(v))||Math.abs(Number(v))>100000000)bad('Enter a valid number.');return Number(v);}
function text(v,max=12000){if(typeof v!=='string'||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v))bad('Text is too long or invalid.');return v;}
export function mergeSheetData(original,change){
 const data=structuredClone(original);
 if(change.action==='fields'){
  if(!plain(change.fields)||!Object.keys(change.fields).length||Object.keys(change.fields).length>90)bad('Invalid sheet fields.');
  for(const [key,value] of Object.entries(change.fields)){
   if(data.rulesBuild&&['hp_max','mp_class','mp_bonus','bab'].includes(key))bad('This base value is calculated by class progression.');
   if(key==='favorite_boxes'){if(!Array.isArray(value)||value.length>12||value.some(v=>!['ability-scores','identity','proficiencies','bio','skills','inventory','equipment','notes','saving-throws','resistances','offense','defense'].includes(v)))bad('Invalid favorite box.');data.favorite_boxes=[...new Set(value)];continue;}
   if(numericFields.includes(key)){data[key]=numeric(value);if(abilities.includes(key)&&(data[key]<0||data[key]>999))bad('Ability score must be 0–999.');}
   else if(booleanFields.includes(key)&&typeof value==='boolean')data[key]=value;
   else if(textFields.includes(key))data[key]=text(value);
   else if(Object.hasOwn(enumFields,key)&&enumFields[key].includes(value))data[key]=value;
   else bad('Invalid sheet field.');
  }
  if(Object.hasOwn(change.fields,'size_category'))data.size=data.size_category;
  if(Object.hasOwn(change.fields,'currency_gil'))data.gil=data.currency_gil;
  if(Object.hasOwn(change.fields,'mp_curr')&&!Object.hasOwn(change.fields,'mp')){if(data.mp_curr<0)bad('MP cannot be negative.');data.mp_temp=Math.min(Math.max(0,number(data.mp_temp)),data.mp_curr);data.mp=data.mp_curr-data.mp_temp;}
 }else if(change.action==='entry'){
  if(!collections.includes(change.collection)||!['add','update','remove'].includes(change.mode))bad('Invalid sheet entry.');
  const rows=change.collection==='skills'?sheetSkills(data):Array.isArray(data[change.collection])?data[change.collection]:[];
  if(change.collection==='skills'){if(change.mode!=='update'||Object.keys(change.fields||{}).some(k=>!['lvl','temp','cs','subName','favorite'].includes(k)))bad('Skills are fixed. Edit ranks, class skill, misc or specialization.');data.skills=sheetSkills(data);}
  if(change.mode!=='add'&&(!Number.isInteger(change.index)||change.index<0||change.index>=rows.length))bad('Entry no longer exists.');
  if(change.mode==='remove')rows.splice(change.index,1);
  else{
   if(!plain(change.fields)||!Object.keys(change.fields).length||Object.keys(change.fields).length>30)bad('Invalid entry fields.');
   const safe={};
   for(const [key,value] of Object.entries(change.fields)){
   if(data.rulesBuild&&['hp_max','mp_class','mp_bonus','bab'].includes(key))bad('This base value is calculated by class progression.');
   if(key==='favorite_boxes'){if(!Array.isArray(value)||value.length>12||value.some(v=>!['ability-scores','identity','proficiencies','bio','skills','inventory','equipment','notes','saving-throws','resistances','offense','defense'].includes(v)))bad('Invalid favorite box.');data.favorite_boxes=[...new Set(value)];continue;}
    if(key==='sourceCategory'&&change.collection==='items'&&ITEM_TAG_OPTIONS.includes(value))safe.sourceCategory=value;
    else if(entryText.includes(key)){if(key==='casting_ability'&&!abilities.includes(value))bad('Choose a casting ability.');safe[key]=text(value,key==='name'?120:12000);if(key==='name'&&!safe[key].trim())bad('Enter a name.');}
    else if(entryNumber.includes(key)){if(['mp_cost','caster_level'].includes(key)&&value===''){safe[key]='';continue;}safe[key]=numeric(value);if(['u_curr','u_max'].includes(key)&&(!Number.isInteger(safe[key])||safe[key]<0))bad('Uses must be nonnegative whole numbers.');if(key==='mp_cost'&&(!Number.isInteger(safe[key])||safe[key]<0||safe[key]>999))bad('MP amount must be 0–999, or empty.');if(key==='caster_level'&&(!Number.isInteger(safe[key])||safe[key]<1||safe[key]>99))bad('Caster level must be 1–99, or empty.');if(key==='lvl'&&(!Number.isInteger(safe[key])||safe[key]>(change.collection==='skills'?(totalClassLevel(characterClasses(data))||number(data.character_level||data.level)||1):9)))bad('Invalid ranks or spell level.');if(['amount','u_max','lvl'].includes(key)&&safe[key]<0)bad('Value cannot be negative.');}
    else if(key==='two_handed'&&['items','weapons'].includes(change.collection)&&typeof value==='boolean')safe[key]=value;
    else if(['equipped','cs','restoreOnLongRest','favorite'].includes(key)&&typeof value==='boolean')safe[key]=value;
    else if(key==='ability_mod'&&change.collection==='weapons'&&value==='auto')safe[key]=value;
    else if(['stat','ability_mod'].includes(key)&&abilities.includes(value))safe[key]=value;
    else bad('Invalid entry field.');
   }
   if(change.mode==='add'){
    if(rows.length>=1000||!safe.name?.trim())bad('Enter a name; maximum 1,000 entries per section.');rows.push(safe);
   }else {
     const updated={...rows[change.index],...safe};
     if(change.collection==='spells'&&Object.hasOwn(safe,'mp_cost'))for(const alias of ['mpCost','mp_amount','mpAmount'])delete updated[alias];
     if(['items','weapons'].includes(change.collection)){
       if(safe.equipped===false){updated.equip_slot='';}
       if(Object.hasOwn(safe,'amount')&&safe.amount<=0&&updated.equip_slot){
         updated.equip_slot='';updated.equipped=false;
       }
     }
     rows[change.index]=updated;
   }
  }
  data[change.collection]=rows;
  if(change.collection==='skills'&&Object.hasOwn(change.fields||{},'lvl')){const budget=skillBudget(data);if(budget.known&&budget.unused<0)bad('No skill points remaining.');if(data.rulesBuild)data.rulesBuild.input.skillRanks=data.skills.map(r=>Number(r.lvl||0));}
  if(change.mode==='update'&&change.collection==='activeAbilities'&&Object.hasOwn(change.fields||{},'u_curr')){const value=rows[change.index].u_curr,max=entryCalculations(rows[change.index],data,'activeAbilities').maxUses;if(!Number.isInteger(value)||value<0||value>max)bad('Remaining uses must be a whole number between 0 and maximum uses.');}
  if(change.mode==='update'&&['items','weapons'].includes(change.collection)&&change.fields?.two_handed===true){const selected=rows[change.index];if(selected.equipped!==false&&['hands','hand2'].includes(selected.equip_slot)){for(const {item} of equipmentRows(data))if(item!==selected&&['hands','hand2'].some(slot=>occupiesSlot(item,slot))){item.equip_slot='';item.equipped=false;}selected.equip_slot='hands';}}

 }else if(change.action==='equip'){
  if(typeof change.slot!=='string'||!equipmentSlotIds.includes(change.slot))bad('Invalid equipment slot.');
  const collection=change.collection??'items';if(!['items','weapons'].includes(collection))bad('Invalid equipment source.');
  const rows=Array.isArray(data[collection])?data[collection]:[];
  if(change.index!==null&&(!Number.isInteger(change.index)||change.index<0||change.index>=rows.length))bad('Choose an item from your inventory.');
  let selected=change.index===null?null:rows[change.index];
  if(selected&&(!String(selected.name||'').trim()||!Number.isFinite(Number(selected.amount??1))||Number(selected.amount??1)<1))bad('Only inventory items with quantity 1 or more can be equipped.');
  const targets=selected?.two_handed===true&&['hands','hand2'].includes(change.slot)?['hands','hand2']:[change.slot];
  if(selected&&Number(selected.amount??1)>1){if(rows.length>=1000)bad('Inventory is full; separate this stack before equipping.');rows.push({...selected,amount:Number(selected.amount)-1,equipped:false,equip_slot:''});selected.amount=1;}
  for(const {item} of equipmentRows(data))if(targets.some(slot=>occupiesSlot(item,slot))){item.equip_slot='';item.equipped=false;}
  if(selected){selected.equip_slot=selected.two_handed===true&&['hands','hand2'].includes(change.slot)?'hands':change.slot;selected.equipped=true;}
  data[collection]=rows;
 }else if(change.action==='damage'||change.action==='heal'){
  const amount=numeric(change.amount);if(amount<=0)bad('Enter a positive amount.');const current=sheetStats(data);
  if(change.action==='damage'){const absorbed=Math.min(Math.max(0,current.hpTemp),amount);data.hp_temp=current.hpTemp-absorbed;data.hp_curr=current.hp-(amount-absorbed);}
  else data.hp_curr=Math.min(current.hpMax,current.hp+amount);
 }else if(change.action==='cast'){
  // Compatibility for older open clients: casting never changes MP.
  if(!Number.isInteger(change.index)||!data.spells?.[change.index])bad('Entry not found.');
  return data;
 }else if(change.action==='useAbility'){
  const row=data.activeAbilities?.[change.index];if(!Number.isInteger(change.index)||!row)bad('Entry not found.');const calc=entryCalculations(row,data,'activeAbilities');
  if(calc.maxUses<=0)bad('Set maximum uses before spending a use.');if(calc.currentUses<=0)bad('No uses remaining.');if(!Number.isInteger(calc.currentUses))bad('Set whole remaining uses before using this ability.');row.u_curr=calc.currentUses-1;
 }else if(change.action==='spendMp'){
  const cost=numeric(change.amount),current=sheetStats(data).mp;if(cost<=0||cost>current)bad('Not enough MP, or invalid cost.');const temp=Math.min(Math.max(0,number(data.mp_temp)),Math.max(0,current)),taken=Math.min(temp,cost);data.mp_temp=temp-taken;data.mp=current-temp-(cost-taken);
 }else if(change.action==='rest'){
  const current=sheetStats(data),level=totalClassLevel(characterClasses(data))||number(data.character_level||data.level)||1;
  data.hp_curr=Math.min(current.hpMax,current.hp+Math.max(1,level));data.mp=current.mpMax;data.mp_temp=0;
  for(const row of data.activeAbilities||[])if(row.restoreOnLongRest!==false){const max=entryCalculations(row,data,'activeAbilities').maxUses;if(max>0)row.u_curr=max;}
 }else bad('Invalid sheet action.');
 updateManagedStats(data,original);
 if(data.rulesBuild)for(const key of ['activeAbilities','racialAbilities'])for(const row of data[key]||[]){if(!row.rulesOwned||!row.uses_formula)continue;const old=original[key]?.find(r=>r.sourceRuleId===row.sourceRuleId);if(!old||!abilities.some(k=>Number(data[k])!==Number(original[k])))continue;const before=entryCalculations(old,original,key),after=entryCalculations(row,data,key),spent=Math.max(0,before.maxUses-before.currentUses);row.u_max=after.maxUses;row.u_curr=Math.max(0,after.maxUses-spent);}
 const s=sheetStats(data);Object.assign(data,{hp_effective_max:s.hpMax,mp_curr:s.mp,mp_total_max:s.mpMax,mp_effective_max:s.mpMax,ac_total:s.ac,touch_ac_total:s.touch,flat_ac_total:s.flat,cmd_total:s.cmd,ar_total:s.melee,ar_ranged_total:s.ranged,ar_touch_total:s.touchAttack,ar_ranged_touch_total:s.rangedTouch,cmb:s.cmb,fort_bonus:s.fort,ref_bonus:s.ref,will_bonus:s.will});
 if(Buffer.byteLength(JSON.stringify(data))>500000)bad('Character data is too large.');
 return data;
}
