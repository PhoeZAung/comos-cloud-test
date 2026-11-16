import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LAYOUT,layoutFrom,BATTLE,battleRows,battleHpForViewer} from '../src/owlbear/battle-state.mjs';
import {dockedPanels,moveParty} from '../src/owlbear/docking.mjs';

test('Party column count and freely-positioned coordinates persist in room layout',()=>{
 const defaults=layoutFrom({});
 assert.equal(defaults.party,true);
 assert.equal(defaults.partyColumns,3);
 assert.equal(defaults.partyX,.5);
 assert.equal(defaults.partyY,.06);
 const chosen=layoutFrom({[LAYOUT]:{partyColumns:5,partyX:.72,partyY:.34}});
 assert.deepEqual([chosen.partyColumns,chosen.partyX,chosen.partyY],[5,.72,.34]);
 assert.equal(layoutFrom({[LAYOUT]:{partyColumns:99,partyX:12,partyY:-20}}).partyColumns,3);
 assert.deepEqual([layoutFrom({[LAYOUT]:{partyX:12,partyY:-20}}).partyX,layoutFrom({[LAYOUT]:{partyX:12,partyY:-20}}).partyY],[1,0]);
 assert.deepEqual([layoutFrom({[LAYOUT]:{partyDock:'right'}}).partyX,layoutFrom({[LAYOUT]:{partyDock:'bottom'}}).partyY],[1,1]);
});

test('Party wraps to exactly the requested cards per row when viewport fits',()=>{
 const box=(cols,n)=>dockedPanels([1280,920],{party:true,partyColumns:cols,partyX:.25,partyY:.5,initiative:false},n,0,true).party;
 const two=box(2,5),three=box(3,5),five=box(5,5);
 assert.equal(two.columns,2);
 assert.equal(two.width,323);
 assert.equal(two.height,32+3*74+2*5);
 assert.equal(three.columns,3);
 assert.equal(three.width,483);
 assert.equal(three.height,32+2*74+5);
 assert.equal(five.columns,5);
 assert.equal(five.width,803);
 assert.equal(five.height,106);
 assert.equal(box(6,2).columns,2,'never reserve empty column slots');
});

test('Party responds to narrower windows and clamps dragging inside viewport',()=>{
 const layout={party:true,partyColumns:5,partyX:.4,partyY:.3,initiative:false};
 const narrow=dockedPanels([330,520],layout,5,0,true).party;
 assert.equal(narrow.columns,1);
 assert.equal(narrow.width,163);
 assert.ok(narrow.height<=520);
 const wide=dockedPanels([1000,800],layout,5,0,true).party;
 const moved=moveParty(layout,wide,[1000,800],60,45);
 assert.ok(moved.partyX>layout.partyX);
 assert.ok(moved.partyY>layout.partyY);
 assert.deepEqual(moveParty(layout,wide,[1000,800],-9999,-9999),{partyX:0,partyY:0});
 assert.deepEqual(moveParty(layout,wide,[1000,800],9999,9999),{partyX:1,partyY:1});
 assert.equal(moveParty(layout,wide,[1000,800],NaN,0),null);
 assert.equal(dockedPanels([1000,800],{...layout,party:false},5,0,true).party,null);
});

test('NPC privacy eye sends no HP, MP or AC data to non-GM clients, including defenses',()=>{
 const token={id:'boss',type:'IMAGE',layer:'CHARACTER',name:'Boss',visible:true,metadata:{[BATTLE]:{enabled:true,npcId:'npc-boss',hp:21,hpMax:45,hpTemp:3,mp:17,mpMax:20,ac:22,touch:16,flat:19,cmd:31,hpHidden:true}}};
 const gm=battleRows([token],[]);
 const player=battleHpForViewer(gm,{gm:false,npcHp:true});
 for(const key of ['hp','hpMax','hpTemp','mp','mpMax','ac','touch','flat','cmd'])assert.equal(player[0][key],null,key+' leaked');
 assert.equal(gm[0].hp,21);
 assert.equal(gm[0].ac,22);
 assert.equal(gm[0].mp,17);
 assert.equal(Object.hasOwn(player[0],'hpHidden'),false);
});

test('Party overlay supports GM drag handle, while Admin settings is collapsed and column control is present',async()=>{
 const overlay=await readFile(new URL('../src/owlbear/party-overlay.mjs',import.meta.url),'utf8');
 const background=await readFile(new URL('../src/owlbear/background.mjs',import.meta.url),'utf8');
 const html=await readFile(new URL('../scripts/build-owlbear.mjs',import.meta.url),'utf8');
 const view=await readFile(new URL('../src/owlbear/initiative-view.mjs',import.meta.url),'utf8');
 assert.match(overlay,/data-party-drag/);
 assert.match(overlay,/pointerdown/);
 assert.match(overlay,/party-move/);
 assert.match(overlay,/handle\.hidden=!state\.admin/);
 assert.match(background,/if\(d\.type==='party-move'\)/);
 assert.match(background,/moveParty\(/);
 assert.doesNotMatch(background,/cosmosActionOpen\?\{\.\.\.dimensions,party:null\}/);
 assert.match(html,/data-layout="partyColumns"/);
 assert.doesNotMatch(html,/data-layout="partyDock"/);
 assert.match(html,/<details class="cosmos-admin-settings" data-admin-settings hidden>/);
 assert.match(view,/battle-hp-privacy/);
 assert.match(view,/untracked=row\[key\]===null/);
 assert.match(view,/ac\.textContent=row\.ac===null\?'—'/);
});
