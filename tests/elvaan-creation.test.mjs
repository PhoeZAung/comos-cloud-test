import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,previewBuild,compileBuild,buildIssues,choiceEvents,eligibleOptions,calculated,spellCounts,spellsForBuild} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
const WEAPON='ffd20:race:elvaan:pool:martial-background-weapon';
const LANGUAGES='ffd20:race:elvaan:pool:high-intelligence-bonus-languages';
const lang=key=>'ffd20:race:elvaan:option:high-intelligence-bonus-languages-'+key;
function fixture(className='dancer'){
 const b=newBuild();Object.assign(b,{name:'Elvaan '+className,raceId:'ffd20:race:elvaan',classId:'ffd20:class:'+className,reviewed:true,
  racialChoices:{[WEAPON]:[WEAPON+':option:longsword'],[LANGUAGES]:[lang('celestial')]}});
 Object.assign(b.baseScores,{int:12,cha:12});b.hpRolls=[classHitDie(b)];
 for(const event of choiceEvents(b))b.choices[event.id]=eligibleOptions(b,event).slice(0,calculated(event.count,b)).map(o=>o.id);
 const counts=spellCounts(b),catalog=spellsForBuild(b);
 b.spellIds=[...catalog.filter(s=>s.level===0).slice(0,counts.cantrips),...catalog.filter(s=>s.level===1).slice(0,counts.leveled)].map(s=>s.id);
 let remaining=previewBuild(b).skillBudget;b.skillRanks=fixedSkills.map(()=>remaining-->0?1:0);return b;
}
test('Elvaan standard traits and one selected Weapon Focus integrate with each class adapter path',()=>{
 for(const name of ['dancer','bard','archer','black-mage']){
  const b=fixture(name);assert.deepEqual(buildIssues(b),[]);const d=compileBuild(b);
  assert.deepEqual([d.str,d.dex,d.con,d.int,d.wis,d.cha],[12,8,10,12,12,12]);
  assert.equal(d.speed,30);assert.equal(d.size_category,'Medium');assert.equal(d.languages,'Common, Elvaan, Celestial');
  assert.equal(d.racialIdentity.type,'humanoid');assert(d.racialIdentity.subtypes.includes('elvaan'));
  for(const [skill,bonus] of [['Perception',2],['Knw: History',2],['Knw: Nobility',2]])assert.equal(d.skills.find(r=>r.name===skill).rulesBonus,bonus);
  assert(d.skills.find(r=>r.name==='Knw: History').cs);assert(d.skills.find(r=>r.name==='Knw: Nobility').cs);
  const feats=d.feats.filter(f=>f.sourceRace==='Elvaan');assert.equal(feats.length,1);assert.equal(feats[0].name,'Weapon Focus (Longsword)');assert.equal(feats[0].automation,'manual');assert.equal(feats[0].pendingFeat,false);
  assert.equal(d.bab,previewBuild(b).summary.bab,'Weapon Focus does not become a blanket BAB increase');
  assert.equal(d.fort_base,previewBuild(b).summary.fort,'Fearless is not a blanket save increase');
  assert.match(d.proficiencies,/longsword/);assert.match(d.senses,/Twice normal/);
  const again=compileBuild(d.rulesBuild.input,d);assert.equal(again.feats.filter(f=>f.sourceRace==='Elvaan').length,1);assert.equal(again.languages,d.languages);
 }
});
test('Elvaan requires one verified proficient weapon and rejects stale, duplicate and excessive racial selections',()=>{
 for(const change of [b=>delete b.racialChoices[WEAPON],b=>b.racialChoices[WEAPON].push(WEAPON+':option:rapier'),b=>b.racialChoices[WEAPON]=[WEAPON+':option:dagger'],b=>b.racialChoices[LANGUAGES].push(lang('goblin')),b=>b.racialChoices[LANGUAGES]=[lang('celestial'),lang('celestial')],b=>b.racialChoices[LANGUAGES]=[lang('abyssal')],b=>b.disabledTraits.push('ffd20:race:elvaan:feature:weapon-familiarity')]){
  const b=fixture();change(b);assert.throws(()=>compileBuild(b));
 }
 const without=fixture();without.disabledTraits.push('ffd20:race:elvaan:feature:martial-background');delete without.racialChoices[WEAPON];
 assert(!compileBuild(without).feats.some(f=>f.sourceRace==='Elvaan'));
 const optional=fixture();delete optional.racialChoices[LANGUAGES];assert.equal(compileBuild(optional).languages,'Common, Elvaan');
});
test('Elvaan saved feats retain manual edits and vanish when their source trait is deliberately disabled',()=>{
 const b=fixture(),d=compileBuild(b),feat=d.feats.find(f=>f.sourceRace==='Elvaan');feat.name='My sword focus';feat.desc='My note';
 d.feats.push({name:'Manual feat'});d.skills.find(r=>r.name==='Perception').temp+=3;
 const saved=compileBuild(d.rulesBuild.input,d);assert.equal(saved.feats.find(f=>f.sourceRace==='Elvaan').name,'My sword focus');assert.equal(saved.skills.find(r=>r.name==='Perception').temp,5);
 const input=structuredClone(saved.rulesBuild.input);input.disabledTraits.push('ffd20:race:elvaan:feature:martial-background');delete input.racialChoices[WEAPON];
 const removed=compileBuild(input,saved);assert(!removed.feats.some(f=>f.sourceRace==='Elvaan'));assert(removed.feats.some(f=>f.name==='Manual feat'));
});
test('Elvaan wizard exposes required weapon and optional languages while guarding variant scope',()=>{
 const b=fixture(),html=renderBuild(b,2);assert.match(html,/data-rw-racial-choice="ffd20:race:elvaan:pool:martial-background-weapon"/);
  assert.match(html,/Longsword/);assert.doesNotMatch(html,/data-rw-language-slot/);const abilities=renderBuild(b,1,{mode:'create'});assert.match(abilities,/Celestial/);assert.match(abilities,/up to 1 additional language/i);
 assert.match(html,/data-rw-alternate="ffd20:race:elvaan:feature:arcane-focus"/);assert.doesNotMatch(html,/data-rw-alternate="ffd20:race:elvaan:feature:arcane-focus" disabled/);
 assert.match(html,/value="ffd20:race:elvaan:heritage:duskwight"[^>]*disabled/);
 b.heritageId='ffd20:race:elvaan:heritage:duskwight';assert(buildIssues(b).some(i=>/standard heritage/.test(i.message)));assert.throws(()=>compileBuild(b));
 b.heritageId='';b.alternateIds=['ffd20:race:elvaan:feature:fleet-footed'];assert(buildIssues(b).some(i=>/inactive|Unknown/.test(i.message)),'stale starting weapon is invalid when Martial Background is replaced');assert.throws(()=>compileBuild(b));
});
