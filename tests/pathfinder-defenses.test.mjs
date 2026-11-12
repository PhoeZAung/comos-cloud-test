import test from 'node:test';
import assert from 'node:assert/strict';
import {defenseProfile,parseDr,parseSr,bypassesDr,resolveDefenses} from '../src/features/sheet/pathfinder-defenses.mjs';
import {parseNpcStatBlock} from '../src/features/characters/npc-stat-block.mjs';
import {computeCombatEffect} from '../src/owlbear/combat-effects.mjs';
const damage=(kind,total,{parts=null,resolution={}}={})=>({
 kind,damage:{total,...(parts?{breakdown:parts}: {})},effectType:'damage',
 resolution:{abilityKind:kind==='weapon'?'weapon':'spell',srApplies:true,casterLevel:7,srBonus:0,...resolution},
 ...(kind==='weapon'?{rolls:[12],total:25}:{}),
});
const check=(roll,target,extra={})=>resolveDefenses(roll,computeCombatEffect(roll,{ac:16}),target,extra);

test('NPC DR/SR and energies are detected from imported defensive entries',()=>{
 const source=`# Silver Warden
| AC | 22, touch 12, flat-footed 20 |
| HP | 60 |
| DR | 5/silver and good |
| SR | 18 |
| CL | 9 |
| Resist | fire 10, cold 5 |
| Immune | poison |
| Weaknesses | fire |
| Str | 14 |
`;
 const npc=parseNpcStatBlock(source).data;
 assert.equal(npc.npcStats.dr,5);assert.equal(npc.npcStats.sr,18);
 assert.equal(npc.npcStats.casterLevel,9);
 assert.equal(npc.npcText.drBypass,'silver and good');
 assert.equal(npc.npcText.energyResistances,'fire 10, cold 5');
 assert.equal(npc.npcText.immunities,'poison');
 const profile=defenseProfile(npc,{npc:true});
 assert.equal(profile.dr,5);assert.equal(profile.sr,18);
 assert.equal(parseDr('DR 10/cold iron or good').bypass,'cold iron or good');
 assert.equal(parseSr('SR 25'),25);
});
test('DR bypass handles AND, OR and weapon physical damage type',()=>{
 assert.equal(bypassesDr('silver and good',['silver']),false);
 assert.equal(bypassesDr('silver and good',['silver','good']),true);
 assert.equal(bypassesDr('cold iron or good',['good']),true);
 assert.equal(bypassesDr('bludgeoning',['bludgeoning']),true);
 assert.equal(bypassesDr('—',['adamantine']),false);
});
test('physical weapons take DR only once; tagged bypass removes it',()=>{
 const weapon=damage('weapon',14);
 const target={dr:5,drBypass:'magic',sr:22};
 assert.equal(check(weapon,target).amount,9);
 assert.equal(check(weapon,target).mitigation[0].reduced,5);
 const magic=damage('weapon',14,{resolution:{drBypass:['magic']}});
 assert.equal(check(magic,target).amount,14);
});
test('energy resistance and immunity apply to typed damage portions but DR only to physical',()=>{
 const roll=damage('weapon',18,{parts:[{type:'slashing',total:11},{type:'fire',total:7}]});
 const result=check(roll,{dr:5,drBypass:'magic',energyResistances:'fire 3'});
 assert.equal(result.amount,10); // slashing 11-5, fire 7-3
 assert.equal(check(roll,{dr:5,immunities:'fire'}).amount,6);
 const spell=damage('spell',18,{parts:[{type:'bludgeoning',total:11},{type:'cold',total:7}]});
 assert.equal(check(spell,{dr:5,energyResistances:'cold 3'}).amount,10);
 const fire=damage('spell',15,{parts:[{type:'fire',total:15}]});
 assert.equal(check(fire,{dr:50}).amount,15,'DR must not block pure elemental spells');
});
test('SR uses caster level check for spell and Sp, not Su/Ex or exempt spells',()=>{
 const target={sr:18};
 for(const source of ['spell','sp']){
  const roll=damage('ability',12,{resolution:{abilityKind:source,casterLevel:7,srBonus:2}});
  assert.equal(check(roll,target,{srRoll:8}).amount,0);
  assert.equal(check(roll,target,{srRoll:9}).amount,12);
  const failure=check(roll,target,{srRoll:8});
  assert.equal(failure.reason,'Spell resisted');
  assert.deepEqual([failure.mitigation[0].roll,failure.mitigation[0].total],[8,17]);
 }
 for(const source of ['su','ex']){
  const roll=damage('ability',12,{resolution:{abilityKind:source}});
  assert.equal(check(roll,target).amount,12);
 }
 const noSr=damage('spell',12,{resolution:{srApplies:false}});
 assert.equal(check(noSr,target).amount,12);
});
test('unknown caster level cannot silently pass SR',()=>{
 const roll=damage('spell',10,{resolution:{casterLevel:null}});
 assert.throws(()=>check(roll,{sr:16},{srRoll:12}),/caster level/i);
});
