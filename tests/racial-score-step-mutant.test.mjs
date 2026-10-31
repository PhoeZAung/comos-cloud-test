import test from 'node:test';
import assert from 'node:assert/strict';
import {registry,newBuild,effectiveScores,buildIssues,raceTraits} from '../src/features/characters/rules/build.mjs';
import {racialChoiceSpecs,pruneRacialChoices} from '../src/features/characters/rules/racial-choices.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';

const race=slug=>registry.races.find(r=>r.id==='ffd20:race:'+slug);
const chosen=(slug)=>{const b=newBuild();b.raceId=race(slug).id;return b;};
const fieldFor=(id)=>'data-rw-racial-choice="'+id+'"';

test('Hume and Immortal racial ability score picks appear in Ability Scores, not Race',()=>{
 for(const [slug,pool] of [
  ['hume','hume-2-racial-ability'],
  ['immortal','flexible-score']
 ]){
  const b=chosen(slug),id=b.raceId+':pool:'+pool;
  assert.match(renderBuild(b,1),new RegExp(fieldFor(id)));
  assert.doesNotMatch(renderBuild(b,2),new RegExp(fieldFor(id)));
 }
});

test('Mutant three source-defined score choices appear in Ability Scores and have correct signs',()=>{
 const b=chosen('mutant'),prefix=b.raceId+':pool:';
 const pools=['physical-2','mental-2','penalty-2'];
 const specs=racialChoiceSpecs(race('mutant'),raceTraits(b).traits);
 for(const name of pools){
  const id=prefix+name;
  assert(specs.some(s=>s.id===id&&s.minimum===1&&s.maximum===1));
  assert.match(renderBuild(b,1),new RegExp(fieldFor(id)));
  assert.doesNotMatch(renderBuild(b,2),new RegExp(fieldFor(id)));
 }
 b.racialChoices={
  [prefix+'physical-2']:[prefix+'physical-2:str'],
  [prefix+'mental-2']:[prefix+'mental-2:int'],
  [prefix+'penalty-2']:[prefix+'penalty-2:int']
 };
 assert.equal(effectiveScores(b).str,12);
 assert.equal(effectiveScores(b).int,10); // +2 mental and -2 penalty cancel
 assert.equal(effectiveScores(b).wis,10);
 const issues=buildIssues(b,{complete:false});
 assert(!issues.some(x=>/Physical \+2 score choice|Mental \+2 score choice|Penalty −2 score choice/.test(x.message)));
 assert(issues.some(x=>/Mutant requires random level-based ability increases/.test(x.message)),
  'Selecting scores alone must NOT remove the source-backed mutant progression blocker');
 b.racialChoices[prefix+'physical-2']=[prefix+'physical-2:wis'];
 assert(buildIssues(b,{complete:false}).some(x=>/Invalid or duplicate Physical/.test(x.message)));
});

test('Mutant score selections are pruned if its score-bearing standard trait is deactivated',()=>{
 const b=chosen('mutant'),id=b.raceId+':pool:physical-2';
 b.racialChoices[id]=[id+':str'];
 const traits=raceTraits({...b,disabledTraits:[b.raceId+':trait:ability-score-racial-traits']}).traits;
 pruneRacialChoices(b,race('mutant'),traits);
 assert.equal(b.racialChoices[id],undefined);
});
