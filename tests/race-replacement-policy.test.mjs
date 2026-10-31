import test from 'node:test';
import assert from 'node:assert/strict';
import {registry,newBuild,raceTraits,replacementFor,effectiveScores,previewBuild,compileBuild,buildIssues} from '../src/features/characters/rules/build.mjs';
import {replacementRequiresWizard} from '../src/features/characters/rules/racial-choices.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
const raceId=name=>'ffd20:race:'+name;
function fixture(race,alternate=''){
 const b=newBuild();Object.assign(b,{name:'Racial Replacements',alignment:'True Neutral',raceId:raceId(race),classId:'ffd20:class:dancer',alternateIds:alternate?[raceId(race)+':'+(race==='dwarf'?'feature':'trait')+':'+alternate]:[],reviewed:true});
 if(race==='hume'){const pool=raceId('hume')+':pool:hume-2-racial-ability';b.racialChoices={[pool]:[pool+':option:strength']};}
 b.hpRolls=[classHitDie(b)];b.skillRanks=fixedSkills.map(()=>0);
 let budget=previewBuild(b).skillBudget;
 for(let i=0;i<fixedSkills.length&&budget>0;i++){b.skillRanks[i]=1;budget--;}
 return b;
}
test('Dwarf Mountain Familarity works by source replacement without mandatory terrain picker',()=>{
 const b=fixture('dwarf','mountain-familarity'),racial=raceTraits(b);
 assert.deepEqual(racial.errors,[]);
 assert.ok(racial.replaced.includes(raceId('dwarf')+':feature:bond-to-the-land'));
 assert.ok(!racial.traits.some(f=>f.id===raceId('dwarf')+':feature:bond-to-the-land'));
 assert.ok(racial.traits.some(f=>f.name==='Mountain Familarity'));
 const html=renderBuild(b,2),match=html.match(/<input[^>]*data-rw-alternate="ffd20:race:dwarf:feature:mountain-familarity"[^>]*>/);
 assert.ok(match);assert.doesNotMatch(match[0],/disabled/);
 assert.doesNotMatch(html,/data-rw-racial-choice="ffd20:race:dwarf:pool:mountain-familarity-landscape"/);
 assert.match(html,/Record this choice on your sheet/);
 assert.match(html,/mountains and hills/);
 assert.ok(!buildIssues(b).some(x=>/Mountain Familarity|precise replacement/i.test(x.message)));
 const saved=compileBuild(b);
 assert.ok(saved.racialAbilities.some(x=>x.sourceRuleId===raceId('dwarf')+':feature:mountain-familarity'));
 assert.ok(!saved.racialAbilities.some(x=>x.sourceRuleId===raceId('dwarf')+':feature:bond-to-the-land'));
 assert.equal(saved.ac_temp||0,0);
 assert.deepEqual(compileBuild(saved.rulesBuild.input,saved).rulesBuild.input.alternateIds,b.alternateIds);
});
test('Resolved Dwarf alternates can stack when independent and reject conflicting replacement targets',()=>{
 const b=fixture('dwarf');b.alternateIds=[raceId('dwarf')+':feature:mountain-familarity',raceId('dwarf')+':feature:magic-resistant'];
 assert.deepEqual(raceTraits(b).errors,[]);
 const compiled=compileBuild(b);assert.ok(compiled.racialAbilities.some(f=>f.name==='Magic Resistant'));
 const salt=fixture('dwarf');salt.alternateIds=[raceId('dwarf')+':feature:saltbeard'];
 assert.deepEqual(raceTraits(salt).errors,[]);
 assert.ok(raceTraits(salt).traits.some(f=>f.id===raceId('dwarf')+':feature:greed'&&/under water/.test(f.description)));
 assert.doesNotThrow(()=>compileBuild(salt));
 const conflict=fixture('dwarf');conflict.alternateIds=[raceId('dwarf')+':feature:healthy',raceId('dwarf')+':feature:magic-resistant'];
 assert.ok(raceTraits(conflict).errors.some(x=>/Two selections replace/.test(x)));
});
test('Hume alternate changes only targeted bonus feat or Skilled and keeps unrelated entitlements',()=>{
 const awareness=fixture('hume','awareness');
 const originalFeat=raceId('hume')+':trait:bonus-feat';
 assert.ok(raceTraits(awareness).replaced.includes(originalFeat));
 assert.equal(previewBuild(awareness).skillBudget,previewBuild(fixture('hume')).skillBudget);
 const saved=compileBuild(awareness);
 assert.ok(!saved.feats.some(x=>x.sourceRuleId===raceId('hume')+':bonus-feat:level-1'));
 const schooling=fixture('hume','comprehensive-education');
 assert.ok(raceTraits(schooling).replaced.includes(raceId('hume')+':trait:skilled'));
 assert.equal(previewBuild(schooling).skillBudget,previewBuild(fixture('hume')).skillBudget-1);
 assert.ok(compileBuild(schooling).feats.some(x=>x.sourceRuleId===raceId('hume')+':bonus-feat:level-1'));
 const unsupported=fixture('hume','dual-talent');
 assert.ok(replacementRequiresWizard(registry.races.find(r=>r.id===unsupported.raceId),registry.races.find(r=>r.id===unsupported.raceId).features.find(f=>f.id===unsupported.alternateIds[0])));
 assert.ok(buildIssues(unsupported).some(x=>/structured choice/.test(x.message)));
});
test('Generic resolved replacements stay available across source registry while partial replacements remain disabled',()=>{
 let eligible=0,manual=0;
 for(const race of registry.races){
  const base=newBuild();base.raceId=race.id;
  const html=renderBuild(base,2);
  for(const id of race.data.alternateTraitIds){
   const feature=race.features.find(f=>f.id===id);
   const ops=replacementFor(race,id);
   const full=ops.length>0&&ops.every(op=>op.resolution==='resolved'&&op.operation==='replace'&&op.scope==='whole_feature');
   const requires=full&&replacementRequiresWizard(race,feature);
   const input=html.match(new RegExp('<input[^>]*data-rw-alternate="'+id+'"[^>]*>'));
   assert.ok(input,'missing alternate control for '+id);
   if(!full||requires)continue;
   eligible++;
   if((feature.choicePoolIds||[]).length)manual++;
   assert.doesNotMatch(input[0],/disabled/,'fully resolved replacement should be selectable: '+id);
   const alt={...base,alternateIds:[id]},result=raceTraits(alt);
   assert.deepEqual(result.errors,[],'resolved replacement engine errors: '+id);
   for(const op of ops){
    for(const target of op.targetFeatureIds){
     assert.ok(result.replaced.includes(target),'missing replacement '+id+' → '+target);
     assert.ok(!result.traits.some(f=>f.id===target),'replaced standard trait still active: '+id+' → '+target);
    }
    for(const added of op.addsFeatureIds)assert.ok(result.traits.some(f=>f.id===added),'replacement not granted: '+added);
   }
  }
 }
 assert.ok(eligible>100,'expected many reviewed whole-feature alternates');
 assert.ok(manual>0,'must cover manual-only source choices');
});
test('Heritage and alternate selections are permanent after save, but source descriptions remain editable',()=>{
 const initial=fixture('dwarf','mountain-familarity'),saved=compileBuild(initial);
 assert.doesNotThrow(()=>compileBuild(saved.rulesBuild.input,saved));
 const removed=structuredClone(saved.rulesBuild.input);removed.alternateIds=[];
 assert.throws(()=>compileBuild(removed,saved),/permanent/);
 const swapped=structuredClone(saved.rulesBuild.input);swapped.alternateIds=[raceId('dwarf')+':feature:magic-resistant'];
 assert.throws(()=>compileBuild(swapped,saved),/permanent/);
 const baseline=compileBuild(fixture('dwarf')),added=structuredClone(baseline.rulesBuild.input);
 added.alternateIds=[raceId('dwarf')+':feature:mountain-familarity'];
 assert.throws(()=>compileBuild(added,baseline),/permanent/);
 const heritage=fixture('dwarf');heritage.heritageId=raceId('dwarf')+':heritage:tomran';
 const initialHeritage=compileBuild(heritage),change=structuredClone(initialHeritage.rulesBuild.input);
 change.heritageId=raceId('dwarf')+':heritage:firstborn';
 assert.throws(()=>compileBuild(change,initialHeritage),/permanent/);
});
