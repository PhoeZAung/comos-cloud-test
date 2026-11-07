import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {carryingCapacity,equippedArmor,armorSpeedLimit} from '../src/features/sheet/carrying.mjs';
import {sheetStats,skillTotal,weaponAttack} from '../src/features/sheet/model.mjs';
import {inventoryEditorFields} from '../src/features/sheet/inventory-fields.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderSection,renderSpeedDetails,renderCombatDetails} from '../src/features/sheet/view.mjs';

const base={str:16,dex:22,speed:30,size_category:'Medium',ref_base:0};
const armor=(extra={})=>({name:'Scale mail',sourceCategory:'Armor',type:'Medium Armor',acBonus:'+4',maxDex:'+3',checkPenalty:'-2',speed:'20 ft. / 15 ft.',weight:10,amount:1,equip_slot:'body',equipped:true,...extra});
const shield=(extra={})=>({name:'Heavy Shield',sourceCategory:'Armor',type:'Shield',acBonus:'+2',maxDex:'—',checkPenalty:'-1',speed:'—',weight:3,amount:1,equip_slot:'hands',equipped:true,...extra});

test('equipped armor and shield add separate AC bonuses while touch AC excludes them',()=>{
 const hero={...base,items:[armor(),shield()]};
 const c=carryingCapacity(hero),stats=sheetStats(hero);
 assert.equal(c.weight,13);
 assert.equal(c.load,'light');
 assert.equal(c.armor.acBonus,6);
 assert.equal(c.armor.bodyBonus,4);
 assert.equal(c.armor.shieldBonus,2);
 assert.equal(c.armorBonus,6);
 assert.equal(c.maxDex,3);
 assert.equal(c.checkPenalty,-3); // armor -2 and shield -1
 assert.equal(stats.mods.dex,6);
 assert.equal(stats.dexAcModifier,3);
 assert.equal(stats.ac,19);  // 10 + capped DEX 3 + armor 4 + shield 2
 assert.equal(stats.touch,13); // 10 + capped DEX 3
 assert.equal(stats.flat,16); // 10 + armor 4 + shield 2
 assert.equal(sheetStats({...hero,ac_armor:6}).ac,19); // manual legacy AC is not double-counted with worn gear
 assert.equal(sheetStats({...base,ac_armor:6,items:[]}).ac,22); // manual value remains fallback without equipped armor
 assert.equal(stats.ref,6); // capped DEX does NOT affect Reflex
 assert.equal(stats.cmd,19); // nor CMD
 assert.equal(stats.speed,20);
 assert.equal(c.armorSpeed,20);
 assert.deepEqual(c.speedCapReasons,['armor']);
 assert.equal(skillTotal({name:'Acrobatics',stat:'dex',lvl:0,temp:0},hero),3); // +6 DEX, -3 ACP
 assert.equal(weaponAttack({attack_type:'ranged',attack_misc:0},hero),6); // DEX attack uses +6
});

test('two worn armor entries do not stack same-type AC; choose smallest max-Dex limit',()=>{
 const stronger=armor({name:'Second armor',acBonus:'+7',maxDex:'1',checkPenalty:'-5',equip_slot:'chest'});
 const c=carryingCapacity({...base,items:[armor(),stronger,shield()]});
 assert.equal(c.armor.bodyBonus,7);
 assert.equal(c.armor.shieldBonus,2);
 assert.equal(c.armorBonus,9); // only best of two armor bonuses
 assert.equal(c.maxDex,1); // smallest max among equipped items
 assert.equal(c.checkPenalty,-6); // worse armor ACP -5 plus shield ACP -1
 assert.equal(sheetStats({...base,items:[armor(),stronger,shield()]}).ac,20);
 assert.equal(c.armor.worn,3);
});

test('armor and medium/heavy encumbrance use strictest cap and penalty without double slowing',()=>{
 const medium={...base,items:[armor(),shield(),{name:'Backpack',sourceCategory:'Gear',weight:90,amount:1}]};
 const m=carryingCapacity(medium),ms=sheetStats(medium);
 assert.equal(m.weight,103);
 assert.equal(m.load,'medium');
 assert.equal(m.maxDex,3); // min armor 3, medium load 3
 assert.equal(m.checkPenalty,-3);
 assert.equal(m.baseSpeed,30);
 assert.equal(m.effectiveSpeed,20);
 assert.deepEqual(m.speedCapReasons,['armor','load']);
 assert.equal(ms.ac,19);
 const heavy={...base,items:[armor(),shield(),{name:'Pack',sourceCategory:'Gear',weight:160,amount:1}]};
 const c=carryingCapacity(heavy),stats=sheetStats(heavy);
 assert.equal(c.load,'heavy');
 assert.equal(c.maxDex,1);
 assert.equal(c.checkPenalty,-6);
 assert.equal(c.effectiveSpeed,20);
 assert.equal(stats.ac,17); // 10 + DEX capped 1 + armor 4 + shield 2
 assert.equal(stats.mods.dex,6); // raw DEX and ordinary roll remain +6
 assert.equal(stats.ref,6);
 assert.equal(weaponAttack({attack_type:'ranged'},heavy),6);
});

test('legacy equipped armor applies imported stats, while shields leave DEX and speed alone',()=>{
 const hero={...base,race:'Tarutaru',speed:30,items:[armor({equip_slot:'',acBonus:undefined,maxDex:undefined,checkPenalty:undefined,attrs:[{name:'Armor/Shield Bonus',val:'+5'},{name:'Maximum Dex Bonus',val:'+2'},{name:'Armor Check Penalty',val:'−4'}]}),shield({maxDex:0,speed:'5 ft.'})]};
 const stats=sheetStats(hero);
 assert.equal(stats.baseSpeed,20);
 assert.equal(stats.speed,15);
 assert.equal(stats.armorBonus,7);
 assert.equal(stats.dexAcModifier,2);
 assert.equal(stats.encumbrance.checkPenalty,-5);
 assert.equal(skillTotal({stat:'DEX',lvl:1},hero),2);
 assert.match(renderSection({data:hero},'overview'),/data-roll="DEX check" data-bonus="6"/);
});

test('racial speed restores standard legacy sheets and respects compiled alternate movement',()=>{
 const normal={...base,race:'Hume',size_category:'Small',speed:15,items:[armor({speed:'30 ft. / 20 ft.'})]};
 assert.equal(sheetStats(normal).speed,30);
 assert.equal(sheetStats({...normal,race:'Moomba'}).speed,40);
 assert.equal(armorSpeedLimit(armor(),40,'medium'),30);
 assert.equal(armorSpeedLimit(armor({speed:'20 ft.2 / 15 ft.2'}),20,'medium'),15);
 const alternate={...normal,race:'Seto Lion',speed:30,rulesBuild:{lastValues:{speed:60}},speed_mod:5,items:[armor()]};
 assert.equal(sheetStats(alternate).baseSpeed,60);
 assert.equal(sheetStats(alternate).speed,45);
 assert.equal(sheetStats({...normal,race:'Custom',speed:25,items:[]}).baseSpeed,25);
 assert.equal(sheetStats({...normal,race:'Moomba',speed:35,alternateRacialTraits:[{name:'Custom movement'}],items:[]}).baseSpeed,35);
});

test('racial slowdown exemption still respects overload and ordinary checks retain their modifier',()=>{
 const hero={...base,race:'Dwarf',str:10,ac_dodge:2,speed_mod:10,items:[armor(),{weight:80}]};
 assert.equal(sheetStats(hero).speed,30);
 const overloaded={...hero,items:[armor(),{weight:110}]};
 const stats=sheetStats(overloaded);
 assert.equal(stats.encumbrance.runMultiplier,0);
 assert.equal(stats.dexAcModifier,0);
 assert.equal(stats.dodgeAcBonus,0);
 assert.equal(stats.speed,5);
 assert.equal(stats.mods.dex,6);
 assert.equal(sheetStats({...overloaded,items:[{weight:201}]}).speed,0);
 assert.match(renderSpeedDetails(overloaded),/full-round action/);
});

test('armor Speed 30ft / 20ft columns use chosen base speed, not race size alone',()=>{
 const mail=armor();
 assert.equal(armorSpeedLimit(mail,30,'medium'),20);
 assert.equal(armorSpeedLimit(mail,20,'medium'),15);
 assert.equal(armorSpeedLimit({...mail,speed:'30 ft./20 ft.'},30,'medium'),30);
 assert.equal(armorSpeedLimit({...mail,speed:'30 ft./20 ft.'},20,'medium'),20);
 const small=carryingCapacity({...base,size_category:'Small',speed:20,items:[mail]});
 assert.equal(small.armorSpeed,15);
 assert.equal(small.effectiveSpeed,15);
 const mediumSlow=carryingCapacity({...base,size_category:'Medium',speed:20,items:[mail]});
 assert.equal(mediumSlow.effectiveSpeed,15);
 const smallFast=carryingCapacity({...base,size_category:'Small',speed:30,items:[mail]});
 assert.equal(smallFast.effectiveSpeed,20);
 assert.equal(carryingCapacity({str:16,size_category:'Small',items:[mail]}).baseSpeed,20);
 assert.equal(carryingCapacity({str:16,size_category:'Medium',items:[mail]}).baseSpeed,30);
 const imported={name:'Field plate',sourceCategory:'Armor',type:'Heavy Armor',acBonus:8,equipped:true,equip_slot:'chest',sourceCatalog:{raw:{'Speed (30 ft.)':'20 ft.','Speed (20 ft.)':'15 ft.','Armor Bonus':8,'Max Dex':1}}};
 assert.equal(armorSpeedLimit(imported,30,'heavy'),20);
 assert.equal(armorSpeedLimit(imported,20,'heavy'),15);
 const fromCatalog=carryingCapacity({...base,items:[imported]});
 assert.equal(fromCatalog.armorBonus,8);
 assert.equal(fromCatalog.maxDex,1);
 assert.equal(fromCatalog.armorSpeed,20);
});

test('Speed Mod is added AFTER armor or load restrictions and never changes saved base speed',()=>{
 const hero={...base,speed_mod:15,items:[armor()]};
 const c=carryingCapacity(hero);
 assert.equal(c.baseSpeed,30);
 assert.equal(c.constrainedSpeed,20);
 assert.equal(c.speedMod,15);
 assert.equal(c.effectiveSpeed,35);
 const saved=mergeSheetData(hero,{action:'fields',fields:{speed_mod:-7}});
 assert.equal(saved.speed,30);
 assert.throws(()=>mergeSheetData(hero,{action:'fields',fields:{speed:25}}),/Base land speed/);
 assert.equal(saved.speed_mod,-7);
 assert.equal(carryingCapacity(saved).effectiveSpeed,13);
 assert.equal(saved.size_category,'Medium');
 assert.throws(()=>mergeSheetData(hero,{action:'fields',fields:{speed_mod:10001}}),/Speed Mod/);
 assert.throws(()=>mergeSheetData(hero,{action:'fields',fields:{speed_mod:'bad'}}),/valid number/i);
 const unloaded=carryingCapacity({...base,speed_mod:8,items:[]});
 assert.equal(unloaded.effectiveSpeed,38);
 assert.deepEqual(unloaded.speedCapReasons,[]);
});

test('unequipping armor and shield immediately removes derived bonuses and speed caps',()=>{
 const start={...base,items:[armor(),shield()]};
 const unshield=mergeSheetData(start,{action:'equip',slot:'hands',index:null});
 assert.equal(sheetStats(unshield).ac,17);
 const unarmored=mergeSheetData(unshield,{action:'equip',slot:'body',index:null});
 assert.equal(sheetStats(unarmored).ac,16);
 assert.equal(carryingCapacity(unarmored).speedCapReasons.length,0);
 assert.equal(sheetStats(unarmored).speed,30);
 assert.equal(start.items[0].equipped,true);
 assert.equal(start.items[1].equipped,true);
});

test('armor edit presents Armor Bonus without removing imported acBonus schema',()=>{
 const entries=inventoryEditorFields('Armor').extras;
 assert.deepEqual(entries.find(([,key])=>key==='acBonus'),['Armor Bonus','acBonus']);
 const initial={...base,items:[armor({acBonus:'4'})]};
 const revised=mergeSheetData(initial,{action:'entry',collection:'items',mode:'update',index:0,fields:{acBonus:'6',maxDex:'2'}});
 assert.equal(sheetStats(revised).encumbrance.armorBonus,6);
 assert.equal(sheetStats(revised).dexAcModifier,2);
 const hidden=mergeSheetData(revised,{action:'entry',collection:'items',mode:'update',index:0,fields:{carried:false}});
 assert.equal(hidden.items[0].equipped,true);
 assert.equal(hidden.items[0].carried,false);
 assert.equal(sheetStats(hidden).encumbrance.armorBonus,6);
});

test('speed warning and normal DEX roll are visible; capacity icon removed',async()=>{
 const hero={id:'hero',name:'Hero',data:{...base,speed_mod:5,items:[armor()]}};
 const overview=renderSection(hero,'overview'),inventory=renderSection(hero,'items');
 assert.match(overview,/class="cs-speed-capped"/);
 assert.match(overview,/class="cs-speed-cap-info"/);
 assert.match(overview,/Speed restricted by armor/);
 assert.match(overview,/cs-score-encumbered/);
 assert.match(overview,/data-roll="DEX check" data-bonus="6"/);
 assert.match(overview,/<strong>22<\/strong><small>\+6<\/small>/);
 assert.match(overview,/AC \+3/);
 assert.match(inventory,/data-edit-stats="capacity"/);
 assert.doesNotMatch(inventory,/cs-capacity-info/);
 assert.match(renderSpeedDetails(hero.data),/Base land/);
 assert.match(renderSpeedDetails(hero.data),/Speed Mod/);
 assert.match(renderCombatDetails(hero.data,'defense'),/Equipped Armor Bonus:/);
 const ui=await readFile(new URL('../src/ui/sheet.mjs',import.meta.url),'utf8');
 assert.match(ui,/speed_mod:'Speed Mod/);
 const css=await readFile(new URL('../src/styles/sheet-refinements.css',import.meta.url),'utf8');
 assert.match(css,/\.cs-speed-capped/);
});
