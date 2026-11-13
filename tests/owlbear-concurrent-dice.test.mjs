import test from 'node:test';
import assert from 'node:assert/strict';
import {requestSheetDice} from '../src/owlbear/rolls.mjs';

const sword=(damage='1d8')=>({data:{str:12,dex:12,bab:1,weapons:[{
 name:'Sword',attack_type:'melee',damage,crit_range:'20',crit_mult:'x2'
}]}});
function groupsFor(notation,faces){
 let i=0;
 return [...notation.matchAll(/(\d+)d(\d+)/g)].map(match=>({
  diceType:'d'+match[2],dice:Array.from({length:Number(match[1])},()=>({value:faces[i++]}))
 }));
}

test('one Dice+ roll throws attack and damage at the same time and keeps independent receipts',async()=>{
 const pending=[];
 const rolling=requestSheetDice(sword('1d8+1d4'),{kind:'weapon',index:0},notation=>new Promise(resolve=>pending.push({notation,resolve})));
 assert.equal(pending.length,1,'only one request must reach Dice+ for attack and damage');
 assert.match(pending[0].notation,/^1d20[^,]*,\s*1d8\+1d4$/);
 pending[0].resolve({groups:groupsFor(pending[0].notation,[10,4,3])});
 const receipts=await rolling;
 assert.equal(receipts.length,2);
 assert.match(receipts[0].expression,/^1d20/);
 assert.equal(receipts[1].expression,'1d8+1d4');
 assert.deepEqual(receipts[0].faces,[10]);
 assert.deepEqual(receipts[1].faces,[4,3]);
});

test('critical threat batches confirmation and critical damage only after initial attack/damage',async()=>{
 const notations=[];
 const receipts=await requestSheetDice(sword(),{kind:'weapon',index:0},async notation=>{
  notations.push(notation);
  const values=notations.length===1?[20,5]:[14,6,7];
  return {groups:groupsFor(notation,values)};
 });
 assert.equal(notations.length,2,'first throw plus a conditional critical throw');
 assert.match(notations[0],/^1d20[^,]*,\s*1d8/);
 assert.match(notations[1],/^1d20[^,]*,\s*2d8/);
 assert.deepEqual(receipts.map(row=>row.faces),[[20],[5],[14],[6,7]]);
});

test('a normal noncritical weapon attack produces no additional Dice+ request',async()=>{
 const notations=[];
 await requestSheetDice(sword(),{kind:'weapon',index:0},async notation=>{
  notations.push(notation);
  return {groups:groupsFor(notation,[11,4])};
 });
 assert.equal(notations.length,1);
});

test('rejects missing damage groups rather than saving only the attack result',async()=>{
 await assert.rejects(requestSheetDice(sword(),{kind:'weapon',index:0},async()=>({
  groups:[{diceType:'d20',dice:[{value:10}]}]
 })),/different dice groups/);
});
