import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LAYOUT,layoutFrom,BATTLE,battleRows,battleHpForViewer} from '../src/owlbear/battle-state.mjs';
import {dockedPanels,PARTY_SIZES} from '../src/owlbear/docking.mjs';

test('Party defaults to Medium, and accepts four size and direction presets',()=>{
 const defaults=layoutFrom({});
 assert.equal(defaults.party,true);assert.equal(defaults.partySize,'medium');assert.equal(defaults.partyDock,'top');assert.equal(defaults.partyColumns,3);
 for(const size of ['large','medium','small','compact'])assert.equal(layoutFrom({[LAYOUT]:{partySize:size}}).partySize,size);
 for(const dock of ['top','bottom','left','right'])assert.equal(layoutFrom({[LAYOUT]:{partyDock:dock}}).partyDock,dock);
 assert.equal(layoutFrom({[LAYOUT]:{partySize:'gigantic'}}).partySize,'medium');
 assert.equal(layoutFrom({[LAYOUT]:{partyDock:'overlay'}}).partyDock,'top');
 assert.equal(PARTY_SIZES.medium.cardWidth,155);
 assert.ok(PARTY_SIZES.compact.cardWidth<PARTY_SIZES.small.cardWidth);
 assert.ok(PARTY_SIZES.large.cardHeight>PARTY_SIZES.medium.cardHeight);
});

test('Party direction places cards within protected Owlbear top and side lanes',()=>{
 const view=[1110,857],layout={party:true,partyColumns:5,partySize:'medium',initiative:false};
 const positions=Object.fromEntries(['top','bottom','left','right'].map(dock=>[dock,dockedPanels(view,{...layout,partyDock:dock},5,0,true).party]));
 for(const p of Object.values(positions)){
  assert.equal(p.columns,5);assert.equal(p.width,803);
  assert.ok(p.x>=170,'never cover top-left Owlbear extension buttons');
  assert.ok(p.x+p.width<=1110-88,'never cover Owlbear right tool strip');
  assert.ok(p.y>=76,'never cover Owlbear top toolbar');
  assert.ok(p.y+p.height<=857-76,'leave room for Owlbear bottom controls');
 }
 assert.equal(positions.top.y,76);
 assert.equal(positions.left.x,170);
 assert.equal(positions.right.x,1110-88-803);
 assert.ok(positions.bottom.y>positions.top.y);
 assert.ok(positions.left.y>positions.top.y);
});

test('Party size controls card geometry, columns and safe bounds on narrow screens',()=>{
 const size=(preset)=>dockedPanels([1280,920],{party:true,partySize:preset,partyColumns:3,partyDock:'top'},5,0,true).party;
 const large=size('large'),medium=size('medium'),small=size('small'),compact=size('compact');
 assert.equal(medium.width,483);assert.equal(medium.height,28+2*74+5);
 assert.ok(large.width>medium.width);assert.ok(large.height>medium.height);
 assert.ok(medium.width>small.width&&small.width>compact.width);
 assert.ok(medium.height>small.height&&small.height>compact.height);
 const narrow=dockedPanels([330,520],{party:true,partySize:'medium',partyColumns:6,partyDock:'right'},5,0,true).party;
 assert.equal(narrow.columns,1);assert.ok(narrow.x>=0);assert.ok(narrow.x+narrow.width<=330);
 assert.equal(dockedPanels([1000,800],{party:false},5,0,true).party,null);
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

test('Party HUD removes dragging, offers directional controls, and AC editor preserves existing rights',async()=>{
 const overlay=await readFile(new URL('../src/owlbear/party-overlay.mjs',import.meta.url),'utf8');
 const background=await readFile(new URL('../src/owlbear/background.mjs',import.meta.url),'utf8');
 const html=await readFile(new URL('../scripts/build-owlbear.mjs',import.meta.url),'utf8');
 const view=await readFile(new URL('../src/owlbear/initiative-view.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(overlay,/data-party-drag|pointerCapture|pointerdown/);
 assert.doesNotMatch(background,/party-move|moveParty/);
 assert.doesNotMatch(html,/data-party-drag/);
 assert.match(html,/data-layout="partySize"/);
 for(const direction of ['top','bottom','left','right'])assert.match(html,new RegExp('data-party-dock="'+direction+'"'));
 for(const size of ['large','medium','small','compact'])assert.match(html,new RegExp('<option value="'+size+'"'));
 assert.match(html,/data-simple-hit-miss/);
 assert.match(overlay,/party-defense-edit/);
 assert.match(overlay,/type:'party-ac-popup'/);
 assert.match(background,/type==='party-ac-popup'/);
 assert.match(html,/party-ac-editor\.js/);
 assert.match(html,/<details class="cosmos-admin-settings" data-admin-settings hidden>/);
 assert.match(view,/battle-hp-privacy/);
 assert.match(view,/untracked=row\[key\]===null/);
 assert.match(view,/ac\.textContent=row\.ac===null\?'—'/);
});
