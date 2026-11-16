import test from 'node:test';
import assert from 'node:assert/strict';
import {KINGMAKER_STAGED_ENTRIES,kingmakerProgress} from '../src/data/kingmaker/catalog.mjs';
import {KINGMAKER_BESTIARY_BATCH_001} from '../src/data/kingmaker/bestiary-batch-001.mjs';
import {KINGMAKER_BESTIARY_AUTO_002} from '../src/data/kingmaker/bestiary-auto-batch-002.mjs';
import {KINGMAKER_NPC_CODEX_AUTO_001} from '../src/data/kingmaker/npc-codex-auto-batch-001.mjs';
import {KINGMAKER_BESTIARY_PDF_STRENGTH,KINGMAKER_NPC_PDF_STRENGTH,validateKingmakerStrengthOrder} from '../src/data/kingmaker/strength-source-order.mjs';

test('105+105 PDF heading name fingerprints prevent misaligned numeric Strength imports',()=>{
 const sourceBestiary=[...KINGMAKER_BESTIARY_BATCH_001,...KINGMAKER_BESTIARY_AUTO_002];
 assert.equal(validateKingmakerStrengthOrder(sourceBestiary,KINGMAKER_NPC_CODEX_AUTO_001),true);
 assert.equal(KINGMAKER_BESTIARY_PDF_STRENGTH.length,105);
 assert.equal(KINGMAKER_NPC_PDF_STRENGTH.length,105);
 assert.throws(()=>validateKingmakerStrengthOrder([...sourceBestiary].reverse(),KINGMAKER_NPC_CODEX_AUTO_001),/source order changed/);
 assert.throws(()=>validateKingmakerStrengthOrder(sourceBestiary,[...KINGMAKER_NPC_CODEX_AUTO_001].reverse()),/source order changed/);
 assert.throws(()=>validateKingmakerStrengthOrder(sourceBestiary.slice(1),KINGMAKER_NPC_CODEX_AUTO_001),/source order changed/);
});

test('PDF heading Strength persists across both reviewed and unreviewed records',()=>{
 const lookup=(name,chapter)=>KINGMAKER_STAGED_ENTRIES.find(e=>e.name===name&&e.chapter===chapter);
 for(const [chapter,name,str] of [
  ['npc-codex','Aecora Silverfire',20],
  ['npc-codex','Agai',14],
  ['npc-codex','Alasen',25],
  ['npc-codex','Zorek',24]
 ]){
  const entry=lookup(name,chapter);
  assert.equal(entry.stats.str,str,name);
  assert.equal(entry.verified,name==='Zorek'?'automated-needs-review':'transcribed-from-PDF',name);
  assert.match(entry.text.importNotes,name==='Zorek'?/Strength extracted from PDF/:/Source-reviewed printed/,name);
 }
 for(const [chapter,name] of [
  ['bestiary','Ghostly Guard'],
  ['npc-codex','Fionn'],
  ['npc-codex','Xae']
 ]){
  const entry=lookup(name,chapter);
  assert.ok(entry.stats.str==null,'a printed dash stays null or undefined, never numeric zero');
 }
 assert.equal(lookup('Zombie Hulk','bestiary').stats.str,25,'last Bestiary creature retains extracted Strength');
 assert.equal(lookup('Zombie Hulk','bestiary').verified,'transcribed-from-PDF','entire Bestiary chapter is now source-reviewed');
 assert.equal(KINGMAKER_STAGED_ENTRIES.find(e=>e.chapter==='bestiary'&&e.name==='Thorn River Bandit').verified,'transcribed-from-PDF',
  'Thorn River Bandit is now part of the 21–30 reviewed batch');
 assert.equal(KINGMAKER_STAGED_ENTRIES.find(e=>e.name==='Goblin Pyro'&&e.chapter==='bestiary').verified,'transcribed-from-PDF',
  'Goblin Pyro is now part of source-reviewed batch 41–50');
 assert.equal(KINGMAKER_STAGED_ENTRIES.find(e=>e.name==='Lerritan'&&e.chapter==='bestiary').verified,'transcribed-from-PDF',
  'Lerritan has advanced to source-reviewed batch 61–70');
 assert.equal(KINGMAKER_BESTIARY_AUTO_002.find(e=>e.name==='Thorn River Bandit').stats.str,undefined,
  'automated source file stays intact for audit');
 assert.ok(kingmakerProgress().map(x=>x.reviewed)[0]>=50,'at least 50 source-checked bestiary records must remain reviewed');
 assert.deepEqual(kingmakerProgress().map(x=>x.staged),[105,105,0,7]);
});
