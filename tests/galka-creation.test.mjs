import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,buildIssues,choiceEvents,eligibleOptions,calculated,spellCounts,spellsForBuild} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
const LANG='ffd20:race:galka:pool:high-intelligence-bonus-languages';
const option=key=>'ffd20:race:galka:option:high-intelligence-bonus-languages-'+key;
function fixture(name='dancer'){
 const b=newBuild();Object.assign(b,{name:'Galka '+name,raceId:'ffd20:race:galka',classId:'ffd20:class:'+name,reviewed:true,racialChoices:{[LANG]:[option('dwarven')]}});
 Object.assign(b.baseScores,{int:12,cha:14});b.hpRolls=[classHitDie(b)];
 for(const e of choiceEvents(b))b.choices[e.id]=eligibleOptions(b,e).slice(0,calculated(e.count,b)).map(o=>o.id);
 const counts=spellCounts(b),catalog=spellsForBuild(b);b.spellIds=[...catalog.filter(s=>s.level===0).slice(0,counts.cantrips),...catalog.filter(s=>s.level===1).slice(0,counts.leveled)].map(s=>s.id);
 let remaining=previewBuild(b).skillBudget;b.skillRanks=fixedSkills.map(()=>remaining-->0?1:0);return b;
}
test('Galka source-standard identity, languages and unconditional benefits work across all compiler paths',()=>{
 for(const name of ['dancer','bard','archer','black-mage']){
  const b=fixture(name);assert.deepEqual(buildIssues(b),[]);const d=compileBuild(b),stats=sheetStats(d);
  assert.deepEqual([d.str,d.dex,d.con,d.int,d.wis,d.cha],[12,10,10,12,12,12]);assert.equal(d.speed,20);assert.equal(d.size_category,'Medium');assert.equal(d.racialIdentity.type,'humanoid');assert(d.racialIdentity.subtypes.includes('galka'));
  assert.equal(d.languages,'Common, Galkan, Dwarven');assert.match(d.proficiencies,/war pick/);assert.match(d.proficiencies,/Galkan racial weapon/);
  assert.equal(d.skills.find(s=>s.name==='Intimidate').rulesBonus,2);
  assert.equal(stats.fort,previewBuild(b).summary.fort);assert.equal(stats.bab,previewBuild(b).summary.bab);assert.equal(stats.cmd,11,'Stability is conditional');
  assert(d.racialAbilities.some(s=>s.name==='Ferocity'&&/Once per day/.test(s.desc)));
  const again=compileBuild(d.rulesBuild.input,d);assert.equal(again.languages,d.languages);assert.equal(again.skills.find(s=>s.name==='Intimidate').rulesBonus,2);
 }
});
test('Galka mining and metalwork benefits never become bonuses to every Profession, Craft or Appraise check',()=>{
 for(const name of ['dancer','black-mage']){
  const b=fixture(name),d=compileBuild(b);
  for(const row of d.skills.filter(s=>['Profession','Craft','Appraise'].includes(s.name)))assert.equal(row.rulesBonus,0);
  assert(d.racialAbilities.some(s=>s.name==='Mining Servitude'&&/miner specialty manually/.test(s.desc)));
  const row=d.skills.find(s=>s.name==='Profession');row.subName='Miner';row.temp=2;d.hp_curr=2;
  const saved=compileBuild(d.rulesBuild.input,d);assert.equal(saved.skills.find(s=>s.name==='Profession').temp,2);assert.equal(saved.hp_curr,2);
 }
});
test('Galka optional language selection is bounded and active; unsupported alternate scope stays guarded',()=>{
 const b=fixture();delete b.racialChoices[LANG];assert.equal(compileBuild(b).languages,'Common, Galkan');
 for(const values of [[option('dwarven'),option('goblin')],[option('dwarven'),option('dwarven')],[option('celestial')]]){const wrong=fixture();wrong.racialChoices[LANG]=values;assert.throws(()=>compileBuild(wrong));}
 const removed=fixture();removed.disabledTraits=['ffd20:race:galka:feature:languages'];assert.throws(()=>compileBuild(removed),/inactive/);
 const low=fixture();low.baseScores.int=10;assert(buildIssues(low).some(i=>/choose (?:up to )?0/.test(i.message)));
 const html=renderBuild(fixture(),2);assert.match(html,/Dwarven/);assert.match(html,/data-rw-racial-choice="ffd20:race:galka:pool:high-intelligence-bonus-languages"/);
 assert.match(html,/data-rw-alternate="ffd20:race:galka:feature:architectural-ingenuity" disabled/);
 const alternate=fixture();alternate.alternateIds=['ffd20:race:galka:feature:architectural-ingenuity'];assert.throws(()=>compileBuild(alternate),/standard traits/);
});
