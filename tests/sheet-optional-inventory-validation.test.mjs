import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {normalizeInventoryText} from '../src/features/sheet/inventory-fields.mjs';
import {renderSheetFrame} from '../src/features/sheet/view.mjs';

test('legacy cost and optional shop attributes never block unrelated inventory edits',()=>{
 const source={name:'Huge catalog entry',sourceCategory:'Magic Items',cost:'Unusable\u0001 cost '+ 'X'.repeat(15000),type:'Strange\u0007',rarity:'Very Rare\u001b',special:'Details'};
 const original={items:[source],currency_gil:10};
 const after=mergeSheetData(original,{action:'entry',collection:'items',mode:'update',index:0,fields:{
   name:'Updated name',cost:source.cost,type:source.type,rarity:source.rarity,special:source.special
 }});
 assert.equal(after.items[0].name,'Updated name');
 assert.equal(after.items[0].cost.length,12000);
 assert.ok(!after.items[0].cost.includes('\u0001'));
 assert.equal(after.items[0].type,'Strange');
 assert.equal(after.items[0].rarity,'Very Rare');
 assert.equal(after.items[0].special,'Details');
 assert.equal(original.items[0].name,'Huge catalog entry');
 assert.equal(original.items[0].cost,source.cost);
 assert.equal(after.currency_gil,10);
});

test('all optional inventory fields sanitize invalid values without losing valid fields',()=>{
 const weird={items:[{name:'Imported',sourceCategory:'Weapon',weight:5}]};
 const changed=mergeSheetData(weird,{action:'entry',collection:'items',mode:'update',index:0,fields:{
   cost:{unexpected:'object'},special:'\u0000A\u0001B',type:null,weight:'unknown',proficiency:'Heavy\u0003',usageType:'Unusual'.repeat(3000)
 }});
 assert.equal(changed.items[0].cost,'');
 assert.equal(changed.items[0].special,'AB');
 assert.equal(changed.items[0].type,'');
 assert.equal(changed.items[0].weight,5); // invalid nonessential numeric metadata is ignored
 assert.equal(changed.items[0].proficiency,'Heavy');
 assert.equal(changed.items[0].usageType.length,12000);
 const parsed=mergeSheetData(weird,{action:'entry',collection:'items',mode:'update',index:0,fields:{weight:'12.5 lb',cost:1234}});
 assert.equal(parsed.items[0].weight,12.5);
 assert.equal(parsed.items[0].cost,'1234');
 assert.throws(()=>mergeSheetData(weird,{action:'entry',collection:'items',mode:'update',index:0,fields:{name:''}}),/Enter a name/);
 assert.throws(()=>mergeSheetData(weird,{action:'entry',collection:'items',mode:'update',index:0,fields:{adminOnly:true}}),/not available|Invalid entry/);
});

test('optional metadata cleanup is capped and does not execute or interpret markup',()=>{
 const input='<img src=x onerror=alert(1)>\u0000';
 assert.equal(normalizeInventoryText(input,'cost'),'<img src=x onerror=alert(1)>');
 assert.equal(normalizeInventoryText(null,'cost'),'');
 assert.equal(normalizeInventoryText({foo:'bar'},'cost'),'');
 assert.equal(normalizeInventoryText('Z'.repeat(35000),'cost').length,12000);
 assert.equal(normalizeInventoryText('Z'.repeat(35000),'desc').length,30000);
});

test('edit dialog star stays around visible border when form contents scroll',async()=>{
 const frame=renderSheetFrame({id:'hero',name:'Hero',data:{items:[]}},'items');
 assert.match(frame,/<dialog class="cs-dialog" data-sheet-dialog[^>]*><div class="cs-sheet-dialog-scroll"><form data-sheet-form>/);
 assert.match(frame,/<\/form><\/div><\/dialog>/);
 const css=await readFile(new URL('../src/styles/sheet-refinements.css',import.meta.url),'utf8');
 assert.match(css,/\.cs-dialog\.cs-star-border\[data-sheet-dialog\]\{padding:0;overflow:visible/);
 assert.match(css,/\.cs-dialog\[data-sheet-dialog\]>\.cs-sheet-dialog-scroll\{[^}]*overflow-y:auto/);
 const ui=await readFile(new URL('../src/ui/sheet.mjs',import.meta.url),'utf8');
 assert.match(ui,/normalizeInventoryText\(display,key\)/);
 assert.match(ui,/normalizeInventoryText\(value,key\)/);
 assert.match(ui,/\.classList\.add\('cs-star-border'\)/);
});
