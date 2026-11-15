import test from 'node:test';
import assert from 'node:assert/strict';
import {ammoEffectsForWeapon,reloadWeaponFromInventory} from '../src/features/sheet/weapon-inventory.mjs';
import {weaponAttackParts} from '../src/features/sheet/model.mjs';
import {weaponDamageFormulas} from '../src/features/sheet/calculations.mjs';
import {weaponRoll} from '../backend/characters/rolls.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderWeaponEditorTabs} from '../src/features/sheet/entry-editor-tabs.mjs';

test('exact ammunition name adds one AR/DMG profile to attack and damage rolls',()=>{
 const data={bab:3,dex:14,str:10,
  weapons:[{name:'Bow',sourceCategory:'Ranged Weapon',attack_type:'ranged',damage:'1d8',u_max:5,u_curr:3,ammoType:'Arrows'}],
  items:[{name:' arrows ',sourceCategory:'Ammunition',amount:2,ammo_ar_bonus:2,ammo_dmg_bonus:4,damage_types:['Piercing']},
   {name:'ARROWS',sourceCategory:'Ammunition',amount:9,ammo_ar_bonus:999,ammo_dmg_bonus:999},
   {name:'Arrows',sourceCategory:'Gear',amount:9000,ammo_ar_bonus:800,ammo_dmg_bonus:800}]};
 const bow=data.weapons[0];
 assert.deepEqual(ammoEffectsForWeapon(data,bow),{name:'Arrows',arBonus:2,dmgBonus:4,damageTypes:['Piercing']});
 assert.equal(weaponAttackParts(bow,data).total,7);
 assert.equal(weaponDamageFormulas(bow,data).normal,'1d8 + 4');
 const expressions=[];
 const result=weaponRoll(bow,data,expression=>{expressions.push(expression);return {expression,total:10,rolls:[10],bonus:0,breakdown:[]};});
 assert.equal(result.total,10);
 assert.deepEqual(expressions.slice(0,2),['1d20+7','1d8 + 4']);
 assert.equal(result.ammunition.dmgBonus,4);
 assert.equal(ammoEffectsForWeapon(data,{...bow,ammoType:'Bolts'}).arBonus,0);
});

test('reload snapshots ammunition properties after final stack is spent',()=>{
 const initial={bab:1,dex:12,weapons:[{name:'Bow',sourceCategory:'Ranged Weapon',attack_type:'ranged',damage:'1d6',u_curr:0,u_max:2,ammoType:'Arrows'}],
  items:[{name:'Arrows',sourceCategory:'Ammunition',amount:2,ammo_ar_bonus:1,ammo_dmg_bonus:-2,damage_types:['Other'],damage_type_other:'Arcane'}]};
 const loaded=mergeSheetData(initial,{action:'reloadWeapon',index:0});
 assert.equal(loaded.items[0].amount,0);
 assert.equal(loaded.weapons[0].u_curr,2);
 assert.deepEqual(ammoEffectsForWeapon(loaded,loaded.weapons[0]),{name:'Arrows',arBonus:1,dmgBonus:-2,damageTypes:['Arcane']});
 assert.equal(weaponAttackParts(loaded.weapons[0],loaded).total,3);
 assert.equal(weaponDamageFormulas(loaded.weapons[0],loaded).normal,'1d6 - 2');
 assert.equal(initial.items[0].amount,2);
 const switched={...loaded.weapons[0],ammoType:'Bolts'};
 assert.equal(ammoEffectsForWeapon(loaded,switched).dmgBonus,0);
});

test('server validates custom type and bonuses on both armory and legacy inventory ammunition',()=>{
 const base={items:[{name:'Bolts',sourceCategory:'Ammunition',amount:4}],weapons:[{name:'Bow',sourceCategory:'Ranged Weapon',damage:'1d8'}]};
 const changed=mergeSheetData(base,{action:'entry',collection:'items',mode:'update',index:0,fields:{damage_types:['Other'],damage_type_other:'Magic Piercing',ammo_ar_bonus:3,ammo_dmg_bonus:-1}});
 assert.equal(changed.items[0].ammo_ar_bonus,3);
 assert.equal(changed.items[0].ammo_dmg_bonus,-1);
 assert.equal(changed.items[0].damage_type_other,'Magic Piercing');
 assert.throws(()=>mergeSheetData(base,{action:'entry',collection:'items',mode:'update',index:0,fields:{damage_types:['Other'],damage_type_other:''}}),/Enter a name for Other/);
 assert.throws(()=>mergeSheetData(base,{action:'entry',collection:'items',mode:'update',index:0,fields:{ammo_ar_bonus:1.5}}),/whole numbers/);
 assert.throws(()=>mergeSheetData(base,{action:'entry',collection:'weapons',mode:'update',index:0,fields:{ammo_dmg_bonus:2}}),/belong to ammunition/);
 const cleared=mergeSheetData(changed,{action:'entry',collection:'items',mode:'update',index:0,fields:{damage_types:[],damage_type_other:'Magic Piercing'}});
 assert.equal(cleared.items[0].damage_type_other,'');
 const newAmmo=mergeSheetData(base,{action:'entry',collection:'weapons',mode:'add',fields:{name:'Flame bullets',sourceCategory:'Ammunition',amount:6,damage_types:['Fire'],ammo_ar_bonus:2,ammo_dmg_bonus:3}});
 assert.equal(newAmmo.weapons[1].ammo_dmg_bonus,3);
});

test('the ammo editor has one stats tab and weapon details hide unused type input',()=>{
 const field=key=>'<input name="'+key+'">';
 const ammo=renderWeaponEditorTabs(['sourceCategory','name','cost','amount','damage_types','damage_type_other','ammo_ar_bonus','ammo_dmg_bonus','desc'],field,{category:'Ammunition'});
 assert.deepEqual([...ammo.matchAll(/data-entry-edit-tab="[^"]+"[^>]*>([^<]+)/g)].map(x=>x[1]),['Basic Info','Ammunition Stats']);
 for(const key of ['amount','damage_types','damage_type_other','ammo_ar_bonus','ammo_dmg_bonus'])assert.match(ammo,new RegExp('name="'+key+'"'));
 assert.match(ammo,/cs-weapon-advanced/);
 assert.match(ammo,/name="desc"/);
 const weapon=renderWeaponEditorTabs(['name','cost','damage','damage_types','damage_type_other','desc'],field,{category:'Weapon'});
 assert.match(weapon,/cs-weapon-damage-type-group/);
 assert.doesNotMatch(weapon,/name="type"/);
});
