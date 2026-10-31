import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,raceTraits,buildIssues,calculated} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {renderSection,renderSheetFrame} from '../src/features/sheet/view.mjs';
import {movementDetails} from '../src/features/sheet/movement.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
const AEGYL='ffd20:race:aegyl',WING=AEGYL+':trait:wing-clipped',BASE=AEGYL+':trait:base-speed',EMOTIONLESS=AEGYL+':trait:emotionless';
const fixture=(classId='ffd20:class:dancer',wing=false)=>{
 const b=newBuild();Object.assign(b,{name:'Wing audit',alignment:'True Neutral',raceId:AEGYL,classId,reviewed:true,alternateIds:wing?[WING]:[]});
 b.baseScores.int=12;b.hpRolls=[classHitDie(b)];b.skillRanks=fixedSkills.map(()=>0);
 for(let i=0,left=previewBuild(b).skillBudget;i<fixedSkills.length&&left>0;i++){b.skillRanks[i]=1;left--;}
 return b;
};
const row=(sheet,name)=>sheet.skills.find(r=>r.name===name);

test('Wing-Clipped modifies flight only and replaces Emotionless; automatic +2 racial bonuses apply to three skills',()=>{
 for(const type of ['ffd20:class:dancer','ffd20:class:chocobo-knight']){
  const b=fixture(type,true),r=raceTraits(b);
  assert.deepEqual(r.errors,[]);
  assert.ok(r.replaced.includes(EMOTIONLESS));assert.ok(!r.traits.some(f=>f.id===EMOTIONLESS));
  assert.ok(r.traits.some(f=>f.id===WING));
  const speedTrait=r.traits.find(f=>f.id===BASE);
  assert.ok(speedTrait);assert.match(speedTrait.description,/30 ft/);assert.match(speedTrait.description,/20 ft.*poor/);assert.match(speedTrait.description,/DC 30/);assert.doesNotMatch(speedTrait.description,/40 ft/);
  for(const skill of ['Bluff','Climb','Diplomacy']){
   const effect=r.traits.find(f=>f.id===WING).effects.find(e=>e.target==='skills.skill:'+skill.toLowerCase()+'.bonus');
   assert.ok(effect&&effect.automation==='automatic',skill);
   assert.equal(calculated(effect.value,b),2);
  }
  const sheet=compileBuild(b);
  assert.equal(sheet.speed,30);assert.equal(sheet.speed_fly,20);assert.equal(sheet.speed_fly_maneuverability,'poor');
  for(const skill of ['Bluff','Climb','Diplomacy'])assert.equal(row(sheet,skill).rulesBonus,2,skill);
  assert.ok(!sheet.racialAbilities.some(f=>f.sourceRuleId===EMOTIONLESS));
  assert.match(sheet.racialAbilities.find(f=>f.sourceRuleId===BASE).desc,/DC 30/);
  assert.equal(buildIssues(b).filter(x=>/precise replacement/.test(x.message)).length,0);
  const raceWizard=renderBuild(b,2);
  assert.match(raceWizard,new RegExp('data-rw-alternate="'+WING+'"'));
  assert.doesNotMatch(raceWizard,new RegExp('data-rw-alternate="'+WING+'" disabled'));
  const again=compileBuild(sheet.rulesBuild.input,sheet);
  for(const skill of ['Bluff','Climb','Diplomacy'])assert.equal(row(again,skill).rulesBonus,2,skill+' no double counting');
  assert.equal(again.speed_fly,20);
 }
});
test('Normal Aegyl retain fly 40 ft poor and do not get Wing-Clipped bonuses',()=>{
 const b=fixture(),sheet=compileBuild(b);
 assert.equal(sheet.speed,30);assert.equal(sheet.speed_fly,40);assert.equal(sheet.speed_fly_maneuverability,'poor');
 assert.equal(row(sheet,'Bluff').rulesBonus,0);assert.equal(row(sheet,'Climb').rulesBonus,0);assert.equal(row(sheet,'Diplomacy').rulesBonus,0);
 assert.match(sheet.racialAbilities.find(f=>f.sourceRuleId===BASE).desc,/40/);
});
test('Sheet Identity always shows land speed; other movement types display beneath it and open edit popup',()=>{
 const sheet=compileBuild(fixture('ffd20:class:dancer',true)),char={id:'e5',name:'Aegyl',data:sheet};
 const html=renderSection(char,'overview');assert.match(html,/Speed/);
 assert.match(html,/30 ft/);assert.match(html,/Fly 20 ft \(poor\)/);
 assert.match(html,/data-edit-stats="identity"/);
 const frame=renderSheetFrame(char,'overview');assert.match(frame,/cs-speed-trigger/);
 assert.deepEqual(movementDetails({speed_fly:20,speed_swim:15,speed_climb:5,speed_burrow:10,speed_fly_maneuverability:'poor'}),['Burrow 10 ft','Climb 5 ft','Fly 20 ft (poor)','Swim 15 ft']);
 const basic=renderSection({id:'b',name:'Normal',data:{speed:30}},'overview');
 assert.match(basic,/30 ft/);assert.doesNotMatch(basic,/cs-movement-summary/);
});
test('All movement modes are mutable saved Identity fields and survive rule-build recompile',()=>{
 let sheet=compileBuild(fixture('ffd20:class:dancer',true));
 sheet=mergeSheetData(sheet,{action:'fields',fields:{speed:35,speed_burrow:10,speed_climb:15,speed_fly:50,speed_swim:25,speed_fly_maneuverability:'good'}});
 assert.deepEqual([sheet.speed,sheet.speed_burrow,sheet.speed_climb,sheet.speed_fly,sheet.speed_swim,sheet.speed_fly_maneuverability],[35,10,15,50,25,'good']);
 const after=compileBuild(sheet.rulesBuild.input,sheet);
 assert.equal(after.speed,35,'manually edited Land Speed survives a rules recompile');
 assert.deepEqual([after.speed_burrow,after.speed_climb,after.speed_fly,after.speed_swim,after.speed_fly_maneuverability],[10,15,50,25,'good']);
 assert.match(renderSection({id:'x',name:'Aegyl',data:after},'overview'),/Burrow 10 ft · Climb 15 ft · Fly 50 ft \(good\) · Swim 25 ft/);
 const cleared=mergeSheetData(after,{action:'fields',fields:{speed_fly:0,speed_fly_maneuverability:''}});
 assert.equal(compileBuild(cleared.rulesBuild.input,cleared).speed_fly,0,'manual clearing must not regenerate racial fly speed');
});
test('Server rejects impossible speeds and malformed maneuverability but accepts zero and standard settings',()=>{
 for(const speed of [-1,1.5,10001,'1e100','oops'])assert.throws(()=>mergeSheetData({speed:30},{action:'fields',fields:{speed_swim:speed}}),/Movement speeds|valid number/);
 for(const fly of ['superb','PRETTY GOOD',8,null])assert.throws(()=>mergeSheetData({speed_fly:20},{action:'fields',fields:{speed_fly_maneuverability:fly}}),/Invalid sheet field/);
 const cleared=mergeSheetData({speed_fly:20,speed_climb:10},{action:'fields',fields:{speed_fly:0,speed_climb:0,speed_fly_maneuverability:''}});
 assert.equal(cleared.speed_fly,0);assert.equal(cleared.speed_climb,0);assert.equal(cleared.speed_fly_maneuverability,'');
});
test('Existing sheet edits to skill bonuses are preserved when Aegyl racial rules are reapplied',()=>{
 const b=fixture('ffd20:class:dancer',true),sheet=compileBuild(b);
 const index=sheet.skills.findIndex(s=>s.name==='Bluff');sheet.skills[index].temp+=3;
 const again=compileBuild(sheet.rulesBuild.input,sheet);
 assert.equal(row(again,'Bluff').rulesBonus,2);
 assert.equal(row(again,'Bluff').temp,row(sheet,'Bluff').temp);
});
