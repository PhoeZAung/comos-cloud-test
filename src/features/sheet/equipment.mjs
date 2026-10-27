// Shared slot geometry and occupancy rules; old slot IDs stay valid.
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
const markers={
 body:'<path d="m172 106-12 102 16 41h48l16-41-12-102Z"/>',
 chest:'<path d="m172 111 28 10 28-10-3 70-25 16-25-16Z"/><path d="M200 123v62m-20-34h40"/>',
 arms:'<path d="m147 139 18 6-10 65-18-4Zm88 6 18-6 10 67-18 4Z"/>',
 head:'<path d="M177 51a23 23 0 0 1 46 0v16h-14V53h-18v14h-14Zm0-2h46"/>',
 headband:'<path d="M177 44h46v7h-46Zm46 3 13 8-5 7-9-12"/>',eyes:'<path d="M179 54h42m-40 0v9h15v-9m8 0v9h15v-9"/>',
 shoulders:'<path d="m169 101-16 11-6 23 28-7Zm62 0 16 11 6 23-28-7Z"/>',
 neck:'<path d="M184 94q16 30 32 0l-16 43Z"/><circle cx="200" cy="138" r="5"/>',belt:'<path d="M169 216h62v10h-62Z"/><rect x="194" y="214" width="12" height="14"/>',
 wrists:'<path d="m137 221 16 4-3 10-16-3Zm110 4 16-4 3 11-16 3Z"/>',
 hands:'<path d="m135 235 19 5-2 28-13 2-10-12Z"/>',hand2:'<path d="m246 240 19-5 6 23-10 12-13-2Z"/>',
 ranged:'<path d="M263 265q36 38 0 76l11-38Z"/><path d="m250 303 48 0m-5-5 5 5-5 5"/>',
 legs:'<path d="m177 286 20 0-5 118-19 0Zm26 0h20l4 118h-19Z"/>',
 feet:'<path d="M170 414h23v41l-2 13h-34v-14l13-4Zm37 0h23v36l13 4v14h-34l-2-13Z"/>',
 ring1:'<circle cx="142" cy="258" r="7"/><path d="m139 251 3-5 3 5"/>',ring2:'<circle cx="258" cy="258" r="7"/><path d="m255 251 3-5 3 5"/>'
};
export function renderEquipment(data={}){
 const rows=equipmentRows(data),assigned=equipmentSlots.filter(s=>equippedInSlot(data,s.id)).length,legacy=rows.filter(({item})=>item?.equipped===true&&!equipmentSlotIds.includes(item.equip_slot)).length;
 const found=s=>equippedInSlot(data,s.id)?.item;
 const slotButton=s=>{const item=found(s);return '<button type="button" class="cs-gear-slot'+(item?' has-item':'')+'" '+(s.side?'style="'+s.side+':0;top:'+s.y/520*100+'%" ':'')+'data-equip-slot="'+s.id+'" aria-label="'+e(s.label+': '+(item?.name||'Empty')+'. Choose equipment')+'"><span class="cs-gear-slot-name">'+s.label+'</span><span class="cs-gear-slot-item">'+e(item?.name||'＋ Empty')+'</span></button>';};
 const main=equipmentSlots.filter(s=>s.side),accessoryCount=equipmentSlots.filter(s=>s.accessory&&found(s)).length;
 const connectors=main.map(s=>'<path data-slot-connector="'+s.id+'" d="M'+(s.side==='left'?108:292)+' '+s.y+' H'+(s.side==='left'?124:276)+' L'+s.target.join(' ')+'"/><circle cx="'+s.target[0]+'" cy="'+s.target[1]+'" r="3"/>').join('');
 const equipped=Object.entries(markers).filter(([id])=>equippedInSlot(data,id)).map(([id,path])=>'<g class="cs-equipped-region" data-equipped-region="'+id+'">'+(id==='hands'||id==='hand2'?(()=>{const r=equippedInSlot(data,id),weapon=r.collection==='weapons'||/weapon/i.test(String(r.item.sourceCategory||r.item.category||r.item.tags));if(weapon&&r.item.two_handed&&id==='hand2')return path;return weapon?'<path class="cs-equipped-weapon" d="M'+(id==='hands'?'140 258 125 194m-6 19 20-5':'260 258 275 194m-14 14 20 5')+'"/>':path;})():path)+'</g>').join('');
 return '<section class="cs-equipment" aria-label="Equipped items"><div class="cs-gear-heading"><h2>Equipment</h2><span class="cs-gear-count">'+assigned+' / '+equipmentSlots.length+' slots</span></div><div class="cs-body-board"><svg viewBox="0 0 400 520" class="cs-body-silhouette" role="img" aria-label="Character equipment silhouette"><g class="cs-body-base"><path d="M184 30q16-12 32 0l8 22-5 22-12 10h-14l-12-10-5-22Z"/><path d="M185 83v12l-28 9-15 13-8 39 4 30-12 52 2 24 14 14 15-8 5-28 5-35 8-26-4 39 9 42-9 37-4 85 3 43-9 27v17h32l5-27 5-93 7-34 7 34 5 93 5 27h32v-17l-9-27 3-43-4-85-9-37 9-42-4-39 8 26 5 35 5 28 15 8 14-14 2-24-12-52 4-30-8-39-15-13-28-9V83"/><path class="cs-body-detail" d="m158 111 19 8 23 9 23-9 19-8m-67 15-5 34 30 15 30-15-5-34M200 128v112m-26-46 26 8 26-8m-51 29h50m-46 28 21 13 21-13m-47 68 18 4m16 0 18-4m-55 69 22 1m14 0 22-1m-48 47h23m9 0h23M183 48h34m-27 15h20"/></g>'+equipped+'<g class="cs-slot-connectors">'+connectors+'<path d="M292 88H272L220 100"/><circle cx="220" cy="100" r="3"/></g></svg>'+main.map(slotButton).join('')+'<button class="cs-gear-slot cs-accessory-button'+(accessoryCount?' has-item':'')+'" type="button" data-accessory-open aria-expanded="true" aria-label="Accessory slots"><span class="cs-gear-slot-name">Accessory</span><span class="cs-gear-slot-item">'+accessoryCount+' equipped</span></button></div><details class="cs-accessory-panel" open><summary>All accessory slots <span>'+accessoryCount+' / '+accessories.length+'</span></summary><div>'+equipmentSlots.filter(s=>s.accessory).map(slotButton).join('')+'</div></details>'+(legacy?'<p class="cs-gear-note">'+legacy+' previously equipped item'+(legacy===1?' has':'s have')+' no slot yet. Assign '+(legacy===1?'it':'them')+' above.</p>':'')+'</section>';
}
