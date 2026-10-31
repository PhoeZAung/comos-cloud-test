import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {Readable} from 'node:stream';
import {newBuild,compileBuild,previewBuild,prepareLevelUp,levelUpBuild,choiceEvents,eligibleOptions,spellCounts,buildIssues} from '../src/features/characters/rules/build.mjs';
import {RED_MAGE_ID,RED_MAGERY_EVENT,RUBY_TALENT_EVENT,redMageClass,redMageOptions} from '../src/features/characters/rules/red-mage-level-one.mjs';
import {redMageSpells} from '../src/features/characters/rules/red-mage-spells.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderBuild,wizardOrder} from '../src/ui/rules-wizard.mjs';
import {restRecovery} from '../src/features/sheet/recovery.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharacterLibraryService} from '../backend/characters/library.mjs';
import {createDirectoryRoutes} from '../backend/characters/directory.mjs';
function fill(b){let remaining=previewBuild(b).skillBudget-(b.skillRanks||[]).reduce((n,v)=>n+v,0);b.skillRanks??=fixedSkills.map(()=>0);for(let i=0;i<b.skillRanks.length;i++){const n=Math.min(b.level-b.skillRanks[i],remaining);b.skillRanks[i]+=n;remaining-=n;}assert.equal(remaining,0);b.reviewed=true;return b;}
function first(){const b=newBuild(),handy='ffd20:race:moogle:pool:moogle-handy-craft-or-profession';Object.assign(b,{name:'Red Mage two fixture',classId:RED_MAGE_ID,raceId:'ffd20:race:moogle',hpRolls:[8],racialChoices:{[handy]:['skill-row:4']},racialSpecialties:{[handy]:'Woodworking'},choices:{[RED_MAGERY_EVENT]:[redMageOptions()[0].id]}});b.baseScores.cha=14;b.baseScores.str=17;const count=spellCounts(b);b.spellSelections={cantrips:redMageSpells.filter(s=>s.level===0).slice(0,2).map(s=>s.id),leveled:redMageSpells.filter(s=>s.level===1).slice(0,count.leveled).map(s=>s.id)};b.spellIds=[...b.spellSelections.cantrips,...b.spellSelections.leveled];return fill(b);}
function next(data,talent='Concentrate'){const {build:b}=prepareLevelUp(data);assert.equal(b.initialIntMod,null);const event=choiceEvents(b).find(e=>e.id===RUBY_TALENT_EVENT),option=eligibleOptions(b,event).find(o=>o.name===talent);assert(option,'legal '+talent);b.choices[event.id]=[option.id];const extra=redMageSpells.filter(s=>s.level===1&&!b.spellIds.includes(s.id)).slice(0,2).map(s=>s.id);b.spellSelections.leveled.push(...extra);b.spellIds.push(...extra);return fill(b);}
const ability=(d,name)=>[...d.activeAbilities,...d.passiveAbilities].find(a=>a.name===name);
test('Red Mage source level-two statistics, two added spells, pool and Spellstrike are granted without healing',()=>{
 const saved=compileBuild(first());saved.hp_curr=2;saved.mp=saved.mp_curr=1;const b=next(saved);assert.deepEqual(buildIssues(b),[]);const d=levelUpBuild(b,saved);
 assert.deepEqual([d.level,d.bab,d.fort_base,d.ref_base,d.will_base,d.hp_max,d.mp_class,d.mp_bonus],[2,1,3,0,3,13,3,1]);
 assert.equal(d.hp_curr,2);assert.equal(d.mp_curr,1);assert.equal(d.spells.length,saved.spells.length+2);assert(saved.spells.every(s=>d.spells.some(n=>n.sourceRuleId===s.sourceRuleId)));
 assert.equal(ability(d,'Arcane Pool').u_max,4);assert.equal(ability(d,'Arcane Pool').u_curr,4);assert.equal(ability(d,'Concentrate').u_max,1);assert(ability(d,'Spellstrike'));
 assert.equal(d.castingProfiles[0].casterLevel,2);assert.equal(restRecovery(d).rows[0].casterLevel,2);assert.equal(restRecovery(d).rows[0].ability,'cha');
 assert(wizardOrder(b,'levelup',saved.rulesBuild.input).includes(5));assert.match(renderBuild(b,4,{mode:'levelup',baseline:saved.rulesBuild.input}),/Ruby Talent/);assert.match(renderBuild(b,4,{mode:'levelup',baseline:saved.rulesBuild.input}),/red-mage\/ruby-talents\//);assert.match(renderBuild(b,5,{mode:'levelup',baseline:saved.rulesBuild.input}),/Spell 8/);assert.match(renderBuild(b,5,{mode:'levelup',baseline:saved.rulesBuild.input}),/No new cantrips/);
});
test('all bounded Ruby Talent candidates save; STR requirements and unsupported source options stay guarded',()=>{
 const saved=compileBuild(first()),options=redMageClass.choicePools.find(p=>p.id.endsWith(':ruby-talents')).options;assert.equal(options.length,33);
 for(const o of options.filter(o=>o.selectable&&o.minimumLevel<=2)){const d=levelUpBuild(next(saved,o.name),saved);assert(ability(d,o.name));if(o.dailyUses)assert.equal(ability(d,o.name).u_max,o.dailyUses);}
 const b=next(saved);b.baseScores.str=10;const event=choiceEvents(b).find(e=>e.id===RUBY_TALENT_EVENT);assert(!eligibleOptions(b,event).some(o=>o.name==='Brutish Combat'));
 for(const name of ['Advanced Quick Learner','Quickened Magic','Ruby Finesse'])assert(!eligibleOptions(b,event).some(o=>o.name===name),name+' must stay guarded');
});
test('Red Mage rejects forged advancement, spell removal, excess learning, respecs and later levels',()=>{
 const saved=compileBuild(first()),b=next(saved);
 for(const change of [x=>x.level=3,x=>x.initialChaMod++,x=>x.initialIntMod=2,x=>x.baseScores.cha++,x=>x.hpRolls[0]=1,x=>x.skillRanks[0]=0,x=>x.abilityIncreases={2:'cha'},x=>delete x.choices[RUBY_TALENT_EVENT],x=>x.choices[RUBY_TALENT_EVENT]=[RED_MAGE_ID+':talent:quickened-magic'],x=>{const id=redMageSpells.find(s=>s.level===1&&!x.spellIds.includes(s.id)).id;x.spellIds.push(id);x.spellSelections.leveled.push(id);},x=>x.choices[RED_MAGERY_EVENT]=[RED_MAGE_ID+':magery:spell-combat-expertise'],x=>{x.spellSelections.leveled.shift();x.spellSelections.leveled.push(redMageSpells.filter(s=>s.level===1&&!x.spellIds.includes(s.id))[0].id);x.spellIds=[...x.spellSelections.cantrips,...x.spellSelections.leveled];}]){const forged=structuredClone(b);change(forged);assert.throws(()=>levelUpBuild(forged,saved));}
 assert.throws(()=>compileBuild(b,saved),/Use Level up/);const d=levelUpBuild(b,saved);assert.throws(()=>levelUpBuild({...d.rulesBuild.input,level:3},d),/HP/);assert.equal(prepareLevelUp(d).build.level,3);
 const respec=structuredClone(d.rulesBuild.input);respec.choices[RUBY_TALENT_EVENT]=[RED_MAGE_ID+':talent:reach-magic'];assert.throws(()=>compileBuild(respec,d),/cannot be replaced/);
});
test('Red Mage pool and talent expenditure, manual rows and spell entitlement survive CHA edits and resaves',()=>{
 let d=levelUpBuild(next(compileBuild(first()),'Silent Magic'),compileBuild(first()));d.hp_curr=1;d.mp=d.mp_curr=1;ability(d,'Arcane Pool').u_curr=1;ability(d,'Silent Magic').u_curr=0;d.spells[0].name='My spell';d.spells.push({name:'Manual spell'});ability(d,'Arcane Pool').desc='My pool note';
 d=mergeSheetData(d,{action:'fields',fields:{cha:20}});assert.equal(ability(d,'Arcane Pool').u_max,6);assert.equal(ability(d,'Arcane Pool').u_curr,3);assert.equal(d.mp_curr,1);assert.equal(spellCounts(d.rulesBuild.input).leveled,8);
 const again=compileBuild(d.rulesBuild.input,d);assert.equal(again.mp_class,3);assert.equal(again.mp_bonus,2);assert.equal(again.hp_curr,1);assert.equal(ability(again,'Arcane Pool').u_curr,3);assert.equal(ability(again,'Silent Magic').u_curr,0);assert.equal(ability(again,'Arcane Pool').desc,'My pool note');assert(again.spells.some(s=>s.name==='My spell'));assert(again.spells.some(s=>s.name==='Manual spell'));
 const ids=again.rulesBuild.ownedIds;assert.equal(new Set(ids).size,ids.length);
});
test('Red Mage level-two route uses revisions and persists learned spells/resources across database reopen',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'red-two-'));let db=await openDatabase(join(folder,'characters.sqlite'));
 try{const user=createUserRepository(db).create({displayName:'Red Mage route fixture'}),created=createCharacterLibraryService(db).createBuild(user.id,{build:first(),requestId:randomUUID()}),sessions={restore:async()=>({user,identity:{providerUid:'fixture'}})},origin='https://local.fixture';
 const post=async build=>{const req=Readable.from([Buffer.from(JSON.stringify({op:'wizard-level-up',revision:created.revision,build}))]);req.method='POST';req.headers={origin,'content-type':'application/json',cookie:'__Host-comos_session=fixture'};req.url='/api/v1/character-records/'+created.id;let result;await createDirectoryRoutes({db,sessions,adminUids:[],origin})(req,{},req.url,(status,payload)=>result={status,payload});return result;};
 const updated=await post(next(created.data));assert.equal(updated.status,200,updated.payload.message);assert.equal((await post(next(created.data))).status,409);db.close();db=await openDatabase(join(folder,'characters.sqlite'));
 const stored=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(created.id).data_json);assert.equal(stored.level,2);assert.equal(stored.spells.length,10);assert.equal(ability(stored,'Arcane Pool').u_max,4);assert.equal(compileBuild(stored.rulesBuild.input,stored).castingProfiles[0].casterLevel,2);
 }finally{db.close();await rm(folder,{recursive:true,force:true});}
});
