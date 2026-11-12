import test from 'node:test';
import assert from 'node:assert/strict';
import {recommendTarget} from '../src/owlbear/target-recommendation.mjs';

const npc={id:'npc-token',name:'Iron Warden',isNpc:true,siteId:null,visible:true,available:true};
const fighter={id:'fighter',siteId:'fighter-sheet',name:'Fighter',hp:90,hpMax:100,ac:26,mpMax:0,visible:true,available:true};
const mage={id:'mage',siteId:'mage-sheet',name:'Mage',hp:4,hpMax:100,ac:8,mpMax:12,visible:true,available:true};
const token=(id,x,y=0,visible=true)=>({id,type:'IMAGE',layer:'CHARACTER',visible,position:{x,y},scale:{x:1,y:1}});
const board=[token('npc-token',0),token('fighter',150),token('mage',300)];

test('mindless NPCs favor the nearest living linked party token',()=>{
 assert.equal(recommendTarget({attacker:npc,battle:[npc,fighter,mage],items:board,intelligence:1})?.id,'fighter');
});
test('tactical NPCs balance distance against damaged targets, armor, and casting resources',()=>{
 assert.equal(recommendTarget({attacker:npc,battle:[npc,fighter,mage],items:board,intelligence:18})?.id,'mage');
});
test('no NPC turn, no eligible party sheet, hidden or defeated target means no recommendation',()=>{
 assert.equal(recommendTarget({attacker:{...npc,isNpc:false},battle:[fighter],items:board}),null);
 assert.equal(recommendTarget({attacker:npc,battle:[{...mage,isNpc:true},{...fighter,siteId:null}],items:board}),null);
 assert.equal(recommendTarget({attacker:npc,battle:[{...fighter,hp:0},{...mage,visible:false}],items:board}),null);
 assert.equal(recommendTarget({attacker:npc,battle:[fighter],items:board.filter(item=>item.id!=='fighter')}),null);
 assert.equal(recommendTarget({attacker:npc,battle:[fighter],items:board.map(item=>item.id==='fighter'?{...item,visible:false}:item)}),null);
});
test('recommendation is repeatable and responds to changing HP and positions',()=>{
 const first=recommendTarget({attacker:npc,battle:[npc,fighter,mage],items:board,intelligence:18});
 assert.deepEqual(first,recommendTarget({attacker:npc,battle:[npc,fighter,mage],items:board,intelligence:18}));
 const moved=board.map(item=>item.id==='mage'?{...item,position:{x:6000,y:0}}:item);
 assert.equal(recommendTarget({attacker:npc,battle:[npc,fighter,mage],items:moved,intelligence:18})?.id,'fighter');
});
