import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {globSync} from 'node:fs';
import {validateClassDefinition} from '../src/features/characters/rules/class-contract.mjs';
import {validateArchetypeDefinition} from '../src/features/characters/rules/archetype-contract.mjs';
import {validateSheetFamily} from '../src/features/characters/rules/sheet-family-contract.mjs';
import {familyChoiceEvents,familyFeatures} from '../src/features/characters/rules/family-progression.mjs';
import {isLimitBreak} from '../src/features/sheet/limit-breaks.mjs';
const base=JSON.parse(await readFile(new URL('../rules/classes/warrior.class.json',import.meta.url))),ID=base.id;
const arches=await Promise.all(globSync('rules/classes/archetypes/warrior-*.archetype.json').map(async path=>JSON.parse(await readFile(path))));
const arch=key=>arches.find(a=>a.id==='ffd20:archetype:warrior:'+key);
const talents=a=>familyChoiceEvents({...base,features:base.data.features,...base.data},a,20,{}).filter(e=>e.poolIds.includes(ID+':pool:warrior-talents')).map(e=>e.atClassLevel);
test('Warrior and all 25 source archetypes satisfy full progression/replacement data contracts',()=>{
 assert.equal(arches.length,25);assert.equal(validateClassDefinition(base).levels,20);validateSheetFamily(base);
 for(const a of arches){validateArchetypeDefinition(a,base);validateSheetFamily(a,{parent:base});assert.equal(a.sources[0].archiveSha256.length,64);assert.deepEqual(a.data.supportedLevels,Array.from({length:20},(_,i)=>i+1));}
 assert.equal(base.data.hitDie,10);assert.equal(base.data.skillRanksPerLevel,4);assert.equal(base.data.startingWealth,175);
 const last=base.data.levels.at(-1);assert.deepEqual([last.bab,last.fort,last.ref,last.will],[20,12,6,6]);
});
test('Warrior has 71 real talent options with bounded advanced levels and eleven native chosen weapon groups',()=>{
 const opts=base.data.choicePools.find(p=>p.id.endsWith(':warrior-talents')).options;assert.equal(opts.length,71);assert(!opts.some(o=>o.name==='Warrior Advanced Talent'||o.description.startsWith('Benefits')));assert.equal(opts.find(o=>o.name==='Greater Penetrating Attack').minimumLevel,16);assert.equal(opts.find(o=>o.name==='Adaptable Training').minimumLevel,12);
 assert.equal(base.data.choicePools.find(p=>p.id.endsWith(':chosen-weapon')).options.length,11);
 assert(opts.every(o=>o.description.includes('Prerequisites:')&&o.sourceRefs.length));
});
test('Warrior exact talent-slot replacements preserve unaffected acquisitions',()=>{
 assert.deepEqual(talents(arch('mercenary')),[6,10,14,16,18,20]);
 assert.deepEqual(talents(arch('defender')),[4,6,8,10,12,14,16,18,20]);
 assert.deepEqual(talents(arch('demon-hunter')),[20]);
 assert.deepEqual(talents(arch('swarm-fighter')),[6,10,14,18]);
 assert.deepEqual(talents(arch('viking')),[4,6,8,10,12,14,16,18,20]);
 assert.deepEqual(talents(arch('talekeeper')),[2,4,6,8,10,12,14,16,18,20]);
});
test('Warrior technique components preserve stamina and Delay Fatigue under partial replacements',()=>{
 const parent={...base,features:base.data.features,upgrades:base.data.upgrades};
 for(const key of ['viking','nimble-striker','sea-wolf','monster-hunter','shinsect']){const fs=familyFeatures(parent,arch(key),20,{});assert(fs.some(f=>f.name==='Stamina Pool'),key);assert(fs.some(f=>f.name==='Delay Fatigue'),key);assert(!fs.some(f=>f.name==='Overhand Chop'),key);assert(!fs.some(f=>f.name==='Increase Save'),key);}
 const squire=familyFeatures(parent,arch('squire'),20,{});assert.equal(squire.filter(f=>f.name==='Stamina Pool').length,1);assert(squire.some(f=>f.name==='Guts Techniques'));
 const first=familyFeatures(parent,arch('first-shield'),20,{});assert(!first.some(f=>f.id===ID+':feature:chosen-weapon'));assert(!first.some(f=>f.id===ID+':feature:chosen-knowledge'));assert(first.some(f=>f.name==='Increase Save'));assert(!first.some(f=>f.name==='Overhand Chop'));
});
test('Warrior source wording and partial finisher replacements have correct acquisition and ownership',()=>{
 const at=(a,name)=>arch(a).data.features.find(f=>f.name===name).atLevel;
 assert.equal(at('gladiator','Shake It Off'),3);assert.equal(at('gladiator','Fleet'),9);assert.equal(at('gladiator','Defensive Roll'),15);assert.equal(at('lanista','Know Your Enemy'),1);assert.equal(at('monster-hunter','Master Hunter'),20);assert.equal(at('shinsect','Small Arms Expertise'),3);
 const parent={...base,features:base.data.features,upgrades:base.data.upgrades};
 for(const key of ['demon-hunter','weapon-collector','feral-guardian','first-shield']){const fs=familyFeatures(parent,arch(key),20,{});assert.equal(fs.filter(f=>isLimitBreak({...f,limitBreak:f.featureKind==='limit_break'})).length,2,key);}
 const wc=familyFeatures(parent,arch('weapon-collector'),20,{});assert(wc.some(f=>f.name==='Critical Strikes'));assert(!wc.some(f=>f.name==='Omnistrike'));assert(wc.some(f=>f.name==='Swords of Chance'));
});
test('Warrior profile restrictions and source-granted manual alternatives stay explicit',()=>{
 assert.deepEqual(arch('swarm-fighter').data.profile.requiredRacialTraitNames,['Swarming']);
 assert(arch('shinsect').data.profile.proficiencies.includes('Tower shields'));assert(arch('shinsect').data.profile.proficiencies.includes('Heavy armor'));
 assert(!arch('demon-hunter').data.profile.classSkills.includes('handle-animal'));assert(arch('sea-wolf').data.profile.classSkills.includes('handle-animal'));assert(!arch('sea-wolf').data.profile.classSkills.includes('knowledge:dungeoneering'));
 assert(arch('defender').data.profile.excludedOptionNames.includes('Axes'));assert(!arch('defender').data.profile.excludedOptionNames.includes('Close'));
 for(const key of ['talekeeper','first-shield','viking','feral-guardian','shinsect'])assert(arch(key).data.extraOptions.length,key);
});

test('Warrior runtime enforces restricted chosen groups and Swarming while preserving source stamina',async()=>{
 const {familyFixture,advanceFamily}=await import('./helpers/sheet-family-fixtures.mjs');const {compileBuild,levelUpBuild,buildIssues,choiceEvents,eligibleOptions}=await import('../src/features/characters/rules/build.mjs');
 for(const [key,names] of [['defender',['Close']],['foehammer',['Flails','Hammers']],['nimble-striker',['Blades, Light','Close']],['stormbreaker',['Flails','Hammers']],['draconic-warrior',['Natural']]]){
  const b=familyFixture(ID,'ffd20:archetype:warrior:'+key),e=choiceEvents(b).find(e=>e.poolIds.includes(ID+':pool:chosen-weapon'));assert.deepEqual(eligibleOptions(b,e).map(o=>o.name).sort(),names.sort());b.choices[e.id]=[ID+':option:chosen-weapon:axes'];assert(buildIssues(b).length,key+' rejects Axes');
 }
 const swarm=familyFixture(ID,'ffd20:archetype:warrior:swarm-fighter');assert.equal(swarm.raceId,'ffd20:race:gnath');assert(swarm.alternateIds.includes('ffd20:race:gnath:trait:swarming'));assert.equal(buildIssues(swarm).length,0);swarm.alternateIds=[];assert(buildIssues(swarm).some(e=>e.message.includes('Swarming')));
 for(const key of ['viking','nimble-striker','squire','first-shield']){let d=compileBuild(familyFixture(ID,'ffd20:archetype:warrior:'+key));while(d.level<3)d=levelUpBuild(advanceFamily(d),d);const rows=[...d.activeAbilities,...d.passiveAbilities].filter(f=>f.name==='Stamina Pool');assert.equal(rows.length,1,key);assert(rows[0].u_max>=1,key);}
});
