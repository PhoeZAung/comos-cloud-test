import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {newBuild,previewBuild,compileBuild,buildIssues,choiceEvents,eligibleOptions,classSkill,levelUpBuild,appendClassBuild} from '../src/features/characters/rules/build.mjs';
import {BEASTMASTER_ID,COMPANION_EVENT,NO_COMPANION} from '../src/features/characters/rules/beastmaster-level-one.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {entryCalculations} from '../src/features/sheet/calculations.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderBuild,wizardOrder} from '../src/ui/rules-wizard.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharacterLibraryService} from '../backend/characters/library.mjs';
import {availableRuleAbilities,addRuleAbility} from '../src/features/characters/rules/ability-library.mjs';
const companionId=name=>BEASTMASTER_ID+':companion:'+name;
function fixture(companion='wolf'){
 const b=newBuild();Object.assign(b,{name:'Galka Beastmaster',classId:BEASTMASTER_ID,raceId:'ffd20:race:galka',hpRolls:[10],reviewed:true,choices:{[COMPANION_EVENT]:[companionId(companion)]}});
 b.skillRanks=fixedSkills.map((_,i)=>i<4?1:0);return b;
}
const ability=(d,slug)=>d.activeAbilities.find(a=>a.sourceRuleId===BEASTMASTER_ID+':feature:'+slug);

test('first-level Beastmaster applies its own class stats and Nature Sense without companion or focus bonuses leaking to its owner',()=>{
 const b=fixture();assert.deepEqual(buildIssues(b),[]);const d=compileBuild(b);
 assert.equal(d.class,'Beastmaster');assert.equal(d.hp_max,10);assert.equal(d.currency_gil,105);
 assert.deepEqual([d.bab,d.fort_base,d.ref_base,d.will_base],[1,2,2,0]);
 assert.deepEqual([d.str,d.dex,d.con,d.int,d.wis,d.cha],[12,10,10,10,12,8]);
 assert.equal(d.mp_class,0);assert.equal(d.mp_bonus,0);assert.equal(d.spells.length,0);assert.deepEqual(d.castingProfiles,[]);
 for(const name of ['Knw: Nature','Survival'])assert.equal(d.skills.find(s=>s.name===name).rulesBonus,2);
 assert(classSkill(b,'skill:knowledge-nature'));assert(classSkill(b,'skill:survival'));assert(!classSkill(b,'skill:perform'));
 assert(!d.feats.some(f=>['Mounted Combat','Improved Unarmed Strike','Improved Trip'].includes(f.name)));
 assert.equal(d.feats.length,1);assert(d.feats[0].pendingFeat);assert.equal(d.ac_natural,undefined);
 assert.equal(ability(d,'animal-focus').u_max,1);assert.equal(ability(d,'shared-senses').u_max,1);
 assert.equal(d.activeAbilities.filter(a=>a.limitBreak).length,2);
 assert.match(d.passiveAbilities.find(f=>f.name==='Animal Companion — Wolf').desc,/2d10 HD, BAB \+2/);
});

test('all eleven supported starting animals persist; later, magical, plant and vermin choices are rejected',()=>{
 const b=fixture(),options=eligibleOptions(b,choiceEvents(b)[0]);assert.equal(options.length,12);
 for(const option of options){const candidate=fixture();candidate.choices[COMPANION_EVENT]=[option.id];const d=compileBuild(candidate);assert.deepEqual(d.rulesBuild.input.choices,candidate.choices);}
 for(const choice of ['bear-grizzly','chocobo-orange','chocobo-bronze','chocobo-teal','coeurl','funguar','scorpion','invented']){
  const candidate=fixture(choice);assert.throws(()=>compileBuild(candidate),/supported starting animal/);
 }
 for(const change of [b=>b.choices={},b=>b.choices[COMPANION_EVENT].push(companionId('bear')),b=>b.choices.bad=['fake'],b=>b.skillRanks=null,b=>b.hpRolls=[8],b=>b.favored=['hp'],b=>b.spellIds=['invented'],b=>b.initialChaMod=1,b=>b.archetypeId='ffd20:archetype:beastmaster:tree-guardian']){
  const bad=fixture();change(bad);assert.throws(()=>compileBuild(bad));
 }
});

test('no starting companion is explicit, grants no Shared Senses and is not treated as a dead companion',()=>{
 const b=fixture('none');assert.equal(b.choices[COMPANION_EVENT][0],NO_COMPANION);const d=compileBuild(b);
 assert.equal(ability(d,'shared-senses'),undefined);assert.equal(ability(d,'animal-focus').u_max,1);
 assert.match(d.passiveAbilities.find(f=>f.name==='Animal Companion').desc,/does not grant the dead-companion animal focus/);
 assert(wizardOrder(b).includes(4));assert(!wizardOrder(b).includes(5));
 assert.match(renderBuild(b,4,{mode:'edit'}),/data-rw-open-choice[^>]*disabled/);
 const saved=compileBuild(fixture());assert.throws(()=>compileBuild(b,saved),/starting companion cannot be replaced/);
 assert.throws(()=>compileBuild(fixture(),d),/starting companion cannot be replaced/);
});

test('Beastmaster editing preserves spent resources, manual companion notes and owner HP without duplicate bonuses',()=>{
 const d=compileBuild(fixture());d.hp_curr=3;ability(d,'animal-focus').u_curr=0;ability(d,'shared-senses').u_curr=0;
 const card=d.passiveAbilities.find(f=>f.name==='Animal Companion — Wolf');card.desc='Wolf HP and training notes';
 d.passiveAbilities.push({name:'Manual companion feat note'});
 for(let i=0;i<2;i++){
  const next=compileBuild(JSON.parse(JSON.stringify(d.rulesBuild.input)),JSON.parse(JSON.stringify(d)));
  assert.equal(next.hp_curr,3);assert.equal(ability(next,'animal-focus').u_curr,0);assert.equal(ability(next,'shared-senses').u_curr,0);
  assert.equal(next.passiveAbilities.find(f=>f.sourceRuleId===card.sourceRuleId).desc,card.desc);
  assert(next.passiveAbilities.some(f=>f.name==='Manual companion feat note'));
  assert.equal(next.skills.find(s=>s.name==='Survival').rulesBonus,2);
  const owned=['activeAbilities','passiveAbilities','racialAbilities','feats'].flatMap(k=>next[k].filter(f=>f.rulesOwned).map(f=>f.sourceRuleId));
  assert.equal(new Set(owned).size,owned.length);Object.assign(d,next);
 }
 const changed=mergeSheetData(d,{action:'fields',fields:{wis:16,con:14}});
 assert.equal(changed.hp_curr,3);assert.equal(changed.mp_curr,0);
 assert.equal(ability(changed,'shared-senses').u_max,3);assert.equal(ability(changed,'shared-senses').u_curr,2);
 assert.equal(entryCalculations(ability(changed,'shared-senses'),changed,'activeAbilities').maxUses,3);
 const rested=mergeSheetData(d,{action:'rest'});assert.equal(ability(rested,'animal-focus').u_curr,0);assert.equal(ability(rested,'shared-senses').u_curr,0);
 const lowWis=fixture();lowWis.baseScores.wis=6;assert.equal(ability(compileBuild(lowWis),'shared-senses').u_max,0);
});

test('Beastmaster rejects level-up, multiclassing and manual-sheet adoption',()=>{
 const b=fixture(),d=compileBuild(b);
 assert.throws(()=>compileBuild({...b,level:2},d),/level-1 testing/);
 assert.throws(()=>levelUpBuild({...b,level:2},d),/level-1 testing/);
 assert.throws(()=>appendClassBuild(b,d),/Multiclassing/);
 assert.throws(()=>appendClassBuild({...newBuild(),classId:'ffd20:class:black-mage'},d),/Multiclassing/);
 assert.throws(()=>compileBuild(b,{charName:'Manual sheet'}),/adopting/);
});

test('restoring a deleted Beastmaster card uses the correct class and retains companion prerequisites',()=>{
 const d=compileBuild(fixture()),id=BEASTMASTER_ID+':feature:animal-focus';
 d.activeAbilities=d.activeAbilities.filter(a=>a.sourceRuleId!==id);
 const option=availableRuleAbilities(d).find(o=>o.id===id);assert.equal(option.definition.name,'Beastmaster');
 const added=addRuleAbility(d,id);assert.equal(added.sourceClass,'Beastmaster');assert.equal(added.u_max,1);assert.equal(added.restoreOnLongRest,false);
 assert.throws(()=>addRuleAbility(compileBuild(fixture('none')),BEASTMASTER_ID+':feature:shared-senses'),/not granted/);
});

test('character library saves and reopens the bounded companion selection idempotently',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'Beastmaster fixture'}),service=createCharacterLibraryService(db),b=fixture(),request={build:b,requestId:randomUUID()};
  const created=service.createBuild(owner.id,request);assert.equal(service.createBuild(owner.id,request).id,created.id);
  const stored=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(created.id).data_json);
  assert.deepEqual(stored.rulesBuild.input.choices,b.choices);assert.equal(stored.class,'Beastmaster');
  assert.deepEqual(compileBuild(stored.rulesBuild.input,stored).rulesBuild.input,b);
 }finally{db.close();}
});
