import test from 'node:test';
import assert from 'node:assert/strict';
import {initiativeFocus} from '../src/owlbear/initiative-focus.mjs';

test('NPC camera frames its recommended target only while target is in the GM viewport',async()=>{
 const npc={id:'npc',type:'IMAGE',layer:'CHARACTER',visible:true,position:{x:100,y:100},zIndex:1};
 const target={...npc,id:'target',position:{x:600,y:100}};
 const boxes={
  npc:{min:{x:100,y:100},max:{x:200,y:200},width:100,height:100,center:{x:150,y:150}},
  target:{min:{x:600,y:100},max:{x:700,y:200},width:100,height:100,center:{x:650,y:150}}
 };
 let onScreen=true;
 const moves=[],OBR={
  scene:{items:{getItemBounds:async ids=>boxes[ids[0]]},
   local:{addItems:async()=>{},deleteItems:async()=>{}}},
  viewport:{
   transformPoint:async()=>onScreen?{x:400,y:300}:{x:1100,y:300},
   getWidth:async()=>800,getHeight:async()=>600,
   animateToBounds:async box=>moves.push(box)
  }
 };
 const buildShape=()=>{
  const shape={};
  for(const key of ['shapeType','width','height','position','layer','zIndex','fillOpacity','strokeColor','strokeOpacity','strokeWidth','disableHit','locked','disableAutoZIndex','metadata'])shape[key]=()=>shape;
  shape.build=()=>({id:'ring'});return shape;
 };
 const focus=initiativeFocus(OBR,buildShape);
 focus.update([npc,target],npc.id);
 assert.equal(await focus.frameTurn(npc.id,target.id),true);
 assert.deepEqual(moves[0].center,{x:400,y:150});
 assert.ok(moves[0].width>=900);
 onScreen=false;
 assert.equal(await focus.frameTurn(npc.id,target.id),true);
 assert.deepEqual(moves[1].center,{x:150,y:150});
 assert.ok(moves[1].width>=600);
 assert.equal(await focus.frameTurn(npc.id,'missing'),true);
 assert.deepEqual(moves[2].center,{x:150,y:150});
 await focus.close();
});
