import {SHOP_SOURCES,shopSourceForItem} from '../features/sheet/shop-sources.mjs';
import {sourceCategorySuggestions} from '../features/sheet/source-categories.mjs';
import {npcStatLabels,npcTextLabels,npcStatGroups,npcTextGroups} from '../features/characters/npc-stat-block.mjs';
import {effectTypes,effectType} from '../features/sheet/effect-types.mjs';
import {combatVerdict} from '../features/sheet/combat-verdict.mjs';
import {saveTypes,saveOutcomes} from '../features/sheet/save-rules.mjs';
import {abilityKinds,srModes} from '../features/sheet/pathfinder-defenses.mjs';
import {abilityGroup} from '../features/sheet/ability-groups.mjs';
import {isLimitBreak} from '../features/sheet/limit-breaks.mjs';
import {baseLandSpeed} from '../features/sheet/movement.mjs';
import {actionTypes,actionType,damageTypes,selectedDamageTypes} from '../features/sheet/entry-options.mjs';
import {mountHoldButton,confirmCharacterDelete,crumpleSheet} from './sheet-delete.mjs';
import {mountNotesElectric} from './sheet-notes-electric.mjs';
import {openInventoryPicker,openCharacterPicker} from './sheet-pickers.mjs';
import {createSheetTabs,sheetTabURL} from './sheet-tabs.mjs';
import {mountSheetSettings} from './sheet-settings.mjs';
import {sheetLoading} from './sheet-loading.mjs';
import {MAGICKED_AMMO_ID} from '../features/characters/rules/gunbreaker-ammo.mjs';
import {notify,showDice,clearFeedback} from './feedback.mjs';
import {processPicture} from './character-view.mjs';
import {preferences} from './preferences.mjs';
import {recordId} from './record-id.mjs';
import {ITEM_TAG_OPTIONS,SHOP_ITEM_CATEGORY_GROUPS,itemCategoryForItem,itemCategorySymbol,inventoryCategoryCounts,visibleInventoryCategory} from '../features/sheet/item-categories.mjs';
import {spellLevel,damageTypeLine,weaponDamageAbilities,weaponDamageStyles,weaponDamageFormulas} from '../features/sheet/calculations.mjs';
import {inventoryEditorFields,inventoryEditorKeys,inventoryFieldLabel,inventoryItemDetails,inventoryItemValue,inventorySourceFields,usableItemImageUrl,normalizeInventoryText} from '../features/sheet/inventory-fields.mjs';
import {sheetSkills,skillSupportsSpecialization,skillCanRoll,skillDisplayName} from '../features/sheet/skills.mjs';
import {abilities,sizes,number,modifier,sheetStats,attackType,attackTypes,weaponAttackParts,weaponDefaultAbilities} from '../features/sheet/model.mjs';
import {applyRichFormat,formatSheetText} from '../features/sheet/rich-text.mjs';
import {escape as e,sections,renderCombatDetails,renderSheetFrame,renderSection,renderSpeedDetails,collectionBlock,renderSkillRows,entryDetail,titles,abilityTabs} from '../features/sheet/view.mjs';
import {isEquipmentSlot,equippedInSlot,renderEquipChoices} from '../features/sheet/equipment.mjs';
const groupFields={
 abilities:['str','dex','con','int','wis','cha'],identity:['size_category','languages','senses','speed_mod','speed_burrow','speed_climb','speed_fly','speed_swim'],
 resources:['hp_curr','hp_temp','hp_max_temp','mp_curr','mp_temp','mp_max_temp'],hp:['hp_curr','hp_temp','hp_max_temp'],mp:['mp_curr','mp_temp','mp_max_temp'],
 defense:['ac_armor','ac_natural','ac_deflect','ac_dodge','ac_temp','touch_temp','flat_temp','cmd_temp','uncanny_dodge'],
 attack:['init_temp','bab_temp','ar_melee_ability','ar_melee_temp','ar_ranged_ability','ar_ranged_temp','ar_touch_ability','ar_touch_temp','ar_ranged_touch_ability','ar_ranged_touch_temp','cmb_temp'],
 saves:['fort_base','fort_enhance','fort_temp','ref_base','ref_enhance','ref_temp','will_base','will_enhance','will_temp'],resistances:['resistances'],proficiencies:['proficiencies','favored_class_options'],currency:['currency_gil','currency_moogle'],capacity:['capacity_modifier','capacity_body_type'],spell:['spell_dc_base']
};
const labels={uncanny_dodge:'Uncanny Dodge',spell_failure:'Armor spell failure override (%)',npcAttackBonus:'Attack bonus',bonus:'Skill bonus',two_handed:'Two-handed (reserves both hands)',mp_cost:'MP Amount (blank = spell level)',casting_ability:'Casting ability',caster_level:'Caster level override',dc_misc:'Save DC adjustment',mp_adjustment:'MP cost adjustment',save_dc_override:'Save DC override (exact value)',attack_bonus_override:'Total attack bonus override',dc_formula:'Save DC formula',uses_formula:'Usage formula',damage:'Dice Roll',str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma',size_category:'Size',speed_mod:'Speed Mod (ft)',speed_burrow:'Burrow (ft)',speed_climb:'Climb (ft)',speed_fly:'Fly (ft)',speed_swim:'Swim (ft)',hp_curr:'Current HP',hp_temp:'Temporary HP',hp_max:'Base maximum HP',hp_max_temp:'Maximum HP adjustment',mp_curr:'Current MP (including temp)',mp_temp:'Temporary MP',mp_class:'Class MP',mp_bonus:'Bonus MP',mp_max_temp:'Maximum MP adjustment',init_temp:'Initiative misc',bab:'Base attack bonus',bab_temp:'BAB adjustment',ac_armor:'Manual Armor (fallback without equipped armor)',ac_natural:'Natural armor',ac_deflect:'Deflection',ac_dodge:'Dodge',ac_temp:'AC adjustment',touch_temp:'Touch adjustment',flat_temp:'Flat-footed adjustment',cmd_temp:'CMD adjustment',cmb_temp:'CMB adjustment',currency_gil:'Gil',currency_moogle:'Moogle',slot_cap:'Legacy capacity',capacity_modifier:'Capacity modifier (lb, +/-)',capacity_body_type:'Body type',carried:'Carried (counts toward weight)',weight:'Weight (lb)',spell_dc_base:'Spell ability',mp_max_spell_level:'Maximum spell level',desc:'Description',effect:'Effect',save_type:'Saving throw',save_success:'Successful save',save_success_damage:'Alternate successful-save damage',ability_kind:'Ability category',dr_bypass:'DR bypass properties',sr_bonus:'Spell penetration bonus',favored_class_options:'Favored class options',link:'Link (URL)',action_type:'Action type',damage_types:'Damage Type',misfire:'Misfire',u_curr:'Uses',u_max:'Max Usage',lvl:'Level / ranks',cs:'Class skill',temp:'Misc bonus',subName:'Specialization',stat:'Ability',ability_mod:'Ability Mod',extra_damage:'Extra damage (not multiplied on crit)',attack_misc:'Attack bonus',restoreOnLongRest:'Restore uses on rest',amount:'Quantity',equipped:'Equipped'};
const readable=k=>labels[k]||k.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const textKeys=new Set(['name','desc','effect','misfire','action_type','damage','extra_damage','range','type','crit_range','crit_mult','attack_type','duration','target','saving_throw','save_success_damage','school','spell_resist','dr_bypass','at_higher_lvls','subName','languages','senses','resistances','proficiencies','favored_class_options','link','dc_formula','uses_formula']);
const boolKeys=new Set(['cs','equipped','two_handed','restoreOnLongRest','carried']);
function richEditor(key,value,label,maxLength=12000){
 const controls=[['bold','Bold','B'],['italic','Italic','I'],['heading','Heading','H'],['bullet','Bullet list','•'],['left','Align left','L'],['center','Center','≣'],['right','Align right','R']];
 return '<div class="cs-field cs-field-wide cs-rich-field" data-rich-editor><div class="cs-rich-heading"><label for="cs-rich-'+key+'">'+label+'</label><details class="cs-rich-tools"><summary aria-label="Show formatting tools for '+label+'" title="Show formatting tools">☷</summary><div class="cs-rich-toolbar" role="toolbar" aria-label="'+label+' formatting">'+controls.map(([command,title,glyph])=>'<button type="button" data-rich-format="'+command+'" title="'+title+'" aria-label="'+title+'">'+glyph+'</button>').join('')+'</div></details></div><textarea id="cs-rich-'+key+'" name="'+key+'" rows="5" maxlength="'+maxLength+'">'+e(value||'')+'</textarea></div>';
}
function field(key,value,{weapon=false,item=false,longDescription=false,source='cosmos'}={}){
 if(key==='capacity_body_type')return '<label class="cs-field"><span>Body type</span><select name="capacity_body_type"><option value="biped"'+(value!=='quadruped'?' selected':'')+'>Biped</option><option value="quadruped"'+(value==='quadruped'?' selected':'')+'>Quadruped</option></select></label>';
 if(key==='carried')return '<label class="cs-checkbox"><input type="checkbox" name="carried" '+(value!==false?'checked':'')+'><span>Carried (counts toward weight)</span></label>';
 if(key==='ability_kind')return '<label class="cs-field"><span>Ability category</span><select name="ability_kind">'+Object.entries(abilityKinds).map(([id,label])=>'<option value="'+id+'"'+((value||'other')===id?' selected':'')+'>'+label+'</option>').join('')+'</select><small class="cs-caption">Sp = spell-like (SR); Su = supernatural (no SR); Ex = extraordinary (no SR).</small></label>';
 if(key==='spell_resist')return '<label class="cs-field"><span>Allow spell resistance?</span><select name="spell_resist">'+Object.entries(srModes).map(([id,label])=>'<option value="'+id+'"'+((String(value||'').toLowerCase().startsWith('no')?'no':'yes')===id?' selected':'')+'>'+label+'</option>').join('')+'</select><small class="cs-caption">Used for spells and spell-like (Sp) abilities. Some spells do not allow SR.</small></label>';
 if(key==='save_type')return '<label class="cs-field"><span>Saving throw</span><select name="save_type">'+Object.entries(saveTypes).map(([id,label])=>'<option value="'+id+'"'+((value||'none')===id?' selected':'')+'>'+label+'</option>').join('')+'</select><small class="cs-caption">Uses the target\'s existing save bonus and the spell/ability DC. Do not guess a save from the spell name.</small></label>';
 if(key==='save_success')return '<label class="cs-field"><span>On successful save</span><select name="save_success">'+Object.entries(saveOutcomes).map(([id,label])=>'<option value="'+id+'"'+((value||'manual')===id?' selected':'')+'>'+label+'</option>').join('')+'</select><small class="cs-caption">Choose a precise outcome. GM resolves partial or unusual effects.</small></label>';
 if(key==='save_success_damage')return '<label class="cs-field cs-field-wide"><span>Damage dice if save succeeds (alternate only)</span><input type="text" name="save_success_damage" maxlength="300" value="'+e(value||'')+'" placeholder="3d6 + {CL}"><small class="cs-caption">Example: Slay Living is 12d6 + {CL} normally, but 3d6 + {CL} after a successful Fortitude save.</small></label>';
 if(key==='save_dc_override')return '<label class="cs-field"><span>Save DC override</span><input type="number" name="save_dc_override" step="1" min="1" max="100000" value="'+e(value??'')+'" placeholder="Automatic"><small class="cs-caption">Optional exact DC for printed spells and abilities; overrides calculated DC.</small></label>';
 if(key==='attack_bonus_override')return '<label class="cs-field"><span>Attack bonus override</span><input type="number" name="attack_bonus_override" step="1" value="'+e(value??'')+'" placeholder="Automatic"><small class="cs-caption">Optional total attack bonus including all modifiers. Blank uses the calculated attack.</small></label>';
 if(key==='effect_type')return '<label class="cs-field"><span>Effect type</span><select name="effect_type">'+Object.entries(effectTypes).map(([id,label])=>'<option value="'+id+'"'+(value===id?' selected':'')+'>'+label+'</option>').join('')+'</select><small class="cs-caption">Uses the Dice Roll formula. In Owlbear, targeted actions require your initiative turn.</small></label>';
 if(key==='action_type')return '<label class="cs-field"><span>Action type</span><select name="action_type"><option value="">None (no icon)</option>'+actionTypes.map(type=>'<option'+(value===type?' selected':'')+'>'+type+'</option>').join('')+'</select></label>';
 if(key==='uncanny_dodge')return '<label class="cs-field"><span>Uncanny Dodge</span><select name="uncanny_dodge">'+[['auto','Automatic'],['on','On'],['off','Off']].map(([option,name])=>'<option value="'+option+'"'+((value||'auto')===option?' selected':'')+'>'+name+'</option>').join('')+'</select></label>';
 if(key==='damage_types'){const chosen=selectedDamageTypes(value);return '<fieldset class="cs-field cs-field-wide cs-damage-tags"><legend>Damage Type</legend><div data-damage-tags>'+chosen.map(type=>damageTag(type)).join('')+'</div><select data-add-damage-type aria-label="Add damage type"><option value="">Add damage type…</option>'+damageTypes.map(type=>'<option'+(chosen.includes(type)?' disabled':'')+'>'+type+'</option>').join('')+'</select></fieldset>';}

 if(item&&key==='shopSource')return '<label class="cs-field"><span>Item source</span><select name="shopSource">'+SHOP_SOURCES.map(s=>'<option value="'+s.id+'"'+(shopSourceForItem({shopSource:value})===s.id?' selected':'')+'>'+e(s.label)+'</option>').join('')+'</select></label>';
 if(item&&key==='sourceCategoryDetail')return '<label class="cs-field cs-field-wide"><span>Original website category</span><input name="sourceCategoryDetail" list="cs-source-categories" maxlength="160" value="'+e(value||'')+'" placeholder="e.g. Weapons — Simple"><datalist id="cs-source-categories">'+sourceCategorySuggestions(source).map(label=>'<option value="'+e(label)+'"></option>').join('')+'</datalist></label>';
 if(item&&key==='link')return '<label class="cs-field cs-field-wide"><span>Item source link (URL)</span><input name="link" type="url" maxlength="2048" autocomplete="off" placeholder="https://..." value="'+e(value||'')+'"></label>';
 if(key==='img'&&item)return '<label class="cs-field"><span>Image URL (optional)</span><input type="text" name="img" maxlength="2048" autocomplete="off" value="'+e(usableItemImageUrl(value))+'" placeholder="https://example.com/image.png"><small class="cs-caption">Unsupported links are ignored when saving.</small></label>';
 if(key==='rarity'){const options=['','Common','Uncommon','Rare','Epic','Legendary'],selected=normalizeInventoryText(value,key);return '<label class="cs-field"><span>Rarity</span><select name="rarity">'+(selected&&!options.includes(selected)?'<option value="'+e(selected)+'" selected>Imported: '+e(selected)+'</option>':'')+options.map(v=>'<option value="'+v+'"'+(v===selected?' selected':'')+'>'+(v||'—')+'</option>').join('')+'</select></label>';}
 if(key==='sourceCategory')return '<label class="cs-field cs-field-wide cs-tag-editor"><span>Item Tag / Shop Category</span><div><span data-category-icon aria-hidden="true">'+itemCategorySymbol(value)+'</span><select name="sourceCategory" aria-label="Item Tag / Shop Category">'+Object.entries(SHOP_ITEM_CATEGORY_GROUPS).map(([group,tags])=>'<optgroup label="'+(group==='Other'?'Older Items':group)+'">'+tags.map(tag=>'<option value="'+tag+'"'+(value===tag?' selected':'')+'>'+tag+'</option>').join('')+'</optgroup>').join('')+'</select></div></label>';

 if(key==='crit_range'||key==='crit_mult'){const choices=key==='crit_range'?Array.from({length:20},(_,i)=>i===0?'20':(20-i)+'-20'):['x2','x3','x4','x5'];const normalized=String(value||'').replace(/[–—]/g,'-').replace('×','x');return '<label class="cs-field"><span>'+readable(key)+'</span><select name="'+key+'"><option value=""'+(!normalized?' selected':'')+'>Select</option>'+choices.map(v=>'<option value="'+v+'"'+(normalized===v?' selected':'')+'>'+v+'</option>').join('')+'</select></label>';}
 const label=item?inventoryFieldLabel(key):weapon&&key==='damage'?'Damage formula':weapon&&key==='ability_mod'?'AR Mod':weapon&&key==='damage_ability'?'DMG Mod':readable(key);
 if(key==='damage_ability'||key==='damage_style'){
  const options=key==='damage_ability'?Object.fromEntries(weaponDamageAbilities.map(ability=>[ability,ability==='auto'?'Automatic (attack type & style)':ability==='none'?'None (no ability bonus)':readable(ability)])):weaponDamageStyles;
  return '<label class="cs-field'+(weapon&&key==='damage_ability'?' cs-weapon-mod-field':'')+'"><span>'+label+(weapon&&key==='damage_ability'?' <strong data-weapon-dmg-mod></strong>':'')+'</span><select name="'+key+'">'+Object.entries(options).map(([option,title])=>'<option value="'+option+'"'+(value===option?' selected':'')+'>'+title+'</option>').join('')+'</select></label>';
 }
 const opts=key==='attack_type'?(weapon?Object.keys(attackTypes):['none',...Object.keys(attackTypes)]):key==='ability_mod'&&weapon?['auto','none',...abilities]:key==='size_category'?sizes:key==='stat'||key==='ability_mod'||key==='spell_dc_base'||key==='casting_ability'?abilities:key.startsWith('ar_')&&key.endsWith('_ability')?abilities:null;
 if(opts)return `<label class="cs-field${weapon&&key==='ability_mod'?' cs-weapon-mod-field':''}"><span>${label}${weapon&&key==='ability_mod'?'<strong data-weapon-ar-mod></strong>':''}</span><select name="${key}">${opts.map(opt=>'<option value="'+opt+'"'+(opt===String(value||opts[0])?' selected':'')+'>'+(key==='attack_type'?(attackTypes[opt]||'None'):opt==='auto'?'Automatic (attack type)':opt==='none'?'None (no ability bonus)':abilities.includes(opt)?opt.toUpperCase():opt)+'</option>').join('')}</select></label>`;
 if(boolKeys.has(key))return `<label class="cs-checkbox"><input type="checkbox" name="${key}" ${value?'checked':''}><span>${label}</span></label>`;
 if(['desc','effect','at_higher_lvls'].includes(key))return richEditor(key,item&&key==='desc'?normalizeInventoryText(value,key):value,label,longDescription&&key==='desc'?100000:item&&key==='desc'?30000:12000);
  if(['resistances','proficiencies','favored_class_options','special'].includes(key))return `<label class="cs-field cs-field-wide"><span>${label}</span><textarea name="${key}" rows="5" maxlength="${item&&key==='special'?30000:12000}">${e(item&&key==='special'?normalizeInventoryText(value,key):value||'')}</textarea></label>`;
  const isText=item?key!=='weight'&&key!=='amount':textKeys.has(key),optionalZero=!isText&&(/(?:_temp|_misc|_bonus|_adjustment)$/.test(key)||['u_curr','u_max','temp','attack_misc','dc_misc','mp_adjustment','weight','capacity_modifier','speed_mod'].includes(key));
  const display=key==='spell_failure'&&value===undefined?'':optionalZero&&Number(value??0)===0?'':value??(isText?'':0);
  const shown=item&&isText&&key!=='name'?normalizeInventoryText(display,key):display;
  return `<label class="cs-field"><span>${label}</span><input name="${key}" type="${isText?'text':'number'}" ${isText?'maxlength="'+(key==='name'?120:key==='link'||item&&key==='img'?2048:12000)+'"':'step="any" '+(optionalZero||['caster_level','mp_cost','spell_failure'].includes(key)?'':'required')} value="${e(shown)}" ${optionalZero?'placeholder="0"':''} ${key==='name'?'required':''}></label>`;
}
const damageTag=type=>'<span class="cs-damage-tag"><input type="hidden" name="damage_types" value="'+e(type)+'">'+e(type)+'<button type="button" data-remove-damage-type="'+e(type)+'" aria-label="Remove '+e(type)+'">×</button></span>';
// One compact Identity editor, with no extra speed descriptions.
export function renderIdentityEditor(values={}){
 const details=['size_category','languages','senses'];
 const movement=['speed_mod','speed_burrow','speed_climb','speed_fly','speed_swim'];
 const group=(label,keys,layout)=>'<fieldset class="cs-identity-group"><legend>'+label+'</legend><div class="cs-identity-fields '+layout+'">'+keys.map(k=>field(k,values[k])).join('')+'</div></fieldset>';
 return '<div class="cs-identity-editor">'+group('Character details',details,'cs-identity-details')+'<fieldset class="cs-identity-group"><legend>Movement speeds</legend><p class="cs-caption">Base land speed: '+baseLandSpeed(values)+' ft (read-only)</p><div class="cs-identity-fields cs-identity-movement">'+movement.map(key=>field(key,values[key])).join('')+'</div></fieldset>'+'</div>';
}
export function rollDice(expression,random=limit=>{const range=4294967296,ceiling=range-range%limit;let x;do{x=crypto.getRandomValues(new Uint32Array(1))[0];}while(x>=ceiling);return x%limit+1;}){
 const match=/^\s*(\d{1,2})d(\d{1,4})(?:\s*([+-])\s*(\d{1,6}))?\s*$/i.exec(expression);if(!match)throw Error('Use dice such as 1d20+5 or 2d6.');
 const count=Number(match[1]),sides=Number(match[2]);if(count<1||count>50||sides<2||sides>1000)throw Error('Use 1–50 dice with 2–1,000 sides.');
 const rolls=Array.from({length:count},()=>random(sides)),bonus=Number(match[4]||0)*(match[3]==='-'?-1:1);return {expression,rolls,bonus,total:rolls.reduce((a,b)=>a+b,bonus)};
}
export function formatRoll(label,r){
 const receipt=(x,typed=false)=>x.total+' ('+x.expression+(x.rolls?.length?' · '+x.rolls.join(', '):'')+')'+(typed&&damageTypeLine(x)?' — '+damageTypeLine(x):'');
 const title=r.weaponName||r.spellName||r.abilityName||label;
 const reason=String(r.combat?.reason||r.combat?.outcome||'').toLowerCase();
 const noHp=reason.includes('miss')||reason.includes('resist')||reason.includes('negat')||reason.includes('spell failed');
 const combatStatus=r.combat?.pending?'Awaiting GM approval':r.combat?.applied?(noHp?'No HP change':Number(r.combat.amount??0)===0?'Resolved · 0 effective HP': 'HP changed ('+Number(r.combat.amount)+' effective)'):r.combat?.note||'HP not updated';
 const checks=(r.combat?.mitigation||[]).map(part=>part.type==='sr'?'SR '+part.total+'/'+part.sr+(part.passed?' passed':' resisted'):part.type==='dr'?'DR '+(part.reduced||0)+' blocked':part.type==='energy'?(part.energy+' '+(part.before-part.after)+' resisted'):part.type==='save'?(part.save==='fort'?'Fort':part.save==='ref'?'Ref':'Will')+' '+part.total+' vs DC '+part.dc+(part.passed?' saved':' failed'):part.type==='review'?'GM review: vulnerability':'').filter(Boolean);
 const outcome=r.combat?.target?'\nTarget: '+r.combat.target+(r.combat.outcome?' · '+r.combat.outcome:'')+' · '+combatStatus+(checks.length?'\n'+checks.join(' · '):''):'';
 const failure=r.spellFailure,armorCheck=failure?'\nArmor spell failure: '+failure.roll+' vs '+failure.chance+'% — '+(failure.failed?'failed':'passed'):'';
 if(r.descriptionOnly)return title+(r.mpSpent!==undefined?' · '+r.mpSpent+' MP':'')+(r.remainingInfusedAmmo!==undefined?' · '+r.remainingInfusedAmmo+' infused rounds remaining':'')+(r.remainingUses!==undefined?' · '+r.remainingUses+' usage remaining':'')+armorCheck+'\n'+r.description;
 if(!['weapon','spell','ability'].includes(r.kind))return label+': '+receipt(r,true);
 const attack=r.kind==='weapon'?r:r.attack;
 return title+(r.mpSpent!==undefined?' · '+r.mpSpent+' MP':'')+(r.remainingInfusedAmmo!==undefined?' · '+r.remainingInfusedAmmo+' infused rounds remaining':'')+(r.remainingUses!==undefined?' · '+r.remainingUses+' usage remaining':'')+armorCheck+(attack?'\nAttack Roll: '+receipt(attack):'')+(r.damage?'\n'+(r.effectType==='heal'?'Healing':r.effectType==='temp_hp'?'Temporary HP':'Dice Roll')+': '+receipt(r.damage,true):'')+(r.critical?.threat?'\nCritical threat\nConfirmation: '+receipt(r.critical.confirmation)+(r.critical.damage?'\nDamage if confirmed: '+receipt(r.critical.damage,true):''):'')+outcome;
}

/**
 * Request a browser popup (minimal chrome, no normal tab strip) for a sheet.
 * Keep the anchor's target=_blank as a fallback when popups are blocked.
 */
export function openCharacterSheetPopup(url,characterId,{display=window.screen,open=window.open.bind(window)}={}){
 const availableWidth=Math.max(320,Math.floor(Number(display?.availWidth)||1280));
 const availableHeight=Math.max(320,Math.floor(Number(display?.availHeight)||900));
 const width=Math.max(320,availableWidth-24),height=Math.max(320,availableHeight-32);
 const left=Math.floor((availableWidth-width)/2)+(Number(display?.availLeft)||0);
 const top=Math.floor((availableHeight-height)/2)+(Number(display?.availTop)||0);
 const features='popup=yes,width='+width+',height='+height+',left='+left+',top='+top+',resizable=yes,scrollbars=yes';
 let popup;
 try{popup=open(url,'comos-sheet-'+encodeURIComponent(characterId),features);}catch{return false;}
 if(!popup)return false;
 try{popup.opener=null;popup.focus();}catch{/* Window may have been closed immediately. */}
 return true;
}

export function mountSheet(){
 const tabs=createSheetTabs();
 let dispose=mountCharacterSheet(tabs,switchTo);
 function switchTo(id){
  dispose();
  history.replaceState(null,'',sheetTabURL(location.href,id,tabs.view(id)));
  dispose=mountCharacterSheet(tabs,switchTo);
 }
 return ()=>dispose();
}

function mountCharacterSheet(tabs,switchTo){
 const root=document.querySelector('main'),id=new URL(location.href).searchParams.get('characterId'),compact=new URL(location.href).searchParams.get('compact')==='1';
 const control=new AbortController();let closed=false,character=null,admin=false,busy=false,conflict=false,dirty=false,timer=null,dialogState=null,polling=false,discordEnabled=true,stream=null,resourceTimer=null,pendingResourceFields={};let remainingTimer=null,pendingRemaining=null,remainingPromise=null;let remainingInvalid=false;
 let deletePending=false,weaponsCollapsed=false,disposeHold=()=>{},disposeNotesElectric=()=>{};let showStars=false,disposeSettings,disposePartyNotes,notesGeneration=0;let notesTab=new URL(location.href).searchParams.get('notesTab')||'personal';
 let section=new URL(location.href).searchParams.get('section')||({'sheet-inventory':'items','sheet-abilities':'abilities'}[document.body.dataset.page]||'overview');if(!sections.some(([k])=>k===section))section='overview';
 let ability=new URL(location.href).searchParams.get('ability')||'activeAbilities';if(!abilityTabs.includes(ability))ability='activeAbilities';
 const rememberedFight=new URL(location.href).searchParams.get('lastFightSection');
 let lastFightSection=['combat','abilities','spells'].includes(section)?section:['abilities','spells'].includes(rememberedFight)?rememberedFight:'combat';
 let combatView=new URL(location.href).searchParams.get('combatView')==='offense'?'offense':'defense';
 let itemTag=new URL(location.href).searchParams.get('itemTag')||'All';if(itemTag!=='All'&&!ITEM_TAG_OPTIONS.includes(itemTag)&&!Object.hasOwn(SHOP_ITEM_CATEGORY_GROUPS,itemTag))itemTag='All';
 let spellFilter=new URL(location.href).searchParams.get('spellLevel')||'all';if(spellFilter!=='all'){spellFilter=Number(spellFilter);if(!Number.isInteger(spellFilter)||spellFilter<0||spellFilter>9)spellFilter='all';}
 let itemView=new URL(location.href).searchParams.get('itemView')==='equip'?'equip':'inventory';
 document.body.classList.toggle('sheet-compact',compact);
 if(!id){root.innerHTML='<h1>Character sheet</h1><p>Choose a character to open its sheet.</p><a class="button" href="characters.html">Characters</a>';return ()=>control.abort();}
 const endpoint='/api/v1/character-records/'+encodeURIComponent(id);
 const status=message=>{const node=root.querySelector('[data-sheet-status]');if(node)node.textContent=message;};
 const dialog=()=>root.querySelector('[data-sheet-dialog]');
 const equipmentDialog=()=>root.querySelector('[data-equipment-dialog]');let selectedEquipmentSlot=null;
 const canOpenTabs=()=>character.kind!=='npc'&&character.owned!==false;
 const openPicker=()=>root.querySelector('.cs-picker[open]');
 const currentView=()=>({section,ability,combatView,itemView,itemTag,spellLevel:spellFilter,notesTab,lastFightSection,scrollY:window.scrollY});
 async function canSwitch(){
  if(busy||conflict||remainingInvalid||dragState){status('Finish saving this sheet before switching.');return false;}
  if(dirty&&!confirm('Discard unsaved edits on this sheet?'))return false;
  if((pendingRemaining||remainingPromise||Object.keys(pendingResourceFields).length)&&!await persistRemaining())return false;
  return !closed;
 }
 const itemDescriptionDialog=()=>root.querySelector('[data-item-description-dialog]');
 const setBusy=value=>{busy=value;root.querySelector('[data-sheet]')?.classList.toggle('cs-saving',value);root.querySelectorAll('button,input,select,textarea').forEach(node=>{if(value){node.dataset.busyDisabled=String(node.disabled);node.disabled=true;}else if(node.dataset.busyDisabled!==undefined){node.disabled=node.dataset.busyDisabled==='true';delete node.dataset.busyDisabled;}});};
 async function request(body,revision){
  const res=await fetch(endpoint+(revision!==undefined?'?revision='+revision:''),{signal:body?control.signal:AbortSignal.any([control.signal,AbortSignal.timeout(15000)]),credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,op:body.op||'sheet',revision:character.revision})}:{})});
  const data=await res.json();if(!res.ok)throw Object.assign(Error(data.message||({401:'Sign in to open this sheet.',404:'Character unavailable.',409:'Changed elsewhere. Copy any unsaved edits, then Refresh.'})[res.status]||'Could not reach the character server.'),{status:res.status});return data;
 }
 function draw(){if(closed)return;if(character.kind==='npc'&&!document.body.hasAttribute('data-owlbear-sheet')){const back=document.querySelector('header .back');if(back){back.href='admin-npcs.html';back.textContent='← NPCs';}}disposeHold();disposeNotesElectric();disposeSettings?.();disposePartyNotes?.();disposePartyNotes=undefined;const notesTicket=++notesGeneration;if(!(character.partyTags||[]).some(tag=>tag.id===notesTab))notesTab='personal';if(section==='items'&&itemView==='inventory'){
  const visible=visibleInventoryCategory(inventoryCategoryCounts(character.data.items),itemTag);
  if(visible!==itemTag){itemTag=visible;const url=new URL(location.href);url.searchParams.set('itemTag',visible);history.replaceState(null,'',url);}
 }clearTimeout(remainingTimer);pendingRemaining=null;remainingInvalid=false;pendingResourceFields={};root.innerHTML=renderSheetFrame(character,section,{admin,compact,ability,combatView,itemView,itemTag,spellLevel:spellFilter,showStars,discordEnabled,notesTab,owlbear:document.body.hasAttribute('data-owlbear-sheet')});
 if(canOpenTabs()){
  tabs.add(character);
  root.querySelector('[data-sheet]').insertAdjacentHTML('afterbegin',tabs.render(id));
  const strip=root.querySelector('.cs-sheet-tab-list'),active=strip?.querySelector('.is-active');
  if(active)strip.scrollLeft=active.getBoundingClientRect().left-strip.getBoundingClientRect().left;
 }
 root.querySelector('[data-discord-rolls]').checked=discordEnabled;for(const strip of root.querySelectorAll('.item-category-tiles,.cs-spell-levels')){const chosen=strip.querySelector('[aria-pressed=true],[aria-selected=true]');if(chosen)strip.scrollLeft=Math.max(0,chosen.offsetLeft-strip.offsetLeft-(strip.clientWidth-chosen.offsetWidth)/2);}disposeSettings=mountSheetSettings(root);disposeNotesElectric=mountNotesElectric(root);disposeHold=mountHoldButton(root.querySelector('[data-delete-character]'),()=>void deleteCharacter(),{signal:control.signal});syncWeapons();const notesRoot=root.querySelector('[data-party-notes]');if(notesRoot)void import('./party-notes.mjs').then(module=>{if(!closed&&notesTicket===notesGeneration&&notesRoot.isConnected)disposePartyNotes=module.mountPartyNotes(notesRoot,{characterId:id,tagId:notesRoot.dataset.partyNotes});}).catch(()=>{if(notesRoot.isConnected)notesRoot.querySelector('[role=status]').textContent='Could not open party notes.';});document.title=character.name+' · Cosmos';dirty=false;}
 async function save(change,skipPending=false){
  if(!skipPending){if(change.action==='fields')for(const key of Object.keys(change.fields||{}))delete pendingResourceFields[key];if((pendingRemaining||remainingPromise||Object.keys(pendingResourceFields).length)&&!await persistRemaining())return false;}
  if(busy||closed||conflict)return false;setBusy(true);status('Saving…');
  try{const result=await request(change);if(closed)return false;character=result.character;dirty=false;dialog()?.close();
   if(change.action==='addCatalogItem'){
    itemTag='All';const url=new URL(location.href);url.searchParams.delete('itemTag');history.replaceState(null,'',url);
   }
   draw();status('Saved · Synced'+(admin?' · Admin':''));return true;}
  catch(err){if(closed)return false;if(err.status===409){conflict=true;root.querySelector('[data-sheet-refresh]').hidden=false;}status(err.message);const message=root.querySelector('[data-dialog-status]');if(message)message.textContent=err.message;const equipStatus=root.querySelector('[data-equip-status]');if(equipStatus)equipStatus.textContent=err.message;return false;}
  finally{if(!closed)setBusy(false);}
 }
 async function refresh(force=false){
  if(closed||busy||deletePending||polling||dragState||document.hidden||(!force&&document.activeElement?.matches('[data-party-notes-input]'))||(!force&&(dirty||conflict||openPicker()||(dialog()?.open||equipmentDialog()?.open||itemDescriptionDialog()?.open||root.querySelector('[data-entry-popup]')?.open))))return;
  if(force&&(dirty||dialog()?.open||equipmentDialog()?.open||itemDescriptionDialog()?.open||root.querySelector('[data-entry-popup]')?.open)&&!confirm('Discard unsaved edits and load the latest sheet?'))return;
  polling=true;const previousRevision=character?.revision;
  try{const result=await request(null,!force&&character?character.revision:undefined);if(closed||busy||character?.revision!==previousRevision)return;if(!result.unchanged){if(!force&&(dirty||openPicker()||dialog()?.open||equipmentDialog()?.open||itemDescriptionDialog()?.open||root.querySelector('[data-entry-popup]')?.open))return;character=result.character;admin=result.admin===true;conflict=false;draw();}status('Synced'+(admin?' · Admin':''));}
  catch(err){if(!closed)status(err.message);}
  finally{polling=false;}
 }
 function schedule(){clearTimeout(timer);if(closed)return;timer=setTimeout(async()=>{await refresh();schedule();},5000);}
 function openDialog(title,keys,values,change,{help=''}={}){
  if(busy||conflict){status(conflict?'Refresh to load the latest sheet before editing.':'Saving…');return;}
  root.querySelector('[data-sheet-form] button[type=submit]').hidden=false;dialogState={keys,change,values:{...values}};dialog().classList.add('cs-star-border');dialog().dataset.editor=change.collection||'';root.querySelector('#cs-dialog-title').textContent=title;
  root.querySelector('[data-editor-premade]').hidden=!abilityTabs.includes(change.collection);
  root.querySelector('[data-dialog-fields]').innerHTML=keys===groupFields.identity?renderIdentityEditor(values):(help?'<p class="cs-caption">'+e(help)+'</p>':'')+renderEntryFields(keys,values,change.collection);
  updateWeaponEditorPreview();
  root.querySelector('[data-dialog-status]').textContent='';if(['damage','heal','spendMp'].includes(change.action))root.querySelector('[name=amount]').closest('label').querySelector('span').textContent='Amount';dialog().showModal();
 }
 function updateWeaponEditorPreview(){
  if(dialogState?.change?.collection!=='weapons'||dialogState.keys.includes('npcAttackBonus'))return;
  const form=root.querySelector('[data-sheet-form]');
  if(!form||!character)return;
  const attack=form.querySelector('[data-weapon-ar-mod]'),damage=form.querySelector('[data-weapon-dmg-mod]');
  if(!attack||!damage)return;
  const value=name=>form.elements.namedItem(name)?.value;
  const row={...dialogState.values,attack_type:value('attack_type')||'melee',
   ability_mod:value('ability_mod')||'auto',attack_misc:Number(value('attack_misc')||0),
   damage_ability:value('damage_ability')||'auto',damage_style:value('damage_style')||'standard'};
  try{
   const info=weaponAttackParts(row,character.data),stat=info.ability==='none'?0:sheetStats(character.data).mods[info.ability];
   const signed=n=>(n>=0?'+':'')+n;
   attack.textContent=(info.ability==='none'?'None':info.ability.toUpperCase())+': '+signed(stat);
   const effect=weaponDamageFormulas({...row,damage:'1d4',extra_damage:''},character.data);
   damage.textContent=(effect.ability?effect.ability.toUpperCase():'None')+': '+signed(effect.abilityBonus);
  }catch{attack.textContent='—';damage.textContent='—';}
 }
 function sourceFieldsFromEditor(){
  const fields={};
  for(const row of root.querySelectorAll('[data-source-field-row]')){
   const key=row.querySelector('[data-source-field-name]')?.value.trim();
   const value=row.querySelector('[data-source-field-value]')?.value??'';
   if(key&&key.length<=100)fields[key]=value;
  }
  return fields;
 }
 function sourceFieldsEditor(values){
  const fields=inventorySourceFields(values);
  const row=(label,value)=>'<div class="cs-source-field-row" data-source-field-row><label class="cs-field"><span>Original column name</span><input data-source-field-name maxlength="100" value="'+e(label)+'"></label><label class="cs-field cs-field-wide"><span>Value</span><textarea data-source-field-value rows="2" maxlength="12000">'+e(value)+'</textarea></label><button class="button" type="button" data-remove-source-field aria-label="Remove source field">Remove</button></div>';
  return '<fieldset class="cs-editor-group cs-inventory-field-group"><legend>Original source columns</legend><p class="cs-caption">Preserves the original column names and content, including source-specific stats. The catalog snapshot stays unchanged.</p><div data-source-fields>'+Object.entries(fields).map(([k,v])=>row(k,v)).join('')+'</div><button type="button" class="button" data-add-source-field>Add source field</button></fieldset>';
 }
 function renderEntryFields(keys,values,collection){
  if(collection==='npcStats')return '<div class="cs-form-grid">'+keys.map(key=>`<label class="cs-field"><span>${npcStatLabels[key]}</span><input name="${key}" type="number" step="${key==='cr'?'any':'1'}" value="${e(values[key]??'')}"></label>`).join('')+'</div>';
  if(collection==='npcHealth')return '<div class="cs-form-grid">'+keys.map(key=>'<label class="cs-field"><span>'+e(readable(key))+'</span><input type="number" name="'+key+'" step="1" value="'+e(values[key]??'')+'" placeholder="Not set"></label>').join('')+'</div>';
  if(collection==='npcText')return '<div class="cs-form-grid">'+keys.map(key=>`<label class="cs-field cs-field-wide"><span>${npcTextLabels[key]}</span><textarea name="${key}" rows="2" maxlength="4000">${e(values[key]??'')}</textarea></label>`).join('')+'</div>';
  const render=k=>field(k,collection==='items'&&!Object.hasOwn(values,k)?inventoryItemValue(values,k):values[k],{source:shopSourceForItem(values),weapon:collection==='weapons',item:collection==='items',longDescription:['activeAbilities','passiveAbilities','racialAbilities','feats','spells'].includes(collection)});
  if(collection==='items'){
   const parts=inventoryEditorFields(values.sourceCategory||'Misc'),group=(title,keys)=>'<fieldset class="cs-editor-group cs-inventory-field-group"><legend>'+e(title)+'</legend>'+keys.map(render).join('')+'</fieldset>';
   return '<div class="cs-form-grid cs-inventory-editor">'+render('sourceCategory')+render('name')+group('Item details',[...parts.common.map(([,key])=>key),...(parts.allowTwoHanded?['two_handed']:[]),'carried'])+(parts.extras.length?group(parts.category+' stats',parts.extras.map(([,key])=>key)):'')+sourceFieldsEditor(values)+'<div class="cs-ability-prose">'+render('desc')+render('special')+'</div></div>';
  }
  if(collection==='weapons'&&keys.includes('npcAttackBonus'))return '<div class="cs-form-grid cs-weapon-editor">'+keys.map(render).join('')+'<p class="cs-caption">Special on-hit weapon saves are GM-managed; they do not cancel normal weapon damage.</p></div>';
  if(collection==='weapons')return '<div class="cs-form-grid cs-weapon-editor">'+render('name')+'<fieldset class="cs-editor-group"><legend>Attack Roll</legend>'+['attack_type','ability_mod','attack_misc','range','misfire'].filter(k=>keys.includes(k)).map(render).join('')+'</fieldset><fieldset class="cs-editor-group"><legend>Damage</legend>'+['damage','damage_ability','damage_style','extra_damage','crit_range','crit_mult','damage_types','dr_bypass'].filter(k=>keys.includes(k)).map(render).join('')+'</fieldset><fieldset class="cs-editor-group"><legend>Usage</legend>'+['u_curr','u_max'].filter(k=>keys.includes(k)).map(render).join('')+'</fieldset><fieldset class="cs-editor-group"><legend>Special on-hit save (manual)</legend>'+['saving_throw','save_type','save_success','save_dc_override'].filter(k=>keys.includes(k)).map(render).join('')+'</fieldset><fieldset class="cs-editor-group"><legend>Carried weight</legend>'+['weight','amount','carried'].filter(k=>keys.includes(k)).map(render).join('')+'</fieldset>'+render('desc')+'</div>';
  const narrative=keys.filter(k=>['desc','effect','at_higher_lvls'].includes(k));
   const abilityEditor=['spells','activeAbilities','passiveAbilities','racialAbilities','feats'].includes(collection);
   if(abilityEditor){
    const narrative=['desc','effect','at_higher_lvls'].filter(k=>keys.includes(k));
    const layouts=[['Ability details',['lvl','school','type','ability_kind']],['Action & targeting',['action_type','range','duration','target']],['Attack & damage',['effect_type','attack_type','attack_misc','attack_bonus_override','damage','damage_types']],['Saving throw & DC',['saving_throw','save_type','save_success','save_success_damage','save_dc_override','dc_formula','casting_ability','dc_misc','caster_level','sr_bonus','spell_resist']],['Resources',['mp_cost','spell_failure','uses_formula','u_max','u_curr','restoreOnLongRest']],['Reference',['link']]];
    const picked=new Set(['name',...layouts.flatMap(([,part])=>part),...narrative]);
    const remainder=keys.filter(k=>!picked.has(k));
    if(remainder.length)layouts.push(['Additional details',remainder]);
    const groups=layouts.map(([label,part])=>{
     const visible=part.filter(k=>keys.includes(k));
     return visible.length?'<fieldset class="cs-editor-group cs-ability-field-group"><legend>'+label+'</legend>'+visible.map(render).join('')+'</fieldset>':'';
    }).join('');
    if(abilityTabs.includes(collection)){
     return '<div class="cs-form-grid cs-ability-editor cs-manual-ability-editor">'+render('name')+
      '<details class="cs-ability-advanced"><summary>Advanced Settings</summary><div class="cs-ability-advanced-grid">'+groups+'</div></details>'+
      '<div class="cs-ability-prose cs-ability-prose-sections">'+narrative.map(k=>'<section class="cs-ability-prose-card">'+render(k)+'</section>').join('')+'</div></div>';
    }
    return '<div class="cs-form-grid cs-ability-editor">'+render('name')+groups+
     (narrative.length?'<fieldset class="cs-editor-group cs-ability-prose"><legend>Description & effects</legend>'+narrative.map(render).join('')+'</fieldset>':'')+'</div>';
   }
   return '<div class="cs-form-grid">'+keys.filter(k=>!['u_max','u_curr','desc','effect','at_higher_lvls'].includes(k)).map(render).join('')+(keys.includes('u_curr')?'<fieldset class="cs-editor-group cs-usage-fields"><legend>Usage</legend>'+['u_curr','u_max'].filter(k=>keys.includes(k)).map(render).join('')+'</fieldset>':'')+(narrative.length?'<div class="cs-ability-prose">'+narrative.map(render).join('')+'</div>':'')+'</div>';
 }
 function syncWeapons(){for(const collection of root.querySelectorAll('[data-collection="weapons"]')){collection.querySelector('.cs-entry-list').hidden=weaponsCollapsed;const toggle=collection.querySelector('[data-collapse-weapons]');toggle.setAttribute('aria-expanded',String(!weaponsCollapsed));toggle.setAttribute('aria-label',weaponsCollapsed?'Expand weapons':'Collapse weapons');toggle.title=weaponsCollapsed?'Expand weapons':'Collapse weapons';}}
 let dragState=null;
  const abilityRef=node=>node?.hasAttribute('data-ability-group-card')?{groupId:node.dataset.abilityGroupCard}:node?.hasAttribute('data-ability-index')?{index:Number(node.dataset.abilityIndex)}:null;
  const abilityChildren=list=>[...list.children].filter(node=>abilityRef(node));
  async function placeAbility(collection,source,before,groupId,focus=false){
   const focusIndex=source.index!==undefined&&groupId?(before?.index!==undefined?before.index-(before.index>source.index?1:0):(character.data[collection]||[]).length-1):source.index;
   const saved=await save({action:'placeAbility',collection,source,before,groupId});
   if(!saved&&!closed){const reason=root.querySelector('[data-sheet-status]')?.textContent;draw();status(reason||'Position was not saved. Refresh and try again.');}
   if(saved&&focus){const selector=source.groupId?'[data-group-drag="'+source.groupId+'"]':'[data-ability-drag="'+collection+':'+focusIndex+'"]';root.querySelector(selector)?.focus();}
  }
  function clearAbilityDrag(cancel=false){
   const current=dragState;if(!current)return;dragState=null;
   const {row,placeholder,list,originalNext,handle,collection,source}=current;
   const destination=placeholder.parentElement,before=abilityRef(placeholder.nextElementSibling);
   if(cancel){if(originalNext?.isConnected)list.insertBefore(row,originalNext);else list.append(row);placeholder.remove();}
   else placeholder.replaceWith(row);
   row.classList.remove('cs-ability-dragging');for(const key of ['left','top','width','height'])row.style.removeProperty(key);
   handle?.setAttribute('aria-pressed','false');
   if(!cancel&&current.moved)void placeAbility(collection,source,before,destination.dataset.abilityGroup||'');
  }
  function beginAbilityDrag(event){
   const handle=event.target.closest?.('[data-ability-drag],[data-group-drag]');
   if(!handle||event.button!==0||dragState||busy||conflict||dirty||remainingInvalid||pendingRemaining||remainingPromise||Object.keys(pendingResourceFields).length)return;
   const collection=handle.closest('[data-collection]')?.dataset.collection;
   if(!abilityTabs.includes(collection))return;
   const row=handle.hasAttribute('data-group-drag')?handle.closest('[data-ability-group-card]'):handle.closest('.cs-entry'),list=row?.parentElement;if(!list?.hasAttribute('data-ability-group'))return;
   const rect=row.getBoundingClientRect(),originalNext=row.nextSibling;
   const placeholder=document.createElement('div');placeholder.className='cs-ability-drop-slot';placeholder.style.height=Math.max(32,rect.height)+'px';row.before(placeholder);
   row.classList.add('cs-ability-dragging');row.style.left=rect.left+'px';row.style.top=rect.top+'px';row.style.width=rect.width+'px';row.style.height=rect.height+'px';
   handle.setAttribute('aria-pressed','true');
   dragState={id:event.pointerId,row,list,handle,placeholder,originalNext,collection,source:abilityRef(row),offsetY:event.clientY-rect.top,moved:false};
   event.preventDefault();try{handle.setPointerCapture(event.pointerId);}catch{}
  }
  function updateAbilityDrag(event){
   const drag=dragState;if(!drag||event.pointerId!==drag.id)return;
   drag.moved=true;drag.row.style.top=event.clientY-drag.offsetY+'px';
   const lists=[...root.querySelectorAll('[data-collection="'+drag.collection+'"] [data-ability-group]')].reverse();
   const destination=lists.find(node=>!drag.row.contains(node)&&(!drag.source.groupId||node.dataset.abilityGroup==='')&&(()=>{const r=(node.dataset.abilityGroup?node.closest('[data-ability-group-card]'):node).getBoundingClientRect();return event.clientY>=r.top&&event.clientY<=r.bottom&&event.clientX>=r.left&&event.clientX<=r.right;})());
   const targetList=destination||drag.placeholder.parentElement;
   const others=abilityChildren(targetList).filter(node=>node!==drag.row);
   const target=others.find(node=>{const r=node.getBoundingClientRect();return event.clientY<r.top+r.height/2;});
   if(target)targetList.insertBefore(drag.placeholder,target);else targetList.append(drag.placeholder);
   if(event.clientY<55)window.scrollBy(0,-10);else if(event.clientY>window.innerHeight-55)window.scrollBy(0,10);
  }
  function openEntryPreview(ref){const [key,i]=ref.split(':'),row=character.data[key]?.[Number(i)];if(!row)return;const popup=root.querySelector('[data-entry-popup]');popup.querySelector('h2').textContent=row.name||'Unnamed';popup.querySelector('[data-entry-popup-content]').innerHTML=entryDetail(row,character.data,key,{npc:character.kind==='npc'});popup.showModal();}
 async function deleteCharacter(){
  if(deletePending||busy||conflict||dirty||pendingRemaining||remainingPromise||remainingInvalid||Object.keys(pendingResourceFields).length){status('Save or discard unsaved changes before deleting this character.');return;}
  deletePending=true;if(!await confirmCharacterDelete({signal:control.signal,name:character.name})||closed){deletePending=false;return;}
  setBusy(true);status('Deleting character…');
  let restoreSheet;
  try{restoreSheet=await crumpleSheet(root.querySelector('[data-sheet]'),{signal:control.signal});
   if(closed||control.signal.aborted)return;
   const result=await request({op:'archive',confirmName:character.name});if(!result.archived)throw Error('The character could not be deleted.');
   clearTimeout(timer);stream?.close();closed=true;disposeHold();disposeNotesElectric();disposeSettings?.();disposePartyNotes?.();notesGeneration++;clearTimeout(resourceTimer);clearTimeout(remainingTimer);control.abort();location.assign(character.kind==='npc'?'admin-npcs.html':'characters.html');
  }catch(err){restoreSheet?.();if(!closed)status(err.message);}finally{deletePending=false;if(!closed)setBusy(false);}
 }
 function openEquipmentPicker(slot){
  if(busy||conflict||dirty||pendingRemaining||remainingPromise||remainingInvalid||Object.keys(pendingResourceFields).length){status('Save or refresh before changing equipment.');return;}
  if(!isEquipmentSlot(slot))return;
  const picker=equipmentDialog();if(!picker)return;
  selectedEquipmentSlot=slot;
  const search=picker.querySelector('[data-equip-search]');
  search.value='';
  picker.querySelector('[data-equip-choices]').innerHTML=renderEquipChoices(character.data,'',slot);
  picker.querySelector('[data-equip-status]').textContent='';
  picker.querySelector('[data-equip-unequip]').hidden=!equippedInSlot(character.data,slot);
  picker.showModal();
  search.focus();
 }
 function openItemDescription(ref){
  const [collection,rawIndex]=String(ref||'').split(':'),index=Number(rawIndex);
  if(!['items','weapons'].includes(collection)||!Number.isInteger(index)||index<0)return;
  const item=character.data[collection]?.[index];
  if(!item)return;
  const popup=itemDescriptionDialog();if(!popup)return;
  popup.querySelector('[data-item-description-title]').textContent=String(item.name||'Unnamed');
  // Show the current saved quantity and original cost at the top of item details.
  popup.querySelector('[data-item-qty]').textContent=String(inventoryItemValue(item,'amount')??1);
  popup.querySelector('[data-item-amount]').textContent=normalizeInventoryText(inventoryItemValue(item,'cost'),'cost')||'—';
  const favorite=popup.querySelector('[data-item-popup-favorite]');
  favorite.dataset.favorite=collection+':'+index;
  favorite.setAttribute('aria-pressed',String(item.favorite===true));
  favorite.textContent=item.favorite===true?'★ Favorited':'☆ Favorite';
  const edit=popup.querySelector('[data-item-popup-edit]');
  edit.dataset.editEntry=collection+':'+index;
  edit.setAttribute('aria-label','Edit '+String(item.name||'Unnamed'));
  const remove=popup.querySelector('[data-item-popup-remove]');
  remove.dataset.removeEntry=collection+':'+index;
  remove.setAttribute('aria-label','Remove '+String(item.name||'Unnamed')+' from inventory');
  const facts=inventoryItemDetails(item).filter(([label])=>label!=='Cost');
  popup.querySelector('[data-item-details]').innerHTML=facts.length?'<dl class="cs-inventory-facts">'+facts.map(([label,value])=>'<div><dt>'+e(label)+'</dt><dd>'+e(value)+'</dd></div>').join('')+'</dl>':'';
  popup.querySelector('[data-item-description-text]').innerHTML=formatSheetText(String(item.desc||item.description||'').trim()||'No description.');
  const special=popup.querySelector('[data-item-special]');special.hidden=!String(item.special||'').trim();special.innerHTML=item.special?'<h3>Special</h3><p>'+e(item.special)+'</p>':'';
  popup.showModal();
 }
 async function openRuleAbilities(){try{const {openAbilityLibrary}=await import('./ability-library.mjs');openAbilityLibrary({getData:()=>character.data,save,onAdded:()=>notify('Added')});}catch(error){status(error.message);}}
 function showFormula(label){
  const d=character.data,s=sheetStats(d),n=k=>number(d[k]),mod=a=>s.mods[a];
  const size=[8,4,2,1,0,-1,-2,-4,-8][sizes.findIndex(size=>size.toLowerCase()===String(d.size_category||d.size||'Medium').toLowerCase())]||0;
  const formulas={
   'Initiative':`DEX ${mod('dex')} + adjustment ${n('init_temp')} = ${s.initiative}`,
   'BAB':`Base ${n('bab')} + adjustment ${n('bab_temp')} = ${s.bab}`,
   'Speed':`Base ${s.baseSpeed} ft; after armor and load ${s.encumbrance.constrainedSpeed} ft; final ${s.speed} ft`,
   'AC':`10 + DEX ${s.dexAcModifier} + size ${size} + armor and shield ${s.armorBonus} + natural ${n('ac_natural')} + deflection ${n('ac_deflect')} + dodge ${s.dodgeAcBonus} + adjustment ${n('ac_temp')} = ${s.ac}`,
   'Touch':`10 + DEX ${s.dexAcModifier} + size ${size} + deflection ${n('ac_deflect')} + dodge ${s.dodgeAcBonus} + adjustment ${n('touch_temp')} = ${s.touch}`,
   'Flat-footed':`10 + DEX ${s.flatDexModifier} + size ${size} + armor and shield ${s.armorBonus} + natural ${n('ac_natural')} + deflection ${n('ac_deflect')} + dodge ${s.flatDodgeBonus} + adjustment ${n('flat_temp')} = ${s.flat}`,
   'CMD':`10 + BAB ${s.bab} + STR ${mod('str')} + DEX ${mod('dex')} − size ${size} + deflection ${n('ac_deflect')} + dodge ${s.dodgeAcBonus} + adjustment ${n('cmd_temp')} = ${s.cmd}`,
   'CMB':`BAB ${s.bab} + STR ${mod('str')} + DEX ${mod('dex')} − size ${size} + adjustment ${n('cmb_temp')} = ${s.cmb}`,
   'HP':`Current ${s.hp}; base maximum ${n('hp_max')} + maximum adjustment ${n('hp_max_temp')} = ${s.hpMax}; temporary HP ${s.hpTemp}`,
   'MP':`Current ${s.mp}; class ${n('mp_class')} + bonus ${n('mp_bonus')} + maximum adjustment ${n('mp_max_temp')} = ${s.mpMax}`,
   'Armor class':`Calculated AC: ${s.ac}`
  };
  for(const [name,key,stat] of [['Fortitude','fort','con'],['Reflex','ref','dex'],['Will','will','wis']])formulas[name]=`${stat.toUpperCase()} ${mod(stat)} + base ${n(key+'_base')} + enhancement ${n(key+'_enhance')} + adjustment ${n(key+'_temp')} = ${s[key]}`;
  for(const [name,key,fallback,total] of [['Melee','ar_melee','str',s.melee],['Ranged','ar_ranged','dex',s.ranged],['Touch attack','ar_touch','str',s.touchAttack],['Ranged touch','ar_ranged_touch','dex',s.rangedTouch]]){const stat=abilities.includes(d[key+'_ability'])?d[key+'_ability']:fallback;formulas[name]=`BAB ${s.bab} + ${stat.toUpperCase()} ${mod(stat)} + size ${size} + adjustment ${n(key+'_temp')} = ${total}`;}
  root.querySelector('#cs-dialog-title').textContent=label+' calculation';root.querySelector('[data-dialog-fields]').innerHTML='<p class="cs-prose">'+e(formulas[label]||'Saved sheet value')+'</p><p class="cs-caption">Uses the saved sheet components. Class progression and conditional effects remain manual.</p>';root.querySelector('[data-dialog-status]').textContent='';root.querySelector('[data-sheet-form] button[type=submit]').hidden=true;dialog().showModal();
 }
 function editAbilityGroup(collection,id){
  const group=(character.data.abilityGroups||[]).find(g=>g.id===id);
  openDialog(group?'Edit '+group.name:'Create ability group',['name','u_curr','u_max','restoreOnLongRest'],group||{name:'',u_curr:0,u_max:0,restoreOnLongRest:true},{action:'abilityGroup',mode:group?'update':'add',collection,id},{help:'Members share this usage pool. Set remaining and maximum uses. Deleting a group keeps its abilities.'});
  if(group)root.querySelector('[data-dialog-fields]').insertAdjacentHTML('beforeend','<button type="button" class="cs-delete" data-delete-ability-group="'+e(id)+'">Delete group</button>');
 }
 function editEntry(key,index){
  const row=character.data[key]?.[index]||{};
  const npcWeapon=key==='weapons'&&character.kind==='npc';
  const keys=key==='npcSkills'?['name','bonus']:npcWeapon?['name','attack_type','npcAttackBonus','damage','crit_range','crit_mult','damage_types','dr_bypass','saving_throw','save_type','save_success','save_dc_override','desc']:key==='skills'?['lvl','temp','cs',...(skillSupportsSpecialization(row.name)?['subName']:[])]:key==='items'?inventoryEditorKeys(itemCategoryForItem(row)):key==='weapons'?['name','attack_type','ability_mod','attack_misc','damage','damage_ability','damage_style','extra_damage','damage_types','dr_bypass','range','misfire','crit_range','crit_mult','u_curr','u_max','weight','amount','carried','saving_throw','save_type','save_success','save_dc_override','desc']:key==='spells'?['name','lvl','school','type','attack_type','effect_type','attack_misc','range','duration','target','saving_throw','save_type','save_success','save_success_damage','spell_resist','damage','damage_types','casting_ability','caster_level','sr_bonus','save_dc_override','dc_formula','attack_bonus_override','dc_misc','mp_cost','spell_failure','link','desc','at_higher_lvls']:row.rulesOwned?['name','action_type','effect_type','ability_kind','saving_throw','save_type','save_success','save_success_damage','spell_resist','attack_type','attack_misc','attack_bonus_override','damage','damage_types','casting_ability','dc_misc','caster_level','sr_bonus','save_dc_override','dc_formula','uses_formula','restoreOnLongRest','link','desc','effect','at_higher_lvls'] :['name','action_type','effect_type','ability_kind','saving_throw','save_type','save_success','save_success_damage','spell_resist','attack_type','attack_misc','attack_bonus_override','damage','damage_types','casting_ability','dc_misc','caster_level','sr_bonus','save_dc_override','dc_formula',...(row.uses_formula?['uses_formula']:[]),'u_max','u_curr','restoreOnLongRest','link','desc','effect','at_higher_lvls'];
  if(character.data.gunbreakerAmmo!==undefined&&row.rulesOwned&&row.sourceRuleId===MAGICKED_AMMO_ID)for(const k of ['uses_formula','restoreOnLongRest']){const at=keys.indexOf(k);if(at>=0)keys.splice(at,1);}
  if(isLimitBreak(row))for(const k of ['uses_formula','restoreOnLongRest','u_curr','u_max']){const at=keys.indexOf(k);if(at>=0)keys.splice(at,1);}
  if(abilityGroup(character.data,row,key))for(const k of ['uses_formula','restoreOnLongRest','u_curr','u_max']){const at=keys.indexOf(k);if(at>=0)keys.splice(at,1);}
  const values={u_max:row.u_max??0,u_curr:row.u_curr??row.u_max??0,...row,action_type:actionType(row.action_type??row.type),damage_types:selectedDamageTypes(row.damage_types),sourceCategory:itemCategoryForItem(row),mp_cost:row.mp_cost??row.mpCost??row.mp_amount??row.mpAmount??'',lvl:key==='spells'?(spellLevel(row.lvl)??0):(row.lvl??0),damage:row.damage||row.dmg||'',amount:row.amount??1,stat:row.stat||'int',attack_type:key==='weapons'?attackType(row.attack_type):String(row.attack_type||'none').toLowerCase().replaceAll(' ','_'),ability_mod:String(row.ability_mod||row.mod||(key==='weapons'&&index===null?weaponDefaultAbilities(row.attack_type||'melee',character.data).attack:'auto')).toLowerCase(),casting_ability:row.casting_ability||character.data.spell_dc_base||'int',caster_level:row.caster_level??'',restoreOnLongRest:row.restoreOnLongRest!==false};
  if(['spells',...abilityTabs].includes(key))values.effect_type=effectType(row)==='none'&&!row.effect_type&&String(row.damage||row.dmg||'').trim()?'damage':effectType(row);
  if(key==='weapons'&&!npcWeapon){
   values.damage_ability=row.damage_ability??(index===null?weaponDefaultAbilities(values.attack_type,character.data).damage:'none');
   values.damage_style=row.damage_style??(row.two_handed&&values.attack_type==='melee'?'two_handed':'standard');
   values.crit_range=row.crit_range||'20';values.crit_mult=row.crit_mult||'x2';
  }
  openDialog(index===null?'Add '+titles[key]:'Edit '+(row.name||titles[key]),keys,values,{action:'entry',collection:key,index,mode:index===null?'add':'update'},{help:key==='weapons'&&!npcWeapon?'':key==='skills'?(skillSupportsSpecialization(row.name)?'Edit ranks, misc, class skill and specialization.':'Edit ranks, misc and class skill.'):''});
  if(index!==null&&key!=='skills')root.querySelector('[data-dialog-fields]').insertAdjacentHTML('beforeend','<button class="cs-delete" type="button" data-remove-entry="'+key+':'+index+'">Delete entry</button>');
 }
 async function roll(label,expression,weaponIndex,spellIndex,abilityEntry,mode='use',skillIndex){
  clearTimeout(remainingTimer);if(remainingInvalid)return;if(remainingPromise&&!await remainingPromise)return;if((pendingRemaining||Object.keys(pendingResourceFields).length)&&!await persistRemaining())return;if(busy)return;setBusy(true);let node=root.querySelector('[data-roll-result]');node.hidden=false;node.textContent='Rolling…';
  try{const result=await request({op:'roll',...(skillIndex!==undefined?{kind:'skill',index:skillIndex}:abilityEntry?{kind:'ability',...abilityEntry}:spellIndex!==undefined?{kind:'spell',index:spellIndex}:weaponIndex===undefined?{expression,label}:{kind:'weapon',index:weaponIndex}),requestId:recordId(),...((weaponIndex!==undefined||spellIndex!==undefined||abilityEntry||skillIndex!==undefined)?{mode}:{}),discord:mode==='send'||discordEnabled,discordStats:preferences.discordRollStats});if(closed)return;const r=result.roll;if(r.characterRevision!==undefined){try{const fresh=await request();character=fresh.character;draw();node=root.querySelector('[data-roll-result]');node.hidden=false;}catch{status('Use saved · Sync pending');}}const failed=result.discord==='failed';if(mode==='send'){node.hidden=true;notify(failed?'Discord delivery failed':result.discord==='sent'?'Sent to Discord':'Discord delivery pending');}else if(r.descriptionOnly){node.hidden=true;notify(failed?'Use · Discord delivery failed':'Use');}else{const present=()=>{if(closed)return;const current=root.querySelector('[data-roll-result]');if(current){
  current.textContent=formatRoll(label,r)+(failed?' · Discord delivery failed':'');
  const verdict=combatVerdict(r);
  if(verdict){
   current.dataset.combatResult=verdict.tone;
   const banner=document.createElement('strong');
   banner.className='cs-combat-indicator cs-combat-indicator-'+verdict.tone;
   banner.textContent=verdict.label;
   banner.title=verdict.detail;
   current.prepend(banner);
  }else delete current.dataset.combatResult;
  current.hidden=false;
 }};if(document.body.hasAttribute('data-owlbear-sheet')||r.provider==='owlbear-dice-plus'){present();status('Rolled with Dice+');}else{node.hidden=false;node.textContent='Roll queued…';void showDice(r,{onResult:present});status('Rolled');}}document.dispatchEvent(new CustomEvent('comos:sheet-roll',{detail:{characterId:id,label,...r}}));}
  catch(err){if(!closed)node.textContent=err.message;}finally{if(!closed)setBusy(false);}
 }
 function selectSpellLevel(level,focus=false){spellFilter=level;draw();const url=new URL(location.href);url.searchParams.set('spellLevel',level);history.replaceState(null,'',url);if(focus){const tab=root.querySelector('[data-spell-level="'+level+'"]');tab.focus({preventScroll:true});tab.scrollIntoView({block:'nearest',inline:'nearest'});}}
 root.addEventListener('pointerdown',beginAbilityDrag,{signal:control.signal});
  root.addEventListener('pointermove',updateAbilityDrag,{signal:control.signal});
  root.addEventListener('pointerup',event=>{if(dragState?.id===event.pointerId)clearAbilityDrag();},{signal:control.signal});
  root.addEventListener('pointercancel',event=>{if(dragState?.id===event.pointerId)clearAbilityDrag(true);},{signal:control.signal});
  root.addEventListener('keydown',event=>{
   const grip=event.target.closest?.('[data-ability-drag],[data-group-drag]');if(!grip||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
   event.preventDefault();if(busy||dirty||conflict||dragState)return;
   const row=grip.hasAttribute('data-group-drag')?grip.closest('[data-ability-group-card]'):grip.closest('.cs-entry'),list=row.parentElement,collection=grip.closest('[data-collection]').dataset.collection,source=abilityRef(row),siblings=abilityChildren(list),index=siblings.indexOf(row);
   if(event.key==='ArrowLeft'&&list.dataset.abilityGroup){void placeAbility(collection,source,{groupId:list.dataset.abilityGroup},'',true);return;}
   if(event.key==='ArrowRight'&&!source.groupId&&!list.dataset.abilityGroup){const group=[siblings[index-1],siblings[index+1]].find(node=>node?.hasAttribute('data-ability-group-card'));if(group)void placeAbility(collection,source,null,group.dataset.abilityGroupCard,true);return;}
   const next=event.key==='ArrowUp'?siblings[index-1]:event.key==='ArrowDown'?siblings[index+1]:null;
   if(next)void placeAbility(collection,source,event.key==='ArrowUp'?abilityRef(next):abilityRef(siblings[index+2]),list.dataset.abilityGroup||'',true);
  },{signal:control.signal});
  root.addEventListener('keydown',event=>{if(!event.target.matches('[data-spell-level]')||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const levels=['all',0,1,2,3,4,5,6,7,8,9],at=levels.indexOf(spellFilter),level=event.key==='Home'?'all':event.key==='End'?9:levels[(at+(event.key==='ArrowRight'?1:10))%11];selectSpellLevel(level,true);},{signal:control.signal});
 async function persistRemaining(){
  if(remainingPromise)return remainingPromise;
  const patch=pendingRemaining,resources={...pendingResourceFields};if(!patch&&!Object.keys(resources).length)return true;
  clearTimeout(remainingTimer);clearTimeout(resourceTimer);pendingRemaining=null;pendingResourceFields={};
  remainingPromise=(async()=>{try{if(Object.keys(resources).length&&!await save({action:'fields',fields:resources},true))return false;return patch?await save({action:'entry',collection:patch.collection,index:patch.index,mode:'update',fields:{u_curr:patch.value}},true):true;}finally{remainingPromise=null;}})();return remainingPromise;
 }
 async function useEntry(collection,index,spendUse){if(remainingInvalid){status('Enter valid remaining uses first.');return;}clearTimeout(remainingTimer);if(remainingPromise&&!await remainingPromise)return;if((pendingRemaining||Object.keys(pendingResourceFields).length)&&!await persistRemaining())return;if(busy||conflict)return;if(collection==='spells')return roll('Spell',null,undefined,index);return roll('Ability',null,undefined,undefined,{collection,index,spendUse});}
 root.addEventListener('click',event=>{
   const popout=event.target.closest('[data-sheet-popout]');
   if(popout){
    if(!event.defaultPrevented&&event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&openCharacterSheetPopup(popout.href,character.id))event.preventDefault();
    return;
   }
  const settingsPanel=root.querySelector('[data-recovery-panel]');if(settingsPanel&&!settingsPanel.hidden&&!event.target.closest('[data-recovery-panel],[data-recovery-menu]')){settingsPanel.hidden=true;root.querySelector('[data-recovery-menu]')?.setAttribute('aria-expanded','false');}
   const button=event.target.closest('button');if(!button)return;
   if(button.matches('[data-add-source-field]')){
    const area=root.querySelector('[data-source-fields]');
    if(area&&area.children.length<100){
     const row=document.createElement('div');row.className='cs-source-field-row';row.dataset.sourceFieldRow='';
     row.innerHTML='<label class="cs-field"><span>Original column name</span><input data-source-field-name maxlength="100"></label><label class="cs-field cs-field-wide"><span>Value</span><textarea data-source-field-value rows="2" maxlength="12000"></textarea></label><button type="button" class="button" data-remove-source-field>Remove</button>';
     area.append(row);row.querySelector('input').focus();dirty=true;
    }
    return;
   }
   if(button.matches('[data-remove-source-field]')){button.closest('[data-source-field-row]')?.remove();dirty=true;return;}
   if(button.closest('[data-item-description-dialog]')&&button.matches('[data-edit-entry],[data-remove-entry],[data-favorite]'))itemDescriptionDialog()?.close();
   if(button.matches('[data-add-sheet]')){
    if(!canOpenTabs()||openPicker())return;
    openCharacterPicker(root,{signal:control.signal,hasTab:tabs.has,onSelect:async next=>{
     if(!await canSwitch()||closed)return;
     tabs.remember(id,currentView());tabs.add(next);switchTo(next.id);
    }});
    return;
   }
   if(button.matches('[data-switch-sheet],[data-close-sheet]')){
    const closeId=button.dataset.closeSheet,target=button.dataset.switchSheet||closeId;
    if(!canOpenTabs()||!tabs.has(target)||!closeId&&target===id)return;
    if(closeId&&closeId!==id){tabs.close(closeId,id);root.querySelector('.cs-sheet-tabs').outerHTML=tabs.render(id);return;}
    void (async()=>{
     if(!await canSwitch()||closed)return;
     tabs.remember(id,currentView());
     const next=closeId?tabs.close(closeId,id):target;
     if(next!==id)switchTo(next);
    })();
    return;
   }
   if(button.matches('[data-add-entry="items"]')){
    if(busy||conflict||openPicker())return;
    if(character.owned===false){editEntry('items',null);return;}
    openInventoryPicker(root,{signal:control.signal,onCustom:()=>editEntry('items',null),
     getBalance:()=>character?.data?.currency_gil??character?.data?.gil??0,
     onAdd:async(itemId,quantity)=>await save({action:'addCatalogItem',itemId,quantity})?'':root.querySelector('[data-sheet-status]')?.textContent||'Could not add item.',
     onBuy:async(item,quantity,requestId)=>{
      if(busy||closed||conflict||dirty)throw Error('Finish saving this character before buying.');
      const change={op:'buy',requestId,characterId:id,itemId:item.id,quantity,revision:character.revision,itemRevision:item.revision};
      const response=await fetch('/api/v1/item-catalog/purchase',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(change)});
      const result=await response.json();
      if(!response.ok)throw Error(result.message||'Purchase could not be completed. Review your Gil and try again.');
      return result.receipt;
     },
     onPurchased:async receipt=>{
      if(closed)return;
      try{
       const refreshed=await request(null);
       if(closed)return;
       character=refreshed.character;itemTag='All';
       const url=new URL(location.href);url.searchParams.delete('itemTag');history.replaceState(null,'',url);
       draw();status('Bought '+receipt.quantity+' × '+receipt.itemName+' for '+receipt.totalGil+' Gil. Remaining: '+receipt.remainingGil+' Gil.');
      }catch(error){if(!closed)status('Purchase completed. Refresh the sheet to see the item and updated Gil. '+error.message);}
     }});
    return;
   }
   if(button.matches('[data-rename-character]')){
     if(character.data.manualCharacter!==true||busy||conflict||dirty){status('Save or refresh before renaming this character.');return;}
     const rename=root.querySelector('[data-rename-dialog]');
     if(rename){rename.querySelector('[data-rename-status]').textContent='';rename.showModal();rename.querySelector('[name=charName]')?.focus();}
     return;
    }
    if(button.matches('[data-rename-cancel]')){root.querySelector('[data-rename-dialog]')?.close();return;}
    if(button.matches('[data-inline-currency]')){
    if(busy||conflict||dirty||pendingRemaining||remainingPromise||remainingInvalid||Object.keys(pendingResourceFields).length){status('Save or refresh before editing currency.');return;}
    const field=button.dataset.inlineCurrency,current=Number(character.data[field]??(field==='currency_gil'?character.data.gil??0:field==='slot_cap'?20:0));
    const input=document.createElement('input');input.type='number';input.min=field==='slot_cap'?'1':'0';input.max='100000000';input.step='1';input.value=String(current);input.dataset.inlineCurrencyInput=field;input.dataset.originalValue=String(current);input.setAttribute('aria-label','Edit '+(field==='slot_cap'?'maximum capacity':field==='currency_gil'?'Gil':'Moogle'));
    button.hidden=true;button.after(input);input.focus();input.select();return;
   }
   if(button.matches('[data-ammo-operation]')){const operation=button.dataset.ammoOperation,change={action:'gunbreakerAmmo',operation};if(operation==='configure')change.profileId=root.querySelector('[data-ammo-profile]').value;if(['reload','fire','spend','brutal-shell'].includes(operation))change.rounds=Number(root.querySelector('[data-ammo-rounds]')?.value);void save(change);return;}
   if(button.matches('[data-combat-details]')){
    const kind=button.dataset.combatDetails;
    root.querySelector('#cs-dialog-title').textContent=kind==='attack'?'Attack rolls':'Defenses';
    root.querySelector('[data-dialog-fields]').innerHTML=renderCombatDetails(character.data,kind);
    root.querySelector('[data-dialog-status]').textContent='';
    root.querySelector('[data-sheet-form] button[type=submit]').hidden=true;dialog().showModal();return;
   }
   if(button.matches('[data-open-dice-themes]')){void import('./dice-theme-picker.mjs').then(m=>m.openDiceThemes());return;}
  if(button.matches('[data-recovery-menu]')){settingsPanel.hidden=!settingsPanel.hidden;button.setAttribute('aria-expanded',String(!settingsPanel.hidden));return;}
  if(button.matches('[data-toggle-stars]')){showStars=!showStars;root.querySelector('[data-sheet]').classList.toggle('cs-star-controls-off',!showStars);button.setAttribute('aria-pressed',String(showStars));button.setAttribute('aria-label',(showStars?'Hide':'Show')+' favorite controls');return;}
  if(button.matches('[data-box-favorite]')){const key=button.dataset.boxFavorite,old=character.data.favorite_boxes||[];void save({action:'fields',fields:{favorite_boxes:old.includes(key)?old.filter(k=>k!==key):[...old,key]}});return;}
  if(button.matches('[data-entry-send]')){const [collection,index]=button.dataset.entrySend.split(':');void roll('Description',null,collection==='weapons'?Number(index):undefined,collection==='spells'?Number(index):undefined,abilityTabs.includes(collection)?{collection,index:Number(index),spendUse:false}:undefined,'send');return;}
  if(button.matches('[data-entry-use],[data-entry-roll]')){const [collection,index]=(button.dataset.entryUse||button.dataset.entryRoll).split(':');void useEntry(collection,Number(index),true);return;}
  if(button.matches('[data-favorite]')&&(pendingRemaining||remainingPromise||remainingInvalid)){if(remainingInvalid){status('Enter valid remaining uses first.');return;}clearTimeout(remainingTimer);void(async()=>{if(!await persistRemaining())return;const [collection,index]=button.dataset.favorite.split(':');await save({action:'entry',collection,index:Number(index),mode:'update',fields:{favorite:character.data[collection][Number(index)].favorite!==true}});})();return;}
  if(button.matches('[data-edit-entry]')&&(pendingRemaining||remainingPromise||Object.keys(pendingResourceFields).length)){void(async()=>{if(!await persistRemaining())return;const [key,index]=button.dataset.editEntry.split(':');editEntry(key,Number(index));})();return;}
  if(busy)return;
  if(button.matches('[data-delete-character]'))return;
  if(button.matches('[data-collapse-weapons]')){weaponsCollapsed=!weaponsCollapsed;syncWeapons();return;}
  if(button.matches('[data-entry-preview]')){openEntryPreview(button.dataset.entryPreview);return;}
  if(button.matches('[data-entry-popup-close]')){root.querySelector('[data-entry-popup]').close();return;}
  if(button.matches('[data-rich-format]')){
    const editor=button.closest('[data-rich-editor]')?.querySelector('textarea');if(!editor)return;
    const result=applyRichFormat(editor.value,editor.selectionStart,editor.selectionEnd,button.dataset.richFormat);
    editor.value=result.value;editor.focus();editor.setSelectionRange(result.selectionStart,result.selectionEnd);
    editor.dispatchEvent(new Event('input',{bubbles:true}));return;
   }
   if(button.matches('[data-remove-damage-type]')){const type=button.dataset.removeDamageType;button.closest('.cs-damage-tag').remove();for(const option of root.querySelector('[data-add-damage-type]').options)if(option.value===type)option.disabled=false;dirty=true;return;}
  if(button.matches('[data-level-up],[data-open-rest]')){const modal=document.createElement('dialog');modal.className='cs-dialog cs-quick-action';modal.setAttribute('aria-label',button.hasAttribute('data-level-up')?'Level up':'Rest');modal.innerHTML=button.hasAttribute('data-level-up')?'<a class="button primary" href="create-identity.html?characterId='+encodeURIComponent(button.dataset.levelUp)+'&levelUp=1">Level up</a>':'<button class="button primary" type="button" data-confirm-rest>Rest</button>';modal.addEventListener('click',event=>{if(event.target===modal)modal.close();if(event.target.closest('[data-confirm-rest]')){modal.close();void save({action:'rest'});}});modal.addEventListener('close',()=>modal.remove(),{once:true});document.body.append(modal);modal.showModal();return;}
  if(button.matches('[data-editor-premade]')){
    if(!abilityTabs.includes(dialogState?.change?.collection))return;
    if(dirty&&!confirm('Discard unsaved manual ability edits and browse premade abilities?'))return;
    dialog().close();dirty=false;void openRuleAbilities();return;
   }
   if(button.matches('[data-rule-abilities]')){button.closest('details')?.removeAttribute('open');void openRuleAbilities();return;}
   if(button.matches('[data-add-manual-ability]')){button.closest('details')?.removeAttribute('open');editEntry(ability,null);return;}
  if(button.matches('[data-accessory-open]')){const panel=root.querySelector('.cs-accessory-panel');panel.open=!panel.open;button.setAttribute('aria-expanded',String(panel.open));if(panel.open)panel.scrollIntoView({block:'nearest'});return;}

  if(button.matches('[data-item-view]')){
   if(dirty&&!confirm('Discard unsaved edits?'))return;
   itemView=button.dataset.itemView==='inventory'?'inventory':'equip';
   draw();const url=new URL(location.href);url.searchParams.set('itemView',itemView);history.replaceState(null,'',url);return;
  }
  if(button.matches('[data-item-description]')){openItemDescription(button.dataset.itemDescription);return;}
  if(button.matches('[data-item-description-close]')){itemDescriptionDialog()?.close();return;}
  if(button.matches('[data-equip-slot]')){openEquipmentPicker(button.dataset.equipSlot);return;}
  if(button.matches('[data-equip-change]')){openEquipmentPicker(button.dataset.equipChange);return;}
  if(button.matches('[data-equip-unequip]')){
   if(!selectedEquipmentSlot||!equippedInSlot(character.data,selectedEquipmentSlot))return;
   void save({action:'equip',slot:selectedEquipmentSlot,index:null});return;
  }
  if(button.matches('[data-equip-choice]')){
   const slot=selectedEquipmentSlot,raw=button.dataset.equipChoice,[collection,rawIndex]=raw.split(':'),index=Number(rawIndex),item=character.data[collection]?.[index];
   if(!isEquipmentSlot(slot)||!['items','weapons'].includes(collection)||!Number.isInteger(index)||index<0||!item||!String(item.name||'').trim()||Number(item.amount??1)<1)return;
   if(button.getAttribute('aria-pressed')==='true'){equipmentDialog()?.close();return;}
   void save({action:'equip',slot,collection,index});return;
  }
  if(button.matches('[data-equipment-close]')){equipmentDialog()?.close();return;}
  if(button.matches('[data-combat-view]')){if(dirty&&!confirm('Discard unsaved edits?'))return;combatView=button.dataset.combatView;draw();const url=new URL(location.href);url.searchParams.set('combatView',combatView);history.replaceState(null,'',url);return;}
  if(button.matches('[data-ability-category]')){if(dirty&&!confirm('Discard unsaved edits?'))return;ability=button.dataset.abilityCategory;draw();const url=new URL(location.href);url.searchParams.set('ability',ability);history.replaceState(null,'',url);return;}
  if(button.matches('[data-resource-favorite]')){const key=button.dataset.resourceFavorite;clearTimeout(resourceTimer);void save({action:'fields',fields:{...pendingResourceFields,[key]:character.data[key]!==true}});return;}
  if(button.matches('[data-weapon-roll]')){void roll('Weapon',null,Number(button.dataset.weaponRoll));return;}
  if(button.matches('[data-favorite]')){const [collection,i]=button.dataset.favorite.split(':');void save({action:'entry',collection,index:Number(i),mode:'update',fields:{favorite:character.data[collection][Number(i)].favorite!==true}});return;}
  if(button.matches('[data-cast-entry]')){void roll('Spell',null,undefined,Number(button.dataset.castEntry.split(':')[1]));return;}
  if(button.matches('[data-item-tag]')){itemTag=button.dataset.itemTag;draw();const url=new URL(location.href);url.searchParams.set('itemTag',itemTag);history.replaceState(null,'',url);return;}
  if(button.matches('[data-spell-level]')){selectSpellLevel(button.dataset.spellLevel==='all'?'all':Number(button.dataset.spellLevel));return;}

  if(button.matches('[data-notes-tab]')){
   if(dirty&&!confirm('Discard unsaved edits?'))return;
   const next=button.dataset.notesTab;if(next!=='personal'&&!(character.partyTags||[]).some(tag=>tag.id===next))return;
   notesTab=next;section='notes';draw();const url=new URL(location.href);url.searchParams.set('section','notes');url.searchParams.set('notesTab',notesTab);history.replaceState(null,'',url);return;
  }
  if(button.matches('[data-sheet-tab]')){
   if((dirty||dialog()?.open)&&!confirm('Discard unsaved edits?'))return;section=button.dataset.sheetTab==='combat'&&button.closest('nav')?.getAttribute('aria-label')==='Character sheet'?lastFightSection:button.dataset.sheetTab;if(['combat','abilities','spells'].includes(section))lastFightSection=section;draw();const url=new URL(location.href);url.searchParams.set('section',section);history.replaceState(null,'',url);return;
  }
  if(button.matches('[data-dialog-close]')){dialog()?.close();dirty=false;if(!conflict)void refresh();return;}
  if(button.matches('[data-sheet-refresh]')){void refresh(true);return;}
  if(button.matches('[data-speed-details]')){
   if(busy||conflict){status(conflict?'Refresh to load the latest sheet.':'Saving…');return;}
   root.querySelector('[data-sheet-form] button[type=submit]').hidden=true;
   root.querySelector('#cs-dialog-title').textContent='Movement speeds';
   root.querySelector('[data-dialog-fields]').innerHTML=renderSpeedDetails(character.data);
   root.querySelector('[data-dialog-status]').textContent='';
   dialog().showModal();return;
  }
  if(button.matches('[data-edit-stats]')){
   const group=button.dataset.editStats;
   if(character.kind==='npc'){
    if(group==='npcStats'||group==='npcText'||group.startsWith('npcStats:')||group.startsWith('npcText:')){
     const [kind,rawIndex]=group.split(':'),groups=kind==='npcStats'?npcStatGroups:npcTextGroups;
     const index=rawIndex===undefined?null:Number(rawIndex);
     if(index!==null&&(!Number.isInteger(index)||index<0||index>=groups.length))return;
     const labels=kind==='npcStats'?npcStatLabels:npcTextLabels,selection=index===null?null:groups[index];
     openDialog(selection?.title||(kind==='npcStats'?'NPC stats':'Stat block details'),
      selection?.keys||Object.keys(labels),character.data[kind]||{},{action:kind,collection:kind});return;
    }
    if(group==='npcHealth'){openDialog('NPC HP',['hp_curr','hp_max','hp_temp'],character.data,{action:'fields',collection:'npcHealth'});return;}
   }
   const values={...character.data},s=sheetStats(values);if(group==='resources'){values.mp_curr=s.mp;values.mp_class=values.mp_class??s.mpMax;values.mp_bonus=values.mp_bonus??0;}if(group==='currency')values.currency_gil=values.currency_gil??values.gil??0;
   if(group==='attack')for(const key of ['ar_ranged_ability','ar_ranged_touch_ability'])values[key]||='dex';
   if(group==='identity')values.size_category=values.size_category||values.size||'Medium';
   openDialog(readable(group),groupFields[group],values,{action:'fields'},{help:''});return;
  }
  if(button.matches('[data-add-ability-group]')){editAbilityGroup(button.dataset.addAbilityGroup);return;}
  if(button.matches('[data-edit-ability-group],[data-delete-ability-group]')){
   const id=button.dataset.editAbilityGroup||button.dataset.deleteAbilityGroup,g=(character.data.abilityGroups||[]).find(g=>g.id===id);if(!g)return;
   if(button.hasAttribute('data-delete-ability-group')){if(confirm('Delete this group? Its abilities will stay in '+titles[g.collection]+'.'))void save({action:'abilityGroup',mode:'remove',collection:g.collection,id});}
   else editAbilityGroup(g.collection,id);return;
  }
  if(button.matches('[data-edit-entry]')){const [key,i]=button.dataset.editEntry.split(':');editEntry(key,Number(i));return;}
  if(button.matches('[data-add-entry]')){editEntry(button.dataset.addEntry,null);return;}
  if(button.matches('[data-remove-entry]')){const [key,i]=button.dataset.removeEntry.split(':');if(confirm('Delete this entry?'))void save({action:'entry',collection:key,index:Number(i),mode:'remove'});return;}
  if(button.matches('[data-add-temp-hp]')){void save({action:'fields',fields:{hp_temp:1}});return;}
  if(button.matches('[data-temp-hp-delta]')){void save({action:'fields',fields:{hp_temp:Math.max(0,sheetStats(character.data).hpTemp+Number(button.dataset.tempHpDelta))}});return;}
  if(button.matches('[data-resource]')){const key=button.dataset.resource,s=sheetStats(character.data),value=(key==='hp_curr'?s.hp:s.mp)+Number(button.dataset.delta);void save({action:'fields',fields:{[key]:value}});return;}
  if(button.matches('[data-use]')){const index=Number(button.dataset.use),row=character.data.activeAbilities[index];void save({action:'useAbility',index});return;}
  if(button.matches('[data-damage-roll]')){roll(button.dataset.damageLabel+' damage',button.dataset.damageRoll);return;}
  if(button.matches('[data-skill-index]')){
    const index=Number(button.dataset.skillIndex),row=sheetSkills(character.data)[index];
    if(!row||!skillCanRoll(row)){status('Trained only: assign at least 1 rank to this skill before rolling.');return;}
    void roll(skillDisplayName(row),null,undefined,undefined,undefined,'use',index);return;
   }
   if(button.matches('[data-roll]')){roll(button.dataset.roll,'1d20'+(Number(button.dataset.bonus)>=0?'+':'')+number(button.dataset.bonus));return;}
  if(button.matches('[data-formula]')){showFormula(button.dataset.formula);return;}
  if(button.matches('[data-spend-mp]')){openDialog('Spend MP',['amount'],{amount:1},{action:'spendMp'},{help:'Enter the MP cost for this cast.'});return;}
 },{signal:control.signal});
 root.addEventListener('keydown',event=>{
   if(!event.target.matches('[data-inline-currency-input]'))return;
   if(event.key==='Escape'){event.preventDefault();event.target.dataset.cancelled='true';event.target.blur();}
   else if(event.key==='Enter'){event.preventDefault();event.target.blur();}
  },{signal:control.signal});
  root.addEventListener('focusout',event=>{
   const input=event.target;if(!input.matches('[data-inline-currency-input]'))return;
   const button=input.previousElementSibling,field=input.dataset.inlineCurrencyInput,old=Number(input.dataset.originalValue);
   input.remove();if(button)button.hidden=false;
   if(input.dataset.cancelled==='true')return;
   const value=Number(input.value);
   if(input.value.trim()===''||!Number.isSafeInteger(value)||value<(field==='slot_cap'?1:0)||value>100000000){status('Enter a valid whole number'+(field==='slot_cap'?' of at least 1':' of at least 0')+'.');return;}
   if(value!==old)void save({action:'fields',fields:{[field]:value}});
  },{signal:control.signal});
  root.addEventListener('submit',event=>{
  if(event.target.matches('[data-rename-form]')){
    event.preventDefault();
    const name=event.target.elements.charName.value.trim();
    const message=root.querySelector('[data-rename-status]');
    if(!name||name.length>80){if(message)message.textContent='Enter a name of 1–80 characters.';return;}
    if(busy||conflict)return;
    void save({op:'edit',fields:{charName:name}});
    return;
   }
   if(!event.target.matches('[data-sheet-form],[data-notes]'))return;event.preventDefault();
  if(event.target.matches('[data-notes]')){void save({action:'fields',fields:{notesArea:event.target.elements.notesArea.value}});return;}
  const fields={};for(const key of dialogState.keys){if(key==='damage_types'){fields[key]=new FormData(event.target).getAll(key);continue;}const node=event.target.elements[key];if(dialogState.change.action==='npcStats'||dialogState.change.action==='npcText'){fields[key]=node.value;continue;}if(dialogState.change.collection==='npcHealth'){fields[key]=node.value===''?null:Number(node.value);continue;}if(dialogState.change.collection==='items'){fields[key]=boolKeys.has(key)?node.checked:['weight','amount'].includes(key)?Number(node.value):node.value;continue;}if(['caster_level','mp_cost','spell_failure','save_dc_override','attack_bonus_override'].includes(key)&&node.value===''){fields[key]='';continue;}fields[key]=boolKeys.has(key)?node.checked:textKeys.has(key)||node.tagName==='SELECT'?node.value:Number(node.value);}
  if(dialogState.change.collection==='items')fields.sourceFields=sourceFieldsFromEditor();
  if(dialogState.change.action==='spendMp'){void save({action:dialogState.change.action,amount:fields.amount});return;}
  void save({...dialogState.change,fields});
 },{signal:control.signal});
 root.addEventListener('change',event=>{
  if(!event.target.matches('[data-add-damage-type]')||!event.target.value)return;const select=event.target,type=select.value;root.querySelector('[data-damage-tags]').insertAdjacentHTML('beforeend',damageTag(type));select.selectedOptions[0].disabled=true;select.value='';dirty=true;},{signal:control.signal});
 root.addEventListener('input',event=>{
   if(event.target.closest('.cs-weapon-editor')&&event.target.matches('[name=attack_misc]'))updateWeaponEditorPreview();
   // Shopping dialog inputs do not represent unsaved character edits.
   if(event.target.closest('.cs-picker,.cs-catalog-preview'))return;
  if(event.target.matches('[data-owlbear-section-slider]')){const output=root.querySelector('[data-owlbear-nav-label]');if(output)output.textContent=['Favorites','Character','Combat','Skills','Inventory','Notes'][Number(event.target.value)]||'Character';return;}
   if(event.target.matches('[data-ammo-profile],[data-ammo-rounds]')){dirty=true;status('Choose an ammunition action to save.');return;}
  if(event.target.matches('[data-equip-search]')){
   equipmentDialog().querySelector('[data-equip-choices]').innerHTML=renderEquipChoices(character.data,event.target.value,selectedEquipmentSlot);
   return;
  }
  if(event.target.matches('[data-ability-remaining]')){clearTimeout(remainingTimer);const [collection,index]=event.target.dataset.abilityRemaining.split(':'),value=Number(event.target.value);dirty=true;status('Unsaved uses');if(event.target.value!==''&&Number.isInteger(value)&&value>=0&&value<=Number(event.target.max)){remainingInvalid=false;pendingRemaining={collection,index:Number(index),value};remainingTimer=setTimeout(()=>void persistRemaining(),650);}else{remainingInvalid=true;pendingRemaining=null;status('Enter whole uses between 0 and maximum.');}return;}

  if(event.target.matches('[data-sheet-search]')){const d=character.data,q=event.target.value;root.querySelector('[data-sheet-list]').innerHTML=section==='skills'?renderSkillRows(d,q):section==='items'?collectionBlock('items',d,q,{category:itemTag}):section==='spells'?collectionBlock('spells',d,q,{level:spellFilter==='all'?null:spellFilter}):collectionBlock(ability,d,q);return;}
  if((event.target.closest('form')||event.target.matches('[data-resource-input]'))){dirty=true;status('Unsaved changes');}
  if(event.target.matches('[data-resource-input]')){clearTimeout(resourceTimer);const key=event.target.dataset.resourceInput,value=Number(event.target.value);if(event.target.value!==''&&Number.isFinite(value)&&(key!=='hp_temp'||value>=0)){pendingResourceFields[key]=value;resourceTimer=setTimeout(()=>{if(Object.keys(pendingResourceFields).length)void save({action:'fields',fields:{...pendingResourceFields}});},650);}}
 },{signal:control.signal});
 root.addEventListener('change',event=>{
   if(event.target.closest('.cs-weapon-editor')&&event.target.matches('[name=attack_type],[name=ability_mod],[name=damage_ability],[name=damage_style],[name=attack_misc]')){
    if(event.target.name==='attack_type'&&dialogState?.change?.mode==='add'&&dialogState?.change?.collection==='weapons'){
     const prev=event.target.dataset.lastAttackType||'melee';
     const prior=weaponDefaultAbilities(prev,character.data),next=weaponDefaultAbilities(event.target.value,character.data);
     for(const [field,oldStat,newStat] of [['ability_mod',prior.attack,next.attack],['damage_ability',prior.damage,next.damage]]){
      const select=root.querySelector('[data-sheet-form] [name='+field+']');
      if(select&&select.dataset.userOverride!=='true'&&select.value===oldStat)select.value=newStat;
     }
     event.target.dataset.lastAttackType=event.target.value;
    }else if(['ability_mod','damage_ability'].includes(event.target.name))event.target.dataset.userOverride='true';
    updateWeaponEditorPreview();return;
   }
  if(event.target.matches('[data-owlbear-section-slider]')){const tabs=['favorites','overview','combat','skills','items','notes'],target=tabs[Number(event.target.value)];if(target)root.querySelector('.cs-tabs[aria-label="Character sheet"] [data-sheet-tab="'+target+'"]')?.click();return;}
   if(event.target.matches('[data-sheet-portrait]')){const file=event.target.files?.[0];if(!file)return;if(busy||conflict){status('Save or refresh before changing the portrait.');return;}status('Preparing portrait…');void processPicture(file).then(portrait=>save({op:'wizard',step:'identity',fields:{charName:character.name,alignment:character.data.alignment||'',bio:character.data.bio||'',portrait}})).catch(err=>status(err.message));return;}
  if(event.target.matches('[data-sheet-background]')){void save({action:'fields',fields:{sheet_background_enabled:event.target.checked}});return;}
  if(event.target.matches('[data-spell-ability]')){void save({action:'fields',fields:{spell_dc_base:event.target.value}});return;}
  if(event.target.matches('[name=sourceCategory],[name=shopSource]')){
   const select=event.target,dialogFields=root.querySelector('[data-dialog-fields]');
   if(dialogState?.change?.collection==='items'){
    const oldFields=Object.fromEntries(new FormData(root.querySelector('[data-sheet-form]')).entries());
    for(const [key,value] of Object.entries(oldFields))dialogState.values[key]=value;
    const twoHanded=root.querySelector('[name=two_handed]');if(twoHanded)dialogState.values.two_handed=twoHanded.checked;
    dialogState.values.sourceFields=sourceFieldsFromEditor();
   dialogState.values[select.name]=select.value;dialogState.keys=inventoryEditorKeys(dialogState.values.sourceCategory);
    dialogFields.innerHTML=renderEntryFields(dialogState.keys,dialogState.values,'items');
    dirty=true;status('Unsaved changes');
   }else root.querySelector('[data-category-icon]').textContent=itemCategorySymbol(select.value);
  }
  if(event.target.matches('[data-discord-rolls]')){discordEnabled=event.target.checked;notify('Discord roll '+(discordEnabled?'on':'off'));}
  if(event.target.matches('[data-resource-input]')){clearTimeout(resourceTimer);const value=Number(event.target.value);if(event.target.value!==''&&Number.isFinite(value)&&(event.target.dataset.resourceInput!=='hp_temp'||value>=0)){pendingResourceFields[event.target.dataset.resourceInput]=value;void save({action:'fields',fields:{...pendingResourceFields}});}}

 },{signal:control.signal});
 root.addEventListener('toggle',event=>{const detail=event.target;if(detail.matches?.('.cs-accessory-panel')){root.querySelector('[data-accessory-open]')?.setAttribute('aria-expanded',String(detail.open));return;}if(!detail.matches?.('[data-entry-details]')||!detail.open)return;const [key,i]=detail.dataset.entryDetails.split(':');const row=character?.data[key]?.[Number(i)];if(row)detail.querySelector('[data-entry-detail-body]').innerHTML=entryDetail(row,character.data,key);},{capture:true,signal:control.signal});
 root.addEventListener('cancel',()=>{dirty=false;},{capture:true,signal:control.signal});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();},{signal:control.signal});
 window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}},{signal:control.signal});
 root.innerHTML=sheetLoading();
 void request().then(result=>{if(closed)return;character=result.character;admin=result.admin===true;draw();const scroll=tabs.view(id)?.scrollY;if(scroll!==undefined)window.scrollTo(0,scroll);schedule();if(!document.body.hasAttribute('data-owlbear-sheet')&&typeof EventSource!=='undefined'){stream=new EventSource(endpoint+'?stream=1');stream.onmessage=()=>void refresh();}}).catch(err=>{if(!closed){root.innerHTML='<h1>Character sheet</h1><p role="status">'+e(err.name==='TimeoutError'?'The character server took too long to respond. Please retry.':err.message)+'</p><button class="button" type="button" data-retry-sheet>Retry</button><a class="button" href="signin.html">Sign in</a><a class="back" href="characters.html">← Characters</a>';root.querySelector('[data-retry-sheet]').onclick=()=>location.reload();}});
 return ()=>{disposeHold();disposeNotesElectric();clearFeedback();closed=true;disposeSettings?.();disposePartyNotes?.();notesGeneration++;clearTimeout(timer);clearTimeout(resourceTimer);clearTimeout(remainingTimer);stream?.close();control.abort();document.body.classList.remove('sheet-compact');};
}
