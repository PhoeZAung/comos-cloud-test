import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {generateFirstCoreManual} from '../scripts/generate-first-core-manual.mjs';
import {manualSourceFamilies,manualSourceOptions,addManualSourceAbilities} from '../src/features/characters/rules/manual-source-library.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {formatSourceText,renderSourceCard} from '../src/ui/ability-library.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharacterLibraryService} from '../backend/characters/library.mjs';
import {createDirectoryRoutes} from '../backend/characters/directory.mjs';
import {createApiServer} from '../backend/http/app.mjs';
import {newBuild,previewBuild,compileBuild,choiceEvents,eligibleOptions} from '../src/features/characters/rules/build.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';

const all=()=>manualSourceFamilies.flatMap(f=>manualSourceOptions({}, {familyId:f.id}));
test('manual catalogs cover all three core families, all 48 archetypes and all Bard song levels',async()=>{
 await generateFirstCoreManual({check:true});
 assert.deepEqual(manualSourceFamilies.map(f=>[f.name,f.pages.filter(p=>p.kind==='archetype').length]),[['Archer',15],['Bard',21],['Beastmaster',12]]);
 assert.equal(all().length,884);
 for(const family of manualSourceFamilies){
  assert(family.pages[0].references.some(r=>r.name==='Table: '+family.name&&/20th/.test(r.description)));
  for(const page of family.pages)for(const card of page.cards){
   assert.equal(createHash('sha256').update(card.description).digest('hex'),card.textSha256);
   assert(card.description.trim(),card.id);
   assert(!/summary only|TODO|PLACEHOLDER/.test(card.description));
  }
 }
 const bard=manualSourceFamilies[1].pages.find(p=>p.kind==='songs');
 assert.equal(bard.cards.length,176);assert.deepEqual([...new Set(bard.cards.map(c=>c.level))].sort(),[0,1,2,3,4,5,6]);
 assert.deepEqual(manualSourceFamilies.map(f=>f.pages.find(p=>p.kind==='options').cards.length),[52,44,39]);
 assert.equal(manualSourceFamilies[2].pages.find(p=>p.kind==='companions').cards.length,35);
 assert.equal(manualSourceFamilies[2].pages.filter(p=>p.kind==='companion-archetype').length,4);
});

test('every archetype imports its exact text as an editable manual card without granting stats or class entitlement',()=>{
 for(const family of manualSourceFamilies)for(const page of family.pages.filter(p=>p.kind==='archetype')){
  const card=page.cards.find(c=>!/limit break/i.test(c.name)),base={hp_max:32,hp_curr:9,bab:4,mp:2,activeAbilities:[]};
  const next=mergeSheetData(base,{action:'addManualSourceAbilities',picks:[{id:card.id,collection:'activeAbilities',maximum:3}]});
  const row=next.activeAbilities[0];
  assert.equal(row.desc,card.description);assert.equal(row.sourceTextHash,card.textSha256);assert.equal(row.sourceArchetype,page.name);
  assert.equal(row.sourceURL,page.url);assert.equal(row.sourceClass,family.name);assert.equal(row.rulesOwned,false);assert.equal(row.automation,'manual');
  assert.equal(next.hp_max,32);assert.equal(next.hp_curr,9);assert.equal(next.bab,4);assert.equal(next.mp,2);assert.equal(next.rulesBuild,undefined);
  assert.equal(next.activeAbilities.length,1);assert.equal(base.activeAbilities.length,0);
  assert.throws(()=>mergeSheetData(next,{action:'addManualSourceAbilities',picks:[{id:card.id}]}),/already on/);
 }
});

test('named parent Limit Break cards share the existing pool without restoring spent uses',()=>{
 const source=all().find(c=>c.name==='Shell Piercer');assert.equal(source.limitBreak,true);
 const base={level:5,hp_max:40,hp_curr:10,limitBreakPool:{spent:1}};
 const next=mergeSheetData(base,{action:'addManualSourceAbilities',picks:[{id:source.id}]});
 assert.equal(next.activeAbilities[0].limitBreak,true);assert.equal(next.activeAbilities[0].u_max,2);assert.equal(next.activeAbilities[0].u_curr,1);
 assert.equal(next.limitBreakPool.spent,1);assert.throws(()=>mergeSheetData(base,{action:'addManualSourceAbilities',picks:[{id:source.id,maximum:3}]}),/own pools/);
});

test('late songs, prerequisite text, companion advancements and the selected Natural Savagery table remain available',()=>{
 const options=all(),song=options.find(c=>c.pageKind==='songs'&&c.level===6);
 const d=mergeSheetData({}, {action:'addManualSourceAbilities',picks:[{id:song.id}]});
 assert.equal(d.spells[0].lvl,6);assert.equal(d.spells[0].desc,song.description);assert.equal(d.spells[0].casting_ability,'cha');
 assert.match(d.spells[0].desc,/DESCRIPTION/);
 const trick=options.find(c=>c.pageKind==='options'&&c.prerequisites&&c.prerequisites!=='—');
 const t=mergeSheetData({}, {action:'addManualSourceAbilities',picks:[{id:trick.id}]});
 assert.equal(t.passiveAbilities[0].desc,trick.description);assert.equal(t.passiveAbilities[0].effect,'Prerequisites: '+trick.prerequisites);
 const wolf=options.find(c=>c.pageKind==='companions'&&c.name==='Wolf');assert.match(wolf.description,/7TH-LEVEL ADVANCEMENT/i);
 const savagery=options.find(c=>/^Natural Savagery/.test(c.name));
 const s=mergeSheetData({}, {action:'addManualSourceAbilities',picks:[{id:savagery.id}]});
 assert.equal(s.passiveAbilities[0].desc,savagery.description);assert.match(s.passiveAbilities[0].effect,/5\/8\/11\/14\/17\/20/);
});

test('long source cards can be edited, spent and grouped without truncating Description or losing provenance',()=>{
 const source=all().find(c=>c.description.length>20000);
 let d=mergeSheetData({}, {action:'addManualSourceAbilities',picks:[{id:source.id,collection:'activeAbilities',maximum:4}]});
 d=mergeSheetData(d,{action:'useAbility',index:0});assert.equal(d.activeAbilities[0].u_curr,3);
 d=mergeSheetData(d,{action:'entry',collection:'activeAbilities',mode:'update',index:0,fields:{desc:source.description+'\nMy note.'}});
 assert.equal(d.activeAbilities[0].desc,source.description+'\nMy note.');assert.equal(d.activeAbilities[0].sourceTextHash,source.textSha256);
 d=mergeSheetData(d,{action:'abilityGroup',collection:'activeAbilities',mode:'add',fields:{name:'Shared',u_curr:2,u_max:3,restoreOnLongRest:false}});
 d=mergeSheetData(d,{action:'abilityGroup',collection:'activeAbilities',mode:'move',id:d.abilityGroups[0].id,index:0});
 assert.equal(d.activeAbilities[0].abilityGroupId,d.abilityGroups[0].id);assert.equal(d.activeAbilities[0].u_curr,3);
});

test('source imports validate the entire request before making any additions',()=>{
 const first=all()[0],second=all()[1],data={};
 for(const picks of [[{id:first.id},{id:'not-a-source'}],[{id:first.id},{id:first.id}],[{id:first.id,desc:'Injected'}],[{id:first.id,collection:'racialAbilities'}],[{id:first.id,maximum:-1}],[{id:first.id,maximum:1.5}]]){
  assert.throws(()=>addManualSourceAbilities(data,picks));assert.deepEqual(data,{});
 }
 addManualSourceAbilities(data,[{id:first.id},{id:second.id}]);assert.equal(data.passiveAbilities.length+data.activeAbilities.length,2);
 const card=all().find(o=>o.canonicalRuleId),owned={passiveAbilities:[{sourceRuleId:card.canonicalRuleId}]};
 assert(manualSourceOptions(owned,{familyId:card.familyId}).find(o=>o.id===card.id).added);
 assert.throws(()=>addManualSourceAbilities(owned,[{id:card.id}]),/already on/);
});

test('editing an existing managed class preserves imported manual cards and their spent uses',()=>{
 const b={...newBuild(),name:'Archer source fixture',classId:'ffd20:class:archer',raceId:'ffd20:race:galka',hpRolls:[8],reviewed:true};
 for(const event of choiceEvents(b))b.choices[event.id]=[eligibleOptions(b,event)[0].id];
 let budget=previewBuild(b).skillBudget;b.skillRanks=fixedSkills.map(()=>{const rank=Math.min(1,budget);budget-=rank;return rank;});
 let d=compileBuild(b);const source=all().find(c=>c.pageKind==='archetype'&&!/limit break/i.test(c.name));
 d=mergeSheetData(d,{action:'addManualSourceAbilities',picks:[{id:source.id,collection:'activeAbilities',maximum:4}]});
 const index=d.activeAbilities.findIndex(r=>r.manualSourceId===source.id);
 d=mergeSheetData(d,{action:'useAbility',index});
 d=mergeSheetData(d,{action:'entry',collection:'activeAbilities',mode:'update',index,fields:{desc:'My source choice and notes'}});
 const updated=compileBuild(d.rulesBuild.input,d),rows=updated.activeAbilities.filter(r=>r.manualSourceId===source.id);
 assert.equal(rows.length,1);assert.equal(rows[0].desc,'My source choice and notes');assert.equal(rows[0].u_curr,3);assert.equal(rows[0].sourceTextHash,source.textSha256);
});

test('source previews escape HTML, render progression tables and preserve the original stored text',()=>{
 const html=formatSourceText('| Name | Level |\n| --- | --- |\n| <img src=x onerror=alert(1)> | 20 |\n\n[Attack](https://example.org) **full text**');
 assert.match(html,/<table>/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img|onerror="/);assert.match(html,/<strong>full text<\/strong>/);assert.doesNotMatch(html,/https:\/\/example.org/);
 assert.match(renderSourceCard(all()[0]),/data-source-add/);
 assert.equal(manualSourceOptions({}, {familyId:manualSourceFamilies[0].id,query:'sneaky shot'}).some(c=>c.pageKind==='archetype'),true);
});

test('authenticated owner route saves and reopens imports while enforcing revisions and ownership',async()=>{
 const db=await openDatabase(':memory:');const users=createUserRepository(db),owner=users.create({displayName:'Source fixture'}),other=users.create({displayName:'Other'});
 const service=createCharacterLibraryService(db),c=service.createManual(owner.id,{mode:'manual',requestId:randomUUID()});
 const origin='https://example.test',sessions={restore:async cookie=>{if(!['owner','other'].includes(cookie))throw Error('Sign in');return {subject:cookie,user:cookie==='owner'?owner:other};}};
 const server=createApiServer({db,directoryRoutes:createDirectoryRoutes({db,sessions,adminUids:[],origin})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port+'/api/v1/character-records/'+c.id;
 const headers={Origin:origin,Cookie:'__Host-comos_session=owner','Content-Type':'application/json'};
 try{
  const card=all().find(c=>c.pageKind==='archetype'),change={op:'sheet',revision:1,action:'addManualSourceAbilities',picks:[{id:card.id,maximum:4}]};
  assert.equal((await fetch(url,{method:'POST',headers:{...headers,Cookie:'__Host-comos_session=other'},body:JSON.stringify(change)})).status,404);
  const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(change)});assert.equal(response.status,200,await response.clone().text());
  const saved=(await response.json()).character;assert.equal(saved.revision,2);
  const reopened=(await (await fetch(url,{headers})).json()).character;
  assert.equal(reopened.data.passiveAbilities[0].desc,card.description);assert.equal(reopened.data.passiveAbilities[0].u_curr,4);
  assert.equal((await fetch(url,{method:'POST',headers,body:JSON.stringify(change)})).status,409);
  assert.equal((await fetch(url,{method:'POST',headers,body:JSON.stringify({...change,revision:2})})).status,400);
  assert.equal(JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(c.id).data_json).passiveAbilities.length,1);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});
