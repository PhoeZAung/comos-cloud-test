import {notify,showDice,clearFeedback} from './feedback.mjs';
import {preferences} from './preferences.mjs';
import {recordId} from './record-id.mjs';
import {ITEM_TAG_OPTIONS,SHOP_ITEM_CATEGORY_GROUPS,itemCategoryForItem,itemCategorySymbol} from '../features/sheet/item-categories.mjs';
import {spellLevel} from '../features/sheet/calculations.mjs';
import {abilities,sizes,number,modifier,sheetStats,attackType,attackTypes} from '../features/sheet/model.mjs';
import {escape as e,sections,renderSheetFrame,renderSection,collectionBlock,renderSkillRows,entryDetail,titles,abilityTabs} from '../features/sheet/view.mjs';
import {equipmentSlots,equipmentSlotIds,equipmentSlotLabel,equippedInSlot,equipmentRows} from '../features/sheet/equipment.mjs';
const groupFields={
 abilities:['str','dex','con','int','wis','cha'],identity:['size_category','speed','languages','senses'],
 resources:['hp_curr','hp_temp','hp_max_temp','mp_curr','mp_temp','mp_max_temp','bab_temp'],
 defense:['ac_armor','ac_natural','ac_deflect','ac_dodge','ac_temp','touch_temp','flat_temp','cmd_temp'],
 attack:['init_temp','ar_melee_ability','ar_melee_temp','ar_ranged_ability','ar_ranged_temp','ar_touch_ability','ar_touch_temp','ar_ranged_touch_ability','ar_ranged_touch_temp','cmb_temp'],
 saves:['fort_base','fort_enhance','fort_temp','ref_base','ref_enhance','ref_temp','will_base','will_enhance','will_temp'],resistances:['resistances'],proficiencies:['proficiencies'],currency:['currency_gil','currency_moogle','slot_cap'],spell:['spell_dc_base']
};
const labels={two_handed:'Two-handed (reserves both hands)',mp_cost:'MP Amount (blank = spell level)',casting_ability:'Casting ability',caster_level:'Caster level override',dc_misc:'Save DC adjustment',mp_adjustment:'MP cost adjustment',dc_formula:'Save DC formula',uses_formula:'Usage formula',damage:'Dice Roll',str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma',size_category:'Size',hp_curr:'Current HP',hp_temp:'Temporary HP',hp_max:'Base maximum HP',hp_max_temp:'Maximum HP adjustment',mp_curr:'Current MP (including temp)',mp_temp:'Temporary MP',mp_class:'Class MP',mp_bonus:'Bonus MP',mp_max_temp:'Maximum MP adjustment',init_temp:'Initiative misc',bab:'Base attack bonus',bab_temp:'BAB adjustment',ac_armor:'Armor',ac_natural:'Natural armor',ac_deflect:'Deflection',ac_dodge:'Dodge',ac_temp:'AC adjustment',touch_temp:'Touch adjustment',flat_temp:'Flat-footed adjustment',cmd_temp:'CMD adjustment',cmb_temp:'CMB adjustment',currency_gil:'Gil',currency_moogle:'Moogle',slot_cap:'Capacity',spell_dc_base:'Spell ability',mp_max_spell_level:'Maximum spell level',desc:'Description',u_curr:'Uses remaining',u_max:'Maximum uses',lvl:'Level / ranks',cs:'Class skill',temp:'Misc bonus',subName:'Specialization',stat:'Ability',ability_mod:'Ability Mod',extra_damage:'Extra damage (not multiplied on crit)',attack_misc:'Attack misc',restoreOnLongRest:'Restore uses on rest',amount:'Quantity',equipped:'Equipped'};
const readable=k=>labels[k]||k.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const textKeys=new Set(['name','desc','damage','extra_damage','range','type','crit_range','crit_mult','attack_type','duration','target','saving_throw','school','spell_resist','at_higher_lvls','subName','languages','senses','resistances','proficiencies','dc_formula','uses_formula']);
const boolKeys=new Set(['cs','equipped','two_handed','restoreOnLongRest']);
function field(key,value,{weapon=false}={}){
 if(key==='sourceCategory')return '<label class="cs-field cs-field-wide cs-tag-editor"><span>Item Tag / Shop Category</span><div><span data-category-icon aria-hidden="true">'+itemCategorySymbol(value)+'</span><select name="sourceCategory" aria-label="Item Tag / Shop Category">'+Object.entries(SHOP_ITEM_CATEGORY_GROUPS).map(([group,tags])=>'<optgroup label="'+(group==='Other'?'Older Items':group)+'">'+tags.map(tag=>'<option value="'+tag+'"'+(value===tag?' selected':'')+'>'+tag+'</option>').join('')+'</optgroup>').join('')+'</select></div></label>';

 if(key==='crit_range'||key==='crit_mult'){const choices=key==='crit_range'?Array.from({length:20},(_,i)=>i===0?'20':(20-i)+'-20'):['x2','x3','x4','x5'];const normalized=String(value||'').replace(/[–—]/g,'-').replace('×','x');return '<label class="cs-field"><span>'+readable(key)+'</span><select name="'+key+'"><option value=""'+(!normalized?' selected':'')+'>Select</option>'+choices.map(v=>'<option value="'+v+'"'+(normalized===v?' selected':'')+'>'+v+'</option>').join('')+'</select></label>';}
 const label=readable(key),opts=key==='attack_type'?(weapon?Object.keys(attackTypes):['none',...Object.keys(attackTypes)]):key==='ability_mod'&&weapon?['auto',...abilities]:key==='size_category'?sizes:key==='stat'||key==='ability_mod'||key==='spell_dc_base'||key==='casting_ability'?abilities:key.endsWith('_ability')?['str','dex']:null;
 if(opts)return `<label class="cs-field"><span>${label}</span><select name="${key}">${opts.map(opt=>'<option value="'+opt+'"'+(opt===String(value||opts[0])?' selected':'')+'>'+(key==='attack_type'?(attackTypes[opt]||'None'):opt==='auto'?'Use attack type':abilities.includes(opt)?opt.toUpperCase():opt)+'</option>').join('')}</select></label>`;
 if(boolKeys.has(key))return `<label class="cs-checkbox"><input type="checkbox" name="${key}" ${value?'checked':''}><span>${label}</span></label>`;
 if(['desc','resistances','proficiencies'].includes(key))return `<label class="cs-field cs-field-wide"><span>${label}</span><textarea name="${key}" rows="5" maxlength="12000">${e(value||'')}</textarea></label>`;
 const isText=textKeys.has(key);
 return `<label class="cs-field"><span>${label}</span><input name="${key}" type="${isText?'text':'number'}" ${isText?'maxlength="'+(key==='name'?120:12000)+'"':'step="any" '+(['caster_level','mp_cost'].includes(key)?'':'required')} value="${e(value??(isText?'':0))}" ${key==='name'?'required':''}></label>`;
}
export function rollDice(expression,random=limit=>{const range=4294967296,ceiling=range-range%limit;let x;do{x=crypto.getRandomValues(new Uint32Array(1))[0];}while(x>=ceiling);return x%limit+1;}){
 const match=/^\s*(\d{1,2})d(\d{1,4})(?:\s*([+-])\s*(\d{1,6}))?\s*$/i.exec(expression);if(!match)throw Error('Use dice such as 1d20+5 or 2d6.');
 const count=Number(match[1]),sides=Number(match[2]);if(count<1||count>50||sides<2||sides>1000)throw Error('Use 1–50 dice with 2–1,000 sides.');
 const rolls=Array.from({length:count},()=>random(sides)),bonus=Number(match[4]||0)*(match[3]==='-'?-1:1);return {expression,rolls,bonus,total:rolls.reduce((a,b)=>a+b,bonus)};
}
export function formatRoll(label,r){
 const receipt=x=>x.total+' ('+x.expression+(x.rolls?.length?' · '+x.rolls.join(', '):'')+')';
 const title=r.weaponName||r.spellName||r.abilityName||label;
 if(r.descriptionOnly)return title+(r.mpSpent!==undefined?' · '+r.mpSpent+' MP':'')+(r.remainingUses!==undefined?' · '+r.remainingUses+' usage remaining':'')+'\n'+r.description;
 if(!['weapon','spell','ability'].includes(r.kind))return label+': '+receipt(r);
 const attack=r.kind==='weapon'?r:r.attack;
 return title+(r.mpSpent!==undefined?' · '+r.mpSpent+' MP':'')+(r.remainingUses!==undefined?' · '+r.remainingUses+' usage remaining':'')+(attack?'\nAttack Roll: '+receipt(attack):'')+(r.damage?'\nDice Roll: '+receipt(r.damage):'')+(r.critical?.threat?'\nCrit!\nAttack Roll: '+receipt(r.critical.confirmation)+(r.critical.damage?'\nDice Roll: '+receipt(r.critical.damage):''):'');
}
export function mountSheet(){
 const root=document.querySelector('main'),id=new URL(location.href).searchParams.get('characterId'),compact=new URL(location.href).searchParams.get('compact')==='1';
 const control=new AbortController();let closed=false,character=null,admin=false,busy=false,conflict=false,dirty=false,timer=null,dialogState=null,polling=false,discordEnabled=true,stream=null,resourceTimer=null,pendingResourceFields={};let remainingTimer=null,pendingRemaining=null,remainingPromise=null;let remainingInvalid=false;
 let showStars=false;
 let section=new URL(location.href).searchParams.get('section')||({'sheet-inventory':'items','sheet-abilities':'abilities'}[document.body.dataset.page]||'overview');if(!sections.some(([k])=>k===section))section='overview';
 let ability=new URL(location.href).searchParams.get('ability')||'activeAbilities';if(!abilityTabs.includes(ability))ability='activeAbilities';
 let combatView=new URL(location.href).searchParams.get('combatView')==='offense'?'offense':'defense';
 let itemTag=new URL(location.href).searchParams.get('itemTag')||'All';if(itemTag!=='All'&&!ITEM_TAG_OPTIONS.includes(itemTag)&&!Object.hasOwn(SHOP_ITEM_CATEGORY_GROUPS,itemTag))itemTag='All';
 let spellFilter=new URL(location.href).searchParams.get('spellLevel')||'all';if(spellFilter!=='all'){spellFilter=Number(spellFilter);if(!Number.isInteger(spellFilter)||spellFilter<0||spellFilter>9)spellFilter='all';}
 let itemView=new URL(location.href).searchParams.get('itemView')==='inventory'?'inventory':'equip';
 document.body.classList.toggle('sheet-compact',compact);
 if(!id){root.innerHTML='<h1>Character sheet</h1><p>Choose a character to open its sheet.</p><a class="button" href="characters.html">Characters</a>';return ()=>control.abort();}
 const endpoint='/api/v1/character-records/'+encodeURIComponent(id);
 const status=message=>{const node=root.querySelector('[data-sheet-status]');if(node)node.textContent=message;};
 const dialog=()=>root.querySelector('[data-sheet-dialog]');
 const equipmentDialog=()=>root.querySelector('[data-equipment-dialog]');
 const setBusy=value=>{busy=value;root.querySelector('[data-sheet]')?.classList.toggle('cs-saving',value);root.querySelectorAll('button,input,select,textarea').forEach(node=>{if(value){node.dataset.busyDisabled=String(node.disabled);node.disabled=true;}else if(node.dataset.busyDisabled!==undefined){node.disabled=node.dataset.busyDisabled==='true';delete node.dataset.busyDisabled;}});};
 async function request(body,revision){
  const res=await fetch(endpoint+(revision!==undefined?'?revision='+revision:''),{signal:control.signal,credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,op:body.op||'sheet',revision:character.revision})}:{})});
  const data=await res.json();if(!res.ok)throw Object.assign(Error(data.message||({401:'Sign in to open this sheet.',404:'Character unavailable.',409:'Changed elsewhere. Copy any unsaved edits, then Refresh.'})[res.status]||'Could not reach the character server.'),{status:res.status});return data;
 }
 function draw(){if(closed)return;clearTimeout(remainingTimer);pendingRemaining=null;remainingInvalid=false;pendingResourceFields={};root.innerHTML=renderSheetFrame(character,section,{admin,compact,ability,combatView,itemView,itemTag,spellLevel:spellFilter,showStars});root.querySelector('[data-discord-rolls]').checked=discordEnabled;for(const strip of root.querySelectorAll('.item-category-tiles,.cs-spell-levels')){const chosen=strip.querySelector('[aria-pressed=true],[aria-selected=true]');if(chosen)strip.scrollLeft=Math.max(0,chosen.offsetLeft-strip.offsetLeft-(strip.clientWidth-chosen.offsetWidth)/2);}document.title=character.name+' · Comos';dirty=false;}
 async function save(change,skipPending=false){
  if(!skipPending){if(change.action==='fields')for(const key of Object.keys(change.fields||{}))delete pendingResourceFields[key];if((pendingRemaining||remainingPromise||Object.keys(pendingResourceFields).length)&&!await persistRemaining())return false;}
  if(busy||closed||conflict)return false;setBusy(true);status('Saving…');
  try{const result=await request(change);if(closed)return false;character=result.character;dirty=false;dialog()?.close();draw();status('Saved · Synced'+(admin?' · Admin':''));return true;}
  catch(err){if(closed)return false;if(err.status===409){conflict=true;root.querySelector('[data-sheet-refresh]').hidden=false;}status(err.message);const message=root.querySelector('[data-dialog-status]');if(message)message.textContent=err.message;const equipStatus=root.querySelector('[data-equip-status]');if(equipStatus)equipStatus.textContent=err.message;return false;}
  finally{if(!closed)setBusy(false);}
 }
 async function refresh(force=false){
  if(closed||busy||polling||document.hidden||(!force&&(dirty||conflict||(dialog()?.open||equipmentDialog()?.open))))return;
  if(force&&(dirty||dialog()?.open||equipmentDialog()?.open)&&!confirm('Discard unsaved edits and load the latest sheet?'))return;
  polling=true;const previousRevision=character?.revision;
  try{const result=await request(null,!force&&character?character.revision:undefined);if(closed||busy||character?.revision!==previousRevision)return;if(!result.unchanged){if(!force&&(dirty||dialog()?.open||equipmentDialog()?.open))return;character=result.character;admin=result.admin===true;conflict=false;draw();}status('Synced'+(admin?' · Admin':''));}
  catch(err){if(!closed)status(err.message);}
  finally{polling=false;}
 }
 function schedule(){clearTimeout(timer);if(closed)return;timer=setTimeout(async()=>{await refresh();schedule();},5000);}
 function openDialog(title,keys,values,change,{help=''}={}){
  if(busy||conflict){status(conflict?'Refresh to load the latest sheet before editing.':'Saving…');return;}
  root.querySelector('[data-sheet-form] button[type=submit]').hidden=false;dialogState={keys,change};root.querySelector('#cs-dialog-title').textContent=title;
  root.querySelector('[data-dialog-fields]').innerHTML=(help?'<p class="cs-caption">'+e(help)+'</p>':'')+'<div class="cs-form-grid">'+keys.map(k=>field(k,values[k],{weapon:change.collection==='weapons'})).join('')+'</div>';
  root.querySelector('[data-dialog-status]').textContent='';if(['damage','heal','spendMp'].includes(change.action))root.querySelector('[name=amount]').closest('label').querySelector('span').textContent='Amount';dialog().showModal();
 }
 function openEquipmentPicker({slot=null,index=null,collection='items'}={}){
  if(busy||conflict){status(conflict?'Load latest before editing equipment.':'Saving…');return;}
  const picker=equipmentDialog(),itemMode=index!==null,selected=character.data[collection]?.[index];if(!picker||itemMode&&!selected)return;
  const chosenSlot=equipmentSlotIds.includes(slot)?slot:equipmentSlotIds.includes(selected?.equip_slot)?selected.equip_slot:'head';
  const slotSelect=picker.querySelector('[data-equip-slot-select]'),itemSelect=picker.querySelector('[data-equip-item-select]');slotSelect.replaceChildren();itemSelect.replaceChildren();
  for(const s of equipmentSlots){const o=document.createElement('option');o.value=s.id;o.textContent=s.label;slotSelect.append(o);}
  const empty=document.createElement('option');empty.value='';empty.textContent='Empty — unequip this slot';itemSelect.append(empty);
  for(const r of equipmentRows(character.data)){if(!r.item?.name||Number(r.item.amount??1)<1)continue;const o=document.createElement('option');o.value=r.collection+':'+r.index;o.textContent=r.item.name+(r.collection==='weapons'?' · Weapon':'')+(r.item.two_handed?' · 2 hands':'')+(r.item.equip_slot?' · '+equipmentSlotLabel(r.item.equip_slot):'');itemSelect.append(o);}
  slotSelect.value=chosenSlot;slotSelect.disabled=!itemMode;const occupant=equippedInSlot(character.data,chosenSlot);itemSelect.value=itemMode?collection+':'+index:occupant?occupant.collection+':'+occupant.index:'';itemSelect.disabled=itemMode;
  picker.querySelector('#cs-equipment-title').textContent=itemMode?'Equip '+selected.name:'Equip '+equipmentSlotLabel(chosenSlot);picker.querySelector('[data-equip-status]').textContent='';picker.querySelector('[data-equip-hint]').textContent='Two-handed weapons reserve both hands. Replaced equipment returns to inventory.';picker.showModal();
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
  const keys=key==='skills'?['lvl','temp','cs','subName']:key==='items'?['sourceCategory','name','amount','two_handed','desc']:key==='weapons'?['name','attack_type','ability_mod','damage','range','crit_range','crit_mult','desc']:key==='spells'?['name','lvl','school','type','attack_type','attack_misc','range','duration','target','saving_throw','spell_resist','damage','casting_ability','caster_level','dc_misc','mp_cost','desc','at_higher_lvls']:['name','type','attack_type','damage','dc_formula','uses_formula','restoreOnLongRest','desc','at_higher_lvls'];
  if(row.limitBreak||/limit[\s-]*break/i.test(String(row.sourceRuleId||'')+' '+String(row.rulesName||row.name||'')))for(const k of ['uses_formula','restoreOnLongRest']){const at=keys.indexOf(k);if(at>=0)keys.splice(at,1);}
  const values={...row,sourceCategory:itemCategoryForItem(row),mp_cost:row.mp_cost??row.mpCost??row.mp_amount??row.mpAmount??'',lvl:key==='spells'?(spellLevel(row.lvl)??0):(row.lvl??0),damage:row.damage||row.dmg||'',amount:row.amount??1,stat:row.stat||'int',attack_type:key==='weapons'?attackType(row.attack_type):String(row.attack_type||'none').toLowerCase().replaceAll(' ','_'),ability_mod:String(row.ability_mod||row.mod||'auto').toLowerCase(),casting_ability:row.casting_ability||character.data.spell_dc_base||'int',caster_level:row.caster_level??'',restoreOnLongRest:row.restoreOnLongRest!==false};
  openDialog(index===null?'Add '+titles[key]:'Edit '+(row.name||titles[key]),keys,values,{action:'entry',collection:key,index,mode:index===null?'add':'update'},{help:key==='weapons'?'Attack type uses the matching sheet attack total. Ability Mod replaces its ability, rather than adding it twice. Damage includes all normal flat bonuses; include additional dice in Dice Roll. Critical range: 20 or 19-20; multiplier: x2, x3…':key==='skills'?'Skill identity is fixed. Edit ranks, misc, class skill and specialization.':key==='spells'||['activeAbilities','passiveAbilities','racialAbilities','feats'].includes(key)?'Dice Roll examples: 2d6 fire + 1d4 cold, {CL}d6 + {INT}. DC/uses formulas accept {INT}, {LEVEL}, {CL}, arithmetic and parentheses. Fractions round down. Set special adjustments explicitly.':''});
  if(index!==null&&key!=='skills')root.querySelector('[data-dialog-fields]').insertAdjacentHTML('beforeend','<button class="cs-delete" type="button" data-remove-entry="'+key+':'+index+'">Delete entry</button>');
 }
 async function roll(label,expression,weaponIndex,spellIndex,abilityEntry,mode='use'){
  clearTimeout(remainingTimer);if(remainingInvalid)return;if(remainingPromise&&!await remainingPromise)return;if((pendingRemaining||Object.keys(pendingResourceFields).length)&&!await persistRemaining())return;if(busy)return;setBusy(true);let node=root.querySelector('[data-roll-result]');node.hidden=false;node.textContent='Rolling…';
  try{const result=await request({op:'roll',...(abilityEntry?{kind:'ability',...abilityEntry}:spellIndex!==undefined?{kind:'spell',index:spellIndex}:weaponIndex===undefined?{expression,label}:{kind:'weapon',index:weaponIndex}),requestId:recordId(),...((weaponIndex!==undefined||spellIndex!==undefined||abilityEntry)?{mode}:{}),discord:mode==='send'||discordEnabled});if(closed)return;const r=result.roll;if(r.characterRevision!==undefined){try{const fresh=await request();character=fresh.character;draw();node=root.querySelector('[data-roll-result]');node.hidden=false;}catch{status('Use saved · Sync pending');}}const failed=result.discord==='failed';if(mode==='send'){node.hidden=true;notify(failed?'Discord delivery failed':result.discord==='sent'?'Sent to Discord':'Discord delivery pending');}else if(r.descriptionOnly){node.hidden=true;notify(failed?'Use · Discord delivery failed':'Use');}else{node.textContent=formatRoll(label,r)+(failed?' · Discord delivery failed':'');node.hidden=preferences.dicePopup!==false;if(preferences.dicePopup!==false)showDice(r);else status(failed?'Rolled · Discord delivery failed':'Rolled');}document.dispatchEvent(new CustomEvent('comos:sheet-roll',{detail:{characterId:id,label,...r}}));}
  catch(err){if(!closed)node.textContent=err.message;}finally{if(!closed)setBusy(false);}
 }
 function selectSpellLevel(level,focus=false){spellFilter=level;draw();const url=new URL(location.href);url.searchParams.set('spellLevel',level);history.replaceState(null,'',url);if(focus){const tab=root.querySelector('[data-spell-level="'+level+'"]');tab.focus({preventScroll:true});tab.scrollIntoView({block:'nearest',inline:'nearest'});}}
 root.addEventListener('keydown',event=>{if(!event.target.matches('[data-spell-level]')||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const levels=['all',0,1,2,3,4,5,6,7,8,9],at=levels.indexOf(spellFilter),level=event.key==='Home'?'all':event.key==='End'?9:levels[(at+(event.key==='ArrowRight'?1:10))%11];selectSpellLevel(level,true);},{signal:control.signal});
 async function persistRemaining(){
  if(remainingPromise)return remainingPromise;
  const patch=pendingRemaining,resources={...pendingResourceFields};if(!patch&&!Object.keys(resources).length)return true;
  clearTimeout(remainingTimer);clearTimeout(resourceTimer);pendingRemaining=null;pendingResourceFields={};
  remainingPromise=(async()=>{try{if(Object.keys(resources).length&&!await save({action:'fields',fields:resources},true))return false;return patch?await save({action:'entry',collection:patch.collection,index:patch.index,mode:'update',fields:{u_curr:patch.value}},true):true;}finally{remainingPromise=null;}})();return remainingPromise;
 }
 async function useEntry(collection,index,spendUse){if(remainingInvalid){status('Enter valid remaining uses first.');return;}clearTimeout(remainingTimer);if(remainingPromise&&!await remainingPromise)return;if((pendingRemaining||Object.keys(pendingResourceFields).length)&&!await persistRemaining())return;if(busy||conflict)return;if(collection==='spells')return roll('Spell',null,undefined,index);return roll('Ability',null,undefined,undefined,{collection,index,spendUse});}
 root.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.matches('[data-toggle-stars]')){showStars=!showStars;root.querySelector('[data-sheet]').classList.toggle('cs-star-controls-off',!showStars);button.setAttribute('aria-pressed',String(showStars));button.setAttribute('aria-label',(showStars?'Hide':'Show')+' favorite controls');return;}
  if(button.matches('[data-box-favorite]')){const key=button.dataset.boxFavorite,old=character.data.favorite_boxes||[];void save({action:'fields',fields:{favorite_boxes:old.includes(key)?old.filter(k=>k!==key):[...old,key]}});return;}
  if(button.matches('[data-entry-send]')){const [collection,index]=button.dataset.entrySend.split(':');void roll('Description',null,collection==='weapons'?Number(index):undefined,collection==='spells'?Number(index):undefined,abilityTabs.includes(collection)?{collection,index:Number(index),spendUse:false}:undefined,'send');return;}
  if(button.matches('[data-entry-use],[data-entry-roll]')){const [collection,index]=(button.dataset.entryUse||button.dataset.entryRoll).split(':');void useEntry(collection,Number(index),true);return;}
  if(button.matches('[data-favorite]')&&(pendingRemaining||remainingPromise||remainingInvalid)){if(remainingInvalid){status('Enter valid remaining uses first.');return;}clearTimeout(remainingTimer);void(async()=>{if(!await persistRemaining())return;const [collection,index]=button.dataset.favorite.split(':');await save({action:'entry',collection,index:Number(index),mode:'update',fields:{favorite:character.data[collection][Number(index)].favorite!==true}});})();return;}
  if(button.matches('[data-edit-entry]')&&(pendingRemaining||remainingPromise||Object.keys(pendingResourceFields).length)){void(async()=>{if(!await persistRemaining())return;const [key,index]=button.dataset.editEntry.split(':');editEntry(key,Number(index));})();return;}
  if(busy)return;
  if(button.matches('[data-level-up],[data-open-rest]')){const modal=document.createElement('dialog');modal.className='cs-dialog cs-quick-action';modal.setAttribute('aria-label',button.hasAttribute('data-level-up')?'Level up':'Rest');modal.innerHTML=button.hasAttribute('data-level-up')?'<a class="button primary" href="create-identity.html?characterId='+encodeURIComponent(button.dataset.levelUp)+'&levelUp=1">Level up</a>':'<button class="button primary" type="button" data-confirm-rest>Rest</button>';modal.addEventListener('click',event=>{if(event.target===modal)modal.close();if(event.target.closest('[data-confirm-rest]')){modal.close();void save({action:'rest'});}});modal.addEventListener('close',()=>modal.remove(),{once:true});document.body.append(modal);modal.showModal();return;}
  if(button.matches('[data-rule-abilities]')){void openRuleAbilities();return;}
  if(button.matches('[data-accessory-open]')){const panel=root.querySelector('.cs-accessory-panel');panel.open=!panel.open;button.setAttribute('aria-expanded',String(panel.open));if(panel.open)panel.scrollIntoView({block:'nearest'});return;}

  if(button.matches('[data-item-view]')){
   if(dirty&&!confirm('Discard unsaved edits?'))return;
   itemView=button.dataset.itemView==='inventory'?'inventory':'equip';
   draw();const url=new URL(location.href);url.searchParams.set('itemView',itemView);history.replaceState(null,'',url);return;
  }
  if(button.matches('[data-equip-slot]')){openEquipmentPicker({slot:button.dataset.equipSlot});return;}
  if(button.matches('[data-assign-item]')){openEquipmentPicker({index:Number(button.dataset.assignItem)});return;}
  if(button.matches('[data-equipment-close]')){equipmentDialog()?.close();return;}
  if(button.matches('[data-combat-view]')){if(dirty&&!confirm('Discard unsaved edits?'))return;combatView=button.dataset.combatView;draw();const url=new URL(location.href);url.searchParams.set('combatView',combatView);history.replaceState(null,'',url);return;}
  if(button.matches('[data-ability-category]')){if(dirty&&!confirm('Discard unsaved edits?'))return;ability=button.dataset.abilityCategory;draw();const url=new URL(location.href);url.searchParams.set('ability',ability);history.replaceState(null,'',url);return;}
  if(button.matches('[data-resource-favorite]')){const key=button.dataset.resourceFavorite;clearTimeout(resourceTimer);void save({action:'fields',fields:{...pendingResourceFields,[key]:character.data[key]!==true}});return;}
  if(button.matches('[data-weapon-roll]')){void roll('Weapon',null,Number(button.dataset.weaponRoll));return;}
  if(button.matches('[data-favorite]')){const [collection,i]=button.dataset.favorite.split(':');void save({action:'entry',collection,index:Number(i),mode:'update',fields:{favorite:character.data[collection][Number(i)].favorite!==true}});return;}
  if(button.matches('[data-cast-entry]')){void roll('Spell',null,undefined,Number(button.dataset.castEntry.split(':')[1]));return;}
  if(button.matches('[data-item-tag]')){itemTag=button.dataset.itemTag;draw();const url=new URL(location.href);url.searchParams.set('itemTag',itemTag);history.replaceState(null,'',url);return;}
  if(button.matches('[data-spell-level]')){selectSpellLevel(button.dataset.spellLevel==='all'?'all':Number(button.dataset.spellLevel));return;}

  if(button.matches('[data-sheet-tab]')){
   if((dirty||dialog()?.open)&&!confirm('Discard unsaved edits?'))return;section=button.dataset.sheetTab;draw();const url=new URL(location.href);url.searchParams.set('section',section);history.replaceState(null,'',url);return;
  }
  if(button.matches('[data-dialog-close]')){dialog()?.close();dirty=false;if(!conflict)void refresh();return;}
  if(button.matches('[data-sheet-refresh]')){void refresh(true);return;}
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
 root.addEventListener('submit',event=>{
  if(!event.target.matches('[data-sheet-form],[data-notes],[data-equipment-form]'))return;event.preventDefault();
  if(event.target.matches('[data-equipment-form]')){
    const form=event.target;
    const slot=form.elements.slot.value;
    const raw=form.elements.itemIndex.value;
    const [collection,rawIndex]=raw.includes(':')?raw.split(':'):['items',raw];const index=raw===''?null:Number(rawIndex);
    if(!equipmentSlotIds.includes(slot)||index!==null&&(!Number.isInteger(index)||index<0||index>=(character.data[collection]||[]).length)){
      form.querySelector('[data-equip-status]').textContent='Choose a valid slot and inventory item.';return;
    }
    const occupied=equippedInSlot(character.data,slot);
    if(occupied&&(index!==occupied.index||collection!==occupied.collection)&&index!==null&&!confirm('Replace '+(occupied.item.name||'the equipped item')+' in '+equipmentSlotLabel(slot)+'?'))return;
    void save({action:'equip',slot,index,collection});
    return;
  }
  if(event.target.matches('[data-notes]')){void save({action:'fields',fields:{notesArea:event.target.elements.notesArea.value}});return;}
  const fields={};for(const key of dialogState.keys){const node=event.target.elements[key];if(['caster_level','mp_cost'].includes(key)&&node.value===''){fields[key]='';continue;}fields[key]=boolKeys.has(key)?node.checked:textKeys.has(key)||node.tagName==='SELECT'?node.value:Number(node.value);}
  if(dialogState.change.action==='spendMp'){void save({action:dialogState.change.action,amount:fields.amount});return;}
  void save({...dialogState.change,fields});
 },{signal:control.signal});
 root.addEventListener('input',event=>{
  if(event.target.matches('[data-ability-remaining]')){clearTimeout(remainingTimer);const [collection,index]=event.target.dataset.abilityRemaining.split(':'),value=Number(event.target.value);dirty=true;status('Unsaved uses');if(event.target.value!==''&&Number.isInteger(value)&&value>=0&&value<=Number(event.target.max)){remainingInvalid=false;pendingRemaining={collection,index:Number(index),value};remainingTimer=setTimeout(()=>void persistRemaining(),650);}else{remainingInvalid=true;pendingRemaining=null;status('Enter whole uses between 0 and maximum.');}return;}

  if(event.target.matches('[data-sheet-search]')){const d=character.data,q=event.target.value;root.querySelector('[data-sheet-list]').innerHTML=section==='skills'?renderSkillRows(d,q):section==='items'?collectionBlock('items',d,q,{category:itemTag}):section==='spells'?collectionBlock('spells',d,q,{level:spellFilter==='all'?null:spellFilter}):collectionBlock(ability,d,q);return;}
  if((event.target.closest('form')||event.target.matches('[data-resource-input]'))&&!event.target.closest('[data-equipment-form]')){dirty=true;status('Unsaved changes');}
  if(event.target.matches('[data-resource-input]')){clearTimeout(resourceTimer);const key=event.target.dataset.resourceInput,value=Number(event.target.value);if(event.target.value!==''&&Number.isFinite(value)&&(key!=='hp_temp'||value>=0)){pendingResourceFields[key]=value;resourceTimer=setTimeout(()=>{if(Object.keys(pendingResourceFields).length)void save({action:'fields',fields:{...pendingResourceFields}});},650);}}
 },{signal:control.signal});
 root.addEventListener('change',event=>{
  if(event.target.matches('[name=sourceCategory]'))root.querySelector('[data-category-icon]').textContent=itemCategorySymbol(event.target.value);
  if(event.target.matches('[data-discord-rolls]')){discordEnabled=event.target.checked;notify('Discord roll '+(discordEnabled?'on':'off'));}
  if(event.target.matches('[data-resource-input]')){clearTimeout(resourceTimer);const value=Number(event.target.value);if(event.target.value!==''&&Number.isFinite(value)&&(event.target.dataset.resourceInput!=='hp_temp'||value>=0)){pendingResourceFields[event.target.dataset.resourceInput]=value;void save({action:'fields',fields:{...pendingResourceFields}});}}

 },{signal:control.signal});
 root.addEventListener('toggle',event=>{const detail=event.target;if(detail.matches?.('.cs-accessory-panel')){root.querySelector('[data-accessory-open]')?.setAttribute('aria-expanded',String(detail.open));return;}if(!detail.matches?.('[data-entry-details]')||!detail.open)return;const [key,i]=detail.dataset.entryDetails.split(':');const row=character?.data[key]?.[Number(i)];if(row)detail.querySelector('[data-entry-detail-body]').innerHTML=entryDetail(row,character.data,key);},{capture:true,signal:control.signal});
 root.addEventListener('cancel',()=>{dirty=false;},{capture:true,signal:control.signal});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();},{signal:control.signal});
 window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}},{signal:control.signal});
 root.innerHTML='<p role="status">Loading character…</p>';
 void request().then(result=>{if(closed)return;character=result.character;admin=result.admin===true;draw();schedule();if(typeof EventSource!=='undefined'){stream=new EventSource(endpoint+'?stream=1');stream.onmessage=()=>void refresh();}}).catch(err=>{if(!closed)root.innerHTML='<h1>Character sheet</h1><p role="status">'+e(err.message)+'</p><a class="button" href="signin.html">Sign in</a><a class="back" href="characters.html">← Characters</a>';});
 return ()=>{clearFeedback();closed=true;clearTimeout(timer);clearTimeout(resourceTimer);clearTimeout(remainingTimer);stream?.close();control.abort();document.body.classList.remove('sheet-compact');};
}
