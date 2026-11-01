import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,effectiveScores,raceTraits,buildIssues} from '../src/features/characters/rules/build.mjs';
import {mutantProjection,mutantVerifiedEffects,mutantRollIssues,MUTANT_ID} from '../src/features/characters/rules/mutant-progression.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
const m=(ability=[],levels={},defenses=false)=>{
 const b=newBuild();b.name='Mutant Patch 10B test';b.raceId=MUTANT_ID;b.level=Math.max(1,...Object.keys(levels).map(Number));
 b.mutantRolls={resistance:2,abilities:ability,physical:[],levels};
 if(defenses)b.alternateIds=[MUTANT_ID+':trait:variable-defenses'];
 return b;
};
const raceEffect=(b,target)=>raceTraits(b).traits.flatMap(f=>f.effects||[]).filter(e=>e.target===target&&e.automation==='automatic');
test('Mutant source d100 rolls 09/46 add only their specified +2 scores, no extraneous bonuses',()=>{
 const b=m([100,9,46]),p=mutantProjection(b);
 assert.deepEqual([effectiveScores(b).cha,effectiveScores(b).int,effectiveScores(b).wis],[12,12,10]);
 assert.deepEqual(mutantVerifiedEffects(b).map(e=>[e.target,e.value.value]),[
  ['ability_scores.cha',2],['ability_scores.int',2]]);
 assert.equal(p.appliedResults.length,2);assert.equal(p.manualResults.length,0);
 assert.equal(raceEffect(b,'ability_scores.str').length,0);
 const other=m([90]);assert.equal(effectiveScores(other).wis,12);
 assert.equal(effectiveScores(other).cha,10);
});
test('Mutant skills stack source d100 +2 racial Perception with Keen Senses but do not grant unspecific powers',()=>{
 const b=m([100,15,85]);
 assert.equal(raceEffect(b,'skills.skill:diplomacy.bonus').reduce((n,e)=>n+e.value.value,0),2);
 assert.equal(raceEffect(b,'skills.skill:perception.bonus').reduce((n,e)=>n+e.value.value,0),4);
 assert.equal(mutantProjection(b).manualResults.length,0);
 const conditional=m([13]);assert.equal(mutantProjection(conditional).manualResults.length,1);
 assert.equal(mutantVerifiedEffects(conditional).length,0);
 assert.match(raceTraits(conditional).traits.find(f=>f.id===MUTANT_ID+':trait:variable-mutant-abilities').description,/NOT automatically granted/);
});
test('Mutant Variable Stats awards one d6 score point every level after first and suppresses ordinary level-4 +1',()=>{
 const rolls={2:[1],3:[4],4:[1]};
 const b=m([2],rolls),original=effectiveScores(b);
 assert.equal(original.str,12);assert.equal(original.int,11);
 assert.equal(original.dex,10);
 assert.equal(previewBuild(b).mutantProjection.scoreBonuses.str,2);
 assert.equal(previewBuild(b).mutantProjection.scoreBonuses.int,1);
 b.abilityIncreases={4:'str'};
 assert.equal(effectiveScores(b).str,12,'ordinary milestone cannot stack even in unsaved preview');
 assert(mutantRollIssues(b).some(msg=>/ordinary/.test(msg)));
 assert(buildIssues(b).some(x=>/ordinary/.test(x.message)));
 const pending=structuredClone(b);delete pending.mutantRolls.levels[4];
 const html=renderBuild(pending,1,{mode:'levelup',baseline:m([2],{2:[1],3:[4]})});
 assert.match(html,/This replaces the normal \+1 ability increase/);
 assert.doesNotMatch(html,/data-rw-boost/);
 assert.match(html,/data-rw-mutant-manual="level"/);
 assert.doesNotMatch(html,/data-rw-mutant-manual="abilities"/,'creation d100 cannot be rerolled during level up');
 assert.doesNotMatch(html,/data-rw-mutant-manual="resistance"/,'creation resistance cannot be changed at level up');
});
test('Variable Defenses source d6 1 to 6 map to +3 HP, +1 MP, +1 to three saves, +1 AC manual',()=>{
 const rows={2:[1],3:[2],4:[3],5:[4],6:[5],7:[6]};
 const b=m([2],rows,true),baseline=m([2],{},true),p=mutantProjection(b);
 assert.deepEqual([p.hp,p.mp,p.fort,p.ref,p.will,p.ac],[3,1,1,1,1,1]);
 assert.deepEqual(p.scoreBonuses,{str:0,dex:0,con:0,int:0,wis:0,cha:0});
 assert.equal(effectiveScores(b).str,10);
 baseline.level=b.level;
 const [before,after]=[previewBuild(baseline),previewBuild(b)];
 assert.equal(after.hp,before.hp+3);
 assert.equal(after.summary.mp,before.summary.mp+1);
 assert.equal(after.summary.bonusMp,before.summary.bonusMp+1);
 assert.equal(after.summary.fort,before.summary.fort+1);
 assert.equal(after.summary.ref,before.summary.ref+1);
 assert.equal(after.summary.will,before.summary.will+1);
 assert.equal(after.mutantProjection.ac,1,'AC flagged for manual sheet reconciliation');
 assert(!mutantVerifiedEffects(b).some(e=>e.target==='ability_scores.str'));
 assert(!raceTraits(b).traits.some(f=>f.id===MUTANT_ID+':trait:variable-stats'));
});
test('Source d100 outcome 98 grants level-scaling HP; 14 raises the land speed only with base-speed trait',()=>{
 const hp=m([98]);hp.level=9;
 assert.equal(mutantProjection(hp).hp,9);
 const normal=m([]);normal.level=9;
 assert.equal(previewBuild(hp).hp,previewBuild(normal).hp+9);
 const speed=m([14]),without=m([]);
 assert.equal(mutantProjection(speed).speed,5);
 assert.equal(raceEffect(without,'identity.speed.land')[0].value.value,30);
 assert.equal(raceEffect(speed,'identity.speed.land')[0].value.value,35);
 speed.disabledTraits=[MUTANT_ID+':trait:base-speed'];
 assert.equal(raceEffect(speed,'identity.speed.land').length,0);
});
test('Source d100 rows 29/59/79 add unconditional saving throw bonuses only to their stated save',()=>{
 for(const [roll,target] of [[29,'ref'],[59,'will'],[79,'fort']]){
  const b=m([roll]),zero=m([]),after=previewBuild(b),before=previewBuild(zero);
  assert.equal(after.summary[target],before.summary[target]+1);
  for(const other of ['fort','ref','will'].filter(x=>x!==target))
   assert.equal(after.summary[other],before.summary[other]);
 }
});
test('Dual Minded saves remain independent of Variable Resistance and may not grant rolled resistance',()=>{
 const b=m([]);b.alternateIds=[MUTANT_ID+':trait:dual-minded'];
 b.mutantRolls.resistance=null;
 assert.equal(mutantProjection(b).will,2);
 assert.equal(mutantProjection(b).resistance,null);
 assert.equal(previewBuild(b).summary.will,previewBuild(m([])).summary.will+2);
 assert(!mutantRollIssues(b).some(s=>/resistance/i.test(s)));
});
test('Mutant numeric projection uses total character level and excludes forged future d6 entries',()=>{
 const b=m([98],{2:[1],3:[1],4:[1],5:[1]});b.level=1;
 // Four carried class levels + one level in current class.
 b.carry={classes:[{name:'Warrior',level:4}]};
 assert.equal(mutantProjection(b).hp,5);
 assert.equal(mutantProjection(b).scoreBonuses.str,4);
 b.mutantRolls.levels[6]=[1];
 assert.equal(mutantProjection(b).scoreBonuses.str,4,'future sixth-level roll cannot change current scores');
 assert(mutantRollIssues(b).some(s=>/Future level/.test(s)));
});
test('Unmapped table outcomes are visible but never silently applied; Mutant saving stays guarded',()=>{
 const b=m([100,1,44]);const p=mutantProjection(b);
 assert.deepEqual(p.manualResults.map(x=>Number(x.value)),[1,44]);
 assert.equal(p.appliedResults.length,0);
 assert.equal(mutantVerifiedEffects(b).length,0);
 assert.equal(effectiveScores(b).int,10);
 assert.match(renderBuild(b,2),/Unmapped\/conditional d100 results remain manual: 2/);
 assert(buildIssues(b).some(x=>/automated character saving is disabled/.test(x.message)));
 const other=newBuild();other.raceId='ffd20:race:tarutaru';other.mutantRolls=b.mutantRolls;
 assert.deepEqual(mutantProjection(other).scoreBonuses,{str:0,dex:0,con:0,int:0,wis:0,cha:0});
 assert.equal(mutantVerifiedEffects(other).length,0);
});
