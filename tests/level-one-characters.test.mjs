import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {newBuild,previewBuild,compileBuild,buildIssues,levelUpBuild,appendClassBuild} from '../src/features/characters/rules/build.mjs';
import {CHOCOBO_KNIGHT_ID,DANCER_ID,MOG_KNIGHT_ID} from '../src/features/characters/rules/level-one-classes.mjs';
import {renderBuild,wizardOrder} from '../src/ui/rules-wizard.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharacterLibraryService} from '../backend/characters/library.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';

const HANDY='ffd20:race:moogle:pool:moogle-handy-craft-or-profession';
const SCORE='ffd20:race:immortal:pool:flexible-score';
const KNOWLEDGE='ffd20:race:immortal:pool:long-lived-knowledge';
const LANGUAGES='ffd20:race:immortal:pool:bonus-languages';
const MOOGLE_LANGUAGES='ffd20:race:moogle:pool:bonus-languages';
function fixture(mog=false){
 const b=newBuild();Object.assign(b,{name:mog?'Moogle Mog Knight':'Immortal Dancer',
  classId:mog?CHOCOBO_KNIGHT_ID:DANCER_ID,raceId:'ffd20:race:'+(mog?'moogle':'immortal'),
  archetypeId:mog?MOG_KNIGHT_ID:'',hpRolls:[mog?10:8],reviewed:true,
  racialChoices:mog?{[HANDY]:['skill-row:4']}:{[SCORE]:[SCORE+':option:charisma'],[KNOWLEDGE]:['skill:knowledge-nature','skill:knowledge-planes']},
  racialSpecialties:mog?{[HANDY]:'Woodworking'}:{}});
 let remaining=previewBuild(b).skillBudget;
 b.skillRanks=fixedSkills.map(()=>{const n=Math.min(1,remaining);remaining-=n;return n;});
 assert.equal(remaining,0);return b;
}

test('Moogle Mog Knight applies racial scores, Small identity, land speed and only the selected Handy row',()=>{
 const b=fixture(true);assert.deepEqual(buildIssues(b),[]);
 const d=compileBuild(b),s=sheetStats(d);
 assert.deepEqual([d.str,d.dex,d.con,d.int,d.wis,d.cha],[8,12,10,10,10,12]);
 assert.equal(d.class,'Chocobo Knight');assert.equal(d.archetype,'Mog Knight');
 assert.equal(d.size_category,'Small');assert.equal(d.speed,20);assert.equal(d.hp_max,10);
 assert.equal(d.bab,1);assert.deepEqual([d.fort_base,d.ref_base,d.will_base],[2,0,0]);
 assert.equal(d.skills[4].rulesBonus,2);assert.equal(d.skills[4].subName,'Woodworking');
 assert.equal(d.skills[5].rulesBonus,0);assert.equal(d.skills[6].rulesBonus,0);
 assert.equal(d.skills.find(r=>r.name==='Appraise').rulesBonus,2);
 assert.equal(d.skills.find(r=>r.name==='Perception').rulesBonus,2);
 assert.equal(d.proficiencies.includes('Heavy armor'),true);
 assert.equal(d.languages,'Common, Moogle');assert.equal(s.mpMax,0);
 assert(d.feats.some(f=>f.name==='Mounted Combat'&&!f.pendingFeat));
 assert(d.racialAbilities.some(f=>f.name==='Base Speed'&&/limited wing-assisted flight/.test(f.desc)));
});

test('Mog Knight replaces Challenge and Supreme Overrun while retaining Fight as One and the mount',()=>{
 const d=compileBuild(fixture(true));
 const names=[...d.activeAbilities,...d.passiveAbilities].map(f=>f.name);
 for(const name of ['Steady Riding','Mog Attack','Deathblow','Fight as One','Chocobo Mount'])assert(names.includes(name),name);
 for(const name of ['Challenge','Supreme Overrun'])assert(!names.includes(name),name);
 assert(d.activeAbilities.find(f=>f.name==='Deathblow').limitBreak);
 assert.equal(d.activeAbilities.find(f=>f.name==='Commander’s Aura').u_max,5);
 const base=fixture(true);base.archetypeId='';
 const parent=compileBuild(base);assert(parent.activeAbilities.some(f=>f.name==='Challenge'));
 assert(parent.activeAbilities.some(f=>f.name==='Supreme Overrun'));
});

test('Immortal Dancer records one racial score choice, racial skills and non-MP resources',()=>{
 const b=fixture();assert.deepEqual(buildIssues(b),[]);
 const d=compileBuild(b);
 assert.equal(d.class,'Dancer');assert.equal(d.cha,12);assert.equal(d.int,10);
 assert.equal(d.hp_max,8);assert.equal(d.speed,30);assert.equal(d.size_category,'Medium');
 assert.deepEqual([d.bab,d.fort_base,d.ref_base,d.will_base],[0,2,2,0]);
 assert.equal(d.mp_class,0);assert.equal(d.mp_bonus,0);assert.equal(d.spells.length,0);assert.deepEqual(d.castingProfiles,[]);
 assert(d.feats.some(f=>f.name==='Improved Unarmed Strike'));
 assert(!d.activeAbilities.some(f=>f.name==='Ki Pool'));
 assert.equal(d.activeAbilities.find(f=>f.name==='Battle Dance').u_max,5);
 assert.equal(d.activeAbilities.find(f=>f.name==='Battle Dance').restoreOnLongRest,false);
 assert.equal(d.skills.find(f=>f.name==='Bluff').rulesBonus,1);
 assert.equal(d.skills.find(f=>f.name==='Disguise').rulesBonus,1);
 assert.equal(d.skills.find(f=>f.name==='Knw: Local').rulesBonus,1);
 assert.equal(d.skills.reduce((n,s)=>n+s.lvl,0),4,'Long-Lived grants no free ranks');
 assert(d.racialAbilities.some(f=>f.name==='Magic Ineptitude'));
 assert.equal(d.ac_temp,undefined,'conditional Charisma AC is not made permanent');
});

test('racial choice validation rejects missing, duplicate, unknown and inactive selections',()=>{
 const b=fixture();delete b.racialChoices[SCORE];assert.throws(()=>compileBuild(b),/choose 1/i);
 const duplicate=fixture();duplicate.racialChoices[SCORE].push(duplicate.racialChoices[SCORE][0]);assert.throws(()=>compileBuild(duplicate),/duplicate/i);
 const forged=fixture();forged.racialChoices[SCORE]=['str'];assert.throws(()=>compileBuild(forged),/Invalid/);
 const tooMany=fixture();tooMany.racialChoices[KNOWLEDGE]=['skill:knowledge-nature','skill:knowledge-planes','skill:knowledge-local','skill:knowledge-history','skill:knowledge-arcana'];assert.throws(()=>compileBuild(tooMany),/up to 4/);
 const inactive=fixture();inactive.disabledTraits.push('ffd20:race:immortal:trait:ability-score-adjustment');assert.throws(()=>compileBuild(inactive),/inactive/);
 const handy=fixture(true);handy.racialSpecialties={};assert.throws(()=>compileBuild(handy),/specialty/);
});

test('Immortal high-Intelligence language choices are bounded and saved once',()=>{
 const b=fixture();b.baseScores.int=12;b.racialChoices[LANGUAGES]=[LANGUAGES+':option:celestial'];
 b.skillRanks[4]=1;const d=compileBuild(b);assert.equal(d.languages,'Common, Celestial');
 const twice=compileBuild(d.rulesBuild.input,d);assert.equal(twice.languages,'Common, Celestial');
 b.racialChoices[LANGUAGES].push(LANGUAGES+':option:draconic');assert.throws(()=>compileBuild(b),/up to 1/);
});

test('Moogle starting language choices use the source list and Intelligence allowance',()=>{
 const b=fixture(true);b.baseScores.int=14;b.skillRanks[4]=1;b.skillRanks[5]=1;
 b.racialChoices[MOOGLE_LANGUAGES]=[MOOGLE_LANGUAGES+':option:aklo',MOOGLE_LANGUAGES+':option:auran'];
 const d=compileBuild(b);assert.equal(d.languages,'Common, Moogle, Aklo, Auran');
 const again=compileBuild(d.rulesBuild.input,d);assert.equal(again.languages,d.languages);
 assert.equal(again.skills.reduce((n,s)=>n+s.lvl,0),6);
 const race=renderBuild(b,2);assert.match(race,/Bonus languages/);assert.match(race,/choose up to 2/i);
 assert.match(race,/data-rw-racial-option="ffd20:race:moogle:pool:bonus-languages"/);
 const scores=renderBuild(b,1,{mode:'create'});assert.match(scores,/data-rw-bonus-languages/);
 assert.match(scores,/data-rw-racial-option="ffd20:race:moogle:pool:bonus-languages"/);
 b.racialChoices[MOOGLE_LANGUAGES].push(MOOGLE_LANGUAGES+':option:draconic');
 assert.throws(()=>compileBuild(b),/up to 2/);
 b.racialChoices[MOOGLE_LANGUAGES]=[MOOGLE_LANGUAGES+':option:celestial'];
 assert.throws(()=>compileBuild(b),/Invalid or duplicate/);
});

test('Moogle bonus languages stay optional, require an active trait, and do not leak between races',()=>{
 const b=fixture(true);assert.equal(compileBuild(b).languages,'Common, Moogle');
 b.racialChoices[MOOGLE_LANGUAGES]=[MOOGLE_LANGUAGES+':option:aklo'];
 assert.throws(()=>compileBuild(b),/choose 0/);
 b.baseScores.int=12;b.skillRanks[4]=1;
 b.disabledTraits.push('ffd20:race:moogle:trait:languages');
 assert.throws(()=>compileBuild(b),/inactive/);
 const other=fixture();other.racialChoices[MOOGLE_LANGUAGES]=[MOOGLE_LANGUAGES+':option:aklo'];
 assert.throws(()=>compileBuild(other),/inactive/);
});

test('Mog Knight race/class restrictions and first-level boundaries are enforced on the server model',()=>{
 const b=fixture();b.archetypeId=MOG_KNIGHT_ID;assert.throws(()=>compileBuild(b),/Mog Knight requires/);
 const wrongRace=fixture(true);wrongRace.raceId='ffd20:race:dwarf';wrongRace.racialChoices={};wrongRace.racialSpecialties={};assert.throws(()=>compileBuild(wrongRace),/Mog Knight requires/);
 for(const mog of [false,true]){
  const original=fixture(mog),saved=compileBuild(original),next={...original,level:2};
  assert.throws(()=>compileBuild(next),/level-1 testing/);
  assert.throws(()=>levelUpBuild(next,saved),/level-1 testing/);
  assert.throws(()=>appendClassBuild(original,saved),/Multiclassing/);
  const spell=fixture(mog);spell.spellIds=['invented'];assert.throws(()=>compileBuild(spell),/does not learn/);
 }
});

test('editing or reloading does not duplicate bonuses, refill resources, or remove manual sheet entries',()=>{
 for(const mog of [false,true]){
  const b=fixture(mog),d=compileBuild(b);
  d.items.push({name:'My manual item'});d.passiveAbilities.push({name:'Manual note',desc:'Keep this'});
  const resource=d.activeAbilities.find(a=>['Commander’s Aura','Battle Dance'].includes(a.name));resource.u_curr--;
  const next=compileBuild(JSON.parse(JSON.stringify(d.rulesBuild.input)),JSON.parse(JSON.stringify(d)));
  assert.equal(next.hp_max,d.hp_max);assert.equal(next.speed,d.speed);
  assert.equal(next.activeAbilities.find(a=>a.name===resource.name).u_curr,resource.u_curr);
  assert(next.items.some(i=>i.name==='My manual item'));assert(next.passiveAbilities.some(i=>i.name==='Manual note'));
  const owned=[...next.activeAbilities,...next.passiveAbilities,...next.racialAbilities,...next.feats].filter(r=>r.rulesOwned).map(r=>r.sourceRuleId);
  assert.equal(new Set(owned).size,owned.length);
  assert.equal(next.skills[4].rulesBonus,d.skills[4].rulesBonus);
 }
});

test('sheet ability edits update HP and performance uses without granting MP or healing',()=>{
 for(const mog of [false,true]){
  const d=compileBuild(fixture(mog));d.hp_curr=3;
  const resource=d.activeAbilities.find(a=>['Commander’s Aura','Battle Dance'].includes(a.name));resource.u_curr=2;
  const changed=mergeSheetData(d,{action:'fields',fields:{int:18,con:14,cha:16}});
  assert.equal(changed.mp_bonus,0);assert.equal(changed.mp_class,0);assert.equal(changed.mp_curr,0);
  assert.equal(changed.hp_max,d.hp_max+2);assert.equal(changed.hp_curr,3);
  const after=changed.activeAbilities.find(a=>a.name===resource.name);
  assert.equal(after.u_max,7);assert.equal(after.u_curr,4,'spent rounds are retained when Charisma grows');
 }
});

test('wizard offers both classes and supported racial selections without a spell step',()=>{
 const b=fixture(true),cls=renderBuild(b,3,{mode:'create'}),race=renderBuild(b,2);
 assert.match(cls,/Chocobo Knight/);assert.match(cls,/Dancer/);assert.match(cls,/Mog Knight · Moogle only/);
 assert.match(cls,/level-1 testing/);assert.match(race,/data-rw-racial-choice/);assert.match(race,/data-rw-racial-specialty/);
 const other=fixture();assert.match(renderBuild(other,2),/Long-Lived Knowledge skills/);
 assert.match(renderBuild(other,2),/data-rw-racial-option/);
 assert(!wizardOrder(b).includes(5));assert(!wizardOrder(other).includes(5));
 const unsafe=fixture(true);unsafe.racialSpecialties[HANDY]='<img src=x>';
 assert.doesNotMatch(renderBuild(unsafe,2),/<img src=x>/);
});

test('character library persists both level-1 builds and idempotently reloads them',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=createUserRepository(db).create({displayName:'Character test owner'}),service=createCharacterLibraryService(db);
  const highInt=fixture(true);highInt.name='Moogle linguist';highInt.baseScores.int=12;highInt.skillRanks[4]=1;
  highInt.racialChoices[MOOGLE_LANGUAGES]=[MOOGLE_LANGUAGES+':option:draconic'];
  for(const build of [fixture(false),fixture(true),highInt]){
   const mog=build.classId===CHOCOBO_KNIGHT_ID,request={build,requestId:randomUUID()};
   const first=service.createBuild(owner.id,request),again=service.createBuild(owner.id,request);
   assert.equal(first.id,again.id);assert.equal(first.data.rulesBuild.input.classId,mog?CHOCOBO_KNIGHT_ID:DANCER_ID);
   const stored=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(first.id).data_json);
   assert.deepEqual(stored.rulesBuild.input.racialChoices,request.build.racialChoices);
   if(build===highInt)assert.equal(stored.languages,'Common, Moogle, Draconic');
   assert.equal(stored.mp_class,0);
   assert.throws(()=>service.createBuild(owner.id,{build:{...request.build,hpRolls:[6]},requestId:randomUUID()}),/maximum d/);
  }
  assert.equal(service.list(owner.id).characters.length,3);
 }finally{db.close();}
});
