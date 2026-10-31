import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,raceTraits,replacementFor,raceFor,buildIssues,racialClassSkill,effectiveScores} from '../src/features/characters/rules/build.mjs';
import {racialChoiceSpecs,pruneRacialChoices,TARUTARU_POLYGLOT_LANGUAGE} from '../src/features/characters/rules/racial-choices.mjs';
import {TARUTARU_ID,TARUTARU_LANGUAGES,TARUTARU_TALENTED,languageChoice} from '../src/features/characters/rules/racial-progress.mjs';
import {isSupportedRaceOperation} from '../src/features/characters/rules/race-replacement-operations.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';

const POLY=TARUTARU_ID+':trait:polyglot',MAGIC=TARUTARU_ID+':trait:magic-expert',LANGUAGES=TARUTARU_ID+':trait:languages';
function fixture({poly=false,baseInt=10,cls='dancer',extra=''}={}){
 const b=newBuild();
 Object.assign(b,{name:'Polyglot Review',alignment:'True Neutral',raceId:TARUTARU_ID,classId:'ffd20:class:'+cls,reviewed:true,
  alternateIds:poly?[POLY]:[],racialChoices:{[TARUTARU_TALENTED]:['skill-row:4']},racialSpecialties:{[TARUTARU_TALENTED]:'Woodworking'}});
 b.baseScores.int=baseInt;b.hpRolls=[classHitDie(b)];
 if(extra)b.racialChoices[TARUTARU_POLYGLOT_LANGUAGE]=[languageChoice(extra)];
 b.skillRanks=fixedSkills.map(()=>0);
 let balance=previewBuild(b).skillBudget;
 for(let i=0;i<fixedSkills.length&&balance;i++){b.skillRanks[i]=1;balance--;}
 return b;
}
const skill=(sheet,name)=>sheet.skills.find(r=>r.name===name);

test('Polyglot replaces Magic Expert, modifies but retains Languages, and grants automatic Linguistics bonus/class skill',()=>{
 const r=raceFor(fixture()),ops=replacementFor(r,POLY);
 assert.equal(ops.length,2);assert.ok(ops.every(op=>isSupportedRaceOperation(r,op)));
 for(const cls of ['dancer','chocobo-knight']){
  const b=fixture({poly:true,extra:'Celestial',cls}),result=raceTraits(b);
  assert.deepEqual(result.errors,[]);assert.ok(result.replaced.includes(MAGIC));
  assert.ok(!result.traits.some(x=>x.id===MAGIC));
  assert.ok(result.traits.some(x=>x.id===POLY));
  const lang=result.traits.find(x=>x.id===LANGUAGES);
  assert.ok(lang);assert.match(lang.description,/high-Intelligence bonus languages/);
  assert.ok(!result.replaced.includes(LANGUAGES));
  assert.equal(racialClassSkill(b,'skill:linguistics',fixedSkills.findIndex(s=>s.name==='Linguistics')),true);
  const d=compileBuild(b);
  assert.equal(skill(d,'Linguistics').rulesBonus,2);
  assert.equal(skill(d,'Linguistics').rulesClassSkill,true);
  assert.equal(skill(d,'Knw: Arcana').rulesBonus,0);
  assert.equal(skill(d,'Spellcraft').rulesBonus,0);
  assert.equal(d.languages,'Common, Lalafellan, Celestial');
  assert.equal(d.skills.reduce((n,s)=>n+s.lvl,0),b.skillRanks.reduce((a,n)=>a+n,0),'skill ranks unchanged');
  const reopened=compileBuild(d.rulesBuild.input,d);
  assert.equal(skill(reopened,'Linguistics').rulesBonus,2,'racial skill bonus not counted twice');
  assert.equal(reopened.languages,d.languages);
 }
});
test('Polyglot extra language is required even with no high-INT bonus slots and uses existing Ability Scores step',()=>{
 const b=fixture({poly:true,baseInt:8});
 assert.equal(effectiveScores(b).int,10);
 const specs=racialChoiceSpecs(raceFor(b),raceTraits(b).traits);
 assert.equal(specs.find(s=>s.id===TARUTARU_LANGUAGES).minimum,0);
 assert.equal(specs.find(s=>s.id===TARUTARU_POLYGLOT_LANGUAGE).minimum,1);
 assert.equal(specs.find(s=>s.id===TARUTARU_POLYGLOT_LANGUAGE).maximum,1);
 assert.ok(buildIssues(b).some(x=>/Polyglot starting language/.test(x.message)));
 assert.throws(()=>compileBuild(b),/Polyglot starting language/);
 const scorePage=renderBuild(b,1,{mode:'create'}),racePage=renderBuild(b,2,{mode:'create'});
 assert.match(scorePage,/Polyglot starting language/);
 assert.match(scorePage,new RegExp('data-rw-language-slot="'+TARUTARU_POLYGLOT_LANGUAGE+'"'));
 assert.doesNotMatch(scorePage,new RegExp('data-rw-language-slot="'+TARUTARU_LANGUAGES+'"'));
 assert.doesNotMatch(racePage,/data-rw-language-slot/);
 b.racialChoices[TARUTARU_POLYGLOT_LANGUAGE]=[languageChoice('Celestial')];
 assert.equal(buildIssues(b).length,0);
 assert.equal(compileBuild(b).languages,'Common, Lalafellan, Celestial');
});
test('Polyglot extra language stacks with normal high-INT options, but cannot duplicate existing languages',()=>{
 const b=fixture({poly:true,baseInt:12,extra:'Celestial'});
 const intBonus=effectiveScores(b).int;
 assert.equal(intBonus,14);
 b.racialChoices[TARUTARU_LANGUAGES]=[TARUTARU_LANGUAGES+':option:draconic',TARUTARU_LANGUAGES+':option:orc'];
 assert.deepEqual(buildIssues(b),[]);
 const sheet=compileBuild(b);
 assert.equal(sheet.languages,'Common, Lalafellan, Draconic, Orc, Celestial');
 assert.deepEqual(compileBuild(sheet.rulesBuild.input,sheet).rulesBuild.input.racialChoices[TARUTARU_POLYGLOT_LANGUAGE],[languageChoice('Celestial')]);
 for(const language of ['Common','Lalafellan','DRACONIC']){
  const changed=structuredClone(b);changed.racialChoices[TARUTARU_POLYGLOT_LANGUAGE]=[languageChoice(language)];
  assert.ok(buildIssues(changed).some(x=>/Polyglot extra language|Invalid or duplicate/.test(x.message)),language);
  assert.throws(()=>compileBuild(changed),undefined,language);
 }
 const outOfRange=structuredClone(b);outOfRange.racialChoices[TARUTARU_LANGUAGES]=[...b.racialChoices[TARUTARU_LANGUAGES],TARUTARU_LANGUAGES+':option:dwarven'];
 assert.ok(buildIssues(outOfRange).some(x=>/choose up to 2/.test(x.message)));
});
test('Without Polyglot normal language choices and standard Magic Expert continue unchanged; extra choice prunes on removal',()=>{
 const regular=fixture(),r=raceTraits(regular);
 assert.ok(r.traits.some(f=>f.id===MAGIC));
 assert.ok(r.traits.some(f=>f.id===LANGUAGES));
 assert.equal(compileBuild(regular).languages,'Common, Lalafellan');
 assert.equal(skill(compileBuild(regular),'Knw: Arcana').rulesBonus,2);
 assert.ok(!racialChoiceSpecs(raceFor(regular),r.traits).some(s=>s.id===TARUTARU_POLYGLOT_LANGUAGE));
 const after=fixture({poly:true,extra:'Celestial'});
 after.alternateIds=[];
 pruneRacialChoices(after,raceFor(after),raceTraits(after).traits);
 assert.equal(after.racialChoices[TARUTARU_POLYGLOT_LANGUAGE],undefined);
 assert.doesNotThrow(()=>compileBuild(after));
});
test('Polyglot starting alternate stays permanent once saved; manual changes to unrelated sheet fields survive',()=>{
 const b=fixture({poly:true,extra:'Celestial'}),sheet=compileBuild(b);
 sheet.skills.find(r=>r.name==='Linguistics').temp+=3;
 const another=compileBuild(sheet.rulesBuild.input,sheet);
 assert.equal(skill(another,'Linguistics').rulesBonus,2);
 assert.equal(skill(another,'Linguistics').temp,skill(sheet,'Linguistics').temp);
 const changed=structuredClone(sheet.rulesBuild.input);changed.alternateIds=[];
 assert.throws(()=>compileBuild(changed,sheet),/permanent/);
});
