import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BATTLE,battleRows,battleForViewer,battleHpForViewer,advanceVisibleTurn,turnForViewer} from '../src/owlbear/battle-state.mjs';
import {initiativeLinkStatus} from '../src/owlbear/initiative-link.mjs';
import {applyNpcTokenReceipt} from '../src/owlbear/combat-npc.mjs';

const combatant=(id,initiative,visible=true)=>({id,initiative,visible});

test('Next and Previous skip invisible combatants, counting a wrapped round just once',()=>{
 const sorted=[combatant('hidden-first',23,false),combatant('fighter',20),combatant('hidden-middle',18,false),combatant('mage',9),combatant('hidden-last',2,false)];
 assert.deepEqual(advanceVisibleTurn(sorted,{id:'fighter',round:3},1),{id:'mage',round:3});
 assert.deepEqual(advanceVisibleTurn(sorted,{id:'mage',round:3},1),{id:'fighter',round:4});
 assert.deepEqual(advanceVisibleTurn(sorted,{id:'fighter',round:3},-1),{id:'mage',round:2});
 assert.deepEqual(advanceVisibleTurn(sorted,{id:'hidden-middle',round:3},1),{id:'mage',round:3});
 assert.deepEqual(advanceVisibleTurn(sorted,{id:'hidden-middle',round:3},-1),{id:'fighter',round:3});
 assert.equal(advanceVisibleTurn(sorted.map(row=>({...row,visible:false})),{id:'hidden-first',round:4},1),null);
 assert.deepEqual(advanceVisibleTurn([combatant('solo',12)],{id:'solo',round:3},1),{id:'solo',round:4});
});

test('GM sees hidden NPC with crossed-eye status; players see neither its row nor its turn',()=>{
 const tokens=[
  {id:'hidden',type:'IMAGE',layer:'CHARACTER',name:'Secret Assassin',visible:false,metadata:{[BATTLE]:{enabled:true,npcId:'npc-secret',initiative:22,hp:30,hpMax:30}}},
  {id:'player',type:'IMAGE',layer:'CHARACTER',name:'Fighter',visible:true,metadata:{[BATTLE]:{enabled:true,siteId:'pc-1',initiative:12}}}
 ];
 const party=[{id:'pc-1',name:'Fighter',hp:12,hpMax:19,ac:15}];
 const rows=battleRows(tokens,party);
 assert.equal(battleForViewer(rows,true).length,2);
 const players=battleForViewer(rows,false);
 assert.deepEqual(players.map(row=>row.id),['player']);
 assert.deepEqual(turnForViewer({id:'hidden',round:2},players,false),{id:null,round:2});
 assert.deepEqual(advanceVisibleTurn(rows,{id:'player',round:2},1),{id:'player',round:3});
});

test('Individual NPC HP privacy overrides room-wide sharing, without hiding HP from GM',()=>{
 const tokens=[
  {id:'hidden-hp',type:'IMAGE',layer:'CHARACTER',name:'Secret Boss',visible:true,metadata:{[BATTLE]:{enabled:true,npcId:'npc-1',initiative:15,hp:48,hpMax:60,hpHidden:true}}},
  {id:'shown-hp',type:'IMAGE',layer:'CHARACTER',name:'Skeleton',visible:true,metadata:{[BATTLE]:{enabled:true,npcId:'npc-2',initiative:7,hp:8,hpMax:12,hpHidden:false}}},
  {id:'no-hp',type:'IMAGE',layer:'CHARACTER',name:'Dramatic Minion',visible:true,metadata:{[BATTLE]:{enabled:true,trackHp:false,hp:0,hpMax:0,initiative:5}}}
 ];
 const gm=battleRows(tokens,[]);
 assert.equal(gm[0].hp,48);
 assert.equal(gm[0].hpHidden,true);
 const players=battleHpForViewer(battleForViewer(gm,false),{gm:false,npcHp:true});
 assert.equal(players[0].hp,null);
 assert.equal(players[0].hpMax,null);
 assert.equal(players[0].trackHp,false);
 assert.equal(Object.hasOwn(players[0],'hpHidden'),false,'do not expose GM-only HP settings');
 assert.equal(players[1].hp,8);
 assert.equal(players[1].hpMax,12);
 assert.equal(players[2].hp,null);
 assert.equal(players[2].trackHp,false);
 assert.equal(battleHpForViewer(gm,{gm:false,npcHp:false})[1].hp,null,'global sharing disabled');
 assert.equal(battleHpForViewer(gm,{gm:true,npcHp:false})[0].hp,48,'GM retains actual HP');
});

test('Untracked NPC token ignores damage even when receipt reaches Owlbear',async()=>{
 const token={id:'minion',metadata:{[BATTLE]:{enabled:true,trackHp:false,hp:0,hpMax:0,hpTemp:0}}};
 const OBR={scene:{items:{updateItems:async(ids,fn)=>fn([token])}}};
 const effect={kind:'damage',amount:14,hit:true};
 const first=await applyNpcTokenReceipt(OBR,{tokenId:'minion',receiptId:'roll-1',effect});
 assert.equal(first.untracked,true);
 assert.equal(first.applied,0);
 assert.equal(token.metadata[BATTLE].hp,0);
 assert.equal(token.metadata[BATTLE].hpTemp,0);
 const repeated=await applyNpcTokenReceipt(OBR,{tokenId:'minion',receiptId:'roll-1',effect});
 assert.equal(repeated.duplicate,true);
 assert.equal(token.metadata[BATTLE].hp,0);
});

test('Connection colors are white for Party, black for NPC, red for unlinked and broken',async()=>{
 assert.deepEqual(initiativeLinkStatus({siteId:'pc',linked:true}).kind,'character');
 assert.deepEqual(initiativeLinkStatus({isNpc:true,linked:true}).kind,'npc');
 assert.equal(initiativeLinkStatus({linked:false}).kind,'unlinked');
 assert.equal(initiativeLinkStatus({linked:true,available:false}).kind,'missing');
 const css=await readFile(new URL('../public/owlbear/owlbear.css',import.meta.url),'utf8');
 assert.match(css,/data-link-status="character"\]\{--cosmos-link-color:#ffffff/);
 assert.match(css,/data-link-status="npc"\]\{--cosmos-link-color:#07070a/);
 assert.match(css,/data-link-status="unlinked"\]\{--cosmos-link-color:#ff435d/);
 assert.match(css,/data-link-status="missing"\]\{--cosmos-link-color:#ff435d/);
 const ui=await readFile(new URL('../src/owlbear/initiative-view.mjs',import.meta.url),'utf8');
 assert.match(ui,/row\.visible===false&&state\.gm===true/);
 assert.match(ui,/battle-hidden-eye/);
 assert.match(ui,/data-hp-icon|battle-hp-privacy/);
 assert.match(ui,/npc-hp-visibility/);
 const background=await readFile(new URL('../src/owlbear/background.mjs',import.meta.url),'utf8');
 assert.match(background,/advanceVisibleTurn\(sorted,scene\[TURN\]/);
 assert.match(background,/npc-hp-visibility/);
 assert.match(background,/!l\.npcHp\|\|row\.hpHidden/);
});
