import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {ITEM_TAG_OPTIONS,renderCategoryTiles} from '../src/features/sheet/item-categories.mjs';
import {inventoryEditorFields,inventoryEditorKeys,inventoryItemDetails,inventoryItemValue} from '../src/features/sheet/inventory-fields.mjs';
import {skillSupportsSpecialization,sheetSkills} from '../src/features/sheet/skills.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderSheetFrame,renderSection} from '../src/features/sheet/view.mjs';
import {normalizedPreferences} from '../src/ui/preferences.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharactersService} from '../backend/characters/service.mjs';
import {publishRoll} from '../backend/characters/rolls.mjs';

test('inventory uses icon-only filters and navigation without the redundant Inventory title',()=>{
 const char={id:'sheet',name:'Character',data:{slot_cap:30,items:[{name:'Robe',sourceCategory:'Armor',weight:3}]}};
 const html=renderSheetFrame(char,'items');
 assert.match(html,/data-item-view="inventory" aria-pressed="true" aria-label="Inventory"/);
 assert.match(html,/data-item-view="equip" aria-pressed="false" aria-label="Equip"/);
 assert.doesNotMatch(html,/<h2>Inventory<\/h2>/);
 assert.match(html,/class="item-category-tiles item-category-icon-only"/);
 assert.doesNotMatch(html,/class="item-group-buttons"/);
 const tiles=renderCategoryTiles({Armor:2,Weapon:1},'Armor',{iconOnly:true});
 assert.match(tiles,/aria-label="Armor"/);
 assert.match(tiles,/aria-label="Weapon"/);
 assert.doesNotMatch(tiles,/<span>Armor<\/span>|<span>Weapon<\/span>/);
 assert.deepEqual(ITEM_TAG_OPTIONS,['Gear','Food','Weapon','Ranged Weapon','Ammunition','Armor','Enchantment','Machine','Alchemical Items','Artifacts','Magic Items','Collection','Misc']);
});

test('Mount Aetheria inventory categories have their own fields and Weight instead of Slot',()=>{
 for(const name of ITEM_TAG_OPTIONS){
  const keys=inventoryEditorKeys(name);
  assert.ok(keys.includes('sourceCategory')&&keys.includes('weight')&&keys.includes('amount')&&keys.includes('name'));
  assert.ok(!keys.includes('slot'));
 }
 assert.ok(inventoryEditorKeys('Weapon').includes('dmg'));
 assert.ok(inventoryEditorKeys('Ranged Weapon').includes('ammo'));
 assert.ok(inventoryEditorKeys('Armor').includes('spellFailure'));
 assert.ok(inventoryEditorKeys('Machine').includes('passengersCrew'));
 assert.ok(inventoryEditorKeys('Alchemical Items').includes('dcSave'));
 assert.ok(!inventoryEditorKeys('Food').includes('dmg'));
 assert.equal(inventoryItemValue({damage:'1d8 slashing'},'dmg'),'1d8 slashing');
 const facts=inventoryItemDetails({sourceCategory:'Weapon',name:'Sword',weight:2,damage:'1d8',cost:'250'});
 assert.ok(facts.some(([label,value])=>label==='Damage'&&value==='1d8'));
 assert.ok(facts.some(([label,value])=>label==='Weight (lb)'&&value===2));
 assert.ok(facts.some(([label,value])=>label==='Cost'&&value==='250'));
 const added=mergeSheetData({items:[]},{action:'entry',collection:'items',mode:'add',fields:{sourceCategory:'Weapon',name:'Blade',amount:1,weight:2.5,dmg:'1d8',crit:'20/x2',rarity:'Rare',desc:'Sharp',special:'Cold steel'}});
 assert.equal(added.items[0].weight,2.5);
 assert.equal(added.items[0].dmg,'1d8');
 assert.equal(added.items[0].special,'Cold steel');
 assert.equal(mergeSheetData(added,{action:'entry',collection:'items',mode:'update',index:0,fields:{sourceCategory:'Weapon',weight:-2}}).items[0].weight,2.5); // Invalid optional weight does not block other edits.
 assert.throws(()=>mergeSheetData(added,{action:'entry',collection:'items',mode:'update',index:0,fields:{sourceCategory:'Armor',dmg:'1d8'}}),/not available/);
 const armor=mergeSheetData(added,{action:'entry',collection:'items',mode:'update',index:0,fields:{sourceCategory:'Armor',weight:4,acBonus:'+2',checkPenalty:'-1'}});
 assert.equal(armor.items[0].acBonus,'+2');
 assert.equal(armor.items[0].weight,4);
});

test('only Craft, Profession and Perform may have specializations',()=>{
 for(const name of ['Craft','Profession','Perform'])assert.equal(skillSupportsSpecialization(name),true);
 for(const name of ['Acrobatics','Stealth','Perception'])assert.equal(skillSupportsSpecialization(name),false);
 const base={skills:[]},rows=sheetSkills(base),craft=rows.findIndex(row=>row.name==='Craft'),acrobatics=rows.findIndex(row=>row.name==='Acrobatics');
 assert.ok(craft>=0&&acrobatics>=0);
 const learned=mergeSheetData(base,{action:'entry',collection:'skills',mode:'update',index:craft,fields:{subName:'Alchemy'}});
 assert.equal(learned.skills[craft].subName,'Alchemy');
 assert.throws(()=>mergeSheetData(base,{action:'entry',collection:'skills',mode:'update',index:acrobatics,fields:{subName:'Alchemy'}}),/Only Craft/);
 const html=renderSection({id:'x',name:'Hero',data:{skills:[{name:'Acrobatics',stat:'dex',subName:'Legacy'}]}},'skills');
 assert.doesNotMatch(html,/Acrobatics \(Legacy\)/);
});

test('Discord shows arithmetic rather than formulas, or hides stats without affecting the result',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const user=createUserRepository(db).create(),id=randomUUID();
  createCharactersService(db).save({op:'save',id,revision:0,name:'Hero',ownerId:user.id,sources:[]});
  const body=[],character={id,name:'Hero',data:{}};
  const makeChange=discordStats=>({requestId:randomUUID(),label:'Attack',expression:'1d20+5',discord:true,discordStats,owlbearRolls:[{expression:'1d20+5',faces:[14]}]});
  const sendFetch=async(_url,{body:sent})=>{body.push(JSON.parse(sent).content);return {ok:true};};
  const visible=await publishRoll({db,userId:user.id,origin:'https://example.test',character,change:makeChange(true),sendFetch});
  assert.equal(visible.roll.total,19);
  assert.match(body[0],/14 \+ 5 = 19/);
  assert.doesNotMatch(body[0],/1d20\+5/);
  db.prepare('UPDATE sheet_rolls SET created_at=0').run();
  const hidden=await publishRoll({db,userId:user.id,origin:'https://example.test',character,change:makeChange(false),sendFetch});
  assert.equal(hidden.roll.total,19);
  assert.doesNotMatch(body[1],/19|14 \+ 5|1d20\+5/);
  assert.match(body[1],/Hero/);
  assert.equal(normalizedPreferences({discordRollStats:false}).discordRollStats,false);
  assert.equal(normalizedPreferences({}).discordRollStats,true);
 }finally{db.close();}
});

test('confirmed deletion awaits the local React Bits effect; notes use the exact resizable electric component',async()=>{
 const root=await readFile(new URL('../src/ui/sheet-delete.mjs',import.meta.url),'utf8');
 const confirm=root.slice(root.indexOf('export function confirmCharacterDelete'),root.indexOf('// Resolve only'));
 assert.match(confirm,/data-delete-final/);assert.doesNotMatch(confirm,/mountHoldButton\(/);
 const ui=await readFile(new URL('../src/ui/sheet.mjs',import.meta.url),'utf8');
 const deletion=ui.slice(ui.indexOf('async function deleteCharacter'),ui.indexOf('function openEquipmentPicker'));
 assert.ok(deletion.indexOf('await crumpleSheet')<deletion.indexOf("request({op:'archive'"));
 assert.match(root,/overlay.dataset.phase='throwing'/);assert.match(root,/translateY\(-/);
 const effect=await readFile(new URL('../src/components/react-bits/ElectricBorder.jsx',import.meta.url),'utf8');
 assert.match(effect,/ResizeObserver/);assert.match(effect,/webgl2/);
 const bridge=await readFile(new URL('../src/ui/sheet-notes-electric.mjs',import.meta.url),'utf8');
 assert.match(bridge,/cs-notes-electric/);assert.match(bridge,/unmount\(\)/);
});
