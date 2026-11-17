import test from 'node:test';
import assert from 'node:assert/strict';
import {requestSheetDice} from '../src/owlbear/rolls.mjs';
import {weaponRoll} from '../backend/characters/rolls.mjs';
import {externalRollSource} from '../backend/characters/external-rolls.mjs';

const sheet={kind:'player',data:{str:10,dex:10,bab:0,weapons:[{name:'Sword',attack_type:'melee',damage:'1d8',crit_range:'20',crit_mult:'x2'}]}};
function diceProvider(firstFace=4){
 const requested=[];
 const provider=async notation=>{
  requested.push(notation);
  return {groups:[...notation.matchAll(/(\d+)d(\d+)/gi)].map(([,count,sides])=>({
   diceType:'d'+sides,dice:Array.from({length:Number(count)},()=>({value:Number(sides)===20?firstFace:5}))
  }))};
 };
 return {requested,provider};
}
test('a missed targeted attack rolls only d20, never damage or critical Dice+ dice',async()=>{
 const {requested,provider}=diceProvider(4),misses=[];
 const changes={kind:'weapon',index:0,mode:'use'};
 const responses=await requestSheetDice(sheet,changes,provider,{target:{kind:'damage',ac:20},onMiss:ac=>misses.push(ac)});
 assert.equal(responses.length,1);
 assert.deepEqual(misses,[20]);
 assert.equal(requested.length,1,'no additional Dice+ roll request after a miss');
 const external=externalRollSource(responses);
 const receipt=weaponRoll(sheet.data.weapons[0],sheet.data,expression=>external.roll(expression),{missAc:20});
 external.finish();
 assert.equal(receipt.rolls[0],4);
 assert.equal(receipt.damage,null);
 assert.equal(receipt.critical.threat,false);
});
test('successful attacks still roll damage; target AC is ignored for untargeted attacks',async()=>{
 const hit=diceProvider(15);
 const answers=await requestSheetDice(sheet,{kind:'weapon',index:0},hit.provider,{target:{kind:'damage',ac:10},onMiss:()=>assert.fail('unexpected miss')});
 assert.ok(answers.length>=2);
 assert.ok(hit.requested.some(value=>value.includes('d8')));
 const untargeted=diceProvider(4);
 await requestSheetDice(sheet,{kind:'weapon',index:0},untargeted.provider);
 assert.ok(untargeted.requested.some(value=>value.includes('d8')),'manual non-combat rolls still include damage');
});
test('backend never accepts an omitted damage roll for an actual hit',()=>{
 const responses=[{expression:'1d20+0',faces:[15]}],external=externalRollSource(responses);
 assert.throws(()=>weaponRoll(sheet.data.weapons[0],sheet.data,x=>external.roll(x),{missAc:10}),/External roll does not match/);
});
