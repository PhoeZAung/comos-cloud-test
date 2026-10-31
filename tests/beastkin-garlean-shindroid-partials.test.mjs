import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,buildIssues,effectiveScores,raceFor,raceTraits,replacementFor} from '../src/features/characters/rules/build.mjs';
import {isSupportedRaceOperation} from '../src/features/characters/rules/race-replacement-operations.mjs';
import {GARLEAN_LANGUAGES,GARLEAN_WEAPON,GARLEAN_CRAFT} from '../src/features/characters/rules/racial-progress.mjs';
import {racialChoiceSpecs,pruneRacialChoices} from '../src/features/characters/rules/racial-choices.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
const id=(race,slug)=>'ffd20:race:'+race+':trait:'+slug;
const option=(pool,slug)=>pool+':option:'+slug;
const active=(b,slug)=>raceTraits(b).traits.find(f=>f.id===id(b.raceId.split(':').at(-1),slug));
function fixture(race,alts=[],scores={}){
 const b=newBuild();
 Object.assign(b,{name:'Race batch review',alignment:'True Neutral',raceId:'ffd20:race:'+race,classId:'ffd20:class:monk',
   alternateIds:alts.map(slug=>id(race,slug)),hpRolls:[12],reviewed:true});
 Object.assign(b.baseScores,scores);
 if(race==='garlean'){
  b.racialChoices={[GARLEAN_WEAPON]:[option(GARLEAN_WEAPON,'firearms-simple')],[GARLEAN_CRAFT]:['skill-row:4']};
  b.racialSpecialties={[GARLEAN_CRAFT]:'Mechanical'};
 }
 b.skillRanks=fixedSkills.map(()=>0);
 let budget=previewBuild(b).skillBudget;
 for(let i=0;i<fixedSkills.length&&budget>0;i++){b.skillRanks[i]=1;budget--;}
 return b;
}
const choicesHtml=(b,slug)=>{
 const html=renderBuild({...b,alternateIds:[]},2,{mode:'create'}),fid=id(b.raceId.split(':').at(-1),slug);
 const input=html.match(new RegExp('<input[^>]*data-rw-alternate="'+fid+'"[^>]*>'));
 assert.ok(input,'alternate input exists: '+fid);
 assert.doesNotMatch(input[0],/disabled/,fid+' selectable');
};
test('Exact source-derived operations only unblock reviewed Beastkin/Garlean/Shindroid components',()=>{
 for(const [race,slug,count] of [
  ['beastkin','alluring',1],['beastkin','light-build',1],['beastkin','loper',2],
  ['garlean','xenophobia-extremis',1],['shindroid','heavy-platform',1],['shindroid','anomaly',2]
 ]){
  const b=fixture(race),r=raceFor(b),ops=replacementFor(r,id(race,slug));
  assert.equal(ops.length,count,race+' '+slug);
  assert.ok(ops.every(op=>isSupportedRaceOperation(r,op)),race+' '+slug);
  for(const op of ops.filter(o=>o.operation==='modify')){
   assert.equal(isSupportedRaceOperation(r,{...op,targetFeatureIds:[id(race,'size')]}),false);
   assert.equal(isSupportedRaceOperation(r,{...op,operation:'replace'}),false);
  }
  choicesHtml(b,slug);
 }
 for(const [race,slug] of [['beastkin','feral'],['shindroid','hologram-simulation']]){
  const b=fixture(race,[slug]);
  assert.ok(raceTraits(b).errors.length>0,race+' '+slug+' still blocked');
  assert.ok(buildIssues(b).some(x=>/replacement/.test(x.message)));
 }
});
test('Beastkin Alluring swaps only WIS→CHA, Light Build swaps STR→DEX; both preserve -2 INT',()=>{
 const scenarios=[
  [[],{str:12,dex:10,int:8,wis:12,cha:10}],
  [['alluring'],{str:12,dex:10,int:8,wis:10,cha:12}],
  [['light-build'],{str:10,dex:12,int:8,wis:12,cha:10}],
  [['alluring','light-build'],{str:10,dex:12,int:8,wis:10,cha:12}],
  [['light-build','alluring'],{str:10,dex:12,int:8,wis:10,cha:12}]
 ];
 for(const [alts,expected] of scenarios){
  const b=fixture('beastkin',alts);
  assert.deepEqual(raceTraits(b).errors,[],alts.join('+'));
  const scores=effectiveScores(b);
  for(const [key,value] of Object.entries(expected))assert.equal(scores[key],value,alts.join('+')+' '+key);
  const saved=compileBuild(b),twice=compileBuild(saved.rulesBuild.input,saved);
  for(const key of Object.keys(expected))assert.equal(twice[key],expected[key]);
  assert.deepEqual(twice.rulesBuild.input.alternateIds,b.alternateIds);
  for(const preserved of ['natural-armor','sprinter','hunter','languages'])assert.ok(active(b,preserved),preserved);
 }
 const b=fixture('beastkin',['alluring']);b.disabledTraits=[id('beastkin','ability-score-racial-traits')];
 assert.ok(raceTraits(b).errors.some(x=>/disabled/.test(x)));
 assert.throws(()=>compileBuild(b),{code:'INVALID_CHARACTER'});
});
test('Beastkin Loper removes natural armor and raises base speed while retaining only conditional Sprinter',()=>{
 const normal=compileBuild(fixture('beastkin')),b=fixture('beastkin',['loper']);
 assert.deepEqual(raceTraits(b).errors,[]);
 assert.equal(normal.speed,30);assert.equal(normal.ac_natural,1);
 assert.ok(!active(b,'natural-armor'));
 assert.ok(active(b,'sprinter'));
 assert.ok(active(b,'loper'));
 const saved=compileBuild(b);
 assert.equal(saved.speed,40);assert.equal(saved.ac_natural||0,0);
 assert.match(active(b,'base-speed').description,/Sprinter remains/);
 assert.equal(compileBuild(saved.rulesBuild.input,saved).speed,40);
 const conflicting=fixture('beastkin',['loper','cold-acclimated']);
 assert.ok(raceTraits(conflicting).errors.some(x=>/Two selections replace/.test(x)));
 const removed=structuredClone(saved.rulesBuild.input);removed.alternateIds=[];
 assert.throws(()=>compileBuild(removed,saved),/permanent/);
});
test('Garlean Xenophobia Extremis changes only WIS penalty to CHA and preserves Common without INT languages',()=>{
 const normal=fixture('garlean',[],{int:14});
 const chosen=fixture('garlean',['xenophobia-extremis'],{int:14});
 assert.equal(compileBuild(normal).wis,8);
 assert.deepEqual(raceTraits(chosen).errors,[]);
 const sheet=compileBuild(chosen);
 assert.equal(sheet.con,12);assert.equal(sheet.int,16);assert.equal(sheet.wis,10);assert.equal(sheet.cha,8);
 assert.equal(sheet.languages,'Common');
 assert.ok(active(chosen,'languages'));
 assert.ok(active(chosen,'ability-score-adjustment'));
 assert.ok(active(chosen,'xenophobia-extremis'));
 assert.equal(racialChoiceSpecs(raceFor(chosen),raceTraits(chosen).traits).some(s=>s.id===GARLEAN_LANGUAGES),false);
 assert.doesNotMatch(renderBuild(chosen,2),new RegExp('data-rw-racial-choice="'+GARLEAN_LANGUAGES+'"'));
 assert.deepEqual(buildIssues(chosen),[]);
 assert.equal(compileBuild(sheet.rulesBuild.input,sheet).languages,'Common');
 const illegal=structuredClone(chosen);
 illegal.racialChoices[GARLEAN_LANGUAGES]=[option(GARLEAN_LANGUAGES,'goblin')];
 assert.ok(buildIssues(illegal).some(x=>/Unknown or inactive racial choice/.test(x.message)));
 assert.throws(()=>compileBuild(illegal));
 pruneRacialChoices(illegal,raceFor(illegal),raceTraits(illegal).traits);
 assert.ok(!Object.hasOwn(illegal.racialChoices,GARLEAN_LANGUAGES));
 const saved=compileBuild(chosen),removed=structuredClone(saved.rulesBuild.input);
 removed.alternateIds=[];assert.throws(()=>compileBuild(removed,saved),/permanent/);
 const conflict=fixture('garlean',['xenophobia-extremis']);
 conflict.disabledTraits=[id('garlean','languages')];
 assert.ok(raceTraits(conflict).errors.some(x=>/Cannot modify/.test(x)));
});
test('Shindroid Heavy Platform changes only land 30→20, preserves immunity and manual weight note',()=>{
 const ordinary=fixture('shindroid'),b=fixture('shindroid',['heavy-platform']);
 const normal=compileBuild(ordinary),saved=compileBuild(b);
 assert.deepEqual(raceTraits(b).errors,[]);
 assert.equal(normal.speed,30);assert.equal(saved.speed,20);
 for(const kept of ['base-speed','robotic-immunities','emotionless','magic-ineptitude'])assert.ok(active(b,kept));
 assert.ok(active(b,'heavy-platform'));
 assert.match(active(b,'base-speed').description,/armor or encumbrance/);
 assert.match(saved.racialAbilities.find(x=>x.sourceRuleId===id('shindroid','heavy-platform'))?.desc||'',/50 pounds/);
 assert.equal(compileBuild(saved.rulesBuild.input,saved).speed,20);
 const altered=mergeSheetData(saved,{action:'fields',fields:{speed:25}});
 assert.equal(compileBuild(altered.rulesBuild.input,altered).speed,25);
 const disabled=fixture('shindroid',['heavy-platform']);disabled.disabledTraits=[id('shindroid','base-speed')];
 assert.ok(raceTraits(disabled).errors.some(x=>/Cannot modify/.test(x)));
});
test('Shindroid Anomaly loses Emotionless Sense Motive penalty and morale prohibition but keeps other immunity',()=>{
 const ordinary=fixture('shindroid'),b=fixture('shindroid',['anomaly']);
 assert.deepEqual(raceTraits(b).errors,[]);
 assert.ok(!active(b,'emotionless'));
 assert.ok(active(b,'robotic-immunities'));
 const description=active(b,'robotic-immunities').description;
 assert.match(description,/Fatigued, Exhausted and Sleep/);
 assert.match(description,/no longer.*fear\/emotion/);
 assert.match(description,/morale bonuses/);
 assert.ok(active(b,'anomaly'));
 const base=compileBuild(ordinary),saved=compileBuild(b);
 const row=name=>fixedSkills.findIndex(x=>x.name===name);
 for(const name of ['Bluff','Sense Motive']){
  const index=row(name);
  assert.ok(index>=0,name);
  assert.equal(saved.skills[index].cs,true,name);
 }
 const sense=row('Sense Motive');
 assert.equal(saved.skills[sense].rulesBonus-base.skills[sense].rulesBonus,4);
 assert.equal(saved.fort_temp||0,0);
 const twice=compileBuild(saved.rulesBuild.input,saved);
 assert.equal(twice.skills[sense].rulesBonus,saved.skills[sense].rulesBonus);
 const attempted=fixture('shindroid',['anomaly','factual']);
 assert.ok(raceTraits(attempted).errors.some(x=>/Two selections replace/.test(x)));
});
