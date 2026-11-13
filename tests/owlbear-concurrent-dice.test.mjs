import test from 'node:test';
import assert from 'node:assert/strict';
import {requestSheetDice} from '../src/owlbear/rolls.mjs';

test('Owlbear sends attack and damage together but keeps original receipt order',async()=>{
 const character={data:{str:12,dex:12,bab:1,weapons:[{
  name:'Sword',attack_type:'melee',damage:'1d8',crit_range:'20',crit_mult:'x2'
 }]}};
 const pending=[];
 const request=notation=>new Promise(resolve=>pending.push({notation,resolve}));
 const result=requestSheetDice(character,{kind:'weapon',index:0},request);
 assert.equal(pending.length,2,'damage roll should be requested without awaiting attack');
 assert.match(pending[0].notation,/^1d20/);
 assert.match(pending[1].notation,/1d8/);
 const respond=(slot,face)=>{
  const groups=[...pending[slot].notation.matchAll(/(\d+)d(\d+)/g)].map((match)=>({
   diceType:'d'+match[2],dice:Array.from({length:Number(match[1])},()=>({value:face}))
  }));
  pending[slot].resolve({groups});
 };
 respond(1,4); // Damage finishes first in Dice+.
 respond(0,10); // Attack finishes second; no critical threat.
 const receipts=await result;
 assert.equal(receipts.length,2);
 assert.match(receipts[0].expression,/^1d20/);
 assert.match(receipts[1].expression,/1d8/);
 assert.deepEqual(receipts[0].faces,[10]);
 assert.deepEqual(receipts[1].faces,[4]);
});
