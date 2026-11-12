import test from 'node:test';
import assert from 'node:assert/strict';
import {npcStatGroups,npcTextGroups,npcStatLabels,npcTextLabels,normalizeNpcSheet,parseNpcStatBlock} from '../src/features/characters/npc-stat-block.mjs';
import {renderSheetFrame} from '../src/features/sheet/view.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';

const character=data=>({id:'npc-id',name:'Unknown Guard',kind:'npc',data});
test('every supported NPC stat and detail is grouped, labelled, and nullable by default',()=>{
 const data=normalizeNpcSheet({});
 for(const key of npcStatGroups.flatMap(g=>g.keys)){
  assert.equal(typeof npcStatLabels[key],'string',key+' is labelled');
  assert.equal(data.npcStats[key],null,key+' is explicitly unset');
 }
 for(const key of npcTextGroups.flatMap(g=>g.keys)){
  assert.equal(typeof npcTextLabels[key],'string',key+' is labelled');
  assert.equal(data.npcText[key],null,key+' is explicitly unset');
 }
 for(const key of ['hp_curr','hp_max','hp_temp','mp_curr','mp_max'])assert.equal(data[key],null,key);
 assert.equal(data.npcStats.ac,null);assert.equal(data.npcStats.sr,null);
});
test('NPC record preserves manually entered defense values and clearing them stores null, not zero',()=>{
 let data=normalizeNpcSheet({});
 data=mergeSheetData(data,{action:'npcStats',fields:{ac:'21',touch:'11',fort:'8',sr:'19',dr:'5',spellDC:'24',reach:'10'}},{npc:true});
 assert.deepEqual([data.npcStats.ac,data.npcStats.fort,data.npcStats.dr,data.npcStats.sr,data.npcStats.spellDC],[21,8,5,19,24]);
 data=mergeSheetData(data,{action:'npcStats',fields:{sr:'',fort:'',reach:''}},{npc:true});
 assert.equal(data.npcStats.sr,null);
 assert.equal(data.npcStats.fort,null);
 assert.equal(data.npcStats.reach,null);
 assert.equal(data.npcStats.dr,5);
 data=mergeSheetData(data,{action:'npcText',fields:{immunities:'fire, poison',drBypass:'silver'}},{npc:true});
 assert.equal(data.npcText.immunities,'fire, poison');
 data=mergeSheetData(data,{action:'npcText',fields:{immunities:''}},{npc:true});
 assert.equal(data.npcText.immunities,null);
});
test('NPC health fields can be genuinely unset',()=>{
 let data=normalizeNpcSheet({});
 data=mergeSheetData(data,{action:'fields',fields:{hp_curr:20,hp_max:30,hp_temp:5}},{npc:true});
 data=mergeSheetData(data,{action:'fields',fields:{hp_curr:null,hp_max:null,hp_temp:null}},{npc:true});
 assert.equal(data.hp_curr,null);assert.equal(data.hp_max,null);assert.equal(data.hp_temp,null);
});
test('NPC import keeps absent fields null and parses explicit existing defenses',()=>{
 const result=parseNpcStatBlock('# Goblin Captain\n| AC | 17, touch 13, flat-footed 14 |\n| HP | 26 |\n| SR | 15 |\n| Fort | +7 |\n| Speed | 30 ft, fly 40 ft |').data;
 assert.equal(result.npcStats.ac,17);
 assert.equal(result.npcStats.fort,7);
 assert.equal(result.npcStats.sr,15);
 assert.equal(result.npcStats.flySpeed,40);
 assert.equal(result.npcStats.dr,null);
 assert.equal(result.npcStats.will,null);
 assert.equal(result.npcText.immunities,null);
});
test('NPC sheet renders every unset defense explicitly instead of hiding it',()=>{
 const html=renderSheetFrame(character(normalizeNpcSheet({})),'overview',{admin:true});
 for(const label of ['Damage reduction (DR)','Spell resistance (SR)','Fortitude','Reflex','Will','Save modifiers','Special save rules'])
  assert.ok(html.includes(label),label+' visible');
 assert.match(html,/cs-metric-unset/);
 assert.match(html,/data-edit-stats="npcStats:0"/);
 assert.match(html,/data-edit-stats="npcText:1"/);
 assert.match(html,/—/);
 assert.doesNotMatch(html,/data-roll="Fortitude"/,'unset save may not be rolled as +0');
});
