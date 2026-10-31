import test from 'node:test';
import assert from 'node:assert/strict';
import {registry,newBuild,raceTraits,replacementFor,buildIssues,compileBuild,effectiveScores,previewBuild} from '../src/features/characters/rules/build.mjs';
import {isSupportedRaceOperation,isSupportedRaceHeritage} from '../src/features/characters/rules/race-replacement-operations.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
const race=name=>registry.races.find(r=>r.id==='ffd20:race:'+name);
function fixture(id,heritageId=''){const b=newBuild();Object.assign(b,{name:'Race audit',alignment:'True Neutral',raceId:id,classId:'ffd20:class:dancer',heritageId,reviewed:true});if(id==='ffd20:race:elvaan'){const weapon='ffd20:race:elvaan:pool:martial-background-weapon';b.racialChoices={[weapon]:[weapon+':option:longsword']};}b.hpRolls=[classHitDie(b)];b.skillRanks=fixedSkills.map(()=>0);let n=previewBuild(b).skillBudget;for(let i=0;i<fixedSkills.length&&n>0;i++){b.skillRanks[i]=1;n--;}return b;}
test('All 63 races: structurally sound manual whole-feature replacements remove only specified original traits',()=>{
 assert.equal(registry.races.length,63);
 let count=0;const distinct=new Set();
 for(const r of registry.races)for(const id of r.data.alternateTraitIds){
  if(r.id==='ffd20:race:half-breed'&&id==='ffd20:race:half-breed:trait:ancestral-arms')continue; // one-of-two chosen replacement has separate tests
  const ops=replacementFor(r,id);
  if(!ops.length||!ops.some(o=>o.resolution==='manual'&&o.scope==='whole_feature'&&o.operation==='replace')||!ops.every(o=>isSupportedRaceOperation(r,o)))continue;
  count++;distinct.add(r.id);
  const b={...newBuild(),raceId:r.id,alternateIds:[id]},racial=raceTraits(b);
  assert.deepEqual(racial.errors,[],r.name+':'+id);
  for(const op of ops.filter(o=>o.operation==='replace')){
   for(const target of op.targetFeatureIds){
    assert.ok(racial.replaced.includes(target),r.name+' missing '+target);
    assert.ok(!racial.traits.some(f=>f.id===target),r.name+' retained '+target);
   }
   for(const added of op.addsFeatureIds)assert.ok(racial.traits.some(f=>f.id===added),r.name+' missing '+added);
  }
 }
 assert.ok(count>60,'manual whole-feature replacements: '+count);
 assert.ok(distinct.size>10,'race breadth: '+distinct.size);
});
test('Unresolved/partial replacements and source-unverified modifications remain unavailable',()=>{
 for(const [name,slug] of [['beastkin','alluring'],['namazu','fast'],['syricta','dragon-type'],['sylph','improved-flight'],['seto-lion','nimble-attacks'],['trollkin','faster-healing']]){
  const r=race(name),id=r.id+':trait:'+slug,b={...newBuild(),raceId:r.id,alternateIds:[id]};
  assert.ok(raceTraits(b).errors.length>0,name);assert.ok(buildIssues(b).some(x=>/replacement/.test(x.message)),name);
  assert.match(renderBuild(b,2),new RegExp('data-rw-alternate="'+id+'" disabled'));
 }
});
test('Sample formerly blocked manual whole-feature replacements now appear without extra mandatory choice wizards',()=>{
 for(const [name,slug] of [['al-bhed','magic-resistant'],['au-ra','battle-hardened'],['bangaa','blinded'],['burmecian','cornered-fury'],['garif','unmasked'],['garlean','engineer'],['genome','resilient-soul'],['gria','bestial'],['hume','awareness'],['mandragora','bower-born']]){
  const r=race(name),id=r.id+':trait:'+slug,ops=r.data.alternateReplacements.filter(o=>o.addsFeatureIds.includes(id));
  assert.ok(ops.length&&ops.every(o=>isSupportedRaceOperation(r,o)),name);
  assert.deepEqual(raceTraits({...newBuild(),raceId:r.id,alternateIds:[id]}).errors,[]);
  const html=renderBuild({...newBuild(),raceId:r.id},2);
  assert.match(html,new RegExp('data-rw-alternate="'+id+'"'));
  assert.doesNotMatch(html,new RegExp('data-rw-alternate="'+id+'" disabled'));
 }
});
test('Heritages with automatic source score vectors replace rather than stack standard modifiers',()=>{
 const safe=[['amaljaa','brother-of-ash'],['amaljaa','mamool-ja'],['amaljaa','zun'],['au-ra','azim'],['au-ra','raen'],['au-ra','khagan'],['bangaa','bista'],['bangaa','faas'],['bangaa','ruga'],['bangaa','sanga'],['burmecian','cleyran'],['garlean','baelsar'],['garlean','galvus'],['garlean','garlond'],['palico','cait-sith'],['palico','felyne'],['mithra','keepers-of-the-moon'],['mithra','seekers-of-the-sun'],['elvaan','duskwight'],['elvaan','ishgardian'],['elvaan','san-d-orian'],['elvaan','wildwood'],['hume','cetra']];
 for(const [name,slug] of safe){
  const r=race(name),h=r.data.heritages.find(x=>x.id===r.id+':heritage:'+slug);
  assert.ok(h,name+' '+slug);assert.ok(isSupportedRaceHeritage(r,h),name+' '+slug);
  const scoreTargets=new Set(h.replacements.flatMap(o=>o.targetFeatureIds)),added=new Set(h.replacements.flatMap(o=>o.addsFeatureIds));
  const previous=r.features.filter(f=>scoreTargets.has(f.id)).flatMap(f=>f.effects).filter(e=>e.kind==='ability_score');
  const replacement=r.features.filter(f=>added.has(f.id)).flatMap(f=>f.effects).filter(e=>e.kind==='ability_score');
  assert.ok(replacement.length,name+' new score vector');
  const b={...newBuild(),raceId:r.id,heritageId:h.id},scores=effectiveScores(b);
  for(const key of ['str','dex','con','int','wis','cha'])assert.equal(scores[key],10+replacement.filter(e=>e.target==='ability_scores.'+key).reduce((sum,e)=>sum+e.value.value,0),name+' '+slug+' '+key);
  assert.doesNotMatch(renderBuild(b,2),new RegExp('value="'+h.id+'"[^>]*disabled'));
  assert.ok(!buildIssues(fixture(r.id,h.id)).some(x=>/heritage.*replacement|heritage needs|variant heritage/i.test(x.message)),name+' '+slug);
 }
});
test('Manually encoded, unresolved or choice-dependent heritage score vectors remain disabled',()=>{
 for(const [name,slug] of [['gria','cave-wyrm'],['gria','draconic'],['hypello','poroggo'],['immortal','ancients'],['immortal','unlimited'],['mandragora','alraune'],['hume','lufenian'],['tarutaru','gnome'],['goblin','moblin'],['sylph','fairy']]){
  const r=race(name),h=r.data.heritages.find(x=>x.id===r.id+':heritage:'+slug);
  assert.ok(h,name);assert.equal(isSupportedRaceHeritage(r,h),false,name);
  assert.match(renderBuild({...newBuild(),raceId:r.id},2),new RegExp('value="'+h.id+'"[^>]*disabled'));
 }
});
test('Newly supported heritage scores survive save/reopen; the creation choice is permanent',()=>{
 for(const [name,slug] of [['au-ra','raen'],['elvaan','duskwight'],['mithra','keepers-of-the-moon'],['bangaa','bista']]){
  const r=race(name),h=r.data.heritages.find(x=>x.id===r.id+':heritage:'+slug),b=fixture(r.id,h.id),sheet=compileBuild(b),reopened=compileBuild(sheet.rulesBuild.input,sheet);
  for(const key of ['str','dex','con','int','wis','cha'])assert.equal(reopened[key],effectiveScores(b)[key],name+' '+key);
  assert.equal(reopened.rulesBuild.input.heritageId,h.id);
  const invalid=structuredClone(reopened.rulesBuild.input);invalid.heritageId='';
  assert.throws(()=>compileBuild(invalid,reopened),/permanent/);
 }
});
