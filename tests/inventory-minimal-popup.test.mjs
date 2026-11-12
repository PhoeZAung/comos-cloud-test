import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderSection,renderSheetFrame} from '../src/features/sheet/view.mjs';

test('inventory is a compact row list with clickable details and quantity, not a wall of actions',()=>{
 const data={items:[
  {name:'Potion of Healing',amount:3,cost:'50 gil',sourceCategory:'Alchemical Items',desc:'Heals 2d4+2 hit points.'},
  {name:'Iron Shield',amount:1,cost:'125 gil',sourceCategory:'Armor',equipped:true,equip_slot:'shield'}
 ]};
 const html=renderSection({id:'hero',name:'Hero',data},'items',{itemView:'inventory'});
 assert.match(html,/class="cs-entry cs-inventory-row"/);
 assert.match(html,/data-item-description="items:0" aria-haspopup="dialog"/);
 assert.match(html,/data-item-description="items:1" aria-haspopup="dialog"/);
 assert.match(html,/cs-inventory-qty[^>]*>× 3<\/span>/);
 assert.match(html,/cs-inventory-label[^>]*><strong>Iron Shield<\/strong><small>Equipped<\/small>/);
 assert.doesNotMatch(html,/data-edit-entry="items:/);
 assert.doesNotMatch(html,/data-remove-entry="items:/);
 assert.doesNotMatch(html,/data-favorite="items:/);
 assert.doesNotMatch(html,/Heals 2d4|50 gil|125 gil/,'description and cost stay in popup');
});

test('compact inventory escapes catalog names and quantity when constructing the preview',()=>{
 const html=renderSection({data:{items:[{name:'<img src=x onerror=alert(1)>',amount:'<svg onload=alert(1)>',sourceCategory:'Gear'}]}},'items');
 assert.doesNotMatch(html,/<img src=x|<svg onload/);
 assert.match(html,/&lt;img/);
 assert.match(html,/&lt;svg/);
});

test('item dialog has top Qty and Amount, with item actions after details',async()=>{
 const html=renderSheetFrame({id:'hero',name:'Hero',kind:'player',data:{items:[]}},'items');
 const dialog=html.match(/<dialog class="cs-dialog cs-item-description-dialog[\s\S]+?<\/dialog>/)?.[0]||'';
 assert.ok(dialog.includes('data-item-qty'));
 assert.ok(dialog.includes('data-item-amount'));
 assert.ok(dialog.indexOf('data-item-qty')<dialog.indexOf('data-item-details'));
 assert.ok(dialog.indexOf('data-item-amount')<dialog.indexOf('data-item-description-text'));
 assert.ok(dialog.indexOf('data-item-popup-edit')>dialog.indexOf('data-item-description-text'));
 assert.match(dialog,/data-item-popup-favorite/);
 assert.match(dialog,/data-item-popup-remove/);
 const code=await readFile('src/ui/sheet.mjs','utf8');
 assert.match(code,/inventoryItemValue\(item,'amount'\)/);
 assert.match(code,/inventoryItemValue\(item,'cost'\)/);
 assert.match(code,/favorite\.dataset\.favorite=collection\+':'\+index/);
 assert.match(code,/edit\.dataset\.editEntry=collection\+':'\+index/);
 assert.match(code,/remove\.dataset\.removeEntry=collection\+':'\+index/);
});
