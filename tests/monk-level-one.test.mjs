import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newBuild,compileBuild,previewBuild} from '../src/features/characters/rules/build.mjs';
import {MONK_ID as ID} from '../src/features/characters/rules/level-one-classes.mjs';
import {validateClassDefinition} from '../src/features/characters/rules/class-contract.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
const fixture=(con=10)=>{const b=newBuild();Object.assign(b,{name:'FFd20 Monk',alignment:'Chaotic Good',classId:ID,raceId:'ffd20:race:galka',hpRolls:[12],reviewed:true});b.baseScores.con=con;b.skillRanks=fixedSkills.map((_,i)=>i<previewBuild(b).skillBudget?1:0);return b;};
test('Monk follows the printed any-alignment d12/full-BAB baseline, eight first-level features and size-based unarmed table',async()=>{
 const c=JSON.parse(await readFile(new URL('../rules/classes/monk.class.json',import.meta.url),'utf8')),catalog=JSON.parse(await readFile(new URL('../docs/imports/catalog.json',import.meta.url),'utf8'));
 assert.deepEqual(validateClassDefinition(c),{id:ID,name:'Monk',levels:20,features:25,upgrades:23,choices:16});assert.equal(c.sources[0].catalogSha256,catalog.items.find(i=>i.id===ID).source.sha256);assert.match(c.sources[0].archiveSha256,/^[a-f0-9]{64}$/);
 assert.deepEqual([c.data.unarmedDamage[0].small,c.data.unarmedDamage[0].medium,c.data.unarmedDamage[0].large],['1d4','1d6','1d8']);assert.equal(c.data.unarmedDamage.length,6);
 const d=compileBuild(fixture());assert.equal(d.hp_max,12);assert.deepEqual([d.bab,d.fort_base,d.ref_base,d.will_base],[1,2,2,0]);assert.equal(d.currency_gil,35);assert.equal(d.mp_class,0);assert.equal(d.wis,12);
 assert.match(d.proficiencies,/Nunchaku/);assert.match(d.proficiencies,/monk special quality/);assert.doesNotMatch(d.proficiencies,/armor|shields|Simple weapons/i);assert.equal(d.weapons.length,0);
 assert(d.feats.some(f=>f.name==='Improved Unarmed Strike'));assert(!d.feats.some(f=>f.name==='Stunning Fist'));assert.equal(d.activeAbilities.filter(f=>f.limitBreak).length,2);assert.equal(d.spells.length,0);assert.equal(sheetStats(d).ac,10);
 assert(![...d.activeAbilities,...d.passiveAbilities].some(f=>['Ki Pool','Blitz Technique','Ascetic'].includes(f.name)));
 for(const alignment of ['True Neutral','Chaotic Evil','Lawful Good'])assert.equal(compileBuild({...fixture(),alignment}).alignment,alignment);
});
test('Bodybuilding adds only a positive Constitution bonus once and editing Constitution preserves current HP and manual fields',()=>{
 for(const [con,hp] of [[6,10],[8,11],[10,12],[12,14],[14,16],[16,18]]){const b=fixture(con);assert.equal(previewBuild(b).hp,hp);assert.equal(compileBuild(b).hp_max,hp);}
 const b=fixture(14),d=compileBuild(b);d.hp_curr=2;d.hp_max_temp=3;d.feats.find(f=>f.name==='Improved Unarmed Strike').desc='My manual unarmed notes';
 const twice=compileBuild(d.rulesBuild.input,d);assert.equal(twice.hp_max,16);assert.equal(sheetStats(twice).hpMax,19);assert.equal(twice.hp_curr,2);assert.equal(twice.feats.find(f=>f.name==='Improved Unarmed Strike').desc,'My manual unarmed notes');
 const raised=mergeSheetData(twice,{action:'fields',fields:{con:16}});assert.equal(raised.hp_max,18);assert.equal(raised.hp_curr,2);assert.equal(raised.hp_max_temp,3);assert.equal(sheetStats(raised).ac,10);const lowered=mergeSheetData(raised,{action:'fields',fields:{con:8}});assert.equal(lowered.hp_max,11);assert.equal(lowered.hp_curr,2);assert.equal(lowered.hp_max_temp,3);
});
test('Monk preserves shared Limit Break expenditure and rejects forged progression, choices, spell injection and archetypes',()=>{
 const b=fixture();let d=compileBuild(b);d.hp_curr=2;const lb=d.activeAbilities.findIndex(a=>a.limitBreak);d=mergeSheetData(d,{action:'useAbility',collection:'activeAbilities',index:lb});const twice=compileBuild(d.rulesBuild.input,d);assert.equal(twice.limitBreakPool.spent,1);assert.equal(twice.hp_curr,2);
 for(const change of [b=>b.level=2,b=>b.archetypeId='ffd20:archetype:monk:unverified',b=>b.choices[ID+':event:talent:2']=['unverified'],b=>b.spellIds=['unverified']]){const bad=fixture();change(bad);assert.throws(()=>compileBuild(bad));}
});
