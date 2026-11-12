import test from 'node:test';
import assert from 'node:assert/strict';
import {entryCalculations} from '../src/features/sheet/calculations.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';

const char={hp_curr:30,hp_max:30,int:18,dex:16,str:12,wis:14,character_level:6,npcStats:{casterLevel:8,spellDC:21},spells:[],activeAbilities:[],weapons:[]};
test('manual DC and total attack bonus override NPC defaults for spells and abilities',()=>{
 const spell=entryCalculations({name:'Arc Bolt',lvl:3,attack_type:'ranged_touch',save_dc_override:24,attack_bonus_override:11,caster_level:12},char,'spells');
 assert.equal(spell.dc,24);
 assert.equal(spell.dcSource,'Manual override');
 assert.equal(spell.attack.bonus,11);assert.equal(spell.attack.manual,true);
 assert.equal(spell.ctx.CL,12);
 const ability=entryCalculations({name:'Fear Wave',attack_type:'touch',save_dc_override:22,attack_bonus_override:8},char,'activeAbilities');
 assert.equal(ability.dc,22);assert.equal(ability.attack.bonus,8);
 assert.equal(ability.ctx.CL,8);
});
test('automatically derived DC still works when manual fields are unset',()=>{
 const derived=entryCalculations({lvl:3,casting_ability:'int',dc_misc:2,attack_type:'touch'},char,'spells');
 assert.equal(derived.dc,19); // 10 + 3 + Int mod 4 + 2
 assert.equal(derived.dcSource,'Spell level + casting ability');
 const custom=entryCalculations({lvl:3,dc_formula:'15+{INT}',casting_ability:'int'},char,'spells');
 assert.equal(custom.dc,19);assert.equal(custom.dcSource,'Custom formula');
 const npcDefault=entryCalculations({name:'Magic'},char,'activeAbilities');
 assert.equal(npcDefault.dc,21);assert.equal(npcDefault.dcSource,'NPC default DC');
});
test('manual values are editable server-side and blank resets to automatic',()=>{
 let data=mergeSheetData(char,{action:'entry',collection:'spells',mode:'add',
  fields:{name:'Arc Bolt',attack_bonus_override:7,save_dc_override:26,dc_formula:'10+{CL}'}},{npc:false});
 assert.deepEqual([data.spells[0].attack_bonus_override,data.spells[0].save_dc_override],[7,26]);
 data=mergeSheetData(data,{action:'entry',collection:'spells',mode:'update',index:0,fields:{attack_bonus_override:'',save_dc_override:''}});
 assert.equal(data.spells[0].attack_bonus_override,'');assert.equal(data.spells[0].save_dc_override,'');
 assert.throws(()=>mergeSheetData(data,{action:'entry',collection:'spells',mode:'update',index:0,fields:{save_dc_override:0}}),/Save DC/);
});
test('weapons preserve special on-hit save metadata without treating it as auto weapon damage reduction',()=>{
 const data=mergeSheetData(char,{action:'entry',collection:'weapons',mode:'add',
  fields:{name:'Poison Dagger',save_type:'fort',save_success:'manual',save_dc_override:16,saving_throw:'Fortitude negates poison rider'}});
 assert.equal(data.weapons[0].save_type,'fort');assert.equal(data.weapons[0].save_dc_override,16);
 assert.equal(data.weapons[0].save_success,'manual');
});
