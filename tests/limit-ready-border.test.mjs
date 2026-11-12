import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSection} from '../src/features/sheet/view.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
const initial={classes:[{name:'Black Mage',level:1}],hp_max:11,hp_curr:6,hp_temp:99,activeAbilities:[{name:'Mana Wall (Limit Break)',limitBreak:true}]};
const ready=data=>/data-limit-ready="true"/.test(renderSection({data},'abilities'));
test('electric readiness follows the HP gate and shared pool through damage, use, rest and healing',()=>{
 assert.equal(ready(initial),false);
 const hurt=mergeSheetData(initial,{action:'fields',fields:{hp_curr:5}});assert.equal(ready(hurt),true);
 const spent=mergeSheetData(hurt,{action:'useAbility',index:0});assert.equal(ready(spent),false);
 const rested=mergeSheetData(spent,{action:'rest'});assert.equal(ready(rested),false);
 const hurtAgain=mergeSheetData(rested,{action:'fields',fields:{hp_curr:5}});assert.equal(ready(hurtAgain),true);
 assert.equal(ready(mergeSheetData(hurtAgain,{action:'fields',fields:{hp_curr:6}})),false);
 assert.doesNotMatch(renderSection({data:{...hurt,activeAbilities:[]}},'abilities'),/data-limit-ready/);
});
