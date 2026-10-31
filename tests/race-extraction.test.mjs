import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {generateRaceCatalog,projectRaceDefinition} from '../scripts/generate-races.mjs';
import {registry,raceFor,newBuild,choiceEvents,eligibleOptions,calculated,spells,compileBuild,effectiveScores,raceTraits,buildIssues} from '../src/features/characters/rules/build.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {renderSection} from '../src/features/sheet/view.mjs';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8').then(JSON.parse);
function fixture(){
 const b=newBuild();b.name='Race integration';b.raceId='ffd20:race:dwarf';b.baseScores.int=18;b.reviewed=true;b.skillRanks=fixedSkills.map((_,i)=>i<8?1:0);
 for(const event of choiceEvents(b))b.choices[event.id]=eligibleOptions(b,event).slice(0,calculated(event.count,b)).map(o=>o.id);
 b.spellIds=[...spells.filter(s=>s.level===0).slice(0,4),...spells.filter(s=>s.level===1).slice(0,7)].map(s=>s.id);
 return b;
}
test('normal builds use the individual race definitions and retain auditable descriptions',async()=>{
 await generateRaceCatalog({check:true});
 const dwarf=await read('rules/races/dwarf.race.json');
 assert.equal(registry.races[0].revision,dwarf.revision);
 const emitted=new Map([...dwarf.features,...dwarf.data.heritages,...dwarf.data.favoredRewards].map(o=>[o.id,o.description]));
 for(const audit of dwarf.automationContract.textAudit)assert.equal(audit.sha256,createHash('sha256').update(emitted.get(audit.id)).digest('hex'));
 assert.equal(dwarf.review.state,'needs_review');assert(dwarf.review.issues.some(i=>i.blocking));
 assert(dwarf.features.every(f=>f.descriptionStatus!=='full_verified'));
});
test('an unimplemented unconditional effect never becomes an automatic runtime buff',async()=>{
 const dwarf=await read('rules/races/dwarf.race.json');
 const effect=dwarf.features.find(f=>f.name==='Unstoppable').effects.find(e=>e.target==='defense.saves.fortitude');
 assert.equal(effect.automation,'automatic');
 const projected=projectRaceDefinition(dwarf,['ffd20:class:black-mage']);
 assert.equal(projected.features.find(f=>f.name==='Unstoppable').effects.find(e=>e.id===effect.id).automation,'manual');
 assert.equal(projected.data.favoredRewards.length,1);assert.equal(dwarf.data.favoredRewards.length,39);
});
test('identity keeps type and movement/language exceptions without adding conditional save bonuses',()=>{
 const b=fixture(),d=compileBuild(b);
 assert.deepEqual([d.racialIdentity.type,...d.racialIdentity.subtypes],['humanoid','dwarf']);
 const html=renderSection({id:'synthetic',name:b.name,data:d},'overview');
 assert(d.racialIdentity.rules.some(r=>/Armor and encumbrance do not modify/.test(r.description)));
 assert(d.racialIdentity.rules.some(r=>/Galkan, Giant, Goblin/.test(r.description)));
 assert.doesNotMatch(html,/Armor and encumbrance do not modify|Galkan, Giant, Goblin|Racial identity rules/);
 assert.equal(d.fort_base,0);
 b.disabledTraits=['ffd20:race:dwarf:feature:languages'];const without=compileBuild(b,d);
 assert.equal(without.languages,'');assert(!without.racialIdentity.rules.some(r=>r.name==='Languages'));
});
test('Iifa skill bonuses apply once, then disappear while manual bonuses and current resources survive',()=>{
 const b=fixture();b.alternateIds=['ffd20:race:dwarf:feature:iifa-professor'];const d=compileBuild(b);
 const idx=fixedSkills.findIndex(s=>s.name==='Knw: Arcana');assert(idx>=0);assert.equal(d.skills[idx].rulesBonus,1);assert.equal(d.skills[idx].cs,true);
 d.skills[idx].temp+=3;d.hp_curr=1;d.mp=0;d.racialAbilities.push({name:'Manual ancestry note',desc:'Keep'});
 const again=compileBuild(b,d);assert.equal(again.skills[idx].temp,4);
 const attempted=structuredClone(b);attempted.alternateIds=[];assert.throws(()=>compileBuild(attempted,again),/permanent/);
 const same=compileBuild(b,again);assert.equal(same.skills[idx].temp,4);assert.equal(same.hp_curr,1);assert.equal(same.mp,0);assert(same.racialAbilities.some(a=>a.name==='Manual ancestry note'));
});
test('Tavern Hopper replaces the whole vector and conflicts with heritage; Saltbeard modifies Greed without losing it',()=>{
 const b=fixture();b.alternateIds=['ffd20:race:dwarf:feature:tavern-hopper'];
 assert.deepEqual(effectiveScores(b),{str:10,dex:10,con:12,int:18,wis:8,cha:12});
 b.heritageId=registry.races[0].data.heritages[0].id;assert(raceTraits(b).errors.length);
 b.heritageId='';b.alternateIds=['ffd20:race:dwarf:feature:saltbeard'];const updated=raceTraits(b);assert.deepEqual(updated.errors,[]);assert(updated.traits.some(f=>f.name==='Saltbeard'));assert(updated.traits.some(f=>f.id==='ffd20:race:dwarf:feature:greed'&&/under water/i.test(f.description)));assert.doesNotThrow(()=>compileBuild(b));
});

test('staged races appear for live testing while keeping unverified mechanics manual',async()=>{
 const manifest=await read('rules/manifest.json');
 const staging=await read('rules/staging/races/manifest.json');
 assert.equal(manifest.races.length,63);
 assert.equal(staging.enabledInWizard,true);
 assert.equal(staging.importReady,false);
 assert.equal(registry.races.length,63);
 const live=registry.races.filter(r=>!r.testing),experimental=registry.races.filter(r=>r.testing);
 assert.equal(live.length,3);
 assert.equal(experimental.length,60);
 for(const race of experimental){
  assert.equal(race.reviewStatus,'needs_review');
  assert(race.data.standardTraitIds.length>0);
  assert(race.sources[0].url.startsWith('https://'));
  const b=newBuild();b.raceId=race.id;
  assert.equal(raceFor(b)?.id,race.id);
  assert.deepEqual(raceTraits(b).errors,[]);
  for(const f of race.features)for(const e of f.effects){
   if(e.automation==='automatic'){
    assert.equal(e.condition,null,'conditional bonus may not auto-apply');
    assert(['ability_scores.','skills.','identity.','proficiencies.weapon.'].some(prefix=>e.target.startsWith(prefix)),'automatic effect path not supported');
   }
  }
 }
 assert.equal(registry.races.some(r=>r.name==='Beastkin'),true);
});

test('batch 07 race lineages and special restrictions are visible without unsafe automatic grants',async()=>{
 const immigrant=registry.races.find(r=>r.id==='ffd20:race:immortal');
 const lambkin=registry.races.find(r=>r.id==='ffd20:race:lambkin');
 const mandragora=registry.races.find(r=>r.id==='ffd20:race:mandragora');
 assert.deepEqual(immigrant.data.heritages.map(h=>h.name),['Ancients','Unlimited']);
 assert.equal(immigrant.data.favoredRewards.length,0); // No currently enabled Black Mage favored reward on the official page.
 const b=newBuild();b.raceId=immigrant.id;
 assert.equal(effectiveScores(b).str,10); // Chosen +2 must not grant to every score.
 assert(buildIssues(b).some(i=>/Immortal|MP pool/i.test(i.message)));
 assert(lambkin.features.some(f=>f.name==='Auto-Float'));
 assert.equal(mandragora.data.heritages.length,5);
 assert.equal(mandragora.data.alternateTraitIds.length,22);
 for(const h of mandragora.data.heritages){
  b.raceId=mandragora.id;b.heritageId=h.id;
  assert(raceTraits(b).errors.length>0); // Hero does not get unverified replacement effects for free.
 }
});

test('batch 08 race options are staged and mutant cannot silently override level-up scores',async()=>{
 const moomba=registry.races.find(r=>r.id==='ffd20:race:moomba');
 const mutant=registry.races.find(r=>r.id==='ffd20:race:mutant');
 const nuMou=registry.races.find(r=>r.id==='ffd20:race:nu-mou');
 assert.equal(moomba.data.standardTraitIds.length,15);
 assert.equal(moomba.data.alternateTraitIds.length,5);
 assert.equal(mutant.data.alternateTraitIds.length,6);
 assert.deepEqual(mutant.choicePools.filter(p=>p.options.length===100).map(p=>p.options.length),[100,100]);
 const b=newBuild();b.raceId=mutant.id;
 assert(buildIssues(b).some(i=>/Mutant|mutation|ability progression/i.test(i.message)));
 assert.equal(nuMou.data.alternateTraitIds.length,8);
 assert.equal(nuMou.data.heritages.length,0);
 assert.equal(nuMou.choicePools.find(p=>/Sagacious/.test(p.name)).options.length,0);
});

test('batch 09 Palico, PuPu and Qu are visible as unreviewed testing races with explicit replacement targets',async()=>{
 const palico=registry.races.find(r=>r.id==='ffd20:race:palico');
 const pupu=registry.races.find(r=>r.id==='ffd20:race:pupu');
 const qu=registry.races.find(r=>r.id==='ffd20:race:qu');
 assert.equal(palico.testing,true);
 assert.equal(palico.data.standardTraitIds.length,16);
 assert.equal(palico.data.alternateTraitIds.length,11);
 assert.deepEqual(palico.data.heritages.map(h=>h.name),['Cait Sith','Felyne']);
 const climb=palico.data.alternateReplacements.find(op=>op.id.includes(':climber:'));
 assert.deepEqual(climb.targetFeatureIds,[palico.id+':trait:sprinter']);
 const b=newBuild();b.raceId=palico.id;
 assert.deepEqual(raceTraits(b).errors,[]);
 b.heritageId=palico.data.heritages[0].id;
 assert.deepEqual(raceTraits(b).errors,[],'Palico heritage has a complete source-defined score replacement');assert.equal(effectiveScores(b).int,12);
 assert.equal(pupu.data.standardTraitIds.length,9);
 assert.equal(pupu.data.alternateTraitIds.length,3);
 assert.equal(pupu.data.heritages.length,1);
 assert.equal(pupu.choicePools.find(p=>/Technological Savant specialty/.test(p.name)).options.length,2);
 assert.equal(qu.data.standardTraitIds.length,11);
 assert.equal(qu.data.alternateTraitIds.length,3);
 const quSource=await read('rules/staging/races/qu.race.json');
 assert.equal(quSource.data.favoredRewards.some(r=>r.classId.endsWith(':paladin')),true);
 assert.equal(qu.data.favoredRewards.some(r=>r.classId.endsWith(':paladin')),false,'Runtime only projects enabled favored-class rewards');
});

test('batch 10 races stay visible for testing and guard unverified heritage choices',()=>{
 const expected=[['roegadyn',4,3],['ronso',5,4],['seeq',6,0]];
 for(const [name,alternateCount,heritageCount] of expected){const race=registry.races.find(r=>r.id==='ffd20:race:'+name);assert.equal(race?.testing,true);assert.equal(race.data.alternateTraitIds.length,alternateCount);assert.equal(race.data.heritages.length,heritageCount);const b=newBuild();b.raceId=race.id;assert.deepEqual(raceTraits(b).errors,[]);if(heritageCount){b.heritageId=race.data.heritages[0].id;assert(raceTraits(b).errors.length>0);}}
});

test('batch 11 Seto Lion, Shindroid, Tonkin expose full alternates without unsafe mechanics',()=>{
 const expected=[['seto-lion',17,8,1,10],['shindroid',17,15,4,8],['tonkin',14,5,2,8]];
 for(const [key,standard,alt,herit,favored] of expected){const race=registry.races.find(r=>r.id==='ffd20:race:'+key);assert.equal(race?.testing,true);assert.equal(race.data.standardTraitIds.length,standard);assert.equal(race.data.alternateTraitIds.length,alt);assert.equal(race.data.heritages.length,herit);assert.equal(race.data.favoredRewards.length,key==='seto-lion'?1:0);const b=newBuild();b.raceId=race.id;assert.deepEqual(raceTraits(b).errors,[]);b.heritageId=race.data.heritages[0].id;assert(raceTraits(b).errors.length>0,'heritage must not silently apply');}
 const seto=registry.races.find(r=>r.id==='ffd20:race:seto-lion');let b=newBuild();b.raceId=seto.id;assert.equal(effectiveScores(b).dex,12);assert(seto.data.alternateReplacements.find(op=>op.id.includes(':nimble-attacks:')).resolution==='unresolved');
 const shin=registry.races.find(r=>r.id==='ffd20:race:shindroid');b=newBuild();b.raceId=shin.id;assert(buildIssues(b).some(x=>/Shindroid|MP pool/i.test(x.message)));b.alternateIds=[shin.id+':trait:magitek-unit'];assert(!buildIssues(b).some(x=>/Shindroid.*MP pool/i.test(x.message)));assert(shin.data.heritages.map(h=>h.name).includes('Omicron'));
 const tonkin=registry.races.find(r=>r.id==='ffd20:race:tonkin');b=newBuild();b.raceId=tonkin.id;assert(buildIssues(b).some(x=>/Tonkin|vocal component/i.test(x.message)));assert.equal(tonkin.features.find(f=>f.name==='Languages').effects.length,0);assert.equal(tonkin.data.alternateReplacements.find(x=>x.id.includes(':dancing-lantern:')).resolution,'unresolved');
});

test('batch 12 Varg and Viera preserve variants, choices and score vectors',()=>{
 const v=registry.races.find(r=>r.id==='ffd20:race:varg'),a=registry.races.find(r=>r.id==='ffd20:race:viera');
 assert.equal(v?.testing,true);assert.equal(a?.testing,true);
 assert.deepEqual([v.data.standardTraitIds.length,v.data.alternateTraitIds.length,v.data.heritages.length],[14,11,2]);
 assert.deepEqual([a.data.standardTraitIds.length,a.data.alternateTraitIds.length,a.data.heritages.length],[13,7,4]);
 assert.deepEqual(a.choicePools.map(p=>p.options.length),[6,3]);
 let b=newBuild();b.raceId=v.id;assert.deepEqual(raceTraits(b).errors,[]);
 b.alternateIds=[v.id+':trait:feral'];assert.equal(effectiveScores(b).int,8);
 b.alternateIds=[v.id+':trait:light-build'];assert.deepEqual([effectiveScores(b).str,effectiveScores(b).dex,effectiveScores(b).wis,effectiveScores(b).cha],[10,12,12,8]);
 b.alternateIds=[v.id+':trait:savant'];assert.deepEqual([effectiveScores(b).str,effectiveScores(b).wis,effectiveScores(b).cha,effectiveScores(b).con],[10,12,12,8]);
 b.alternateIds=[v.id+':trait:light-build',v.id+':trait:savant'];assert(raceTraits(b).errors.some(x=>/Two selections replace/.test(x)));
 for(const race of [v,a]){b=newBuild();b.raceId=race.id;b.heritageId=race.data.heritages[0].id;assert(raceTraits(b).errors.length>0);}
 b=newBuild();b.raceId=a.id;b.alternateIds=[a.id+':trait:fleet-footed',a.id+':trait:spirit-of-the-waters'];assert(raceTraits(b).errors.some(x=>/Two selections replace/.test(x)));
});

test('Viera elemental choice is mandatory and Mist Sight remains guarded until a separate spell picker',()=>{
 const id='ffd20:race:viera',b=newBuild();b.raceId=id;
 assert(buildIssues(b).some(issue=>/Elemental Summoner subtype: choose 1/.test(issue.message)));
 b.alternateIds=[id+':trait:misty-mind'];assert(!buildIssues(b).some(issue=>/Elemental Summoner subtype: choose 1/.test(issue.message)));
 b.alternateIds=[id+':trait:misty-mind',id+':trait:mist-sight'];assert(buildIssues(b).some(issue=>/Viera Mist Sight/.test(issue.message)));
});

test('first three Beastman Tribe race files appear for safe live testing',()=>{
 const races=['amaljaa','antica','forgiven'].map(k=>registry.races.find(r=>r.id==='ffd20:race:'+k));
 assert(races.every(r=>r?.testing&&r.reviewStatus==='needs_review'));
 assert.deepEqual(races.map(r=>r.data.standardTraitIds.length),[11,14,9]);
 assert.deepEqual(races.map(r=>r.data.alternateTraitIds.length),[5,4,9]);
 assert.deepEqual(races.map(r=>r.data.heritages.length),[3,0,0]);
 assert.deepEqual(races.map(r=>r.data.favoredRewards.length),[1,1,0]); // Only Black Mage has live favored reward references.
 const [amal,antica,forgiven]=races;
 const b=newBuild();b.raceId=amal.id;
 assert.deepEqual([effectiveScores(b).str,effectiveScores(b).int,effectiveScores(b).dex],[12,12,8]);
 b.heritageId=amal.data.heritages[0].id;
 assert.deepEqual(raceTraits(b).errors,[],'Amalj’aa heritage has a complete source-defined score replacement');assert.equal(effectiveScores(b).cha,12);
 b.heritageId='';b.raceId=antica.id;
 assert(buildIssues(b).some(x=>/Antica|Silent Spell|Telepathic Spellcaster/.test(x.message)));
 assert.equal(antica.features.find(f=>f.name==='Languages').effects.length,0,'Antica understands, but must not auto-speak, starting languages');
 assert.deepEqual([effectiveScores(b).str,effectiveScores(b).con,effectiveScores(b).wis,effectiveScores(b).cha],[12,12,8,8]);
 b.raceId=forgiven.id;
 assert.deepEqual([effectiveScores(b).wis,effectiveScores(b).cha],[12,12]);
 assert.equal(forgiven.features.find(f=>f.name==='Type').effects[0].textValue,'outsider');
 const monstrous=forgiven.data.alternateReplacements.find(r=>r.addsFeatureIds.includes(forgiven.id+':trait:monstrous-heritage'));
 assert.equal(monstrous.resolution,'manual');
 assert.equal(forgiven.choicePools.find(p=>/Monstrous Heritage/.test(p.name)).options.length,2);
 b.alternateIds=[forgiven.id+':trait:scion-of-mortality'];
 assert.deepEqual(raceTraits(b).errors,[],'Scion modifies rather than removes Type/Languages');
});

test('batch 13 Gnath preserves Small size, burrow speed and 9 mutually exclusive alternate replacements',()=>{
 const race=registry.races.find(r=>r.id==='ffd20:race:gnath');assert(race?.testing);assert.equal(race.data.standardTraitIds.length,12);assert.equal(race.data.alternateTraitIds.length,9);assert.equal(race.data.heritages.length,0);assert.equal(race.data.favoredRewards.length,1);
 const b=newBuild();b.raceId=race.id;assert.deepEqual(raceTraits(b).errors,[]);assert.equal(effectiveScores(b).str,6);assert.equal(effectiveScores(b).dex,12);assert.equal(effectiveScores(b).wis,12);
 const speed=race.features.find(f=>f.name==='Base Speed');assert(speed.effects.some(x=>x.target==='identity.speed.burrow'&&x.value.value===20));
 b.alternateIds=[race.id+':trait:bond-to-the-land',race.id+':trait:tempered'];assert(raceTraits(b).errors.some(x=>/Two selections replace/.test(x)));
 const day=race.data.alternateReplacements.find(op=>op.id.includes(':day-raider:'));assert.equal(day.targetFeatureIds.length,2);
});

test('batch 14 Goblin, Ixal, Kindred and Kobold preserve alternate replacements, scores and choices',()=>{
 const expected=[['goblin',13,6,2,1,0],['ixal',15,5,0,0,2],['kindred',11,5,0,1,2],['kobold',13,5,0,0,0]];
 for(const [key,standard,alt,heritage,favored,pools] of expected){const r=registry.races.find(x=>x.id==='ffd20:race:'+key);assert.equal(r?.testing,true);assert.deepEqual([r.data.standardTraitIds.length,r.data.alternateTraitIds.length,r.data.heritages.length,r.data.favoredRewards.length,r.choicePools.length],[standard,alt,heritage,favored,pools]);const b=newBuild();b.raceId=r.id;assert.deepEqual(raceTraits(b).errors,[]);if(heritage){b.heritageId=r.data.heritages[0].id;assert(raceTraits(b).errors.length>0);}}
 const goblin=registry.races.find(r=>r.id==='ffd20:race:goblin');let b=newBuild();b.raceId=goblin.id;assert.deepEqual([effectiveScores(b).str,effectiveScores(b).dex,effectiveScores(b).int],[8,12,12]);b.alternateIds=[goblin.id+':trait:hobgoblinoid'];assert.deepEqual([effectiveScores(b).str,effectiveScores(b).cha,effectiveScores(b).int],[12,12,8]);assert(raceTraits(b).traits.some(f=>f.id.endsWith(':trait:hobgoblinoid')));
 const ixal=registry.races.find(r=>r.id==='ffd20:race:ixal');b=newBuild();b.raceId=ixal.id;assert.deepEqual(ixal.choicePools.map(p=>p.options.length),[2,6]);assert(buildIssues(b).some(x=>/Bond to the Ice selection: choose 1/.test(x.message)));b.alternateIds=[ixal.id+':trait:garudas-current'];assert(buildIssues(b).some(x=>/Elemental Summoner selection: choose 1/.test(x.message)));
 const kindred=registry.races.find(r=>r.id==='ffd20:race:kindred');b=newBuild();b.raceId=kindred.id;assert(buildIssues(b).some(x=>/Languages selection: choose 1/.test(x.message)));assert.equal(kindred.features.find(x=>x.name==='Languages').effects.length,1);b.alternateIds=[kindred.id+':trait:maw-or-claw'];assert(buildIssues(b).some(x=>/Maw or Claw/.test(x.message)));
 const kobold=registry.races.find(r=>r.id==='ffd20:race:kobold');const speed=kobold.features.find(x=>x.name==='Base Speed');assert(speed.effects.some(e=>e.target==='identity.speed.burrow'&&e.value.value===20));
});

test('batch 15 Kojin, Lamia, Loporrit and Matanga stage complete rules and safe mandatory choices',()=>{
 const expected=[['kojin',12,4,0,0,0],['lamia',14,5,3,0,2],['loporrit',12,8,0,0,4],['matanga',13,3,2,0,1]];
 for(const [key,standard,alt,herit,favored,pools] of expected){const race=registry.races.find(r=>r.id==='ffd20:race:'+key);assert.equal(race?.testing,true);assert.deepEqual([race.data.standardTraitIds.length,race.data.alternateTraitIds.length,race.data.heritages.length,race.data.favoredRewards.length,race.choicePools.length],[standard,alt,herit,favored,pools]);const b=newBuild();b.raceId=race.id;assert.deepEqual(raceTraits(b).errors,[]);if(herit){b.heritageId=race.data.heritages[0].id;assert(raceTraits(b).errors.length>0);}}
 const kojin=registry.races.find(r=>r.id==='ffd20:race:kojin');let b=newBuild();b.raceId=kojin.id;assert.deepEqual([effectiveScores(b).con,effectiveScores(b).wis,effectiveScores(b).cha],[12,12,8]);b.alternateIds=[kojin.id+':trait:natural-prankster'];assert.deepEqual([effectiveScores(b).con,effectiveScores(b).wis,effectiveScores(b).cha],[12,8,12]);const kspeed=kojin.features.find(f=>f.name==='Base Speed');assert(kspeed.effects.some(x=>x.target==='identity.speed.swim'&&x.value.value===30));
 const lamia=registry.races.find(r=>r.id==='ffd20:race:lamia');b=newBuild();b.raceId=lamia.id;assert(buildIssues(b).some(x=>/Bond to the Land selection: choose 1/.test(x.message)));assert(lamia.features.find(x=>x.name==='Base Speed').effects.some(x=>x.target==='identity.speed.swim'&&x.value.value===40));b.alternateIds=[lamia.id+':trait:seasinger'];assert(!buildIssues(b).some(x=>/Bond to the Land selection: choose 1/.test(x.message)));b.alternateIds.push(lamia.id+':trait:tempered');assert(buildIssues(b).some(x=>/Tempered selection: choose 1/.test(x.message)));
 const loporrit=registry.races.find(r=>r.id==='ffd20:race:loporrit');b=newBuild();b.raceId=loporrit.id;assert(buildIssues(b).some(x=>/Handy selection: choose 1/.test(x.message)));assert.equal(loporrit.features.find(x=>x.name==='Base Speed').effects[0].value.value,40);b.alternateIds=[loporrit.id+':trait:natural-hunter'];assert(!buildIssues(b).some(x=>/Handy selection: choose 1/.test(x.message)));
 const matanga=registry.races.find(r=>r.id==='ffd20:race:matanga');b=newBuild();b.raceId=matanga.id;assert(buildIssues(b).some(x=>/Academic selection: choose 1/.test(x.message)));b.alternateIds=[matanga.id+':trait:stoic'];assert(!buildIssues(b).some(x=>/Academic selection: choose 1/.test(x.message)));
});

test('batch 16 Namazu, Orc, Qiqirn and Quadav preserve safe choices and source conflicts',()=>{
 const expected=[['namazu',11,4,0,0,1],['orc',11,8,0,1,1],['qiqirn',11,3,3,0,0],['quadav',15,3,0,1,1]];
 for(const [name,std,alt,herit,favored,pools] of expected){const r=registry.races.find(x=>x.id==='ffd20:race:'+name);assert(r?.testing);assert.deepEqual([r.data.standardTraitIds.length,r.data.alternateTraitIds.length,r.data.heritages.length,r.data.favoredRewards.length,r.choicePools.length],[std,alt,herit,favored,pools]);const b=newBuild();b.raceId=r.id;assert.deepEqual(raceTraits(b).errors,[]);if(herit){b.heritageId=r.data.heritages[0].id;assert(raceTraits(b).errors.length>0);}}
 const namazu=registry.races.find(x=>x.id==='ffd20:race:namazu');let b=newBuild();b.raceId=namazu.id;assert.deepEqual([effectiveScores(b).dex,effectiveScores(b).cha,effectiveScores(b).con],[12,12,8]);b.alternateIds=[namazu.id+':trait:fast'];assert.deepEqual(raceTraits(b).errors,[]);assert.equal(raceTraits(b).traits.find(f=>f.id===namazu.id+':trait:base-speed').effects.find(e=>e.target==='identity.speed.land').value.value,40);
 const orc=registry.races.find(x=>x.id==='ffd20:race:orc');b=newBuild();b.raceId=orc.id;assert(buildIssues(b).some(x=>/Skill Bonus selection: choose 1/.test(x.message)));assert.equal(orc.choicePools[0].options.length,2);b.alternateIds=[orc.id+':trait:orc-lord'];assert(!buildIssues(b).some(x=>/Skill Bonus selection: choose 1/.test(x.message)));assert.deepEqual([effectiveScores(b).str,effectiveScores(b).wis,effectiveScores(b).cha,effectiveScores(b).int],[12,8,12,10]);
 const q=registry.races.find(x=>x.id==='ffd20:race:qiqirn');assert.deepEqual(q.data.heritages.map(h=>h.name),['Leaf-Eater','Meat-Eater','Qitari']);
 const quadav=registry.races.find(x=>x.id==='ffd20:race:quadav');b=newBuild();b.raceId=quadav.id;assert(buildIssues(b).some(x=>/Bond to the Land selection: choose 1/.test(x.message)));assert(quadav.features.find(x=>x.name==='Base Speed').effects.some(x=>x.target==='identity.speed.swim'&&x.value.value===30));b.alternateIds=[quadav.id+':trait:water-tribe'];assert.deepEqual(raceTraits(b).errors,[]);assert(buildIssues(b).some(x=>/Bond to the Land selection/.test(x.message)));b.racialChoices={[quadav.id+':pool:bond-to-the-land-selection']:[quadav.id+':pool:bond-to-the-land-selection:option:swamp']};assert(!buildIssues(b).some(x=>/Bond to the Land selection/.test(x.message)));
});

test('batch 17 Sahagin, Sylph, Trollkin and Vanu Vanu retain traits, conditional replacements and heritages',()=>{
 const want=[['sahagin',13,5,2,1,1],['sylph',12,9,3,1,0],['trollkin',13,5,0,1,0],['vanu-vanu',12,2,3,0,0]];
 for(const [key,std,alt,herit,fav,pools] of want){const race=registry.races.find(r=>r.id==='ffd20:race:'+key);assert(race?.testing);assert.deepEqual([race.data.standardTraitIds.length,race.data.alternateTraitIds.length,race.data.heritages.length,race.data.favoredRewards.length,race.choicePools.length],[std,alt,herit,fav,pools]);const b=newBuild();b.raceId=race.id;assert.deepEqual(raceTraits(b).errors,[]);if(herit){b.heritageId=race.data.heritages[0].id;assert(raceTraits(b).errors.length>0);}}
 let b=newBuild();b.raceId='ffd20:race:sahagin';const sahagin=registry.races.find(r=>r.id===b.raceId);assert(sahagin.features.find(f=>f.name==='Base Speed').effects.some(e=>e.target==='identity.speed.swim'&&e.value.value===30));b.alternateIds=[b.raceId+':trait:tempered'];assert(buildIssues(b).some(x=>/Sahagin.*Tempered/.test(x.message)));assert.deepEqual(sahagin.choicePools.map(p=>p.options.length),[2]);
 const sylph=registry.races.find(r=>r.id==='ffd20:race:sylph');b=newBuild();b.raceId=sylph.id;assert.deepEqual([effectiveScores(b).dex,effectiveScores(b).cha,effectiveScores(b).str],[12,12,6]);assert(sylph.features.find(f=>f.name==='Base Speed').effects.some(e=>e.target==='identity.speed.fly'&&e.value.value===40));b.alternateIds=[sylph.id+':trait:improved-flight'];assert.deepEqual(raceTraits(b).errors,[]);
 const trollkin=registry.races.find(r=>r.id==='ffd20:race:trollkin');b=newBuild();b.raceId=trollkin.id;assert.deepEqual([effectiveScores(b).str,effectiveScores(b).int,effectiveScores(b).cha],[12,12,6]);b.alternateIds=[trollkin.id+':trait:faster-healing'];assert.deepEqual(raceTraits(b).errors,[]);assert(trollkin.data.alternateReplacements.find(x=>x.id.includes(':faster-healing:')).targetFeatureIds.length===2);
 const vanu=registry.races.find(r=>r.id==='ffd20:race:vanu-vanu');assert.deepEqual(vanu.data.heritages.map(h=>h.name),['Gundu','Vundu','Zundu']);b=newBuild();b.raceId=vanu.id;b.alternateIds=[vanu.id+':trait:flightless-fall',vanu.id+':trait:nimble-faller'];assert(raceTraits(b).errors.some(x=>/Two selections replace/.test(x)));
});

test('batch 18 Velkk and Yagudo complete Beastman Tribes while preserving source-defined alternatives',()=>{
 const expected=[['velkk',13,4,0,1],['yagudo',12,3,0,1]];
 for(const [key,standard,alternates,heritages,favored] of expected){
  const r=registry.races.find(x=>x.id==='ffd20:race:'+key);assert(r?.testing);
  assert.deepEqual([r.data.standardTraitIds.length,r.data.alternateTraitIds.length,r.data.heritages.length,r.data.favoredRewards.length],[standard,alternates,heritages,favored]);
  const b=newBuild();b.raceId=r.id;assert.deepEqual(raceTraits(b).errors,[]);
 }
 const velkk=registry.races.find(x=>x.id==='ffd20:race:velkk');let b=newBuild();b.raceId=velkk.id;
 assert.deepEqual([effectiveScores(b).str,effectiveScores(b).cha,effectiveScores(b).int],[12,12,8]);
 assert(velkk.features.some(x=>x.name==='Water Resistant'));assert(velkk.features.some(x=>x.name==='Survivalist'));
 b.alternateIds=[velkk.id+':trait:nature-inhabitant',velkk.id+':trait:squalid'];
 assert(raceTraits(b).errors.some(x=>/Two selections replace/.test(x)));
 const yagudo=registry.races.find(x=>x.id==='ffd20:race:yagudo');b=newBuild();b.raceId=yagudo.id;
 assert.deepEqual([effectiveScores(b).dex,effectiveScores(b).wis,effectiveScores(b).con],[12,12,8]);
 assert(yagudo.features.some(x=>x.name==='Feathers of Gale'));
 assert(yagudo.features.some(x=>x.name==='Valiant Linguist'));
 b.alternateIds=[yagudo.id+':trait:magical-linguist',yagudo.id+':trait:stability'];
 assert(raceTraits(b).errors.some(x=>/Two selections replace/.test(x)));
 const sturdy=yagudo.data.alternateReplacements.find(x=>x.id.includes(':sturdy-feathers:'));
 assert.equal(sturdy.targetFeatureIds.length,2);
});

test('batch 19 Half-Gigas, Lizardman and Syricta are standard-list monstrous races with guarded unknown choices',()=>{
 const expected=[['half-gigas',13,2,3,0,0],['lizardman',15,2,0,0,0],['syricta',16,8,0,0,2]];
 for(const [name,standard,alternates,herit,favored,pools] of expected){const race=registry.races.find(r=>r.id==='ffd20:race:'+name);assert.equal(race?.testing,true);assert.deepEqual([race.data.standardTraitIds.length,race.data.alternateTraitIds.length,race.data.heritages.length,race.data.favoredRewards.length,race.choicePools.length],[standard,alternates,herit,favored,pools]);const b=newBuild();b.raceId=race.id;assert.deepEqual(raceTraits(b).errors,[]);if(herit){b.heritageId=race.data.heritages[0].id;assert(raceTraits(b).errors.length>0);}}
 let b=newBuild();b.raceId='ffd20:race:half-gigas';assert.deepEqual([effectiveScores(b).str,effectiveScores(b).con,effectiveScores(b).int,effectiveScores(b).wis,effectiveScores(b).cha],[14,12,8,8,8]);
 const half=registry.races.find(x=>x.id===b.raceId);assert.deepEqual(half.data.heritages.map(x=>x.name),['Fire Gigas','Ice Gigas','Thunder Gigas']);
 const lizard=registry.races.find(x=>x.id==='ffd20:race:lizardman');b=newBuild();b.raceId=lizard.id;assert.deepEqual([effectiveScores(b).str,effectiveScores(b).dex,effectiveScores(b).cha],[12,12,8]);assert(lizard.features.find(f=>f.name==='Base Speed').effects.some(x=>x.target==='identity.speed.swim'&&x.value.value===60));
 const syricta=registry.races.find(x=>x.id==='ffd20:race:syricta');b=newBuild();b.raceId=syricta.id;assert.deepEqual(syricta.choicePools.map(x=>x.options.length),[6,2]);assert(buildIssues(b).some(x=>/Elemental Resistance selection/.test(x.message)));assert(buildIssues(b).some(x=>/Breath Weapon selection/.test(x.message)));assert(syricta.features.find(f=>f.name==='Base Speed').effects.some(x=>x.target==='identity.speed.fly'&&x.value.value===40));
 b.alternateIds=[syricta.id+':trait:wing-clipped'];assert.deepEqual(raceTraits(b).errors,[]);assert.equal(effectiveScores(b).dex,10);
});

test('Beastkin saved official page has complete traits and unavailable partial alternates',()=>{
 const r=registry.races.find(x=>x.id==='ffd20:race:beastkin'),b=newBuild();assert(r?.testing);
 assert.deepEqual([r.data.standardTraitIds.length,r.data.alternateTraitIds.length,r.data.heritages.length,r.data.favoredRewards.length],[14,10,0,0]);
 assert.deepEqual(r.data.alternateReplacements.filter(o=>o.resolution==='unresolved').map(o=>o.addsFeatureIds[0].split(':').at(-1)),['alluring','feral','light-build','loper']);
 b.raceId=r.id;assert.deepEqual([effectiveScores(b).str,effectiveScores(b).wis,effectiveScores(b).int],[12,12,8]);
 assert.deepEqual(raceTraits(b).errors,[]);assert.equal(r.features.find(f=>f.name==='Hunter').effects.length,2);
 b.alternateIds=[r.id+':trait:alluring'];assert.deepEqual(raceTraits(b).errors,[]);assert.deepEqual([effectiveScores(b).str,effectiveScores(b).wis,effectiveScores(b).int,effectiveScores(b).cha],[12,10,8,12]);
 b.alternateIds=[r.id+':trait:civilized'];assert.deepEqual(raceTraits(b).errors,[]);
 b.alternateIds=[r.id+':trait:civilized',r.id+':trait:influential'];assert(raceTraits(b).errors.some(x=>/Two selections replace/.test(x)));
});
