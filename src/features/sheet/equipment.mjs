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
export const equipmentSlotLabel=id=>equipmentSlots.find(s=>s.id===id)?.label||'Unassigned';
export function equipmentRows(source){return Array.isArray(source)?source.map((item,index)=>({item,index,collection:'items'})):['items','weapons'].flatMap(collection=>(source?.[collection]||[]).map((item,index)=>({item,index,collection})));}
export function occupiesSlot(item,slot){return !!item&&item.equipped!==false&&(item.equip_slot===slot||item.two_handed===true&&['hands','hand2'].includes(item.equip_slot)&&['hands','hand2'].includes(slot));}
export function equippedInSlot(source,slot){if(!equipmentSlotIds.includes(slot))return null;return equipmentRows(source).find(r=>occupiesSlot(r.item,slot))||null;}
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

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
    +'<button type="button" class="cs-loadout-select" data-equip-slot="'+id+'" aria-label="'+e(slot.label+': '+itemName+'. Choose equipment')+'">'
    +'<span class="cs-loadout-row-details"><span class="cs-loadout-slot-label">'+e(slot.label)+'</span><span class="cs-loadout-item-name">'+e(itemName)+'</span></span>'
    +'<span class="cs-loadout-chevron" aria-hidden="true">'+(item?'›':'+')+'</span></button>'
    +(item?'<button type="button" class="cs-loadout-action" data-unequip-slot="'+id+'" aria-label="Unequip '+e(item.name||'item')+' from '+e(slot.label)+'">Unequip</button>':'')
    +'</div>';
  }).join('');
  return '<section class="cs-loadout-group" aria-label="'+group.name+' equipment">'
   +'<div class="cs-loadout-group-title"><span aria-hidden="true" class="cs-loadout-group-icon">'+group.icon+'</span><h3>'+group.name+'</h3><small>'+assigned+' / '+group.slots.length+'</small></div>'
   +'<div class="cs-loadout-rows">'+items+'</div></section>';
 };
 return '<section class="cs-equipment cs-loadout" aria-label="Equipped items"><div class="cs-loadout-groups">'+loadoutGroups.map(section).join('')+'</div></section>';
}
