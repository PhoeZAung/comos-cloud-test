import test from 'node:test';
import assert from 'node:assert/strict';
import {initiativeFocus} from '../src/owlbear/initiative-focus.mjs';

test('initiative focus locates tokens without changing selection and adds local turn/hover rings',async()=>{
 const added=[],removed=[],moves=[],item={id:'token-1',type:'IMAGE',layer:'CHARACTER',visible:true,position:{x:100,y:200},scale:{x:1,y:1},zIndex:10,image:{width:60,height:60},lastModified:'one'};
 const OBR={
  scene:{
   items:{getItemBounds:async ids=>{assert.equal(ids.length,1);assert.ok(['token-1','hidden-token'].includes(ids[0]));return {min:{x:100,y:200},max:{x:160,y:260},width:60,height:60,center:{x:130,y:230}};}},
   local:{addItems:async shapes=>{added.push(...shapes);},deleteItems:async ids=>{removed.push(...ids);}}
  },
  viewport:{animateToBounds:async box=>moves.push(box)},
  player:{select:()=>{throw Error('Do not alter user selection.');}}
 };
 const makeShape=()=>{
  const properties={id:'mock-'+(added.length+removed.length+1),type:'SHAPE'};
  const builder={};
  for(const name of ['shapeType','width','height','position','layer','zIndex','fillOpacity','strokeColor','strokeOpacity','strokeWidth','disableHit','locked','disableAutoZIndex','metadata'])builder[name]=value=>{properties[name]=value;return builder;};
  builder.build=()=>({...properties});
  return builder;
 };
 const focus=initiativeFocus(OBR,makeShape);
 focus.update([item],'token-1');
 await new Promise(resolve=>setTimeout(resolve,25));
 assert.equal(added.length,1);assert.equal(added[0].type,'SHAPE');assert.equal(added[0].shapeType,'RECTANGLE');
 assert.deepEqual(added[0].position,{x:97,y:197});assert.equal(added[0].width,66);assert.equal(added[0].height,66);
 assert.equal(added[0].metadata['com.cosmos.character-sheets/initiative-highlight'].kind,'turn');
 assert.equal(await focus.locate('token-1'),true);
 assert.deepEqual(moves[0].center,{x:130,y:230});
 assert.ok(moves[0].width>=600);
 focus.hover('token-1');
 await new Promise(resolve=>setTimeout(resolve,25));
 assert.equal(added.at(-1).metadata['com.cosmos.character-sheets/initiative-highlight'].kind,'hover');
 focus.hover(null);
 await new Promise(resolve=>setTimeout(resolve,25));
 assert.equal(await focus.locate('not-a-token'),false);
 // Players must never move to explicitly hidden tokens even if they know an ID.
 const hidden={...item,id:'hidden-token',visible:false};
 focus.update([hidden],'hidden-token');
 assert.equal(await focus.locate('hidden-token'),false);
 // The Owlbear GM may still inspect and locate a hidden combatant.
 focus.setShowHidden(true);
 focus.update([hidden],'hidden-token');
 assert.equal(await focus.locate('hidden-token'),true);
 assert.equal(moves.length,2);
 focus.setShowHidden(false);
 assert.equal(await focus.locate('hidden-token'),false);
 // A recommendation is red and local-only; it does not change selection.
 focus.update([item],'token-1');
 focus.recommend('token-1');
 await new Promise(resolve=>setTimeout(resolve,25));
 assert.ok(added.some(shape=>shape.metadata['com.cosmos.character-sheets/initiative-highlight'].kind==='recommend'&&shape.strokeColor==='#ff475d'));
 focus.recommend(null);
 focus.update([],null);
 await new Promise(resolve=>setTimeout(resolve,25));
 await focus.close();
 assert.ok(removed.length>0);
 assert.equal(moves.length,2);
});
