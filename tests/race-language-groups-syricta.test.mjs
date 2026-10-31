import test from 'node:test';
import assert from 'node:assert/strict';
import {registry,newBuild,raceFor,raceTraits,replacementFor,effectiveScores} from '../src/features/characters/rules/build.mjs';
import {raceCategoryFor,raceCategories,racesInCategory} from '../src/features/characters/rules/race-categories.mjs';
import {racialChoiceSpecs,racialChoiceIssues} from '../src/features/characters/rules/racial-choices.mjs';
import {isSupportedRaceOperation} from '../src/features/characters/rules/race-replacement-operations.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';

const id=(race,slug)=>'ffd20:race:'+race+':trait:'+slug;
const build=race=>{const b=newBuild();b.raceId='ffd20:race:'+race;b.baseScores.int=16;return b;};

test('every registered race belongs to exactly one official category, and the category precedes the race select',()=>{
 assert.deepEqual(raceCategories.map(c=>c.name),['Core','Base','Beastman','Monstrous']);
 const groups=raceCategories.map(c=>racesInCategory(registry.races,c.id));
 assert.equal(groups.reduce((n,g)=>n+g.length,0),registry.races.length);
 assert.equal(new Set(groups.flat().map(r=>r.id)).size,registry.races.length);
 for(const [race,category] of [['hume','core'],['genome','base'],['beastkin','base'],['kindred','beastman'],['syricta','monstrous']])
  assert.equal(raceCategoryFor('ffd20:race:'+race),category);
 const html=renderBuild(build('syricta'),2);
 assert.ok(html.indexOf('data-rw-race-category')<html.indexOf('data-rw-field="raceId"'));
 assert.match(html,/value="monstrous"/);
 assert.doesNotMatch(html,/value="ffd20:race:genome"/);
 assert.match(html,/value="ffd20:race:syricta"/);
 const changed=renderBuild(build('syricta'),2,{raceCategory:'core'});
 assert.match(changed,/value="ffd20:race:hume"/);
 assert.doesNotMatch(changed,/value="ffd20:race:syricta"/);
});

test('all seven previously locked race Languages traits expose proper bonus or starting choices',()=>{
 for(const race of ['genome','gria','guado','hypello','mandragora','palico','kindred']){
  const b=build(race),def=raceFor(b),traits=raceTraits(b).traits,lang=id(race,'languages');
  assert.ok(traits.some(t=>t.id===lang));
  const raceHtml=renderBuild(b,2);
  assert.doesNotMatch(raceHtml,new RegExp('data-rw-trait="'+lang+'" disabled'));
  const specs=racialChoiceSpecs(def,traits);
  assert.ok(specs.some(s=>s.choiceType==='language'),race+' language specs');
  assert.match(renderBuild(b,1,{mode:'create'}),/data-rw-language-slot=/);
  assert.ok(!racialChoiceIssues(b,def,traits,effectiveScores(b)).some(e=>/Unknown or inactive racial choice/.test(e)));
 }
 const genome=build('genome');
 assert.match(renderBuild(genome,1,{mode:'create'}),/Choose or type a language/);
 for(const race of ['palico','kindred']){
  const b=build(race),specs=racialChoiceSpecs(raceFor(b),raceTraits(b).traits);
  const starting=specs.find(s=>s.startingLanguage),bonus=specs.find(s=>s.id.endsWith(':high-intelligence-bonus-languages'));
  assert.ok(starting&&bonus);
  assert.equal(starting.minimum,1);assert.equal(starting.maximum,1);
  assert.equal(bonus.maximum,null);
  assert.match(renderBuild(b,1,{mode:'create'}),/Starting language/);
  assert.ok(racialChoiceIssues(b,raceFor(b),raceTraits(b).traits,effectiveScores(b)).some(e=>/choose 1 option/.test(e)));
  b.racialChoices[starting.id]=[starting.options[0].id];
  assert.ok(!racialChoiceIssues(b,raceFor(b),raceTraits(b).traits,effectiveScores(b)).some(e=>/choose 1 option/.test(e)));
  const match=bonus.options.find(x=>x.name.toLowerCase()===starting.options[0].name.toLowerCase());
  if(match){b.racialChoices[bonus.id]=[match.id];assert.ok(racialChoiceIssues(b,raceFor(b),raceTraits(b).traits,effectiveScores(b)).some(e=>/starting language cannot also/.test(e)));}
 }
});

test('Syricta Dragon Type consumes only the three named traits while updating Type',()=>{
 const b=build('syricta'),original=raceFor(b),f=id('syricta','dragon-type');
 const ops=replacementFor(original,f);
 assert.equal(ops.length,2);
 assert.ok(ops.every(op=>isSupportedRaceOperation(original,op)));
 assert.deepEqual(ops.find(op=>op.operation==='replace').targetFeatureIds,
  ['elemental-resistance','dragon-resistances','breath-weapon'].map(s=>id('syricta',s)));
 b.alternateIds=[f];
 const active=raceTraits(b);
 assert.deepEqual(active.errors,[]);
 assert.ok(active.traits.some(x=>x.id===id('syricta','type')));
 for(const removed of ['elemental-resistance','dragon-resistances','breath-weapon'])
  assert.ok(!active.traits.some(x=>x.id===id('syricta',removed)));
 const type=active.traits.find(x=>x.id===id('syricta','type'));
 assert.equal(type.effects.find(e=>e.target==='identity.type')?.textValue,'Dragon');
 assert.ok(!type.effects.some(e=>e.target==='identity.subtypes'));
 assert.doesNotMatch(renderBuild(b,2),new RegExp('data-rw-alternate="'+f+'" disabled'));
});

test('Syricta Evasive Maneuvers removes Darkvision and Dragon Resistances; Memories only removes flight',()=>{
 const b=build('syricta'),race=raceFor(b);
 for(const [slug,targets] of [['evasive-maneuvers',['darkvision','dragon-resistances']],['memories-of-the-forgotten',['base-speed']]]){
  const f=id('syricta',slug),ops=replacementFor(race,f);
  assert.ok(ops.every(op=>isSupportedRaceOperation(race,op)));
  assert.deepEqual(ops[0].targetFeatureIds,targets.map(s=>id('syricta',s)));
  b.alternateIds=[f];assert.deepEqual(raceTraits(b).errors,[]);
 }
 b.alternateIds=[id('syricta','evasive-maneuvers')];
 for(const removed of ['darkvision','dragon-resistances'])
  assert.ok(!raceTraits(b).traits.some(x=>x.id===id('syricta',removed)));
 b.alternateIds=[id('syricta','memories-of-the-forgotten')];
 const speed=raceTraits(b).traits.find(x=>x.id===id('syricta','base-speed'));
 assert.equal(speed.effects.find(e=>e.target==='identity.speed.land')?.value.value,20);
 assert.ok(!speed.effects.some(e=>e.target==='identity.speed.fly'));
 assert.ok(raceTraits(b).traits.some(x=>x.id===id('syricta','memories-of-the-forgotten')));
 b.alternateIds=[id('syricta','dragon-type'),id('syricta','evasive-maneuvers')];
 assert.ok(raceTraits(b).errors.some(e=>/Two selections replace/.test(e)));
});
