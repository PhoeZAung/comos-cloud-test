import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {weaponAttackParts} from '../src/features/sheet/model.mjs';
import {weaponDamageFormulas} from '../src/features/sheet/calculations.mjs';

const stats={str:18,dex:14,bab:3,ar_melee_temp:1,ar_ranged_temp:2};
test('changing Attack Type automatically picks correct attack ability while manual override remains available',()=>{
 const row={name:'Test',ability_mod:'auto',damage:'1d8',damage_ability:'auto',damage_style:'standard'};
 assert.equal(weaponAttackParts({...row,attack_type:'melee'},stats).ability,'str');
 assert.equal(weaponAttackParts({...row,attack_type:'ranged'},stats).ability,'dex');
 assert.equal(weaponAttackParts({...row,attack_type:'touch'},stats).ability,'str');
 assert.equal(weaponAttackParts({...row,attack_type:'ranged_touch'},stats).ability,'dex');
 assert.equal(weaponAttackParts({...row,attack_type:'ranged',ability_mod:'str'},stats).ability,'str');
});

test('damage ability follows attack type and weapon style independently of attack modifier',()=>{
 const base={damage:'1d8',damage_ability:'auto',damage_style:'standard',ability_mod:'auto'};
 const formula=row=>weaponDamageFormulas(row,stats).normal;
 assert.equal(formula({...base,attack_type:'melee'}),'1d8 + 4');
 assert.equal(formula({...base,attack_type:'ranged'}),'1d8');
 assert.equal(formula({...base,attack_type:'ranged_touch'}),'1d8');
 assert.equal(formula({...base,attack_type:'ranged',damage_style:'thrown'}),'1d8 + 4');
 assert.equal(formula({...base,attack_type:'melee',damage_style:'two_handed'}),'1d8 + 6');
 assert.equal(formula({...base,attack_type:'melee',damage_style:'off_hand'}),'1d8 + 2');
 assert.equal(formula({...base,attack_type:'melee',ability_mod:'dex'}),'1d8 + 4','finesse changes attack, not damage');
 assert.equal(formula({...base,attack_type:'ranged',damage_ability:'dex'}),'1d8 + 2');
 assert.equal(formula({...base,attack_type:'melee',damage:'1d8+4',damage_ability:'none'}),'1d8+4','legacy formulas must not double-count');
});

test('weapon edit form shows live Attack and Damage modifier previews for automatic and overridden modes',async()=>{
 const source=await readFile('src/ui/sheet.mjs','utf8');
 assert.match(source,/function updateWeaponEditorPreview\(\)/);
 assert.match(source,/data-weapon-attack-preview/);
 assert.match(source,/data-weapon-damage-preview/);
 assert.match(source,/weaponAttackParts\(row,character\.data\)/);
 assert.match(source,/weaponDamageFormulas\(\{\.\.\.row,damage:'1d4',extra_damage:''\},character\.data\)/);
 assert.match(source,/event\.target\.closest\('\.cs-weapon-editor'\)/);
 assert.match(source,/attack_type\],\[name=ability_mod\],\[name=damage_ability\],\[name=damage_style\]/);
 assert.match(source,/values\.damage_ability=row\.damage_ability\?\?\(index===null\?weaponDefaultAbilities\(values\.attack_type,character\.data\)\.damage:'none'\)/,'new weapons show STR/None by attack type, while legacy formulas remain Formula only');
 assert.match(source,/values\.crit_range=row\.crit_range\|\|'20'/);
 assert.match(source,/values\.crit_mult=row\.crit_mult\|\|'x2'/);
 assert.match(source,/event\.target\.dataset\.userOverride='true'/);
 assert.match(source,/event\.target\.name==='attack_type'/);
});
