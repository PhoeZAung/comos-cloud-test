/** Compact tab layouts for weapon, spell and ability editors.
 * Field names remain exactly as stored in the character sheet.
 * All panels stay in the same form, so Save includes values from every tab.
 */
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

export function renderSheetEditorTabs(id,sections,{label='Editor tabs',className=''}={}){
 const tabs=sections.map((section,i)=>'<button type="button" role="tab" data-entry-edit-tab="'+esc(section.id)+'" id="cs-'+id+'-tab-'+esc(section.id)+'" aria-controls="cs-'+id+'-panel-'+esc(section.id)+'" aria-selected="'+(i===0)+'" tabindex="'+(i===0?'0':'-1')+'">'+esc(section.label)+'</button>').join('');
 const panels=sections.map((section,i)=>'<section role="tabpanel" id="cs-'+id+'-panel-'+esc(section.id)+'" aria-labelledby="cs-'+id+'-tab-'+esc(section.id)+'" tabindex="0" data-entry-edit-panel="'+esc(section.id)+'"'+(i?' hidden':'')+'><div class="cs-form-grid cs-editor-tab-fields">'+section.content+'</div></section>').join('');
 return '<div class="cs-item-editor cs-entry-tab-editor '+esc(className)+'" data-entry-tab-editor><div role="tablist" aria-label="'+esc(label)+'" class="cs-item-editor-tabs cs-entry-editor-tabs" data-entry-editor-tabs>'+tabs+'</div>'+panels+'</div>';
}
const makeGroup=(keys,render)=>(title,names,cls='')=>{
 const fields=names.filter(k=>keys.includes(k));
 return fields.length?'<fieldset class="cs-editor-group cs-tab-field-group '+cls+'"><legend>'+esc(title)+'</legend>'+fields.map(render).join('')+'</fieldset>':'';
};

export function renderWeaponEditorTabs(keys,render,{npc=false,category='Weapon'}={}){
 const group=makeGroup(keys,render);
 const ammo=category==='Ammunition',ranged=category==='Ranged Weapon';
 const basic=group('Basic Info',['sourceCategory','name','cost'])+
  '<details class="cs-weapon-advanced"><summary>Advanced Settings</summary><div class="cs-form-grid">'+
   group('Additional details',['rarity','weight',...(!ammo?['amount','two_handed']:[]),'carried','img','link'])+'</div></details>'+
  (keys.includes('desc')?'<div class="cs-ability-prose">'+render('desc')+'</div>':'');
 const damageTypes=group('Damage Type',['damage_types','damage_type_other'],'cs-weapon-damage-type-group');
 const stats=group('Attack',['attack_type','ability_mod','npcAttackBonus','attack_misc'])+
  group('Damage',['damage','damage_ability','damage_style','extra_damage','crit_range','crit_mult','dr_bypass'])+
  damageTypes+(ranged?group('Range',['range','misfire']):'');
 const ammunition=group('Ammunition',['ammoType','u_curr','u_max'],'cs-weapon-ammo-fields')+
  (!npc&&keys.includes('u_max')?'<output class="cs-ammo-summary" data-ammo-summary aria-live="polite"></output>':'');
 const ammoStats=group('Ammunition Stats',['amount','ammo_ar_bonus','ammo_dmg_bonus'])+damageTypes;
 const saves=group('Saving Throw',['saving_throw','save_type','save_success','save_dc_override'])+
  '<details class="cs-save-help"><summary>How weapon saves work</summary><p>In Owlbear, a weapon\'s on-hit saving throw is resolved by the GM. It does not replace the normal attack or damage roll. Record the save type, DC and outcome here.</p></details>';
 const sections=ammo?[
  {id:'details',label:'Basic Info',content:basic},
  {id:'ammo-stats',label:'Ammunition Stats',content:ammoStats}
 ]:[
  {id:'details',label:'Basic Info',content:basic},
  {id:'stats',label:'Weapon Stats',content:stats},
  {id:'ammunition',label:'Ammunition',content:ammunition},
  {id:'saves',label:'Saves',content:saves}
 ];
 return renderSheetEditorTabs('weapon',sections,{label:'Weapon editor sections',className:'cs-weapon-editor'});
}

export function renderAbilityEditorTabs(keys,render,{collection='activeAbilities'}={}){
 const group=makeGroup(keys,render);
 const detailFields=group('Ability',['name','lvl','sourceClass','school','type','ability_kind']);
 const effects=['desc','effect','at_higher_lvls'].filter(k=>keys.includes(k))
  .map(key=>'<section class="cs-ability-prose-card">'+render(key)+'</section>').join('');
 const details=detailFields+(effects?'<div class="cs-ability-prose cs-ability-prose-sections">'+effects+'</div>':'')+
  group('Reference',['link']);
 const combat=group('Action',['action_type','range','duration','target'])+
  group('Attack & Damage',['effect_type','attack_type','attack_misc','target_defense','attack_bonus_override','damage','damage_types']);
 const resources=group('Costs',['mp_cost','spell_failure'])+
  group('Uses',['uses_formula','u_curr','u_max','restoreOnLongRest'])+
  (()=>{const known=new Set(['name','lvl','school','type','ability_kind','desc','effect','at_higher_lvls','link','action_type','range','duration','target','effect_type','attack_type','attack_misc','target_defense','attack_bonus_override','damage','damage_types','saving_throw','save_type','save_success','save_success_damage','save_dc_override','dc_formula','casting_ability','dc_misc','caster_level','sr_bonus','spell_resist','mp_cost','spell_failure','uses_formula','u_curr','u_max','restoreOnLongRest']);return group('Other',keys.filter(k=>!known.has(k)));})();
 const saves=group('Target Save',['saving_throw','save_type','save_success','save_success_damage','save_dc_override','dc_formula','casting_ability','dc_misc','caster_level','sr_bonus','spell_resist'])+
  '<details class="cs-save-help"><summary>How saves work in Owlbear</summary><p>Select a target NPC with a Fortitude, Reflex or Will bonus. Choose the save type and what a successful save does. Use the calculated DC or enter one; the GM controls approval. Auto HP changes require a supported save outcome.</p></details>';
 return renderSheetEditorTabs('ability',[
  {id:'details',label:'Details',content:details},
  {id:'combat',label:'Combat',content:combat},
  {id:'saves',label:'Saves',content:saves},
  {id:'resources',label:'Resources',content:resources}
 ],{label:collection==='spells'?'Spell editor sections':'Ability editor sections',className:'cs-ability-editor cs-manual-ability-editor'});
}

/** One weapon attack consumes one tracked round. Zero max means untracked ammo.
 * This is a display/validation helper; server rules still own deductions.
 */
export function weaponAmmoStatus(current,max){
 const rawCurrent=String(current??'').trim(),rawMax=String(max??'').trim();
 const total=rawMax===''?0:Number(rawMax);
 const count=rawCurrent===''?0:Number(rawCurrent);
 if(!Number.isSafeInteger(total)||total<0)return {valid:false,message:'Max Ammo must be a whole number of at least 0.'};
 if(!Number.isSafeInteger(count)||count<0)return {valid:false,message:'Ammo must be a whole number of at least 0.'};
 if(count>total)return {valid:false,message:'Ammo cannot exceed Max Ammo.'};
 return {valid:true,current:count,max:total,limited:total>0,label:total?count+' / '+total:'Not tracked'};
}
