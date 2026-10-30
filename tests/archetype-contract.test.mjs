import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateArchetypeDefinition,validateArchetypeManifest} from '../src/features/characters/rules/archetype-contract.mjs';
import {buildClassCatalog} from '../scripts/generate-class-catalog.mjs';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
test('archetype index is a separate batchable manifest and cannot silently go live',async()=>{
 const m=validateArchetypeManifest(await read('rules/classes/archetypes/manifest.json'));
 assert.deepEqual(m.archetypes.map(a=>[a.id,a.adapter]),[['ffd20:archetype:chocobo-knight:mog-knight','mog-knight-level-one'],['ffd20:archetype:chocobo-knight:antrider',null],['ffd20:archetype:chocobo-knight:beast-rider',null],['ffd20:archetype:chocobo-knight:deadly-lancer','deadly-lancer-level-one'],['ffd20:archetype:chocobo-knight:fell-rider','fell-rider-level-one'],['ffd20:archetype:gunbreaker:doom-slayer','doom-slayer-level-one']]);
 const [mog]=(await buildClassCatalog()).archetypeRecords;
 assert.equal(mog.name,'Mog Knight');assert.deepEqual(mog.data.supportedLevels,[1]);
 const invalid=structuredClone(m);invalid.archetypes.push({id:'ffd20:archetype:bard:abhorsen',file:'rules/classes/archetypes/bard-abhorsen.archetype.json',status:'live',adapter:'bard'});
 assert.throws(()=>validateArchetypeManifest(invalid),/no archetype can become live/);
});
test('archetype validator requires exact existing base feature target and source locator',async()=>{
 const parent=await read('rules/classes/bard.class.json'),base='ffd20:archetype:bard:example',feature=base+':feature:example';
 const obj={schemaVersion:'comos.rules.v1',kind:'archetype',id:base,parentClassId:parent.id,name:'Example',
  sources:[{id:'main',url:'https://finalfantasyd20.com/classes/core-classes/bard/archetypes/'}],
  review:{state:'needs_review',coverage:'partial'},
  data:{features:[{id:feature,name:'Example',atLevel:1,description:'Sample ability',sourceRefs:[{sourceId:'main',section:'Features',locator:'100'}]}],
   replacements:[{id:base+':replacement:one',atClassLevel:1,operation:'replace',scope:'whole_feature',resolution:'needs_review',
   targetFeatureIds:[parent.data.features[0].id],replacementFeatureIds:[feature],sourceRefs:[{sourceId:'main',section:'Features',locator:'101'}]}],upgrades:[]}};
 assert.equal(validateArchetypeDefinition(obj,parent).replacements,1);
 obj.data.replacements[0].targetFeatureIds=['ffd20:class:bard:feature:invented'];
 assert.throws(()=>validateArchetypeDefinition(obj,parent),/unknown parent feature/);
});
