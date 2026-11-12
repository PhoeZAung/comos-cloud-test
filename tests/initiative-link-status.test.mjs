import test from 'node:test';
import assert from 'node:assert/strict';
import {initiativeLinkStatus} from '../src/owlbear/initiative-link.mjs';
import {BATTLE,battleRows} from '../src/owlbear/battle-state.mjs';
import {readFile} from 'node:fs/promises';

const token=state=>({id:'token-'+String(state.npcId||state.siteId||'simple'),name:'Hero',type:'IMAGE',layer:'CHARACTER',metadata:{[BATTLE]:{enabled:true,...state}}});
test('PC, NPC, unlinked, and stale initiative combatants have distinct non-sensitive statuses',()=>{
 assert.equal(initiativeLinkStatus({linked:true,siteId:'pc',available:true}).kind,'character');
 assert.equal(initiativeLinkStatus({linked:true,isNpc:true,available:true}).kind,'npc');
 assert.equal(initiativeLinkStatus({linked:false}).kind,'unlinked');
 assert.equal(initiativeLinkStatus({linked:true,available:false}).kind,'missing');
});
test('NPC metadata is classified as linked without exposing a private NPC sheet ID',()=>{
 const rows=battleRows([token({npcId:'npc-1',hp:20,ac:14}),token({siteId:'pc-1',hp:10}),token({hp:10})],
  [{id:'pc-1',name:'Player',hp:14,hpMax:18}]);
 assert.equal(rows.length,3);
 const npc=rows.find(x=>x.isNpc);
 assert.equal(npc.linked,true);
 assert.equal(npc.siteId,null);
 assert.equal(Object.hasOwn(npc,'npcId'),false);
 assert.equal(initiativeLinkStatus(npc).kind,'npc');
 const stale=battleRows([token({siteId:'missing-id'})],[]);
 assert.equal(stale[0].linked,true);assert.equal(stale[0].available,false);
 assert.equal(initiativeLinkStatus(stale[0]).kind,'missing');
});
test('Initiative UI has an accessible link status marker and colors',async()=>{
 const js=await readFile('src/owlbear/initiative-view.mjs','utf8');
 const css=await readFile('public/owlbear/owlbear.css','utf8');
 assert.match(js,/battle-link-indicator/);
 assert.match(js,/initiativeLinkStatus\(row\)/);
 for(const kind of ['character','npc','unlinked','missing'])assert.match(css,new RegExp('data-link-status="'+kind+'"'));
});
