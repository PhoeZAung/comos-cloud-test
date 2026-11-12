import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderSheetFrame,entryDetail,actionIcon} from '../src/features/sheet/view.mjs';

test('Ability + and Group controls appear above Limit Break, and + opens manual directly',async()=>{
 const frame=renderSheetFrame({id:'hero',name:'Hero',kind:'player',owned:true,data:{
  activeAbilities:[{name:'Limit Break',limitBreak:true,desc:'Limit'}],
  feats:[],passiveAbilities:[],racialAbilities:[]
 }},'abilities',{ability:'activeAbilities'});
 assert.match(frame,/<button[^>]*data-add-manual-ability[^>]*>\+<\/button>/);
 assert.match(frame,/data-add-ability-group="activeAbilities"/);
 assert.doesNotMatch(frame,/<summary aria-label="Add an ability"/);
 assert.doesNotMatch(frame,/\+ Ability<\/summary>/);
 assert.ok(frame.indexOf('data-add-manual-ability')<frame.indexOf('cs-limit-breaks'),'Ability controls must be above Limit Break');
 const code=await readFile(new URL('../src/ui/sheet.mjs',import.meta.url),'utf8');
 assert.match(code,/if\(button\.matches\('\[data-add-manual-ability\]'\)\)/);
 assert.match(code,/editEntry\(ability,null\)/);
 assert.match(code,/data-editor-premade/);
});

test('Long popup scrolls inside a stable, glowing outer dialog instead of clipping the star border',async()=>{
 const frame=renderSheetFrame({id:'hero',name:'Hero',data:{}},'abilities');
 assert.match(frame,/<dialog class="cs-dialog cs-entry-popup cs-star-border"[^>]*><div class="cs-entry-popup-scroll">/);
 assert.match(frame,/<div data-entry-popup-content><\/div><\/div><\/dialog>/);
 const css=await readFile(new URL('../src/styles/sheet-refinements.css',import.meta.url),'utf8');
 assert.match(css,/\.cs-dialog\.cs-entry-popup\{padding:0;overflow:visible/);
 assert.match(css,/\.cs-entry-popup>\.cs-entry-popup-scroll\{[^}]*overflow-y:auto/);
 assert.match(css,/\.cs-entry-popup \.cs-prose[^}]*max-height:none;overflow:visible/);
});

test('ability preview presents exactly one Action type while leaving legacy wizard type data unchanged',()=>{
 const original={name:'Slash',type:'Move',action_type:'Standard',desc:'Dash'};
 const html=entryDetail(original,{},'activeAbilities');
 assert.match(html,/<dt>Action type<\/dt><dd>Standard<\/dd>/);
 assert.doesNotMatch(html,/<dt>Type<\/dt>/);
 assert.deepEqual(original,{name:'Slash',type:'Move',action_type:'Standard',desc:'Dash'});
 const legacy=entryDetail({name:'Old',type:'Move'}, {},'racialAbilities');
 assert.match(legacy,/<dt>Action type<\/dt><dd>Move<\/dd>/);
 assert.doesNotMatch(legacy,/<dt>Type<\/dt>/);
 const cleared=entryDetail({name:'None',type:'Move',action_type:''},{},'passiveAbilities');
 assert.match(cleared,/<dt>Action type<\/dt><dd>None<\/dd>/);
 assert.equal(actionIcon({type:'Move',action_type:''}),'');
 const spell=entryDetail({name:'Spell',type:'Arcane',desc:'Description'},{},'spells');
 assert.match(spell,/<dt>Type<\/dt><dd>Arcane<\/dd>/);
});

test('item text inputs and server match 12k characters; reject invalid input with field-specific message',async()=>{
 const text='Heritage lore. '.repeat(140); // 2,100 characters, over old 1,200 cap
 const original={items:[{name:'Imported',sourceCategory:'Magic Items',special:'Before'}],gil:3};
 const saved=mergeSheetData(original,{action:'entry',collection:'items',mode:'update',index:0,fields:{special:text,type:text,sourceCategory:'Magic Items'}});
 assert.equal(saved.items[0].special,text);
 assert.equal(saved.items[0].type,text);
 const long='Long imported description. '.repeat(680); // > 12,000 characters
 const large=mergeSheetData(original,{action:'entry',collection:'items',mode:'update',index:0,fields:{desc:long,special:long}});
 assert.equal(large.items[0].desc,long);
 assert.equal(large.items[0].special,long);
 assert.equal(original.items[0].special,'Before');
 assert.equal(mergeSheetData(original,{action:'entry',collection:'items',mode:'update',index:0,fields:{special:'z'.repeat(30001)}}).items[0].special.length,30000);
 assert.equal(mergeSheetData(original,{action:'entry',collection:'items',mode:'update',index:0,fields:{type:'z'.repeat(12001)}}).items[0].type.length,12000);
 assert.equal(mergeSheetData(original,{action:'entry',collection:'items',mode:'update',index:0,fields:{img:'z'.repeat(2049)}}).items[0].img,'');
 assert.equal(mergeSheetData(original,{action:'entry',collection:'items',mode:'update',index:0,fields:{type:'Bad\u0001text'}}).items[0].type,'Badtext');
 const ui=await readFile(new URL('../src/ui/sheet.mjs',import.meta.url),'utf8');
 assert.match(ui,/key==='link'\|\|item&&key==='img'\?2048:12000/);
 assert.match(ui,/item&&key==='desc'\?30000:12000/);
 assert.match(ui,/item&&key==='special'\?30000:12000/);
});
