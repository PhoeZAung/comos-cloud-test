import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveSavingThrow,saveTypes,saveOutcomes} from '../src/features/sheet/save-rules.mjs';
import {computeCombatEffect} from '../src/owlbear/combat-effects.mjs';
import {resolveDefenses} from '../src/features/sheet/pathfinder-defenses.mjs';
import {spellRoll,abilityRoll} from '../backend/characters/rolls.mjs';

const effect={kind:'damage',hit:true,amount:21,reason:'Hit'};
const receipt=(rule={})=>({kind:'spell',dc:17,resolution:{abilityKind:'spell',srApplies:false,saveType:'ref',saveSuccess:'half',...rule},
 damage:{total:21,breakdown:[{type:'fire',total:21}]}});
const defenses=(roll,target,saveDie)=>resolveDefenses(roll,
 computeCombatEffect(roll,{ac:12}),target,{saveRoll:saveDie,saves:target.saves});

test('structured save types stay limited to Fortitude, Reflex, Will and safe success results',()=>{
 assert.deepEqual(Object.keys(saveTypes),['none','fort','ref','will']);
 assert.deepEqual(Object.keys(saveOutcomes),['manual','negates','half','alternate']);
});
test('Reflex half uses target bonus and floors, then energy resistance uses reduced damage',()=>{
 const target={energyResistances:'fire 3',saves:{ref:5}};
 const hit=defenses(receipt(),target,12);
 assert.equal(hit.amount,7);
 const saved=hit.mitigation.find(x=>x.type==='save');
 assert.deepEqual([saved.save,saved.roll,saved.bonus,saved.dc,saved.total,saved.passed],
  ['ref',12,5,17,17,true]);
 assert.equal(hit.mitigation.find(x=>x.type==='energy').before,10);
 const failed=defenses(receipt(),target,10);
 assert.equal(failed.amount,18,'a failed Reflex save gets full 21 minus resistance 3');
});
test('successful Fortitude save uses alternate Slay Living damage, not simple half',()=>{
 const spell=receipt({saveType:'fort',saveSuccess:'alternate'});
 spell.dc=18;spell.damage={total:39,breakdown:[{type:'',total:39}]};
 spell.saveSuccessDamage={total:11,breakdown:[{type:'',total:11}]};
 const target={saves:{fort:8},dr:9};
 const saved=defenses(spell,target,10);
 assert.equal(saved.amount,11);
 assert.equal(saved.saveDamageUsed,true);
 assert.equal(saved.mitigation.find(x=>x.type==='save').outcome,'alternate');
 const failed=defenses(spell,target,1);
 assert.equal(failed.amount,39);
});
test('Will negates, natural 1 always fails and natural 20 always succeeds',()=>{
 const spell=receipt({saveType:'will',saveSuccess:'negates'});
 const target={saves:{will:22}};
 assert.equal(defenses(spell,target,1).amount,21);
 spell.dc=70;target.saves.will=-5;
 const natural20=defenses(spell,target,20);
 assert.equal(natural20.amount,0);assert.equal(natural20.reason,'Save negated');
 assert.equal(natural20.mitigation.find(x=>x.type==='save').passed,true);
});
test('special partial saves and missing DC or NPC bonus block automatic HP safely',()=>{
 assert.throws(()=>resolveSavingThrow(receipt({saveSuccess:'manual'}),effect,{bonus:6,die:12}),/GM/);
 assert.throws(()=>resolveSavingThrow(receipt(),effect,{bonus:undefined,die:12}),/save bonus is missing/);
 assert.throws(()=>resolveSavingThrow({...receipt(),dc:null},effect,{bonus:4,die:12}),/Set a valid spell DC/);
 assert.throws(()=>resolveSavingThrow({...receipt({saveType:'none'}),resolution:{
  saveType:'none',saveDescription:'Fortitude partial'}},effect),/describes a save/);
});
test('a resisted spell never rolls a saving throw',()=>{
 const target={sr:30,saves:{ref:5}};let rolled=false;
 const spell=receipt({abilityKind:'spell',srApplies:true,casterLevel:5});
 const result=resolveDefenses(spell,computeCombatEffect(spell,{ac:12}),target,
  {srRoll:1,saveRoll:()=>{rolled=true;return 20;},saves:target.saves});
 assert.equal(result.reason,'Spell resisted');assert.equal(rolled,false);
});
test('the existing Slay Living spell roll supports two verified damage formulas',()=>{
 const source={int:18,character_level:9,spell_dc_base:'int',castingProfiles:[{className:'Cleric',casterLevel:9,ability:'wis'}],wis:18,
  hp_curr:20,hp_max:30};
 const row={name:'Slay Living',lvl:5,sourceClass:'Cleric',attack_type:'touch',
  damage:'12d6 + {CL}',save_type:'fort',save_success:'alternate',
  save_success_damage:'3d6 + {CL}',effect_type:'damage',mp_cost:0};
 const rolled=[];
 const roll=expression=>{rolled.push(expression);return {expression,rolls:[11],total:expression.includes('3d6')?19:expression.includes('12d6')?40:11,bonus:0,breakdown:[]}};
 const result=spellRoll(row,source,roll);
 assert.equal(result.saveSuccessDamage.total,19);
 assert.equal(result.damage.total,40);
 assert.ok(rolled.some(x=>x.includes('3d6')));
});
