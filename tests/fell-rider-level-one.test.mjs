import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newBuild,compileBuild,previewBuild} from '../src/features/characters/rules/build.mjs';
import {FELL_RIDER_ID as ID} from '../src/features/characters/rules/level-one-classes.mjs';
import {validateArchetypeDefinition} from '../src/features/characters/rules/archetype-contract.mjs';
import {availableRuleAbilities,addRuleAbility} from '../src/features/characters/rules/ability-library.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
const read=async file=>JSON.parse(await readFile(new URL('../'+file,import.meta.url),'utf8'));
const fixture=()=>{const b=newBuild();Object.assign(b,{name:'Fell Rider',classId:'ffd20:class:chocobo-knight',raceId:'ffd20:race:galka',archetypeId:ID,hpRolls:[10],reviewed:true});b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);return b;};
test('Fell Rider source resolves only the first-level mount target and retains later replacements and fear-penalty totals',async()=>{
 const a=await read('rules/classes/archetypes/chocobo-knight-fell-rider.archetype.json'),p=await read('rules/classes/chocobo-knight.class.json'),catalog=await read('docs/imports/catalog.json');
 assert.deepEqual(validateArchetypeDefinition(a,p),{id:ID,parentClassId:p.id,name:'Fell Rider',replacements:1,features:7,upgrades:3});assert.equal(a.sources[0].archiveSha256,catalog.items.find(x=>x.id===ID).source.sha256);
 assert.deepEqual(a.data.replacements[0].targetFeatureIds,[p.id+':feature:chocobo-mount']);assert.equal(a.data.deferredReplacements.length,6);
 assert.deepEqual(a.data.features[0].initialState,{mountStrengthAdjustment:2,mountDexterityAdjustment:-2,changesRiderScores:false,changesMountSize:false,automation:'none'});
 assert.equal(a.data.upgrades.at(-1).changes.enemyFearSavePenalty,-5);assert.match(a.data.parentMountReference.description,/yellow chocobo/);
});
test('Fell Rider retains the base mount reference and parent resources while mount-only modifiers never change rider scores or size',()=>{
 const b=fixture(),d=compileBuild(b),base=compileBuild({...b,archetypeId:''}),all=[...d.activeAbilities,...d.passiveAbilities];
 for(const key of ['str','dex','con','int','wis','cha','size_category','hp_max','bab','proficiencies','currency_gil'])assert.equal(d[key],base[key],key);
 assert.equal(d.activeAbilities.filter(f=>f.limitBreak).length,2);assert(all.some(f=>f.name==='Commander’s Aura'));assert(all.some(f=>f.name==='Challenge'));assert(d.feats.some(f=>f.name==='Mounted Combat'));assert(!d.feats.some(f=>f.name==='Trample'));
 const brute=all.find(f=>f.name==='Brute Steed');assert(brute);assert.match(brute.desc,/yellow chocobo/);assert.match(brute.desc,/managed manually/);assert(!all.some(f=>['Chocobo Mount','Rampage','Dread Rider','Fell Presence','Terror'].includes(f.name)));
 const deleted=structuredClone(d);deleted.passiveAbilities=deleted.passiveAbilities.filter(f=>f.sourceRuleId!==brute.sourceRuleId);assert.match(availableRuleAbilities(deleted).find(o=>o.id===brute.sourceRuleId).url,/fell-rider/);assert.equal(addRuleAbility(deleted,brute.sourceRuleId).sourceClass,'Chocobo Knight');
 assert.throws(()=>addRuleAbility(deleted,'ffd20:class:chocobo-knight:feature:chocobo-mount'),/not granted/);
});
test('Fell Rider saves preserve manual mount notes, current HP and shared Limit Break use while later abilities stay guarded',()=>{
 const b=fixture();let d=compileBuild(b);d.hp_curr=2;d.passiveAbilities.find(f=>f.name==='Brute Steed').desc='My manual yellow chocobo stats and mount-only adjustments';const lb=d.activeAbilities.findIndex(f=>f.limitBreak);d=mergeSheetData(d,{action:'useAbility',collection:'activeAbilities',index:lb});
 const twice=compileBuild(d.rulesBuild.input,d);assert.equal(twice.hp_curr,2);assert.equal(twice.limitBreakPool.spent,1);assert.equal(twice.passiveAbilities.find(f=>f.name==='Brute Steed').desc,'My manual yellow chocobo stats and mount-only adjustments');
 for(const change of [b=>b.level=3,b=>b.classId='ffd20:class:dragoon',b=>b.choices[ID+':event:trample']=['unverified']]){const bad=structuredClone(b);change(bad);assert.throws(()=>compileBuild(bad));}
});
