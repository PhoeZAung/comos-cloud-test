import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityCheckBonus,sheetStats,skillTotal} from '../src/features/sheet/model.mjs';
import {carriedWeight} from '../src/features/sheet/carrying.mjs';
import {isWeaponInventoryItem,weaponFromInventory,ammoStock,moveInventoryWeapons,reloadWeaponFromInventory} from '../src/features/sheet/weapon-inventory.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {readFile} from 'node:fs/promises';
import {renderSection,entryDetail} from '../src/features/sheet/view.mjs';

test('carrying check penalty applies to DEX roll exactly once while DEX skills and AC retain their calculations',()=>{
 const data={str:10,dex:18,items:[{name:'Stones',sourceCategory:'Gear',weight:90,amount:1}]};
 const enc=sheetStats(data).encumbrance;
 assert.equal(enc.load,'heavy');
 assert.equal(enc.checkPenalty,-6);
 assert.equal(abilityCheckBonus(data,'dex'),-2);
 assert.equal(abilityCheckBonus(data,'str'),0);
 assert.equal(sheetStats(data).mods.dex,4);
 assert.equal(sheetStats(data).dexAcModifier,1);
 assert.equal(skillTotal({name:'Acrobatics',stat:'dex',lvl:1},data),4+1-6);
 const plain=renderSection({id:'d',name:'Hero',data},'overview');
 assert.match(plain,/data-roll="DEX check" data-bonus="-2"/);
 assert.match(plain,/Load\/armor penalty/);
 assert.equal(abilityCheckBonus({...data,items:[]},'dex'),4);
});

test('moving existing weapon inventory entries preserves equipped state, catalog metadata and total carried weight',()=>{
 const source={str:12,items:[
  {name:'Mithral Bow',sourceCategory:'Ranged Weapon',type:'Bow',dmg:'1d8',amount:1,weight:2,carried:true,equipped:true,equip_slot:'ranged',sourceItemId:'p1',sourceCatalog:{raw:{Dmg:'1d8'}}},
  {name:'Sword',sourceCategory:'Weapon',amount:2,weight:4,desc:'old blade'},
  {name:'Arrow',sourceCategory:'Ammunition',amount:20,weight:0.1},
  {name:'Shield',sourceCategory:'Armor',amount:1,weight:6}
 ]};
 const before=carriedWeight(source).total;
 const moved=mergeSheetData(source,{action:'moveInventoryWeapons'});
 assert.equal(moved.weapons.length,3);
 assert.equal(moved.items.length,1);
 assert.equal(carriedWeight(moved).total,before);
 assert.equal(moved.weapons[0].equip_slot,'ranged');
 assert.equal(moved.weapons[0].sourceItemId,'p1');
 assert.equal(moved.weapons[0].sourceCatalog.raw.Dmg,'1d8');
 assert.equal(moved.weapons[0].damage,'1d8');
 assert.equal(moved.weapons[0].attack_type,'ranged');
 assert.equal(moved.weapons[1].amount,2);
 assert.equal(moved.weapons[2].sourceCategory,'Ammunition');
 assert.equal(moved.weapons[2].amount,20);
 assert.equal(source.weapons,undefined,'migration must never mutate input snapshot');
 assert.throws(()=>mergeSheetData(moved,{action:'moveInventoryWeapons'}),/No weapons or ammunition found/);
});

test('reload exact matching ammo from inventory without consuming ordinary items',()=>{
 const initial={weapons:[{name:'Flintlock',attack_type:'ranged',u_curr:1,u_max:6,ammoType:'Musket Balls',weight:6}],
  items:[
   {name:'musket  balls',sourceCategory:'Ammunition',amount:2,weight:0.01},
   {name:'Musket Balls',sourceCategory:'Ammunition',amount:8,weight:0.01},
   {name:'Musket Balls',sourceCategory:'Gear',amount:50,weight:0.01},
   {name:'Arrows',sourceCategory:'Ammunition',amount:40}
  ]};
 assert.equal(ammoStock(initial,'  MUSKET BALLS  ').total,10);
 const loaded=mergeSheetData(initial,{action:'reloadWeapon',index:0});
 assert.equal(loaded.weapons[0].u_curr,6);
 assert.equal(loaded.items[0].amount,0);
 assert.equal(loaded.items[1].amount,5);
 assert.equal(loaded.items[2].amount,50);
 assert.equal(loaded.items[3].amount,40);
 assert.equal(initial.items[0].amount,2);
 assert.throws(()=>mergeSheetData(loaded,{action:'reloadWeapon',index:0}),/already full/);
});

test('partial reload and inventory-empty fallback never produce free rounds or negative stocks',()=>{
 const initial={weapons:[{name:'Bow',u_curr:0,u_max:10,ammoType:'Arrows'}],items:[
  {name:'Arrows',sourceCategory:'Ammunition',amount:3}
 ]};
 const partial=mergeSheetData(initial,{action:'reloadWeapon',index:0});
 assert.equal(partial.weapons[0].u_curr,3);
 assert.equal(partial.items[0].amount,0);
 assert.throws(()=>mergeSheetData(partial,{action:'reloadWeapon',index:0}),/No Arrows left in Inventory/);
 assert.throws(()=>reloadWeaponFromInventory({weapons:[{name:'Bow',u_curr:0,u_max:10}],items:[]},0),/Set Ammo Type/);
 assert.throws(()=>reloadWeaponFromInventory({weapons:[{name:'Bow',u_curr:0,u_max:0,ammoType:'Arrows'}],items:[]},0),/Set Max Ammo/);
 assert.throws(()=>reloadWeaponFromInventory({weapons:[{name:'Bow',u_curr:-1,u_max:5,ammoType:'Arrows'}],items:[]},0),/Set a valid Ammo count/);
 const noAmmo={weapons:[{name:'Bow',u_curr:0,u_max:5,ammoType:'Arrows'}],items:[{name:'Arrows',sourceCategory:'Gear',amount:99}]};
 assert.throws(()=>mergeSheetData(noAmmo,{action:'reloadWeapon',index:0}),/No Arrows left/);
});

test('weapons expose reload control next to ammo and inventory migration only if legacy weapons exist',()=>{
 const weapons={id:'char',name:'Test',data:{weapons:[{name:'Crossbow',sourceCategory:'Ranged Weapon',attack_type:'ranged',u_curr:1,u_max:5,ammoType:'Bolts'}],
  items:[{name:'Crossbow spare',sourceCategory:'Ranged Weapon',amount:1},{name:'Bolts',sourceCategory:'Ammunition',amount:10}]}};
 const html=renderSection(weapons,'combat',{weaponView:'Ranged Weapon'});
 assert.match(html,/data-weapon-reload="0"/);
 assert.match(html,/Reload Crossbow from Inventory/);
 assert.match(html,/data-move-inventory-weapons/);
 assert.match(html,/Move gear \(2\)/);
 const detail=entryDetail(weapons.data.weapons[0],weapons.data,'weapons');
 assert.match(detail,/Ammo Type/);
 assert.match(detail,/Max Ammo/);
 const without={...weapons,data:{...weapons.data,items:[]}};
 assert.doesNotMatch(renderSection(without,'combat'),/data-move-inventory-weapons/);
});


test('three armory tiles show separate melee, ranged and ammunition sections, without stray braces',()=>{
 const data={weapons:[
  {name:'Short Sword',sourceCategory:'Weapon',attack_type:'melee',damage:'1d6'},
  {name:'Crossbow',sourceCategory:'Ranged Weapon',attack_type:'ranged',damage:'1d8',u_curr:1,u_max:5,ammoType:'Bolts'},
  {name:'Bolts',sourceCategory:'Ammunition',amount:6}
 ],items:[{name:'Legacy Bolts',sourceCategory:'Ammunition',amount:4}]};
 const char={id:'test',name:'Hero',data};
 const melee=renderSection(char,'combat',{weaponView:'Weapon'});
 assert.match(melee,/data-weapon-view="Weapon" aria-pressed="true"/);
 assert.match(melee,/Short Sword/);assert.doesNotMatch(melee,/data-weapon-roll="1"/);
 assert.match(melee,/data-weapon-add-toggle/);
 assert.match(melee,/data-add-weapon-kind="Weapon"/);
 assert.match(melee,/data-add-weapon-kind="Ranged Weapon"/);
 assert.match(melee,/data-add-weapon-kind="Ammunition"/);
 const ranged=renderSection(char,'combat',{weaponView:'Ranged Weapon'});
 assert.match(ranged,/Crossbow/);
 assert.match(ranged,/data-weapon-reload="1"/);
 assert.doesNotMatch(ranged,/\}\s*<button[^>]+data-entry-send/);
 const ammo=renderSection(char,'combat',{weaponView:'Ammunition'});
 assert.match(ammo,/Bolts/);assert.match(ammo,/Legacy Bolts/);
 assert.match(ammo,/× 6/);assert.match(ammo,/× 4/);
 assert.doesNotMatch(ammo,/data-weapon-roll/);
 assert.match(ammo,/data-edit-weapon-ammo="weapons:2"/);
 assert.match(ammo,/data-edit-weapon-ammo="items:0"/);
});

test('ammo rounds can be supplied by a dedicated Weapons ammunition entry',()=>{
 const initial={weapons:[{name:'Bow',u_curr:0,u_max:5,ammoType:'Arrows'},
  {name:'Arrows',sourceCategory:'Ammunition',amount:3}],items:[]};
 assert.equal(ammoStock(initial,'Arrows').total,3);
 const result=mergeSheetData(initial,{action:'reloadWeapon',index:0});
 assert.equal(result.weapons[0].u_curr,3);
 assert.equal(result.weapons[1].amount,0);
 assert.equal(initial.weapons[1].amount,3);
 assert.throws(()=>mergeSheetData(result,{action:'reloadWeapon',index:0}),/No Arrows left/);
});
test('backend validates newly editable weapon item category and ammo name',()=>{
 const base={weapons:[{name:'Bow',damage:'1d6',u_curr:0,u_max:0}]};
 const changed=mergeSheetData(base,{action:'entry',collection:'weapons',mode:'update',index:0,fields:{
  sourceCategory:'Ranged Weapon',type:'Bow',cost:'80 Gil',ammoType:'Arrows',rarity:'Uncommon'
 }});
 assert.equal(changed.weapons[0].sourceCategory,'Ranged Weapon');
 assert.equal(changed.weapons[0].ammoType,'Arrows');
 assert.equal(changed.weapons[0].type,'Bow');
 assert.throws(()=>mergeSheetData(base,{action:'entry',collection:'weapons',mode:'update',index:0,fields:{sourceCategory:'Misc'}}),/Choose Weapon, Ranged Weapon or Ammunition/);
 const ammo=mergeSheetData(base,{action:'entry',collection:'weapons',mode:'add',fields:{name:'Arrows',sourceCategory:'Ammunition',amount:10}});
 assert.equal(ammo.weapons[1].amount,10);
});


test('changing the weapon item tag does not assume inventory-only icon exists',async()=>{
 const src=await readFile('src/ui/sheet.mjs','utf8');
 assert.match(src,/select\.name==='sourceCategory'\)\{const icon=root\.querySelector\('\[data-category-icon\]'\);if\(icon\)icon\.textContent/);
});
