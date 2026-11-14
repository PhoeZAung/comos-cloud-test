import test from 'node:test';
import assert from 'node:assert/strict';
import {FFD20_SHOP_PRICE_MODE,sourceCoinsToGil,shopUnitPriceGil} from '../src/features/sheet/shop-pricing.mjs';

test('FFd20 converts exact GP prices into Gil only when that shop mode is selected',()=>{
 const potion={priceGil:null,costText:'12 gp'};
 assert.equal(sourceCoinsToGil('12 gp'),12);
 assert.equal(sourceCoinsToGil('1,250 gp'),1250);
 assert.equal(sourceCoinsToGil('0 pp + 12 gp + 5 sp + 3 cp'),12.53);
 assert.equal(sourceCoinsToGil('3 pp + 0 gp + 0 sp + 0 cp'),30);
 assert.equal(sourceCoinsToGil('5 sp'),0.5);
 assert.equal(sourceCoinsToGil('1 cp'),0.01);
 assert.equal(shopUnitPriceGil(potion),null,'native Pathfinder catalog price is unchanged');
 assert.equal(shopUnitPriceGil(potion,FFD20_SHOP_PRICE_MODE),12);
 assert.equal(potion.priceGil,null,'the converter must not change upstream item data');
 assert.equal(shopUnitPriceGil({priceGil:25,costText:'12 gp'},FFD20_SHOP_PRICE_MODE),25,'GM-assigned Gil price wins');
 assert.equal(shopUnitPriceGil({priceGil:0,costText:'12 gp'},FFD20_SHOP_PRICE_MODE),0,'free fixed prices are preserved');
});

test('FFd20 never guesses ambiguous gp amounts or fractional coin cents',()=>{
 for(const value of ['','Variable','No price','12 gp / 2','12 gp for 2','1-20 gp',
 '1 gp or 2 gp','x10 gp','+50% gp','1 gp + 1 gp','1.5 cp','1,2 gp',
 '1,000,000,000,000,000 gp','12g','Infinity gp','2 gp + unknown','1 gp + 1 sp / 5']){
  assert.equal(sourceCoinsToGil(value),null,value);
 }
 assert.equal(shopUnitPriceGil({priceGil:null,costText:'Varies'},FFD20_SHOP_PRICE_MODE),null);
});
