import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {generateRaceCatalog,projectRaceDefinition} from '../scripts/generate-races.mjs';
import {registry,raceFor,newBuild,choiceEvents,eligibleOptions,calculated,spells,compileBuild,effectiveScores,raceTraits} from '../src/features/characters/rules/build.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {renderSection} from '../src/features/sheet/view.mjs';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8').then(JSON.parse);
function fixture(){
 const b=newBuild();b.name='Race integration';b.raceId='ffd20:race:dwarf';b.baseScores.int=18;b.reviewed=true;b.skillRanks=fixedSkills.map((_,i)=>i<8?1:0);
 for(const event of choiceEvents(b))b.choices[event.id]=eligibleOptions(b,event).slice(0,calculated(event.count,b)).map(o=>o.id);
 b.spellIds=[...spells.filter(s=>s.level===0).slice(0,4),...spells.filter(s=>s.level===1).slice(0,7)].map(s=>s.id);
 return b;
}
test('normal builds use the individual race definitions and retain auditable descriptions',async()=>{
 await generateRaceCatalog({check:true});
 const dwarf=await read('rules/races/dwarf.race.json');
 assert.equal(registry.races[0].revision,dwarf.revision);
 const emitted=new Map([...dwarf.features,...dwarf.data.heritages,...dwarf.data.favoredRewards].map(o=>[o.id,o.description]));
 for(const audit of dwarf.automationContract.textAudit)assert.equal(audit.sha256,createHash('sha256').update(emitted.get(audit.id)).digest('hex'));
 assert.equal(dwarf.review.state,'needs_review');assert(dwarf.review.issues.some(i=>i.blocking));
 assert(dwarf.features.every(f=>f.descriptionStatus!=='full_verified'));
});
test('an unimplemented unconditional effect never becomes an automatic runtime buff',async()=>{
 const dwarf=await read('rules/races/dwarf.race.json');
 const effect=dwarf.features.find(f=>f.name==='Unstoppable').effects.find(e=>e.target==='defense.saves.fortitude');
 assert.equal(effect.automation,'automatic');
 const projected=projectRaceDefinition(dwarf,['ffd20:class:black-mage']);
 assert.equal(projected.features.find(f=>f.name==='Unstoppable').effects.find(e=>e.id===effect.id).automation,'manual');
 assert.equal(projected.data.favoredRewards.length,1);assert.equal(dwarf.data.favoredRewards.length,39);
});
test('identity keeps type and movement/language exceptions without adding conditional save bonuses',()=>{
 const b=fixture(),d=compileBuild(b);
 assert.deepEqual([d.racialIdentity.type,...d.racialIdentity.subtypes],['humanoid','dwarf']);
 const html=renderSection({id:'synthetic',name:b.name,data:d},'overview');
 assert.match(html,/Armor and encumbrance do not modify/);assert.match(html,/Galkan, Giant, Goblin/);
 assert.match(html,/Racial identity rules/);assert.equal(d.fort_base,0);
 b.disabledTraits=['ffd20:race:dwarf:feature:languages'];const without=compileBuild(b,d);
 assert.equal(without.languages,'');assert(!without.racialIdentity.rules.some(r=>r.name==='Languages'));
});
test('Iifa skill bonuses apply once, then disappear while manual bonuses and current resources survive',()=>{
 const b=fixture();b.alternateIds=['ffd20:race:dwarf:feature:iifa-professor'];const d=compileBuild(b);
 const idx=fixedSkills.findIndex(s=>s.name==='Knw: Arcana');assert(idx>=0);assert.equal(d.skills[idx].rulesBonus,1);assert.equal(d.skills[idx].cs,true);
 d.skills[idx].temp+=3;d.hp_curr=1;d.mp=0;d.racialAbilities.push({name:'Manual ancestry note',desc:'Keep'});
 const again=compileBuild(b,d);assert.equal(again.skills[idx].temp,4);
 b.alternateIds=[];const removed=compileBuild(b,again);assert.equal(removed.skills[idx].temp,3);assert.equal(removed.hp_curr,1);assert.equal(removed.mp,0);assert(removed.racialAbilities.some(a=>a.name==='Manual ancestry note'));
});
test('Tavern Hopper replaces the whole vector, conflicts with heritage, and Saltbeard stays blocked',()=>{
 const b=fixture();b.alternateIds=['ffd20:race:dwarf:feature:tavern-hopper'];
 assert.deepEqual(effectiveScores(b),{str:10,dex:10,con:12,int:18,wis:8,cha:12});
 b.heritageId=registry.races[0].data.heritages[0].id;assert(raceTraits(b).errors.length);
 b.heritageId='';b.alternateIds=['ffd20:race:dwarf:feature:saltbeard'];assert.throws(()=>compileBuild(b),/precise replacement/);
});

test('staged races appear for live testing while keeping unverified mechanics manual',async()=>{
 const manifest=await read('rules/manifest.json');
 const staging=await read('rules/staging/races/manifest.json');
 assert.equal(manifest.races.length,23);
 assert.equal(staging.enabledInWizard,true);
 assert.equal(staging.importReady,false);
 assert.equal(registry.races.length,23);
 const live=registry.races.filter(r=>!r.testing),experimental=registry.races.filter(r=>r.testing);
 assert.equal(live.length,3);
 assert.equal(experimental.length,20);
 for(const race of experimental){
  assert.equal(race.reviewStatus,'needs_review');
  assert(race.data.standardTraitIds.length>0);
  assert(race.sources[0].url.startsWith('https://'));
  const b=newBuild();b.raceId=race.id;
  assert.equal(raceFor(b)?.id,race.id);
  assert.deepEqual(raceTraits(b).errors,[]);
  for(const f of race.features)for(const e of f.effects){
   if(e.automation==='automatic'){
    assert.equal(e.condition,null,'conditional bonus may not auto-apply');
    assert(/^(ability_scores|skills|identity|proficiencies\\.weapon)\\./.test(e.target),'automatic effect path not supported');
   }
  }
 }
 assert.equal(registry.races.some(r=>r.name==='Beastkin'),false);
});

test('batch 07 race lineages and special restrictions are visible without unsafe automatic grants',async()=>{
 const immigrant=registry.races.find(r=>r.id==='ffd20:race:immortal');
 const lambkin=registry.races.find(r=>r.id==='ffd20:race:lambkin');
 const mandragora=registry.races.find(r=>r.id==='ffd20:race:mandragora');
 assert.deepEqual(immigrant.data.heritages.map(h=>h.name),['Ancients','Unlimited']);
 assert.equal(immigrant.data.favoredRewards.length,0); // No currently enabled Black Mage favored reward on the official page.
 const b=newBuild();b.raceId=immigrant.id;
 assert.equal(effectiveScores(b).str,10); // Chosen +2 must not grant to every score.
 assert(buildIssues(b).some(i=>/Immortal|MP pool/i.test(i.message)));
 assert(lambkin.features.some(f=>f.name==='Auto-Float'));
 assert.equal(mandragora.data.heritages.length,5);
 assert.equal(mandragora.data.alternateTraitIds.length,22);
 for(const h of mandragora.data.heritages){
  b.raceId=mandragora.id;b.heritageId=h.id;
  assert(raceTraits(b).errors.length>0); // Hero does not get unverified replacement effects for free.
 }
});
