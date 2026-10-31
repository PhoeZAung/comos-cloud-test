import test from 'node:test';
import assert from 'node:assert/strict';
import {registry,newBuild,buildIssues,raceTraits,compileBuild,previewBuild} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {racialChoiceSpecs} from '../src/features/characters/rules/racial-choices.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';

const get=slug=>registry.races.find(r=>r.id==='ffd20:race:'+slug);
const build=slug=>({...newBuild(),name:'Race control verification',alignment:'True Neutral',reviewed:true,
 raceId:'ffd20:race:'+slug,classId:'ffd20:class:dancer'});
const options=(b,category)=>renderBuild(b,2,{raceCategory:category}).match(/<select data-rw-field="raceId"[^>]*>(.*?)<\/select>/)?.[1]||'';
const pool=(race,slug)=>race.id+':pool:'+slug;
const trait=(race,slug)=>race.id+':trait:'+slug;
function complete(b){
 b.hpRolls=[classHitDie(b)];b.skillRanks=fixedSkills.map(()=>0);
 const budget=previewBuild(b).skillBudget;
 for(let i=0,n=budget;i<fixedSkills.length&&n>0;i++){b.skillRanks[i]=1;n--;}
 return b;
}

test('all 63 official races are partitioned into four category dropdowns without mixing or changing selection IDs',()=>{
 assert.equal(registry.races.length,63);
 const groups=['core','base','beastman_tribe','monstrous'];
 const ids=registry.races.map(r=>r.id);
 for(const group of groups){
  const html=renderBuild(newBuild(),2,{raceCategory:group});
  assert.match(html,/data-rw-race-category/);
  assert.match(html,new RegExp('<option value="'+group+'" selected'));
  const select=options(newBuild(),group);
  for(const race of registry.races){
   const found=select.includes('value="'+race.id+'"');
   assert.equal(found,race.data.raceType===group,'category filter for '+race.name);
  }
 }
 assert.equal(new Set(ids).size,63);
 for(const [slug,category] of [['hume','core'],['genome','base'],['kindred','beastman_tribe'],['syricta','monstrous']]){
  const b=build(slug),html=renderBuild(b,2);
  assert.match(html,new RegExp('<option value="'+category+'" selected'));
  assert.match(options(b,category),new RegExp('value="'+b.raceId+'" selected'));
 }
});

test('Genome, Gria, Guado, Hypello, Mandragora have supported bonus languages; Genome is free text',()=>{
 for(const slug of ['genome','gria','guado','hypello','mandragora']){
  const b=build(slug),race=get(slug),spec=racialChoiceSpecs(race,raceTraits(b).traits).find(x=>x.id===pool(race,'bonus-languages'));
  assert.ok(spec,slug+' bonus-language pool must be enabled');
  assert.equal(spec.choiceType,'language');
  assert.equal(spec.minimum,0);
  assert.equal(Boolean(spec.freeText),slug==='genome');
  const scoreHtml=renderBuild(b,1);
  // Ability score step displays bonus languages when racial INT allows them.
  assert.ok(scoreHtml.includes('data-rw-bonus-languages'),slug);
 }
 const g=build('genome');g.baseScores.int=14;
 g.racialChoices={[pool(get('genome'),'bonus-languages')]:['draconic','sylvan']};
 assert.ok(!buildIssues(g).some(x=>/racial choice|bonus languages|Genome already starts/.test(x.message)));
 g.racialChoices[pool(get('genome'),'bonus-languages')]=['common'];
 assert.ok(buildIssues(g).some(x=>/already starts with Common/.test(x.message)));
});

test('Palico and Kindred each require exactly one starting language, with separate high-INT choices and no duplicates',()=>{
 for(const [slug,starting,possibilities] of [
  ['palico','starting-second-language',['Mithran','Ronsaur']],
  ['kindred','languages-selection',['Abyssal','Infernal']]
 ]){
  const b=build(slug),r=get(slug),specs=racialChoiceSpecs(r,raceTraits(b).traits);
  const must=specs.find(x=>x.id===pool(r,starting)),extra=specs.find(x=>x.id===pool(r,'high-intelligence-bonus-languages'));
  assert.ok(must&&extra,slug);assert.equal(must.minimum,1);assert.equal(must.maximum,1);
  assert.equal(must.choiceType,'language');assert.deepEqual(must.options.map(o=>o.name),possibilities);
  assert.ok(buildIssues(b).some(x=>x.message.includes(must.name)),slug+' requires starting pick');
  b.racialChoices={[must.id]:[must.options[0].id]};
  assert.ok(!buildIssues(b).some(x=>x.message.includes(must.name)),slug+' required choice resolves');
  b.baseScores.int=18;
  const same=extra.options.find(o=>o.name===possibilities[0]);
  if(same){
   b.racialChoices[extra.id]=[same.id];
   assert.ok(buildIssues(b).some(x=>/starting language cannot/.test(x.message)),slug+' rejects repeated starting choice');
   delete b.racialChoices[extra.id];
  }
  const unrelated=extra.options.find(o=>o.name!==possibilities[0]);
  b.racialChoices[extra.id]=[unrelated.id];
  const selected=raceTraits(b).traits.flatMap(f=>f.effects).filter(e=>e.target==='identity.languages.'+unrelated.value);
  assert.equal(selected.length,1,slug+' bonus language projects once');
 }
});

test('Syricta Dragon Type removes exactly three traits and changes creature Type without erasing land speed',()=>{
 const b=build('syricta'),r=get('syricta');b.alternateIds=[trait(r,'dragon-type')];
 const resolved=raceTraits(b),ids=new Set(resolved.traits.map(f=>f.id));
 assert.deepEqual(resolved.errors,[]);
 for(const name of ['elemental-resistance','dragon-resistances','breath-weapon'])
  assert.ok(!ids.has(trait(r,name)),name+' replaced');
 for(const name of ['type','base-speed','darkvision','low-light-vision'])
  assert.ok(ids.has(trait(r,name)),name+' retained');
 const type=resolved.traits.find(f=>f.id===trait(r,'type'));
 assert.ok(type.effects.some(e=>e.target==='identity.type'&&e.textValue==='dragon'));
 assert.ok(!type.effects.some(e=>e.target==='identity.subtypes'&&e.textValue==='reptilian'));
 assert.ok(!racialChoiceSpecs(r,resolved.traits).some(p=>/elemental-resistance-selection|breath-weapon-selection/.test(p.id)));
 assert.equal(resolved.traits.find(f=>f.id===trait(r,'base-speed')).effects.find(e=>e.target==='identity.speed.land').value.value,20);
});

test('Syricta Evasive replaces only darkvision and dragon resistances; conflicting Dragon Type is rejected',()=>{
 const b=build('syricta'),r=get('syricta');b.alternateIds=[trait(r,'evasive-maneuvers')];
 const resolved=raceTraits(b),ids=new Set(resolved.traits.map(f=>f.id));
 assert.deepEqual(resolved.errors,[]);
 for(const name of ['darkvision','dragon-resistances'])assert.ok(!ids.has(trait(r,name)));
 for(const name of ['low-light-vision','type','base-speed','breath-weapon'])assert.ok(ids.has(trait(r,name)));
 assert.match(resolved.traits.find(f=>f.id===trait(r,'base-speed')).description,/average maneuverability/);
 b.alternateIds.push(trait(r,'dragon-type'));
 assert.ok(raceTraits(b).errors.some(x=>/Two selections replace/.test(x)));
});

test('Syricta Memories removes only flight, requires two distinct Knowledge skills, and grants those two skill effects',()=>{
 const b=build('syricta'),r=get('syricta');b.alternateIds=[trait(r,'memories-of-the-forgotten')];
 const resolved=raceTraits(b);assert.deepEqual(resolved.errors,[]);
 const speed=resolved.traits.find(x=>x.id===trait(r,'base-speed'));
 assert.equal(speed.effects.find(e=>e.target==='identity.speed.land').value.value,20);
 assert.ok(!speed.effects.some(e=>e.target==='identity.speed.fly'));
 const spec=racialChoiceSpecs(r,resolved.traits).find(p=>p.id===pool(r,'memories-knowledge-skills'));
 assert.ok(spec);assert.equal(spec.minimum,2);assert.equal(spec.maximum,2);
 assert.ok(spec.options.length>=10);assert.ok(buildIssues(b).some(x=>x.message.includes('Memories of the Forgotten: two Knowledge skills')));
 // Also keep the required base elemental and breath choices from the standard traits.
 for(const p of racialChoiceSpecs(r,resolved.traits).filter(p=>/elemental-resistance-selection|breath-weapon-selection/.test(p.id)))
  b.racialChoices[p.id]=[p.options[0].id];
 b.racialChoices[spec.id]=[spec.options[0].id,spec.options[1].id];
 assert.ok(!buildIssues(b).some(x=>x.message.includes(spec.name)));
 const effects=raceTraits(b).traits.flatMap(f=>f.effects);
 for(const opt of spec.options.slice(0,2)){
  assert.ok(effects.some(e=>e.target==='skills.row.'+opt.value+'.bonus'&&e.value?.value===2));
  assert.ok(effects.some(e=>e.target==='skills.row.'+opt.value+'.class_skill'&&e.value?.value===1));
 }
 b.racialChoices[spec.id]=[spec.options[0].id,spec.options[0].id];
 assert.ok(buildIssues(b).some(x=>/duplicate/.test(x.message)));
});

test('Required Palico and Kindred language choices persist across compile and forbid editing after save',()=>{
 for(const [slug,poolSlug] of [['palico','starting-second-language'],['kindred','languages-selection']]){
  const b=build(slug),r=get(slug),spec=racialChoiceSpecs(r,raceTraits(b).traits).find(x=>x.id===pool(r,poolSlug));
  b.racialChoices={[spec.id]:[spec.options[0].id]};
  complete(b);
  const saved=compileBuild(b);
  assert.ok(saved.rulesBuild?.input?.racialChoices?.[spec.id],slug+' choice saved');
  const next=structuredClone(saved.rulesBuild.input);
  assert.ok(!buildIssues(next).some(i=>/starting language|Languages selection/.test(i.message)));
  next.racialChoices[spec.id]=[spec.options[1].id];
  assert.throws(()=>compileBuild(next,saved),/cannot be changed after character creation/);
 }
});
