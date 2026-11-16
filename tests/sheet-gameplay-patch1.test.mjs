import test from 'node:test';
import assert from 'node:assert/strict';
import {sheetStats,abilityCheckBonus,skillTotal} from '../src/features/sheet/model.mjs';
import {entryCalculations} from '../src/features/sheet/calculations.mjs';
import {equipmentSlotCompatible,renderEquipChoices} from '../src/features/sheet/equipment.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderSection} from '../src/features/sheet/view.mjs';
import {renderAbilityEditorTabs} from '../src/features/sheet/entry-editor-tabs.mjs';

test('CMB uses Strength for normal/large creatures and Dexterity instead for Tiny or smaller',()=>{
 const data={bab:6,str:16,dex:14,size_category:'Medium'};
 assert.equal(sheetStats(data).cmb,9);
 assert.equal(sheetStats({...data,size_category:'Large'}).cmb,10);
 assert.equal(sheetStats({...data,size_category:'Tiny'}).cmb,6);
 assert.equal(sheetStats({...data,size_category:'Fine'}).cmb,0);
 assert.equal(sheetStats({...data,cmb_temp:3}).cmb,12);
});

test('plain Dexterity ability checks ignore armor penalties, while skills still apply them',()=>{
 const data={dex:14,str:12,items:[{name:'Heavy Armor',sourceCategory:'Armor',type:'Heavy Armor',checkPenalty:'-6',equip_slot:'chest',equipped:true}]};
 assert.equal(abilityCheckBonus(data,'dex'),2);
 assert.equal(abilityCheckBonus(data,'str'),1);
 const skill=skillTotal({name:'Acrobatics',stat:'dex',lvl:1,cs:false},data);
 assert.ok(skill<=3,'Relevant skill penalties still apply separately.');
});

test('equipment picker filters by slot and requires explicit manual override on the backend',()=>{
 const sword={name:'Longsword',sourceCategory:'Weapon',amount:1};
 const potion={name:'Healing Potion',sourceCategory:'Consumables',amount:1};
 const ring={name:'Ring of Protection',sourceCategory:'Magic Items',amount:1};
 assert.equal(equipmentSlotCompatible(sword,'hands'),true);
 assert.equal(equipmentSlotCompatible(sword,'ring1'),false);
 assert.equal(equipmentSlotCompatible(potion,'feet'),false);
 assert.equal(equipmentSlotCompatible(ring,'ring1'),true);
 const data={items:[sword,potion,ring],weapons:[]};
 const normal=renderEquipChoices(data,'','ring1');
 assert.match(normal,/Ring of Protection/);
 assert.doesNotMatch(normal,/Healing Potion|Longsword/);
 assert.match(renderEquipChoices(data,'','ring1',{showIncompatible:true}),/Healing Potion/);
 assert.throws(()=>mergeSheetData(data,{action:'equip',slot:'feet',collection:'items',index:1}),/manual override/);
 const unusual=mergeSheetData(data,{action:'equip',slot:'feet',collection:'items',index:1,allowIncompatible:true});
 assert.equal(unusual.items[1].carried,true);
 assert.equal(unusual.items[1].equip_slot,'feet');
 assert.throws(()=>mergeSheetData(unusual,{action:'entry',collection:'items',mode:'update',index:1,fields:{carried:false}}),/Unequip/);
 const unequipped=mergeSheetData(unusual,{action:'equip',slot:'feet',index:null});
 const stored=mergeSheetData(unequipped,{action:'entry',collection:'items',mode:'update',index:1,fields:{carried:false}});
 assert.equal(stored.items[1].carried,false);
 const inventory=renderSection({id:'x',name:'Hero',data:stored},'items');
 assert.match(inventory,/Stored · not carried/);
 assert.match(inventory,/data-inventory-carry="1"/);
});

test('multiclass spell source class selects its profile and honors caster-level overrides',()=>{
 const data={classes:[{name:'Black Mage',level:5},{name:'White Mage',level:3}],int:18,wis:16,
  castingProfiles:[{className:'Black Mage',casterLevel:5,ability:'int'},{className:'White Mage',casterLevel:3,ability:'wis'}],
  spells:[{name:'Cure',lvl:1,damage:'1d6'}]};
 const selected=mergeSheetData(data,{action:'entry',collection:'spells',mode:'update',index:0,fields:{sourceClass:'White Mage',casting_ability:''}});
 assert.equal(entryCalculations(selected.spells[0],selected,'spells').ctx.CL,3);
 assert.equal(entryCalculations(selected.spells[0],selected,'spells').stat,'wis');
 assert.equal(entryCalculations(selected.spells[0],selected,'spells').dc,14);
 assert.equal(entryCalculations({...selected.spells[0],caster_level:9},selected,'spells').ctx.CL,9);
 assert.throws(()=>mergeSheetData(data,{action:'entry',collection:'spells',mode:'update',index:0,fields:{sourceClass:'Other Class'}}),/Choose one of/);
 const html=renderAbilityEditorTabs(['name','lvl','sourceClass','desc'],key=>'<input name="'+key+'">',{collection:'spells'});
 assert.match(html,/name="sourceClass"/);
});
