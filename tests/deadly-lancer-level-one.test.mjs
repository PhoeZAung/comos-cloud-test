import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newBuild,previewBuild,compileBuild} from '../src/features/characters/rules/build.mjs';
import {availableRuleAbilities,addRuleAbility} from '../src/features/characters/rules/ability-library.mjs';
import {DEADLY_LANCER_ID as ID} from '../src/features/characters/rules/level-one-classes.mjs';
import {validateArchetypeDefinition} from '../src/features/characters/rules/archetype-contract.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
const read=async file=>JSON.parse(await readFile(new URL('../'+file,import.meta.url),'utf8'));
const fixture=()=>{const b=newBuild();Object.assign(b,{name:'Deadly Lancer',raceId:'ffd20:race:galka',classId:'ffd20:class:chocobo-knight',archetypeId:ID,hpRolls:[10],reviewed:true});b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);return b;};
test('Deadly Lancer retains its exact source graph, nineteen gated tricks and total-value damage upgrades',async()=>{
 const a=await read('rules/classes/archetypes/chocobo-knight-deadly-lancer.archetype.json'),p=await read('rules/classes/chocobo-knight.class.json'),catalog=await read('docs/imports/catalog.json');
 assert.deepEqual(validateArchetypeDefinition(a,p),{id:ID,parentClassId:p.id,name:'Deadly Lancer',replacements:2,features:9,upgrades:13});
 assert.equal(a.sources[0].archiveSha256,catalog.items.find(x=>x.id===ID).source.sha256);assert.equal(a.data.joustingTricks.length,19);assert.equal(a.data.deferredReplacements.length,9);
 assert.equal(a.data.joustingTricks.find(t=>t.name==='Caparisoned Steed').repeatLimit,2);assert.equal(a.data.joustingTricks.find(t=>t.name==='Shellbreaker').minimumClassLevel,6);
 assert.equal(a.data.upgrades.filter(u=>u.featureId.endsWith(':charging-lancer')).at(-1).changes.damageDice,10);
 assert.equal(a.data.features.find(f=>f.name==='Charging Lancer').initialState.multiplyOnCritical,false);
 assert.equal(a.data.features.find(f=>f.name==='Charging Lancer').initialState.multiplyByClassFeature,false);
});
test('Deadly Lancer first-level compilation replaces aura and proficiencies while retaining mount, challenge, feat and two Limit Breaks',()=>{
 const b=fixture(),d=compileBuild(b),features=[...d.activeAbilities,...d.passiveAbilities];
 assert.equal(d.class,'Chocobo Knight');assert.deepEqual([d.bab,d.fort_base,d.ref_base,d.will_base],[1,2,0,0]);assert.equal(d.hp_max,10);assert.equal(d.currency_gil,175);
 assert(features.some(f=>f.name==='Charging Lancer'));assert(!features.some(f=>f.name==='Commander’s Aura'));assert(features.some(f=>f.name==='Chocobo Mount'));assert(features.some(f=>f.name==='Challenge'));
 assert.equal(features.filter(f=>f.limitBreak).length,2);assert(d.feats.some(f=>f.name==='Mounted Combat'));
 assert.match(d.proficiencies,/Polearm weapon group/);assert.match(d.proficiencies,/Spear weapon group/);assert.match(d.proficiencies,/Heavy armor/);assert.doesNotMatch(d.proficiencies,/shields|martial/i);
 assert(!features.some(f=>['Jousting Tricks','Lance Training','Master Lancer'].includes(f.name)));assert.equal(d.weapons.length,0);
 const charge=features.find(f=>f.name==='Charging Lancer');assert.match(charge.desc,/at least 10 feet/);assert.match(charge.desc,/not multiplied/);
 const absent=structuredClone(d);absent.passiveAbilities=absent.passiveAbilities.filter(f=>f.sourceRuleId!==charge.sourceRuleId);
 const option=availableRuleAbilities(absent).find(o=>o.id===charge.sourceRuleId);assert.match(option.url,/deadly-lancer/);const restored=addRuleAbility(absent,charge.sourceRuleId);assert.equal(restored.sourceClass,'Chocobo Knight');
 assert.throws(()=>addRuleAbility(absent,'ffd20:class:chocobo-knight:feature:commanders-aura'),/not granted/);
});
test('Deadly Lancer editing preserves spent challenge/Limit Break uses and manual combat entries while later choices and incompatible classes stay guarded',()=>{
 const b=fixture();let d=compileBuild(b);const challenge=d.activeAbilities.find(f=>f.name==='Challenge');challenge.u_curr=0;
 d.hp_curr=2;const lb=d.activeAbilities.findIndex(f=>f.limitBreak);d=mergeSheetData(d,{action:'useAbility',collection:'activeAbilities',index:lb});d.weapons.push({name:'Manual lance',dmg_dice:'1d8'});
 const twice=compileBuild(d.rulesBuild.input,d);assert.equal(twice.hp_curr,2);assert.equal(twice.limitBreakPool.spent,1);assert.equal(twice.activeAbilities.find(f=>f.name==='Challenge').u_curr,0);assert.equal(twice.weapons.at(-1).name,'Manual lance');
 for(const change of [b=>b.level=2,b=>b.choices[ID+':event:trick:2']=[ID+':trick:agile-finish'],b=>b.classId='ffd20:class:dancer']){const bad=structuredClone(b);change(bad);assert.throws(()=>compileBuild(bad));}
});
