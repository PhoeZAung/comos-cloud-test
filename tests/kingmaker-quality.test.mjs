import test from 'node:test';
import assert from 'node:assert/strict';
import {KINGMAKER_STAGED_ENTRIES,kingmakerProgress} from '../src/data/kingmaker/catalog.mjs';
import {kingmakerLayoutIssues,withKingmakerReviewFlags,withKingmakerCleanText} from '../src/data/kingmaker/quality.mjs';
import {extractKingmakerChapter} from '../scripts/kingmaker-extract-layout.mjs';
import {KINGMAKER_BESTIARY_AUTO_002} from '../src/data/kingmaker/bestiary-auto-batch-002.mjs';

const get=name=>KINGMAKER_STAGED_ENTRIES.find(e=>e.name===name);

test('preserve previously hand-checked entries without changing their data',()=>{
 const curated=KINGMAKER_STAGED_ENTRIES.slice(0,10);
 assert.equal(curated.length,10);
 assert.ok(curated.every(e=>e.verified==='transcribed-from-PDF'));
 assert.ok(curated.every(e=>!e.reviewFlags?.length));
 assert.equal(curated[0].hp,78);
 assert.equal(curated[0].stats.ac,15);
});

test('raw extraction retains detectable PDF spills while reviewed overlay resolves them',()=>{
 const rawName=name=>KINGMAKER_BESTIARY_AUTO_002.find(e=>e.name===name);
 const rawWarden=withKingmakerReviewFlags(rawName('Boggard Warden'),['Boggard Warden']);
 assert.ok(rawWarden.reviewFlags.some(f=>f.includes('layout bleed')&&f.includes('combatGear')));
 const rawTormentor=withKingmakerReviewFlags(rawName('Bugbear Tormentor'),['Cauthooj']);
 assert.ok(rawTormentor.reviewFlags.some(f=>f.toUpperCase().includes('CAUTHOOJ')));
 for(const name of ['Boggard Warden','Bugbear Tormentor']){
  const checked=get(name);
  assert.equal(checked.verified,'transcribed-from-PDF');
  assert.deepEqual(checked.reviewFlags,[]);
 }
});

test('quality checks preserve input stat blocks and remain idempotent',()=>{
 const entry={name:'Test Creature',chapter:'bestiary',verified:'automated-needs-review',
  hp:20,stats:{ac:15,cr:3,xp:800},text:{gear:'longsword NEXT MONSTER A different creature'},
  weapons:[],npcSkills:[],reviewFlags:[]};
 const original=JSON.stringify(entry);
 const assessed=withKingmakerReviewFlags(entry,['Test Creature','Next Monster']);
 assert.equal(JSON.stringify(entry),original,'input is untouched');
 assert.equal(assessed.hp,entry.hp);
 assert.deepEqual(assessed.stats,entry.stats);
 assert.ok(assessed.reviewFlags.some(f=>f.includes('Next Monster')));
 assert.deepEqual(withKingmakerReviewFlags(assessed,['Test Creature','Next Monster']).reviewFlags,assessed.reviewFlags);
 assert.deepEqual(kingmakerLayoutIssues({...entry,text:{}},[]),[]);
});

test('report still tracks all staged records separately from review readiness',()=>{
 assert.equal(KINGMAKER_STAGED_ENTRIES.length,217);
 assert.equal(new Set(KINGMAKER_STAGED_ENTRIES.map(e=>e.chapter+':'+e.slug)).size,217);
 const p=kingmakerProgress();
 assert.deepEqual(p.map(x=>x.staged),[105,105,0,7]);
 assert.deepEqual(p.map(x=>x.reviewed),[30,0,0,0]);
 assert.deepEqual(p.map(x=>x.imported),[0,0,0,0]);
 assert.ok(p[0].flagged>=1);
 assert.ok(p[1].flagged>=1);
});

test('two-column PDF headings near the cropped column boundary are not skipped',()=>{
 const right=(left,title,cr)=>left.padEnd(57)+title.padEnd(53)+'CR '+cr;
 const pages=[{page:40,text:[
  right('OFFENSE','IRLGAUNT','13'),
  'Speed 20 ft.'.padEnd(57)+'XP 25,600',
  right('STATISTICS','GRIMSTALKER','5'),
  'Str 20, Dex 12'.padEnd(57)+'XP 1,600'
 ].join('\n')}];
 const rows=extractKingmakerChapter(pages,'bestiary');
 assert.deepEqual(rows.map(e=>e.name),['Irlgaunt','Grimstalker']);
});


test('stage view shows source-reviewed corrections without changing the raw extraction',()=>{
 const bugbear=get('Bugbear Tormentor');
 assert.equal(bugbear.text.gear,'Daggers (6), masterwork sickles (2).');
 assert.equal(bugbear.stats.cr,3);
 assert.equal(bugbear.hp,39);
 assert.ok(!bugbear.text.gear.includes('CAUTHOOJ'));
 assert.ok(KINGMAKER_BESTIARY_AUTO_002.find(e=>e.name===bugbear.name).text.gear.includes('CAUTHOOJ'));
 const frog=get('Giant Frog Companion');
 assert.equal(frog.text.skillDetail,'Perception +7, Swim +15');
 assert.equal(frog.stats.cr,undefined,'unranked animal companion remains unranked');
 assert.equal(frog.stats.xp,undefined,'no XP manufactured');
 const warden=get('Boggard Warden');
 assert.ok(!warden.text.combatGear.includes('KINGMAKER'));
 assert.equal(warden.stats.str,18);
});

test('does not trim ordinary prose, curated monsters, or unrelated fields',()=>{
 const rec={name:'Longtail',verified:'automated-needs-review',hp:27,stats:{cr:3,ac:15},
  text:{gear:'A hunter uses a BOG STRIDER figurine in his campsite',languages:'Common'},
  weapons:[{name:'Spear',damage:'1d8'}],reviewFlags:[]};
 const cleaned=withKingmakerCleanText(rec,['Longtail','Bog Strider']);
 assert.equal(cleaned.text.gear,'A hunter uses a BOG STRIDER figurine in his campsite');
 assert.strictEqual(cleaned,rec,'unexpected narrative heading is not stripped');
 assert.strictEqual(withKingmakerCleanText({...rec,verified:'transcribed-from-PDF'},['Bog Strider']).text,rec.text);
});


test('sidebar cleanup removes labels but retains feat and spell continuations',()=>{
 const murder=get('Murder Of Crows');
 assert.match(murder.text.feats,/Mobility, Skill Focus \(Perception\), Toughness/);
 assert.ok(!murder.text.feats.includes('CHAPTER 4'));
 assert.ok(!murder.text.feats.includes('COMPANIONS'));
 const pyro=get('Goblin Pyro');
 assert.match(pyro.text.spellLikeAbilities,/burning hands/);
 assert.match(pyro.text.spellLikeAbilities,/acid splash/);
 assert.ok(!pyro.text.spellLikeAbilities.includes('COMPANIONS'));
 const giant=get('Kargstaad’s Giant');
 assert.match(giant.text.feats,/Improved Overrun, Improved Sunder/);
 assert.ok(!giant.text.feats.includes('KINGMAKER BESTIARY'));
});
