import test from 'node:test';
import assert from 'node:assert/strict';
import {renderCategoryTiles,inventoryCategoryCounts,visibleInventoryCategory} from '../src/features/sheet/item-categories.mjs';
import {renderItemCategories,renderSection} from '../src/features/sheet/view.mjs';

test('Inventory hides category tiles and group buttons when its item count is zero',()=>{
 const empty=inventoryCategoryCounts([]);
 assert.equal(Object.values(empty).reduce((n,c)=>n+c,0),0);
 assert.equal(renderCategoryTiles(empty,'All',{groups:true}),'');
 assert.equal(renderItemCategories({items:[]}), '');
 const section=renderSection({id:'hero',name:'Hero',data:{items:[]}},'items',{itemView:'inventory'});
 assert.doesNotMatch(section,/item-category-tiles|item-group-buttons/);
 assert.match(section,/data-add-entry="items"/);
});

test('Inventory renders only occupied categories and occupied category groups',()=>{
 const items=[{name:'Sword',sourceCategory:'Weapon',amount:1},{name:'Bow',sourceCategory:'Weapon',amount:1},{name:'Potion',sourceCategory:'Alchemical Items',amount:2}];
 const counts=inventoryCategoryCounts(items);
 assert.equal(counts.Weapon,2);
 assert.equal(counts['Alchemical Items'],1);
 const html=renderItemCategories({items},'Weapon');
 assert.match(html,/data-item-tag="Weapon" aria-pressed="true"/);
 assert.match(html,/data-item-tag="Alchemical Items"/);
 assert.match(html,/data-item-tag="Tools"/);
 assert.match(html,/data-item-tag="Magic"/);
 assert.match(html,/data-item-tag="All"/);
 assert.doesNotMatch(html,/data-item-tag="Armor"|data-item-tag="Food"|data-item-tag="Other"|data-item-tag="Misc"/);
});

test('Inventory categories appear when first item is added and disappear when last item is removed',()=>{
 const initial=renderItemCategories({items:[]});
 const added=renderItemCategories({items:[{name:'Hat',sourceCategory:'Armor'}]});
 const removed=renderItemCategories({items:[]},'Armor');
 assert.equal(initial,'');
 assert.match(added,/data-item-tag="Armor" aria-pressed="false"/);
 assert.equal(removed,'');
 assert.equal(visibleInventoryCategory(inventoryCategoryCounts([]),'Armor'),'All');
 assert.equal(visibleInventoryCategory(inventoryCategoryCounts([{name:'Hat',sourceCategory:'Armor'}]),'Armor'),'Armor');
 assert.equal(visibleInventoryCategory(inventoryCategoryCounts([{name:'Hat',sourceCategory:'Armor'}]),'Magic'),'All');
 const screen=renderSection({id:'hero',name:'Hero',data:{items:[{name:'Sword',sourceCategory:'Weapon'}]}},'items',{itemView:'inventory',itemTag:'Armor'});
 assert.match(screen,/Sword/);
 assert.match(screen,/data-item-tag="Weapon"/);
 assert.doesNotMatch(screen,/data-item-tag="Armor"/);
});
