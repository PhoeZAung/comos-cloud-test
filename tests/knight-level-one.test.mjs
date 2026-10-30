import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newBuild,compileBuild,previewBuild} from '../src/features/characters/rules/build.mjs';
import {KNIGHT_ID as ID} from '../src/features/characters/rules/level-one-classes.mjs';
import {validateClassDefinition} from '../src/features/characters/rules/class-contract.mjs';
import {addRuleAbility} from '../src/features/characters/rules/ability-library.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
const fixture=()=>{const b=newBuild();Object.assign(b,{name:'Lawful Knight',alignment:'Lawful Good',raceId:'ffd20:race:galka',classId:ID,hpRolls:[12],reviewed:true});b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);return b;};
const stance=d=>d.activeAbilities.find(f=>f.sourceRuleId===ID+':feature:defensive-stance');
test('Knight first-level source uses d12, lawful alignment, all armor/shields and seven manual references without permanent stance effects',async()=>{
 const c=JSON.parse(await readFile(new URL('../rules/classes/knight.class.json',import.meta.url),'utf8'));
 assert.deepEqual(validateClassDefinition(c),{id:ID,name:'Knight',levels:20,features:7,upgrades:0,choices:0});
 const d=compileBuild(fixture());assert.equal(d.hp_max,12);assert.deepEqual([d.bab,d.fort_base,d.ref_base,d.will_base],[1,2,0,2]);assert.equal(d.currency_gil,175);assert.equal(d.mp_class,0);
 assert.match(d.proficiencies,/Knight swords/);assert.match(d.proficiencies,/tower shields/);assert.equal(d.activeAbilities.filter(f=>f.limitBreak).length,2);
 assert(d.feats.some(f=>f.name==='Antagonize'&&f.automation==='manual'));assert(d.passiveAbilities.some(f=>f.name==='Code of Conduct'));assert(d.activeAbilities.some(f=>f.name==='Defend Ally'));
 assert.equal(stance(d).u_max,4);assert.equal(stance(d).restoreOnLongRest,false);assert.equal(d.ac_dodge,undefined);assert.equal(d.will_temp,undefined);assert.equal(d.hp_temp,undefined);assert.equal(d.spells.length,0);
 for(const alignment of ['Lawful Good','Lawful Neutral','Lawful Evil'])assert.equal(compileBuild({...fixture(),alignment}).alignment,alignment);
});
test('Knight stance uses permanent build Constitution and preserves expenditure, current HP, feat notes and manual fields on edit',()=>{
 const b=fixture(),d=compileBuild(b);stance(d).u_curr=2;d.hp_curr=2;d.ac_temp=3;d.feats.find(f=>f.name==='Antagonize').desc='Manual Antagonize notes';d.con=20;
 const twice=compileBuild(d.rulesBuild.input,d);assert.equal(stance(twice).u_max,4);assert.equal(stance(twice).u_curr,2);assert.equal(twice.hp_curr,2);assert.equal(twice.ac_temp,3);assert.equal(twice.feats.find(f=>f.name==='Antagonize').desc,'Manual Antagonize notes');
 const fieldEdit=mergeSheetData(twice,{action:'fields',fields:{con:14}});assert.equal(stance(fieldEdit).u_max,6);assert.equal(stance(fieldEdit).u_curr,4);assert.equal(fieldEdit.hp_max,14);
 const permanent=structuredClone(b);permanent.baseScores.con=14;const increased=compileBuild(permanent,twice);assert.equal(stance(increased).u_max,6);assert.equal(stance(increased).u_curr,4);
 const rested=mergeSheetData(twice,{action:'rest'});assert.equal(stance(rested).u_curr,2);
 const deleted=structuredClone(d);deleted.activeAbilities=deleted.activeAbilities.filter(f=>f.sourceRuleId!==ID+':feature:defensive-stance');const restored=addRuleAbility(deleted,ID+':feature:defensive-stance');assert.equal(restored.u_max,4);assert.equal(restored.sourceClass,'Knight');
});
test('Knight rejects nonlawful creation, later progression, archetypes, talents and spell injection',()=>{
 for(const change of [b=>b.alignment='',b=>b.alignment='True Neutral',b=>b.alignment='Chaotic Good',b=>b.level=2,b=>b.archetypeId='ffd20:archetype:knight:dark-knight',b=>b.choices[ID+':event:talent:2']=['unverified'],b=>b.spellIds=['unverified']]){const bad=fixture();change(bad);assert.throws(()=>compileBuild(bad));}
});
