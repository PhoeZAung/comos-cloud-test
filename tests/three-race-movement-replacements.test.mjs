import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,buildIssues,raceTraits,raceFor,replacementFor} from '../src/features/characters/rules/build.mjs';
import {isSupportedRaceOperation} from '../src/features/characters/rules/race-replacement-operations.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';

const id=(race,slug)=>'ffd20:race:'+race+':trait:'+slug;
const traits=b=>raceTraits(b).traits;
const has=(b,f)=>traits(b).some(t=>t.id===f);
const racial=(s,f)=>s.racialAbilities.find(t=>t.sourceRuleId===f);
const row=(s,n)=>s.skills.find(t=>t.name===n);

function fixture(race,alts=[]){
 const b=newBuild();
 Object.assign(b,{name:'Racial speed audit',alignment:'True Neutral',raceId:'ffd20:race:'+race,
  classId:'ffd20:class:monk',alternateIds:alts.map(x=>id(race,x)),hpRolls:[12],reviewed:true});
 b.skillRanks=fixedSkills.map(()=>0);
 let remaining=previewBuild(b).skillBudget;
 for(let i=0;i<fixedSkills.length&&remaining>0;i++){b.skillRanks[i]=1;remaining--;}
 return b;
}

test('source-specific operations are exact and reject invented targets',()=>{
 for(const [race,slug,sourceScope,targets,expectedOps] of [
  ['moomba','climb','whole_feature',[],1],
  ['namazu','fast','partial_feature',['skilled-traders','base-speed'],2],
  ['seto-lion','faster','partial_feature',['claws'],2],
  ['seto-lion','nimble-attacks','partial_feature',['bite','fast'],3]
 ]){
  const b=fixture(race),def=raceFor(b),f=id(race,slug);
  const original=def.data.alternateReplacements.find(x=>x.id===f+':replacement');
  assert.equal(original.scope,sourceScope);
  assert.deepEqual(original.targetFeatureIds,targets.map(t=>id(race,t)));
  const ops=replacementFor(def,f);
  assert.equal(ops.length,expectedOps);
  assert.ok(ops.every(x=>isSupportedRaceOperation(def,x)),race+' '+slug);
  const modifier=ops.find(x=>x.operation==='modify');
  assert.deepEqual(modifier.targetFeatureIds,[id(race,'base-speed')]);
  assert.equal(isSupportedRaceOperation(def,{...modifier,targetFeatureIds:[id(race,'size')]}),false);
  assert.equal(isSupportedRaceOperation(def,{...modifier,addsFeatureIds:[]}),false);
  const html=renderBuild(b,2,{mode:'create'});
  const input=html.match(new RegExp('<input[^>]*data-rw-alternate="'+f+'"[^>]*>'));
  assert.ok(input);assert.doesNotMatch(input[0],/disabled/);
 }
});

test('Moomba Climb reduces land 40→30 and grants climb 20 with source +8 skill bonus',()=>{
 const normal=fixture('moomba'),b=fixture('moomba',['climb']);
 assert.equal(raceTraits(b).errors.length,0);
 assert.equal(buildIssues(b).length,0);
 assert.equal(compileBuild(normal).speed,40);
 const sheet=compileBuild(b);
 assert.equal(sheet.speed,30);assert.equal(sheet.speed_climb,20);
 assert.equal(row(sheet,'Climb').rulesBonus-row(compileBuild(normal),'Climb').rulesBonus,8);
 assert.ok(has(b,id('moomba','bite')));
 assert.ok(has(b,id('moomba','vocal-failure')));
 assert.ok(racial(sheet,id('moomba','climb')));
 const reopened=compileBuild(sheet.rulesBuild.input,sheet);
 assert.equal(reopened.speed_climb,20);assert.equal(row(reopened,'Climb').rulesBonus,row(sheet,'Climb').rulesBonus);
 assert.equal(reopened.speed,30);
 const altered=mergeSheetData(sheet,{action:'fields',fields:{speed_climb:0}});
 assert.equal(compileBuild(altered.rulesBuild.input,altered).speed_climb,0,'user zero preserved');
 const removed=structuredClone(sheet.rulesBuild.input);removed.alternateIds=[];
 assert.throws(()=>compileBuild(removed,sheet),/permanent/);
 const disabled=fixture('moomba',['climb']);disabled.disabledTraits=[id('moomba','base-speed')];
 assert.ok(raceTraits(disabled).errors.some(x=>/disabled/.test(x)));
});

test('Namazu Fast replaces Skilled Traders only; land 30→40, swim stays 30',()=>{
 const normal=fixture('namazu'),b=fixture('namazu',['fast']);
 assert.deepEqual(raceTraits(b).errors,[]);
 assert.equal(buildIssues(b).length,0);
 assert.ok(has(normal,id('namazu','skilled-traders')));
 assert.ok(!has(b,id('namazu','skilled-traders')));
 assert.ok(has(b,id('namazu','festive-culture')));
 assert.ok(has(b,id('namazu','water-sense')));
 assert.ok(has(b,id('namazu','base-speed')));
 assert.equal(compileBuild(normal).speed,30);
 const sheet=compileBuild(b);
 assert.equal(sheet.speed,40);assert.equal(sheet.speed_swim,30);
 assert.ok(!racial(sheet,id('namazu','skilled-traders')));
 assert.ok(racial(sheet,id('namazu','fast')));
 assert.equal(compileBuild(sheet.rulesBuild.input,sheet).speed_swim,30);
 const amended=mergeSheetData(sheet,{action:'fields',fields:{speed_swim:0}});
 assert.equal(compileBuild(amended.rulesBuild.input,amended).speed_swim,0);
 const changed=structuredClone(sheet.rulesBuild.input);changed.alternateIds=[];
 assert.throws(()=>compileBuild(changed,sheet),/permanent/);
 const focused=fixture('namazu',['focused-study']);
 assert.ok(buildIssues(focused).some(x=>/unresolved replacement|precise replacement/i.test(x.message)),'Focused Study remains blocked');
});

test('Seto Lion Faster retains Fast and quadruped but replaces Claws: speed 60',()=>{
 const normal=fixture('seto-lion'),b=fixture('seto-lion',['faster']);
 assert.deepEqual(raceTraits(b).errors,[]);
 const sheet=compileBuild(b);
 assert.equal(compileBuild(normal).speed,50);
 assert.equal(sheet.speed,60);
 assert.ok(!has(b,id('seto-lion','claws')));
 assert.ok(has(b,id('seto-lion','fast')));
 assert.ok(has(b,id('seto-lion','quadruped')));
 assert.ok(has(b,id('seto-lion','bite')));
 assert.ok(racial(sheet,id('seto-lion','faster')));
 assert.equal(compileBuild(sheet.rulesBuild.input,sheet).speed,60);
});

test('Seto Lion Nimble Attacks removes Bite and Fast, preserves claws/Quadruped: speed 40',()=>{
 const b=fixture('seto-lion',['nimble-attacks']);
 assert.deepEqual(raceTraits(b).errors,[]);
 const sheet=compileBuild(b);
 assert.equal(sheet.speed,40);
 assert.ok(!has(b,id('seto-lion','bite')));
 assert.ok(!has(b,id('seto-lion','fast')));
 assert.ok(has(b,id('seto-lion','claws')));
 assert.ok(has(b,id('seto-lion','quadruped')));
 assert.ok(racial(sheet,id('seto-lion','nimble-attacks')));
 assert.match(racial(sheet,id('seto-lion','nimble-attacks')).desc,/Weapon Finesse/);
 assert.equal(compileBuild(sheet.rulesBuild.input,sheet).speed,40);
});

test('Seto Lion compatible Faster plus Nimble Attacks combine to land 50 with no double count',()=>{
 const b=fixture('seto-lion',['faster','nimble-attacks']);
 assert.deepEqual(raceTraits(b).errors,[]);
 const compiled=compileBuild(b);
 assert.equal(compiled.speed,50);
 for(const removed of ['claws','bite','fast'])assert.ok(!has(b,id('seto-lion',removed)));
 assert.ok(has(b,id('seto-lion','quadruped')));
 assert.ok(compiled.racialAbilities.some(x=>x.sourceRuleId===id('seto-lion','faster')));
 assert.ok(compiled.racialAbilities.some(x=>x.sourceRuleId===id('seto-lion','nimble-attacks')));
 assert.equal(compileBuild(compiled.rulesBuild.input,compiled).speed,50);
 const conflict=fixture('seto-lion',['nimble-attacks','jumper']);
 assert.ok(raceTraits(conflict).errors.some(x=>/Two selections replace/.test(x)));
 assert.throws(()=>compileBuild(conflict));
 const edited=mergeSheetData(compiled,{action:'fields',fields:{speed:55}});
 assert.equal(compileBuild(edited.rulesBuild.input,edited).speed,55);
});
