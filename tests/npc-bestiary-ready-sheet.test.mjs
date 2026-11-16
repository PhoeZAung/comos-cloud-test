import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {npcStatLabels,npcTextLabels,npcStatGroups,npcTextGroups,normalizeNpcSheet,parseNpcStatBlock} from '../src/features/characters/npc-stat-block.mjs';
import {renderSheetFrame} from '../src/features/sheet/view.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';

test('PF1e Bestiary source fields are nullable and editable without inventing missing values',()=>{
 const numeric=['cr','xp','hitDice','space','sourcePage','initiative','ac','touch','flat','fort','ref','will'];
 const texts=['source','sourceReference','raceClassLevels','alignment','size','creatureType','subtypes','senses','aura','weaknesses','specialAttacks','specialAbilities','spellLikeAbilities','spellsPrepared','spellsKnown','description','environment','organization','treasure','combatGear','tactics'];
 const data=normalizeNpcSheet({});
 for(const key of numeric){
  assert.ok(npcStatGroups.some(group=>group.keys.includes(key)),key+' has an editor');
  assert.equal(data.npcStats[key],null,key+' unknown, not 0');
  assert.equal(typeof npcStatLabels[key],'string');
 }
 for(const key of texts){
  assert.ok(npcTextGroups.some(group=>group.keys.includes(key)),key+' has an editor');
  assert.equal(data.npcText[key],null,key+' unknown');
  assert.equal(typeof npcTextLabels[key],'string');
 }
});

test('Kingmaker PF1e staged stat notes recognize comma-separated XP, hit dice, space and spell categories',()=>{
 const note=[
 '# Giant Animated Statue','| XP | 3,200 |','| CR | 7 |',
 '| HP | 78 (7 HD; 7d10+40) |','| Space | 15 ft. |',
 '| AC | 15, touch 6, flat-footed 15 |',
 '| Aura | fear (20 ft., DC 15) |','| Special Attacks | fire breath |',
 '| Spell-Like Abilities | At will—detect magic |'
 ].join('\n');
 const {data}=parseNpcStatBlock(note);
 assert.equal(data.npcStats.xp,3200);
 assert.equal(data.npcStats.cr,7);
 assert.equal(data.npcStats.hitDice,7);
 assert.equal(data.npcStats.space,15);
 assert.equal(data.hp_max,78);
 assert.equal(data.npcText.aura,'fear (20 ft., DC 15)');
 assert.equal(data.npcText.spellLikeAbilities,'At will—detect magic');
});

test('high-CR XP and longer printed special-ability prose survive server validation',()=>{
 let data=normalizeNpcSheet({});
 data=mergeSheetData(data,{action:'npcStats',fields:{cr:17,xp:102400,hitDice:20,space:10,sourcePage:11}},{npc:true});
 assert.deepEqual([data.npcStats.cr,data.npcStats.xp,data.npcStats.hitDice,data.npcStats.space,data.npcStats.sourcePage],[17,102400,20,10,11]);
 const prose='Rules text '.repeat(600);
 data=mergeSheetData(data,{action:'npcText',fields:{specialAbilities:prose,sourceReference:'Kingmaker Bestiary (First Edition), p. 11',raceClassLevels:'Ankou assassin 6'}},{npc:true});
 assert.equal(data.npcText.specialAbilities,prose);
 assert.match(data.npcText.sourceReference,/Kingmaker/);
 assert.throws(()=>mergeSheetData(data,{action:'npcStats',fields:{xp:100000001}},{npc:true}),/valid|number/);
});

test('NPC sheet uses only Combat, Core and Abilities with sword before shield, no shared HP or summary',()=>{
 const data=normalizeNpcSheet({hp_curr:28,hp_max:30,npcStats:{cr:5,xp:1600,initiative:6,ac:19,speed:30}});
 const html=renderSheetFrame({id:'npc-fixture',kind:'npc',name:'Test Creature',data},'overview',{admin:true});
 for(const id of ['combat','core','abilities'])assert.match(html,new RegExp('data-npc-tab="'+id+'"'));
 assert.equal((html.match(/data-npc-tab="/g)||[]).length,3);
 assert.equal((html.match(/data-npc-panel="/g)||[]).length,3);
 assert.match(html,/data-npc-panel="combat"/);
 assert.match(html,/data-npc-panel="core"[^>]*hidden/);
 assert.match(html,/data-npc-panel="abilities"[^>]*hidden/);
 assert.ok(html.indexOf('data-combat-details="attack"')<html.indexOf('data-combat-details="defense"'),'sword is left of shield');
 assert.match(html,/data-combat-details="defense"[^>]*aria-label="Show NPC defenses and saving throws; AC 19"/);
 assert.match(html,/cs-ac-outline/);
 assert.match(html,/data-add-entry="weapons"/);
 assert.match(html,/data-edit-stats="npcAbilityScores"/);
 assert.match(html,/data-edit-stats="npcCoreStats"/);
 assert.match(html,/data-edit-stats="npcGear"/);
 assert.match(html,/data-add-entry="npcSkills"/);
 assert.match(html,/data-add-entry="activeAbilities"/);
 assert.match(html,/data-edit-stats="npcFeats"/);
 assert.doesNotMatch(html,/cs-npc-glance|data-edit-stats="npcHealth"|cs-resource-hp|data-resource="hp_curr"/);
 assert.doesNotMatch(html,/>XP<|>CR<|>Current HP<|>Max HP</);
});
test('NPC tabs stay selected across server sync; empty picker does not list NPCs before searching',async()=>{
 const sheet=await readFile(new URL('../src/ui/sheet.mjs',import.meta.url),'utf8');
 const picker=await readFile(new URL('../src/owlbear/action.mjs',import.meta.url),'utf8');
 assert.match(sheet,/function activateNpcTab/);
 assert.match(sheet,/activateNpcTab\(npcView\)/);
 assert.match(sheet,/npcView,scrollY/);
 assert.match(sheet,/button\.matches\('\[data-npc-tab\]'\)/);
 assert.match(sheet,/ArrowRight/);
 assert.match(picker,/!c\.npc\|\|query\.length>0/);
 assert.match(picker,/query\?filtered\.length\+' matching sheets'/);
});
