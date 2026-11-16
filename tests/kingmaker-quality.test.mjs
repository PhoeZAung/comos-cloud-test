import test from 'node:test';
import assert from 'node:assert/strict';
import {KINGMAKER_STAGED_ENTRIES,kingmakerProgress} from '../src/data/kingmaker/catalog.mjs';
import {kingmakerLayoutIssues,withKingmakerReviewFlags} from '../src/data/kingmaker/quality.mjs';
import {extractKingmakerChapter} from '../scripts/kingmaker-extract-layout.mjs';

const get=name=>KINGMAKER_STAGED_ENTRIES.find(e=>e.name===name);

test('preserve previously hand-checked entries without changing their data',()=>{
 const curated=KINGMAKER_STAGED_ENTRIES.slice(0,10);
 assert.equal(curated.length,10);
 assert.ok(curated.every(e=>e.verified==='transcribed-from-PDF'));
 assert.ok(curated.every(e=>!e.reviewFlags?.length));
 assert.equal(curated[0].hp,78);
 assert.equal(curated[0].stats.ac,15);
});

test('flag obvious PDF page header and neighboring creature bleed',()=>{
 const warden=get('Boggard Warden');
 assert.ok(warden.reviewFlags.some(f=>f.includes('layout bleed')&&f.includes('combatGear')));
 const tormentor=get('Bugbear Tormentor');
 assert.ok(tormentor.reviewFlags.some(f=>f.includes('CAUTHOOJ')));
 assert.equal(warden.verified,'automated-needs-review');
 assert.equal(tormentor.verified,'automated-needs-review');
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
 assert.deepEqual(p.map(x=>x.reviewed),[10,0,0,0]);
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
