import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,buildIssues,compileBuild,raceTraits,raceFor,replacementFor} from '../src/features/characters/rules/build.mjs';
import {isSupportedRaceOperation} from '../src/features/characters/rules/race-replacement-operations.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {renderSection,renderSpeedDetails} from '../src/features/sheet/view.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
const MOOGLE='ffd20:race:moogle',GROUNDED=MOOGLE+':trait:grounded',BASE=MOOGLE+':trait:base-speed';
const HANDY=MOOGLE+':pool:moogle-handy-craft-or-profession';
function fixture(grounded=false){
 const b=newBuild();Object.assign(b,{name:'Moogle Movement',alignment:'True Neutral',raceId:MOOGLE,classId:'ffd20:class:dancer',alternateIds:grounded?[GROUNDED]:[],reviewed:true,racialChoices:{[HANDY]:['skill-row:4']},racialSpecialties:{[HANDY]:'Woodworking'}});
 b.hpRolls=[classHitDie(b)];b.skillRanks=fixedSkills.map(()=>0);
 let remains=previewBuild(b).skillBudget;for(let i=0;i<fixedSkills.length&&remains>0;i++){b.skillRanks[i]=1;remains--;}return b;
}
test('Moogle Grounded keeps land speed and removes only flight, without permanent saves',()=>{
 const b=fixture(true),race=raceFor(b),op=replacementFor(race,GROUNDED);
 assert.equal(op.length,1);assert.ok(op.every(o=>isSupportedRaceOperation(race,o)));
 const result=raceTraits(b);assert.deepEqual(result.errors,[]);
 assert.ok(result.traits.some(f=>f.id===GROUNDED));
 const base=result.traits.find(f=>f.id===BASE);
 assert.ok(base);assert.ok(!result.replaced.includes(BASE));
 assert.match(base.description,/20 ft/);assert.match(base.description,/medium\/heavy armor/);
 assert.match(base.description,/flight.*lost/);assert.match(base.description,/\+1 racial saving throw/);
 assert.equal(buildIssues(b).length,0);
 const sheet=compileBuild(b);
 assert.equal(sheet.speed,20);assert.equal(sheet.speed_fly,0);
 assert.equal(sheet.fort_base,2,'conditional save should not be permanent');
 assert.ok(sheet.racialAbilities.some(x=>x.sourceRuleId===GROUNDED));
 assert.match(sheet.racialAbilities.find(x=>x.sourceRuleId===BASE).desc,/flight.*lost/);
 assert.doesNotMatch(renderBuild(b,2),new RegExp('data-rw-alternate="'+GROUNDED+'" disabled'));
 assert.equal(compileBuild(sheet.rulesBuild.input,sheet).speed_fly,0);
});
test('Normal Moogle retains limited clumsy flight at 20 ft and source description',()=>{
 const sheet=compileBuild(fixture());
 assert.equal(sheet.speed,20);assert.equal(sheet.speed_fly,20);
 assert.equal(sheet.speed_fly_maneuverability,'clumsy');
 assert.match(sheet.racialAbilities.find(x=>x.sourceRuleId===BASE).desc,/limited wing-assisted flight/);
 assert.ok(!sheet.racialAbilities.some(x=>x.sourceRuleId===GROUNDED));
});
test('Grounded selection permanent; manual movement edits preserved; disabling original speed conflicts',()=>{
 const b=fixture(true),saved=compileBuild(b);
 const changed=mergeSheetData(saved,{action:'fields',fields:{speed:25,speed_fly:10,speed_swim:15}});
 const rebuilt=compileBuild(changed.rulesBuild.input,changed);
 assert.equal(rebuilt.speed,25);assert.equal(rebuilt.speed_fly,10);assert.equal(rebuilt.speed_swim,15);
 const removed=structuredClone(saved.rulesBuild.input);removed.alternateIds=[];
 assert.throws(()=>compileBuild(removed,saved),/permanent/);
 const disabled=fixture(true);disabled.disabledTraits=[BASE];
 assert.match(raceTraits(disabled).errors.join(' '),/disabled/);
 assert.throws(()=>compileBuild(disabled));
});
test('Speed value opens read-only view of five modes; header retains only edit control',()=>{
 const data=compileBuild(fixture(true));Object.assign(data,{speed_burrow:10,speed_climb:15,speed_swim:25});
 const html=renderSection({id:'f',name:'Moogle',data},'overview');
 const identity=html.slice(html.indexOf('<h2>Identity</h2>'),html.indexOf('<h2>Proficiencies</h2>'));
 assert.equal((identity.match(/data-edit-stats="identity"/g)||[]).length,1);
 assert.equal((identity.match(/data-speed-details/g)||[]).length,1);
 assert.match(identity,/<dt>Speed<\/dt><dd><button[^>]*data-speed-details[^>]*>20 ft<\/button><\/dd>/);
 const popup=renderSpeedDetails(data);
 assert.deepEqual([...popup.matchAll(/<dt>([^<]+)<\/dt>/g)].map(x=>x[1]),['Land','Burrow','Climb','Fly','Swim']);
 assert.match(popup,/Land<\/dt><dd>20 ft/);assert.match(popup,/Burrow<\/dt><dd>10 ft/);
 assert.match(popup,/Climb<\/dt><dd>15 ft/);assert.match(popup,/Fly<\/dt><dd>—/);assert.match(popup,/Swim<\/dt><dd>25 ft/);
 assert.doesNotMatch(popup,/<input|<select|data-edit-stats|Maneuverability|hint/i);
 const none=renderSpeedDetails({speed:30});
 assert.equal((none.match(/<dt>/g)||[]).length,5);
 assert.equal((none.match(/<dd>—<\/dd>/g)||[]).length,4);
});
