import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateBeastmasterCompanions} from '../scripts/validate-beastmaster-companions.mjs';
import {buildClassCatalog} from '../scripts/generate-class-catalog.mjs';
const load=async()=>JSON.parse(await readFile(new URL('../rules/classes/beastmaster.class.json',import.meta.url),'utf8'));
const species=(c,name)=>c.data.companion.species.find(s=>s.name===name);

test('companion source retains level-restricted starters and excludes gated groups from ordinary first-level candidates',async()=>{
 const c=await load(),companion=c.data.companion;
 assert.deepEqual(validateBeastmasterCompanions(c),{species:35,groups:4,firstLevelOrdinaryCandidates:11,advancementBlocks:46});
 const candidates=companion.firstLevelOrdinaryCandidateIds;
 assert(candidates.includes(species(c,'Wolf').id));assert(candidates.includes(species(c,'Chocobo, Gray').id));
 for(const [name,level] of [['Bear, Grizzly',2],['Chocobo, Orange',4],['Chocobo, Bronze',8],['Chocobo, Teal',12]]){
  assert.equal(species(c,name).starterLevel,level);assert(!candidates.includes(species(c,name).id));
 }
 for(const s of companion.species.filter(s=>s.groupId!=='animal'))assert(!candidates.includes(s.id));
 assert.match(species(c,'Coeurl').entryPrerequisitesText,/Survival 7 ranks/);
 assert.match(species(c,'Behemoth, Young').entryPrerequisitesText,/Knowledge \(arcana\) 7 ranks/);
 const dropped=structuredClone(c);dropped.data.companion.speciesGroups.find(g=>g.id==='magical-beast').requirements.requiredFeatNames=[];
 assert.throws(()=>validateBeastmasterCompanions(dropped),/group prerequisites/);
 const masteryDropped=structuredClone(c);masteryDropped.data.companion.speciesGroups.find(g=>g.id==='magical-beast').requirements.masteryRequiredFeatNames=[];
 assert.throws(()=>validateBeastmasterCompanions(masteryDropped),/mastery prerequisite/);
 for(const name of ['Chocobo, Orange','Coeurl','Funguar','Scorpion']){
  const leaked=structuredClone(c);leaked.data.companion.firstLevelOrdinaryCandidateIds.push(species(c,name).id);
  assert.throws(()=>validateBeastmasterCompanions(leaked),/gated or later starter/);
 }
});

test('companion staging keeps absent Intelligence, aquatic movement and advancement-only powers separate from starting rules',async()=>{
 const c=await load(),crab=species(c,'Crab, Giant (Aquatic)'),shark=species(c,'Shark (Aquatic)'),bat=species(c,'Bat, Cave (Avian)');
 assert.equal(crab.startingStatistics.scores.int,null);assert.equal(crab.startingStatistics.mindless,true);
 assert.deepEqual(shark.startingStatistics.speeds,[{mode:'swim',feet:60}]);
 assert.equal(bat.startingStatistics.naturalArmorBonus,null);
 assert.match(c.data.companion.speciesGroups.find(g=>g.id==='vermin').rulesText,/no skill points or feats/);
 const sabertusk=species(c,'Sabertusk');assert.doesNotMatch(sabertusk.startingRules,/Throat-Rip/);
 assert.match(sabertusk.advancements[0].description,/Throat-Rip/);
 const broken=structuredClone(c);species(broken,'Crab, Giant (Aquatic)').startingStatistics.scores.int=0;
 assert.throws(()=>validateBeastmasterCompanions(broken),/invalid ability score/);
 const enabled=structuredClone(c);enabled.data.companion.automation='automatic';
 assert.throws(()=>validateBeastmasterCompanions(enabled),/cannot claim runtime support/);
});

test('magical mastery, source discrepancies and staged status do not grant playable companion choices',async()=>{
 const c=await load(),blood=species(c,'Blood Sucker (Aquatic)');
 assert.match(blood.startingStatistics.sourceText,/20-ft\. radius/);
 assert.match(blood.startingRules,/10-foot-radius cloud/);
 assert.match(blood.advancements.find(a=>a.kind==='mastery').description,/Choco Water/);
 assert.doesNotMatch(blood.startingRules,/Choco Water/);
 assert.match(c.data.companion.speciesGroups.find(g=>g.id==='magical-beast').rulesText,/Beast Speaker Mastery/);
 const projected=(await buildClassCatalog()).classes.find(r=>r.id===c.id);
 assert.equal(projected.status,'staged');assert.equal(projected.adapter,null);assert.equal(projected.data,undefined);
 assert.equal(projected.features.length,6); // Companion source blocks are not player feature grants.
});
