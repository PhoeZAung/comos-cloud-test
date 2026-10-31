import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,raceFor,raceTraits,replacementFor,buildIssues} from '../src/features/characters/rules/build.mjs';
import {isSupportedRaceOperation} from '../src/features/characters/rules/race-replacement-operations.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';

const id=(race,slug)=>'ffd20:race:'+race+':trait:'+slug;
const feature=(b,slug)=>raceTraits(b).traits.find(f=>f.id===id(b.raceId.split(':').at(-1),slug));
function fixture(race,alts=[]){
 const b=newBuild();
 Object.assign(b,{name:'Partial race review',alignment:'True Neutral',raceId:'ffd20:race:'+race,
  classId:'ffd20:class:monk',hpRolls:[],alternateIds:alts.map(x=>id(race,x)),reviewed:true});
 b.hpRolls=[classHitDie(b)];
 b.skillRanks=fixedSkills.map(()=>0);
 let remaining=previewBuild(b).skillBudget;
 for(let i=0;i<fixedSkills.length&&remaining>0;i++){b.skillRanks[i]=1;remaining--;}
 return b;
}

test('only the three exact source-bound operation groups are enabled',()=>{
 for(const [race,slug,count,replaceTargets,modifyTargets] of [
  ['sylph','improved-flight',2,['camouflage','beguiling-liar'],['base-speed']],
  ['trollkin','faster-healing',1,['thick-skin','fast-healing'],[]],
  ['forgiven','scion-of-mortality',1,[],['languages','type']]
 ]){
  const def=raceFor(fixture(race)),fid=id(race,slug),ops=replacementFor(def,fid);
  assert.equal(ops.length,count);
  assert.ok(ops.every(op=>isSupportedRaceOperation(def,op)),race+' whitelist');
  assert.deepEqual(ops.filter(op=>op.operation==='replace').flatMap(op=>op.targetFeatureIds),
   replaceTargets.map(x=>id(race,x)));
  assert.deepEqual(ops.filter(op=>op.operation==='modify').flatMap(op=>op.targetFeatureIds),
   modifyTargets.map(x=>id(race,x)));
  for(const op of ops.filter(op=>op.operation==='modify')){
   assert.equal(isSupportedRaceOperation(def,{...op,id:op.id+':unknown'}),false);
   assert.equal(isSupportedRaceOperation(def,{...op,targetFeatureIds:[id(race,'size')]}),false);
   assert.equal(isSupportedRaceOperation(def,{...op,operation:'replace'}),false);
  }
  const empty=fixture(race),html=renderBuild(empty,2,{mode:'create'});
  const control=html.match(new RegExp('<input[^>]*data-rw-alternate="'+fid+'"[^>]*>'));
  assert.ok(control,'wizard control '+fid);
  assert.doesNotMatch(control[0],/disabled/);
  assert.deepEqual(raceTraits(fixture(race,[slug])).errors,[]);
 }
});

test('Sylph Improved Flight preserves base movement feature, loses only Camouflage/Beguiling and flies good',()=>{
 const plain=fixture('sylph'),modified=fixture('sylph',['improved-flight']);
 assert.deepEqual(buildIssues(modified),[]);
 const original=compileBuild(plain),saved=compileBuild(modified);
 assert.equal(original.speed,20);
 assert.equal(original.speed_fly,40);
 assert.equal(original.speed_fly_maneuverability,'poor');
 assert.equal(saved.speed,10);
 assert.equal(saved.speed_fly,60);
 assert.equal(saved.speed_fly_maneuverability,'good');
 assert.ok(feature(modified,'base-speed'));
 assert.ok(!feature(modified,'camouflage'));
 assert.ok(!feature(modified,'beguiling-liar'));
 assert.ok(feature(modified,'improved-flight'));
 for(const keep of ['elemental-resistance','magic-resistant','fey-magic','low-light-vision'])
  assert.ok(feature(modified,keep),'unrelated '+keep+' retained');
 assert.equal(feature(modified,'base-speed').effects.find(e=>e.target==='identity.speed.land').value.value,10);
 assert.equal(feature(modified,'base-speed').effects.find(e=>e.target==='identity.speed.fly').value.value,60);
 const reopened=compileBuild(saved.rulesBuild.input,saved);
 assert.equal(reopened.speed,10);
 assert.equal(reopened.speed_fly,60);
 assert.equal(reopened.speed_fly_maneuverability,'good');
 const edited=mergeSheetData(saved,{action:'fields',fields:{speed_fly:0,speed_fly_maneuverability:'clumsy'}});
 const back=compileBuild(edited.rulesBuild.input,edited);
 assert.equal(back.speed_fly,0,'manual zero preserved');
 assert.equal(back.speed_fly_maneuverability,'clumsy','manual maneuverability preserved');
 const conflict=fixture('sylph',['improved-flight','dirty-trickster']);
 assert.ok(raceTraits(conflict).errors.some(x=>/Two selections replace/.test(x)));
 const disabled=fixture('sylph',['improved-flight']);
 disabled.disabledTraits=[id('sylph','base-speed')];
 assert.ok(raceTraits(disabled).errors.some(x=>/disabled/.test(x)));
 const removed=structuredClone(saved.rulesBuild.input);removed.alternateIds=[];
 assert.throws(()=>compileBuild(removed,saved),/permanent/);
});

test('Trollkin Faster Healing removes both former rate and Thick Skin, displays 2 HP/tick without stacking',()=>{
 const standard=fixture('trollkin'),modified=fixture('trollkin',['faster-healing']);
 assert.deepEqual(buildIssues(modified),[]);
 assert.ok(feature(standard,'thick-skin'));
 assert.ok(feature(standard,'fast-healing'));
 assert.ok(!feature(modified,'thick-skin'));
 assert.ok(!feature(modified,'fast-healing'));
 assert.ok(feature(modified,'fearless'));
 const alt=feature(modified,'faster-healing');
 assert.match(alt.description,/2 HP each round/);
 assert.match(alt.description,/replaces Fast Healing 1 and Thick Skin/);
 assert.match(alt.description,/fire or earth/);
 const compiled=compileBuild(modified),plain=compileBuild(standard);
 assert.equal(compiled.speed,30);
 assert.equal(compiled.ac_natural||0,0);
 assert.equal(plain.ac_natural||0,0,'existing baseline Thick Skin remains a manual trait');
 assert.equal(compiled.racialAbilities.filter(x=>x.sourceRuleId===id('trollkin','faster-healing')).length,1);
 assert.ok(!compiled.racialAbilities.some(x=>x.sourceRuleId===id('trollkin','fast-healing')));
 const reopened=compileBuild(compiled.rulesBuild.input,compiled);
 assert.equal(reopened.racialAbilities.filter(x=>x.sourceRuleId===id('trollkin','faster-healing')).length,1);
 const conflict=fixture('trollkin',['faster-healing','thicker-skin']);
 assert.ok(raceTraits(conflict).errors.some(x=>/Two selections replace/.test(x)));
 const disabled=fixture('trollkin',['faster-healing']);disabled.disabledTraits=[id('trollkin','thick-skin')];
 assert.ok(raceTraits(disabled).errors.some(x=>/disabled/.test(x)));
 const removed=structuredClone(compiled.rulesBuild.input);removed.alternateIds=[];
 assert.throws(()=>compileBuild(removed,compiled),/permanent/);
});

test('Forgiven Scion removes Celestial only, retains outsider/native and all other traits',()=>{
 const standard=fixture('forgiven'),modified=fixture('forgiven',['scion-of-mortality']);
 assert.deepEqual(buildIssues(modified),[]);
 assert.ok(feature(modified,'type'));assert.ok(feature(modified,'languages'));
 assert.ok(feature(modified,'skill-bonus'));
 assert.ok(feature(modified,'darkvision'));
 assert.ok(feature(modified,'scion-of-mortality'));
 assert.equal(feature(modified,'languages').effects.some(e=>e.target==='identity.languages.celestial'),false);
 assert.ok(feature(modified,'languages').effects.some(e=>e.target==='identity.languages.common'));
 assert.ok(feature(modified,'type').effects.some(e=>e.target==='identity.type'&&e.textValue==='outsider'));
 assert.ok(feature(modified,'type').effects.some(e=>e.target==='identity.subtypes'&&e.textValue==='native'));
 assert.match(feature(modified,'type').description,/humanoid \(hume\)/);
 const plain=compileBuild(standard),compiled=compileBuild(modified);
 assert.match(plain.languages,/Celestial/);
 assert.equal(compiled.languages,'Common');
 assert.equal(compiled.racialIdentity.type,'Outsider');
 assert.deepEqual(compiled.racialIdentity.subtypes,['native']);
 assert.ok(compiled.racialAbilities.some(x=>x.sourceRuleId===id('forgiven','scion-of-mortality')));
 const reopened=compileBuild(compiled.rulesBuild.input,compiled);
 assert.equal(reopened.languages,'Common');
 assert.equal(reopened.racialAbilities.filter(x=>x.sourceRuleId===id('forgiven','scion-of-mortality')).length,1);
 const removed=structuredClone(compiled.rulesBuild.input);removed.alternateIds=[];
 assert.throws(()=>compileBuild(removed,compiled),/permanent/);
 const disabled=fixture('forgiven',['scion-of-mortality']);disabled.disabledTraits=[id('forgiven','languages')];
 assert.ok(raceTraits(disabled).errors.some(x=>/disabled/.test(x)));
});
