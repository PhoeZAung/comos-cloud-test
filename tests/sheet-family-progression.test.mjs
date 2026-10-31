import test from 'node:test';
import assert from 'node:assert/strict';
import {compileBuild,levelUpBuild,previewBuild,prepareLevelUp,classFor,buildIssues} from '../src/features/characters/rules/build.mjs';
import {sheetFamilyClasses,sheetFamilyArchetypes,sheetFamilyProfile,sheetFamilyEvents} from '../src/features/characters/rules/sheet-family-progression.mjs';
import {validateSheetFamily} from '../src/features/characters/rules/sheet-family-contract.mjs';
import {familyFixture,advanceFamily,fixtureRaceLimits} from './helpers/sheet-family-fixtures.mjs';
import {renderBuild,wizardOrder} from '../src/ui/rules-wizard.mjs';
const paths=()=>sheetFamilyClasses.flatMap(c=>['',...sheetFamilyArchetypes({classId:c.id}).map(a=>a.id)].map(archetypeId=>({classId:c.id,archetypeId})));
const abilities=d=>[...d.activeAbilities,...d.passiveAbilities];
test('Thief, Warrior and Monk families have all seventy archived archetypes enabled locally',()=>{assert.equal(sheetFamilyClasses.length,3);assert.equal(paths().length,73);for(const c of sheetFamilyClasses){assert.equal(sheetFamilyArchetypes({classId:c.id}).length,c.id.endsWith(':monk')?20:25);}});
test('all seventy-three family paths create and advance through twenty with source chassis and unique ownership',()=>{
 for(const path of paths()){
  let data;try{data=compileBuild(familyFixture(path.classId,path.archetypeId));for(let level=2;level<=20;level++){data=levelUpBuild(advanceFamily(data),data);assert.equal(data.level,level);assert.equal(new Set(data.rulesBuild.ownedIds).size,data.rulesBuild.ownedIds.length);}
   const d=classFor(data.rulesBuild.input).data,row=d.levels[19];assert.equal(data.bab,row.bab);assert.deepEqual([data.fort_base,data.ref_base,data.will_base],[row.fort,row.ref,row.will]);assert.equal(data.mp_class,row.baseMp||0);assert.equal(compileBuild(structuredClone(data.rulesBuild.input),structuredClone(data)).level,20);
  }catch(e){throw new Error((path.archetypeId||path.classId)+' at '+data?.level+': '+e.message,{cause:e});}
 }
});
test('family definitions reject missing event pools, invalid resources and unsupported level coverage',()=>{const parent=structuredClone(sheetFamilyClasses[0]);assert(validateSheetFamily(parent));parent.data.events.push({id:'bad',type:'choose',poolIds:['missing'],count:{kind:'constant',value:1},sourceRefs:[{}]});assert.throws(()=>validateSheetFamily(parent),/choice event/);parent.data.events.pop();parent.data.resources=[{featureId:'missing',perLevel:1}];assert.throws(()=>validateSheetFamily(parent),/resource target/);parent.data.resources=[];parent.data.supportedLevels=[1];assert.throws(()=>validateSheetFamily(parent),/levels 1–20/);});
test('generic family level-up rejects skipped levels, changed archetype, scores and earlier choices',()=>{
 for(const c of sheetFamilyClasses){const saved=compileBuild(familyFixture(c.id));const next=advanceFamily(saved);for(const mutation of [b=>b.level++,b=>b.baseScores.dex++,b=>b.archetypeId=sheetFamilyArchetypes(b)[0].id]){const forged=structuredClone(next);mutation(forged);assert.throws(()=>levelUpBuild(forged,saved));}assert.throws(()=>compileBuild({...saved.rulesBuild.input,level:2},saved));}
});
test('family wizard lists native archetypes, skips automatic spells and saved choices cannot be replaced',()=>{
 for(const c of sheetFamilyClasses){const b=familyFixture(c.id),html=renderBuild(b,3);for(const a of sheetFamilyArchetypes(b))assert(html.includes(a.name));assert(!wizardOrder(b).includes(5));let data=compileBuild(b);while(!Object.keys(data.rulesBuild.input.choices).length&&data.level<4)data=levelUpBuild(advanceFamily(data),data);const forged=structuredClone(data.rulesBuild.input);forged.choices[Object.keys(forged.choices)[0]]=['forged'];assert.throws(()=>compileBuild(forged,data));}
});
test('every family path persists nineteen actual route level-ups and survives database close/reopen',async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),{randomUUID}=await import('node:crypto'),{Readable}=await import('node:stream');
 const {openDatabase}=await import('../backend/db/database.mjs'),{createUserRepository}=await import('../backend/repositories/users.mjs'),{createCharacterLibraryService}=await import('../backend/characters/library.mjs'),{createDirectoryRoutes}=await import('../backend/characters/directory.mjs');
 const dir=await mkdtemp(join(tmpdir(),'sheet-families-'));let db=await openDatabase(join(dir,'families.sqlite'));const saved=[];
 try{const owner=createUserRepository(db).create({displayName:'Family fixture'}),sessions={restore:async()=>({user:owner,identity:{providerUid:'local-fixture'}})},origin='https://local.fixture';
  for(const path of paths()){
   const c=createCharacterLibraryService(db).createBuild(owner.id,{build:familyFixture(path.classId,path.archetypeId),requestId:randomUUID()});let data=c.data,revision=c.revision;
   for(let level=2;level<=20;level++){const req=Readable.from([Buffer.from(JSON.stringify({op:'wizard-level-up',revision,build:advanceFamily(data)}))]);Object.assign(req,{method:'POST',url:'/api/v1/character-records/'+c.id,headers:{origin,'content-type':'application/json',cookie:'__Host-comos_session=fixture'}});let result;
    await createDirectoryRoutes({db,sessions,adminUids:[],origin})(req,{},req.url,(status,payload)=>result={status,payload});assert.equal(result.status,200,(path.archetypeId||path.classId)+' '+level+': '+result.payload.message);data=result.payload.character.data;revision=result.payload.character.revision;
   }saved.push(c.id);
  }
  db.close();db=await openDatabase(join(dir,'families.sqlite'));for(const id of saved){const d=JSON.parse(db.prepare('select data_json from character_details where character_id=?').get(id).data_json);assert.equal(d.level,20);assert.equal(compileBuild(d.rulesBuild.input,d).level,20);}assert.equal(saved.length,73);
 }finally{db.close();await rm(dir,{recursive:true,force:true});}
});
