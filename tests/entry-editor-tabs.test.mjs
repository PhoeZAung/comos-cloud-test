import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderWeaponEditorTabs,renderAbilityEditorTabs,weaponAmmoStatus} from '../src/features/sheet/entry-editor-tabs.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {entryCalculations} from '../src/features/sheet/calculations.mjs';

const field=key=>'<label><input name="'+key+'"></label>';
const panel=(html,name)=>{
 const start=html.indexOf('data-entry-edit-panel="'+name+'"');
 if(start<0)return '';
 const next=html.indexOf('<section role="tabpanel"',start+1);
 return html.slice(start,next<0?html.length:next);
};
const names=html=>[...html.matchAll(/<input name="([^"]+)"/g)].map(x=>x[1]);

test('weapon tabs separate weapon stats, range, ammunition and saves without duplicate inputs',()=>{
 const keys=['name','sourceCategory','cost','rarity','img','link','ammoType','attack_type','ability_mod','attack_misc','damage','damage_ability','damage_style','extra_damage','crit_range','crit_mult','damage_types','damage_type_other','range','misfire','u_curr','u_max','weight','amount','carried','desc','saving_throw','save_type','save_success','save_dc_override'];
 const html=renderWeaponEditorTabs(keys,field,{category:'Ranged Weapon'});
 assert.equal((html.match(/role="tab"/g)||[]).length,4);
 assert.deepEqual([...html.matchAll(/data-entry-edit-tab="([^"]+)"[^>]*>\s*([^<]+)/g)].map(x=>x[2]),['Basic Info','Weapon Stats','Ammunition','Saves']);
 assert.equal((html.match(/role="tabpanel"/g)||[]).length,4);
 assert.match(html,/data-entry-edit-panel="ammunition"[^>]*hidden/);
 assert.match(panel(html,'details'),/name="name"/);
 assert.match(panel(html,'stats'),/name="damage"/);
 assert.match(panel(html,'details'),/name="sourceCategory"/);
 assert.doesNotMatch(panel(html,'details'),/name="type"/);
 assert.match(panel(html,'details'),/Advanced Settings/);
 assert.match(panel(html,'details'),/name="desc"/);
 assert.match(panel(html,'stats'),/cs-weapon-damage-type-group/);
 for(const key of ['range','misfire'])assert.match(panel(html,'stats'),new RegExp('name="'+key+'"'));
 for(const key of ['ammoType','u_curr','u_max'])assert.match(panel(html,'ammunition'),new RegExp('name="'+key+'"'));
 for(const key of ['saving_throw','save_type','save_success','save_dc_override'])assert.match(panel(html,'saves'),new RegExp('name="'+key+'"'));
 assert.doesNotMatch(panel(html,'details'),/name="range"|name="u_curr"|name="saving_throw"/);
 assert.match(html,/data-ammo-summary/);
 assert.deepEqual(names(html).sort(),keys.sort());
});


test('ammunition has one stats tab with amount, damage types and additive bonuses; melee omits ranged controls',()=>{
 const keys=['sourceCategory','name','amount','cost','rarity','weight','carried','img','link','desc','damage_types','damage_type_other','ammo_ar_bonus','ammo_dmg_bonus'];
 const html=renderWeaponEditorTabs(keys,field,{category:'Ammunition'});
 assert.deepEqual([...html.matchAll(/data-entry-edit-tab="([^"]+)"[^>]*>\s*([^<]+)/g)].map(x=>x[2]),['Basic Info','Ammunition Stats']);
 for(const key of ['amount','damage_types','damage_type_other','ammo_ar_bonus','ammo_dmg_bonus'])assert.match(panel(html,'ammo-stats'),new RegExp('name="'+key+'"'));
 assert.doesNotMatch(panel(html,'ammo-stats'),/name="damage"|name="attack_type"|name="u_curr"/);
 assert.deepEqual(names(html).sort(),keys.sort());
 const melee=renderWeaponEditorTabs(['name','attack_type','damage','range','misfire','ammoType','u_curr','u_max'],field,{category:'Weapon'});
 assert.match(panel(melee,'stats'),/name="damage"/);
 assert.doesNotMatch(panel(melee,'stats'),/name="range"|name="misfire"/);
 assert.match(panel(melee,'ammunition'),/name="u_curr"/);
});

test('NPC weapon fields remain editable in themed tabs without invented ammo values',()=>{
 const keys=['name','attack_type','npcAttackBonus','damage','crit_range','crit_mult','damage_types','dr_bypass','saving_throw','save_type','save_success','save_dc_override','desc'];
 const html=renderWeaponEditorTabs(keys,field,{npc:true});
 assert.match(panel(html,'stats'),/name="npcAttackBonus"/);
 assert.doesNotMatch(html,/data-ammo-summary/);
 assert.deepEqual(names(html).sort(),keys.sort());
});

test('ability tabs group text, combat rules and resources without losing a field',()=>{
 const keys=['name','lvl','school','ability_kind','action_type','range','duration','target','effect_type','attack_type','attack_misc','attack_bonus_override','damage','damage_types','saving_throw','save_type','save_success','save_success_damage','save_dc_override','dc_formula','casting_ability','dc_misc','caster_level','sr_bonus','spell_resist','mp_cost','spell_failure','uses_formula','u_curr','u_max','restoreOnLongRest','desc','effect','at_higher_lvls','link'];
 const html=renderAbilityEditorTabs(keys,field,{collection:'activeAbilities'});
 assert.deepEqual([...html.matchAll(/data-entry-edit-tab="([^"]+)"[^>]*>\s*([^<]+)/g)].map(x=>x[2]),['Details','Combat','Saves','Resources']);
 for(const key of ['name','ability_kind','desc','effect','at_higher_lvls','link'])assert.match(panel(html,'details'),new RegExp('name="'+key+'"'));
 for(const key of ['attack_type','damage','range'])assert.match(panel(html,'combat'),new RegExp('name="'+key+'"'));
 for(const key of ['saving_throw','save_type','save_dc_override','save_success_damage','spell_resist'])assert.match(panel(html,'saves'),new RegExp('name="'+key+'"'));
 assert.match(panel(html,'saves'),/How saves work in Owlbear/);
 for(const key of ['mp_cost','spell_failure','uses_formula','u_curr','u_max','restoreOnLongRest'])assert.match(panel(html,'resources'),new RegExp('name="'+key+'"'));
 assert.deepEqual(names(html).sort(),keys.sort());
 assert.doesNotMatch(html,/Advanced Settings|Sp = spell-like|No spell resistance/);
});

test('ammo status enforces whole nonnegative rounds no higher than max',()=>{
 assert.deepEqual(weaponAmmoStatus('6','8'),{valid:true,current:6,max:8,limited:true,label:'6 / 8'});
 assert.deepEqual(weaponAmmoStatus('',''),{valid:true,current:0,max:0,limited:false,label:'Not tracked'});
 assert.equal(weaponAmmoStatus('9','8').message,'Ammo cannot exceed Max Ammo.');
 assert.equal(weaponAmmoStatus('1.5','8').valid,false);
 assert.equal(weaponAmmoStatus('-1','8').valid,false);
 assert.equal(weaponAmmoStatus('1','-8').valid,false);
 assert.equal(weaponAmmoStatus('1','1.5').valid,false);
});

test('server keeps one ammunition round per weapon use and refuses to spend below zero',()=>{
 const initial={str:12,dex:14,weapons:[{name:'Handgun',attack_type:'ranged',damage:'1d8',u_curr:2,u_max:5}]};
 const row=initial.weapons[0];
 const calc=entryCalculations(row,initial,'weapons');
 assert.equal(calc.currentUses,2);assert.equal(calc.maxUses,5);
 const once=mergeSheetData(initial,{action:'useWeapon',index:0});
 assert.equal(once.weapons[0].u_curr,1);
 assert.equal(entryCalculations(once.weapons[0],once,'weapons').currentUses,1);
 const twice=mergeSheetData(once,{action:'useWeapon',index:0});
 assert.equal(twice.weapons[0].u_curr,0);
 assert.throws(()=>mergeSheetData(twice,{action:'useWeapon',index:0}),/No weapon uses remaining/);
 assert.equal(initial.weapons[0].u_curr,2);
});

test('tabbed editors use the same Save form and minimal descriptions',async()=>{
 const src=await readFile('src/ui/sheet.mjs','utf8');
 assert.match(src,/renderWeaponEditorTabs\(keys,render/);
 assert.match(src,/renderAbilityEditorTabs\(keys,render/);
 assert.match(src,/activateEntryEditorTab/);
 assert.match(src,/noValidate=\['items','weapons','spells'/);
 assert.doesNotMatch(src,/Sp = spell-like \(SR\)/);
 const css=await readFile('src/styles/sheet-refinements.css','utf8');
 assert.match(css,/\.cs-entry-tab-editor \.cs-entry-editor-tabs/);
 assert.match(css,/\.cs-entry-tab-editor \[data-entry-edit-panel\]\[hidden\]/);
});
