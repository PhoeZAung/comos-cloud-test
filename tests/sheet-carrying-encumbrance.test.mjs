import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {strengthCapacity,carryingCapacity,carriedWeight,isCarried,reducedSpeed,SIZE_CAPACITY} from '../src/features/sheet/carrying.mjs';
import {sheetStats,skillTotal} from '../src/features/sheet/model.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderSection,renderSpeedDetails} from '../src/features/sheet/view.mjs';

const item=(weight,amount=1,additional={})=>({name:'Gear',sourceCategory:'Gear',weight,amount,...additional});
const base={str:8,dex:22,size_category:'Medium',speed:30};

test('official Pathfinder carrying table has correct normalization and higher-Strength growth',()=>{
 assert.deepEqual(strengthCapacity(1),{light:3,medium:6,heavy:10});
 assert.deepEqual(strengthCapacity(4),{light:13,medium:26,heavy:40});
 assert.deepEqual(strengthCapacity(8),{light:26,medium:53,heavy:80});
 assert.deepEqual(strengthCapacity(15),{light:66,medium:133,heavy:200});
 assert.deepEqual(strengthCapacity(29),{light:466,medium:933,heavy:1400});
 assert.deepEqual(strengthCapacity(30),{light:532,medium:1064,heavy:1600});
 assert.deepEqual(strengthCapacity(39),{light:1864,medium:3732,heavy:5600});
 assert.deepEqual(strengthCapacity(40),{light:2128,medium:4256,heavy:6400});
 assert.deepEqual(strengthCapacity(0),{light:0,medium:0,heavy:0});
 assert.equal(Object.keys(SIZE_CAPACITY).length,9);
});

test('STR 8, Medium biped meets 26/27/54/80lb acceptance thresholds',()=>{
 const at=weight=>carryingCapacity({...base,items:[item(weight)]});
 assert.equal(at(26).load,'light');
 assert.equal(at(26).mediumMax,53);
 assert.equal(at(27).load,'medium');
 assert.equal(at(27).effectiveSpeed,20);
 assert.equal(at(27).maxDex,3);
 assert.equal(at(27).checkPenalty,-3);
 assert.equal(at(27).runMultiplier,4);
 assert.equal(at(53).load,'medium');
 assert.equal(at(54).load,'heavy');
 assert.equal(at(54).maxDex,1);
 assert.equal(at(54).checkPenalty,-6);
 assert.equal(at(54).runMultiplier,3);
 assert.equal(at(80).load,'heavy');
 assert.equal(at(81).load,'over');
 assert.equal(at(81).effectiveSpeed,5);
 assert.equal(at(161).effectiveSpeed,0);
 assert.equal(at(54).liftGround,160);
 assert.equal(at(54).pushDrag,400);
});

test('size and quadruped multipliers use scaled maximums for fractional lbs',()=>{
 const small={...base,size_category:'Small'};
 const at=weight=>carryingCapacity({...small,items:[item(weight)]});
 assert.equal(at(19.5).lightMax,19.5);
 assert.equal(at(19.5).load,'light');
 assert.equal(at(19.51).load,'medium');
 assert.equal(at(39.75).mediumMax,39.75);
 assert.equal(at(39.75).load,'medium');
 assert.equal(at(39.76).load,'heavy');
 assert.equal(at(60).maximum,60);
 assert.equal(at(60.1).load,'over');
 const quad=carryingCapacity({...base,capacity_body_type:'quadruped'});
 assert.equal(quad.lightMax,39);
 assert.equal(quad.mediumMax,79.5);
 assert.equal(quad.maximum,120);
 assert.equal(carryingCapacity({...base,size_category:'Huge',capacity_body_type:'quadruped'}).maximum,480);
});

test('signed flat capacity modifier expands and contracts all load brackets proportionally',()=>{
 const bigger=carryingCapacity({...base,capacity_modifier:40});
 assert.equal(bigger.maximum,120);
 assert.equal(bigger.lightMax,39);
 assert.equal(bigger.mediumMax,79.5);
 const smaller=carryingCapacity({...base,capacity_modifier:-40});
 assert.equal(smaller.maximum,40);
 assert.equal(smaller.lightMax,13);
 assert.equal(smaller.mediumMax,26.5);
 assert.equal(carryingCapacity({...base,capacity_modifier:-999}).maximum,0);
});

test('weights multiply quantity for items and weapons without recounting equipment slots',()=>{
 const hero={...base,items:[
  item('1.5 lb',4),item('2',3,{carried:false}),item(5,1,{carried:false,equipped:true,equip_slot:'chest'}),
  item('0.5',0),item('???',3),item(2,1,{carried:false})
 ],weapons:[{name:'Gun',weight:3,amount:2},{name:'Bow',weight:4,amount:1,carried:false}]};
 const {total,lineItems}=carriedWeight(hero);
 assert.equal(total,17);
 assert.equal(lineItems.length,3);
 assert.equal(isCarried(hero.items[2]),true);
 assert.equal(isCarried(hero.items[1]),false);
 const updated=mergeSheetData(hero,{action:'entry',collection:'items',mode:'update',index:1,fields:{carried:true}});
 assert.equal(carriedWeight(updated).total,23);
 const unequipped=mergeSheetData(hero,{action:'equip',collection:'items',slot:'chest',index:null});
 assert.equal(carriedWeight(unequipped).total,12);
});

test('speed reduction uses descending official breakpoints and does not double-reduce armor',()=>{
 const expected=new Map([[5,5],[15,10],[20,15],[30,20],[35,25],[45,30],[50,35],[60,40],[75,50],[90,60],[105,70],[120,80]]);
 for(const [speed,result] of expected)assert.equal(reducedSpeed(speed),result,'speed '+speed);
 const armored={...base,items:[{name:'Armor',sourceCategory:'Armor',type:'Medium Armor',weight:10,equipped:true,equip_slot:'chest',maxDex:'2',checkPenalty:'-5'}]};
 const light=carryingCapacity(armored);
 assert.equal(light.load,'light');
 assert.equal(light.armorCategory,'medium');
 assert.equal(light.effectiveSpeed,20);
 assert.equal(light.checkPenalty,-5);
 assert.equal(light.maxDex,2);
 const medium=carryingCapacity({...armored,items:[...armored.items,item(20)]});
 assert.equal(medium.load,'medium');
 assert.equal(medium.effectiveSpeed,20); // not reduced a second time
 assert.equal(medium.checkPenalty,-5); // worse between -5 worn and -3 load
 assert.equal(medium.maxDex,2); // worse between +2 worn and +3 load
 const heavy=carryingCapacity({...armored,items:[...armored.items,item(50)]});
 assert.equal(heavy.load,'heavy');
 assert.equal(heavy.checkPenalty,-6);
 assert.equal(heavy.maxDex,1);
 assert.equal(heavy.effectiveSpeed,20);
});

test('encumbrance modifies AC and STR/DEX skills without changing base DEX, reflex, initiative or speed',()=>{
 const data={...base,items:[item(54)]};
 const before={...data,items:[]},s=sheetStats(data);
 assert.equal(s.mods.dex,6);
 assert.equal(s.dexAcModifier,1);
 assert.equal(s.ac,11);
 assert.equal(s.touch,11);
 assert.equal(s.initiative,6);
 assert.equal(s.ref,6);
 assert.equal(s.speed,20);
 assert.equal(s.baseSpeed,30);
 assert.equal(data.dex,22);
 assert.equal(data.speed,30);
 assert.equal(skillTotal({name:'Acrobatics',stat:'dex',lvl:2,temp:0},data),2);
 assert.equal(skillTotal({name:'Acrobatics',stat:'dex',lvl:2,temp:0},before),8);
 assert.equal(skillTotal({name:'Knowledge',stat:'int',lvl:2,temp:0},data),2); // absent INT has no configured modifier
 const stored=mergeSheetData(data,{action:'fields',fields:{capacity_modifier:10,capacity_body_type:'quadruped'}});
 assert.equal(stored.speed,30);
 assert.equal(stored.dex,22);
 assert.equal(stored.capacity_body_type,'quadruped');
 assert.equal(stored.capacity_modifier,10);
 assert.equal(stored.slot_cap,undefined);
 assert.equal(stored.items[0].weight,54);
 assert.equal(sheetStats(stored).encumbrance.maximum,130);
});

test('carried flag and weapon weight edits persist and change derived total',()=>{
 const start={...base,items:[item(5)],weapons:[{name:'Axe',damage:'1d8'}]};
 const withWeapon=mergeSheetData(start,{action:'entry',collection:'weapons',mode:'update',index:0,fields:{weight:8,amount:2,carried:true}});
 assert.equal(carriedWeight(withWeapon).total,21);
 const leave=mergeSheetData(withWeapon,{action:'entry',collection:'weapons',mode:'update',index:0,fields:{carried:false}});
 assert.equal(carriedWeight(leave).total,5);
 const stop=mergeSheetData(leave,{action:'entry',collection:'items',mode:'update',index:0,fields:{carried:false}});
 assert.equal(carriedWeight(stop).total,0);
 assert.throws(()=>mergeSheetData(start,{action:'fields',fields:{capacity_modifier:1e7}}),/Capacity modifier/);
 assert.throws(()=>mergeSheetData(start,{action:'fields',fields:{capacity_body_type:'centaur'}}),/Invalid sheet field/);
});

test('minimal capacity UI exposes threshold hover, warnings, info and editor; no old slot capacity control',async()=>{
 const hero={id:'x',name:'Hero',data:{...base,items:[item(54)]}};
 const inventory=renderSection(hero,'items'),overview=renderSection(hero,'overview');
 assert.match(inventory,/data-edit-stats="capacity"/);
 assert.match(inventory,/cs-capacity-meter/);
 assert.match(inventory,/data-load="heavy"/);
 assert.match(inventory,/54.*80.*lb/);
 assert.match(inventory,/Light.*Medium.*Heavy/);
 assert.match(inventory,/Over that is overloaded|overloaded|Heavy/);
 assert.doesNotMatch(inventory,/data-inline-currency="slot_cap"/);
 assert.match(overview,/cs-score-encumbered/);
 assert.match(overview,/data-roll="DEX check" data-bonus="6"/);
 assert.match(overview,/<strong>22<\/strong><small>\+1<\/small>/);
 assert.match(overview,/cs-score-load-info/);
 const speed=renderSpeedDetails(hero.data);
 assert.match(speed,/Land \(base 30 ft\)/);
 const ui=await readFile(new URL('../src/ui/sheet.mjs',import.meta.url),'utf8');
 assert.match(ui,/capacity:\['capacity_modifier','capacity_body_type'\]/);
 assert.match(ui,/name="carried"/);
 assert.match(ui,/name="capacity_body_type"/);
 assert.match(ui,/<legend>Carried weight<\/legend>/);
 const css=await readFile(new URL('../src/styles/sheet-refinements.css',import.meta.url),'utf8');
 assert.match(css,/\.cs-score-encumbered/);
 assert.match(css,/\.cs-capacity-meter/);
});
