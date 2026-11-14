import test from 'node:test';
import assert from 'node:assert/strict';
import {renderCatalogPreview,formatGil,catalogPurchaseTotal,catalogMechanicalFacts} from '../src/features/sheet/catalog-shop-preview.mjs';

test('catalog preview prioritizes combat facts, description, one original link and named catalog',()=>{
 const html=renderCatalogPreview({
  name:'<img src=x onerror=alert(1)>',category:'Weapon',sourceId:'pathfinder-shopping',sourceVersion:'pf1e-offline-v1',
  description:'**Rope**\n<script>alert(1)</script>',costText:'2 gp',priceGil:null,
  catalog:{dmg:'1d8',crit:'19–20/x2',range:'30 ft',sourceUrl:'https://www.aonprd.com/EquipmentWeapons.aspx',
   raw:{Weight:'1 lb',Type:'Utility','Source (Possible Spoilers)':'Core Rulebook','Item Level':'3','Bulk':'L'}}
 });
 assert.match(html,/PF1e · AoN/);
 assert.match(html,/<strong>Rope<\/strong>/);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>|<img/);
 assert.match(html,/Gameplay details/);
 assert.match(html,/<dt>Damage<\/dt><dd>1d8<\/dd>/);
 assert.match(html,/<dt>Critical<\/dt><dd>19–20\/x2<\/dd>/);
 assert.match(html,/<dt>Range<\/dt><dd>30 ft<\/dd>/);
 assert.match(html,/View original item/);
 assert.match(html,/<dt>Weight \(lb\)<\/dt><dd>1 lb<\/dd>/);
 assert.doesNotMatch(html,/Source:|Source category|Original source category|Item level|Bulk|Source \(Possible Spoilers\)|<dt>Type<\/dt>|<dt>Slot|<dt>Rarity/);
});

test('mechanical preview reads legacy source fields for spell failure, save DC and speed',()=>{
 const row={catalog:{raw:{'Arcane Spell Failure Chance':'25%','DC/Save':'Fortitude DC 18','Full Speed':'60 ft','Dmg (M)':'1d10','Critical':'x3'}}};
 const facts=catalogMechanicalFacts(row);
 assert.ok(facts.some(([k,v])=>k==='Spell failure'&&v==='25%'));
 assert.ok(facts.some(([k,v])=>k==='Save DC'&&v==='Fortitude DC 18'));
 assert.ok(facts.some(([k,v])=>k==='Full speed'&&v==='60 ft'));
 assert.ok(facts.some(([k,v])=>k==='Critical'&&v==='x3'));
 assert.ok(facts.some(([k,v])=>k==='Damage'&&v==='1d10'));
});

test('catalog purchase totals use fixed exact prices and never estimate ambiguous prices',()=>{
 assert.equal(catalogPurchaseTotal({priceGil:3.25},4),13);
 assert.equal(catalogPurchaseTotal({priceGil:0},2),0);
 assert.equal(catalogPurchaseTotal({priceGil:0.01},999),9.99);
 assert.equal(catalogPurchaseTotal({priceGil:null},2),null);
 assert.equal(catalogPurchaseTotal({priceGil:2.333},2),null);
 assert.equal(catalogPurchaseTotal({priceGil:4},0),null);
 assert.equal(catalogPurchaseTotal({priceGil:4},1000),null);
 assert.equal(catalogPurchaseTotal({priceGil:4},2.2),null);
 assert.equal(formatGil(3.25),'3.25 Gil');
 assert.equal(formatGil(null),'Not priced');
});


test('irrelevant imported metadata never appears as gameplay facts but weight survives',()=>{
 const row={catalog:{raw:{
  'Source: Special':'Not gameplay','Source System':'custom','Source: Rarity':'Uncommon',
  'Slot':'Head','Slot Amount':'1','Weight':'3 lb','Spell Failure':'15%',
  'Damage':'1d6','DC/Save':'Reflex DC 15'
 }}};
 const facts=catalogMechanicalFacts(row);
 assert.ok(facts.some(([label,value])=>label==='Weight (lb)'&&value==='3 lb'));
 assert.ok(facts.some(([label])=>label==='Damage'));
 assert.ok(facts.some(([label])=>label==='Save DC'));
 assert.deepEqual(facts.filter(([label])=>/slot|rarity|source|special/i.test(label)),[]);
});


test('FFd20 preview shows a derived Gil rate without changing the original Pathfinder cost',()=>{
 const sourceItem={name:'Healing Potion',sourceId:'pathfinder-shopping',priceGil:null,costText:'12 gp',description:'Restores health.',catalog:{sourceUrl:'https://www.aonprd.com/'}};
 const native=renderCatalogPreview(sourceItem);
 assert.match(native,/No Gil conversion configured/);
 const ffd20=renderCatalogPreview(sourceItem,{pricingMode:'ffd20-gp-to-gil-v1'});
 assert.match(ffd20,/Original price: <strong>12 gp<\/strong>/);
 assert.match(ffd20,/FFd20 shop: 1 gp = 1 Gil/);
 assert.equal(catalogPurchaseTotal({...sourceItem,priceGil:12},3),36);
 assert.equal(sourceItem.priceGil,null);
});
