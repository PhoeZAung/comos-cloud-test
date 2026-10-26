// Slot definitions shared by the UI and server-side equip validation.
export const equipmentSlots=Object.freeze([
 Object.freeze({id:'head',label:'Head',side:'left'}),
 Object.freeze({id:'headband',label:'Headband',side:'right'}),
 Object.freeze({id:'eyes',label:'Eyes',side:'left'}),
 Object.freeze({id:'shoulders',label:'Shoulders',side:'right'}),
 Object.freeze({id:'neck',label:'Neck',side:'left'}),
 Object.freeze({id:'chest',label:'Chest',side:'right'}),
 Object.freeze({id:'body',label:'Body',side:'left'}),
 Object.freeze({id:'belt',label:'Belt',side:'right'}),
 Object.freeze({id:'wrists',label:'Wrists',side:'left'}),
 Object.freeze({id:'hands',label:'Hands',side:'right'}),
 Object.freeze({id:'ring1',label:'Ring 1',side:'left'}),
 Object.freeze({id:'ring2',label:'Ring 2',side:'right'}),
 Object.freeze({id:'feet',label:'Feet',side:'left'})
]);
export const equipmentSlotIds=Object.freeze(equipmentSlots.map(slot=>slot.id));
export const equipmentSlotLabel=id=>equipmentSlots.find(slot=>slot.id===id)?.label||'Unassigned';
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function equippedInSlot(items,slotId){
 if(!equipmentSlotIds.includes(slotId))return null;
 const rows=Array.isArray(items)?items:[];
 const index=rows.findIndex(item=>item&&item.equip_slot===slotId&&item.equipped!==false);
 return index<0?null:{index,item:rows[index]};
}
export function renderEquipment(data={}){
 const items=Array.isArray(data.items)?data.items:[];
 const assigned=equipmentSlotIds.filter(slot=>equippedInSlot(items,slot)).length;
 const legacy=items.filter(item=>item?.equipped===true&&!equipmentSlotIds.includes(item.equip_slot)).length;
 const svg='<svg class="cs-paper-doll" viewBox="0 0 200 410" aria-label="Character equipment silhouette" role="img" xmlns="http://www.w3.org/2000/svg">'+
   '<defs><linearGradient id="cs-doll-shading" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".20"/><stop offset="1" stop-color="currentColor" stop-opacity=".05"/></linearGradient></defs>'+
   '<circle cx="100" cy="47" r="25"/><path d="M86 71v17l-37 19-18 72-11 57 17 9 29-75 9-14-5 99 19 12-8 100 7 20h26l7-118h8l7 118h26l7-20-8-100 19-12-5-99 9 14 29 75 17-9-11-57-18-72-37-19V71" />'+
   '<path class="cs-paper-doll-armor" d="M74 107q26 12 52 0l12 35-14 48h-48l-14-48Z"/><path class="cs-paper-doll-armor" d="M73 193h54v26l-27 12-27-12Z"/>'+
   '<path class="cs-paper-doll-lines" d="M74 109 100 125l26-16M85 148h30M100 125v60M82 202h36M73 253 82 260M118 260 127 253M84 362h28M116 362h28"/>'+
   '<circle class="cs-paper-doll-gem" cx="100" cy="140" r="5" /></svg>';
 const slotMarkup=slot=>{
   const found=equippedInSlot(items,slot.id);
   const item=found?.item;
   return '<button type="button" class="cs-gear-slot'+(item?' has-item':'')+'" data-equip-slot="'+slot.id+'" aria-label="'+e(slot.label+': '+(item?.name||'Empty')+'. Choose equipment')+'" title="'+e(slot.label)+'">'+
    '<span class="cs-gear-slot-name">'+e(slot.label)+'</span>'+
    '<span class="cs-gear-slot-item">'+(item?e(item.name||'Unnamed item'):'<span aria-hidden="true">＋</span> Empty')+'</span>'+
   '</button>';
 };
 return '<section class="cs-equipment" aria-label="Equipped items">'+
  '<div class="cs-gear-heading"><div><h2>Equipment</h2><p class="cs-caption">Choose a slot to equip an item from your inventory.</p></div><span class="cs-gear-count">'+assigned+' / '+equipmentSlots.length+' slots</span></div>'+
  '<div class="cs-paper-doll-layout"><div class="cs-gear-column cs-gear-left">'+equipmentSlots.filter(slot=>slot.side==='left').map(slotMarkup).join('')+'</div>'+
  '<div class="cs-paper-doll-stage">'+svg+'<span class="cs-paper-doll-caption">Character equipment</span></div>'+
  '<div class="cs-gear-column cs-gear-right">'+equipmentSlots.filter(slot=>slot.side==='right').map(slotMarkup).join('')+'</div></div>'+
  (legacy?'<p class="cs-gear-note">'+legacy+' previously equipped '+(legacy===1?'item has':'items have')+' no slot yet. Assign '+(legacy===1?'it':'them')+' above to complete your equipment layout.</p>':'')+
  '<p class="cs-caption cs-gear-footnote">Equipment choices are saved to this character. Bonuses are not applied automatically.</p>'+
  '</section>';
}
