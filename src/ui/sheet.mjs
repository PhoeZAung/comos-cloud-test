import {actionTypes,actionType,damageTypes,selectedDamageTypes} from '../features/sheet/entry-options.mjs';
import {mountHoldButton,confirmCharacterDelete,crumpleSheet} from './sheet-delete.mjs';
import {mountNotesElectric} from './sheet-notes-electric.mjs';
import {mountSheetSettings} from './sheet-settings.mjs';
import {sheetLoading} from './sheet-loading.mjs';
import {MAGICKED_AMMO_ID} from '../features/characters/rules/gunbreaker-ammo.mjs';
import {notify,showDice,clearFeedback} from './feedback.mjs';
import {processPicture} from './character-view.mjs';
import {preferences} from './preferences.mjs';
import {recordId} from './record-id.mjs';
import {ITEM_TAG_OPTIONS,SHOP_ITEM_CATEGORY_GROUPS,itemCategoryForItem,itemCategorySymbol,inventoryCategoryCounts,visibleInventoryCategory} from '../features/sheet/item-categories.mjs';
import {spellLevel,damageTypeLine} from '../features/sheet/calculations.mjs';
import {inventoryEditorFields,inventoryEditorKeys,inventoryFieldLabel,inventoryItemDetails,inventoryItemValue,usableItemImageUrl,normalizeInventoryText} from '../features/sheet/inventory-fields.mjs';
import {skillSupportsSpecialization} from '../features/sheet/skills.mjs';
import {abilities,sizes,number,modifier,sheetStats,attackType,attackTypes} from '../features/sheet/model.mjs';
import {applyRichFormat,formatSheetText} from '../features/sheet/rich-text.mjs';
import {escape as e,sections,renderCombatDetails,renderSheetFrame,renderSection,renderSpeedDetails,collectionBlock,renderSkillRows,entryDetail,titles,abilityTabs} from '../features/sheet/view.mjs';
import {isEquipmentSlot,equippedInSlot,renderEquipChoices} from '../features/sheet/equipment.mjs';
const groupFields={
 abilities:['str','dex','con','int','wis','cha'],identity:['size_category','languages','senses','speed','speed_burrow','speed_climb','speed_fly','speed_swim'],
 resources:['hp_curr','hp_temp','hp_max_temp','mp_curr','mp_temp','mp_max_temp'],hp:['hp_curr','hp_temp','hp_max_temp'],mp:['mp_curr','mp_temp','mp_max_temp'],
 defense:['ac_armor','ac_natural','ac_deflect','ac_dodge','ac_temp','touch_temp','flat_temp','cmd_temp'],
 attack:['init_temp','bab_temp','ar_melee_ability','ar_melee_temp','ar_ranged_ability','ar_ranged_temp','ar_touch_ability','ar_touch_temp','ar_ranged_touch_ability','ar_ranged_touch_temp','cmb_temp'],
 saves:['fort_base','fort_enhance','fort_temp','ref_base','ref_enhance','ref_temp','will_base','will_enhance','will_temp'],resistances:['resistances'],proficiencies:['proficiencies','favored_class_options'],currency:['currency_gil','currency_moogle'],capacity:['capacity_modifier','capacity_body_type'],spell:['spell_dc_base']
};
const labels={two_handed:'Two-handed (reserves both hands)',mp_cost:'MP Amount (blank = spell level)',casting_ability:'Casting ability',caster_level:'Caster level override',dc_misc:'Save DC adjustment',mp_adjustment:'MP cost adjustment',dc_formula:'Save DC formula',uses_formula:'Usage formula',damage:'Dice Roll',str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma',size_category:'Size',speed:'Land Speed (ft)',speed_burrow:'Burrow (ft)',speed_climb:'Climb (ft)',speed_fly:'Fly (ft)',speed_swim:'Swim (ft)',hp_curr:'Current HP',hp_temp:'Temporary HP',hp_max:'Base maximum HP',hp_max_temp:'Maximum HP adjustment',mp_curr:'Current MP (including temp)',mp_temp:'Temporary MP',mp_class:'Class MP',mp_bonus:'Bonus MP',mp_max_temp:'Maximum MP adjustment',init_temp:'Initiative misc',bab:'Base attack bonus',bab_temp:'BAB adjustment',ac_armor:'Armor',ac_natural:'Natural armor',ac_deflect:'Deflection',ac_dodge:'Dodge',ac_temp:'AC adjustment',touch_temp:'Touch adjustment',flat_temp:'Flat-footed adjustment',cmd_temp:'CMD adjustment',cmb_temp:'CMB adjustment',currency_gil:'Gil',currency_moogle:'Moogle',slot_cap:'Legacy capacity',capacity_modifier:'Capacity modifier (lb, +/-)',capacity_body_type:'Body type',carried:'Carried (counts toward weight)',weight:'Weight (lb)',spell_dc_base:'Spell ability',mp_max_spell_level:'Maximum spell level',desc:'Description',effect:'Effect',favored_class_options:'Favored class options',link:'Link (URL)',action_type:'Action type',damage_types:'Damage Type',misfire:'Misfire',u_curr:'Uses',u_max:'Max Usage',lvl:'Level / ranks',cs:'Class skill',temp:'Misc bonus',subName:'Specialization',stat:'Ability',ability_mod:'Ability Mod',extra_damage:'Extra damage (not multiplied on crit)',attack_misc:'Attack bonus',restoreOnLongRest:'Restore uses on rest',amount:'Quantity',equipped:'Equipped'};
const readable=k=>labels[k]||k.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const textKeys=new Set(['name','desc','effect','misfire','action_type','damage','extra_damage','range','type','crit_range','crit_mult','attack_type','duration','target','saving_throw','school','spell_resist','at_higher_lvls','subName','languages','senses','resistances','proficiencies','favored_class_options','link','dc_formula','uses_formula']);
const boolKeys=new Set(['cs','equipped','two_handed','restoreOnLongRest','carried']);
function richEditor(key,value,label,maxLength=12000){
 const controls=[['bold','Bold','B'],['italic','Italic','I'],['heading','Heading','H'],['bullet','Bullet list','•'],['left','Align left','L'],['center','Center','≣'],['right','Align right','R']];
 return '<div class="cs-field cs-field-wide cs-rich-field" data-rich-editor><div class="cs-rich-heading"><label for="cs-rich-'+key+'">'+label+'</label><details class="cs-rich-tools"><summary aria-label="Show formatting tools for '+label+'" title="Show formatting tools">☷</summary><div class="cs-rich-toolbar" role="toolbar" aria-label="'+label+' formatting">'+controls.map(([command,title,glyph])=>'<button type="button" data-rich-format="'+command+'" title="'+title+'" aria-label="'+title+'">'+glyph+'</button>').join('')+'</div></details></div><textarea id="cs-rich-'+key+'" name="'+key+'" rows="5" maxlength="'+maxLength+'">'+e(value||'')+'</textarea></div>';
}
function field(key,value,{weapon=false,item=false}={}){
 if(key==='capacity_body_type')return '<label class="cs-field"><span>Body type</span><select name="capacity_body_type"><option value="biped"'+(value!=='quadruped'?' selected':'')+'>Biped</option><option value="quadruped"'+(value==='quadruped'?' selected':'')+'>Quadruped</option></select></label>';
 if(key==='carried')return '<label class="cs-checkbox"><input type="checkbox" name="carried" '+(value!==false?'checked':'')+'><span>Carried (counts toward weight)</span></label>';
 if(key==='action_type')return '<label class="cs-field"><span>Action type</span><select name="action_type"><option value="">None (no icon)</option>'+actionTypes.map(type=>'<option'+(value===type?' selected':'')+'>'+type+'</option>').join('')+'</select></label>';
 if(key==='damage_types'){const chosen=selectedDamageTypes(value);return '<fieldset class="cs-field cs-field-wide cs-damage-tags"><legend>Damage Type</legend><div data-damage-tags>'+chosen.map(type=>damageTag(type)).join('')+'</div><select data-add-damage-type aria-label="Add damage type"><option value="">Add damage type…</option>'+damageTypes.map(type=>'<option'+(chosen.includes(type)?' disabled':'')+'>'+type+'</option>').join('')+'</select></fieldset>';}

 if(key==='img'&&item)return '<label class="cs-field"><span>Image URL (optional)</span><input type="text" name="img" maxlength="2048" autocomplete="off" value="'+e(usableItemImageUrl(value))+'" placeholder="https://example.com/image.png"><small class="cs-caption">Unsupported links are ignored when saving.</small></label>';
 if(key==='rarity'){const options=['','Common','Uncommon','Rare','Epic','Legendary'],selected=normalizeInventoryText(value,key);return '<label class="cs-field"><span>Rarity</span><select name="rarity">'+(selected&&!options.includes(selected)?'<option value="'+e(selected)+'" selected>Imported: '+e(selected)+'</option>':'')+options.map(v=>'<option value="'+v+'"'+(v===selected?' selected':'')+'>'+(v||'—')+'</option>').join('')+'</select></label>';}
 if(key==='sourceCategory')return '<label class="cs-field cs-field-wide cs-tag-editor"><span>Item Tag / Shop Category</span><div><span data-category-icon aria-hidden="true">'+itemCategorySymbol(value)+'</span><select name="sourceCategory" aria-label="Item Tag / Shop Category">'+Object.entries(SHOP_ITEM_CATEGORY_GROUPS).map(([group,tags])=>'<optgroup label="'+(group==='Other'?'Older Items':group)+'">'+tags.map(tag=>'<option value="'+tag+'"'+(value===tag?' selected':'')+'>'+tag+'</option>').join('')+'</optgroup>').join('')+'</select></div></label>';

 if(key==='crit_range'||key==='crit_mult'){const choices=key==='crit_range'?Array.from({length:20},(_,i)=>i===0?'20':(20-i)+'-20'):['x2','x3','x4','x5'];const normalized=String(value||'').replace(/[–—]/g,'-').replace('×','x');return '<label class="cs-field"><span>'+readable(key)+'</span><select name="'+key+'"><option value=""'+(!normalized?' selected':'')+'>Select</option>'+choices.map(v=>'<option value="'+v+'"'+(normalized===v?' selected':'')+'>'+v+'</option>').join('')+'</select></label>';}
 const label=item?inventoryFieldLabel(key):readable(key),opts=key==='attack_type'?(weapon?Object.keys(attackTypes):['none',...Object.keys(attackTypes)]):key==='ability_mod'&&weapon?['auto',...abilities]:key==='size_category'?sizes:key==='stat'||key==='ability_mod'||key==='spell_dc_base'||key==='casting_ability'?abilities:key.endsWith('_ability')?['str','dex']:null;
 if(opts)return `<label class="cs-field"><span>${label}</span><select name="${key}">${opts.map(opt=>'<option value="'+opt+'"'+(opt===String(value||opts[0])?' selected':'')+'>'+(key==='attack_type'?(attackTypes[opt]||'None'):opt==='auto'?'Use attack type':abilities.includes(opt)?opt.toUpperCase():opt)+'</option>').join('')}</select></label>`;
 if(boolKeys.has(key))return `<label class="cs-checkbox"><input type="checkbox" name="${key}" ${value?'checked':''}><span>${label}</span></label>`;
 if(['desc','effect','at_higher_lvls'].includes(key))return richEditor(key,item&&key==='desc'?normalizeInventoryText(value,key):value,label,item&&key==='desc'?30000:12000);
  if(['resistances','proficiencies','favored_class_options','special'].includes(key))return `<label class="cs-field cs-field-wide"><span>${label}</span><textarea name="${key}" rows="5" maxlength="${item&&key==='special'?30000:12000}">${e(item&&key==='special'?normalizeInventoryText(value,key):value||'')}</textarea></label>`;
  const isText=item?key!=='weight'&&key!=='amount':textKeys.has(key),optionalZero=!isText&&(/(?:_temp|_misc|_bonus|_adjustment)$/.test(key)||['u_curr','u_max','temp','attack_misc','dc_misc','mp_adjustment','weight','capacity_modifier'].includes(key));
  const display=optionalZero&&Number(value??0)===0?'':value??(isText?'':0);
  const shown=item&&isText&&key!=='name'?normalizeInventoryText(display,key):display;
  return `<label class="cs-field"><span>${label}</span><input name="${key}" type="${isText?'text':'number'}" ${isText?'maxlength="'+(key==='name'?120:key==='link'||item&&key==='img'?2048:12000)+'"':'step="any" '+(optionalZero||['caster_level','mp_cost'].includes(key)?'':'required')} value="${e(shown)}" ${optionalZero?'placeholder="0"':''} ${key==='name'?'required':''}></label>`;
}
const damageTag=type=>'<span class="cs-damage-tag"><input type="hidden" name="damage_types" value="'+e(type)+'">'+e(type)+'<button type="button" data-remove-damage-type="'+e(type)+'" aria-label="Remove '+e(type)+'">×</button></span>';
// One compact Identity editor, with no extra speed descriptions.
export function renderIdentityEditor(values={}){
 const details=['size_category','languages','senses'];
 const movement=['speed','speed_burrow','speed_climb','speed_fly','speed_swim'];
 const group=(label,keys,layout)=>'<fieldset class="cs-identity-group"><legend>'+label+'</legend><div class="cs-identity-fields '+layout+'">'+keys.map(k=>field(k,values[k])).join('')+'</div></fieldset>';
 return '<div class="cs-identity-editor">'+group('Character details',details,'cs-identity-details')+group('Movement speeds',movement,'cs-identity-movement')+'</div>';
}
export function rollDice(expression,random=limit=>{const range=4294967296,ceiling=range-range%limit;let x;do{x=crypto.getRandomValues(new Uint32Array(1))[0];}while(x>=ceiling);return x%limit+1;}){
 const match=/^\s*(\d{1,2})d(\d{1,4})(?:\s*([+-])\s*(\d{1,6}))?\s*$/i.exec(expression);if(!match)throw Error('Use dice such as 1d20+5 or 2d6.');
 const count=Number(match[1]),sides=Number(match[2]);if(count<1||count>50||sides<2||sides>1000)throw Error('Use 1–50 dice with 2–1,000 sides.');
 const rolls=Array.from({length:count},()=>random(sides)),bonus=Number(match[4]||0)*(match[3]==='-'?-1:1);return {expression,rolls,bonus,total:rolls.reduce((a,b)=>a+b,bonus)};
}
export function formatRoll(label,r){
 const receipt=(x,typed=false)=>x.total+' ('+x.expression+(x.rolls?.length?' · '+x.rolls.join(', '):'')+')'+(typed&&damageTypeLine(x)?' — '+damageTypeLine(x):'');
 const title=r.weaponName||r.spellName||r.abilityName||label;
 if(r.descriptionOnly)return title+(r.mpSpent!==undefined?' · '+r.mpSpent+' MP':'')+(r.remainingInfusedAmmo!==undefined?' · '+r.remainingInfusedAmmo+' infused rounds remaining':'')+(r.remainingUses!==undefined?' · '+r.remainingUses+' usage remaining':'')+'\n'+r.description;
 if(!['weapon','spell','ability'].includes(r.kind))return label+': '+receipt(r,true);
 const attack=r.kind==='weapon'?r:r.attack;
 return title+(r.mpSpent!==undefined?' · '+r.mpSpent+' MP':'')+(r.remainingInfusedAmmo!==undefined?' · '+r.remainingInfusedAmmo+' infused rounds remaining':'')+(r.remainingUses!==undefined?' · '+r.remainingUses+' usage remaining':'')+(attack?'\nAttack Roll: '+receipt(attack):'')+(r.damage?'\nDice Roll: '+receipt(r.damage,true):'')+(r.critical?.threat?'\nCrit!\nAttack Roll: '+receipt(r.critical.confirmation)+(r.critical.damage?'\nDice Roll: '+receipt(r.critical.damage,true):''):'');
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
 const root=document.querySelector('main'),id=new URL(location.href).searchParams.get('characterId'),compact=new URL(location.href).searchParams.get('compact')==='1';
 const control=new AbortController();let closed=false,character=null,admin=false,busy=false,conflict=false,dirty=false,timer=null,dialogState=null,polling=false,discordEnabled=true,stream=null,resourceTimer=null,pendingResourceFields={};let remainingTimer=null,pendingRemaining=null,remainingPromise=null;let remainingInvalid=false;
 let deletePending=false,weaponsCollapsed=false,disposeHold=()=>{},disposeNotesElectric=()=>{};let showStars=false,disposeSettings,disposePartyNotes,notesGeneration=0;let notesTab=new URL(location.href).searchParams.get('notesTab')||'personal';
 let section=new URL(location.href).searchParams.get('section')||({'sheet-inventory':'items','sheet-abilities':'abilities'}[document.body.dataset.page]||'overview');if(!sections.some(([k])=>k===section))section='overview';
 let ability=new URL(location.href).searchParams.get('ability')||'activeAbilities';if(!abilityTabs.includes(ability))ability='activeAbilities';
 let lastFightSection=['combat','abilities','spells'].includes(section)?section:'combat';
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
 const itemDescriptionDialog=()=>root.querySelector('[data-item-description-dialog]');
 const setBusy=value=>{busy=value;root.querySelector('[data-sheet]')?.classList.toggle('cs-saving',value);root.querySelectorAll('button,input,select,textarea').forEach(node=>{if(value){node.dataset.busyDisabled=String(node.disabled);node.disabled=true;}else if(node.dataset.busyDisabled!==undefined){node.disabled=node.dataset.busyDisabled==='true';delete node.dataset.busyDisabled;}});};
 async function request(body,revision){
  const res=await fetch(endpoint+(revision!==undefined?'?revision='+revision:''),{signal:body?control.signal:AbortSignal.any([control.signal,AbortSignal.timeout(15000)]),credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,op:body.op||'sheet',revision:character.revision})}:{})});
  const data=await res.json();if(!res.ok)throw Object.assign(Error(data.message||({401:'Sign in to open this sheet.',404:'Character unavailable.',409:'Changed elsewhere. Copy any unsaved edits, then Refresh.'})[res.status]||'Could not reach the character server.'),{status:res.status});return data;
 }
 function draw(){if(closed)return;disposeHold();disposeNotesElectric();disposeSettings?.();disposePartyNotes?.();disposePartyNotes=undefined;const notesTicket=++notesGeneration;if(!(character.partyTags||[]).some(tag=>tag.id===notesTab))notesTab='personal';if(section==='items'&&itemView==='inventory'){
  const visible=visibleInventoryCategory(inventoryCategoryCounts(character.data.items),itemTag);
  if(visible!==itemTag){itemTag=visible;const url=new URL(location.href);url.searchParams.set('itemTag',visible);history.replaceState(null,'',url);}
 }clearTimeout(remainingTimer);pendingRemaining=null;remainingInvalid=false;pendingResourceFields={};root.innerHTML=renderSheetFrame(character,section,{admin,compact,ability,combatView,itemView,itemTag,spellLevel:spellFilter,showStars,discordEnabled,notesTab,owlbear:document.body.hasAttribute('data-owlbear-sheet')});root.querySelector('[data-discord-rolls]').checked=discordEnabled;for(const strip of root.querySelectorAll('.item-category-tiles,.cs-spell-levels')){const chosen=strip.querySelector('[aria-pressed=true],[aria-selected=true]');if(chosen)strip.scrollLeft=Math.max(0,chosen.offsetLeft-strip.offsetLeft-(strip.clientWidth-chosen.offsetWidth)/2);}disposeSettings=mountSheetSettings(root);disposeNotesElectric=mountNotesElectric(root);disposeHold=mountHoldButton(root.querySelector('[data-delete-character]'),()=>void deleteCharacter(),{signal:control.signal});syncWeapons();const notesRoot=root.querySelector('[data-party-notes]');if(notesRoot)void import('./party-notes.mjs').then(module=>{if(!closed&&notesTicket===notesGeneration&&notesRoot.isConnected)disposePartyNotes=module.mountPartyNotes(notesRoot,{characterId:id,tagId:notesRoot.dataset.partyNotes});}).catch(()=>{if(notesRoot.isConnected)notesRoot.querySelector('[role=status]').textContent='Could not open party notes.';});document.title=character.name+' · Cosmos';dirty=false;}
 async function save(change,skipPending=false){
  if(!skipPending){if(change.action==='fields')for(const key of Object.keys(change.fields||{}))delete pendingResourceFields[key];if((pendingRemaining||remainingPromise||Object.keys(pendingResourceFields).length)&&!await persistRemaining())return false;}
  if(busy||closed||conflict)return false;setBusy(true);status('Saving…');
  try{const result=await request(change);if(closed)return false;character=result.character;dirty=false;dialog()?.close();draw();status('Saved · Synced'+(admin?' · Admin':''));return true;}
  catch(err){if(closed)return false;if(err.status===409){conflict=true;root.querySelector('[data-sheet-refresh]').hidden=false;}status(err.message);const message=root.querySelector('[data-dialog-status]');if(message)message.textContent=err.message;const equipStatus=root.querySelector('[data-equip-status]');if(equipStatus)equipStatus.textContent=err.message;return false;}
  finally{if(!closed)setBusy(false);}
 }
 async function refresh(force=false){
  if(closed||busy||deletePending||polling||dragState||document.hidden||(!force&&document.activeElement?.matches('[data-party-notes-input]'))||(!force&&(dirty||conflict||(dialog()?.open||equipmentDialog()?.open||itemDescriptionDialog()?.open||root.querySelector('[data-entry-popup]')?.open))))return;
  if(force&&(dirty||dialog()?.open||equipmentDialog()?.open||itemDescriptionDialog()?.open||root.querySelector('[data-entry-popup]')?.open)&&!confirm('Discard unsaved edits and load the latest sheet?'))return;
  polling=true;const previousRevision=character?.revision;
  try{const result=await request(null,!force&&character?character.revision:undefined);if(closed||busy||character?.revision!==previousRevision)return;if(!result.unchanged){if(!force&&(dirty||dialog()?.open||equipmentDialog()?.open||itemDescriptionDialog()?.open||root.querySelector('[data-entry-popup]')?.open))return;character=result.character;admin=result.admin===true;conflict=false;draw();}status('Synced'+(admin?' · Admin':''));}
  catch(err){if(!closed)status(err.message);}
  finally{polling=false;}
 }
 function schedule(){clearTimeout(timer);if(closed)return;timer=setTimeout(async()=>{await refresh();schedule();},5000);}
 function openDialog(title,keys,values,change,{help=''}={}){
  if(busy||conflict){status(conflict?'Refresh to load the latest sheet before editing.':'Saving…');return;}
  root.querySelector('[data-sheet-form] button[type=submit]').hidden=false;dialogState={keys,change,values:{...values}};dialog().classList.add('cs-star-border');dialog().dataset.editor=change.collection||'';root.querySelector('#cs-dialog-title').textContent=title;
  root.querySelector('[data-dialog-fields]').innerHTML=keys===groupFields.identity?renderIdentityEditor(values):(help?'<p class="cs-caption">'+e(help)+'</p>':'')+renderEntryFields(keys,values,change.collection);
  root.querySelector('[data-dialog-status]').textContent='';if(['damage','heal','spendMp'].includes(change.action))root.querySelector('[name=amount]').closest('label').querySelector('span').textContent='Amount';dialog().showModal();
 }
 function renderEntryFields(keys,values,collection){
  const render=k=>field(k,collection==='items'&&!Object.hasOwn(values,k)?inventoryItemValue(values,k):values[k],{weapon:collection==='weapons',item:collection==='items'});
  if(collection==='items'){
   const parts=inventoryEditorFields(values.sourceCategory||'Misc'),group=(title,keys)=>'<fieldset class="cs-editor-group cs-inventory-field-group"><legend>'+e(title)+'</legend>'+keys.map(render).join('')+'</fieldset>';
   return '<div class="cs-form-grid cs-inventory-editor">'+render('sourceCategory')+render('name')+group('Item details',[...parts.common.map(([,key])=>key),...(parts.allowTwoHanded?['two_handed']:[]),'carried'])+(parts.extras.length?group(parts.category+' stats',parts.extras.map(([,key])=>key)):'')+'<div class="cs-ability-prose">'+render('desc')+render('special')+'</div></div>';
  }
  if(collection==='weapons')return '<div class="cs-form-grid cs-weapon-editor">'+render('name')+'<fieldset class="cs-editor-group"><legend>Attack Roll</legend>'+['attack_type','ability_mod','attack_misc','range','misfire'].filter(k=>keys.includes(k)).map(render).join('')+'</fieldset><fieldset class="cs-editor-group"><legend>Damage</legend>'+['damage','extra_damage','crit_range','crit_mult','damage_types'].filter(k=>keys.includes(k)).map(render).join('')+'</fieldset><fieldset class="cs-editor-group"><legend>Usage</legend>'+['u_curr','u_max'].filter(k=>keys.includes(k)).map(render).join('')+'</fieldset><fieldset class="cs-editor-group"><legend>Carried weight</legend>'+['weight','amount','carried'].filter(k=>keys.includes(k)).map(render).join('')+'</fieldset>'+render('desc')+'</div>';
  const narrative=keys.filter(k=>['desc','effect','at_higher_lvls'].includes(k));
   const abilityEditor=['spells','activeAbilities','passiveAbilities','racialAbilities','feats'].includes(collection);
   if(abilityEditor){
    const layouts=[['Identity',['name','lvl','school','type']],['Action & targeting',['action_type','attack_type','range','duration','target','saving_throw','spell_resist']],['Attack & rolls',['attack_misc','damage','dc_formula','casting_ability','caster_level','dc_misc','mp_cost']],['Uses & recovery',['uses_formula','u_max','u_curr','restoreOnLongRest']],['Reference',['link']]];
    const picked=new Set(layouts.flatMap(([,part])=>part));
    const remainder=keys.filter(k=>!picked.has(k)&&!narrative.includes(k));
    if(remainder.length)layouts.push(['Additional details',remainder]);
    const groups=layouts.map(([label,part])=>{const visible=part.filter(k=>keys.includes(k));return visible.length?'<fieldset class="cs-editor-group cs-ability-field-group"><legend>'+label+'</legend>'+visible.map(render).join('')+'</fieldset>':'';}).join('');
    return '<div class="cs-form-grid cs-ability-editor">'+groups+(narrative.length?'<fieldset class="cs-editor-group cs-ability-prose"><legend>Description & effects</legend>'+narrative.map(render).join('')+'</fieldset>':'')+'</div>';
   }
   return '<div class="cs-form-grid">'+keys.filter(k=>!['u_max','u_curr','desc','effect','at_higher_lvls'].includes(k)).map(render).join('')+(keys.includes('u_curr')?'<fieldset class="cs-editor-group cs-usage-fields"><legend>Usage</legend>'+['u_curr','u_max'].filter(k=>keys.includes(k)).map(render).join('')+'</fieldset>':'')+(narrative.length?'<div class="cs-ability-prose">'+narrative.map(render).join('')+'</div>':'')+'</div>';
 }
 function syncWeapons(){for(const collection of root.querySelectorAll('[data-collection="weapons"]')){collection.querySelector('.cs-entry-list').hidden=weaponsCollapsed;const toggle=collection.querySelector('[data-collapse-weapons]');toggle.setAttribute('aria-expanded',String(!weaponsCollapsed));toggle.setAttribute('aria-label',weaponsCollapsed?'Expand weapons':'Collapse weapons');toggle.title=weaponsCollapsed?'Expand weapons':'Collapse weapons';}}
 let dragState=null;
  function moveAbility(collection,from,to,focusAfter=false){
   if(from===to)return;
   if(busy||conflict||dirty||remainingInvalid){status('Save or refresh the sheet before reordering abilities.');return;}
   void(async()=>{
    if((pendingRemaining||remainingPromise||Object.keys(pendingResourceFields).length)&&!await persistRemaining())return;
    if(await save({action:'reorderAbility',collection,from,to})){if(focusAfter&&!closed)root.querySelector('[data-ability-drag="'+collection+':'+to+'"]')?.focus();}else if(!closed){draw();status('Ability order was not saved. Refresh and try again.');}
   })();
  }
  function clearAbilityDrag(cancel=false){
   const current=dragState;if(!current)return;dragState=null;
   const {row,placeholder,list,originalNext,handle,collection,from,to}=current;
   if(cancel){if(originalNext?.isConnected)list.insertBefore(row,originalNext);else list.append(row);placeholder.remove();}
   else placeholder.replaceWith(row);
   row.classList.remove('cs-ability-dragging');row.style.removeProperty('left');row.style.removeProperty('top');row.style.removeProperty('width');row.style.removeProperty('height');
   if(cancel)handle?.setAttribute('aria-pressed','false');else{for(const chosen of root.querySelectorAll('.cs-ability-selected'))chosen.classList.remove('cs-ability-selected');row.classList.add('cs-ability-selected');handle?.setAttribute('aria-pressed','true');}
   if(!cancel&&from!==to)moveAbility(collection,from,to);
  }
  function beginAbilityDrag(event){
   const handle=event.target.closest?.('[data-ability-drag]');
   if(!handle||event.button!==0||dragState||busy||conflict||dirty||remainingInvalid||pendingRemaining||remainingPromise||Object.keys(pendingResourceFields).length)return;
   const [collection,raw]=handle.dataset.abilityDrag.split(':'),from=Number(raw);
   if(!abilityTabs.includes(collection)||!Number.isInteger(from))return;
   const row=handle.closest('.cs-entry'),list=handle.closest('.cs-entry-list');if(!row||!list||!list.closest('[data-collection="'+collection+'"]'))return;
   const rect=row.getBoundingClientRect(),originalNext=row.nextSibling;
   const placeholder=document.createElement('div');placeholder.className='cs-ability-drop-slot';placeholder.style.height=Math.max(48,rect.height)+'px';row.before(placeholder);
   for(const chosen of root.querySelectorAll('.cs-ability-selected'))chosen.classList.remove('cs-ability-selected');
   for(const chosen of root.querySelectorAll('[data-ability-drag][aria-pressed=true]'))chosen.setAttribute('aria-pressed','false');
   row.classList.add('cs-ability-dragging','cs-ability-selected');row.style.left=rect.left+'px';row.style.top=rect.top+'px';row.style.width=rect.width+'px';row.style.height=rect.height+'px';
   handle.setAttribute('aria-pressed','true');
   dragState={id:event.pointerId,row,list,handle,placeholder,originalNext,collection,from,to:from,offsetY:event.clientY-rect.top};
   event.preventDefault();
   try{handle.setPointerCapture(event.pointerId);}catch{}
  }
  function updateAbilityDrag(event){
   const drag=dragState;if(!drag||event.pointerId!==drag.id)return;
   drag.row.style.top=event.clientY-drag.offsetY+'px';
   const others=[...drag.list.children].filter(node=>node.classList.contains('cs-entry')&&node!==drag.row);
   const before=new Map(others.map(node=>[node,node.getBoundingClientRect().top]));
   const target=others.find(node=>event.clientY<node.getBoundingClientRect().top+node.getBoundingClientRect().height/2);
   if(target)drag.list.insertBefore(drag.placeholder,target);else drag.list.append(drag.placeholder);
   const visible=[...drag.list.children].filter(node=>node===drag.placeholder||others.includes(node));
   const pos=visible.indexOf(drag.placeholder),next=visible[pos+1];
   const targetIndex=next?Number(next.dataset.abilityIndex):null;
   drag.to=targetIndex===null?(others.length?Number(others.at(-1).dataset.abilityIndex):drag.from):(targetIndex>drag.from?targetIndex-1:targetIndex);
   for(const [node,top] of before){const shift=top-node.getBoundingClientRect().top;if(Math.abs(shift)>1&&node.animate)node.animate([{transform:'translateY('+shift+'px)'},{transform:'translateY(0)'}],{duration:150,easing:'ease-out'});}
   if(event.clientY<55)window.scrollBy(0,-10);else if(event.clientY>window.innerHeight-55)window.scrollBy(0,10);
  }
  function openEntryPreview(ref){const [key,i]=ref.split(':'),row=character.data[key]?.[Number(i)];if(!row)return;const popup=root.querySelector('[data-entry-popup]');popup.querySelector('h2').textContent=row.name||'Unnamed';popup.querySelector('[data-entry-popup-content]').innerHTML=entryDetail(row,character.data,key);popup.showModal();}
 async function deleteCharacter(){
  if(deletePending||busy||conflict||dirty||pendingRemaining||remainingPromise||remainingInvalid||Object.keys(pendingResourceFields).length){status('Save or discard unsaved changes before deleting this character.');return;}
  deletePending=true;if(!await confirmCharacterDelete({signal:control.signal,name:character.name})||closed){deletePending=false;return;}
  setBusy(true);status('Deleting character…');
  try{const result=await request({op:'archive',confirmName:character.name});if(!result.archived)throw Error('The character could not be deleted.');
   clearTimeout(timer);stream?.close();await crumpleSheet(root.querySelector('[data-sheet]'));closed=true;disposeHold();disposeNotesElectric();disposeSettings?.();disposePartyNotes?.();notesGeneration++;clearTimeout(resourceTimer);clearTimeout(remainingTimer);control.abort();location.assign('characters.html');
  }catch(err){if(!closed)status(err.message);}finally{deletePending=false;if(!closed)setBusy(false);}
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
  const facts=inventoryItemDetails(item);popup.querySelector('[data-item-details]').innerHTML=facts.length?'<dl class="cs-inventory-facts">'+facts.map(([label,value])=>'<div><dt>'+e(label)+'</dt><dd>'+e(value)+'</dd></div>').join('')+'</dl>':'';
  popup.querySelector('[data-item-description-text]').innerHTML=formatSheetText(String(item.desc||item.description||'').trim()||'No description.');
  const special=popup.querySelector('[data-item-special]');special.hidden=!String(item.special||'').trim();special.innerHTML=item.special?'<h3>Special</h3><p>'+e(item.special)+'</p>':'';
  popup.showModal();
 }
 async function openRuleAbilities(){try{const {availableRuleAbilities}=await import('../features/characters/rules/ability-library.mjs');const options=availableRuleAbilities(character.data);const modal=document.createElement('dialog');modal.className='cs-dialog';modal.setAttribute('aria-label','Race and class abilities');modal.innerHTML='<div class="cs-card-title"><h2>Add abilities</h2><button type="button" class="cs-icon" data-library-close aria-label="Close">×</button></div><label class="cs-search">Find an ability<input type="search" data-library-search></label><div data-library-list></div><p role="status" data-library-status></p>';const drawLibrary=()=>{const query=modal.querySelector('[data-library-search]').value.toLowerCase();modal.querySelector('[data-library-list]').innerHTML=options.filter(o=>o.name.toLowerCase().includes(query)).map(o=>'<details class="cs-card"><summary>'+e(o.name)+'</summary><p class="cs-prose">'+e(o.description)+'</p>'+(o.url?'<a href="'+e(o.url)+'" target="_blank" rel="noopener">Official source ↗</a>':'')+'<button class="button" type="button" data-library-add="'+e(o.id)+'" '+(o.added?'disabled':'')+'>'+(o.added?'Added':'Add')+'</button></details>').join('')||'<p>No available abilities.</p>';};modal.addEventListener('input',drawLibrary);modal.addEventListener('click',async event=>{if(event.target.closest('[data-library-close]'))modal.close();const add=event.target.closest('[data-library-add]');if(!add)return;add.disabled=true;try{if(await save({action:'addRuleAbility',ruleId:add.dataset.libraryAdd})){const option=options.find(o=>o.id===add.dataset.libraryAdd);option.added=true;drawLibrary();notify('Added');}else add.disabled=false;}catch(error){modal.querySelector('[data-library-status]').textContent=error.message;add.disabled=false;}});modal.addEventListener('close',()=>modal.remove(),{once:true});document.body.append(modal);drawLibrary();modal.showModal();}catch(error){status(error.message);}}
 function showFormula(label){
  const d=character.data,s=sheetStats(d),n=k=>number(d[k]),mod=a=>s.mods[a];
  const size=[8,4,2,1,0,-1,-2,-4,-8][sizes.indexOf(d.size_category||d.size||'Medium')]||0;
  const formulas={
   'Initiative':`DEX ${mod('dex')} + adjustment ${n('init_temp')} = ${s.initiative}`,
   'BAB':`Base ${n('bab')} + adjustment ${n('bab_temp')} = ${s.bab}`,
   'Speed':`Saved movement speed: ${s.speed}`,
   'AC':`10 + DEX ${mod('dex')} + size ${size} + armor ${n('ac_armor')} + natural ${n('ac_natural')} + deflection ${n('ac_deflect')} + dodge ${n('ac_dodge')} + adjustment ${n('ac_temp')} = ${s.ac}`,
   'Touch':`10 + DEX ${mod('dex')} + size ${size} + deflection ${n('ac_deflect')} + dodge ${n('ac_dodge')} + adjustment ${n('touch_temp')} = ${s.touch}`,
   'Flat-footed':`10 + size ${size} + armor ${n('ac_armor')} + natural ${n('ac_natural')} + deflection ${n('ac_deflect')} + adjustment ${n('flat_temp')} = ${s.flat}`,
   'CMD':`10 + STR ${mod('str')} + DEX ${mod('dex')} − size ${size} + adjustment ${n('cmd_temp')} = ${s.cmd}`,
   'CMB':`BAB ${s.bab} + STR ${mod('str')} + DEX ${mod('dex')} − size ${size} + adjustment ${n('cmb_temp')} = ${s.cmb}`,
   'HP':`Current ${s.hp}; base maximum ${n('hp_max')} + maximum adjustment ${n('hp_max_temp')} = ${s.hpMax}; temporary HP ${s.hpTemp}`,
   'MP':`Current ${s.mp}; class ${n('mp_class')} + bonus ${n('mp_bonus')} + maximum adjustment ${n('mp_max_temp')} = ${s.mpMax}`,
   'Armor class':`Calculated AC: ${s.ac}`
  };
  for(const [name,key,stat] of [['Fortitude','fort','con'],['Reflex','ref','dex'],['Will','will','wis']])formulas[name]=`${stat.toUpperCase()} ${mod(stat)} + base ${n(key+'_base')} + enhancement ${n(key+'_enhance')} + adjustment ${n(key+'_temp')} = ${s[key]}`;
  for(const [name,key,fallback,total] of [['Melee','ar_melee','str',s.melee],['Ranged','ar_ranged','dex',s.ranged],['Touch attack','ar_touch','str',s.touchAttack],['Ranged touch','ar_ranged_touch','dex',s.rangedTouch]]){const stat=['str','dex'].includes(d[key+'_ability'])?d[key+'_ability']:fallback;formulas[name]=`BAB ${s.bab} + ${stat.toUpperCase()} ${mod(stat)} + size ${size} + adjustment ${n(key+'_temp')} = ${total}`;}
  root.querySelector('#cs-dialog-title').textContent=label+' calculation';root.querySelector('[data-dialog-fields]').innerHTML='<p class="cs-prose">'+e(formulas[label]||'Saved sheet value')+'</p><p class="cs-caption">Uses the saved sheet components. Class progression and conditional effects remain manual.</p>';root.querySelector('[data-dialog-status]').textContent='';root.querySelector('[data-sheet-form] button[type=submit]').hidden=true;dialog().showModal();
 }
 function editEntry(key,index){
  const row=character.data[key]?.[index]||{};
  const keys=key==='skills'?['lvl','temp','cs',...(skillSupportsSpecialization(row.name)?['subName']:[])]:key==='items'?inventoryEditorKeys(itemCategoryForItem(row)):key==='weapons'?['name','attack_type','ability_mod','attack_misc','damage','extra_damage','damage_types','range','misfire','crit_range','crit_mult','u_curr','u_max','weight','amount','carried','desc']:key==='spells'?['name','lvl','school','type','attack_type','attack_misc','range','duration','target','saving_throw','spell_resist','damage','casting_ability','caster_level','dc_misc','mp_cost','link','desc','at_higher_lvls']:row.rulesOwned?['name','action_type','attack_type','damage','dc_formula','uses_formula','restoreOnLongRest','link','desc','effect','at_higher_lvls']:['name','action_type','attack_type','damage','dc_formula',...(row.uses_formula?['uses_formula']:[]),'u_max','u_curr','restoreOnLongRest','link','desc','effect','at_higher_lvls'];
  if(character.data.gunbreakerAmmo!==undefined&&row.rulesOwned&&row.sourceRuleId===MAGICKED_AMMO_ID)for(const k of ['uses_formula','restoreOnLongRest']){const at=keys.indexOf(k);if(at>=0)keys.splice(at,1);}
  if(row.limitBreak||/limit[\s-]*break/i.test(String(row.sourceRuleId||'')+' '+String(row.rulesName||row.name||'')))for(const k of ['uses_formula','restoreOnLongRest','u_curr','u_max']){const at=keys.indexOf(k);if(at>=0)keys.splice(at,1);}
  const values={u_max:row.u_max??0,u_curr:row.u_curr??row.u_max??0,...row,action_type:actionType(row.action_type??row.type),damage_types:selectedDamageTypes(row.damage_types),sourceCategory:itemCategoryForItem(row),mp_cost:row.mp_cost??row.mpCost??row.mp_amount??row.mpAmount??'',lvl:key==='spells'?(spellLevel(row.lvl)??0):(row.lvl??0),damage:row.damage||row.dmg||'',amount:row.amount??1,stat:row.stat||'int',attack_type:key==='weapons'?attackType(row.attack_type):String(row.attack_type||'none').toLowerCase().replaceAll(' ','_'),ability_mod:String(row.ability_mod||row.mod||'auto').toLowerCase(),casting_ability:row.casting_ability||character.data.spell_dc_base||'int',caster_level:row.caster_level??'',restoreOnLongRest:row.restoreOnLongRest!==false};
  openDialog(index===null?'Add '+titles[key]:'Edit '+(row.name||titles[key]),keys,values,{action:'entry',collection:key,index,mode:index===null?'add':'update'},{help:key==='skills'?(skillSupportsSpecialization(row.name)?'Edit ranks, misc, class skill and specialization.':'Edit ranks, misc and class skill.'):''});
  if(index!==null&&key!=='skills')root.querySelector('[data-dialog-fields]').insertAdjacentHTML('beforeend','<button class="cs-delete" type="button" data-remove-entry="'+key+':'+index+'">Delete entry</button>');
 }
 async function roll(label,expression,weaponIndex,spellIndex,abilityEntry,mode='use'){
  clearTimeout(remainingTimer);if(remainingInvalid)return;if(remainingPromise&&!await remainingPromise)return;if((pendingRemaining||Object.keys(pendingResourceFields).length)&&!await persistRemaining())return;if(busy)return;setBusy(true);let node=root.querySelector('[data-roll-result]');node.hidden=false;node.textContent='Rolling…';
  try{const result=await request({op:'roll',...(abilityEntry?{kind:'ability',...abilityEntry}:spellIndex!==undefined?{kind:'spell',index:spellIndex}:weaponIndex===undefined?{expression,label}:{kind:'weapon',index:weaponIndex}),requestId:recordId(),...((weaponIndex!==undefined||spellIndex!==undefined||abilityEntry)?{mode}:{}),discord:mode==='send'||discordEnabled,discordStats:preferences.discordRollStats});if(closed)return;const r=result.roll;if(r.characterRevision!==undefined){try{const fresh=await request();character=fresh.character;draw();node=root.querySelector('[data-roll-result]');node.hidden=false;}catch{status('Use saved · Sync pending');}}const failed=result.discord==='failed';if(mode==='send'){node.hidden=true;notify(failed?'Discord delivery failed':result.discord==='sent'?'Sent to Discord':'Discord delivery pending');}else if(r.descriptionOnly){node.hidden=true;notify(failed?'Use · Discord delivery failed':'Use');}else{const present=()=>{if(closed)return;const current=root.querySelector('[data-roll-result]');if(current){current.textContent=formatRoll(label,r)+(failed?' · Discord delivery failed':'');current.hidden=false;}};if(document.body.hasAttribute('data-owlbear-sheet')||r.provider==='owlbear-dice-plus'){present();status('Rolled with Dice+');}else{node.hidden=false;node.textContent='Roll queued…';void showDice(r,{onResult:present});status('Rolled');}}document.dispatchEvent(new CustomEvent('comos:sheet-roll',{detail:{characterId:id,label,...r}}));}
  catch(err){if(!closed)node.textContent=err.message;}finally{if(!closed)setBusy(false);}
 }
 function selectSpellLevel(level,focus=false){spellFilter=level;draw();const url=new URL(location.href);url.searchParams.set('spellLevel',level);history.replaceState(null,'',url);if(focus){const tab=root.querySelector('[data-spell-level="'+level+'"]');tab.focus({preventScroll:true});tab.scrollIntoView({block:'nearest',inline:'nearest'});}}
 root.addEventListener('pointerdown',beginAbilityDrag,{signal:control.signal});
  root.addEventListener('pointermove',updateAbilityDrag,{signal:control.signal});
  root.addEventListener('pointerup',event=>{if(dragState?.id===event.pointerId)clearAbilityDrag();},{signal:control.signal});
  root.addEventListener('pointercancel',event=>{if(dragState?.id===event.pointerId)clearAbilityDrag(true);},{signal:control.signal});
  root.addEventListener('keydown',event=>{
   const grip=event.target.closest?.('[data-ability-drag]');if(!grip||!['ArrowUp','ArrowDown'].includes(event.key))return;
   event.preventDefault();
   const [collection,raw]=grip.dataset.abilityDrag.split(':'),from=Number(raw),all=[...grip.closest('.cs-entry-list').querySelectorAll('[data-ability-index]')];
   const pos=all.findIndex(node=>Number(node.dataset.abilityIndex)===from),next=all[pos+(event.key==='ArrowUp'?-1:1)];
   if(next)moveAbility(collection,from,Number(next.dataset.abilityIndex),true);
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
   const group=button.dataset.editStats,values={...character.data},s=sheetStats(values);if(group==='resources'){values.mp_curr=s.mp;values.mp_class=values.mp_class??s.mpMax;values.mp_bonus=values.mp_bonus??0;}if(group==='currency')values.currency_gil=values.currency_gil??values.gil??0;
   if(group==='identity')values.size_category=values.size_category||values.size||'Medium';
   openDialog(readable(group),groupFields[group],values,{action:'fields'},{help:''});return;
  }
  if(button.matches('[data-edit-entry]')){const [key,i]=button.dataset.editEntry.split(':');editEntry(key,Number(i));return;}
  if(button.matches('[data-add-entry]')){editEntry(button.dataset.addEntry,null);return;}
  if(button.matches('[data-remove-entry]')){const [key,i]=button.dataset.removeEntry.split(':');if(confirm('Delete this entry?'))void save({action:'entry',collection:key,index:Number(i),mode:'remove'});return;}
  if(button.matches('[data-add-temp-hp]')){void save({action:'fields',fields:{hp_temp:1}});return;}
  if(button.matches('[data-temp-hp-delta]')){void save({action:'fields',fields:{hp_temp:Math.max(0,sheetStats(character.data).hpTemp+Number(button.dataset.tempHpDelta))}});return;}
  if(button.matches('[data-resource]')){const key=button.dataset.resource,s=sheetStats(character.data),value=(key==='hp_curr'?s.hp:s.mp)+Number(button.dataset.delta);void save({action:'fields',fields:{[key]:value}});return;}
  if(button.matches('[data-use]')){const index=Number(button.dataset.use),row=character.data.activeAbilities[index];void save({action:'useAbility',index});return;}
  if(button.matches('[data-damage-roll]')){roll(button.dataset.damageLabel+' damage',button.dataset.damageRoll);return;}
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
  if(!event.target.matches('[data-sheet-form],[data-notes]'))return;event.preventDefault();
  if(event.target.matches('[data-notes]')){void save({action:'fields',fields:{notesArea:event.target.elements.notesArea.value}});return;}
  const fields={};for(const key of dialogState.keys){if(key==='damage_types'){fields[key]=new FormData(event.target).getAll(key);continue;}const node=event.target.elements[key];if(['caster_level','mp_cost'].includes(key)&&node.value===''){fields[key]='';continue;}fields[key]=boolKeys.has(key)?node.checked:textKeys.has(key)||node.tagName==='SELECT'?node.value:Number(node.value);}
  if(dialogState.change.action==='spendMp'){void save({action:dialogState.change.action,amount:fields.amount});return;}
  void save({...dialogState.change,fields});
 },{signal:control.signal});
 root.addEventListener('change',event=>{if(!event.target.matches('[data-add-damage-type]')||!event.target.value)return;const select=event.target,type=select.value;root.querySelector('[data-damage-tags]').insertAdjacentHTML('beforeend',damageTag(type));select.selectedOptions[0].disabled=true;select.value='';dirty=true;},{signal:control.signal});
 root.addEventListener('input',event=>{
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
  if(event.target.matches('[data-owlbear-section-slider]')){const tabs=['favorites','overview','combat','skills','items','notes'],target=tabs[Number(event.target.value)];if(target)root.querySelector('.cs-tabs[aria-label="Character sheet"] [data-sheet-tab="'+target+'"]')?.click();return;}
   if(event.target.matches('[data-sheet-portrait]')){const file=event.target.files?.[0];if(!file)return;if(busy||conflict){status('Save or refresh before changing the portrait.');return;}status('Preparing portrait…');void processPicture(file).then(portrait=>save({op:'wizard',step:'identity',fields:{charName:character.name,alignment:character.data.alignment||'',bio:character.data.bio||'',portrait}})).catch(err=>status(err.message));return;}
  if(event.target.matches('[data-sheet-background]')){void save({action:'fields',fields:{sheet_background_enabled:event.target.checked}});return;}
  if(event.target.matches('[data-spell-ability]')){void save({action:'fields',fields:{spell_dc_base:event.target.value}});return;}
  if(event.target.matches('[name=sourceCategory]')){
   const select=event.target,dialogFields=root.querySelector('[data-dialog-fields]');
   if(dialogState?.change?.collection==='items'){
    const oldFields=Object.fromEntries(new FormData(root.querySelector('[data-sheet-form]')).entries());
    for(const [key,value] of Object.entries(oldFields))dialogState.values[key]=value;
    const twoHanded=root.querySelector('[name=two_handed]');if(twoHanded)dialogState.values.two_handed=twoHanded.checked;
    dialogState.values.sourceCategory=select.value;dialogState.keys=inventoryEditorKeys(select.value);
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
 void request().then(result=>{if(closed)return;character=result.character;admin=result.admin===true;draw();schedule();if(!document.body.hasAttribute('data-owlbear-sheet')&&typeof EventSource!=='undefined'){stream=new EventSource(endpoint+'?stream=1');stream.onmessage=()=>void refresh();}}).catch(err=>{if(!closed){root.innerHTML='<h1>Character sheet</h1><p role="status">'+e(err.name==='TimeoutError'?'The character server took too long to respond. Please retry.':err.message)+'</p><button class="button" type="button" data-retry-sheet>Retry</button><a class="button" href="signin.html">Sign in</a><a class="back" href="characters.html">← Characters</a>';root.querySelector('[data-retry-sheet]').onclick=()=>location.reload();}});
 return ()=>{disposeHold();disposeNotesElectric();clearFeedback();closed=true;disposeSettings?.();disposePartyNotes?.();notesGeneration++;clearTimeout(timer);clearTimeout(resourceTimer);clearTimeout(remainingTimer);stream?.close();control.abort();document.body.classList.remove('sheet-compact');};
}
