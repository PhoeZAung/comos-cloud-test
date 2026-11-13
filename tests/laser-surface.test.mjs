import test from 'node:test';
import assert from 'node:assert/strict';
import {sheetLaserSurface,LASER_VIEWPORT_OVERFLOW} from '../src/effects/react-bits/laser-surface.mjs';

const stage={left:0,top:0,width:1200,height:800};
test('laser hits the real tab bar and continues down tall content',()=>{
 const surface=sheetLaserSurface({left:100,top:180,width:1000,height:48},{bottom:1400},stage);
 assert.deepEqual(surface,{left:100,top:180,width:1000,height:1220,beamPosition:700/1200});
 assert.equal(surface.top+surface.height,1400);
});
test('short tabs still pour light below the visible screen',()=>{
 for(const bottom of [240,480,800]){
  const surface=sheetLaserSurface({left:100,top:180,width:1000,height:48},{bottom},stage);
  assert.equal(surface.top+surface.height,stage.height+LASER_VIEWPORT_OVERFLOW);
 }
});
test('mobile offsets and nested scrolling retain tab alignment and full viewport coverage',()=>{
 const offset={left:20,top:50,width:390,height:844};
 const surface=sheetLaserSurface({left:30,top:170,width:350,height:48},{bottom:600},offset);
 assert.deepEqual(surface,{left:10,top:120,width:350,height:820,beamPosition:220/390});
 const scrolled=sheetLaserSurface({left:10,top:-500,width:350,height:48},{bottom:900},stage);
 assert.equal(scrolled.top,0);
 assert.equal(scrolled.height,stage.height+LASER_VIEWPORT_OVERFLOW);
 const long=sheetLaserSurface({left:0,top:-500,width:350,height:48},{bottom:2200},stage);
 assert.equal(long.height,2200);
});
test('no sheet navigation retains ambient effect rather than stale geometry',()=>{
 assert.equal(sheetLaserSurface(null,null,stage),null);
 assert.equal(sheetLaserSurface({width:0,height:0},{bottom:0},stage),null);
 assert.equal(sheetLaserSurface({left:0,top:0,width:100,height:50},{bottom:200},{width:100,height:0}),null);
});
