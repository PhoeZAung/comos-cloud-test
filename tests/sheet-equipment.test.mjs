import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {equipmentSlots,equipmentSlotIds,equipmentSlotLabel,equippedInSlot,renderEquipment} from '../src/features/sheet/equipment.mjs';
import {renderSection,renderSheetFrame} from '../src/features/sheet/view.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharactersService} from '../backend/characters/service.mjs';
import {createDirectoryRoutes} from '../backend/characters/directory.mjs';
import {createApiServer} from '../backend/http/app.mjs';

const inventory={str:12,dex:14,items:[
 {name:'Iron helm',amount:1,desc:'Keeps rain off',sourceItemId:'item-a'},
 {name:'Feather helm',amount:1,sourceItemId:'item-b'},
 {name:'Ruby ring',amount:1,sourceItemId:'item-c'},
 {name:'Sapphire ring',amount:1,sourceItemId:'item-d'},
 {name:'Broken boots',amount:0,sourceItemId:'item-e'},
 {name:'Historical armor',amount:1,equipped:true,sourceItemId:'legacy'}
]};
const equip=(data,slot,index)=>mergeSheetData(data,{action:'equip',slot,index});
test('Equipment groups all seventeen slots without a silhouette or boxed slot buttons',()=>{
 assert.deepEqual(equipmentSlots.map(slot=>slot.label),[
  'Head','Headband','Eyes','Shoulders','Necklace','Chest','Arms','Body','Belt','Wrists','Hand 1','Hand 2','Ranged','Legs','Ring 1','Ring 2','Feet'
 ]);
 assert.equal(new Set(equipmentSlotIds).size,17);
 const html=renderEquipment(inventory);
 assert.equal((html.match(/data-equip-slot="/g)||[]).length,17);
 assert.match(html,/Weapons/);assert.match(html,/Armor/);assert.match(html,/Accessories/);
 assert.match(html,/Carried \/ Not Equipped/);
 assert.match(html,/data-equip-slot="ring1"/);
 assert.match(html,/data-equip-slot="ring2"/);
 assert.match(html,/Previously equipped, no slot/);
 assert.match(html,/data-assign-item="0"/);
 assert.match(html,/data-remove-gear="items:0"/);
 assert.match(html,/data-add-entry="items"/);
 assert.doesNotMatch(html,/cs-body-silhouette|cs-body-board|cs-gear-slot|data-slot-connector|data-equipped-region/);
 assert.ok(html.includes('0 / 17 slots equipped'));
 const raw={...inventory,items:[{name:'<img src=x onerror=alert(1)>',amount:1,equipped:true,equip_slot:'head'}]};
 const escaped=renderEquipment(raw);
 assert.doesNotMatch(escaped,/<img src=x|<script>/);
 assert.match(escaped,/&lt;img/);
 assert.match(escaped,/data-unequip-slot="head"/);
 assert.doesNotMatch(escaped,/data-remove-gear="items:0"/,'equipped items must be unequipped before deletion');
});
test('Unequipped gear returns to carried inventory and can then be removed safely',()=>{
 const first=equip(inventory,'head',0);
 assert.doesNotMatch(renderEquipment(first),/data-remove-gear="items:0"/);
 const clear=equip(first,'head',null);
 assert.match(renderEquipment(clear),/data-remove-gear="items:0"/);
 assert.equal(clear.items[0].name,'Iron helm');
 const removed=mergeSheetData(clear,{action:'entry',collection:'items',mode:'remove',index:0});
 assert.equal(removed.items.some(item=>item.name==='Iron helm'),false);
 assert.equal(equippedInSlot(removed,'head'),null);
});
test('Equipping, replacing, moving, and removing items is atomic and preserves inventory metadata',()=>{
 const start=structuredClone(inventory);
 const head=equip(inventory,'head',0);
 assert.deepEqual(inventory,start,'original character must remain unchanged');
 assert.equal(head.items[0].equipped,true);
 assert.equal(head.items[0].equip_slot,'head');
 assert.equal(head.items[0].sourceItemId,'item-a');
 assert.equal(equippedInSlot(head.items,'head').index,0);
 assert.equal(head.items[5].equipped,true,'existing legacy equipped items are retained');
 const replaced=equip(head,'head',1);
 assert.equal(replaced.items[0].equipped,false);
 assert.equal(replaced.items[0].equip_slot,'');
 assert.equal(replaced.items[1].equip_slot,'head');
 assert.equal(equippedInSlot(replaced.items,'head').index,1);
 const moved=equip(replaced,'neck',1);
 assert.equal(equippedInSlot(moved.items,'head'),null);
 assert.equal(equippedInSlot(moved.items,'neck').index,1);
 const ring1=equip(moved,'ring1',2);
 const ring2=equip(ring1,'ring2',3);
 assert.equal(equippedInSlot(ring2.items,'ring1').item.name,'Ruby ring');
 assert.equal(equippedInSlot(ring2.items,'ring2').item.name,'Sapphire ring');
 assert.equal(equipmentSlotLabel('ring2'),'Ring 2');
 const cleared=equip(ring2,'ring1',null);
 assert.equal(equippedInSlot(cleared.items,'ring1'),null);
 assert.equal(cleared.items[2].equipped,false);
 assert.equal(cleared.items[3].equip_slot,'ring2');
 assert.equal(cleared.items[3].sourceItemId,'item-d');
 assert.equal(cleared.str,inventory.str,'no automatic ability score bonuses');
 assert.equal(cleared.ac_armor,inventory.ac_armor,'no automatic AC bonuses');
 const zeroed=mergeSheetData(cleared,{action:'entry',collection:'items',mode:'update',index:3,fields:{amount:0}});
 assert.equal(equippedInSlot(zeroed.items,'ring2'),null,'depleted item should unequip safely');
 const removed=mergeSheetData(cleared,{action:'entry',collection:'items',mode:'remove',index:3});
 assert.equal(equippedInSlot(removed.items,'ring2'),null,'deleting inventory removes its slot');
});

test('Server refuses forged slots, empty inventory and malformed item selection',()=>{
 for(const patch of [
  {slot:'helmet',index:0},{slot:'admin',index:0},{slot:'head',index:-1},
  {slot:'head',index:99},{slot:'feet',index:4},{slot:'ring1',index:1.5},
  {slot:'__proto__',index:null},{slot:null,index:0},{slot:'head'},
 ]){
  assert.throws(()=>mergeSheetData(inventory,{action:'equip',...patch}));
 }
 const html=renderSheetFrame({id:randomUUID(),name:'Mage',data:inventory},'items',{itemView:'equip'});
 assert.match(html,/aria-label="Item sections"/);
 assert.match(html,/data-item-view="equip" aria-pressed="true"/);
 assert.match(html,/data-item-view="inventory" aria-pressed="false"/);
 assert.match(html,/data-equipment-dialog/);
 assert.match(html,/data-equip-item-select/);
 assert.match(html,/data-equip-preview/);
 assert.match(html,/Current sheet stats/);
 assert.match(html,/Equipping items does not automatically recalculate combat statistics/);
 const inventoryHTML=renderSection({id:randomUUID(),name:'Mage',data:inventory},'items',{itemView:'inventory'});
 assert.match(inventoryHTML,/data-add-entry="items"/);
 assert.match(inventoryHTML,/data-assign-item="0"/);
 assert.match(inventoryHTML,/Equipped \(unassigned\)/);
 assert.doesNotMatch(inventoryHTML,/data-equipment=/);
 assert.doesNotMatch(renderSection({id:randomUUID(),name:'Mage',data:inventory},'items',{itemView:'equip'}),/data-sheet-list/);
 const combat=renderSection({id:'mage',name:'Mage',data:inventory},'combat',{combatView:'offense'});
 assert.match(combat,/cs-metric-initiative/);
 assert.match(combat,/data-roll="Initiative"/);
 assert.doesNotMatch(renderSection({id:'mage',name:'Mage',data:inventory},'combat',{combatView:'defense'}),/cs-metric-initiative/);
});

test('Equip slots persist through the authenticated revision-checked character sheet route',async()=>{
 const db=await openDatabase(':memory:');
 const users=createUserRepository(db),user=users.create({displayName:'Mage'}),outsider=users.create({displayName:'Outsider'});
 const characterId=randomUUID();
 createCharactersService(db).save({op:'save',id:characterId,revision:0,name:'Mage',ownerId:user.id,sources:[]});
 db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(characterId,JSON.stringify(inventory));
 const sessions={restore:async cookie=>{
  if(cookie==='owner')return {subject:'owner',user};
  if(cookie==='outsider')return {subject:'outsider',user:outsider};
  throw Error('Session required');
 }};
 const origin='https://example.test';
 const app=createApiServer({db,directoryRoutes:createDirectoryRoutes({db,sessions,origin})});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+app.address().port+'/api/v1/character-records/'+characterId;
 const headers=who=>({'Content-Type':'application/json',Origin:origin,Cookie:'__Host-comos_session='+who});
 try{
  const write=async(owner,revision,slot,index)=>fetch(url,{method:'POST',headers:headers(owner),body:JSON.stringify({op:'sheet',action:'equip',revision,slot,index})});
  assert.equal((await write('outsider',1,'head',0)).status,404);
  let response=await write('owner',1,'head',0);
  assert.equal(response.status,200);
  let payload=await response.json();
  assert.equal(payload.character.data.items[0].equip_slot,'head');
  assert.equal(payload.character.revision,2);
  assert.equal((await write('owner',1,'head',1)).status,409,'stale saves are rejected');
  response=await write('owner',2,'head',1);
  assert.equal(response.status,200);
  payload=await response.json();
  assert.equal(payload.character.data.items[0].equipped,false);
  assert.equal(payload.character.data.items[1].equip_slot,'head');
  assert.equal((await write('owner',3,'unknown',1)).status,400);
  const reloaded=await (await fetch(url,{headers:headers('owner')})).json();
  assert.equal(reloaded.character.data.items[1].equip_slot,'head');
  assert.equal(reloaded.character.data.items[1].sourceItemId,'item-b');
 }finally{await new Promise(resolve=>app.close(resolve));db.close();}
});
