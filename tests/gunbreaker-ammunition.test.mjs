import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Readable} from 'node:stream';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {newBuild,compileBuild,previewBuild,choiceEvents,eligibleOptions,levelUpBuild} from '../src/features/characters/rules/build.mjs';
import {GUNBREAKER_ID,DOOM_SLAYER_ID} from '../src/features/characters/rules/martial-progression.mjs';
import {gunbreakerAmmoProfiles,gunbreakerAmmoSummary,MAGICKED_AMMO_ID} from '../src/features/characters/rules/gunbreaker-ammo.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderGunbreakerAmmo} from '../src/features/sheet/gunbreaker-ammo-view.mjs';
import {renderSection} from '../src/features/sheet/view.mjs';
import {formatRoll} from '../src/ui/sheet.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharacterLibraryService} from '../backend/characters/library.mjs';
import {createDirectoryRoutes} from '../backend/characters/directory.mjs';
import {publishRoll} from '../backend/characters/rolls.mjs';
function complete(b){
 for(let n=0;n<100;n++){const event=choiceEvents(b).find(e=>!b.choices[e.id]);if(!event)break;const option=eligibleOptions(b,event)[0];assert(option);b.choices[event.id]=[option.id];}
 let remaining=previewBuild(b).skillBudget;b.skillRanks=fixedSkills.map(()=>{const rank=Math.min(b.level,remaining);remaining-=rank;return rank;});assert.equal(remaining,0);b.reviewed=true;return b;
}
function build(level=1,doom=false){const b=newBuild();Object.assign(b,{name:'Ammunition fixture',raceId:'ffd20:race:galka',classId:GUNBREAKER_ID,archetypeId:doom?DOOM_SLAYER_ID:'',level,hpRolls:[10,...Array(level-1).fill(6)]});for(let l=4;l<=level;l+=4)b.abilityIncreases[l]='str';return complete(b);}
const fixture=(level=1,doom=false)=>compileBuild(build(level,doom));
const change=(d,operation,extra={})=>mergeSheetData(d,{action:'gunbreakerAmmo',operation,...extra});
const profile=(d,name)=>gunbreakerAmmoProfiles(d).find(p=>p.name===name);
const configure=(d,name)=>change(d,'configure',{profileId:profile(d,name).id});
const ammo=d=>d.activeAbilities.find(r=>r.sourceRuleId===MAGICKED_AMMO_ID);

test('source capacities and Doom Slayer level gates are exact, without guessing a legacy weapon',()=>{
 const original=fixture();assert.equal(original.gunbreakerAmmo,undefined);assert.equal(ammo(original).u_max,3);
 const caps=Object.fromEntries(gunbreakerAmmoProfiles(original).map(p=>[p.name,p.capacity]));assert.deepEqual(caps,{'Gunblade (Standard)':6,'Gunblade (Assault)':30,'Gunblade (Double)':15,'Gunblade (Light)':6,'Gunblade (Magitek)':20,Gunaxe:2,Gunbaghnakh:8,Gunhalberd:15,Gunhammer:6,Gunknife:6,Gunlance:10,Guntana:6,Gunshield:6});
 assert.equal(gunbreakerAmmoProfiles(fixture(1,true)).length,3);assert.equal(gunbreakerAmmoProfiles(fixture(5,true)).length,4);assert.equal(gunbreakerAmmoProfiles(fixture(10,true)).length,5);assert(!gunbreakerAmmoProfiles(fixture(20,true)).some(p=>/BFG/.test(p.name)));
 const bfg=DOOM_SLAYER_ID+':ammo-profile:bfg';assert.throws(()=>change(fixture(20,true),'configure',{profileId:bfg}));
 const rocket=DOOM_SLAYER_ID+':ammo-profile:rocket-launcher';assert.throws(()=>change(fixture(9,true),'configure',{profileId:rocket}));
 assert.equal(gunbreakerAmmoSummary(configure(fixture(10,true),'Doom Gun Arm — Rocket Launcher')).maximum,1);
});
test('configuration is explicit and empty; reload, infused-first shots, infusion and costs share one magazine',()=>{
 let d=fixture();d.items.push({name:'Manual ammo supply',amount:45});d.hp_curr=2;d.activeAbilities.find(r=>r.name==='Aurora').u_curr=0;
 d=configure(d,'Gunblade (Standard)');assert.deepEqual([ammo(d).u_curr,ammo(d).u_max],[0,3]);
 d=change(d,'reload',{rounds:6});assert.deepEqual([d.gunbreakerAmmo.loaded,d.gunbreakerAmmo.infused],[6,3]);
 d=change(d,'fire',{rounds:2});assert.deepEqual([d.gunbreakerAmmo.loaded,d.gunbreakerAmmo.infused],[4,1]);
 d=change(d,'infuse');assert.deepEqual([d.gunbreakerAmmo.loaded,d.gunbreakerAmmo.infused],[4,3]);
 d=change(d,'blast-shield');assert.deepEqual([d.gunbreakerAmmo.loaded,d.gunbreakerAmmo.infused],[2,1]);
 d=change(d,'brutal-shell',{rounds:1});assert.deepEqual([d.gunbreakerAmmo.loaded,d.gunbreakerAmmo.infused],[1,0]);
 assert.equal(d.hp_curr,2);assert.equal(d.activeAbilities.find(r=>r.name==='Aurora').u_curr,0);assert.deepEqual(d.items.at(-1),{name:'Manual ammo supply',amount:45});assert.equal(d.ac_deflect,undefined);assert.equal(d.hp_temp,undefined);
 assert.throws(()=>change(d,'blast-shield'),/Not enough infused/);assert.throws(()=>change(d,'fire',{rounds:2}),/Not enough loaded/);
 assert.throws(()=>configure(d,'Gunaxe'),/Clear and reconcile/);d=change(d,'clear');d=configure(d,'Gunaxe');assert.equal(ammo(d).u_max,2);assert.equal(ammo(d).u_curr,0);
});
test('level 19–20 uses actual capacity and leveling/edits/rests never refill tracked rounds',()=>{
 for(const level of [18,19,20]){let d=configure(fixture(level),'Gunblade (Assault)');d=change(d,'reload');assert.equal(ammo(d).u_max,level===18?19:30);assert.equal(ammo(d).u_curr,level===18?19:30);}
 let d=change(configure(fixture(18),'Gunblade (Assault)'),'reload');d=change(d,'fire',{rounds:5});const before=structuredClone(d.gunbreakerAmmo);ammo(d).name='My cartridge tracker';ammo(d).desc='Manual note';
 const b=build(19);b.choices=structuredClone(d.rulesBuild.input.choices);complete(b);d=levelUpBuild(b,d);assert.deepEqual(d.gunbreakerAmmo,before);assert.equal(ammo(d).u_max,30);assert.equal(ammo(d).u_curr,14);assert.equal(ammo(d).name,'My cartridge tracker');assert.equal(ammo(d).desc,'Manual note');
 d=compileBuild(d.rulesBuild.input,d);assert.deepEqual(d.gunbreakerAmmo,before);
 d=mergeSheetData(d,{action:'fields',fields:{wis:18,con:14}});assert.deepEqual(d.gunbreakerAmmo,before);assert.equal(ammo(d).u_max,30);
 d=mergeSheetData(d,{action:'rest'});assert.deepEqual(d.gunbreakerAmmo,before);assert.equal(ammo(d).u_curr,14);
 d=change(d,'infuse');assert.deepEqual([d.gunbreakerAmmo.loaded,d.gunbreakerAmmo.infused],[25,25]);
});
test('forged capacities, counts, tier costs and direct counter edits are rejected atomically',()=>{
 const d=change(configure(fixture(),'Gunblade (Standard)'),'reload');const snapshot=structuredClone(d);
 for(const action of [{operation:'configure',profileId:profile(d,'Gunaxe').id,capacity:1000},{operation:'reload',rounds:7},{operation:'reload',rounds:1.5},{operation:'reload',rounds:'6'},{operation:'infuse',rounds:100},{operation:'fire',rounds:-1},{operation:'spend',rounds:4},{operation:'brutal-shell',rounds:2},{operation:'blast-shield',rounds:1}])assert.throws(()=>mergeSheetData(d,{action:'gunbreakerAmmo',...action}));
 const index=d.activeAbilities.findIndex(r=>r.sourceRuleId===MAGICKED_AMMO_ID);
 for(const fields of [{u_curr:3},{u_max:100},{uses_formula:'100'},{restoreOnLongRest:true}])assert.throws(()=>mergeSheetData(d,{action:'entry',mode:'update',collection:'activeAbilities',index,fields}),/ammunition tracker/);
 assert.deepEqual(d,snapshot);
 for(const [level,maximum]of [[1,1],[5,1],[6,2],[10,2],[11,3],[15,3],[16,4],[20,4]]){let tier=change(configure(fixture(level),'Gunblade (Standard)'),'reload');assert.equal(gunbreakerAmmoSummary(tier).brutalShellMaximum,maximum);assert.throws(()=>change(tier,'brutal-shell',{rounds:maximum+1}),/Brutal Shell/);tier=change(tier,'brutal-shell',{rounds:maximum});assert.equal(tier.gunbreakerAmmo.loaded,6-maximum);}
 const wrong=fixture();wrong.rulesBuild.input.classId='ffd20:class:dancer';assert.throws(()=>change(wrong,'configure',{profileId:profile(d,'Gunaxe').id}));
});
test('sheet controls expose the selected capacity, tracker actions and manual boundaries',()=>{
 const plain=fixture();assert.match(renderGunbreakerAmmo(plain),/data-ammo-profile/);assert.match(renderGunbreakerAmmo(plain),/Configuration starts empty/);
 const d=change(configure(fixture(19,true),'Doom Gun Arm — Chaingun'),'reload');const panel=renderGunbreakerAmmo(d);assert.match(panel,/30 \/ 30/);assert.match(panel,/Level 19\+/);for(const op of ['configure','reload','infuse','fire','blast-shield','brutal-shell','clear'])assert(panel.includes('data-ammo-operation="'+op+'"'));
 assert.match(renderSection({data:d},'abilities'),/Gun arm ammunition/);assert.match(renderSection({data:d},'combat',{combatView:'offense'}),/Gun arm ammunition/);
 assert.match(formatRoll('Blast Shield',{kind:'ability',abilityName:'Blast Shield',descriptionOnly:true,remainingInfusedAmmo:1,description:'Shield'}),/1 infused rounds remaining/);
});
test('SQLite routes preserve magazines on reopen and reject stale or forged changes without spending',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'comos-ammo-'));let db=await openDatabase(join(dir,'characters.sqlite'));
 try{
  const owner=createUserRepository(db).create({displayName:'Ammo owner'}),created=createCharacterLibraryService(db).createBuild(owner.id,{build:build(1,true),requestId:randomUUID()}),origin='https://fixture.local';let revision=created.revision,data=created.data;
  async function post(action,rev=revision){const req=Readable.from([Buffer.from(JSON.stringify({op:'sheet',revision:rev,action:'gunbreakerAmmo',...action}))]);req.url='/api/v1/character-records/'+created.id;req.method='POST';req.headers={origin,'content-type':'application/json',cookie:'__Host-comos_session=fixture'};let result;await createDirectoryRoutes({db,origin,adminUids:[],sessions:{restore:async()=>({user:{id:owner.id}})}})(req,{},req.url,(status,payload)=>result={status,payload});return result;}
  for(const action of [{operation:'configure',profileId:profile(data,'Doom Gun Arm — Pistol').id},{operation:'reload',rounds:6},{operation:'fire',rounds:1}]){const result=await post(action);assert.equal(result.status,200,result.payload.message);data=result.payload.character.data;revision=result.payload.character.revision;}
  const before=structuredClone(data.gunbreakerAmmo);assert.equal((await post({operation:'reload',rounds:99})).status,400);assert.equal((await post({operation:'fire',rounds:1},0)).status,409);assert.equal(db.prepare('SELECT revision FROM characters WHERE id=?').get(created.id).revision,revision);
  db.close();db=await openDatabase(join(dir,'characters.sqlite'));const stored=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(created.id).data_json);assert.deepEqual(stored.gunbreakerAmmo,before);assert.equal(ammo(compileBuild(stored.rulesBuild.input,stored)).u_curr,2);
 }finally{db.close();await rm(dir,{recursive:true,force:true});}
});
test('ability-use receipts spend shared infused ammo exactly once; description sends spend none',async()=>{
 const db=await openDatabase(':memory:');try{
  const owner=createUserRepository(db).create({displayName:'Ammo rolls'}),created=createCharacterLibraryService(db).createBuild(owner.id,{build:build(),requestId:randomUUID()});let data=change(configure(created.data,'Gunblade (Standard)'),'reload');db.prepare('UPDATE character_details SET data_json=? WHERE character_id=?').run(JSON.stringify(data),created.id);
  const get=()=>({id:created.id,name:created.name,revision:db.prepare('SELECT revision FROM characters WHERE id=?').get(created.id).revision,data:JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(created.id).data_json)});
  const index=data.activeAbilities.findIndex(r=>r.sourceRuleId===GUNBREAKER_ID+':feature:blast-shield');assert(index>=0);
  const args={db,userId:owner.id,character:get(),origin:'https://fixture.local',change:{kind:'ability',collection:'activeAbilities',mode:'use',spendUse:true,index,requestId:randomUUID(),discord:false,revision:get().revision},sendFetch:async()=>{throw Error('No network send expected');}};
  const result=await publishRoll(args);assert.equal(result.roll.remainingInfusedAmmo,1);assert.equal(get().data.gunbreakerAmmo.loaded,4);assert.equal(get().data.gunbreakerAmmo.infused,1);assert.deepEqual(await publishRoll(args),result);assert.equal(get().data.gunbreakerAmmo.infused,1);
  db.prepare('UPDATE sheet_rolls SET created_at=0').run();const send=await publishRoll({...args,character:get(),change:{...args.change,mode:'send',spendUse:false,requestId:randomUUID(),revision:get().revision}});assert.equal(send.roll.remainingInfusedAmmo,undefined);assert.equal(get().data.gunbreakerAmmo.infused,1);
  db.prepare('UPDATE sheet_rolls SET created_at=0').run();const before=get().revision;await assert.rejects(()=>publishRoll({...args,character:get(),change:{...args.change,requestId:randomUUID(),revision:before}}),/Not enough infused/);assert.equal(get().revision,before);
  const brutal=get().data.activeAbilities.findIndex(r=>r.sourceRuleId===GUNBREAKER_ID+':feature:brutal-shell');assert(brutal>=0);const shell=await publishRoll({...args,character:get(),change:{...args.change,index:brutal,requestId:randomUUID(),revision:before}});assert.equal(shell.roll.remainingInfusedAmmo,0);assert.equal(get().data.gunbreakerAmmo.loaded,3);
 }finally{db.close();}
});
