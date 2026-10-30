// Shared equipment slot IDs and occupancy rules; layouts can change without losing saved assignments.
const accessories=['headband','eyes','shoulders','neck','belt','wrists','ring1','ring2'];
export const equipmentSlots=Object.freeze([
 {id:'head',label:'Head',side:'left',y:50,target:[200,52]},
 {id:'headband',label:'Headband'},{id:'eyes',label:'Eyes'},{id:'shoulders',label:'Shoulders'},{id:'neck',label:'Necklace'},
 {id:'chest',label:'Chest',side:'left',y:135,target:[200,140]},
 {id:'arms',label:'Arms',side:'left',y:195,target:[150,175]},
 {id:'body',label:'Body',side:'right',y:180,target:[220,193]},
 {id:'belt',label:'Belt'},{id:'wrists',label:'Wrists'},
 {id:'hands',label:'Hand 1',side:'left',y:245,target:[145,250]},
 {id:'hand2',label:'Hand 2',side:'right',y:255,target:[255,250]},
 {id:'ranged',label:'Ranged',side:'right',y:345,target:[257,303]},
 {id:'legs',label:'Legs',side:'left',y:360,target:[185,365]},
 {id:'ring1',label:'Ring 1'},{id:'ring2',label:'Ring 2'},
 {id:'feet',label:'Feet',side:'right',y:465,target:[218,452]}
].map(s=>Object.freeze({...s,accessory:accessories.includes(s.id)})));
export const equipmentSlotIds=Object.freeze(equipmentSlots.map(s=>s.id));
/* Extra equipment lives in independent, numbered Misc slots. The original 17 slot IDs stay unchanged. */
export const miscEquipmentSlotIds=Object.freeze(Array.from({length:20},(_,i)=>'misc-'+(i+1)));
export const isEquipmentSlot=id=>equipmentSlotIds.includes(id)||miscEquipmentSlotIds.includes(id);

export const equipmentSlotLabel=id=>miscEquipmentSlotIds.includes(id)?'Misc':equipmentSlots.find(s=>s.id===id)?.label||'Unassigned';
export function equipmentRows(source){return Array.isArray(source)?source.map((item,index)=>({item,index,collection:'items'})):['items','weapons'].flatMap(collection=>(source?.[collection]||[]).map((item,index)=>({item,index,collection})));}
export function occupiesSlot(item,slot){return !!item&&item.equipped!==false&&(item.equip_slot===slot||item.two_handed===true&&['hands','hand2'].includes(item.equip_slot)&&['hands','hand2'].includes(slot));}
export function equippedInSlot(source,slot){if(!isEquipmentSlot(slot))return null;return equipmentRows(source).find(r=>occupiesSlot(r.item,slot))||null;}
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** Compact, searchable item-only list for the chosen equipment slot. */
export function renderEquipChoices(data={},query='',slot=''){
 const search=String(query).trim().toLocaleLowerCase();
 const selected=equippedInSlot(data,slot);
 const choices=equipmentRows(data)
  .filter(({item})=>item&&String(item.name||'').trim()&&Number(item.amount??1)>=1)
  .filter(({item})=>String(item.name).toLocaleLowerCase().includes(search))
  .sort((a,b)=>String(a.item.name).localeCompare(String(b.item.name)));
 return choices.map(({item,index,collection})=>{
  const active=selected?.collection===collection&&selected.index===index;
  return '<button type="button" class="cs-equip-choice" data-equip-choice="'+collection+':'+index+'" aria-pressed="'+active+'"><span>'+e(item.name)+'</span>'+(active?'<span class="cs-equip-choice-check" aria-hidden="true">✓</span>':'')+'</button>';
 }).join('')||'<p class="cs-equip-empty">No items found</p>';
}


// The visual grouping does not change persisted equipment slot IDs.
const loadoutGroups=Object.freeze([
 {name:'Weapons',icon:'⚔︎',slots:['hands','hand2','ranged']},
 {name:'Armor',icon:'◇',slots:['head','shoulders','chest','arms','body','legs','feet']},
 {name:'Accessories',icon:'✧',slots:['headband','eyes','neck','belt','wrists','ring1','ring2']}
]);
export function renderEquipment(data={}){
 const section=group=>{
  const assigned=group.slots.filter(slot=>equippedInSlot(data,slot)).length;
  const items=group.slots.map(id=>{
   const slot=equipmentSlots.find(s=>s.id===id),item=equippedInSlot(data,id)?.item;
   const itemName=item?.name||'Not equipped';
   return '<div class="cs-loadout-row'+(item?' is-equipped':'')+'">'
    +'<button type="button" class="cs-loadout-select" '+(item?'data-item-description="'+gear.collection+':'+gear.index+'" aria-label="View '+e(itemName)+' description"':'data-equip-slot="'+id+'" aria-label="Equip '+e(slot.label)+'")+'">'
    +'<span class="cs-loadout-row-details"><span class="cs-loadout-slot-label">'+e(slot.label)+'</span><span class="cs-loadout-item-name">'+e(itemName)+'</span></span>'
    +(item?'':'<span class="cs-loadout-chevron" aria-hidden="true">+</span>')+'</button>'
    +(item?'<button type="button" class="cs-loadout-action" data-equip-change="'+id+'" aria-label="Change '+e(itemName)+' in '+e(slot.label)+'">Change</button>':'')
    +'</div>';
  }).join('');
  return '<section class="cs-loadout-group" aria-label="'+group.name+' equipment">'
   +'<div class="cs-loadout-group-title"><span aria-hidden="true" class="cs-loadout-group-icon">'+group.icon+'</span><h3>'+group.name+'</h3><small>'+assigned+' / '+group.slots.length+'</small></div>'
   +'<div class="cs-loadout-rows">'+items+'</div></section>';
 };
 const miscEntries=miscEquipmentSlotIds.map(id=>({id,entry:equippedInSlot(data,id)})).filter(({entry})=>entry);
 const nextMiscSlot=miscEquipmentSlotIds.find(id=>!equippedInSlot(data,id));
 const miscRows=miscEntries.map(({id,entry})=>{
  const name=e(entry.item.name||'Unnamed item');
  return '<div class="cs-loadout-row is-equipped">'
   +'<button type="button" class="cs-loadout-select" data-item-description="'+entry.collection+':'+entry.index+'" aria-label="View '+name+' description"><span class="cs-loadout-row-details"><span class="cs-loadout-item-name">'+name+'</span></span></button>'
   +'<button type="button" class="cs-loadout-action" data-equip-change="'+id+'" aria-label="Change '+name+'">Change</button></div>';
 }).join('');
 const misc='<section class="cs-loadout-group cs-loadout-misc" aria-label="Misc equipment">'
  +'<div class="cs-loadout-group-title"><span aria-hidden="true" class="cs-loadout-group-icon">✧</span><h3>Misc</h3>'
  +(nextMiscSlot?'<button type="button" class="cs-loadout-misc-add" data-equip-slot="'+nextMiscSlot+'" aria-label="Add miscellaneous equipment" title="Add miscellaneous equipment">+</button>':'')
  +'</div><div class="cs-loadout-rows">'+miscRows+'</div></section>';
 return '<section class="cs-equipment cs-loadout" aria-label="Equipped items"><div class="cs-loadout-groups">'+loadoutGroups.map(section).join('')+misc+'</div></section>';
}
