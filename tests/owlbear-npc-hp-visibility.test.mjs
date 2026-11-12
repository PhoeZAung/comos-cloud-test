import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BATTLE,LAYOUT,layoutFrom,battleRows,battleForViewer,battleHpForViewer} from '../src/owlbear/battle-state.mjs';

test('GM NPC HP toggle redacts nonparty HP and maximum values from player state only',()=>{
 const party=[{id:'party-1',name:'Astra',hp:12,hpMax:20,mp:2,mpMax:4,ac:14}];
 const tokens=[
  {id:'t1',name:'Astra',type:'IMAGE',layer:'CHARACTER',visible:true,metadata:{[BATTLE]:{enabled:true,siteId:'party-1',initiative:8,hp:20,hpMax:20}}},
  {id:'t2',name:'Warden',type:'IMAGE',layer:'CHARACTER',visible:true,metadata:{[BATTLE]:{enabled:true,npcId:'npc-1',initiative:18,hp:33,hpMax:60}}},
  {id:'t3',name:'Anonymous foe',type:'IMAGE',layer:'CHARACTER',visible:true,metadata:{[BATTLE]:{enabled:true,initiative:9,hp:20,hpMax:30}}}
 ];
 const rows=battleRows(tokens,party);
 const hidden=battleHpForViewer(battleForViewer(rows,false),{gm:false,npcHp:false});
 assert.equal(hidden.find(x=>x.id==='t1').hp,12);
 for(const id of ['t2','t3']){const row=hidden.find(x=>x.id===id);assert.equal(row.hp,null);assert.equal(row.hpMax,null);assert.equal(row.trackHp,false);}
 assert.equal(JSON.stringify(hidden).includes('"hp":33'),false);
 assert.equal(JSON.stringify(hidden).includes('"hpMax":60'),false);
 const shown=battleHpForViewer(battleForViewer(rows,false),{gm:false,npcHp:true});
 assert.equal(shown.find(x=>x.id==='t2').hp,33);
 const gm=battleHpForViewer(rows,{gm:true,npcHp:false});
 assert.equal(gm.find(x=>x.id==='t2').hp,33);
});

test('NPC HP sharing defaults to off and stays in room display metadata',()=>{
 assert.equal(layoutFrom({}).npcHp,false);
 assert.equal(layoutFrom({[LAYOUT]:{npcHp:false}}).npcHp,false);
 assert.equal(layoutFrom({[LAYOUT]:{npcHp:true}}).npcHp,true);
 assert.equal(layoutFrom({[LAYOUT]:{npcHp:'true'}}).npcHp,false);
});

test('GM-only invisible eye marker appears for invisible combatants, not in player rows',async()=>{
 const source=await readFile('src/owlbear/initiative-view.mjs','utf8');
 assert.match(source,/class="battle-hidden-eye"/);
 assert.match(source,/row\.visible===false&&state\.gm===true/);
 assert.match(source,/hidden from players/);
 const background=await readFile('src/owlbear/background.mjs','utf8');
 assert.match(background,/battleHpForViewer\(visible,\{gm,npcHp:layoutFrom\(room\)\.npcHp\}\)/);
 assert.match(background,/!gm&&!row\.siteId&&!l\.npcHp/);
 assert.match(background,/\['party','initiative','npcHp'\]/);
});
