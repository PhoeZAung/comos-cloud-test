import test from 'node:test';
import assert from 'node:assert/strict';
import {renderCatalogPreview,formatGil,catalogPurchaseTotal} from '../src/features/sheet/catalog-shop-preview.mjs';

test('catalog preview uses safe full descriptions and source item metadata before any purchase',()=>{
 const html=renderCatalogPreview({name:'<img src=x onerror=alert(1)>',category:'Gear',description:'**Rope**\n<script>alert(1)</script>',costText:'2 Gil',catalog:{raw:{Weight:'1 lb',Type:'Utility'}}});
 assert.match(html,/class="cs-catalog-category">Gear/);
 assert.match(html,/<strong>Rope<\/strong>/);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>|<img/);
 assert.match(html,/Item details/);
 assert.match(html,/Weight/);
 assert.match(html,/<dt>Weight \(lb\)<\/dt><dd>1<\/dd>/);
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
