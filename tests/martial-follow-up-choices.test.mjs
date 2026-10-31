import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {randomUUID} from 'node:crypto';
import {newBuild,choiceEvents,eligibleOptions,compileBuild,previewBuild,levelUpBuild} from '../src/features/characters/rules/build.mjs';
import {martialChoicePools,selectMartialChoice,AKIMBO_ID,GUNBREAKER_ID,DOOM_SLAYER_ID} from '../src/features/characters/rules/martial-progression.mjs';
import {choicePickerOptions,renderBuild} from '../src/ui/rules-wizard.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharacterLibraryService} from '../backend/characters/library.mjs';
import {createDirectoryRoutes} from '../backend/characters/directory.mjs';
const DANCER='ffd20:class:dancer',DT=DANCER+':pool:talents:option:';
function complete(b,preferred={}){
 for(let count=0;count<100;count++){
  const e=choiceEvents(b).find(e=>!b.choices[e.id]);if(!e)break;
  const options=eligibleOptions(b,e),o=options.find(o=>o.name===preferred[e.id])||options[0];assert(o,'eligible option for '+e.id);
  selectMartialChoice(b,e.id,o.id);
 }
 let remaining=previewBuild(b).skillBudget-(b.skillRanks||[]).reduce((n,r)=>n+r,0);b.skillRanks??=fixedSkills.map(()=>0);
 for(let i=0;i<b.skillRanks.length;i++){const n=Math.min(b.level-b.skillRanks[i],remaining);b.skillRanks[i]+=n;remaining-=n;}assert.equal(remaining,0);b.reviewed=true;return b;
}
function fixture(classId=DANCER,archetypeId=''){
 const b=newBuild();Object.assign(b,{name:'Follow-up fixture',classId,archetypeId,raceId:'ffd20:race:galka',hpRolls:[classId===DANCER?8:10]});b.baseScores.cha=16;b.baseScores.wis=14;return complete(b);
}
function next(d,preferred={}){const b=structuredClone(d.rulesBuild.input);b.level++;b.hpRolls.push(b.classId===DANCER?5:6);if(b.level%4===0)b.abilityIncreases[b.level]='str';return complete(b,preferred);}
function reach(level,classId=DANCER,archetypeId='',preferred={}){let d=compileBuild(fixture(classId,archetypeId));for(let l=2;l<=level;l++)d=levelUpBuild(next(d,preferred),d);return d;}
const rows=d=>[...d.activeAbilities,...d.passiveAbilities];
const talent=(cls,l)=>cls+':event:'+(cls===GUNBREAKER_ID?'talent':'talents')+':'+l;
const row=(d,name)=>rows(d).find(r=>r.name===name);

test('Mystic Dance talent requires, displays, saves and grants its extra selection for Dancer and Akimbo',()=>{
 for(const archetype of ['',AKIMBO_ID]){
  const primary=talent(archetype||DANCER,4),old=reach(3,DANCER,archetype),b=next(old,{[primary]:'Mystic Dance'});
  const child=choiceEvents(b).find(e=>e.parentEventId===primary);assert(child);assert.equal(child.atClassLevel,4);
  assert.match(renderBuild(b,4,{mode:'levelup',baseline:old.rulesBuild.input}),new RegExp('data-rw-open-choice="'+child.id+'"'));
  const selected=b.choices[child.id][0],option=martialChoicePools(b).flatMap(p=>p.options).find(o=>o.id===selected),saved=levelUpBuild(b,old);
  assert.equal(rows(saved).filter(r=>r.sourceRuleId===selected).length,1);assert(row(saved,option.name));
  const missing=structuredClone(b);delete missing.choices[child.id];assert.throws(()=>levelUpBuild(missing,old),/valid Mystic dance/);
  assert.equal(compileBuild(saved.rulesBuild.input,saved).rulesBuild.input.choices[child.id][0],selected);
  const changed=structuredClone(b),replacement=eligibleOptions(changed,choiceEvents(changed).find(e=>e.id===primary)).find(o=>o.name==='Born Leader');
  selectMartialChoice(changed,primary,replacement.id);assert(!changed.choices[child.id]);
  const forged=structuredClone(changed);forged.choices[child.id]=[selected];assert.throws(()=>compileBuild(forged),/Invalid choice/);
 }
});
test('same-level normal and bonus dance slots cannot choose the same unique dance',()=>{
 const primary=talent(DANCER,6),old=reach(5),b=next(old,{[primary]:'Mystic Dance'});
 const child=choiceEvents(b).find(e=>e.parentEventId===primary),normal=choiceEvents(b).find(e=>e.atClassLevel===6&&e.poolIds[0].endsWith(':mystic-dances')&&!e.parentEventId);
 assert(child&&normal);assert(!eligibleOptions(b,child).some(o=>o.id===b.choices[normal.id][0]));
 b.choices[child.id]=[b.choices[normal.id][0]];assert.throws(()=>levelUpBuild(b,old),/valid Mystic dance/);
});
test('Extra Gun Arm Mastery requires a follow-up and preserves single source identities',()=>{
 const primary=talent(GUNBREAKER_ID,12),old=reach(11,GUNBREAKER_ID),b=next(old,{[primary]:'Extra Gun Arm Mastery'});
 const child=choiceEvents(b).find(e=>e.parentEventId===primary);assert(child);assert.equal(child.poolIds[0],GUNBREAKER_ID+':pool:mastery');
 const id=b.choices[child.id][0],saved=levelUpBuild(b,old);assert.equal(rows(saved).filter(r=>r.sourceRuleId===id).length,1);
 const missing=structuredClone(b);delete missing.choices[child.id];assert.throws(()=>levelUpBuild(missing,old),/valid Gun arm mastery/);
 const doom=reach(12,GUNBREAKER_ID,DOOM_SLAYER_ID);assert(!eligibleOptions(doom.rulesBuild.input,choiceEvents(doom.rulesBuild.input).find(e=>e.id===primary)).some(o=>o.name==='Extra Gun Arm Mastery'));
});
test('source repeat limits work in the actual picker and reject forged sixth Coordinate selections',()=>{
 const preferences=Object.fromEntries([2,4,6,8,10].map(l=>[talent(DANCER,l),'Coordinate'])),d=reach(10,DANCER,'',preferences),b=next(d),c=next(levelUpBuild(b,d));
 const sixth=choiceEvents(c).find(e=>e.id===talent(DANCER,12));
 assert(!eligibleOptions(c,sixth).some(o=>o.id===DT+'coordinate'));assert(!choicePickerOptions(c,sixth).some(o=>o.id===DT+'coordinate'));
 c.choices[sixth.id]=[DT+'coordinate'];assert.throws(()=>compileBuild(c),/valid Dance talent/);
 const first=reach(2,DANCER,'',{[talent(DANCER,2)]:'Coordinate'}),repeat=next(levelUpBuild(next(first),first)),event=choiceEvents(repeat).find(e=>e.id===talent(DANCER,4));
 assert(choicePickerOptions(repeat,event).some(o=>o.id===DT+'coordinate'),'picker must retain a legal repeat');
 const style=martialChoicePools(repeat).flatMap(p=>p.options).find(o=>o.id===DT+'style-feat');assert.equal(style.repeatLimit,3);
});
test('Ki and Aurora talent resource bonuses use the owned pool and preserve expenditure and manual notes',()=>{
 const dancerOld=reach(3),ki=row(dancerOld,'Ki Pool');ki.u_curr=1;dancerOld.hp_curr=2;
 const d=levelUpBuild(next(dancerOld,{[talent(DANCER,4)]:'Increased Ki'}),dancerOld);assert.equal(row(d,'Ki Pool').u_max,6);assert.equal(row(d,'Ki Pool').u_curr,4);assert.equal(d.hp_curr,2);
 const akimboPreferences={[talent(AKIMBO_ID,2)]:'Ki Pool',[talent(AKIMBO_ID,4)]:'Increased Ki',[talent(AKIMBO_ID,12)]:'Improved Ki Pool'};
 const akimbo=reach(12,DANCER,AKIMBO_ID,akimboPreferences);assert.equal(row(akimbo,'Ki Pool').u_max,15);assert.equal(row(akimbo,'Flair').u_max,13);assert.equal(akimbo.mp_class,0);assert.equal(akimbo.mp_bonus,0);
 row(akimbo,'Ki Pool').u_curr=10;const edited=mergeSheetData(akimbo,{action:'fields',fields:{wis:18}});assert.equal(row(edited,'Ki Pool').u_max,16);assert.equal(row(edited,'Ki Pool').u_curr,11);
 const used=mergeSheetData(edited,{action:'useAbility',collection:'activeAbilities',index:edited.activeAbilities.findIndex(r=>r.sourceRuleId===DT+'ki-pool')});assert.equal(row(used,'Ki Pool').u_curr,10);
 const legacy=structuredClone(akimbo),original=legacy.activeAbilities.find(r=>r.sourceRuleId===DT+'ki-pool');legacy.activeAbilities=legacy.activeAbilities.filter(r=>r!==original);original.name='My ki tracker';original.desc='Keep this manual note';legacy.passiveAbilities.push(original);const restored=compileBuild(legacy.rulesBuild.input,legacy).activeAbilities.find(r=>r.sourceRuleId===DT+'ki-pool');assert.equal(restored.name,'My ki tracker');assert.equal(restored.desc,'Keep this manual note');
 const pref={[talent(GUNBREAKER_ID,2)]:'Extra Aurora',[talent(GUNBREAKER_ID,12)]:'Aurora Mastery'};let gun=reach(11,GUNBREAKER_ID,'',pref);row(gun,'Aurora').u_curr-=2;row(gun,'Aurora').desc='My manual Aurora note';
 gun=levelUpBuild(next(gun,pref),gun);assert.equal(row(gun,'Aurora').u_max,8);assert.equal(row(gun,'Aurora').u_curr,6);assert.equal(row(gun,'Aurora').desc,'My manual Aurora note');
 const wis=mergeSheetData(gun,{action:'fields',fields:{wis:18}});assert.equal(row(wis,'Aurora').u_max,9);assert.equal(row(wis,'Aurora').u_curr,7);
});
test('SQLite route saves and reopens the extra entitlement; missing and forged child choices do not mutate storage',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'comos-child-choice-'));let db=await openDatabase(join(dir,'test.sqlite'));
 try{
  const owner=createUserRepository(db).create({displayName:'Choice owner'}),first=createCharacterLibraryService(db).createBuild(owner.id,{build:fixture(),requestId:randomUUID()}),origin='https://fixture.local';let data=first.data,revision=first.revision;
  async function post(build){const req=Readable.from([Buffer.from(JSON.stringify({op:'wizard-level-up',revision,build}))]);req.method='POST';req.url='/api/v1/character-records/'+first.id;req.headers={origin,'content-type':'application/json',cookie:'__Host-comos_session=fixture'};let answer;
   await createDirectoryRoutes({db,origin,adminUids:[],sessions:{restore:async()=>({user:{id:owner.id}})}})(req,{},req.url,(status,payload)=>answer={status,payload});return answer;}
  for(let l=2;l<=4;l++){
   const b=next(data,{[talent(DANCER,4)]:'Mystic Dance'});
   if(l===4){const child=choiceEvents(b).find(e=>e.parentEventId),bad=structuredClone(b);delete bad.choices[child.id];assert.equal((await post(bad)).status,400);const forged=structuredClone(b);forged.choices[child.id]=['invented'];assert.equal((await post(forged)).status,400);assert.equal(db.prepare('SELECT revision FROM characters WHERE id=?').get(first.id).revision,revision);}
   const result=await post(b);assert.equal(result.status,200,result.payload.message);data=result.payload.character.data;revision=result.payload.character.revision;
  }
  db.close();db=await openDatabase(join(dir,'test.sqlite'));const stored=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(first.id).data_json),child=choiceEvents(stored.rulesBuild.input).find(e=>e.parentEventId);
  assert(stored.rulesBuild.input.choices[child.id]?.length===1);assert.equal(rows(compileBuild(stored.rulesBuild.input,stored)).filter(r=>r.sourceRuleId===stored.rulesBuild.input.choices[child.id][0]).length,1);
 }finally{db.close();await rm(dir,{recursive:true,force:true});}
});

test('malformed parent choice payloads are rejected before deriving follow-up entitlements',()=>{
 for(const malformed of [123,{},'not-an-array',[{}],Array(11).fill(DT+'mystic-dance')]){
  const b=fixture();b.choices[talent(DANCER,2)]=malformed;
  assert.throws(()=>compileBuild(b),error=>error.code==='INVALID_CHARACTER'&&/Invalid choice/.test(error.message));
 }
});
