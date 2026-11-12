import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNpcStatBlock} from '../src/features/characters/npc-stat-block.mjs';
import {uniqueNpcForToken,npcHpDice,rollNpcHp,npcBattleStats,rollNpcInitiative} from '../src/owlbear/npc-battle.mjs';

const imported=[
 '# Iron Warden',
 '| Stat | Value |',
 '| --- | --- |',
 '| **Init** | +3 |',
 '| **AC** | 24, touch 14, flat-footed 21 |',
 '| **hp** | 94 (11d10+33) |',
 '| **CMD** | 28 |',
 '| **Str** | 16 |',
 '| **Int** | 14 |'
].join('\n');
const character=id=>({id,name:'Iron Warden',kind:'npc',data:parseNpcStatBlock(imported).data});

test('only unique, case-insensitive exact NPC names match a battle token',()=>{
 const a={id:'a',name:'Iron Warden'},b={id:'b',name:'Iron Warden'};
 assert.equal(uniqueNpcForToken(' iron warden ',[a]),a);
 assert.equal(uniqueNpcForToken('Iron Warden Captain',[a]),null);
 assert.equal(uniqueNpcForToken('Iron Warden',[a,b]),null);
 assert.equal(uniqueNpcForToken('Unlisted',[]),null);
});

test('NPC starting HP is rolled from the printed formula once; saves exact totals',()=>{
 const npc=character('npc-1'),stats=npcBattleStats(npc,()=>4);
 assert.equal(stats.hp,77); // 11*4+33, not printed average 94
 assert.equal(stats.hpRoll.expression,'11d10+33');
 assert.deepEqual(stats.hpRoll.rolls,Array(11).fill(4));
 assert.equal(stats.hpRoll.total,77);
 assert.deepEqual([stats.ac,stats.touch,stats.flat,stats.cmd,stats.initiative],[24,14,21,28,3]);
 assert.equal(stats.mp,0);assert.equal(stats.npcId,'npc-1');
 assert.equal(stats.trackHp,true);
 assert.equal(stats.intelligence,14);
});

test('NPCs without dice use their printed HP; incomplete sheets use manual entry',()=>{
 const noDice=character('id2');noDice.data.npcText.hpDetail='94';
 assert.equal(npcBattleStats(noDice).hp,94);
 assert.equal(npcBattleStats(noDice).hpRoll,null);
 noDice.data.npcStats.ac=undefined;
 assert.equal(npcBattleStats(noDice),null);
});

test('NPC HP formulas are bounded and never interpret non-HP dice',()=>{
 assert.equal(npcHpDice('94 (11d10+33)').expression,'11d10+33');
 assert.equal(npcHpDice('11d10+33 damage'),null);
 assert.equal(npcHpDice('99 (9999d10+0)'),null);
 assert.equal(npcHpDice('99 (1d1+0)'),null);
 assert.equal(rollNpcHp(npcHpDice('2 (1d4-20)'),()=>1).hp,1);
 assert.throws(()=>rollNpcHp(npcHpDice('7 (2d6)'),()=>99),/Invalid NPC HP die/);
});

test('matched NPC initiative is rolled as d20 plus saved Init modifier, not just the modifier',()=>{
 const npc=character('npc-2'),stats=npcBattleStats(npc,()=>4);
 assert.equal(stats.initiative,3,'sheet Init remains a modifier');
 assert.deepEqual(rollNpcInitiative(stats.initiative,()=>15),{d20:15,bonus:3,total:18});
 assert.deepEqual(rollNpcInitiative(-2,()=>1),{d20:1,bonus:-2,total:-1});
 assert.throws(()=>rollNpcInitiative(3,()=>21),/Invalid NPC initiative die/);
 assert.throws(()=>rollNpcInitiative(10000,()=>10),/Invalid NPC initiative modifier/);
});
