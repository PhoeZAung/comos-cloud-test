import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {saveTypes,saveOutcomes} from '../src/features/sheet/save-rules.mjs';
import {readFile} from 'node:fs/promises';

test('existing spell and ability records store structured saves and alternate damage',()=>{
 let data={spells:[],activeAbilities:[]};
 data=mergeSheetData(data,{action:'entry',mode:'add',collection:'spells',
  fields:{name:'Slay Living',effect_type:'damage',damage:'12d6+{CL}',saving_throw:'Fortitude partial',
   save_type:'fort',save_success:'alternate',save_success_damage:'3d6+{CL}'}});
 data=mergeSheetData(data,{action:'entry',mode:'add',collection:'activeAbilities',
  fields:{name:'Dragon Breath',effect_type:'damage',damage:'6d6 fire',
   save_type:'ref',save_success:'half'}});
 assert.deepEqual([data.spells[0].save_type,data.spells[0].save_success,data.spells[0].save_success_damage],
  ['fort','alternate','3d6+{CL}']);
 assert.deepEqual([data.activeAbilities[0].save_type,data.activeAbilities[0].save_success],['ref','half']);
});
test('invalid save types, outcomes and excessive alternate formulas are rejected on the server',()=>{
 const baseline={spells:[{name:'Shock'}]};
 for(const [key,value] of [['save_type','constitution'],['save_success','double'],['save_success_damage','d6'.repeat(200)]]){
  assert.throws(()=>mergeSheetData(baseline,{action:'entry',mode:'update',collection:'spells',index:0,fields:{[key]:value}}));
 }
 assert.deepEqual(Object.keys(saveTypes),['none','fort','ref','will']);
 assert.equal(saveOutcomes.manual,'GM resolves the save effect');
});
test('spell and ability editors expose existing descriptions plus structured save selectors',async()=>{
 const code=await readFile('src/ui/sheet.mjs','utf8');
 assert.match(code,/name="save_type"/);
 assert.match(code,/name="save_success"/);
 assert.match(code,/name="save_success_damage"/);
 assert.match(code,/saving_throw','save_type','save_success','save_success_damage'/);
 assert.match(code,/3d6 \+ \{CL\}/);
});
