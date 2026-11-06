import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderSection,entryDetail} from '../src/features/sheet/view.mjs';
import {formatSheetText,applyRichFormat,safeSheetLink} from '../src/features/sheet/rich-text.mjs';
import {inventoryItemValue,inventoryItemDetails} from '../src/features/sheet/inventory-fields.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharactersService} from '../backend/characters/service.mjs';
import {createItemsService} from '../backend/items/service.mjs';
import {createPurchaseService} from '../backend/items/purchases.mjs';

test('Identity Speed label opens movement details, number stays ordinary text; favored class can be edited',()=>{
 const d={speed:30,favored_class_options:'Original',proficiencies:'Armor'};
 const html=renderSection({id:'hero',name:'Hero',data:d},'overview');
 assert.match(html,/<dt><button[^>]*data-speed-details[^>]*>Speed<\/button><\/dt><dd>30 ft<\/dd>/);
 assert.doesNotMatch(html,/data-speed-details[^>]*>30 ft<\/button>/);
 const edited=mergeSheetData(d,{action:'fields',fields:{favored_class_options:'Any class: +1 HP'}});
 assert.equal(edited.favored_class_options,'Any class: +1 HP');
 assert.match(renderSection({data:edited},'overview'),/Any class: \+1 HP/);
});

test('Rest refills active, passive, racial, and feat usage but not weapons or opted-out abilities',()=>{
 const original={
  hp_curr:6,hp_max:20,mp:0,mp_max:6,
  activeAbilities:[{name:'Daily Strike',u_max:4,u_curr:1,restoreOnLongRest:true},{name:'Never Rest',u_max:3,u_curr:0,restoreOnLongRest:false}],
  passiveAbilities:[{name:'Aura',u_max:2,u_curr:0}],
  racialAbilities:[{name:'Racial Gift',u_max:3,u_curr:1,restoreOnLongRest:true}],
  feats:[{name:'Feat',u_max:5,u_curr:2,restoreOnLongRest:true}],
  weapons:[{name:'Pistol',u_max:10,u_curr:2,restoreOnLongRest:true}]
 };
 const next=mergeSheetData(original,{action:'rest'});
 assert.equal(next.activeAbilities[0].u_curr,4);
 assert.equal(next.activeAbilities[1].u_curr,0);
 assert.equal(next.passiveAbilities[0].u_curr,2);
 assert.equal(next.racialAbilities[0].u_curr,3);
 assert.equal(next.feats[0].u_curr,5);
 assert.equal(next.weapons[0].u_curr,2);
 assert.equal(original.activeAbilities[0].u_curr,1);
});

test('Rich prose supports headings, bullets, alignment, bold, and italic without accepting HTML',()=>{
 const text='# Summary\n- **Bold**\n- *Italic*\n[center]Center me[/center]\n<script>alert(1)</script>';
 const html=formatSheetText(text);
 assert.match(html,/<h3>Summary<\/h3>/);
 assert.match(html,/<ul><li><strong>Bold<\/strong><\/li><li><em>Italic<\/em><\/li><\/ul>/);
 assert.match(html,/class="cs-rich-align-center">Center me/);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>/);
 const bold=applyRichFormat('One two',4,7,'bold');
 assert.equal(bold.value,'One **two**');
 assert.equal(applyRichFormat('Word',0,4,'bullet').value,'- Word');
 assert.equal(applyRichFormat('Word',0,4,'heading').value,'## Word');
 assert.equal(applyRichFormat('Word',0,4,'right').value,'[right]Word[/right]');
});

test('Ability link is editable, restricted to web URLs, and displayed simply as Link',()=>{
 const initial={activeAbilities:[{name:'Pulse',desc:'**Strong** effect'}]};
 const updated=mergeSheetData(initial,{action:'entry',collection:'activeAbilities',mode:'update',index:0,fields:{link:'https://example.org/rules/ability',effect:'- **Effect**'}});
 assert.equal(updated.activeAbilities[0].link,'https://example.org/rules/ability');
 const html=entryDetail(updated.activeAbilities[0],updated,'activeAbilities');
 assert.match(html,/href="https:\/\/example.org\/rules\/ability"/);
 assert.match(html,/>Link ↗<\/a>/);
 assert.match(html,/<strong>Effect<\/strong>/);
 assert.throws(()=>mergeSheetData(initial,{action:'entry',collection:'activeAbilities',mode:'update',index:0,fields:{link:'javascript:alert(1)'}}),/valid http or https URL/);
 assert.throws(()=>mergeSheetData(initial,{action:'entry',collection:'activeAbilities',mode:'update',index:0,fields:{link:'https://x:y@example.org/'}}),/valid http or https URL/);
 assert.doesNotMatch(safeSheetLink('javascript:alert(1)'),/javascript:/);
});

test('Buying copies structured shop fields into their actual inventory editor columns',()=>{
 const make=async()=> {
  const db=await openDatabase(':memory:'),user=createUserRepository(db).create({displayName:'Buyer'}),characterId=randomUUID();
  createCharactersService(db).save({op:'save',id:characterId,revision:0,name:'Hero',ownerId:user.id,sources:[]});
  db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(characterId,JSON.stringify({currency_gil:100}));
  const items=createItemsService(db);
  return {db,user,characterId,items};
 };
 return make().then(({db,user,characterId,items})=>{
  try{
   const item=items.save({op:'save',id:randomUUID(),revision:0,name:'Master Sword',sourceId:'test',sourceVersion:'1',category:'Weapon',description:'Sharp sword',priceGil:1,costText:'1 gil'});
   const catalog={id:'W-1',raw:{'Weight':'2 lb','Damage (M)':'1d8','Proficiency':'Martial','Range':'30 ft','Critical':'19-20/x2','Special':'Silvered','Type':'Melee'}};
   db.prepare('UPDATE items SET catalog_json=? WHERE id=?').run(JSON.stringify(catalog),item.id);
   const receipt=createPurchaseService(db,items).purchase(user.id,{op:'buy',requestId:randomUUID(),characterId,itemId:item.id,quantity:2,revision:1,itemRevision:1});
   assert.equal(receipt.quantity,2);
   const data=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(characterId).data_json);
   const bought=data.items[0];
   assert.equal(bought.amount,2);
   assert.equal(bought.weight,2);
   assert.equal(bought.dmg,'1d8');
   assert.equal(bought.proficiency,'Martial');
   assert.equal(bought.range,'30 ft');
   assert.equal(bought.crit,'19-20/x2');
   assert.equal(bought.special,'Silvered');
   assert.equal(bought.type,'Melee');
   assert.deepEqual(bought.sourceCatalog,catalog);
   assert.equal(inventoryItemValue(bought,'weight'),2);
   assert.ok(inventoryItemDetails(bought).some(([label,value])=>label==='Damage'&&value==='1d8'));
  }finally{db.close();}
 });
});
