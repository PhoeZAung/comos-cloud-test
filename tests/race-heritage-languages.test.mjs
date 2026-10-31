import test from 'node:test';
import assert from 'node:assert/strict';
import {ffd20LanguageGroups,ffd20LanguageNames} from '../src/features/characters/rules/languages.mjs';
import languagesPage from '../src/pages/languages.mjs';
import {newBuild,compileBuild,previewBuild,effectiveScores,raceTraits,buildIssues} from '../src/features/characters/rules/build.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {HUME_ID,HUME_LANGUAGES,HUME_SCORE,languageChoice} from '../src/features/characters/rules/racial-progress.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
const mk=(race='ffd20:race:garif')=>{const b=newBuild();b.name='Language Test';b.alignment='True Neutral';b.raceId=race;b.classId='ffd20:class:dancer';b.baseScores.int=12;b.hpRolls=[classHitDie(b)];b.reviewed=true;return b;};

test('FFd20 language page includes all unique source table languages',()=>{
 assert.equal(ffd20LanguageGroups.length,3);assert.equal(ffd20LanguageNames.length,49);
 assert.ok(ffd20LanguageNames.includes("Amalij'aa"));assert.ok(ffd20LanguageNames.includes('Tonberry'));
 assert.ok(ffd20LanguageNames.includes('Umbran'));assert.ok(ffd20LanguageNames.includes('Albhedian'));
 assert.equal(languagesPage.id,'languages');for(const name of ffd20LanguageNames)assert.ok(languagesPage.content.includes(name==='Amalij\u0027aa'?'Amalij&#39;aa':name));
});

test('High INT bonus languages appear only on ability step and not when INT offers zero',()=>{
 const b=mk();b.racialChoices={'ffd20:race:garif:pool:bond-terrain':['ffd20:race:garif:pool:bond-terrain:option:desert'],'ffd20:race:garif:pool:pastoralist-skill':['skill-row:43']};
 const racePage=renderBuild(b,2),scoresPage=renderBuild(b,1,{mode:'create'});
 assert.doesNotMatch(racePage,/data-rw-language-slot/);
 assert.match(scoresPage,/data-rw-language-slot/);assert.match(scoresPage,/languages\.html/);
 assert.equal((scoresPage.match(/data-rw-language-slot=/g)||[]).length,1);
 b.baseScores.int=10;
 assert.doesNotMatch(renderBuild(b,1,{mode:'create'}),/data-rw-language-slot|Bonus languages/);
 b.baseScores.int=14;
 assert.equal((renderBuild(b,1,{mode:'create'}).match(/data-rw-language-slot=/g)||[]).length,2);
});

test('Hume permitted heritage replaces rather than stacks racial score vector in saved character',()=>{
 for(const [heritage,stat] of [['highlander','str'],['lunarian','cha']]){
  const b=mk(HUME_ID);b.heritageId=HUME_ID+':heritage:'+heritage;b.baseScores.int=12;
  b.skillRanks=fixedSkills.map(()=>0);let remaining=previewBuild(b).skillBudget;for(let i=0;i<fixedSkills.length&&remaining>0;i++){b.skillRanks[i]=1;remaining--;}
  assert.equal(effectiveScores(b)[stat],12);
  assert.equal(effectiveScores(b).int,12);
  assert.ok(raceTraits(b).replaced.includes(HUME_ID+':trait:ability-score-adjustment'));
  assert.equal(buildIssues(b).filter(x=>x.message.includes('Hume heritage')).length,0);
  const saved=compileBuild(b);assert.equal(saved[stat],12);assert.equal(saved.rulesBuild.input.heritageId,b.heritageId);
  assert.equal(compileBuild(saved.rulesBuild.input,saved)[stat],12);
  assert.ok(saved.feats.some(x=>x.sourceRuleId===HUME_ID+':bonus-feat:level-1'));
  assert.match(renderBuild(b,1,{mode:'create'}),/race/);
 }
});

test('Hume unrestricted high-Int languages use the source catalog on ability step',()=>{
 const b=mk(HUME_ID);
 b.racialChoices={[HUME_SCORE]:[HUME_SCORE+':option:intelligence'],[HUME_LANGUAGES]:[languageChoice('Aegyllan'),languageChoice('Umbran')]};
 b.baseScores.int=12;
 const ability=renderBuild(b,1,{mode:'create'});
 assert.match(ability,/data-rw-language-slot/);assert.match(ability,/rw-ffd20-languages/);
 assert.match(ability,/Umbran/);assert.doesNotMatch(renderBuild(b,2),/data-rw-language-slot/);
});
