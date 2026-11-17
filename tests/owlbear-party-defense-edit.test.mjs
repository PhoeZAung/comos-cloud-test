import test from 'node:test';
import assert from 'node:assert/strict';
import {partyDefenseAdjustments} from '../backend/characters/defense-adjustments.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
test('GM/owner AC editor preserves base armor and other sheet stats',()=>{
 const data={str:14,dex:16,bab:3,ac_armor:5,ac_natural:1,ac_deflect:2,ac_temp:1,touch_temp:2,flat_temp:0,cmd_temp:2};
 const copy=structuredClone(data),desired={ac:26,touch:19,flat:20,cmd:27};
 const fields=partyDefenseAdjustments(data,desired),after={...data,...fields};
 assert.deepEqual(data,copy,'original character is unchanged until a revision-checked save');
 for(const [key,value] of Object.entries(desired))assert.equal(sheetStats(after)[key],value,key);
 assert.deepEqual(Object.keys(fields).sort(),['ac_temp','cmd_temp','flat_temp','touch_temp']);
 for(const key of ['str','dex','bab','ac_armor','ac_natural','ac_deflect'])assert.equal(after[key],data[key]);
});
test('AC editing is available with imported flat totals but keeps independent adjustments',()=>{
 const data={ac_total:16,touch_ac_total:11,flat_ac_total:14,cmd_total:20};
 const fields=partyDefenseAdjustments(data,{ac:17,touch:12,flat:15,cmd:22});
 const updated=sheetStats({...data,...fields});
 assert.deepEqual([updated.ac,updated.touch,updated.flat,updated.cmd],[17,12,15,22]);
});
test('invalid defense totals are rejected before any changes are saved',()=>{
 for(const value of [NaN,Infinity,1.5,10000000,-10000000])assert.throws(()=>partyDefenseAdjustments({}, {ac:value}),/whole numbers|supported range/);
});
