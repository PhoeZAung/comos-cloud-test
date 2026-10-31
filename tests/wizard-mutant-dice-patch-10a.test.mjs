import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,buildIssues,effectiveScores} from '../src/features/characters/rules/build.mjs';
import {MUTANT_ID,MUTANT_TABLE,MUTANT_PHYSICAL,mutantEmptyRolls,mutantD100State,mutantD6State,
 mutantRollOutcome,mutantRollIssues,mutantTable,mutantResistanceName,mutantIsDefense}
 from '../src/features/characters/rules/mutant-progression.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
const m=()=>{const b=newBuild();b.name='Rolled Mutant';b.raceId=MUTANT_ID;return b;};
test('Source d100 catalogs retain all 100 actual outcomes with stable identities',()=>{
 for(const [physical,pool] of [[false,MUTANT_TABLE],[true,MUTANT_PHYSICAL]]){
  const src=mutantTable(physical);
  assert.equal(src.id,pool);
  assert.equal(src.options.length,100);
  for(let value=1;value<=100;value++){
   const outcome=mutantRollOutcome(value,physical);
   assert.equal(outcome.value,String(value).padStart(3,'0'));
   assert.equal(outcome.id,pool+':outcome:'+String(value).padStart(3,'0'));
   assert(outcome.description.length);
  }
 }
 assert.equal(mutantRollOutcome(0),null);
 assert.equal(mutantRollOutcome(101,true),null);
});
test('Required Mutant d100 table row 100 grants exactly two further results, later 100 ignored',()=>{
 const blank=mutantD100State([]);
 assert.equal(blank.pending,1);assert.equal(blank.complete,false);
 const normal=mutantD100State([9]);assert.equal(normal.complete,true);
 assert.equal(normal.outcomes.length,1);assert.match(normal.outcomes[0].name,/Charisma/);
 assert.equal(mutantD100State([100]).pending,2);
 assert.equal(mutantD100State([100,100]).pending,2);
 assert.equal(mutantD100State([100,100,9]).pending,1);
 const chain=mutantD100State([100,100,9,99]);
 assert.equal(chain.complete,true);assert.deepEqual(chain.outcomes.map(x=>Number(x.value)),[9,99]);
 assert(mutantD100State([100,100,9,99,6]).issues.some(x=>/Extra/.test(x)));
 assert(mutantD100State([0,9]).issues.some(x=>/whole numbers/.test(x)));
 assert.equal(mutantD100State([9,100]).complete,false);
});
test('Optional physical d100 row 99 produces two, row 100 three; further 99/100 ignored',()=>{
 for(const [first,n] of [[99,2],[100,3]]){
  const start=mutantD100State([first],true);assert.equal(start.pending,n);
  assert.equal(mutantD100State([first,99,100],true).pending,n);
  const seq=[first,99,100,...Array(n).fill(5)];
  const done=mutantD100State(seq,true);
  assert.equal(done.complete,true);assert.equal(done.outcomes.length,n);
  assert(done.outcomes.every(x=>Number(x.value)===5));
  assert(mutantD100State([...seq,5],true).issues.some(x=>/Extra/.test(x)));
 }
 assert.equal(mutantD100State([1],true).complete,true);
});
test('Mutant resistance d6 is exactly one result and Dual Minded eliminates it',()=>{
 const b=m();assert.equal(mutantResistanceName(1),'Earth');assert.equal(mutantResistanceName(6),'Wind');
 b.mutantRolls.resistance=6;
 assert.deepEqual(mutantRollIssues(b),[]);
 b.mutantRolls.resistance=7;assert(mutantRollIssues(b).some(x=>/1–6/.test(x)));
 b.alternateIds=[MUTANT_ID+':trait:dual-minded'];
 assert(mutantRollIssues(b).some(x=>/Dual Minded replaces/.test(x)));
 b.mutantRolls.resistance=null;assert(!mutantRollIssues(b).some(x=>/resistance/.test(x)));
});
test('Variable Stats d6 caps at six per ability and demands valid rerolls',()=>{
 const rolls=Object.fromEntries(Array.from({length:19},(_,i)=>[String(i+2),i===18?[3,4]:[i<=5?1:i<=11?2:3]]));
 const progress=mutantD6State(rolls);
 assert.deepEqual(progress.issues,[]);
 assert.deepEqual(progress.counts,{str:6,dex:6,con:6,int:1,wis:0,cha:0});
 assert.equal(progress.earned.find(x=>x.level===20).benefit,'int');
});
test('Variable Defenses uses five-result caps and +3 HP, +1 MP ordering, not ability boosts',()=>{
 const b=m();b.alternateIds=[MUTANT_ID+':trait:variable-defenses'];
 assert(mutantIsDefense(b));
 const logs={2:[1],3:[1],4:[1],5:[1],6:[1],7:[1,2],8:[2]};
 const result=mutantD6State(logs,true);
 assert.deepEqual(result.issues,[]);
 assert.equal(result.counts.hp,5);assert.equal(result.counts.mp,2);
 assert.equal(result.earned.find(x=>x.level===7).benefit,'mp');
 assert(mutantRollIssues({...b,level:8,mutantRolls:{...b.mutantRolls,levels:logs}}).length===0);
 b.abilityIncreases={4:'str'};
 assert(mutantRollIssues(b).some(x=>/ordinary \+1/.test(x)));
});
test('Mutant wizard can show source exact outcome text and roll controls without granting stats',()=>{
 const b=m();b.mutantRolls.abilities=[100,9,6];b.mutantRolls.physical=[99,5,6];b.mutantRolls.resistance=4;
 const html=renderBuild(b,2);
 assert.match(html,/Required mutant abilities · d100/);
 assert.match(html,/Optional appearance · d100/);
 assert.match(html,/Additional \+2 racial Charisma/);
 assert.match(html,/data-rw-mutant-roll="resistance"/);
 assert.match(html,/data-rw-mutant-manual="abilities"/);
 assert.match(html,/Lightning resistance 5/);
 assert.match(html,/Automated character saving is still blocked/);
 assert.equal(effectiveScores(b).cha,10,'result 09 is not blindly applied before rules mapping');
 assert(buildIssues(b).some(x=>/Mutant requires random level-based ability increases/.test(x.message)));
 const level2={...b,level:2,mutantRolls:{...b.mutantRolls,levels:{2:[1]}}};
 assert.match(renderBuild(level2,2),/Variable Stats · one d6 per level/);
});
test('Malformed or incomplete Mutant random logs are rejected with actionable errors',()=>{
 const b=m();
 assert(mutantRollIssues(b,{requireComplete:true}).some(x=>/required Variant/.test(x)));
 assert(mutantRollIssues(b,{requireComplete:true}).some(x=>/resistance/i.test(x)));
 b.mutantRolls={resistance:2,abilities:[100,5],physical:[],levels:{}};
 assert(mutantRollIssues(b,{requireComplete:true}).some(x=>/required Variant/.test(x)));
 b.mutantRolls={resistance:2,abilities:[5],physical:[99,6],levels:{2:[1]}};
 assert(mutantRollIssues(b).some(x=>/Future level/.test(x)));
 b.mutantRolls={resistance:2,abilities:[5],physical:[6],levels:{1:[1]}};
 assert(mutantRollIssues(b).some(x=>/Invalid Mutant advancement level/.test(x)));
 b.mutantRolls={resistance:2,abilities:[5],physical:'text',levels:{}};
 assert(mutantRollIssues(b).some(x=>/require a resistance/.test(x)));
});
