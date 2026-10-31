import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {newBuild,previewBuild,compileBuild,buildIssues,classFor,choiceEvents,eligibleOptions,calculated,spellCounts,spellsForBuild,hasSpellcasting,levelUpBuild} from '../src/features/characters/rules/build.mjs';
import {HUME_ID,HUME_SCORE,HUME_LANGUAGES,languageChoice} from '../src/features/characters/rules/racial-progress.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {skillBudget} from '../src/features/sheet/skill-budget.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharacterLibraryService} from '../backend/characters/library.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
function fixture(className='dancer',score='intelligence'){
 const b=newBuild();Object.assign(b,{alignment:'Lawful Good',name:'Hume '+className,raceId:HUME_ID,classId:'ffd20:class:'+className,reviewed:true,racialChoices:{[HUME_SCORE]:[HUME_SCORE+':option:'+score]}});
 Object.assign(b.baseScores,{int:12,cha:12});b.hpRolls=[classHitDie(b)];
 for(const event of choiceEvents(b))b.choices[event.id]=eligibleOptions(b,event).slice(0,calculated(event.count,b)).map(o=>o.id);
 if(hasSpellcasting(classFor(b))){const counts=spellCounts(b),spells=spellsForBuild(b);b.spellIds=[...spells.filter(s=>s.level===0).slice(0,counts.cantrips),...spells.filter(s=>s.level===1).slice(0,counts.leveled)].map(s=>s.id);}
 b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);return b;
}
const classes=['black-mage','archer','chocobo-knight','dancer','dragoon','knight','monk','bard','beastmaster'];
test('Hume score, Skilled budget and extra feat work consistently across all nine current compiler paths',()=>{
 for(const cls of classes){
  const b=fixture(cls);assert.deepEqual(buildIssues(b),[],cls);const d=compileBuild(b),budget=skillBudget(d);
  assert.equal(d.int,14);assert.equal(d.size_category,'Medium');assert.equal(d.speed,30);assert.equal(d.languages,'Common');
  assert.deepEqual([d.racialIdentity.type,...d.racialIdentity.subtypes],['Humanoid','hume']);
  assert.equal(budget.racialSkill,1);assert.equal(budget.totalBudget,previewBuild(b).skillBudget);assert.equal(budget.unused,0);
  assert.equal(d.feats.filter(f=>f.sourceRuleId==='comos:feat-slot:1').length,1);
  assert.equal(d.feats.filter(f=>f.sourceRuleId===HUME_ID+':bonus-feat:level-1').length,1);
  for(const name of ['Bluff','Disguise','Knw: Local'])assert.equal(d.skills.find(s=>s.name===name).rulesBonus,1);
  for(const name of ['Knw: History','Knw: Local'])assert.equal(d.skills.find(s=>s.name===name).cs,true);
  assert.equal(d.skills.find(s=>s.name==='Diplomacy').rulesBonus,0,'gather information is conditional');
  const unused=d.skills.findIndex(s=>s.lvl===0);assert.throws(()=>mergeSheetData(d,{action:'entry',collection:'skills',mode:'update',index:unused,fields:{lvl:1}}),/No skill points remaining/);
 }
});
test('Hume free-text bonus languages preserve unrestricted names while enforcing Intelligence, active traits and duplicate rules',()=>{
 const b=fixture();b.racialChoices[HUME_LANGUAGES]=['Al Bhed','Ancient Elvaan'].map(languageChoice);
 const d=compileBuild(b);assert.equal(d.languages,'Common, Al Bhed, Ancient Elvaan');
 assert.equal(compileBuild(d.rulesBuild.input,d).languages,d.languages);
 for(const values of [['Aklo','Draconic','Celestial'],['Draconic','draconic'],['Common'],['<script>']]){
  const bad=fixture();bad.racialChoices[HUME_LANGUAGES]=values.map(languageChoice);assert.throws(()=>compileBuild(bad));
 }
 const newline=fixture();newline.racialChoices[HUME_LANGUAGES]=['language:Valid\nInjected'];assert.throws(()=>compileBuild(newline));
 const inactive=fixture();inactive.disabledTraits=[HUME_ID+':trait:languages'];inactive.racialChoices[HUME_LANGUAGES]=[languageChoice('Aklo')];assert.throws(()=>compileBuild(inactive),/inactive/);
 const other=fixture();other.raceId='ffd20:race:galka';other.racialChoices={[HUME_LANGUAGES]:[languageChoice('Aklo')]};other.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(other).skillBudget?1:0);assert.throws(()=>compileBuild(other),/inactive/);
  const html=renderBuild(b,1,{mode:'create'});assert.match(html,/data-rw-language-slot/);assert.match(html,/Al Bhed/);assert.match(html,/Ancient Elvaan/);assert.doesNotMatch(renderBuild(b,2),/data-rw-language-slot/);
 assert.match(renderBuild(b,8),/Extra bonus feat/);
});
test('Hume disabled standard entitlements are removed without duplicating or deleting manually edited feat content',()=>{
 const b=fixture(),d=compileBuild(b),extra=d.feats.find(f=>f.sourceRace==='Hume');extra.name='My chosen Hume feat';extra.desc='Prerequisites and effect checked manually.';
 d.hp_curr=1;d.skills.find(s=>s.name==='Bluff').temp+=3;
 const again=compileBuild(d.rulesBuild.input,d);assert.equal(again.feats.find(f=>f.sourceRace==='Hume').name,extra.name);assert.equal(again.hp_curr,1);assert.equal(again.skills.find(s=>s.name==='Bluff').temp,4);
 const off=fixture();off.disabledTraits=[HUME_ID+':trait:skilled',HUME_ID+':trait:bonus-feat'];off.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(off).skillBudget?1:0);
 const removed=compileBuild(off,again,{allowRankReduction:true});assert.equal(skillBudget(removed).racialSkill,0);assert(!removed.feats.some(f=>f.sourceRace==='Hume'));assert(removed.feats.some(f=>f.sourceRuleId==='comos:feat-slot:1'));
});
test('Hume rejects missing/extra score choices, variants, alternates, level progression and missing Skilled allocation',()=>{
 for(const change of [b=>b.racialChoices={},b=>b.racialChoices[HUME_SCORE].push(HUME_SCORE+':option:strength'),b=>b.heritageId='ffd20:race:hume:heritage:cetra',b=>b.alternateIds=[HUME_ID+':trait:awareness'],b=>b.skillRanks[0]=0,b=>b.level=2]){
  const b=fixture();change(b);assert.throws(()=>compileBuild(b));
 }
 const d=compileBuild(fixture());assert.throws(()=>levelUpBuild({...d.rulesBuild.input,level:2},d),/first-level|level-1/);
});
test('Hume language text, skill entitlement and manual feat name survive database save/reopen and sheet Intelligence edits',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'Hume fixture'}),service=createCharacterLibraryService(db),b=fixture();b.racialChoices[HUME_LANGUAGES]=[languageChoice('Al Bhed')];
  const request={build:b,requestId:randomUUID()},created=service.createBuild(owner.id,request);assert.equal(service.createBuild(owner.id,request).id,created.id);
  const stored=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(created.id).data_json);
  assert.equal(skillBudget(stored).unused,0);assert.deepEqual(stored.rulesBuild.input.racialChoices,b.racialChoices);
  const edited=mergeSheetData(stored,{action:'fields',fields:{int:16}});assert.equal(skillBudget(edited).racialSkill,1);assert.equal(skillBudget(edited).unused,1);
  const reopened=compileBuild(stored.rulesBuild.input,stored);assert.equal(reopened.languages,'Common, Al Bhed');assert.equal(skillBudget(reopened).unused,0);
 }finally{db.close();}
});
