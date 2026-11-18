import test from 'node:test';
import assert from 'node:assert/strict';
import {diceTerms,damageExpression,weaponDamageFormulas} from '../src/features/sheet/calculations.mjs';
import {parseDiceMath,evaluateDiceMath} from '../src/features/sheet/dice-math.mjs';
import {serverRoll,abilityRoll} from '../backend/characters/rolls.mjs';
import {externalRollSource} from '../backend/characters/external-rolls.mjs';
import {requestSheetDice} from '../src/owlbear/rolls.mjs';
import {rollDice} from '../src/ui/sheet.mjs';

function withFaces(expression,faces){
 let i=0;
 const result=evaluateDiceMath(parseDiceMath(expression).ast,sides=>{
  const face=faces[i++];
  assert.ok(Number.isInteger(face)&&face>=1&&face<=sides);
  return face;
 });
 assert.equal(i,faces.length);
 return result;
}
test('multiplication, division, parentheses and addition use PEMDAS and floor only the final total',()=>{
 assert.equal(withFaces('1d8 * 1.5',[3]).total,4);
 assert.equal(withFaces('(1d8 + 2) * 1.5',[3]).total,7);
 assert.equal(withFaces('1d8 + 2 * 3',[3]).total,9);
 assert.equal(withFaces('2 * (1d8 + 3)',[3]).total,12);
 assert.equal(withFaces('1d8 * (1 + .5)',[3]).total,4);
 assert.equal(withFaces('1d8 / 2 - 3',[5]).total,-1);
 assert.equal(withFaces('(1d8+1d4)/2',[3,2]).total,2);
 assert.equal(withFaces('1d8 * 2 / 3',[5]).total,3);
 assert.equal(withFaces('1d8 + 4 * (3 - 1)',[3]).total,11);
 assert.equal(withFaces('-1d8 / 2',[5]).total,-3);
 assert.equal(withFaces('1d8*1.5+1d4',[3,2]).total,6);
 assert.equal(damageExpression('1d8 * 1.5'),'1d8 * 1.5');
 assert.equal(damageExpression('({CL}/2)d6 * 1.5',{CL:5}),'2d6 * 1.5');
});
test('typed damage stays consistent when fractions are floored after the full expression',()=>{
 const out=withFaces('1d6 fire * 1.5 + 1d4 cold * 1.5',[3,5]);
 assert.equal(out.total,12);
 assert.equal(out.breakdown.reduce((n,p)=>n+p.total,0),12);
 assert.deepEqual(out.breakdown.map(p=>p.type),['fire','cold']);
 const separate=withFaces('(1d6 fire + 1d4 cold) / 2',[3,2]);
 assert.equal(separate.total,2);
 assert.equal(separate.breakdown.reduce((n,p)=>n+p.total,0),2);
 assert.deepEqual(separate.breakdown.map(p=>p.type),['fire','cold']);
});
test('simple dice continue to use the original notation and typed metadata',()=>{
 const legacy=diceTerms('2d6 fire + 1d4 cold + 3');
 assert.equal(legacy.ast,undefined);
 assert.equal(legacy[0].count,2);
 assert.equal(legacy[1].type,'cold');
 const current=serverRoll('1d8 * 1.5');
 assert.equal(current.total,Math.floor(current.rolls[0]*1.5));
 assert.equal(current.breakdown.reduce((n,p)=>n+p.total,0),current.total);
 const simple=serverRoll('1d8+2');
 assert.equal(simple.total,simple.rolls[0]+2);
});
test('weapon critical formulas reroll independent dice while preserving multiplication',()=>{
 const row={name:'Heavy blade',attack_type:'melee',damage:'1d8*1.5'};
 const formulas=weaponDamageFormulas(row,{str:10},2);
 assert.equal(formulas.normal,'1d8*1.5');
 assert.equal(formulas.critical,'(1d8*1.5) + (1d8*1.5)');
 assert.equal(withFaces(formulas.critical,[3,5]).total,12);
 assert.equal(weaponDamageFormulas({...row,damage:'1d8'},{str:10},2).critical,'2d8');
});
test('Dice+ returns only die faces and server applies the math, including checks against tampering',async()=>{
 const notations=[];
 const expression='(1d8 + 2) * 1.5 + 1d4';
 const fakeRoll=async notation=>{
  notations.push(notation);
  return {groups:[{diceType:'d8',dice:[{value:3}]},{diceType:'d4',dice:[{value:2}]}]};
 };
 const responses=await requestSheetDice({data:{}},{expression},fakeRoll);
 assert.deepEqual(notations,['1d8+1d4']);
 assert.deepEqual(responses,[{expression,faces:[3,2]}]);
 const ext=externalRollSource(responses);
 const roll=ext.roll(expression);
 assert.equal(roll.total,9);
 ext.finish();
 for(const invalid of [
  [{expression,faces:[9,2]}],
  [{expression,faces:[3]}],
  [{expression,faces:[3,2,1]}],
  [{expression:'1d8+2',faces:[3,2]}]
 ]){
  const source=externalRollSource(invalid);
  assert.throws(()=>source.roll(expression));
 }
});
test('ability and local dice rolls agree on fractional mathematical notation',()=>{
 const row={name:'Strike',damage:'1d8 * 1.5',action_type:'Standard'};
 let called=0;
 const roll=abilityRoll(row,{},'activeAbilities',expression=>{
  called++;
  return {expression,...withFaces(expression,[3])};
 });
 assert.equal(called,1);
 assert.equal(roll.damage.total,4);
 assert.equal(roll.total,4);
 assert.equal(rollDice('1d8 * 1.5',()=>3).total,4);
});
test('bounded dice math rejects malformed, arbitrary code, excessive values and division by zero',()=>{
 for(const expression of [
  'globalThis.process.exit(1)','1d8 + alert(2)','1d8 ** 2','1d8 + 2.3.4',
  '1d8 + x','1d8 + 1e10','1d8 * 2000000','51d6 * 2',
  '1d2000*2','1d8 * (2+3','1d8 + 2)',
  '1d8 / (3 - 3)','(1d8 fire)*(1d4 cold)',
  '1d8 * '.repeat(30)+'1'
 ]){
  assert.throws(()=>{const parsed=parseDiceMath(expression);evaluateDiceMath(parsed.ast,()=>3);},expression);
 }
 assert.throws(()=>diceTerms('1d8*2**2'));
 assert.throws(()=>damageExpression('1d8 * globalThis.alert(2)'));
});
