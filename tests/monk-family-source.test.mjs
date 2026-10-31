import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {validateClassDefinition} from '../src/features/characters/rules/class-contract.mjs';
import {validateArchetypeDefinition} from '../src/features/characters/rules/archetype-contract.mjs';
import {validateSheetFamily} from '../src/features/characters/rules/sheet-family-contract.mjs';
import {familyChoiceEvents,familyFeatures} from '../src/features/characters/rules/family-progression.mjs';
const read=async file=>JSON.parse(await readFile(new URL('../'+file,import.meta.url),'utf8'));
const c=await read('rules/classes/monk.class.json'),ID=c.id,parent={...c,features:c.data.features,upgrades:c.data.upgrades};
const files=(await readdir(new URL('../rules/classes/archetypes/',import.meta.url))).filter(f=>f.startsWith('monk-')&&f.endsWith('.archetype.json'));
const archetypes=await Promise.all(files.map(f=>read('rules/classes/archetypes/'+f))),arch=name=>archetypes.find(a=>a.id.endsWith(':'+name));
test('Monk and all twenty source-backed archetypes satisfy data contracts and source identity',()=>{
 assert.equal(archetypes.length,20);assert.equal(c.data.features.length,25);assert.deepEqual(c.data.supportedLevels,Array.from({length:20},(_,i)=>i+1));validateClassDefinition(c);validateSheetFamily(c);
 assert.equal(c.data.levels[19].bab,20);assert.equal(c.data.levels[19].fort,12);assert.equal(c.data.levels[19].ref,12);assert.equal(c.data.levels[19].will,6);
 for(const a of archetypes){validateArchetypeDefinition(a,c);validateSheetFamily(a,{parent:c});assert.equal(a.name,a.sources[0].title);assert.match(a.sources[0].archiveSha256,/^[a-f0-9]{64}$/);assert.equal(a.data.supportedLevels.length,20);}
});
test('Monk preserves shipped first-level feature IDs and expands exact talent/blitz schedules',()=>{
 for(const name of ['weapon-and-armor-proficiency','bodybuilding','flurry-of-blows','flying-kick','martial-arts','martial-wisdom','body-of-stone','flawless-fists'])assert(c.data.features.some(f=>f.id===ID+':feature:'+name&&f.atLevel===1));
 assert.equal(c.data.choicePools.flatMap(p=>p.options).length,51);
 assert.deepEqual(familyChoiceEvents(parent,null,20,{}).filter(e=>e.poolIds[0].endsWith(':monk-talents')).map(e=>e.atClassLevel),[2,4,6,8,10,12,14,16,18,20]);
 assert.deepEqual(familyChoiceEvents(parent,null,20,{}).filter(e=>e.poolIds[0].endsWith(':blitz-techniques')).map(e=>e.atClassLevel),[3,6,9,12,15,18]);
 assert.equal(c.data.unarmedDamage.at(-1).medium,'2d10');assert(c.data.features.find(f=>f.id===ID+':feature:chakra').description.includes('Constitution'));
});
test('Monk archetype partial replacements preserve every unaffected acquisition slot',()=>{
 const talents=a=>familyChoiceEvents(parent,arch(a),20,{}).filter(e=>e.poolIds[0]===ID+':pool:monk-talents').map(e=>e.atClassLevel);
 assert.deepEqual(talents('white-monk'),[2,6,10,14,18]);assert.deepEqual(talents('fist-of-rhalgr'),[2,6,10,14,18]);assert.deepEqual(talents('master-of-many-styles'),[4,8,12,16,20]);assert.deepEqual(talents('diminutive-adept'),[2,4,8,10,12,14,16,18,20]);
 assert.deepEqual(familyChoiceEvents(parent,arch('featherweight'),20,{}).filter(e=>e.poolIds[0]===ID+':pool:blitz-techniques').map(e=>e.atClassLevel),[6,12,18]);
 assert(!familyFeatures(parent,arch('weapon-adept'),20,{}).some(f=>f.id===ID+':feature:martial-arts'));assert(familyFeatures(parent,arch('weapon-adept'),20,{}).some(f=>f.name==='Perfect Strike'));
});
test('Monk native choices retain source level limits, exact resources, and racial restrictions',()=>{
 const mk=arch('ki-master');assert(mk.data.choicePools[0].options.some(o=>o.requiresOptionIds?.length));
 const fist=arch('fist-of-rhalgr'),combo=fist.data.choicePools.find(p=>p.name==='Combo Finishers');assert.equal(fist.data.events.filter(e=>e.type==='choose'&&e.atClassLevel===1).length,2);assert(combo.options.some(o=>o.minimumLevel===16));assert.equal(fist.data.extraOptions[0].options.length,7);
 assert.equal(arch('meowfist').data.profile.requiredRaceId,'ffd20:race:palico');assert.equal(arch('diminutive-adept').data.profile.requiredSize,'small');assert.deepEqual(arch('nimble-guardian').data.profile.requiredRaceIds,['ffd20:race:mithra','ffd20:race:ronso']);
 assert.equal(arch('featherweight').data.profile.hitDie,10);assert.equal(fist.data.profile.hitDie,10);assert.equal(c.data.hitDie,12);
 const repeat=c.data.choicePools[0].options.find(o=>o.name==='HP Boost');assert.equal(repeat.minimumLevel,2);assert.deepEqual(repeat.rankMinimumLevels,[2,6,10]);
});
test('White Monk declares manual spell learning and the complete source MP/spell-cap table',()=>{
 const w=arch('white-monk');assert.equal(w.data.profile.hitDie,8);assert.equal(w.data.profile.levels[0].bab,0);assert.equal(w.data.profile.levels[19].bab,15);assert(w.data.profile.manualSpellcasting);assert.equal(w.data.profile.castingAbility,'wis');assert.equal(w.data.profile.levels[0].baseMp,2);assert.equal(w.data.profile.levels[19].baseMp,79);assert.equal(w.data.profile.levels[19].maxSpellLevel,6);assert.equal(w.data.profile.levels[3].maxSpellLevel,2);assert(w.data.features.find(f=>f.name==='Spells and Cantrips').description.includes('Spell learning and selection are manual'));
});

test('compiled Monk variants apply their own resource ability and preserve spent Ki uses',async()=>{
 const {familyFixture,advanceFamily}=await import('./helpers/sheet-family-fixtures.mjs');
 const {compileBuild,levelUpBuild,effectiveScores}=await import('../src/features/characters/rules/build.mjs');
 for(const name of ['featherweight','ki-master']){
  const b=familyFixture(ID,'ffd20:archetype:monk:'+name);b.baseScores.con=12;b.baseScores.wis=16;assert.equal(effectiveScores(b).con,12);assert.equal(effectiveScores(b).wis,18);
  let saved=compileBuild(b);assert.equal(saved.hp_max,name==='featherweight'?11:14);saved=levelUpBuild(advanceFamily(saved),saved);
  let ki=[...saved.activeAbilities,...saved.passiveAbilities].find(f=>f.sourceRuleId===ID+':feature:ki-pool');assert.equal(ki.u_max,5,'half level plus WIS4, not CON1');ki.u_curr=1;
  saved=levelUpBuild(advanceFamily(saved),saved);saved=levelUpBuild(advanceFamily(saved),saved);ki=[...saved.activeAbilities,...saved.passiveAbilities].find(f=>f.sourceRuleId===ID+':feature:ki-pool');assert.equal(ki.u_max,6);assert.equal(ki.u_curr,2,'four spent uses survive growth');
 }
});
test('compiled Weapon Adept removes the replaced parent feat and White Monk uses its source chassis and MP',async()=>{
 const {familyFixture,advanceFamily}=await import('./helpers/sheet-family-fixtures.mjs');
 const {compileBuild,levelUpBuild}=await import('../src/features/characters/rules/build.mjs');
 const weapon=compileBuild(familyFixture(ID,'ffd20:archetype:monk:weapon-adept'));assert(!weapon.feats.some(f=>f.sourceRuleId===ID+':bonus-feat:improved-unarmed-strike'));
 const b=familyFixture(ID,'ffd20:archetype:monk:white-monk');b.baseScores.con=12;b.baseScores.wis=16;let white=compileBuild(b);assert.equal(white.hp_max,9);assert.equal(white.bab,0);assert.equal(white.mp_class,2);assert.equal(white.mp_bonus,1);assert.equal(white.spells.length,0);
 white=levelUpBuild(advanceFamily(white),white);assert.equal(white.hp_max,15);assert.equal(white.bab,1);assert.equal(white.mp_class,3);assert.equal(white.mp_bonus,1);
});
