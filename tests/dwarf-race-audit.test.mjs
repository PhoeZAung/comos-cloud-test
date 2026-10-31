import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,effectiveScores,compileBuild,previewBuild,raceTraits,buildIssues} from '../src/features/characters/rules/build.mjs';
import {DWARF_ID,DWARF_LANGUAGES} from '../src/features/characters/rules/racial-progress.mjs';
import {racialChoiceSpecs} from '../src/features/characters/rules/racial-choices.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
const lang=s=>DWARF_ID+':option:high-intelligence-bonus-languages-'+s;
function fixture(heritage=''){
 const b=newBuild();Object.assign(b,{name:'Dwarf Audit',alignment:'Lawful Neutral',raceId:DWARF_ID,classId:'ffd20:class:dancer',heritageId:heritage,hpRolls:[],reviewed:true});
 b.baseScores.int=12;b.hpRolls=[classHitDie(b)];
 b.skillRanks=fixedSkills.map(()=>0);for(let i=0,remaining=previewBuild(b).skillBudget;i<fixedSkills.length&&remaining>0;i++){b.skillRanks[i]=1;remaining--;}
 return b;
}
test('Dwarf high INT language source list is available only on ability score step',()=>{
 const b=fixture();
 const race=renderBuild(b,2),scores=renderBuild(b,1,{mode:'create'});
 assert.doesNotMatch(race,/data-rw-language-slot/);
 assert.match(scores,/data-rw-language-slot="ffd20:race:dwarf:pool:high-intelligence-bonus-languages"/);
 assert.match(scores,/Galkan/);assert.match(scores,/Lalafellan/);
 assert.equal((scores.match(/data-rw-language-slot=/g)||[]).length,1);
 b.racialChoices={[DWARF_LANGUAGES]:[lang('goblin')]};
 assert.equal(compileBuild(b).languages,'Common, Dwarven, Goblin');
 assert.equal(compileBuild(compileBuild(b).rulesBuild.input).languages,'Common, Dwarven, Goblin');
 const dup=fixture();dup.racialChoices={[DWARF_LANGUAGES]:[lang('goblin'),lang('goblin')]};
 assert.throws(()=>compileBuild(dup),/duplicate/i);
 const outsider=fixture();outsider.racialChoices={[DWARF_LANGUAGES]:[lang('celestial')]};
 assert.throws(()=>compileBuild(outsider),/Invalid/i);
 const low=fixture();low.baseScores.int=10;assert.doesNotMatch(renderBuild(low,1,{mode:'create'}),/data-rw-language-slot/);
 const inactive=fixture();inactive.disabledTraits=['ffd20:race:dwarf:feature:languages'];inactive.racialChoices={[DWARF_LANGUAGES]:[lang('goblin')]};
 assert.throws(()=>compileBuild(inactive),/inactive|Unknown/);
});
test('All four Dwarf heritage scores replace the standard racial vector and persist on reapplication',()=>{
 const cases={
  'conde-petie':{str:8,con:12,int:12,wis:12,cha:10},
  firstborn:{str:10,con:12,int:14,wis:10,cha:8},
  lilty:{str:12,dex:8,con:10,int:14,wis:10,cha:10},
  tomran:{str:10,dex:8,con:12,int:12,wis:12,cha:10}
 };
 for(const [heritage,expected] of Object.entries(cases)){
  const b=fixture(DWARF_ID+':heritage:'+heritage),scores=effectiveScores(b);
  for(const [key,value] of Object.entries(expected))assert.equal(scores[key],value,heritage+' '+key);
  const racial=raceTraits(b);assert.ok(racial.replaced.includes(DWARF_ID+':feature:ability-score-racial-traits'));
  assert.ok(racial.replaced.includes(DWARF_ID+':feature:hatred'));
  assert.ok(!buildIssues(b).some(x=>/Heritage replacement|Invalid heritage/.test(x.message)));
  const saved=compileBuild(b);for(const [key,value] of Object.entries(expected))assert.equal(saved[key],value);
  const reopened=compileBuild(saved.rulesBuild.input,saved);
  for(const [key,value] of Object.entries(expected))assert.equal(reopened[key],value);
  assert.equal(reopened.rulesBuild.input.heritageId,b.heritageId);
  assert.match(renderBuild(b,2),/Effective racial ability adjustments/);
 }
});
test('Firstborn or Lilty racial INT increases expand allowed starting languages without rewriting source pool',()=>{
 for(const heritage of ['firstborn','lilty']){
  const b=fixture(DWARF_ID+':heritage:'+heritage);
  assert.equal((renderBuild(b,1,{mode:'create'}).match(/data-rw-language-slot=/g)||[]).length,2);
  b.racialChoices={[DWARF_LANGUAGES]:[lang('galkan'),lang('orc')]};
  assert.match(compileBuild(b).languages,/Galkan, Orc/);
 }
});
