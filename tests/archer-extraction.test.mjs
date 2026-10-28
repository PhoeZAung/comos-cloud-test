import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {archer,archerAtLevel,archerChanges,archerTalentOptions} from '../src/features/characters/rules/archer-levels.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {newBuild} from '../src/features/characters/rules/build.mjs';
import {generateArcherPreview} from '../scripts/generate-archer.mjs';

const state=(level,name)=>archerAtLevel(level).features.find(f=>f.name===name);
const newNames=level=>archerChanges(level).filter(c=>c.kind==='new').map(x=>x.name);
const upgradeNames=level=>archerChanges(level).filter(c=>c.kind==='upgrade').map(x=>x.name);
test('Archer source has full 20-level progression, no duplicated class feature identifiers, and generated runtime matches source',async()=>{
 await generateArcherPreview({check:true});
 assert.equal(archer.data.levels.length,20);
 assert.equal(archer.data.features.length,29);
 assert.equal(archer.data.talents.length,52);
 assert.equal(archer.data.archetypeIndex.length,15);
 assert.equal(new Set(archer.data.features.map(f=>f.id)).size,29);
 assert.equal(archer.data.levels[19].bab,15);
 assert.deepEqual(archer.data.levels[19].iterativeAttacks,[15,10,5]);
 assert.deepEqual(archer.data.levels[0].iterativeAttacks,[]);
 assert.equal(archer.data.levels[19].ref,12);
});
test('Aim never duplicates when upgrading; action becomes swift at 7 and target slots grow',()=>{
 for(const [n,bonus,targets] of [[1,1,1],[5,2,2],[7,2,2],[10,3,3],[15,4,4],[20,5,5]]){
  const f=state(n,'Aim');assert.equal(f.state.bonus,bonus);assert.equal(f.state.targets,targets);
  assert.equal(archerAtLevel(n).features.filter(f=>f.name==='Aim').length,1);
 }
 assert.equal(state(6,'Aim').state.action,'move');
 assert.equal(state(7,'Aim').state.action,'move_or_swift');
 assert(upgradeNames(7).includes('Aim'));
});
test('Hawkeye, Expert Archer and Fast Movement use correct replacement values not cumulative sums',()=>{
 for(const [n,h,e,m] of [[1,null,null,null],[2,1,null,null],[4,1,1,null],[5,2,1,null],[6,2,1,10],[8,3,2,10],[9,3,2,20],[12,4,3,30],[15,5,3,40],[17,6,4,40],[18,6,4,50],[20,7,5,50]]){
  assert.equal(state(n,'Hawkeye')?.state.perceptionBonus??null,h,'Hawkeye '+n);
  assert.equal(state(n,'Expert Archer')?.state.rangedAttackBonus??null,e,'Expert '+n);
  assert.equal(state(n,'Fast Movement')?.state.speedBonusFeet??null,m,'Move '+n);
 }
 assert.equal(state(20,'Hawkeye').state.rangeIncrementFeet,35);
});
test('Upgrades found only in prose at levels 17 and 18 are accounted for',()=>{
 assert.equal(state(13,'Evasive Archer').state.rangedAcDodgeBonus,2);
 assert.equal(state(17,'Evasive Archer').state.rangedAcDodgeBonus,4);
 assert(upgradeNames(17).includes('Evasive Archer'));
 assert.equal(state(14,'Critical Aim').state.extraThreatRange,1);
 assert.equal(state(18,'Critical Aim').state.extraThreatRange,2);
 assert(upgradeNames(18).includes('Critical Aim'));
 assert.equal(state(3,'Evasion').state.improved,false);
 assert.equal(state(11,'Evasion').state.improved,true);
 assert.equal(state(7,'Uncanny Dodge').state.improved,false);
 assert.equal(state(17,'Uncanny Dodge').state.improved,true);
});
test('Separate bonus feats and all ten talent opportunities survive each level',()=>{
 assert.deepEqual([archerAtLevel(1).totalStyleFeatSlots,archerAtLevel(5).totalStyleFeatSlots,archerAtLevel(10).totalStyleFeatSlots],[1,2,3]);
 assert.deepEqual([archerAtLevel(1).totalTalentSlots,archerAtLevel(2).totalTalentSlots,archerAtLevel(20).totalTalentSlots],[0,1,10]);
 assert.equal(archer.data.events.filter(e=>e.type==='choose'&&e.poolId.endsWith('archery-talents')).length,10);
 assert(archerTalentOptions(2).find(x=>x.name==='Greater Intercept').meetsLevel===false);
 assert(archerTalentOptions(18).find(x=>x.name==='Greater Intercept').requiresVerification);
});
test('live wizard renders Archer level and changes as a read-only explorer; Black Mage save path remains explicit',()=>{
 const b=newBuild();b.raceId='ffd20:race:dwarf';b.name='Archer viewer';
 const html=renderBuild(b,3,{archerPreviewLevel:17});
 assert.match(html,/Archer — Class Levels & Upgrades/);
 assert.match(html,/data-rw-archer-level/);
 assert.match(html,/↑ Improved: Evasive Archer/);
 assert.match(html,/Hawkeye/);
 assert.match(html,/read-only rules explorer/);
 assert.match(html,/<option>Black Mage<\/option>/);
});
test('invalid level inputs throw instead of silently changing levels',()=>{
 assert.throws(()=>archerAtLevel(21),/1–20/);
 assert.throws(()=>archerAtLevel(0),/1–20/);
});
