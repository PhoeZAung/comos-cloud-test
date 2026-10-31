import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,registry,previewBuild,compileBuild,buildIssues,effectiveScores,raceFor,raceTraits,replacementFor} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {GARLEAN_LANGUAGES,GARLEAN_WEAPON,GARLEAN_CRAFT,TARUTARU_TALENTED} from '../src/features/characters/rules/racial-progress.mjs';
import {racialChoiceSpecs,pruneRacialChoices} from '../src/features/characters/rules/racial-choices.mjs';
import {isSupportedRaceOperation} from '../src/features/characters/rules/race-replacement-operations.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
const GARLEAN='ffd20:race:garlean',TARUTARU='ffd20:race:tarutaru';
const option=(pool,name)=>pool+':option:'+name;
function fixture(raceId){
 const b=newBuild();
 Object.assign(b,{name:'Patch 08 source review',alignment:'True Neutral',raceId,
  classId:'ffd20:class:dancer',reviewed:true});
 b.baseScores.int=14;
 b.hpRolls=[classHitDie(b)];
 if(raceId===GARLEAN){
  b.racialChoices[GARLEAN_WEAPON]=[option(GARLEAN_WEAPON,'firearms-simple')];
  b.racialChoices[GARLEAN_CRAFT]=['skill-row:4'];
  b.racialSpecialties[GARLEAN_CRAFT]='Mechanical';
 }else{
  b.racialChoices[TARUTARU_TALENTED]=['skill-row:4'];
  b.racialSpecialties[TARUTARU_TALENTED]='Woodworking';
 }
 b.skillRanks=fixedSkills.map(()=>0);
 const budget=previewBuild(b).skillBudget;
 for(let i=0;i<budget;i++)b.skillRanks[i]=1;
 return b;
}
test('Garlean Xenophobia Extremis is live and source-bound: only −2 WIS becomes −2 CHA',()=>{
 const b=fixture(GARLEAN),ordinary=compileBuild(b);
 assert.deepEqual([ordinary.con,ordinary.int,ordinary.wis,ordinary.cha],[12,16,8,10]);
 b.alternateIds=[GARLEAN+':trait:xenophobia-extremis'];
 const r=raceFor(b),ops=replacementFor(r,b.alternateIds[0]);
 assert.equal(ops.length,1);
 assert(ops.every(op=>isSupportedRaceOperation(r,op)));
 assert.deepEqual(raceTraits(b).errors,[]);
 assert.deepEqual(Object.fromEntries(Object.entries(effectiveScores(b)).filter(([k])=>['con','int','wis','cha'].includes(k))),{con:12,int:16,wis:10,cha:8});
 const sheet=compileBuild(b);
 assert.equal(sheet.languages,'Common');
 assert.deepEqual([sheet.con,sheet.int,sheet.wis,sheet.cha],[12,16,10,8]);
 for(const id of ['ability-score-adjustment','languages','xenophobia-extremis','magic-ineptitude','magitek-training']){
  assert(raceTraits(b).traits.some(t=>t.id===GARLEAN+':trait:'+id),'preserves '+id);
 }
 assert(!racialChoiceSpecs(r,raceTraits(b).traits).some(p=>p.id===GARLEAN_LANGUAGES));
 assert.match(renderBuild(b,2),/Xenophobia Extremis is selected: bonus-language picks are unavailable/);
 assert.doesNotMatch(renderBuild(b,1),new RegExp('data-rw-language-slot="'+GARLEAN_LANGUAGES+'"'));
 assert(!buildIssues(b).some(i=>/Unknown or inactive racial choice/.test(i.message)));
 const reopened=compileBuild(sheet.rulesBuild.input,sheet);
 assert.deepEqual([reopened.con,reopened.int,reopened.wis,reopened.cha],[12,16,10,8]);
 assert.equal(reopened.languages,'Common');
 const switched=structuredClone(sheet.rulesBuild.input);
 switched.alternateIds=[];
 assert.throws(()=>compileBuild(switched,sheet),/permanent/);
});
test('Garlean INT-language choices become inactive and cannot be smuggled through a save',()=>{
 const b=fixture(GARLEAN);
 b.racialChoices[GARLEAN_LANGUAGES]=[option(GARLEAN_LANGUAGES,'goblin')];
 assert.match(compileBuild(b).languages,/Goblin/);
 b.alternateIds=[GARLEAN+':trait:xenophobia-extremis'];
 assert(buildIssues(b,{complete:false}).some(i=>/Unknown or inactive racial choice/.test(i.message)));
 assert.throws(()=>compileBuild(b),{code:'INVALID_CHARACTER'});
 pruneRacialChoices(b,raceFor(b),raceTraits(b).traits);
 assert.equal(b.racialChoices[GARLEAN_LANGUAGES],undefined);
 assert.equal(compileBuild(b).languages,'Common');
 // The alternate is not a wholesale replacement of every Garlean racial trait.
 assert.equal(compileBuild(b).skills[4].subName,'Mechanical');
});
test('Tarutaru Explorer explicitly remains blocked because source Spell Focus trait does not exist',()=>{
 const b=fixture(TARUTARU),r=raceFor(b);
 const source=r.data.alternateReplacements.find(op=>op.addsFeatureIds.includes(TARUTARU+':trait:explorer'));
 assert(source);
 assert.deepEqual(source.targetFeatureIds,[TARUTARU+':trait:talented',TARUTARU+':trait:spell-focus']);
 assert(!r.data.standardTraitIds.includes(TARUTARU+':trait:spell-focus'));
 assert(r.data.standardTraitIds.includes(TARUTARU+':trait:magick-focus'));
 const selector=r.choicePools.find(p=>p.id===TARUTARU+':pool:explorer-knowledge-specialty');
 assert(selector);assert.equal(selector.options.length,0);
 const op=replacementFor(r,TARUTARU+':trait:explorer');
 assert(op.length>0);
 assert(op.every(o=>!isSupportedRaceOperation(r,o)));
 const html=renderBuild(b,2);
 assert.match(html,/Explorer cannot be activated yet/);
 assert.match(html,/Spell Focus/);
 assert.match(html,/Magick Focus/);
 assert.match(html,/replacement target requires GM\/source clarification|second replacement target requires GM\/source clarification/);
 const attempted=structuredClone(b);
 attempted.alternateIds=[TARUTARU+':trait:explorer'];
 assert(raceTraits(attempted).errors.some(x=>/precise replacement mapping/.test(x)));
 assert(buildIssues(attempted,{complete:false}).some(x=>/replacement mapping/.test(x.message)));
 assert.throws(()=>compileBuild(attempted),{code:'INVALID_CHARACTER'});
 // Do not silently replace Magick Focus, auto-add a Knowledge skill, or grant Explorer with Talented.
 assert(raceTraits(attempted).traits.some(f=>f.id===TARUTARU+':trait:magick-focus'));
 assert(raceTraits(attempted).traits.some(f=>f.id===TARUTARU+':trait:talented'));
 assert(!raceTraits(attempted).traits.some(f=>f.id===TARUTARU+':trait:explorer'));
 assert(!racialChoiceSpecs(r,raceTraits(attempted).traits).some(spec=>spec.id===selector.id));
 const normal=compileBuild(b);
 assert.equal(normal.skills[4].subName,'Woodworking');
 assert.equal(normal.skills[4].rulesBonus,2);
});
