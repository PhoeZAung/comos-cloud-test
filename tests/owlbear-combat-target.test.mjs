import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCombatTarget,attackOutcome} from '../src/owlbear/combat-target.mjs';
const fighter={id:'fighter-token',siteId:'fighter-sheet',name:'Fighter',isNpc:false,available:true,visible:true,hp:25,ac:22,touch:12,cmd:20};
const white={id:'mage-token',siteId:'mage-sheet',name:'White Mage',isNpc:false,available:true,visible:true,hp:19,ac:16,touch:14,cmd:12};
const enemy={id:'goblin-token',npcId:'goblin-sheet',siteId:null,name:'Goblin',isNpc:true,available:true,visible:true,hp:20,ac:16,touch:12,cmd:17};
const battle=[fighter,white,enemy];
const state={battle,turn:{id:fighter.id,round:2},selection:[enemy.id],ready:true};
const choose=(overrides={})=>resolveCombatTarget({characterId:'fighter-sheet',kind:'weapon',row:{attack_type:'melee'},...state,...overrides});

test('weapon attack links the exact actor sheet to its turn and selects an opposing token',()=>{
 const result=choose();assert.equal(result.targetId,enemy.id);
 assert.deepEqual([result.kind,result.defense,result.ac],['damage','ac',16]);
 assert.equal(choose({row:{attack_type:'ranged_touch'}}).ac,12);
 assert.equal(choose({row:{attack_type:'cmb'}}).ac,17);
});
test('healing and temporary HP require the healer’s turn and a linked party target',()=>{
 const turn={id:white.id,round:2},selection=[fighter.id];
 for(const effect_type of ['heal','temp_hp']){
  const pick=resolveCombatTarget({characterId:'mage-sheet',kind:'ability',row:{effect_type,damage:'1d8+3'},battle,turn,selection,ready:true});
  assert.equal(pick.kind,effect_type);assert.equal(pick.targetId,fighter.id);
 }
 assert.throws(()=>resolveCombatTarget({characterId:'mage-sheet',kind:'ability',row:{effect_type:'heal',damage:'1d8'},battle,turn,selection:[enemy.id],ready:true}),/linked party/);
 assert.throws(()=>resolveCombatTarget({characterId:'mage-sheet',kind:'ability',row:{effect_type:'temp_hp'},battle,turn,selection,ready:true}),/Dice Roll formula/);
});
test('blocking out-of-turn combat, missing links, wrong/multiple targets and allies',()=>{
 assert.throws(()=>choose({turn:{id:white.id}}),/initiative turn/);
 assert.throws(()=>choose({characterId:'someone-else'}),/Add and link/);
 assert.throws(()=>choose({selection:[]}),/exactly one/);
 assert.throws(()=>choose({selection:[enemy.id,fighter.id]}),/exactly one/);
 assert.throws(()=>choose({selection:[fighter.id]}),/different target/);
 assert.throws(()=>choose({selection:[white.id]}),/opposing combatant/);
 assert.throws(()=>choose({battle:[fighter,white]}),/visible combatant/);
});
test('allow untargeted abilities, ordinary rolls, and out-of-combat actions',()=>{
 assert.equal(resolveCombatTarget({characterId:'mage-sheet',kind:'ability',row:{effect_type:'none'},...state}),null);
 assert.equal(resolveCombatTarget({characterId:'fighter-sheet',kind:'weapon',row:{},battle:[],selection:[],ready:true}),null);
 assert.equal(resolveCombatTarget({characterId:'fighter-sheet',kind:'weapon',row:{},...state,ready:false}),null);
});
test('GM can act as saved NPC only on its own turn without exposing identities to players',()=>{
 const turn={id:enemy.id};const selection=[white.id];const row={attack_type:'touch'};
 assert.equal(resolveCombatTarget({characterId:'goblin-sheet',kind:'weapon',row,battle,turn,selection,ready:true,admin:true})?.ac,14);
 assert.throws(()=>resolveCombatTarget({characterId:'goblin-sheet',kind:'weapon',row,battle,turn,selection,ready:true,admin:false}),/Add and link/);
});
test('hit and miss evaluate the appropriate AC, natural 1 and natural 20',()=>{
 const target=choose();
 assert.equal(attackOutcome({kind:'weapon',rolls:[12],total:18},target),'Hit');
 assert.equal(attackOutcome({kind:'weapon',rolls:[7],total:15},target),'Miss');
 assert.equal(attackOutcome({kind:'weapon',rolls:[1],total:80},target),'Miss');
 assert.equal(attackOutcome({kind:'weapon',rolls:[20],total:2},target),'Hit');
 assert.equal(attackOutcome({kind:'spell',attack:null,damage:{total:8}},target),null);
 assert.equal(attackOutcome({kind:'ability',attack:{rolls:[13],total:16}},target),'Hit');
});
