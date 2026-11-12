import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {weaponDefaultAbilities,weaponAttackParts,sheetStats} from '../src/features/sheet/model.mjs';
import {weaponDamageFormulas} from '../src/features/sheet/calculations.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {weaponRoll,criticalProfile} from '../backend/characters/rolls.mjs';
import {externalRollSource} from '../backend/characters/external-rolls.mjs';

const stats={str:18,dex:14,bab:5,ar_melee_temp:1,ar_ranged_temp:1};
test('new weapons default to STR/STR for melee, DEX/None for ranged, with saved global attack overrides respected',()=>{
 assert.deepEqual(weaponDefaultAbilities('melee',stats),{attack:'str',damage:'str'});
 assert.deepEqual(weaponDefaultAbilities('touch',stats),{attack:'str',damage:'str'});
 assert.deepEqual(weaponDefaultAbilities('ranged',stats),{attack:'dex',damage:'none'});
 assert.deepEqual(weaponDefaultAbilities('ranged_touch',stats),{attack:'dex',damage:'none'});
 assert.deepEqual(weaponDefaultAbilities('ranged',{...stats,ar_ranged_ability:'wis'}),{attack:'wis',damage:'none'});
});

test('None attack strips ability modifier without removing BAB, size or misc',()=>{
 const normal=weaponAttackParts({attack_type:'melee',ability_mod:'str',attack_misc:2},stats);
 const none=weaponAttackParts({attack_type:'melee',ability_mod:'none',attack_misc:2},stats);
 assert.equal(none.ability,'none');
 assert.equal(none.total,normal.total-sheetStats(stats).mods.str);
 const ranged=weaponAttackParts({attack_type:'ranged',ability_mod:'none'},stats);
 assert.equal(ranged.total,weaponAttackParts({attack_type:'ranged',ability_mod:'dex'},stats).total-sheetStats(stats).mods.dex);
 assert.equal(weaponDamageFormulas({attack_type:'melee',damage:'1d8',damage_ability:'none'},stats).normal,'1d8');
 assert.equal(weaponDamageFormulas({attack_type:'melee',damage:'1d8',damage_ability:'str'},stats).normal,'1d8 + 4');
});

test('None ability is accepted by server, while invalid abilities remain rejected',()=>{
 const change=ability_mod=>({action:'entry',collection:'weapons',mode:'add',fields:{name:'Test sword',attack_type:'melee',ability_mod,damage:'1d8',damage_ability:'none',crit_range:'20',crit_mult:'x2'}});
 const saved=mergeSheetData({...stats,weapons:[]},change('none'));
 assert.equal(saved.weapons[0].ability_mod,'none');
 assert.equal(saved.weapons[0].crit_range,'20');
 assert.equal(saved.weapons[0].crit_mult,'x2');
 assert.throws(()=>mergeSheetData({...stats,weapons:[]},change('invalid')),/Invalid entry field/);
});

test('default 20/x2 rolls are critical threats requiring normal Pathfinder confirmation',()=>{
 assert.deepEqual(criticalProfile({}),{minimum:20,multiplier:2});
 let next=0;
 const faces=[[20],[3],[16],[2,4]];
 const dice=expression=>externalRollSource([{expression,faces:faces[next++]}]).roll(expression);
 const result=weaponRoll({name:'Sword',attack_type:'melee',ability_mod:'str',damage:'1d6',damage_ability:'str'},stats,dice);
 assert.equal(result.critical.threat,true);
 assert.equal(result.critical.minimum,20);
 assert.equal(result.critical.multiplier,2);
 assert.ok(result.critical.confirmation);
 assert.equal(result.damage.total,7);
 assert.equal(result.critical.damage.total,14);
});

test('Owlbear sheet buttons use the parent-host bridge, not a second unconnected popup',async()=>{
 const script=await readFile('src/owlbear/sheet.mjs','utf8');
 assert.match(script,/cosmos:add-sheet/);
 assert.match(script,/cosmos:popout-sheet/);
 assert.match(script,/event\.stopImmediatePropagation\(\)/);
 const host=await readFile('src/owlbear/action.mjs','utf8');
 assert.match(host,/activeCharacterId===fromFrame\.id\)openPicker\(\)/);
 assert.match(host,/activeCharacterId===fromFrame\.id\)openSheetWindow\(fromFrame\.id\)/);
 const build=await readFile('scripts/build-owlbear.mjs','utf8');
 assert.doesNotMatch(build,/<button data-back/);
 assert.doesNotMatch(build,/data-open-sheet-tab hidden/);
});
