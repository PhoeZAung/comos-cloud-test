import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newBuild,previewBuild,compileBuild,buildIssues,levelUpBuild,appendClassBuild,classSkill} from '../src/features/characters/rules/build.mjs';
import {DRAGOON_ID} from '../src/features/characters/rules/level-one-classes.mjs';
import {validateClassDefinition} from '../src/features/characters/rules/class-contract.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
const fixture=()=>{
 const b=newBuild();Object.assign(b,{name:'Galka Dragoon',raceId:'ffd20:race:galka',classId:DRAGOON_ID,hpRolls:[10],reviewed:true});b.skillRanks=fixedSkills.map((_,i)=>i<4?1:0);return b;
};
test('Dragoon source preserves all rows and only six canonical first-level grants with manual jump and Limit Break effects',async()=>{
 const c=JSON.parse(await readFile(new URL('../rules/classes/dragoon.class.json',import.meta.url),'utf8'));
 assert.deepEqual(validateClassDefinition(c),{id:DRAGOON_ID,name:'Dragoon',levels:20,features:6,upgrades:0,choices:0});
 const b=fixture();assert.deepEqual(buildIssues(b),[]);const d=compileBuild(b);
 assert.equal(d.class,'Dragoon');assert.equal(d.hp_max,10);assert.equal(d.currency_gil,175);
 assert.deepEqual([d.bab,d.fort_base,d.ref_base,d.will_base],[1,2,2,0]);assert.equal(d.mp_class,0);assert.equal(d.mp_bonus,0);
 assert(classSkill(b,'skill:acrobatics'));assert(classSkill(b,'skill:knowledge-arcana'));assert(classSkill(b,'skill:knowledge-local'));
 assert.equal(d.skills.find(s=>s.name==='Acrobatics').rulesBonus,0,'jump-only bonuses are not general Acrobatics');
 assert.equal(d.ac_natural,undefined);assert.equal(d.hp_temp,undefined);
 assert.equal(d.feats.length,1);assert(!d.feats.some(f=>['Run','Mounted Combat','Improved Unarmed Strike'].includes(f.name)));
 assert.equal(d.activeAbilities.filter(f=>f.limitBreak).length,2);
 const all=[...d.activeAbilities,...d.passiveAbilities];assert(all.some(f=>f.name==='Deadly Lancer'));assert(!all.some(f=>['Super Jump','Blood of the Dragon','Dragoon Talents'].includes(f.name)));
 assert(c.data.features.every(f=>f.automation==='manual'));
});
test('Dragoon edit/reopen preserve shared Limit Break expenditure and manual notes; progression, spells and archetypes remain guarded',()=>{
 const b=fixture(),d=compileBuild(b),lb=d.activeAbilities.findIndex(f=>f.limitBreak);d.hp_curr=2;
 const spent=mergeSheetData(d,{action:'useAbility',collection:'activeAbilities',index:lb});spent.hp_curr=2;spent.passiveAbilities.push({name:'Manual jump notes'});
 const next=compileBuild(spent.rulesBuild.input,spent);assert.equal(next.hp_curr,2);assert.equal(next.limitBreakPool.spent,1);assert(next.passiveAbilities.some(f=>f.name==='Manual jump notes'));
 assert.equal(previewBuild(b).skillBudget,4);
 assert.throws(()=>compileBuild({...b,level:2},next),/level-1 testing/);assert.throws(()=>levelUpBuild({...b,level:2},next),/level-1 testing/);
 assert.throws(()=>appendClassBuild(b,next),/Multiclassing/);
 assert.throws(()=>compileBuild({...b,archetypeId:'ffd20:archetype:dragoon:dragon-knight'}),/Other archetypes/);
 assert.throws(()=>compileBuild({...b,spellIds:['invented']}),/does not learn/);
});
