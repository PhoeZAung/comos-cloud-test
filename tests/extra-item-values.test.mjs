import test from 'node:test';
import assert from 'node:assert/strict';
import {mapFoundry1e,mapPfData,mapOrc2e,mapLegacyPf2e,markdownField,sourceText} from '../scripts/extra-item-values.mjs';
import {catalogInventoryItem} from '../backend/items/inventory.mjs';

test('PF1e Foundry magical weapons map damage, critical and weight into editable Cosmos fields',()=>{
 const dagger=mapFoundry1e({_id:'1234567890ABCDEF',name:'Dagger of Venom',type:'weapon',system:{
  weaponType:'simple',weaponSubtype:'light',price:8302,weight:{value:1},
  damage:{parts:[['sizeRoll(1, 4, @size)','piercing']]},
  range:{value:null,units:'melee'},ability:{critRange:20,critMult:2},cl:5,
  description:{value:'<p>A poisoned dagger.</p><h3>Source:</h3><p>Ultimate Equipment</p>'}
 }},'pf-magic');
 assert.equal(dagger.category,'Weapon');assert.equal(dagger.damage,'1d4');
 assert.equal(dagger.damageType,'piercing');assert.equal(dagger.crit,'20/×2');
 assert.equal(dagger.weight,1);assert.equal(dagger.price,'8302 gp');assert.equal(dagger.cl,5);
 assert.ok(dagger.description.includes('poisoned dagger'));
 const selected=catalogInventoryItem({id:'abc',category:dagger.category,name:dagger.name,description:dagger.description,
  sourceId:'pf1e-foundry',costText:dagger.price,catalog:{dmg:dagger.damage,crit:dagger.crit,weight:dagger.weight}},1);
 assert.equal(selected.dmg,'1d4');assert.equal(selected.weight,1);assert.equal(selected.crit,'20/×2');
});
test('PF1e Foundry magic rings do not invent armor bonus, and cursed potions remain consumables',()=>{
 const ring=mapFoundry1e({name:'Ring Of Protection +1',type:'equipment',
  system:{equipmentType:'misc',price:2000,weight:{value:0},armor:{value:0,dex:null,acp:0},spellFailure:0,cl:5,
   description:{value:'<p>Magical deflection bonus.</p>'}}},'pf-wondrous');
 assert.equal(ring.category,'Magic Items');assert.equal(ring.armor,null);
 assert.equal(ring.price,'2000 gp');assert.equal(ring.cl,5);
 const potion=mapFoundry1e({name:'Potion of Poison [Cursed]',type:'equipment',
  system:{equipmentType:'misc',price:0,description:{value:'<p>Constitution poison. DC 14 Fortitude.</p>'}}},'pf-artifacts');
 assert.equal(potion.category,'Consumables');assert.ok(potion.description.includes('Constitution poison'));
});
test('PF1e Data maps label-embedded prices, pounds, armor and weapon specifics',()=>{
 const source={name:'Mithral Shirt',description:[
  '## Mithral Shirt','‹SOURCE Ultimate Equipment/128;PRPG Core Rulebook/464›',
  '**Cost** 1,100 gp **Weight** 10 lbs.',
  '**Armor Bonus** +4; **Max Dex Bonus** +6; **Armor Check Penalty** 0',
  '**Arcane Spell Failure Chance** 10%; **Speed** 30 ft./20 ft.',
  '**Category** Light armor','A light suit of mail.'
 ]};
 const armor=mapPfData(source,'json/equipment_armor.json');
 assert.equal(armor.category,'Armor');assert.equal(armor.price,'1,100 gp');
 assert.equal(armor.weight,10);assert.equal(armor.armor,'+4');
 assert.equal(armor.maxDex,'+6');assert.equal(armor.checkPenalty,'0');
 assert.equal(armor.spellFailure,'10%');assert.equal(armor.speed30Ft,'30 ft.');
 assert.equal(armor.speed20Ft,'20 ft.');
 assert.ok(!armor.description.includes('SOURCE'));
 const weapon=mapPfData({name:'Heavy Crossbow',topLink:['Ranged Weapons'],
  description:['**Price** 50 gp; **Weight** 8 lbs.','**Damage (M)** 1d10; **Critical** 19-20/x2',
    '**Range** 120 ft.; **Category** Ranged Weapons']},'json/equipment_weapons.json');
 assert.equal(weapon.category,'Ranged Weapon');assert.equal(weapon.damage,'1d10');
 assert.equal(weapon.crit,'19-20/x2');assert.equal(weapon.range,'120 ft.');
 assert.equal(markdownField('**Cost** 1,100 gp **Weight** 10 lbs.','Cost'),'1,100 gp');
 assert.equal(sourceText('‹rule/splash weapon›'),'splash weapon');
});
test('PF2e ORC retains edition-specific bulk and typed weapon/armor fields',()=>{
 const locales={'item.shortbow.name':'Shortbow','item.shortbow.text':'Short bow description',
  'item.chain-mail.name':'Chain Mail','item.chain-mail.text':'Medium chain armor'};
 const shortbow=mapOrc2e({name:'item.shortbow.name',text:'item.shortbow.text',
  category:'weapon',priceCp:300,bulk:'1',level:0,traits:['deadly'],
  weapon:{category:'martial',range:60,damage:{dice:'1d6',type:'piercing'}}},locales);
 assert.equal(shortbow.category,'Ranged Weapon');assert.equal(shortbow.range,'60 ft.');
 assert.equal(shortbow.damage,'1d6');assert.equal(shortbow.price,'3 gp');
 assert.equal(shortbow.weight,null);assert.equal(shortbow.pf2eBulk,'1');
 const armor=mapOrc2e({name:'item.chain-mail.name',text:'item.chain-mail.text',
  category:'armor',priceCp:600,bulk:'2',armor:{acBonus:4,dexCap:1,checkPenalty:-2}},locales);
 assert.equal(armor.category,'Armor');assert.equal(armor.armor,4);
 assert.equal(armor.maxDex,1);assert.equal(armor.checkPenalty,-2);
 assert.equal(armor.pf2eBulk,'2');assert.equal(armor.weight,null);
 const consumable=mapOrc2e({name:'Healing Potion',category:'alchemical',priceCp:1200,text:'Restore HP.'});
 assert.equal(consumable.category,'Consumables');assert.equal(consumable.price,'12 gp');
 const dagger=mapOrc2e({name:'Dagger',category:'weapon',priceCp:20});
 assert.equal(dagger.price,'2 sp');
});
test('legacy PF2e grouped equipment separates melee, ranged, armor, and prices without pounds',()=>{
 const sword=mapLegacyPf2e({name:'Longsword',damage:'1d8 S',price:'1 gp',bulk:'1'},
  'meleeWeapons','json/weapons-pf2.json');
 assert.equal(sword.category,'Weapon');assert.equal(sword.damage,'1d8');
 assert.equal(sword.weight,null);assert.equal(sword.pf2eBulk,'1');
 const bow=mapLegacyPf2e({name:'Longbow',damage:'1d8 P',price:'6 gp',range:'100 ft.'},
  'rangedWeapons','json/weapons-pf2.json');
 assert.equal(bow.category,'Ranged Weapon');assert.equal(bow.range,'100 ft.');
 const armor=mapLegacyPf2e({name:'Chain Mail',acBonus:'+4',dexCap:'+1',price:'6 gp'},
  'baseArmor','json/armor-pf2.json');
 assert.equal(armor.category,'Armor');assert.equal(armor.armor,'+4');assert.equal(armor.maxDex,'+1');
});
