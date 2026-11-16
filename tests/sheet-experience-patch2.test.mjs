import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sheetTabURL,createSheetTabs} from '../src/ui/sheet-tabs.mjs';
import {renderSection,renderSheetFrame} from '../src/features/sheet/view.mjs';

test('switching character sheet tabs retains each character weapon filter, not another character\'s',()=>{
 const initial='https://cosmos.test/sheet.html?characterId=a&section=combat&weaponView=Ammunition&itemTag=Gear';
 const next=sheetTabURL(initial,'b');
 assert.equal(next.searchParams.get('characterId'),'b');
 assert.equal(next.searchParams.has('weaponView'),false);
 const filtered=sheetTabURL(initial,'b',{section:'combat',weaponView:'Ranged Weapon',itemTag:'Food'});
 assert.equal(filtered.searchParams.get('weaponView'),'Ranged Weapon');
 assert.equal(filtered.searchParams.get('itemTag'),'Food');
 const tabs=createSheetTabs();tabs.add({id:'a',name:'A'});tabs.add({id:'b',name:'B'});
 tabs.remember('a',{section:'combat',weaponView:'Ammunition',weaponsCollapsed:true,showStars:true,scrollY:420});
 tabs.remember('b',{section:'items',weaponView:'Weapon',showStars:false,scrollY:10});
 assert.equal(tabs.view('a').weaponView,'Ammunition');
 assert.equal(tabs.view('b').weaponView,'Weapon');
 assert.equal(tabs.view('a').scrollY,420);
});

test('favorited ammunition shows edit and unfavorite controls but never a weapon dice roll',()=>{
 const data={str:12,dex:14,bab:3,weapons:[
  {sourceCategory:'Ammunition',name:'Magic Arrows',amount:7,favorite:true},
  {sourceCategory:'Weapon',name:'Dagger',damage:'1d4',favorite:true}
 ]};
 const html=renderSection({id:'hero',name:'Hero',data},'favorites');
 assert.match(html,/cs-favorites-view/);
 assert.match(html,/cs-favorite-ammunition/);
 assert.match(html,/data-edit-weapon-ammo="weapons:0"/);
 assert.match(html,/data-favorite="weapons:0"/);
 assert.doesNotMatch(html,/data-weapon-roll="0"/);
 assert.match(html,/data-weapon-roll="1"/);
});

test('personal notes offer autosave status and draft recovery; sheet exposes manual recovery on save errors',async()=>{
 const html=renderSheetFrame({id:'hero',name:'Hero',data:{notesArea:'Remember the wizard'}},'notes');
 assert.match(html,/data-notes-autosave-status/);
 assert.match(html,/data-sheet-copy-draft hidden/);
 const ui=await readFile(new URL('../src/ui/sheet.mjs',import.meta.url),'utf8');
 const notes=await readFile(new URL('../src/ui/sheet-personal-notes.mjs',import.meta.url),'utf8');
 assert.match(ui,/mountPersonalNotes\(root,\{characterId:id,save\}\)/);
 assert.match(ui,/AbortSignal\.timeout\(body\?20000:15000\)/);
 assert.match(ui,/saveFailureDraft=\{characterId:id,revision:character\.revision/);
 assert.match(ui,/data-sheet-copy-draft/);
 assert.match(ui,/disposePersonalNotes\.dispose\(\)/);
 assert.match(notes,/sessionStorage/);
 assert.match(notes,/Restore draft/);
 assert.match(notes,/Discard draft/);
 assert.match(notes,/setTimeout\(\(\)=>void flush\(\),1500\)/);
});
