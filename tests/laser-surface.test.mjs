import test from 'node:test';
import assert from 'node:assert/strict';
import {sheetLaserSurface} from '../src/effects/react-bits/laser-surface.mjs';
const stage={left:0,top:0,width:1200,height:800};
test('laser strikes the real tab bar and pours down the content sides',()=>{
 assert.deepEqual(sheetLaserSurface({left:100,top:180,width:1000,height:48},{bottom:1400},stage),{left:100,top:180,width:1000,height:1220,beamPosition:700/1200});
});
test('mobile, nested viewport offsets and scrolling keep the barrier aligned',()=>{
 assert.deepEqual(sheetLaserSurface({left:30,top:170,width:350,height:48},{bottom:600},{left:20,top:50,width:390,height:844}),{left:10,top:120,width:350,height:724,beamPosition:220/390});
 assert.equal(sheetLaserSurface({left:10,top:-500,width:350,height:48},{bottom:900},stage).top,0);
});
test('no sheet navigation retains the ambient effect instead of a stale barrier',()=>{
 assert.equal(sheetLaserSurface(null,null,stage),null);
 assert.equal(sheetLaserSurface({width:0,height:0},{bottom:0},stage),null);
});
