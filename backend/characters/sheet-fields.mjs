import {randomUUID} from 'node:crypto';
import {npcStatLabels,npcTextLabels} from '../../src/features/characters/npc-stat-block.mjs';
import {abilityGroup,abilityUsageGroup,abilityCollections,abilityLayout} from '../../src/features/sheet/ability-groups.mjs';
import {actionTypes,damageTypes} from '../../src/features/sheet/entry-options.mjs';
import {abilityKinds,srModes} from '../../src/features/sheet/pathfinder-defenses.mjs';
import {effectTypes} from '../../src/features/sheet/effect-types.mjs';
import {updateGunbreakerAmmo,syncGunbreakerAmmo,gunbreakerAmmoAbilityCost,MAGICKED_AMMO_ID} from '../../src/features/characters/rules/gunbreaker-ammo.mjs';
import {addRuleAbility} from '../../src/features/characters/rules/ability-library.mjs';
import {addManualSourceAbilities} from '../../src/features/characters/rules/manual-source-library.mjs';
import {isLimitBreak,syncLimitBreaks,spendLimitBreak} from '../../src/features/sheet/limit-breaks.mjs';
import {restRecovery} from '../../src/features/sheet/recovery.mjs';
import {skillBudget} from '../../src/features/sheet/skill-budget.mjs';
import {ITEM_TAG_OPTIONS} from '../../src/features/sheet/item-categories.mjs';
import {updateManagedStats} from '../../src/features/characters/managed-stats.mjs';
import {sheetSkills,skillSupportsSpecialization} from '../../src/features/sheet/skills.mjs';
import {itemEditableColumns,inventoryEditorKeys,inventoryEditorFields,inventoryFieldLabel,usableItemImageUrl,normalizeInventoryText} from '../../src/features/sheet/inventory-fields.mjs';
import {entryCalculations,weaponDamageAbilities,weaponDamageStyles} from '../../src/features/sheet/calculations.mjs';
import {characterClasses,totalClassLevel} from '../../src/features/characters/ffd20.mjs';
import {sheetStats,abilities,sizes,number} from '../../src/features/sheet/model.mjs';
import {isEquipmentSlot,equipmentRows,occupiesSlot} from '../../src/features/sheet/equipment.mjs';
export const numericFields=[...abilities,'hp_curr','hp_temp','hp_max','hp_max_temp','mp','mp_curr','mp_temp','mp_class','mp_bonus','mp_max','mp_total_max','mp_max_temp','mp_max_spell_level','init_temp','bab','bab_temp','speed_mod','speed_burrow','speed_climb','speed_fly','speed_swim','ac_armor','ac_natural','ac_deflect','ac_dodge','ac_temp','touch_temp','flat_temp','cmd_temp','ar_melee_temp','ar_ranged_temp','ar_touch_temp','ar_ranged_touch_temp','cmb_temp','fort_base','fort_enhance','fort_temp','ref_base','ref_enhance','ref_temp','will_base','will_enhance','will_temp','currency_gil','currency_moogle','slot_cap','capacity_modifier'];
const booleanFields=['hp_favorite','mp_favorite','sheet_background_enabled'];
const textFields=['languages','senses','resistances','proficiencies','favored_class_options','notesArea'];
const enumFields={uncanny_dodge:['auto','on','off'],size_category:sizes,capacity_body_type:['biped','quadruped'],speed_fly_maneuverability:['','clumsy','poor','average','good','perfect'],spell_dc_base:abilities,ar_melee_ability:abilities,ar_ranged_ability:abilities,ar_touch_ability:abilities,ar_ranged_touch_ability:abilities};
export const collections=['items','weapons','spells','activeAbilities','passiveAbilities','racialAbilities','feats','skills'];
const entryText=['name','desc','effect','misfire','damage','range','type','crit_range','crit_mult','attack_type','duration','target','saving_throw','school','spell_resist','at_higher_lvls','subName','dc_formula','uses_formula','casting_ability','extra_damage','ability_kind','dr_bypass'];
const entryNumber=['amount','u_curr','u_max','lvl','temp','attack_misc','dc_misc','mp_adjustment','caster_level','mp_cost','sr_bonus'];
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const bad=message=>{throw Error(message);};
function numeric(v){if(!['string','number'].includes(typeof v)||v===''||!Number.isFinite(Number(v))||Math.abs(Number(v))>100000000)bad('Enter a valid number.');return Number(v);}
function text(v,max=12000,label='Text'){if(typeof v!=='string'||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v))bad(label+' is too long (limit '+max+' characters) or contains invalid characters.');return v;}
export function mergeSheetData(original,change,{npc=false}={}){
 const data=structuredClone(original);
 if(change.action==='npcStats'){
  if(!npc||!plain(change.fields)||Object.keys(change.fields).some(key=>!Object.hasOwn(npcStatLabels,key)))bad('Invalid NPC stats.');
  data.npcStats??={};
  for(const [key,value] of Object.entries(change.fields)){
   if(value===''){delete data.npcStats[key];if(abilities.includes(key))delete data[key];continue;}
   const score=numeric(value);
   if(Math.abs(score)>100000||key!=='cr'&&!Number.isInteger(score))bad('Enter a valid '+npcStatLabels[key]+' value.');
   data.npcStats[key]=score;
   if(abilities.includes(key))data[key]=score;
  }
  return data;
 }
 if(change.action==='npcText'){
  if(!npc||!plain(change.fields)||Object.keys(change.fields).some(key=>!Object.hasOwn(npcTextLabels,key)))bad('Invalid NPC details.');
  data.npcText??={};
  for(const [key,value] of Object.entries(change.fields))data.npcText[key]=text(value,4000,npcTextLabels[key]);
  return data;
 }
 if(change.action==='placeAbility'){
  const collection=change.collection;
  if(!abilityCollections.includes(collection))bad('Choose an ability category.');
  const rows=data[collection]||[],groups=(data.abilityGroups||[]).filter(g=>g.collection===collection);
  const resolve=ref=>{
   if(!plain(ref))bad('Invalid ability position.');
   if(typeof ref.groupId==='string'){const group=groups.find(g=>g.id===ref.groupId);if(!group)bad('Group no longer exists.');return {group};}
   if(!Number.isInteger(ref.index)||!rows[ref.index]||isLimitBreak(rows[ref.index]))bad('Ability no longer exists.');
   return {row:rows[ref.index],index:ref.index};
  };
  const source=resolve(change.source),target=change.before===null?null:resolve(change.before),destination=change.groupId;
  if(typeof destination!=='string'||destination&&!groups.some(g=>g.id===destination))bad('Group no longer exists.');
  if(source.group&&destination)bad('Groups cannot be nested.');
  if(target&&(destination?(target.group||abilityGroup(data,target.row,collection)?.id!==destination):target.row&&abilityGroup(data,target.row,collection)))bad('Invalid destination.');
  if(target&&(source.group&&source.group===target.group||source.row&&source.row===target.row))bad('Choose another position.');
  const beforeLayout=abilityLayout(data,collection);
  for(const row of rows)row.abilityLayoutId??=randomUUID();
  const key=entry=>entry.group?'group:'+entry.group.id:'ability:'+entry.row.abilityLayoutId;
  const order=beforeLayout.map(key).filter(k=>k!==key(source));
  if(source.row){
   if(destination)source.row.abilityGroupId=destination;else delete source.row.abilityGroupId;
   if(destination){
    rows.splice(rows.indexOf(source.row),1);
    const at=target?rows.indexOf(target.row):rows.length;rows.splice(at,0,source.row);
   }
  }
  if(!destination){const at=target?order.indexOf(key(target)):order.length;if(at<0)bad('Invalid destination.');order.splice(at,0,key(source));}
  data.abilityOrder={...data.abilityOrder,[collection]:order};
 }else if(change.action==='abilityGroup'){
  if(!abilityCollections.includes(change.collection))bad('Choose an ability category.');
  data.abilityGroups??=[];
  const groups=data.abilityGroups,group=groups.find(g=>g.id===change.id&&g.collection===change.collection);
  if(change.mode==='move'){
   const row=data[change.collection]?.[change.index];
   if(!Number.isInteger(change.index)||!row||isLimitBreak(row))bad('This ability uses its own special pool.');
   if(change.id!==''&&!group)bad('Group no longer exists.');
   if(group)row.abilityGroupId=group.id;else delete row.abilityGroupId;
  }else if(change.mode==='remove'){
   if(!group)bad('Group no longer exists.');
   data.abilityGroups=groups.filter(g=>g!==group);
   for(const row of data[change.collection]||[])if(row.abilityGroupId===group.id)delete row.abilityGroupId;
  }else if(['add','update'].includes(change.mode)){
   if(change.mode==='update'&&!group)bad('Group no longer exists.');
   if(change.mode==='add'&&groups.length>=100)bad('Maximum 100 groups.');
   const f=change.fields;
   if(!plain(f)||Object.keys(f).some(k=>!['name','u_curr','u_max','restoreOnLongRest'].includes(k)))bad('Invalid group fields.');
   const name=text(f.name,120).trim(),max=numeric(f.u_max),current=numeric(f.u_curr);
   if(!name||!Number.isInteger(max)||!Number.isInteger(current)||max<0||current<0||current>max||typeof f.restoreOnLongRest!=='boolean')bad('Enter a name and whole uses between zero and maximum.');
   const fields={name,u_max:max,u_curr:current,restoreOnLongRest:f.restoreOnLongRest};
   if(group)Object.assign(group,fields);else groups.push({id:randomUUID(),collection:change.collection,...fields});
  }else bad('Invalid group action.');
 }else if(change.action==='fields'){
  if(!plain(change.fields)||!Object.keys(change.fields).length||Object.keys(change.fields).length>90)bad('Invalid sheet fields.');
  for(const [key,value] of Object.entries(change.fields)){
   if(key==='mp_max_spell_level'||data.rulesBuild&&['hp_max','mp_class','mp_bonus','bab'].includes(key))bad('This base value is calculated by class progression.');
   if(key==='favorite_boxes'){if(!Array.isArray(value)||value.length>12||value.some(v=>!['ability-scores','identity','proficiencies','bio','skills','inventory','equipment','notes','saving-throws','resistances','offense','defense'].includes(v)))bad('Invalid favorite box.');data.favorite_boxes=[...new Set(value)];continue;}
   if(key==='speed')bad('Base land speed is calculated from the race. Edit Speed Mod instead.');
   if(numericFields.includes(key)){data[key]=numeric(value);if(['speed_burrow','speed_climb','speed_fly','speed_swim'].includes(key)&&(!Number.isInteger(data[key])||data[key]<0||data[key]>10000))bad('Movement speeds must be whole numbers from 0 to 10,000 feet.');if(['currency_gil','currency_moogle','slot_cap'].includes(key)&&(!Number.isSafeInteger(data[key])||data[key]<(key==='slot_cap'?1:0)))bad('Currency and capacity must be nonnegative whole numbers; capacity must be at least 1.');if(key==='speed_mod'&&(!Number.isInteger(data[key])||Math.abs(data[key])>10000))bad('Speed Mod must be a whole number within -10,000 to +10,000 feet.');if(key==='capacity_modifier'&&Math.abs(data[key])>1000000)bad('Capacity modifier must be between -1,000,000 and +1,000,000 lb.');if(key==='hp_temp')data[key]=Math.max(0,data[key]);if(abilities.includes(key)&&(data[key]<0||data[key]>999))bad('Ability score must be 0–999.');}
   else if(booleanFields.includes(key)&&typeof value==='boolean')data[key]=value;
   else if(textFields.includes(key))data[key]=text(value);
   else if(Object.hasOwn(enumFields,key)&&enumFields[key].includes(value))data[key]=value;
   else bad('Invalid sheet field.');
  }
  if(Object.hasOwn(change.fields,'size_category'))data.size=data.size_category;
  if(Object.hasOwn(change.fields,'currency_gil'))data.gil=data.currency_gil;
  if(Object.hasOwn(change.fields,'mp_curr')&&!Object.hasOwn(change.fields,'mp')){if(data.mp_curr<0)bad('MP cannot be negative.');data.mp_temp=Math.min(Math.max(0,number(data.mp_temp)),data.mp_curr);data.mp=data.mp_curr-data.mp_temp;}
 }else if(change.action==='gunbreakerAmmo'){
  updateGunbreakerAmmo(data,change);
 }else if(change.action==='addManualSourceAbilities'){
  addManualSourceAbilities(data,change.picks);
 }else if(change.action==='addRuleAbility'){
  if(typeof change.ruleId!=='string'||change.ruleId.length>250)bad('Choose an ability.');addRuleAbility(data,change.ruleId);
 }else if(change.action==='reorderAbility'){
   const allowed=['activeAbilities','passiveAbilities','racialAbilities','feats'];
   if(!allowed.includes(change.collection)||!Number.isInteger(change.from)||!Number.isInteger(change.to))bad('Choose an ability and a valid destination.');
   const rows=data[change.collection];
   if(!Array.isArray(rows)||change.from<0||change.from>=rows.length||change.to<0||change.to>=rows.length||isLimitBreak(rows[change.from]))bad('Cannot reorder this ability.');
   const [entry]=rows.splice(change.from,1);rows.splice(change.to,0,entry);
  }else if(change.action==='entry'){
  if(!(collections.includes(change.collection)||npc&&change.collection==='npcSkills')||!['add','update','remove'].includes(change.mode))bad('Invalid sheet entry.');
  const rows=change.collection==='skills'?sheetSkills(data):Array.isArray(data[change.collection])?data[change.collection]:[];
  if(change.collection==='skills'){if(change.mode!=='update'||Object.keys(change.fields||{}).some(k=>!['lvl','temp','cs','subName','favorite'].includes(k)))bad('Skills are fixed. Edit ranks, class skill, misc or specialization.');data.skills=sheetSkills(data);}
  if(change.mode!=='add'&&(!Number.isInteger(change.index)||change.index<0||change.index>=rows.length))bad('Entry no longer exists.');
  if(change.collection==='skills'&&Object.hasOwn(change.fields||{},'subName')&&!skillSupportsSpecialization(rows[change.index]?.name))bad('Only Craft, Profession and Perform can have a specialization.');
  if(change.mode==='remove')rows.splice(change.index,1);
  else{
   if(!plain(change.fields)||!Object.keys(change.fields).length||Object.keys(change.fields).length>30)bad('Invalid entry fields.');
   if(change.collection==='items'){
    const currentCategory=change.fields.sourceCategory??rows[change.index]?.sourceCategory??'Misc',allowed=new Set([...inventoryEditorKeys(currentCategory),'favorite','equipped']);
    if(Object.keys(change.fields).some(key=>!allowed.has(key)))bad('That field is not available for this inventory tag.');
   }
   if(change.mode==='update'&&data.gunbreakerAmmo!==undefined&&rows[change.index].rulesOwned&&rows[change.index].sourceRuleId===MAGICKED_AMMO_ID&&Object.keys(change.fields).some(k=>['u_curr','u_max','uses_formula','restoreOnLongRest'].includes(k)))bad('Use the gun arm ammunition tracker to change these rounds.');
   if(change.mode==='update'&&isLimitBreak(rows[change.index])&&Object.keys(change.fields).some(k=>['u_curr','u_max','uses_formula','restoreOnLongRest'].includes(k)))bad('Limit Break usage is shared and calculated.');
   if(change.mode==='update'&&abilityGroup(data,rows[change.index],change.collection)&&Object.keys(change.fields).some(k=>['u_curr','u_max','uses_formula','restoreOnLongRest'].includes(k)))bad('Edit usage on the shared ability group.');
   const safe={};
   for(const [key,value] of Object.entries(change.fields)){
   if(key==='mp_max_spell_level'||data.rulesBuild&&['hp_max','mp_class','mp_bonus','bab'].includes(key))bad('This base value is calculated by class progression.');
   if(key==='favorite_boxes'){if(!Array.isArray(value)||value.length>12||value.some(v=>!['ability-scores','identity','proficiencies','bio','skills','inventory','equipment','notes','saving-throws','resistances','offense','defense'].includes(v)))bad('Invalid favorite box.');data.favorite_boxes=[...new Set(value)];continue;}
    if(key==='damage_types'&&['weapons','spells','activeAbilities','passiveAbilities','racialAbilities','feats'].includes(change.collection)){if(!Array.isArray(value)||value.length>damageTypes.length||value.some(v=>!damageTypes.includes(v)))bad('Choose valid damage types.');safe[key]=[...new Set(value)];}
    else if(change.collection==='weapons'&&!npc&&key==='damage_ability'){
     if(!weaponDamageAbilities.includes(value))bad('Choose a damage ability.');
     safe[key]=value;
    }else if(change.collection==='weapons'&&!npc&&key==='damage_style'){
     if(typeof value!=='string'||!Object.hasOwn(weaponDamageStyles,value))bad('Choose a weapon damage style.');
     safe[key]=value;
    }else if(key==='action_type'&&['activeAbilities','passiveAbilities','racialAbilities','feats'].includes(change.collection)){if(value!==''&&!actionTypes.includes(value))bad('Choose a valid action type.');safe[key]=value;}
    else if(key==='ability_kind'&&['activeAbilities','passiveAbilities','racialAbilities','feats'].includes(change.collection)){
     if(typeof value!=='string'||!Object.hasOwn(abilityKinds,value))bad('Choose a valid spell-like, supernatural or extraordinary ability category.');
     safe[key]=value;
    }
    else if(key==='effect_type'&&['spells','activeAbilities','passiveAbilities','racialAbilities','feats'].includes(change.collection)){
     if(typeof value!=='string'||!Object.hasOwn(effectTypes,value))bad('Choose a valid HP effect type.');
     safe[key]=value;
    }
    else if(key==='spell_failure'&&change.collection==='spells'){
     if(value==='')safe[key]='';
     else{const chance=numeric(value);if(!Number.isInteger(chance)||chance<0||chance>100)bad('Spell failure must be a whole percentage from 0 to 100.');safe[key]=chance;}
    }
    else if(npc&&(key==='npcAttackBonus'&&change.collection==='weapons'||key==='bonus'&&change.collection==='npcSkills')){
     const bonus=numeric(value);
     if(!Number.isInteger(bonus)||Math.abs(bonus)>100000)bad('Enter a whole roll bonus.');
     safe[key]=bonus;
    }else if(key==='sourceCategory'&&change.collection==='items'&&ITEM_TAG_OPTIONS.includes(value))safe.sourceCategory=value;
    else if(key==='weight'&&['items','weapons'].includes(change.collection)){
      const weight=typeof value==='number'?value:typeof value==='string'&&value.trim()?Number.parseFloat(value):0;
      if(Number.isFinite(weight)&&weight>=0&&weight<=1000000)safe.weight=weight;
     }
    else if(key==='img'&&change.collection==='items')safe.img=usableItemImageUrl(value);
     else if(itemEditableColumns.includes(key)&&change.collection==='items'&&key!=='amount')safe[key]=normalizeInventoryText(value,key);
    else if(key==='link'&&['spells','activeAbilities','passiveAbilities','racialAbilities','feats'].includes(change.collection)){
      safe.link=text(value,2048);
      if(safe.link){try{const url=new URL(safe.link);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)bad('Link must be an http or https URL.');}
       catch{bad('Link must be a valid http or https URL.');}}
     }
     else if(entryText.includes(key)){if(key==='casting_ability'&&!abilities.includes(value))bad('Choose a casting ability.');safe[key]=change.collection==='items'&&key==='desc'?normalizeInventoryText(value,key):text(value,key==='name'?120:key==='desc'&&['activeAbilities','passiveAbilities','racialAbilities','feats','spells'].includes(change.collection)?100000:12000,key==='desc'?'Description':key);if(key==='crit_range'&&safe[key]&&!/^(?:20|(?:[1-9]|1[0-9])-20)$/.test(safe[key]))bad('Choose a critical range.');if(key==='crit_mult'&&safe[key]&&!/^x[2-5]$/.test(safe[key]))bad('Choose a critical multiplier.');if(key==='name'&&!safe[key].trim())bad('Enter a name.');}
    else if(entryNumber.includes(key)){if(['mp_cost','caster_level'].includes(key)&&value===''){safe[key]='';continue;}safe[key]=numeric(value);if(['u_curr','u_max'].includes(key)&&(!Number.isInteger(safe[key])||safe[key]<0))bad('Uses must be nonnegative whole numbers.');if(key==='mp_cost'&&(!Number.isInteger(safe[key])||safe[key]<0||safe[key]>999))bad('MP amount must be 0–999, or empty.');if(key==='caster_level'&&(!Number.isInteger(safe[key])||safe[key]<1||safe[key]>99))bad('Caster level must be 1–99, or empty.');if(key==='lvl'&&(!Number.isInteger(safe[key])||safe[key]>(change.collection==='skills'?(totalClassLevel(characterClasses(data))||number(data.character_level||data.level)||1):9)))bad('Invalid ranks or spell level.');if(['amount','u_max','lvl'].includes(key)&&safe[key]<0)bad('Value cannot be negative.');}
    else if(key==='two_handed'&&['items','weapons'].includes(change.collection)&&typeof value==='boolean')safe[key]=value;
    else if(['equipped','cs','restoreOnLongRest','favorite','carried'].includes(key)&&typeof value==='boolean')safe[key]=value;
    else if(key==='ability_mod'&&change.collection==='weapons'&&['auto','none'].includes(value))safe[key]=value;
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
       if(change.collection==='items'&&!inventoryEditorFields(updated.sourceCategory).allowTwoHanded)updated.two_handed=false;
       if(Object.hasOwn(safe,'amount')&&safe.amount<=0&&updated.equip_slot){
         updated.equip_slot='';updated.equipped=false;
       }
     }
     rows[change.index]=updated;
   }
  }
  data[change.collection]=rows;
  if(change.mode!=='remove'&&['weapons','activeAbilities','passiveAbilities','racialAbilities','feats'].includes(change.collection)&&Object.keys(change.fields||{}).some(k=>['u_curr','u_max'].includes(k))){const selected=change.mode==='add'?rows[rows.length-1]:rows[change.index],max=entryCalculations(selected,data,change.collection).maxUses;if(selected.u_curr!==undefined&&selected.u_curr>max)bad('Remaining uses cannot exceed maximum uses.');}
  if(change.collection==='skills'&&Object.hasOwn(change.fields||{},'lvl')){if(data.rulesBuild&&data.skills[change.index].lvl<Number(original.rulesBuild.rankFloor?.[change.index]??original.rulesBuild.input.skillRanks?.[change.index]??0))bad('Confirmed skill ranks cannot be reduced.');const budget=skillBudget(data);if(budget.known&&budget.unused<0)bad('No skill points remaining.');if(data.rulesBuild)data.rulesBuild.input.skillRanks=data.skills.map(r=>Number(r.lvl||0));}
  if(change.mode==='update'&&['activeAbilities','passiveAbilities','racialAbilities','feats'].includes(change.collection)&&Object.hasOwn(change.fields||{},'uses_formula')){const before=entryCalculations(original[change.collection][change.index],original,change.collection),after=entryCalculations(rows[change.index],data,change.collection);rows[change.index].u_curr=Math.max(0,after.maxUses-Math.max(0,before.maxUses-before.currentUses));}
  if(change.mode==='update'&&change.collection==='activeAbilities'&&Object.hasOwn(change.fields||{},'u_curr')){const value=rows[change.index].u_curr,max=entryCalculations(rows[change.index],data,'activeAbilities').maxUses;if(!Number.isInteger(value)||value<0||value>max)bad('Remaining uses must be a whole number between 0 and maximum uses.');}
  if(change.mode==='update'&&['items','weapons'].includes(change.collection)&&change.fields?.two_handed===true){const selected=rows[change.index];if(selected.equipped!==false&&['hands','hand2'].includes(selected.equip_slot)){for(const {item} of equipmentRows(data))if(item!==selected&&['hands','hand2'].some(slot=>occupiesSlot(item,slot))){item.equip_slot='';item.equipped=false;}selected.equip_slot='hands';}}

 }else if(change.action==='equip'){
  if(typeof change.slot!=='string'||!isEquipmentSlot(change.slot))bad('Invalid equipment slot.');
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
  }else if(change.action==='useWeapon'){
   if(!Number.isInteger(change.index)||!data.weapons?.[change.index])bad('Weapon not found.');
   const row=data.weapons[change.index],calc=entryCalculations(row,data,'weapons');
   if(!row.uses_formula&&calc.maxUses<=0)bad('This weapon does not track limited uses.');
   if(calc.maxUses<=0||calc.currentUses<=0)bad('No weapon uses remaining.');
   if(!Number.isInteger(calc.currentUses))bad('Set whole remaining weapon uses first.');
   row.u_curr=calc.currentUses-1;
  }else if(change.action==='useAbility'){
  const collection=change.collection||'activeAbilities';if(!['activeAbilities','passiveAbilities','racialAbilities','feats'].includes(collection))bad('Invalid ability.');const row=data[collection]?.[change.index];if(!Number.isInteger(change.index)||!row)bad('Entry not found.');if(isLimitBreak(row)){spendLimitBreak(data);}else if(!abilityGroup(data,row,collection)&&gunbreakerAmmoAbilityCost(data,row)){updateGunbreakerAmmo(data,{operation:'spend',rounds:gunbreakerAmmoAbilityCost(data,row)});}else{const calc=entryCalculations(row,data,collection);
  if(calc.maxUses<=0)bad(row.uses_formula?'No uses remaining.':'Set usage before spending a use.');if(calc.currentUses<=0)bad('No uses remaining.');if(!Number.isInteger(calc.currentUses))bad('Set whole remaining uses before using this ability.');const pool=abilityUsageGroup(data,row,collection)||row;pool.u_curr=calc.currentUses-1;}
 }else if(change.action==='spendMp'){
  const cost=numeric(change.amount),current=sheetStats(data).mp;if(cost<=0||cost>current)bad('Not enough MP, or invalid cost.');const temp=Math.min(Math.max(0,number(data.mp_temp)),Math.max(0,current)),taken=Math.min(temp,cost);data.mp_temp=temp-taken;data.mp=current-temp-(cost-taken);
 }else if(change.action==='rest'){
  const current=sheetStats(data),level=totalClassLevel(characterClasses(data))||number(data.character_level||data.level)||1;
  if(data.limitBreakPool||['activeAbilities','passiveAbilities','racialAbilities','feats'].some(k=>data[k]?.some(isLimitBreak)))data.limitBreakPool={spent:0};const recovery=restRecovery(data);data.hp_curr=Math.min(current.hpMax,current.hp+recovery.hp);data.mp=Math.min(current.mpMax,Math.max(0,current.mp-Math.max(0,number(data.mp_temp)))+recovery.mp);data.mp_temp=0;
  for(const collection of ['activeAbilities','passiveAbilities','racialAbilities','feats'])for(const row of data[collection]||[]){if(row.restoreOnLongRest===false||isLimitBreak(row))continue;if(abilityGroup(data,row,collection))continue;const max=entryCalculations(row,data,collection).maxUses;if(max>0)row.u_curr=max;}
  for(const group of data.abilityGroups||[])if(group.restoreOnLongRest!==false)group.u_curr=group.u_max;
   // Weapon/ammunition uses are intentionally not restored by this action.
 }else bad('Invalid sheet action.');
 syncGunbreakerAmmo(data);
 syncLimitBreaks(data);
 updateManagedStats(data,original);
 if(data.rulesBuild)for(const key of ['activeAbilities','racialAbilities'])for(const row of data[key]||[]){if(!row.rulesOwned||!row.uses_formula)continue;const old=original[key]?.find(r=>r.sourceRuleId===row.sourceRuleId);if(!old||!abilities.some(k=>Number(data[k])!==Number(original[k])))continue;const before=entryCalculations(old,original,key),after=entryCalculations(row,data,key),spent=Math.max(0,before.maxUses-before.currentUses);row.u_max=after.maxUses;row.u_curr=Math.max(0,after.maxUses-spent);}
 syncGunbreakerAmmo(data);
 const s=sheetStats(data);Object.assign(data,{hp_effective_max:s.hpMax,mp_curr:s.mp,mp_total_max:s.mpMax,mp_effective_max:s.mpMax,ac_total:s.ac,touch_ac_total:s.touch,flat_ac_total:s.flat,cmd_total:s.cmd,ar_total:s.melee,ar_ranged_total:s.ranged,ar_touch_total:s.touchAttack,ar_ranged_touch_total:s.rangedTouch,cmb:s.cmb,fort_bonus:s.fort,ref_bonus:s.ref,will_bonus:s.will});
 if(Buffer.byteLength(JSON.stringify(data))>500000)bad('Character data is too large.');
 return data;
}
