import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,compileBuild,previewBuild,prepareLevelUp,levelUpBuild,choiceEvents,eligibleOptions,spellCounts,classFor,classSkill,buildIssues} from '../src/features/characters/rules/build.mjs';
import {redMageArchetypes,redMageClass,redMageHasSpells,redMageDefinition} from '../src/features/characters/rules/red-mage-level-one.mjs';
import {redMageSpells} from '../src/features/characters/rules/red-mage-spells.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {familyReplacementState} from '../src/features/characters/rules/family-progression.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderBuild,wizardOrder} from '../src/ui/rules-wizard.mjs';
const ID='ffd20:class:red-mage';
function complete(b){
 for(const event of choiceEvents(b))if(!b.choices[event.id]){const option=eligibleOptions(b,event)[0];assert(option,'available '+event.id);b.choices[event.id]=[option.id];}
 const counts=spellCounts(b),limit=previewBuild(b).summary.spellLevel;b.spellSelections??={cantrips:[],leveled:[]};
 for(const key of ['cantrips','leveled']){const candidates=redMageSpells.filter(s=>key==='cantrips'?s.level===0:s.level>0&&s.level<=limit&&s.level<=Math.floor((b.baseScores.cha+2)-10));for(const s of candidates)if(b.spellSelections[key].length<counts[key]&&!b.spellIds.includes(s.id)){b.spellSelections[key].push(s.id);b.spellIds.push(s.id);}assert.equal(b.spellSelections[key].length,counts[key]);}
 b.spellIds=[...b.spellSelections.cantrips,...b.spellSelections.leveled];
 b.skillRanks??=fixedSkills.map(()=>0);let remaining=previewBuild(b).skillBudget-b.skillRanks.reduce((n,v)=>n+v,0);for(let i=0;i<b.skillRanks.length;i++){const n=Math.min(b.level-b.skillRanks[i],remaining);b.skillRanks[i]+=n;remaining-=n;}assert.equal(remaining,0);b.reviewed=true;return b;
}
function fixture(arch=''){
 const b=newBuild(),pool='ffd20:race:moogle:pool:moogle-handy-craft-or-profession';Object.assign(b,{name:'Family '+(arch||'base'),classId:ID,archetypeId:arch,raceId:'ffd20:race:moogle',racialChoices:{[pool]:['skill-row:4']},racialSpecialties:{[pool]:'Woodworking'}});b.baseScores.cha=14;b.baseScores.str=17;if(arch.endsWith(':ishgardian-heretic')){b.raceId='ffd20:race:au-ra';b.racialChoices={};b.racialSpecialties={};b.baseScores.con=10;b.baseScores.cha=18;}b.hpRolls=[classFor(b).data.hitDie];return complete(b);
}
function advance(data){const {build}=prepareLevelUp(data);if(build.level%4===0)build.abilityIncreases[build.level]='str';return complete(build);}
const abilities=d=>[...d.activeAbilities,...d.passiveAbilities];
test('base Red Mage and all eighteen archetypes create, advance through twenty and preserve unique ownership',()=>{
 assert.equal(redMageArchetypes.length,18);
 for(const arch of ['',...redMageArchetypes.map(a=>a.id)]){
  let d;try{d=compileBuild(fixture(arch));for(let level=2;level<=20;level++){d=levelUpBuild(advance(d),d);assert.equal(d.level,level);const ids=d.rulesBuild.ownedIds;assert.equal(new Set(ids).size,ids.length);}}
  catch(error){throw new Error((arch||'base')+' failed at '+d?.level+': '+error.message,{cause:error});}
  assert.equal(d.archetype,redMageArchetypes.find(a=>a.id===arch)?.name||'');assert.equal(d.mp_class,redMageHasSpells(d.rulesBuild.input)?arch.endsWith(':animist')?58:79:0);
  assert.equal(d.hp_max,['mystic-knight','red-warrior'].some(n=>arch.endsWith(':'+n))?124:103);
  assert.equal(d.bab,['mystic-knight','red-warrior'].some(n=>arch.endsWith(':'+n))?20:15);
  assert.equal(compileBuild(JSON.parse(JSON.stringify(d.rulesBuild.input)),JSON.parse(JSON.stringify(d))).level,20);
 }
});
test('archetype replacements remove parent cards and only the specified choice slots',()=>{
 const b=fixture('ffd20:archetype:red-mage:ruby-archer'),view=previewBuild(b);assert(!view.features.some(f=>f.id===ID+':feature:spell-combat'));assert(view.features.some(f=>f.name==='Ranged Spell Combat'));assert(!choiceEvents(b).some(e=>e.id===ID+':event:red-magery:1'));
 let d=compileBuild(b);for(let level=2;level<=9;level++)d=levelUpBuild(advance(d),d);const events=choiceEvents(d.rulesBuild.input);assert(events.some(e=>e.id===ID+':event:ruby-arcana:3'));assert(events.some(e=>e.id===ID+':event:ruby-arcana:6'));assert(!events.some(e=>e.id===ID+':event:ruby-arcana:9'));
 const first=fixture('ffd20:archetype:red-mage:outfitter'),lbs=previewBuild(first).features.filter(f=>f.featureKind==='limit_break');assert.equal(lbs.length,2);assert(lbs.some(f=>f.name==='Illuminated Runway'));
});
test('noncasting archetypes use their actual chassis, skip the spell wizard and retain counters without MP',()=>{
 for(const name of ['mystic-knight','red-warrior','reserve-mage']){const b=fixture('ffd20:archetype:red-mage:'+name),d=compileBuild(b);assert.equal(d.spells.length,0);assert.equal(d.mp_class,0);assert.equal(d.mp_bonus,0);assert.equal(d.castingProfiles.length,0);assert(!wizardOrder(b).includes(5));assert(!previewBuild(b).features.some(f=>f.id===ID+':feature:spells'));assert(abilities(d).some(f=>f.u_max>0));}
});
test('spell picker follows Red Mage table rather than full-caster levels and previous spells remain protected',()=>{
 let d=compileBuild(fixture());for(let l=2;l<=5;l++)d=levelUpBuild(advance(d),d);assert.equal(previewBuild(d.rulesBuild.input).summary.spellLevel,2);assert.equal(spellCounts(d.rulesBuild.input).cantrips,3);
 const html=renderBuild(d.rulesBuild.input,5);assert.doesNotMatch(html,/Spell 3rd level/);
 const forged=advance(d);forged.spellSelections.leveled[0]='ffd20:spell:curaga';forged.spellIds=[...forged.spellSelections.cantrips,...forged.spellSelections.leveled];assert.throws(()=>levelUpBuild(forged,d));
});
test('all replacement targets are canonical, event-specific replacement metadata is valid and source provenance is retained',()=>{
 const features=new Set(redMageClass.features.map(f=>f.id)),events=new Set(redMageClass.data.events.map(e=>e.id));
 for(const a of redMageArchetypes){assert.equal(a.sources[0].archiveSha256.length,64);for(const op of a.data.replacements){assert(op.targetFeatureIds.every(id=>features.has(id)));assert((op.targetEventIds||[]).every(id=>events.has(id)));}const result=familyReplacementState(redMageClass,a,20,{});assert(result.removedFeatures instanceof Set);}
});

test('every Red Mage path persists nineteen route level-ups and survives SQLite close/reopen',async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),{randomUUID}=await import('node:crypto'),{Readable}=await import('node:stream');
 const {openDatabase}=await import('../backend/db/database.mjs'),{createUserRepository}=await import('../backend/repositories/users.mjs'),{createCharacterLibraryService}=await import('../backend/characters/library.mjs'),{createDirectoryRoutes}=await import('../backend/characters/directory.mjs');
 const dir=await mkdtemp(join(tmpdir(),'red-family-'));let db=await openDatabase(join(dir,'family.sqlite'));const saved=[];
 try{
  const owner=createUserRepository(db).create({displayName:'Family fixture'}),sessions={restore:async()=>({user:owner,identity:{providerUid:'fixture-only'}})},origin='https://local.fixture';
  for(const arch of ['',...redMageArchetypes.map(a=>a.id)]){
   let c=createCharacterLibraryService(db).createBuild(owner.id,{build:fixture(arch),requestId:randomUUID()}),data=c.data,revision=c.revision;
   for(let level=2;level<=20;level++){
    const request={op:'wizard-level-up',revision,build:advance(data)},req=Readable.from([Buffer.from(JSON.stringify(request))]);req.method='POST';req.url='/api/v1/character-records/'+c.id;req.headers={origin,'content-type':'application/json',cookie:'__Host-comos_session=fixture'};let response;
    await createDirectoryRoutes({db,sessions,adminUids:[],origin})(req,{},req.url,(status,payload)=>response={status,payload});assert.equal(response.status,200,(arch||'base')+' level '+level+': '+response.payload.message);data=response.payload.character.data;revision=response.payload.character.revision;
   }
   saved.push(c.id);
  }
  db.close();db=await openDatabase(join(dir,'family.sqlite'));
  for(const id of saved){const d=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id).data_json);assert.equal(d.level,20);assert.equal(compileBuild(d.rulesBuild.input,d).archetype,d.archetype);}
  assert.equal(saved.length,19);
 }finally{db.close();await rm(dir,{recursive:true,force:true});}
});

test('Ishgardian Heretic requires its existing racial trait, without new prerequisite fields',()=>{const valid=fixture('ffd20:archetype:red-mage:ishgardian-heretic');assert(!buildIssues(valid).some(i=>/requires the Elemental Resistance/.test(i.message)));valid.raceId='ffd20:race:moogle';assert(buildIssues(valid).some(i=>/requires the Elemental Resistance/.test(i.message)));});

test('archetype display names match their archived source titles',()=>{for(const a of redMageArchetypes){assert.equal(a.name,a.sources[0].title);assert(!/^[a-z]+$/.test(a.name));}});

test('native option level prerequisites recognize Red Mage Level phrasing',()=>{const a=redMageArchetypes.find(a=>a.id.endsWith(':animist'));const o=a.data.choicePools.flatMap(p=>p.options).find(o=>o.name==='Ablative Shielding');assert.equal(o.minimumLevel,9);const b=fixture(a.id);b.level=2;const e=choiceEvents(b).find(e=>e.atClassLevel===2);assert(!eligibleOptions(b,e).some(x=>x.id===o.id));});

test('Outfitter replacement selection is a reference choice, not an extra Limit Break',async()=>{const {isLimitBreak}=await import('../src/features/sheet/limit-breaks.mjs');const d=compileBuild(fixture('ffd20:archetype:red-mage:outfitter'));assert.equal(abilities(d).filter(isLimitBreak).length,2);});

test('archetype amendments share one canonical named parent card',()=>{for(const name of ['mystic-knight','ruby-archer']){const b=fixture('ffd20:archetype:red-mage:'+name);b.level=2;const f=previewBuild(b).features;assert.equal(f.filter(x=>x.name==='Red Magery').length,1);assert.equal(f.filter(x=>x.name==='Ruby Talents').length,1);assert(f.some(x=>x.description.includes('Archetype changes:')));}});
