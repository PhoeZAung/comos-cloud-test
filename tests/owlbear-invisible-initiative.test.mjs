import test from 'node:test';
import assert from 'node:assert/strict';
import {battleRows,battleForViewer,turnForViewer,BATTLE} from '../src/owlbear/battle-state.mjs';

test('hidden token stays in GM initiative but is completely omitted for players, including the active ID',()=>{
 const tokens=[
  {id:'public',type:'IMAGE',layer:'CHARACTER',name:'Knight',visible:true,metadata:{[BATTLE]:{enabled:true,initiative:10,hp:9,hpMax:10}}},
  {id:'hidden',type:'IMAGE',layer:'CHARACTER',name:'Invisible Assassin',visible:false,metadata:{[BATTLE]:{enabled:true,initiative:20,hp:32,hpMax:32}}}
 ];
 const all=battleRows(tokens,[]);
 assert.equal(all.length,2);
 const player=battleForViewer(all,false),gm=battleForViewer(all,true);
 assert.deepEqual(player.map(row=>row.name),['Knight']);
 assert.deepEqual(gm.map(row=>row.name),['Invisible Assassin','Knight']);
 const turn={id:'hidden',round:4};
 assert.deepEqual(turnForViewer(turn,player,false),{id:null,round:4});
 assert.deepEqual(turnForViewer(turn,gm,true),turn);
 assert.deepEqual(turnForViewer({id:'public',round:4},player,false),{id:'public',round:4});
 assert.equal(JSON.stringify({battle:player,turn:turnForViewer(turn,player,false)}).includes('Invisible Assassin'),false);
 assert.equal(JSON.stringify({battle:player,turn:turnForViewer(turn,player,false)}).includes('hidden'),false);
});

test('unspecified visibility defaults to public while explicitly false remains private',()=>{
 assert.deepEqual(battleForViewer([{id:'one'},{id:'two',visible:false}],false).map(row=>row.id),['one']);
});
