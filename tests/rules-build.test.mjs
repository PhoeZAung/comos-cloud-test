import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {registry,spells,newBuild,choiceEvents,eligibleOptions,calculated,compileBuild,buildIssues,effectiveScores,raceTraits} from '../src/features/characters/rules/build.mjs';
import {blackMageSummary,bonusMp} from '../src/features/characters/rules-summary.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
import {entryCalculations} from '../src/features/sheet/calculations.mjs';
import {createCharacterLibraryService,createCharacterLibraryRoutes} from '../backend/characters/library.mjs';
import {createDirectoryRoutes} from '../backend/characters/directory.mjs';
import {createApiServer} from '../backend/http/app.mjs';
import {openDatabase} from '../backend/db/database.mjs';import {createUserRepository} from '../backend/repositories/users.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
export function validBuild(level=2){const b=newBuild();b.name='Rules test';b.raceId='ffd20:race:dwarf';b.baseScores.int=18;b.level=level;b.hpRolls=Array.from({length:level},(_,i)=>i?4:6);b.reviewed=true;
 const used=new Map();for(const event of choiceEvents(b)){const options=eligibleOptions(b,event),count=calculated(event.count,b);b.choices[event.id]=[];for(let i=0;i<count;i++){const opt=options.find(o=>(used.get(o.id)||0)<(o.repeatLimit||1));if(!opt)throw Error('Fixture choices exhausted.');b.choices[event.id].push(opt.id);used.set(opt.id,(used.get(opt.id)||0)+1);}}
 b.spellIds=[...spells.filter(s=>s.level===0).slice(0,4+Math.floor((level-1)/3)),...spells.filter(s=>s.level===1).slice(0,7+2*(level-1)+(level>=7?1:0)+(level>=12?1:0)+(level>=17?1:0))].map(s=>s.id);return b;}
test('MP uses the official highest-level column, not modifier multiplication or a sum',()=>{
 assert.equal(blackMageSummary(2,18).mp,5);assert.equal(blackMageSummary(3,18).mp,8);assert.equal(blackMageSummary(20,18).mp,145);assert.equal(bonusMp(22,2),6);assert.equal(bonusMp(12,9),1);assert.throws(()=>bonusMp(46,2),/extension/);
});
test('all class progression rows match the supplied table including iterative BAB/save breakpoints',()=>{
 for(const row of registry.class.data.progression){const actual=blackMageSummary(row.level,18);assert.equal(actual.bab,row.bab);assert.equal(actual.fort,row.fortitude);assert.equal(actual.ref,row.reflex);assert.equal(actual.will,row.will);assert.equal(actual.baseMp,row.baseMp);assert.equal(actual.spellLevel,row.maxSpellLevel);}
});
test('full save uses one score modifier and conditional Hardy is never an unconditional +2',()=>{
 const d=compileBuild(validBuild()),s=sheetStats(d);assert.equal(d.con,12);assert.equal(d.wis,12);assert.equal(s.fort,1);assert.equal(s.ref,0);assert.equal(s.will,4);assert.equal(s.hpMax,12);assert.equal(s.mpMax,5);assert.equal(s.bab,1);
});
test('heritage replaces scores, disabled standards persist, and overlapping alternates fail',()=>{
 const b=validBuild(),race=registry.races[0];b.heritageId=race.data.heritages[0].id;assert.equal(effectiveScores(b).str,8);assert.equal(effectiveScores(b).cha,10);const scoreId=race.data.standardTraitIds.find(id=>id.endsWith(':ability-score-racial-traits'));b.disabledTraits=[scoreId];assert.equal(effectiveScores(b).con,10);
 b.heritageId='';b.disabledTraits=[];b.alternateIds=race.data.alternateTraitIds.filter(id=>id.endsWith(':barrow-warden')||id.endsWith(':deep-warrior'));assert(raceTraits(b).errors.length);assert.throws(()=>compileBuild(b),/Two selections/);
});
test('builds reject forged scores, fields, inactive archetypes, repeats and missing choices',()=>{
 let b=validBuild();assert.deepEqual(buildIssues(b),[]);assert.throws(()=>compileBuild({...b,admin:true}),/Unsupported/);assert.throws(()=>compileBuild({...b,baseScores:{...b.baseScores,int:999}}),/base scores/);assert.throws(()=>compileBuild({...b,archetypeId:registry.archetypes[0].id}),/not ready/);
 b.choices={};assert.throws(()=>compileBuild(b),/choose/);
});
test('level-gain spell eligibility rejects filling first-level choices with higher spells',()=>{
 const b=validBuild(3);b.spellIds=b.spellIds.filter(id=>spells.find(s=>s.id===id).level===0).concat(spells.filter(s=>s.level===2).slice(0,11).map(s=>s.id));assert(buildIssues(b).some(e=>e.message.includes('level their learning')));
});
test('resaving and leveling keep owned entries unique, resources spent, favorites and manual data',()=>{
 const b=validBuild(),one=compileBuild(b);const shield=one.activeAbilities.find(r=>r.name==='Elemental Shield');assert(shield);assert.equal(shield.u_max,7);shield.u_curr=3;shield.favorite=true;one.hp_curr=2;one.mp=1;one.activeAbilities.push({name:'My custom ability',desc:'Keep me'});one.items=[{name:'Staff'}];
 const two=compileBuild(b,one);assert.equal(two.activeAbilities.filter(r=>r.name==='Elemental Shield').length,1);assert.equal(two.activeAbilities.find(r=>r.name==='Elemental Shield').u_curr,3);assert.equal(two.activeAbilities.find(r=>r.name==='Elemental Shield').favorite,true);assert.equal(two.hp_curr,2);assert.equal(two.mp,1);assert.deepEqual(two.items,one.items);assert(two.activeAbilities.some(r=>r.name==='My custom ability'));
 const raised=validBuild(3),three=compileBuild(raised,two);assert.equal(three.hp_curr,2);assert.equal(three.mp,1);assert.equal(three.mp_class,5);assert.equal(three.mp_bonus,3);
});
test('live ability-score editing recomputes HP/MP and maximum uses without refilling',()=>{
 const d=compileBuild(validBuild(3));d.hp_curr=4;d.mp=1;const row=d.activeAbilities.find(r=>r.name==='Elemental Shield');row.u_curr=3; // four of seven spent
 const next=mergeSheetData(d,{action:'fields',fields:{int:20,con:14}});assert.equal(next.hp_curr,4);assert.equal(next.mp,1);assert.equal(next.hp_max,d.hp_max+3);assert.equal(next.mp_bonus,4);
 const updated=next.activeAbilities.find(r=>r.name==='Elemental Shield');assert.equal(entryCalculations(updated,next,'activeAbilities').maxUses,8);assert.equal(updated.u_curr,4);
});
test('first adoption preserves a rollback, unknown fields and existing manual collections',()=>{
 const old={hp_curr:2,mp_curr:1,notesArea:'Keep notes',items:[{name:'Sword'}],racialAbilities:[{name:'Custom trait'}],oldField:{preserve:true}};
 const result=compileBuild(validBuild(),old);assert.deepEqual(result.rulesBuild.rollback,old);assert.equal(result.hp_curr,2);assert.equal(result.mp,1);assert.equal(result.notesArea,'Keep notes');assert(result.racialAbilities.some(r=>r.name==='Custom trait'));assert.deepEqual(result.oldField,old.oldField);
});
test('manual offsets and disabled owned abilities survive later wizard synchronization',()=>{
 const b=validBuild(),d=compileBuild(b);d.bab+=2;d.activeAbilities=d.activeAbilities.filter(r=>r.name!=='Elemental Shield');const next=compileBuild(b,d);assert.equal(next.bab,3);assert(!next.activeAbilities.some(r=>r.name==='Elemental Shield'));
});
test('Spell Mastery follows active level events, preserves manual DC offsets, and owned descriptions survive edits',()=>{
 const b=validBuild(6);for(const event of choiceEvents(b).filter(e=>e.id.includes('black-magery')))b.choices[event.id]=['ffd20:class:black-mage:option:black-magery:spell-mastery'];
 const d=compileBuild(b);assert.equal(d.spells.find(s=>s.lvl===1).dc_misc,2);d.spells.find(s=>s.lvl===1).dc_misc=4;d.activeAbilities.find(r=>r.name==='Elemental Shield').desc='My shield note';
 const low=validBuild(2);for(const event of choiceEvents(low).filter(e=>e.id.includes('black-magery')))low.choices[event.id]=['ffd20:class:black-mage:option:black-magery:spell-mastery'];const next=compileBuild(low,d);assert.equal(next.spells.find(s=>s.lvl===1).dc_misc,3);assert.equal(next.activeAbilities.find(r=>r.name==='Elemental Shield').desc,'My shield note');
});
test('final creation is atomic and retrying one request cannot create another character',async()=>{
 const db=await openDatabase(':memory:');try{const user=createUserRepository(db).create({displayName:'Builder'}),service=createCharacterLibraryService(db),raw={build:validBuild(),requestId:randomUUID()};const one=service.createBuild(user.id,raw),two=service.createBuild(user.id,raw);assert.equal(one.id,two.id);assert.equal(db.prepare('SELECT count(*) n FROM characters').get().n,1);assert.throws(()=>service.createBuild(user.id,{...raw,build:{...raw.build,name:'Changed'}}),/already used/);assert.equal(db.prepare('SELECT count(*) n FROM characters').get().n,1);}finally{db.close();}
});
test('authenticated live routes reject other owners, forged origin, and stale wizard revisions',async()=>{
 const db=await openDatabase(':memory:'),users=createUserRepository(db),owner=users.create({displayName:'Rules owner'}),other=users.create({displayName:'Rules other'}),origin='https://example.test',sessions={restore:async cookie=>{if(!['owner','other'].includes(cookie))throw Error();return {subject:cookie,user:cookie==='owner'?owner:other};}},server=createApiServer({db,directoryRoutes:createDirectoryRoutes({db,sessions,adminUids:[],origin}),characterLibraryRoutes:createCharacterLibraryRoutes({db,sessions,adminUids:[],origin})});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{const service=createCharacterLibraryService(db),c=service.createBuild(owner.id,{build:validBuild(),requestId:randomUUID()}),body=JSON.stringify({op:'wizard-build',revision:1,build:validBuild(3)}),headers={Cookie:'__Host-comos_session=other',Origin:origin,'Content-Type':'application/json'};assert.equal((await fetch(base+'/api/v1/character-records/'+c.id,{method:'POST',headers,body})).status,404);headers.Cookie='__Host-comos_session=owner';headers.Origin='https://evil.test';assert.equal((await fetch(base+'/api/v1/character-records/'+c.id,{method:'POST',headers,body})).status,403);headers.Origin=origin;assert.equal((await fetch(base+'/api/v1/character-records/'+c.id,{method:'POST',headers,body})).status,200);assert.equal((await fetch(base+'/api/v1/character-records/'+c.id,{method:'POST',headers,body})).status,409);}finally{await new Promise(r=>server.close(r));db.close();}
});
test('wizard is one step at a time, escapes input, and only exposes the three supplied races',()=>{
 const b=validBuild();b.name='<script>bad</script>';assert.match(renderBuild(b,0),/&lt;script&gt;/);const race=renderBuild(b,2);assert.match(race,/Dwarf/);assert.match(race,/Elvaan/);assert.match(race,/Galka/);assert.doesNotMatch(race,/>Hume</);assert.doesNotMatch(race,/Character creation.*nav/);assert.match(renderBuild(b,6),/Bonus MP/);
});
