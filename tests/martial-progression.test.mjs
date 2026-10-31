import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {Readable} from 'node:stream';
import {newBuild,previewBuild,compileBuild,levelUpBuild,choiceEvents,eligibleOptions,buildIssues,classSkill} from '../src/features/characters/rules/build.mjs';
import {classDefaultHp} from '../src/features/characters/rules/class-adapters.mjs';
import {martialChoicePools,AKIMBO_ID,DOOM_SLAYER_ID,GUNBREAKER_ID} from '../src/features/characters/rules/martial-progression.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createCharacterLibraryService} from '../backend/characters/library.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createDirectoryRoutes} from '../backend/characters/directory.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderBuild,wizardOrder} from '../src/ui/rules-wizard.mjs';
const CK='ffd20:class:chocobo-knight',DANCER='ffd20:class:dancer',MOG='ffd20:archetype:chocobo-knight:mog-knight';
const combinations=[[CK,'','galka'],[CK,MOG,'moogle'],[DANCER,'','immortal'],[DANCER,AKIMBO_ID,'immortal'],[GUNBREAKER_ID,'','galka'],[GUNBREAKER_ID,DOOM_SLAYER_ID,'galka']];
function complete(b){
 for(const event of choiceEvents(b))if(!b.choices[event.id]){const o=eligibleOptions(b,event)[0];assert(o,'eligible option '+event.id);b.choices[event.id]=[o.id];}
 let ranks=previewBuild(b).skillBudget;b.skillRanks??=fixedSkills.map(()=>0);ranks-=b.skillRanks.reduce((n,r)=>n+r,0);
 for(let i=0;i<b.skillRanks.length;i++){const n=Math.min(b.level-b.skillRanks[i],ranks);b.skillRanks[i]+=n;ranks-=n;}assert.equal(ranks,0);b.reviewed=true;return b;
}
function fixture([classId,archetypeId,race]){
 const b=newBuild();Object.assign(b,{name:'Progression '+(archetypeId||classId),classId,archetypeId,raceId:'ffd20:race:'+race,hpRolls:[classId===DANCER?8:10]});
 if(race==='immortal'){const id='ffd20:race:immortal:pool:flexible-score';b.racialChoices[id]=[id+':option:charisma'];}
 if(race==='moogle'){const id='ffd20:race:moogle:pool:moogle-handy-craft-or-profession';b.racialChoices[id]=['skill-row:4'];b.racialSpecialties[id]='Woodworking';}
 return complete(b);
}
function advance(d){const b=structuredClone(d.rulesBuild.input);b.level++;b.hpRolls.push(classDefaultHp(b));if(b.level%4===0)b.abilityIncreases[b.level]='str';return complete(b);}
const abilities=d=>[...d.activeAbilities,...d.passiveAbilities];
for(const combo of combinations)test('source progression 1–20, owned cards and resource preservation: '+(combo[1]||combo[0]),()=>{
 let d=compileBuild(fixture(combo));d.items.push({name:'Manual item'});d.hp_curr=2;
 for(let level=1;level<=20;level++){
  if(level>1)d=levelUpBuild(advance(d),d);
  assert.equal(d.level,level);assert.equal(d.mp_class,0);assert.equal(d.mp_bonus,0);assert.equal(d.hp_curr,2);
  const p=previewBuild(d.rulesBuild.input);assert.deepEqual([d.bab,d.fort_base,d.ref_base,d.will_base],[p.summary.bab,p.summary.fort,p.summary.ref,p.summary.will]);
  const ids=abilities(d).filter(f=>f.rulesOwned).map(f=>f.sourceRuleId);assert.equal(ids.length,new Set(ids).size);
  assert(d.items.some(x=>x.name==='Manual item'));assert(!wizardOrder(d.rulesBuild.input).includes(5));
  const repeat=compileBuild(d.rulesBuild.input,d);assert.deepEqual(repeat.rulesBuild.input.choices,d.rulesBuild.input.choices);assert.equal(repeat.hp_max,d.hp_max);
 }
 assert.equal(d.rulesBuild.input.skillRanks.reduce((n,r)=>n+r,0),80);
 const names=abilities(d).map(f=>f.name);
 if(combo[1]===MOG){assert(names.includes('Ultima Charge'));for(const n of ['Challenge','Supreme Overrun','Expert Trainer','Mounted Mettle','Burst of Speed','Supreme Charge'])assert(!names.includes(n),n);}
 if(combo[1]===DOOM_SLAYER_ID){assert(names.includes('Rip and Tear'));for(const n of ['Aurora','Gunsmith','Gun Arm Mastery','Royal Guard','Lion Heart'])assert(!names.includes(n),n);}
 if(combo[1]===AKIMBO_ID){assert(names.includes('Akimbo’s Equilibrium'));for(const n of ['Unarmed Strike','Battle Dance','Ki Pool','Dance Talents','Fleet','AC Bonus','Battle Fury'])assert(!names.includes(n),n);assert(!d.feats.some(f=>f.name==='Improved Unarmed Strike'));}
});

test('Doom Slayer skills and Akimbo proficiencies/feats replace the parent entitlement',()=>{
 const b=fixture(combinations[5]);assert(classSkill(b,'skill:survival'));assert(classSkill(b,'skill:knowledge-planes'));assert(!classSkill(b,'skill:heal'));assert(!classSkill(b,'skill:knowledge-nobility'));
 const a=compileBuild(fixture(combinations[3]));assert.match(a.proficiencies,/Pistol firearms/);assert.doesNotMatch(a.proficiencies,/monk|scarves/);assert(a.feats.some(f=>f.name==='Precise Shot'));assert(a.feats.some(f=>f.name==='Gunsmithing'));assert(!a.feats.some(f=>f.name==='Improved Unarmed Strike'));
 assert(abilities(a).some(f=>f.name==='Flair'&&f.u_max===1));
});
test('forged advancement cannot change earlier choices, ancestry, class or level and new choices must be eligible at acquisition',()=>{
 const d=compileBuild(fixture(combinations[4])),b=advance(d);
 for(const mutate of [x=>x.level=3,x=>x.raceId='ffd20:race:immortal',x=>x.classId=DANCER,x=>x.baseScores.str=20,x=>x.hpRolls[0]=1,x=>x.choices[d.rulesBuild.input.classId+':event:starting-gun-arm:1']=['invented']]){const forged=structuredClone(b);mutate(forged);assert.throws(()=>levelUpBuild(forged,d));}
 assert.throws(()=>compileBuild(b,d),/Use Level up/);
 const event=choiceEvents(b).find(e=>e.atClassLevel===2),pool=martialChoicePools(b).find(p=>event.poolIds.includes(p.id));
 const advanced=pool.options.find(o=>o.minimumLevel>=12);assert(advanced);b.choices[event.id]=[advanced.id];assert.throws(()=>levelUpBuild(b,d),/valid/);
 const immortal=fixture(combinations[2]);immortal.archetypeId=MOG;assert.throws(()=>compileBuild(immortal),/Mog Knight requires/);
});
test('resource maximums scale without refilling spent points or applying conditional combat bonuses',()=>{
 for(const combo of [combinations[0],combinations[2],combinations[3],combinations[4]]){
  let d=compileBuild(fixture(combo));const r=d.activeAbilities.find(f=>f.u_max>0&&!f.limitBreak);assert(r);r.u_curr=0;
  const next=levelUpBuild(advance(d),d),after=next.activeAbilities.find(f=>f.sourceRuleId===r.sourceRuleId);assert.equal(after.u_max-after.u_curr,r.u_max);
  const updated=mergeSheetData(next,{action:'fields',fields:{cha:16,wis:16}});assert.equal(updated.hp_curr,next.hp_curr);assert.equal(updated.mp_bonus,0);
  assert.equal(updated.ac_temp,undefined);assert.equal(updated.speed,d.speed);
 }
});
test('SQLite creation, authenticated route leveling, real database close/reopen and stale/forged requests',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'comos-martials-'));let db=await openDatabase(join(dir,'characters.sqlite'));
 try{
  const owner=createUserRepository(db).create({displayName:'Progression owner'}),ids=[];
  const sessions={restore:async()=>({user:{id:owner.id},identity:{providerUid:'fixture'}})};
  const origin='https://local.fixture';
  async function post(id,body){const req=Readable.from([Buffer.from(JSON.stringify(body))]);req.method='POST';req.url='/api/v1/character-records/'+id;req.headers={origin,'content-type':'application/json',cookie:'__Host-comos_session=fixture'};let response;
   await createDirectoryRoutes({db,sessions,adminUids:[],origin})(req,{},req.url,(status,payload)=>response={status,payload});return response;}
  for(const combo of combinations){
   const c=createCharacterLibraryService(db).createBuild(owner.id,{build:fixture(combo),requestId:randomUUID()});ids.push(c.id);let data=c.data,revision=c.revision;
   for(let level=2;level<=20;level++){const result=await post(c.id,{op:'wizard-level-up',revision,build:advance(data)});assert.equal(result.status,200,result.payload?.message);data=result.payload.character.data;revision=result.payload.character.revision;}
   const stale=await post(c.id,{op:'wizard-level-up',revision:0,build:data.rulesBuild.input});assert.notEqual(stale.status,200);
   const forged=structuredClone(data.rulesBuild.input);forged.level=19;const result=await post(c.id,{op:'wizard-build',revision,build:forged});assert.notEqual(result.status,200);
  }
  db.close();db=await openDatabase(join(dir,'characters.sqlite'));
  for(const id of ids){const data=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id).data_json);assert.equal(data.level,20);assert.deepEqual(buildIssues(data.rulesBuild.input),[]);assert.equal(compileBuild(data.rulesBuild.input,data).level,20);}
 }finally{db.close();await rm(dir,{recursive:true,force:true});}
});

test('level-20 source values, milestone bonuses and requested racial compatibility are independent of preview totals',()=>{
 for(const combo of combinations){
  const first=compileBuild(fixture(combo));let d=first;for(let l=2;l<=20;l++)d=levelUpBuild(advance(d),d);
  assert.deepEqual([d.bab,d.fort_base,d.ref_base,d.will_base],combo[0]===DANCER?[15,12,12,6]:combo[0]===CK?[20,12,6,6]:[20,12,12,6]);
  assert.equal(d.hp_max,combo[0]===DANCER?103:124);
  assert.equal(d.str,first.str+5+(combo[1]===DOOM_SLAYER_ID?2:0));
  assert.equal(d.dex,first.dex+(combo[1]===DOOM_SLAYER_ID?2:0));
  const resource=abilities(d).find(f=>['Commander’s Aura','Battle Dance','Flair'].includes(f.name));
  if(resource)assert.equal(resource.u_max,combo[1]===AKIMBO_ID?20:42+Math.floor((d.cha-10)/2));
  if(combo[1]===DOOM_SLAYER_ID)assert.equal(d.wis,first.wis+2);
 }
 for(const race of ['moogle','galka','immortal'])for(const [cls,arch] of [[CK,''],[DANCER,''],[DANCER,AKIMBO_ID],[GUNBREAKER_ID,''],[GUNBREAKER_ID,DOOM_SLAYER_ID]]){
  let d=compileBuild(fixture([cls,arch,race]));for(let level=2;level<=20;level++)d=levelUpBuild(advance(d),d);assert.equal(d.race,race==='moogle'?'Moogle':race==='galka'?'Galka':'Immortal');
 }
});

test('old Gunbreaker talent IDs and manually recorded starting equipment remain editable and levelable',()=>{
 const b=fixture(combinations[4]);delete b.choices[GUNBREAKER_ID+':event:starting-gun-arm:1'];
 let d=compileBuild(b);const next=advance(d),event=choiceEvents(next).find(e=>e.atClassLevel===2);
 assert.equal(event.id,GUNBREAKER_ID+':event:talent:2');next.choices[event.id]=[GUNBREAKER_ID+':talent:ranged-combat-training'];
 d=levelUpBuild(next,d);assert(d.feats.some(f=>f.name==='Precise Shot'));assert.equal(compileBuild(d.rulesBuild.input,d).level,2);
 const forged=structuredClone(d.rulesBuild.input);forged.archetypeId=DOOM_SLAYER_ID;assert.throws(()=>compileBuild(forged,d),/archetypes/);
});
