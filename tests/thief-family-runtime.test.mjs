import test from 'node:test';
import assert from 'node:assert/strict';
import {compileBuild,levelUpBuild,choiceEvents,eligibleOptions,previewBuild,buildIssues} from '../src/features/characters/rules/build.mjs';
import {sheetFamilyArchetype} from '../src/features/characters/rules/sheet-family-progression.mjs';
import {wizardOrder,renderBuild} from '../src/ui/rules-wizard.mjs';
import {familyFixture,advanceFamily,completeFamilyBuild} from './helpers/sheet-family-fixtures.mjs';
const ID='ffd20:class:thief',A=name=>'ffd20:archetype:thief:'+name;
const rows=d=>[...d.activeAbilities,...d.passiveAbilities];
const until=(saved,level)=>{while(saved.level<level)saved=levelUpBuild(advanceFamily(saved),saved);return saved;};
const eventAt=(b,level,pool)=>choiceEvents(b).find(e=>e.atClassLevel===level&&e.poolIds.some(p=>p.endsWith(':'+pool)));

test('Temporal options enforce level6/12 and an owned earlier Time After Time prerequisite',()=>{
 let d=until(compileBuild(familyFixture(ID,A('time-bandit'))),2),b=d.rulesBuild.input,e=eventAt(b,2,'temporal-talents');
 assert(!eligibleOptions(b,e).some(o=>o.name==='Bolt Time'));
 assert(!eligibleOptions(b,e).some(o=>o.name==='Time After Time'));
 d=until(d,5);b=advanceFamily(d);e=eventAt(b,6,'temporal-talents');assert(eligibleOptions(b,e).some(o=>o.name==='Bolt Time'));
 d=until(d,11);b=advanceFamily(d);e=eventAt(b,12,'temporal-talents');let options=eligibleOptions(b,e);
 assert(!options.some(o=>o.name==='Time Runner'));
 const after=options.find(o=>o.name==='Time After Time');assert(after);b.choices[e.id]=[after.id];d=levelUpBuild(b,d);
 d=until(d,13);b=advanceFamily(d);e=eventAt(b,14,'temporal-talents');assert(eligibleOptions(b,e).some(o=>o.name==='Time Runner'));
 const forged=structuredClone(b);for(const [key,picked]of Object.entries(forged.choices))if(picked.includes(after.id))delete forged.choices[key];assert(buildIssues(forged).length>0);
});

test('Legal alternative Thief talents cannot replace a saved choice by edit or next-level request',()=>{
 const d=until(compileBuild(familyFixture(ID)),2),saved=d.rulesBuild.input,e=eventAt(saved,2,'thief-talents');
 const replacement=eligibleOptions(saved,e).find(o=>o.id!==saved.choices[e.id][0]);assert(replacement);
 const edit=structuredClone(saved);edit.choices[e.id]=[replacement.id];assert.throws(()=>compileBuild(edit,d),/Saved class choices/);
 const next=advanceFamily(d);next.choices[e.id]=[replacement.id];assert.throws(()=>levelUpBuild(next,d),/Earlier talent\/feat choices/);
 const removed=advanceFamily(d);delete removed.choices[e.id];assert.throws(()=>levelUpBuild(removed,d),/Earlier talent\/feat choices/);
});

test('Agent later replacements retain the earlier level6 talent and leave advanced level12 selectable',()=>{
 let d=until(compileBuild(familyFixture(ID,A('agent'))),6),b=d.rulesBuild.input,e=eventAt(b,6,'thief-talents'),picked=b.choices[e.id][0];assert(picked);
 d=until(d,12);assert.deepEqual(d.rulesBuild.input.choices[e.id],[picked]);
 const events=choiceEvents(d.rulesBuild.input);assert(!events.some(x=>x.id===ID+':event:thief-talents:8'));assert(!events.some(x=>x.id===ID+':event:thief-talents:10'));assert(events.some(x=>x.id===ID+':event:thief-advanced-talents:12'));
 assert(rows(d).some(r=>r.sourceRuleId===picked));
});

test('Spellthief uses INT MP from level4 with manual spell rows and no automatic spell-learning wizard',()=>{
 const b=familyFixture(ID,A('spellthief'));b.baseScores.int=18;b.baseScores.cha=10;completeFamilyBuild(b);
 let d=compileBuild(b);assert.equal(d.mp_class,0);assert.equal(d.mp_bonus,0);assert.equal(d.spells.length,0);
 d=until(d,4);assert.equal(d.int,18);assert.equal(d.mp_class,0);assert.equal(d.mp_bonus,1);assert.equal(d.mp_max_spell_level,1);assert.equal(d.spell_dc_base,'int');
 assert(!wizardOrder(d.rulesBuild.input).includes(5));assert.equal(d.rulesBuild.input.spellIds.length,0);assert.equal(d.castingProfiles.length,0);
 assert(rows(d).some(r=>r.name==='Spells'&&/manually|manual/.test(r.desc)));
 d.spells.push({name:'Manual Fire',lvl:1,mp_cost:1,desc:'Manual chosen source spell',casting_ability:'int'});
 const next=advanceFamily(d);assert(!wizardOrder(next).includes(5));d=levelUpBuild(next,d);assert.equal(d.mp_class,1);assert(d.spells.some(s=>s.name==='Manual Fire'&&s.desc==='Manual chosen source spell'));
 const forged=structuredClone(next);forged.spellIds=['ffd20:spell:fire'];assert.throws(()=>compileBuild(forged,d),/manually|starting spell/);
});

test('Deadly Courtesan performance grows by one round and preserves spent uses instead of refilling',()=>{
 let d=until(compileBuild(familyFixture(ID,A('deadly-courtesan'))),2),perf=rows(d).find(r=>r.name==='Bardic Performance');assert(perf);
 const cha=Math.floor((d.cha-10)/2);assert.equal(perf.u_max,1+cha);perf.u_curr=perf.u_max-1;
 const maximum=perf.u_max;d=levelUpBuild(advanceFamily(d),d);perf=rows(d).find(r=>r.name==='Bardic Performance');assert.equal(perf.u_max,maximum+1);assert.equal(perf.u_curr,perf.u_max-1);assert.equal(perf.restoreOnLongRest,false);
});

test('Sky Pirate consumes future level12 slot without removing permanent earlier trick choices',()=>{
 let d=until(compileBuild(familyFixture(ID,A('sky-pirate'))),10);const picks=structuredClone(d.rulesBuild.input.choices);
 d=until(d,12);for(const [key,value]of Object.entries(picks))assert.deepEqual(d.rulesBuild.input.choices[key],value);
 assert(!choiceEvents(d.rulesBuild.input).some(e=>e.atClassLevel===12&&e.poolIds.some(p=>p.endsWith(':pirate-trick')||p.endsWith(':thief-advanced-talents'))));
 assert(rows(d).some(r=>r.name==='Sailor’s Step'));assert.equal(sheetFamilyArchetype(d.rulesBuild.input).data.features.find(f=>f.name==='Sailor’s Step').atLevel,11);
});
