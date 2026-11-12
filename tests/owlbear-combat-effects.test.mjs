import test from 'node:test';
import assert from 'node:assert/strict';
import {computeCombatEffect,applyCombatHp,validationFrom,VALIDATION} from '../src/owlbear/combat-effects.mjs';
import {applyNpcTokenReceipt} from '../src/owlbear/combat-npc.mjs';
import {BATTLE} from '../src/owlbear/battle-state.mjs';

test('damage hits AC, natural 1 misses and natural 20 hits',()=>{
 const hit={kind:'weapon',rolls:[12],total:18,damage:{total:8}};
 assert.deepEqual([computeCombatEffect(hit,{ac:16}).hit,computeCombatEffect(hit,{ac:20}).hit],[true,false]);
 assert.equal(computeCombatEffect({...hit,rolls:[1],total:50},{ac:16}).amount,0);
 assert.equal(computeCombatEffect({...hit,rolls:[20],total:2},{ac:16}).amount,8);
});
test('critical damage applies only with confirmed hit',()=>{
 const roll={kind:'weapon',rolls:[19],total:25,damage:{total:8},critical:{threat:true,confirmation:{rolls:[13],total:23},damage:{total:19}}};
 assert.deepEqual([computeCombatEffect(roll,{ac:16}).critical,computeCombatEffect(roll,{ac:24}).critical],[true,false]);
 assert.equal(computeCombatEffect(roll,{ac:16}).amount,19);
 assert.equal(computeCombatEffect(roll,{ac:24}).amount,8);
});
test('healing caps at maximum and damage consumes temporary HP first',()=>{
 const source={hp:12,hpMax:30,hpTemp:5};
 const damage=applyCombatHp(source,{kind:'damage',amount:8,hit:true});
 assert.deepEqual(damage.after,{hp:9,hpMax:30,hpTemp:0});
 assert.equal(damage.applied,8);
 const healed=applyCombatHp(damage.after,{kind:'heal',amount:50,hit:true});
 assert.equal(healed.after.hp,30);assert.equal(healed.applied,21);
});
test('temporary HP conservatively replaces smaller pool, not stacking with itself',()=>{
 const base={hp:10,hpMax:30,hpTemp:5};
 const next=applyCombatHp(base,{kind:'temp_hp',amount:9,hit:true});
 assert.equal(next.after.hpTemp,9);assert.equal(next.applied,4);
 assert.equal(applyCombatHp(next.after,{kind:'temp_hp',amount:7,hit:true}).after.hpTemp,9);
});
test('configured spell failure prevents applying healing or damage',()=>{
 const r={kind:'spell',effectType:'heal',damage:{total:12},spellFailure:{failed:true}};
 assert.equal(computeCombatEffect(r,{ac:10}).amount,0);
 assert.equal(computeCombatEffect(r,{ac:10}).reason,'Spell failed');
});
test('weapon and ability approval flags are independently disabled by default',()=>{
 assert.deepEqual(validationFrom({}),{weapon:false,ability:false});
 assert.deepEqual(validationFrom({[VALIDATION]:{weapon:true,ability:false}}),{weapon:true,ability:false});
});
test('NPC token updates are idempotent and preserve receipt ID',async()=>{
 const token={id:'npc-a',metadata:{[BATTLE]:{enabled:true,hp:17,hpMax:20,hpTemp:5}}};
 const OBR={scene:{items:{updateItems:async(ids,fn)=>fn([token])}}};
 const effect={kind:'damage',hit:true,amount:9};
 const first=await applyNpcTokenReceipt(OBR,{tokenId:'npc-a',receiptId:'roll-id',effect});
 assert.equal(first.after.hp,13);assert.equal(token.metadata[BATTLE].hpTemp,0);
 const second=await applyNpcTokenReceipt(OBR,{tokenId:'npc-a',receiptId:'roll-id',effect});
 assert.equal(second.duplicate,true);
 assert.equal(token.metadata[BATTLE].hp,13);
});
