import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {registry,spells,newBuild,choiceEvents,eligibleOptions,calculated,compileBuild,levelUpBuild,buildIssues,effectiveScores,raceTraits,spellCounts} from '../src/features/characters/rules/build.mjs';
import {pointSpend,rollScores,standardArray,moveScoreToken} from '../src/features/characters/ability-generation.mjs';
import {blackMageSummary,bonusMp} from '../src/features/characters/rules-summary.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {sheetStats} from '../src/features/sheet/model.mjs';
import {entryCalculations} from '../src/features/sheet/calculations.mjs';
import {createCharacterLibraryService,createCharacterLibraryRoutes} from '../backend/characters/library.mjs';
import {createDirectoryRoutes} from '../backend/characters/directory.mjs';
import {createApiServer} from '../backend/http/app.mjs';
import {openDatabase} from '../backend/db/database.mjs';import {createUserRepository} from '../backend/repositories/users.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
export function validBuild(level=2){const b=newBuild();b.name='Rules test';b.raceId='ffd20:race:dwarf';b.baseScores.int=18;b.level=level;b.hpRolls=Array.from({length:level},(_,i)=>i?4:6);b.reviewed=true;b.skillRanks=fixedSkills.map((_,i)=>i<8?level:0);
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
 const db=await openDatabase(':memory:');try{const user=createUserRepository(db).create({displayName:'Builder'}),service=createCharacterLibraryService(db),raw={build:validBuild(1),requestId:randomUUID()};assert.throws(()=>service.createBuild(user.id,{...raw,build:{...raw.build,hpRolls:[1]}}),/maximum d6/);assert.throws(()=>service.createBuild(user.id,{...raw,build:{...raw.build,favored:['hp']}}),/manually/);const one=service.createBuild(user.id,raw),two=service.createBuild(user.id,raw);assert.equal(one.id,two.id);assert.equal(db.prepare('SELECT count(*) n FROM characters').get().n,1);assert.throws(()=>service.createBuild(user.id,{...raw,build:{...raw.build,name:'Changed'}}),/already used/);assert.equal(db.prepare('SELECT count(*) n FROM characters').get().n,1);}finally{db.close();}
});
test('authenticated live routes reject other owners, forged origin, and stale wizard revisions',async()=>{
 const db=await openDatabase(':memory:'),users=createUserRepository(db),owner=users.create({displayName:'Rules owner'}),other=users.create({displayName:'Rules other'}),origin='https://example.test',sessions={restore:async cookie=>{if(!['owner','other'].includes(cookie))throw Error();return {subject:cookie,user:cookie==='owner'?owner:other};}},server=createApiServer({db,directoryRoutes:createDirectoryRoutes({db,sessions,adminUids:[],origin}),characterLibraryRoutes:createCharacterLibraryRoutes({db,sessions,adminUids:[],origin})});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{const service=createCharacterLibraryService(db),c=service.createBuild(owner.id,{build:validBuild(1),requestId:randomUUID()}),next=validBuild(2);next.initialIntMod=c.data.rulesBuild.input.initialIntMod;const body=JSON.stringify({op:'wizard-level-up',revision:1,build:next}),headers={Cookie:'__Host-comos_session=other',Origin:origin,'Content-Type':'application/json'};assert.equal((await fetch(base+'/api/v1/character-records/'+c.id,{method:'POST',headers,body})).status,404);headers.Cookie='__Host-comos_session=owner';headers.Origin='https://evil.test';assert.equal((await fetch(base+'/api/v1/character-records/'+c.id,{method:'POST',headers,body})).status,403);headers.Origin=origin;assert.equal((await fetch(base+'/api/v1/character-records/'+c.id,{method:'POST',headers,body})).status,200);assert.equal((await fetch(base+'/api/v1/character-records/'+c.id,{method:'POST',headers,body})).status,409);}finally{await new Promise(r=>server.close(r));db.close();}
});
test('wizard is one step at a time, escapes input, and only exposes the three supplied races',()=>{
 const b=validBuild();b.name='<script>bad</script>';assert.match(renderBuild(b,0),/&lt;script&gt;/);const race=renderBuild(b,2);assert.match(race,/Dwarf/);assert.match(race,/Elvaan/);assert.match(race,/Galka/);assert.doesNotMatch(race,/>Hume</);assert.doesNotMatch(race,/Character creation.*nav/);assert.match(renderBuild(b,6),/Bonus MP/);
});
test('new characters receive starting wealth/outfit once and all repeated class skill rows are marked',()=>{
 const d=compileBuild(validBuild(1));assert.equal(d.currency_gil,70);assert.equal(d.items.filter(i=>i.sourceRuleId?.endsWith('starting-outfit')).length,1);assert.equal(d.items[0].value,10);assert.equal(d.skills.filter(r=>r.name==='Craft'&&r.cs).length,3);assert.equal(d.skills.filter(r=>r.name==='Profession'&&r.cs).length,3);assert(d.skills.filter(r=>r.name.startsWith('Knw:')).every(r=>r.cs));assert.equal(blackMageSummary(1,18).skillPerLevel,8);assert.match(d.favored_class_options,/manually/);
 d.currency_gil=3;const next=compileBuild(validBuild(1),d);assert.equal(next.currency_gil,3);assert.equal(next.items.length,1);
});
test('4d6 drops the lowest; point buy and arrays enforce real costs and one assignment per score',()=>{
 const results=rollScores(()=>6);assert(results.every(r=>r.total===18&&r.dice.length===4));let at=0;const dice=[1,2,3,4];assert(rollScores(()=>dice[at++%4]).every(r=>r.total===9));assert.equal(pointSpend({str:18,dex:10,con:10,int:10,wis:10,cha:10}),17);
 const b=validBuild(1);b.abilityMethod='point-buy';b.pointBudget=15;assert.throws(()=>compileBuild(b),/within/);b.abilityMethod='array';b.baseScores=Object.fromEntries(['str','dex','con','int','wis','cha'].map((k,i)=>[k,standardArray[i]]));b.scoreAssignments=[0,0,2,3,4,5];assert(buildIssues(b).some(i=>i.message.includes('exactly once')));
});
test('level-up adds one level, fixed 4 HP, retains wealth and old choices, and refuses respecs',()=>{
 const d=compileBuild(validBuild(1)),next=validBuild(2);next.initialIntMod=d.rulesBuild.input.initialIntMod;const raised=levelUpBuild(next,d);assert.equal(raised.level,2);assert.deepEqual(raised.rulesBuild.input.hpRolls,[6,4]);assert.equal(raised.currency_gil,70);assert.equal(raised.items.length,1);assert.equal(raised.hp_max,12);
 assert.throws(()=>levelUpBuild({...next,level:3},d),/exactly one/);assert.throws(()=>levelUpBuild({...next,baseScores:{...next.baseScores,str:12}},d),/cannot change/);assert.throws(()=>levelUpBuild({...next,hpRolls:[6,6]},d),/4 base HP/);
});
test('level 4 ability increase is exactly +1, with retrospective CON HP and fixed initial spell count',()=>{
 const start=validBuild(3);start.baseScores.int=19;const d=compileBuild(start),next=validBuild(4);next.baseScores={...start.baseScores};next.initialIntMod=4;next.abilityIncreases={'4':'int'};next.skillRanks[8]=4;assert.equal(effectiveScores(next).int,20);assert.equal(spellCounts(next).leveled,13);assert.equal(levelUpBuild(next,d).int,20);
 assert.throws(()=>levelUpBuild({...next,abilityIncreases:{}},d),/Choose one ability/);assert.throws(()=>levelUpBuild({...next,abilityIncreases:{'4':'int','8':'str'}},d),/Only the current/);
 const con={...next,skillRanks:next.skillRanks.map((v,i)=>i===8?0:v),abilityIncreases:{'4':'con'}};assert.equal(levelUpBuild(con,d).hp_max,22); // 6+4+4+4 plus CON +1 per four levels
});
test('ability generation is late; spell slots are present even before INT is assigned; selections use popups',()=>{
 const b=validBuild(1);b.baseScores.int=10;const html=renderBuild(b,5);assert.match(html,/data-rw-open-spell="cantrips"/);assert.match(html,/data-rw-open-spell="leveled"/);assert.doesNotMatch(html,/data-rw-choice="/);assert.match(renderBuild(b,4),/data-rw-open-choice/);assert.match(renderBuild(b,1,{mode:'create'}),/data-rw-method/);
});

test('wizard skill allocations spend exactly the effective INT budget, respect rank caps and persist',()=>{const b=validBuild(1);assert.deepEqual(buildIssues(b),[]);let d=compileBuild(b);assert.equal(d.skills.reduce((n,r)=>n+Number(r.lvl||0),0),8);b.skillRanks[0]=0;assert(buildIssues(b).some(i=>i.step===7));b.skillRanks[0]=2;assert(buildIssues(b).some(i=>i.message.includes('up to')));});
test('score UI separates race adjustments and excludes spell choices and stale manual tokens',()=>{const b=validBuild(1);b.scorePool=[14,14,16,16,10,8];let html=renderBuild(b,1,{mode:'create'});assert.match(html,/\+2 race/);assert.doesNotMatch(html,/data-rw-token|Cantrip|×4|First-level choices/);assert.doesNotMatch(html,/data-rw-open-spell/);b.abilityMethod='array';html=renderBuild(b,1,{mode:'create'});assert.match(html,/draggable="true"/);assert.match(html,/data-rw-drop/);assert.doesNotMatch(html,/Score 1:/);});

test('moving score tiles consumes one token and returns displaced tiles without duplicate assignment',()=>{let a=[null,null,null,null,null,null];a=moveScoreToken(a,0,0);a=moveScoreToken(a,0,3);assert.equal(a[0],null);assert.equal(a[3],0);assert.equal(a.filter(n=>n===0).length,1);a=moveScoreToken(a,1,3);assert(!a.includes(0));assert.equal(a[3],1);});
test('low INT preserves three starting learned spells and keeps skill budget separate',()=>{const b=validBuild(1);b.baseScores.int=8;b.spellIds=[...spells.filter(s=>s.level===0).slice(0,4),...spells.filter(s=>s.level===1).slice(0,3)].map(s=>s.id);b.skillRanks=fixedSkills.map((_,i)=>i<3?1:0);assert.equal(spellCounts(b).leveled,3);const d=compileBuild(b);assert.equal(d.spells.filter(s=>s.lvl===1).length,3);assert.equal(d.mp_bonus,0);});
test('level up fills missing historical HP and refills current HP and MP',()=>{const d=compileBuild(validBuild(2));d.rulesBuild.input.hpRolls=[6];d.hp_curr=2;const b=validBuild(3);b.initialIntMod=4;const next=levelUpBuild(b,d);assert.deepEqual(next.rulesBuild.input.hpRolls,[6,4,4]);assert.equal(next.hp_max,17);assert.equal(next.hp_curr,17);assert.equal(next.mp,next.mp_class+next.mp_bonus);});
test('navigation precedes content; class step is two selectors and alignment is a select',()=>{const b=validBuild(1);const page=renderBuild(b,3,{mode:'create'});assert(page.indexOf('data-rw-next')<page.indexOf('aria-label="Class"'));assert.doesNotMatch(page,/<h2>Black Mage|Level 1|Official archetype/);assert.match(renderBuild(b,0),/<select data-rw-field="alignment"/);assert.doesNotMatch(renderBuild(b,4),/data-rw-feature-list/);assert.match(renderBuild(b,7),/rw-class-skill/);});

test('growth includes BAB and every save even when unchanged; racial groups start open',()=>{const b=validBuild(2),old=validBuild(1);const html=renderBuild(b,9,{mode:'levelup',baseline:old});for(const label of ['BAB','Fortitude','Reflex','Will'])assert.match(html,new RegExp(label));assert.match(renderBuild(b,2),/rw-racial-group" open/);assert.match(renderBuild(b,5),/rw-spell-group/);const ability=renderBuild({...b,level:4},1,{mode:'levelup',baseline:b});assert.match(ability,/rw-current-scores/);});
