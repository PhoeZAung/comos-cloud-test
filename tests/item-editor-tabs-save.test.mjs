import test from 'node:test';
import assert from 'node:assert/strict';
import {renderItemEditorTabs,collectItemEditorFields} from '../src/features/sheet/item-editor-tabs.mjs';
import {inventoryEditorKeys} from '../src/features/sheet/inventory-fields.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';

const render=key=>'<label><input name="'+key+'"></label>';

test('item editor provides two accessible tabs, core fields and category-specific stats',()=>{
 const cases=[
  ['Weapon','Weapon Stats','dmg','crit'],
  ['Armor','Armor Stats','acBonus','spellFailure'],
  ['Ranged Weapon','Ranged Weapon Stats','range','ammo'],
  ['Consumables','Consumable Stats','dcSave','duration']
 ];
 for(const [category,label,...requiredFields] of cases){
  const html=renderItemEditorTabs({sourceCategory:category},render,()=>'<div data-source-fields></div>');
  assert.equal((html.match(/role="tab"/g)||[]).length,2);
  assert.match(html,/data-item-edit-tab="details">Item Details/);
  assert.ok(html.includes('data-item-edit-tab="stats">'+label));
  assert.match(html,/data-item-edit-panel="details"/);
  assert.match(html,/data-item-edit-panel="stats"[^>]*hidden/);
  for(const key of ['sourceCategory','name','amount','cost','weight','desc'])assert.match(html,new RegExp('name="'+key+'"'));
  for(const key of requiredFields)assert.match(html,new RegExp('name="'+key+'"'));
  assert.ok(html.indexOf('name="desc"')<html.indexOf('data-item-edit-panel="stats"'));
  assert.ok(html.indexOf('name="special"')>html.indexOf('data-item-edit-panel="stats"'));
  assert.doesNotMatch(html,/name="shopSource"|name="sourceCategoryDetail"|name="itemLevel"|name="pf2eBulk"/);
 }
});

test('imported item shows preserved source fields in stats without forcing hidden metadata to be edited',()=>{
 const item={name:'Old sword',sourceCategory:'Weapon',sourceItemId:'pf1e:108',sourceCatalog:{raw:{Weight:'4 lb',Dmg:'1d8'}},rarity:'Uncommon',shopSource:'pathfinder-1e'};
 const html=renderItemEditorTabs(item,render,()=>'<div data-source-fields><textarea data-source-field-value></textarea></div>');
 assert.match(html,/name="img"/);
 assert.match(html,/name="link"/);
 assert.match(html,/name="carried"/);
 assert.match(html,/name="cl"/);
 assert.match(html,/name="traits"/);
 assert.match(html,/data-source-fields/);
 assert.match(html,/Advanced source columns/);
 assert.doesNotMatch(html,/name="rarity"|name="shopSource"|name="sourceCategoryDetail"/);
});

test('Save collects visible controls across both tabs, omitting hidden metadata and preserving saved fields',()=>{
 const before={items:[{name:'Steel Sword',sourceCategory:'Weapon',amount:1,weight:4,crit:'20/x2',dmg:'1d8',rarity:'Uncommon',type:'Imported','shopSource':'pathfinder-1e',sourceCategoryDetail:'Weapons',extraFlag:'keep me'}]};
 const controls={
  name:{value:'Steel Sword +1'},sourceCategory:{value:'Weapon'},
  amount:{value:'2'},weight:{value:'4'},cost:{value:'100 Gil'},
  dmg:{value:'1d10'},crit:{value:'19-20/x2'},special:{value:'Magic'},desc:{value:'Blade'},
  two_handed:{checked:true}
 };
 const form={elements:{namedItem:key=>controls[key]||null}};
 const fields=collectItemEditorFields(form,inventoryEditorKeys('Weapon'),new Set(['carried','two_handed']));
 assert.equal(fields.name,'Steel Sword +1');
 assert.equal(fields.dmg,'1d10');
 assert.equal(fields.amount,2);
 assert.equal(fields.weight,4);
 assert.equal(fields.two_handed,true);
 for(const hidden of ['rarity','type','secondaryType','shopSource','sourceCategoryDetail','itemLevel','pf2eBulk'])assert.ok(!(hidden in fields));
 const saved=mergeSheetData(before,{action:'entry',collection:'items',mode:'update',index:0,fields}).items[0];
 assert.equal(saved.name,'Steel Sword +1');
 assert.equal(saved.dmg,'1d10');
 assert.equal(saved.amount,2);
 assert.equal(saved.rarity,'Uncommon');
 assert.equal(saved.type,'Imported');
 assert.equal(saved.shopSource,'pathfinder-1e');
 assert.equal(saved.sourceCategoryDetail,'Weapons');
 assert.equal(saved.extraFlag,'keep me');
});

test('custom item Save omits unseen input keys without forcing undefined controls',()=>{
 const fields=collectItemEditorFields({elements:{namedItem:key=>({
  name:{value:'Health Vial'},sourceCategory:{value:'Consumables'},amount:{value:'3'},weight:{value:'0.5'},cost:{value:'6 Gil'},desc:{value:'Heals 1d4'},dcSave:{value:'14'}
 })[key]||null}},inventoryEditorKeys('Consumables'));
 assert.deepEqual(Object.keys(fields).sort(),['amount','cost','dcSave','desc','name','sourceCategory','weight'].sort());
});
