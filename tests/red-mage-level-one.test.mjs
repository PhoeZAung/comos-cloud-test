import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {newBuild,spellCounts,previewBuild,compileBuild,buildIssues,classSkill,levelUpBuild,appendClassBuild} from '../src/features/characters/rules/build.mjs';
import {RED_MAGE_ID,RED_MAGERY_EVENT,redMageOptions} from '../src/features/characters/rules/red-mage-level-one.mjs';
import {redMageSpells} from '../src/features/characters/rules/red-mage-spells.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {entryCalculations} from '../src/features/sheet/calculations.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharacterLibraryService} from '../backend/characters/library.mjs';
const HANDY='ffd20:race:moogle:pool:moogle-handy-craft-or-profession';
function fixture(){
 const b=newBuild();Object.assign(b,{name:'Red Mage fixture',classId:RED_MAGE_ID,raceId:'ffd20:race:moogle',hpRolls:[8],reviewed:true,racialChoices:{[HANDY]:['skill-row:4']},racialSpecialties:{[HANDY]:'Woodworking'},choices:{[RED_MAGERY_EVENT]:[redMageOptions()[0].id]}});
 b.baseScores.cha=14;const counts=spellCounts(b);b.spellSelections={cantrips:redMageSpells.filter(s=>s.level===0).slice(0,counts.cantrips).map(s=>s.id),leveled:redMageSpells.filter(s=>s.level===1).slice(0,counts.leveled).map(s=>s.id)};b.spellIds=[...b.spellSelections.cantrips,...b.spellSelections.leveled];let remaining=previewBuild(b).skillBudget;b.skillRanks=fixedSkills.map(()=>remaining-->0?1:0);return b;
}
test('Red Mage uses source saves, HP, skills, CHA spells, MP and two distinct Limit Breaks',()=>{
 const b=fixture();assert.deepEqual(buildIssues(b),[]);const d=compileBuild(b);
 assert.deepEqual([d.class,d.hp_max,d.bab,d.fort_base,d.ref_base,d.will_base,d.currency_gil],['Red Mage',8,0,2,0,2,140]);
 assert.equal(d.rulesBuild.input.initialChaMod,3);assert.equal(d.spells.length,8);assert.equal(d.mp_class,2);assert.equal(d.mp_bonus,1);
 assert.equal(d.castingProfiles[0].ability,'cha');assert.equal(d.spell_dc_base,'cha');
 assert.equal(d.skills.reduce((n,s)=>n+s.lvl,0),6);assert(classSkill(b,'skill:use-magic-device'));assert(!classSkill(b,'skill:survival'));
 const lbs=d.activeAbilities.filter(a=>a.limitBreak);assert.deepEqual(lbs.map(a=>a.name),['Dual Spellcasting','Flexibility']);
 assert(d.passiveAbilities.some(a=>a.name==='Quick Mind'));assert(!d.feats.some(f=>f.name==='Precise Shot'));
 assert.equal(entryCalculations(d.spells.find(s=>s.lvl===1),d,'spells').dc,14);
 assert.match(renderBuild(b,5),/Cantrip 1/);assert.match(renderBuild(b,4),/Red Magery/);
 const alternative=fixture();alternative.choices[RED_MAGERY_EVENT]=[redMageOptions()[1].id];assert(compileBuild(alternative).passiveAbilities.some(a=>a.name==='Spell Combat Expertise'));assert.throws(()=>compileBuild(alternative,d),/Magery cannot be replaced/);
 assert.equal(redMageSpells.filter(s=>s.level<=1).length,62);assert.equal(redMageSpells.length,239);assert(redMageSpells.every(s=>s.description.length>30&&s.archiveSha256.length===64));
});
test('Red Mage rejects illegal magery, duplicate/missing/wrong spells, premature levels and unsupported changes',()=>{
 for(const change of [b=>b.choices={},b=>b.choices[RED_MAGERY_EVENT]=[RED_MAGE_ID+':magery:extra-quick-casts'],b=>b.choices.extra=['fake'],b=>b.spellIds.push(b.spellIds[0]),b=>{b.spellIds[0]='ffd20:spell:not-red-magic';b.spellSelections=null;},b=>b.baseScores.cha=8,b=>b.hpRolls=[6],b=>b.archetypeId='fake',b=>b.level=2,b=>b.initialIntMod=3,b=>b.favored=['hp']]){
  const b=fixture();change(b);assert.throws(()=>compileBuild(b));
 }
 const d=compileBuild(fixture());assert.throws(()=>levelUpBuild({...d.rulesBuild.input,level:3},d),/exactly one level/);assert.throws(()=>appendClassBuild(fixture(),d),/multiclassing/);
 const b=fixture();b.raceId='ffd20:race:immortal';b.racialChoices={};b.racialSpecialties={};assert(buildIssues(b).some(i=>/Magic Ineptitude/.test(i.message)));assert.throws(()=>compileBuild(b));
});
test('Red Mage preserves spent MP, manual edits and starting spell entitlement across CHA changes',()=>{
 const d=compileBuild(fixture());d.mp=d.mp_curr=1;d.hp_curr=3;d.spells[0].name='My cantrip';d.spells[0].desc='My note';d.spells.push({name:'Manual spell'});
 const changed=mergeSheetData(d,{action:'fields',fields:{cha:20}});assert.equal(changed.mp_curr,1);assert.equal(changed.hp_curr,3);assert.equal(changed.mp_bonus,2);
 const input=structuredClone(changed.rulesBuild.input);const e=compileBuild(input,changed);assert.equal(e.spells.length,9);assert.equal(e.spells[0].name,'Manual spell');assert(e.spells.some(s=>s.name==='My cantrip'&&s.desc==='My note'));
 assert.equal(spellCounts(input).leveled,6);input.initialChaMod=5;input.spellSelections.leveled=redMageSpells.filter(s=>s.level===1).slice(0,8).map(s=>s.id);input.spellIds=[...input.spellSelections.cantrips,...input.spellSelections.leveled];assert.throws(()=>compileBuild(input,e),/allowance cannot be changed/);
 const fake=fixture();fake.initialChaMod=5;fake.spellSelections=structuredClone(input.spellSelections);fake.spellIds=[...input.spellIds];assert.throws(()=>compileBuild(fake),/allowance cannot be changed/);
});
test('Red Mage persists through SQLite close/reopen and idempotent character creation',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'red-mage-'));let db;
 try{db=await openDatabase(join(dir,'characters.sqlite'));const user=createUserRepository(db).create({displayName:'Red Mage fixture'}),service=createCharacterLibraryService(db),request={build:fixture(),requestId:randomUUID()};
 const created=service.createBuild(user.id,request);assert.equal(service.createBuild(user.id,request).id,created.id);db.close();db=await openDatabase(join(dir,'characters.sqlite'));
 const stored=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(created.id).data_json);assert.equal(stored.class,'Red Mage');assert.equal(stored.spells.length,8);assert.deepEqual(compileBuild(stored.rulesBuild.input,stored).rulesBuild.input,stored.rulesBuild.input);
 }finally{db?.close();await rm(dir,{recursive:true,force:true});}
});
