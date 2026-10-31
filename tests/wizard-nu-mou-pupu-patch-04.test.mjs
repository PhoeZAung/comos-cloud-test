import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,registry,previewBuild,compileBuild,buildIssues,raceTraits,racialClassSkill} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {racialChoiceSpecs,pruneRacialChoices,NU_MOU_SAGACIOUS,PUPU_TECH_SAVANT} from '../src/features/characters/rules/racial-choices.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';

const race=slug=>registry.races.find(r=>r.id==='ffd20:race:'+slug);
function fixture(slug){
 const b=newBuild();
 Object.assign(b,{name:slug+' racial choice test',alignment:'True Neutral',raceId:race(slug).id,
  classId:'ffd20:class:dancer',reviewed:true});
 b.hpRolls=[classHitDie(b)];
 return b;
}
function complete(b){
 b.skillRanks=fixedSkills.map(()=>0);
 for(let i=0,left=previewBuild(b).skillBudget;i<fixedSkills.length&&left>0;i++,left--)b.skillRanks[i]=1;
 return b;
}
const messages=b=>buildIssues(b,{complete:false}).map(x=>x.message).join(' | ');

test('Nu Mou Sagacious uses exactly two distinct Knowledge rows, each +2 and a class skill',()=>{
 const b=fixture('nu-mou'),source=race('nu-mou');
 const spec=racialChoiceSpecs(source,raceTraits(b).traits).find(s=>s.id===NU_MOU_SAGACIOUS);
 assert(spec);
 assert.equal(spec.minimum,2);assert.equal(spec.maximum,2);
 assert.equal(spec.options.length,fixedSkills.filter(s=>s.name.startsWith('Knw: ')).length);
 assert(spec.options.every(o=>fixedSkills[o.value].name.startsWith('Knw: ')));
 const html=renderBuild(b,2);
 assert.match(html,/data-rw-racial-option="ffd20:race:nu-mou:pool:sagacious-two-knowledge"/);
 assert.doesNotMatch(renderBuild(b,1),/data-rw-racial-option="ffd20:race:nu-mou:pool:sagacious-two-knowledge"/);
 assert.match(messages(b),/Sagacious: two different Knowledge specialties: choose 2/);
 b.racialChoices[NU_MOU_SAGACIOUS]=['skill-row:16','skill-row:25'];
 assert(!messages(b).includes('Sagacious: two different Knowledge specialties: choose'));
 const effects=raceTraits(b).traits.flatMap(f=>f.effects);
 for(const row of [16,25]){
  assert(effects.some(e=>e.target==='skills.row.'+row+'.bonus'&&e.value?.value===2));
  assert(effects.some(e=>e.target==='skills.row.'+row+'.class_skill'&&e.value?.value===1));
  assert(racialClassSkill(b,'skill:knowledge-'+fixedSkills[row].name.slice(5).toLowerCase(),row));
 }
 const sheet=compileBuild(complete(b));
 for(const row of [16,25]){assert.equal(sheet.skills[row].rulesBonus,2);assert.equal(sheet.skills[row].cs,true);}
 assert.equal(sheet.skills[17].rulesBonus||0,0);
 assert.deepEqual(compileBuild(sheet.rulesBuild.input,sheet).rulesBuild.input.racialChoices,b.racialChoices);
 const swapped=structuredClone(b);swapped.racialChoices[NU_MOU_SAGACIOUS]=['skill-row:16','skill-row:24'];
 assert.throws(()=>compileBuild(swapped,sheet),/cannot be changed/);
 for(const invalid of [['skill-row:16'],['skill-row:16','skill-row:16'],['skill-row:16','skill-row:0'],['skill-row:16','skill-row:20','skill-row:25']]){
  const forged=structuredClone(b);forged.racialChoices[NU_MOU_SAGACIOUS]=invalid;assert(buildIssues(forged).some(x=>/Sagacious|Invalid or duplicate/.test(x.message)));
 }
});

test('Nu Mou replacement of Sagacious removes both chosen skill benefits and invalidates stale choices',()=>{
 const b=fixture('nu-mou');b.racialChoices[NU_MOU_SAGACIOUS]=['skill-row:16','skill-row:25'];
 b.alternateIds=[b.raceId+':trait:lorespeaker'];
 const resolved=raceTraits(b);assert.deepEqual(resolved.errors,[]);
 assert(!resolved.traits.some(f=>f.id===b.raceId+':trait:sagacious'));
 assert(!racialChoiceSpecs(race('nu-mou'),resolved.traits).some(s=>s.id===NU_MOU_SAGACIOUS));
 assert.match(messages(b),/Unknown or inactive racial choice/);
 pruneRacialChoices(b,race('nu-mou'),resolved.traits);
 assert.equal(b.racialChoices[NU_MOU_SAGACIOUS],undefined);
 assert(!resolved.traits.flatMap(f=>f.effects).some(e=>e.id?.startsWith(NU_MOU_SAGACIOUS)));
});

test('PuPu Technological Savant chooses Technology OR Engineering, plus unconditional Repair +2',()=>{
 const b=fixture('pupu'),source=race('pupu'),spec=racialChoiceSpecs(source,raceTraits(b).traits).find(s=>s.id===PUPU_TECH_SAVANT);
 assert(spec);assert.equal(spec.minimum,1);assert.equal(spec.maximum,1);
 assert.deepEqual(spec.options.map(o=>o.name),['Knowledge (Technology)','Knowledge (Engineering)']);
 assert.match(renderBuild(b,2),/data-rw-racial-choice="ffd20:race:pupu:pool:technological-savant-specialty"/);
 assert.match(messages(b),/Technological Savant specialty: choose 1/);
 for(const [value,target,other] of [['knowledge-technology',26,18],['knowledge-engineering',18,26]]){
  const chosen=structuredClone(b);chosen.racialChoices[PUPU_TECH_SAVANT]=[PUPU_TECH_SAVANT+':option:'+value];
  const effects=raceTraits(chosen).traits.flatMap(f=>f.effects);
  assert(effects.some(e=>e.target==='skills.row.'+target+'.bonus'&&e.value?.value===2));
  assert(!effects.some(e=>e.target==='skills.row.'+other+'.bonus'&&e.value?.value===2));
  assert(effects.some(e=>e.target==='skills.skill:repair.bonus'&&e.value?.value===2));
  const sheet=compileBuild(complete(chosen));
  assert.equal(sheet.skills[target].rulesBonus,2);assert.equal(sheet.skills[other].rulesBonus||0,0);
  assert.equal(sheet.skills[37].rulesBonus,2);
  assert.deepEqual(compileBuild(sheet.rulesBuild.input,sheet).rulesBuild.input.racialChoices,chosen.racialChoices);
  const changed=structuredClone(chosen);changed.racialChoices[PUPU_TECH_SAVANT]=[PUPU_TECH_SAVANT+':option:'+(value==='knowledge-technology'?'knowledge-engineering':'knowledge-technology')];
  assert.throws(()=>compileBuild(changed,sheet),/cannot be changed/);
 }
 b.racialChoices[PUPU_TECH_SAVANT]=['skill-row:18'];
 assert.match(messages(b),/Invalid or duplicate Technological Savant/);
});

test('PuPu alternate and heritage replacements remove Technological Savant picker rather than grant both alternatives',()=>{
 for(const [alternative,field] of [['ace-pilot','alternateIds'],['hiso','heritageId']]){
  const b=fixture('pupu');b[field]=field==='alternateIds'?[b.raceId+':trait:'+alternative]:b.raceId+':heritage:'+alternative;
  const resolved=raceTraits(b);
  assert(!resolved.traits.some(f=>f.id===b.raceId+':trait:technological-savant'));
  assert(!racialChoiceSpecs(race('pupu'),resolved.traits).some(s=>s.id===PUPU_TECH_SAVANT));
  b.racialChoices[PUPU_TECH_SAVANT]=[PUPU_TECH_SAVANT+':option:knowledge-technology'];
  assert.match(messages(b),/Unknown or inactive racial choice/);
  pruneRacialChoices(b,race('pupu'),resolved.traits);
  assert.equal(b.racialChoices[PUPU_TECH_SAVANT],undefined);
 }
});
