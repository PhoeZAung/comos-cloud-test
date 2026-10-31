import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,registry,buildIssues,raceTraits,compileBuild,previewBuild} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {racialChoiceSpecs,pruneRacialChoices,GUADO_ELEMENT,VIERA_ELEMENT,IXAL_ELEMENT,IXAL_TERRAIN,LAMIA_TERRAIN,LAMIA_TEMPERED} from '../src/features/characters/rules/racial-choices.mjs';

const race=slug=>registry.races.find(r=>r.id==='ffd20:race:'+slug);
function fixture(slug){
 const b=newBuild();Object.assign(b,{name:'Patch 05A '+slug,alignment:'True Neutral',
  raceId:race(slug).id,classId:'ffd20:class:dancer',reviewed:true});
 b.hpRolls=[classHitDie(b)];return b;
}
function finish(b){
 b.skillRanks=fixedSkills.map(()=>0);
 for(let i=0,remaining=previewBuild(b).skillBudget;i<fixedSkills.length&&remaining>0;i++,remaining--)b.skillRanks[i]=1;
 return b;
}
const issues=b=>buildIssues(b,{complete:false}).map(x=>x.message);

test('Guado, Viera and Ixal select one of exactly six elemental subtypes (not all)',()=>{
 for(const [slug,pool] of [['guado',GUADO_ELEMENT],['viera',VIERA_ELEMENT],['ixal',IXAL_ELEMENT]]){
  const b=fixture(slug),r=race(slug),spec=racialChoiceSpecs(r,raceTraits(b).traits).find(x=>x.id===pool);
  assert(spec,slug+' choice');assert.equal(spec.minimum,1);assert.equal(spec.maximum,1);
  assert.deepEqual(spec.options.map(x=>x.value),['earth','fire','ice','lightning','water','wind']);
  assert.match(renderBuild(b,2),new RegExp('data-rw-racial-choice="'+pool+'"'));
  assert(issues(b).some(x=>x.includes(spec.name)),slug+' mandatory pick');
  b.racialChoices[pool]=[pool+':option:wind'];
  const effects=raceTraits(b).traits.flatMap(f=>f.effects).filter(e=>e.target==='race.elemental-summoner.subtype');
  assert.equal(effects.length,1,slug+' one conditional effect');
  assert.match(effects[0].textValue,/Wind/);
  assert.match(effects[0].textValue,/\+2 rounds/);
  assert.equal(effects[0].automation,'manual');
  assert(!issues(b).some(x=>x.includes(spec.name)),slug+' selected');
  b.racialChoices[pool]=[pool+':option:nonexistent'];
  assert(issues(b).some(x=>x.includes('Invalid or duplicate '+spec.name)),slug+' forged invalid');
 }
});

test('Ixal requires both terrain and elemental subtype; conditional terrain never becomes permanent AC',()=>{
 const b=fixture('ixal');
 const missing=issues(b);assert(missing.some(x=>/Bond to the Ice/.test(x)));
 assert(missing.some(x=>/Elemental Summoner/.test(x)));
 b.racialChoices[IXAL_TERRAIN]=[IXAL_TERRAIN+':option:forested'];
 b.racialChoices[IXAL_ELEMENT]=[IXAL_ELEMENT+':option:earth'];
 assert(!issues(b).some(x=>/Bond to the Ice.*choose|Elemental Summoner.*choose/.test(x)));
 const conditional=raceTraits(b).traits.flatMap(f=>f.effects).find(e=>e.target==='race.terrain.bond');
 assert.match(conditional.textValue,/Forested/);assert.match(conditional.textValue,/\+2 dodge AC only/);
 assert.equal(conditional.automation,'manual');
 const sheet=compileBuild(finish(b));
 assert.deepEqual(sheet.rulesBuild.input.racialChoices,b.racialChoices);
 assert.equal(sheet.ac_temp||0,0);
 const changed=structuredClone(b);changed.racialChoices[IXAL_TERRAIN]=[IXAL_TERRAIN+':option:icy'];
 assert.throws(()=>compileBuild(changed,sheet),/cannot be changed/);
});

test('Lamia Bond to the Land selects Desert or Water; Tempered selects Water or Wind resistance 5',()=>{
 const b=fixture('lamia');
 assert(issues(b).some(x=>/Bond to the Land/.test(x)));
 assert.match(renderBuild(b,2),new RegExp('data-rw-racial-choice="'+LAMIA_TERRAIN+'"'));
 b.racialChoices[LAMIA_TERRAIN]=[LAMIA_TERRAIN+':option:desert'];
 let effects=raceTraits(b).traits.flatMap(f=>f.effects);
 assert.match(effects.find(e=>e.target==='race.terrain.bond').textValue,/Desert/);
 assert(!issues(b).some(x=>/Bond to the Land.*choose/.test(x)));
 b.alternateIds=[b.raceId+':trait:tempered'];
 assert(issues(b).some(x=>/Tempered/.test(x)));
 b.racialChoices[LAMIA_TEMPERED]=[LAMIA_TEMPERED+':option:wind'];
 effects=raceTraits(b).traits.flatMap(f=>f.effects);
 const resistance=effects.filter(e=>e.target==='race.lamia.tempered-resistance');
 assert.equal(resistance.length,1);assert.match(resistance[0].textValue,/Wind resistance 5/);
 assert.doesNotMatch(resistance[0].textValue,/Water resistance 5/);
 assert.equal(resistance[0].automation,'manual');
 const sheet=compileBuild(finish(b));
 assert.equal(sheet.ac_temp||0,0);
 const tampered=structuredClone(b);tampered.racialChoices[LAMIA_TEMPERED]=[LAMIA_TEMPERED+':option:water'];
 assert.throws(()=>compileBuild(tampered,sheet),/cannot be changed/);
});

test('Source-defined replacements and disabled traits prune obsolete selections safely',()=>{
 for(const [slug,pool,alternate] of [
  ['guado',GUADO_ELEMENT,'unsent-summoner'],['viera',VIERA_ELEMENT,'misty-mind'],
  ['lamia',LAMIA_TERRAIN,'seasinger']
 ]){
  const b=fixture(slug);b.racialChoices[pool]=[pool+':option:'+ (slug==='lamia'?'desert':'fire')];
  b.alternateIds=[b.raceId+':trait:'+alternate];
  const r=race(slug),traits=raceTraits(b).traits;
  assert(!racialChoiceSpecs(r,traits).some(s=>s.id===pool));
  assert(issues(b).some(x=>/Unknown or inactive racial choice/.test(x)),slug);
  pruneRacialChoices(b,r,traits);
  assert.equal(b.racialChoices[pool],undefined);
 }
});

test('Trollkin conflicting weakness text stays manual and has no invented elemental picker',()=>{
 const b=fixture('trollkin'),r=race('trollkin');
 assert(!racialChoiceSpecs(r,raceTraits(b).traits).some(x=>/acid-or-fire/.test(x.id)));
 const weakness=raceTraits(b).traits.find(f=>f.id===r.id+':trait:acid-or-fire');
 assert.match(weakness.description,/FIRE or EARTH/);
 assert.match(weakness.description,/contradiction|contradictory/i);
 assert.equal(weakness.effects.length,0);
});
