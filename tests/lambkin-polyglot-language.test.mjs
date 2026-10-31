import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,raceTraits,replacementFor,raceFor,buildIssues,racialClassSkill,effectiveScores} from '../src/features/characters/rules/build.mjs';
import {racialChoiceSpecs,pruneRacialChoices} from '../src/features/characters/rules/racial-choices.mjs';
import {LAMBKIN_ID,LAMBKIN_LANGUAGES,LAMBKIN_POLYGLOT_LANGUAGE,languageChoice} from '../src/features/characters/rules/racial-progress.mjs';
import {isSupportedRaceOperation} from '../src/features/characters/rules/race-replacement-operations.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';

const POLY=LAMBKIN_ID+':trait:polyglot';
const MAGIC=LAMBKIN_ID+':trait:magic-expert';
const LANGUAGES=LAMBKIN_ID+':trait:languages';
const row=(sheet,name)=>sheet.skills.find(r=>r.name===name);
function fixture({poly=false,baseInt=10,extra='',cls='dancer'}={}){
 const b=newBuild();
 Object.assign(b,{name:'Lambkin Polyglot',alignment:'True Neutral',raceId:LAMBKIN_ID,classId:'ffd20:class:'+cls,
  reviewed:true,alternateIds:poly?[POLY]:[],racialChoices:{}});
 b.baseScores.int=baseInt;
 b.hpRolls=[classHitDie(b)];
 if(extra)b.racialChoices[LAMBKIN_POLYGLOT_LANGUAGE]=[languageChoice(extra)];
 b.skillRanks=fixedSkills.map(()=>0);
 let budget=previewBuild(b).skillBudget;
 for(let i=0;i<fixedSkills.length&&budget>0;i++){b.skillRanks[i]=1;budget--;}
 return b;
}

test('Lambkin standard traits project identity, skills and source-limited movement without automating Float',()=>{
 const b=fixture(),sheet=compileBuild(b);
 assert.equal(sheet.int,12);assert.equal(sheet.wis,12);assert.equal(sheet.con,8);
 assert.equal(sheet.size_category,'Small');assert.equal(sheet.speed,20);
 assert.equal(sheet.languages,'Common, Lambkin');
 assert.equal(sheet.racialIdentity.type,'Humanoid');
 assert.deepEqual(sheet.racialIdentity.subtypes,['lambkin']);
 assert.equal(row(sheet,'Stealth').rulesBonus,4);
 assert.equal(row(sheet,'Knw: Arcana').rulesBonus,2);
 assert.equal(row(sheet,'Spellcraft').rulesBonus,2);
 assert.ok(sheet.racialAbilities.some(x=>x.name==='Auto-Float'));
 assert.ok(!sheet.senses.includes('Float'));
 const again=compileBuild(sheet.rulesBuild.input,sheet);
 assert.equal(row(again,'Stealth').rulesBonus,4,'size Stealth must not double on reopen');
 assert.equal(again.languages,sheet.languages);
});

test('Lambkin Polyglot replaces only Magic Expert, preserves Languages and grants automatic Linguistics',()=>{
 const r=raceFor(fixture()),ops=replacementFor(r,POLY);
 assert.equal(ops.length,2);
 assert.ok(ops.every(op=>isSupportedRaceOperation(r,op)));
 assert.equal(ops[0].operation,'replace');assert.deepEqual(ops[0].targetFeatureIds,[MAGIC]);
 assert.equal(ops[1].operation,'modify');assert.deepEqual(ops[1].targetFeatureIds,[LANGUAGES]);
 for(const cls of ['dancer','chocobo-knight']){
  const b=fixture({poly:true,extra:'Celestial',cls}),traits=raceTraits(b);
  assert.deepEqual(traits.errors,[]);
  assert.ok(traits.replaced.includes(MAGIC));
  assert.ok(!traits.replaced.includes(LANGUAGES));
  assert.ok(!traits.traits.some(x=>x.id===MAGIC));
  assert.ok(traits.traits.some(x=>x.id===LANGUAGES));
  assert.ok(traits.traits.some(x=>x.id===POLY));
  assert.equal(racialClassSkill(b,'skill:linguistics',fixedSkills.findIndex(x=>x.name==='Linguistics')),true);
  const sheet=compileBuild(b);
  assert.equal(row(sheet,'Linguistics').rulesBonus,2);
  assert.equal(row(sheet,'Linguistics').rulesClassSkill,true);
  assert.equal(row(sheet,'Knw: Arcana').rulesBonus,0);
  assert.equal(row(sheet,'Spellcraft').rulesBonus,0);
  assert.equal(row(sheet,'Stealth').rulesBonus,4);
  assert.equal(sheet.languages,'Common, Lambkin, Celestial');
  assert.equal(sheet.skills.reduce((n,x)=>n+x.lvl,0),b.skillRanks.reduce((n,x)=>n+x,0));
  const reopened=compileBuild(sheet.rulesBuild.input,sheet);
  assert.equal(row(reopened,'Linguistics').rulesBonus,2);
  assert.equal(reopened.languages,sheet.languages);
 }
});

test('Polyglot requires one extra language even with zero Intelligence bonus slots; no new wizard step',()=>{
 const b=fixture({poly:true,baseInt:8});
 assert.equal(effectiveScores(b).int,10);
 const specs=racialChoiceSpecs(raceFor(b),raceTraits(b).traits);
 assert.equal(specs.find(x=>x.id===LAMBKIN_LANGUAGES).minimum,0);
 assert.equal(specs.find(x=>x.id===LAMBKIN_POLYGLOT_LANGUAGE).minimum,1);
 assert.equal(specs.find(x=>x.id===LAMBKIN_POLYGLOT_LANGUAGE).maximum,1);
 assert.ok(buildIssues(b).some(x=>/Polyglot starting language/.test(x.message)));
 assert.throws(()=>compileBuild(b),/Polyglot starting language/);
 const ability=renderBuild(b,1,{mode:'create'});
 assert.match(ability,/Polyglot starting language/);
 assert.match(ability,new RegExp('data-rw-language-slot="'+LAMBKIN_POLYGLOT_LANGUAGE+'"'));
 assert.doesNotMatch(ability,new RegExp('data-rw-language-slot="'+LAMBKIN_LANGUAGES+'"'));
 assert.doesNotMatch(renderBuild(b,2,{mode:'create'}),/data-rw-language-slot/);
 b.racialChoices[LAMBKIN_POLYGLOT_LANGUAGE]=[languageChoice('Celestial')];
 assert.deepEqual(buildIssues(b),[]);
 assert.equal(compileBuild(b).languages,'Common, Lambkin, Celestial');
});

test('Extra language is distinct from starting and INT-bonus language choices',()=>{
 const b=fixture({poly:true,baseInt:12,extra:'Celestial'});
 b.racialChoices[LAMBKIN_LANGUAGES]=[LAMBKIN_LANGUAGES+':option:galkan',LAMBKIN_LANGUAGES+':option:goblin'];
 assert.deepEqual(buildIssues(b),[]);
 const d=compileBuild(b);
 assert.equal(d.languages,'Common, Lambkin, Galkan, Goblin, Celestial');
 for(const name of ['Common','Lambkin','GALKAN']){
  const changed=structuredClone(b);
  changed.racialChoices[LAMBKIN_POLYGLOT_LANGUAGE]=[languageChoice(name)];
  assert.ok(buildIssues(changed).some(x=>/Invalid or duplicate|Polyglot extra language/.test(x.message)),name);
  assert.throws(()=>compileBuild(changed),undefined,name);
 }
 const tooMany=structuredClone(b);
 tooMany.racialChoices[LAMBKIN_LANGUAGES].push(LAMBKIN_LANGUAGES+':option:orc');
 assert.ok(buildIssues(tooMany).some(x=>/choose up to 2/.test(x.message)));
});

test('Polyglot choice is pruned if unselected before save; alternate immutable after save and manual changes persist',()=>{
 const regular=fixture();
 assert.ok(raceTraits(regular).traits.some(f=>f.id===MAGIC));
 assert.ok(!racialChoiceSpecs(raceFor(regular),raceTraits(regular).traits).some(s=>s.id===LAMBKIN_POLYGLOT_LANGUAGE));
 const initial=fixture({poly:true,extra:'Celestial'});
 initial.alternateIds=[];
 pruneRacialChoices(initial,raceFor(initial),raceTraits(initial).traits);
 assert.equal(initial.racialChoices[LAMBKIN_POLYGLOT_LANGUAGE],undefined);
 assert.doesNotThrow(()=>compileBuild(initial));
 const b=fixture({poly:true,extra:'Celestial'}),sheet=compileBuild(b);
 row(sheet,'Linguistics').temp+=3;
 const again=compileBuild(sheet.rulesBuild.input,sheet);
 assert.equal(row(again,'Linguistics').rulesBonus,2);
 assert.equal(row(again,'Linguistics').temp,row(sheet,'Linguistics').temp);
 const changed=structuredClone(sheet.rulesBuild.input);changed.alternateIds=[];
 assert.throws(()=>compileBuild(changed,sheet),/permanent/);
});
