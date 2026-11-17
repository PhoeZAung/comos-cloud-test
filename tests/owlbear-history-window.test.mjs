import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {historyPage,nextHistoryLimit,HISTORY_BATCH_SIZE} from '../src/owlbear/history-window.mjs';

test('Roll and combat history show the latest five; Load More reveals five more without deleting anything',()=>{
 const all=Array.from({length:17},(_,i)=>({id:'event-'+(17-i),time:17-i}));
 assert.equal(HISTORY_BATCH_SIZE,5);
 const first=historyPage(all);
 assert.equal(first.rows.length,5);
 assert.equal(first.rows[0].id,'event-17');
 assert.equal(first.rows.at(-1).id,'event-13');
 assert.equal(first.remaining,12);
 assert.equal(first.hasMore,true);
 const ten=historyPage(all,nextHistoryLimit(5));
 assert.equal(ten.rows.length,10);
 assert.equal(ten.remaining,7);
 const last=historyPage(all,20);
 assert.equal(last.rows.length,17);
 assert.equal(last.hasMore,false);
 assert.equal(all.length,17,'full history is unchanged');
 assert.deepEqual(historyPage(null).rows,[]);
 assert.equal(nextHistoryLimit(),10);
});

test('Combat history opens in Settings beneath Roll History, not in Initiative',async()=>{
 const src=await readFile(new URL('../scripts/build-owlbear.mjs',import.meta.url),'utf8');
 const initiative=src.match(/<section role="tabpanel" id="panel-initiative"[\s\S]*?<section role="tabpanel" id="panel-settings"/)?.[0];
 assert.ok(initiative,'Initiative tab markup exists');
 assert.doesNotMatch(initiative,/data-combat-history/,'combat log should not consume initiative space');
 const settings=src.match(/<section role="tabpanel" id="panel-settings"[\s\S]*?<section role="tabpanel" id="panel-character"/)?.[0];
 assert.ok(settings,'Settings tab markup exists');
 assert.match(settings,/<details class="history-disclosure" data-history-details>/);
 assert.match(settings,/<details class="history-disclosure combat-history" data-combat-history>/);
 assert.doesNotMatch(settings,/data-combat-history open/,'Combat History starts collapsed');
 assert.ok(settings.indexOf('data-combat-history')>settings.indexOf('data-history-details'),'Combat History comes after Roll History');
 assert.match(settings,/data-roll-load-more hidden/);
 assert.match(settings,/data-combat-load-more hidden/);
 const action=await readFile(new URL('../src/owlbear/action.mjs',import.meta.url),'utf8');
 assert.match(action,/historyRoot:document/);
});

test('Both history views paginate only their rendered rows, never truncate their stored arrays',async()=>{
 const panel=await readFile(new URL('../src/owlbear/panel.mjs',import.meta.url),'utf8');
 const initiative=await readFile(new URL('../src/owlbear/initiative-view.mjs',import.meta.url),'utf8');
 for(const src of [panel,initiative]){
  assert.match(src,/historyPage\(/);
  assert.match(src,/nextHistoryLimit\(/);
 }
 assert.match(panel,/allRolls=rows/);
 assert.match(panel,/for\(const row of visible\)/);
 assert.match(initiative,/for\(const event of recent\)/);
 assert.match(initiative,/events=Array\.isArray\(value\)\?value\.slice\(0,120\)/,'combat history data is retained for loading more');
});

test('GM HP privacy command is allowed through the background message router',async()=>{
 const background=await readFile(new URL('../src/owlbear/background.mjs',import.meta.url),'utf8');
 assert.match(background,/\['layout','party-ac-popup','recommend-setting','combat-validation','combat-decision','end-battle','stats','initiative','turn','add','remove','npc-hp-visibility'\]/);
 assert.match(background,/d\.type==='npc-hp-visibility'/);
 assert.match(background,/item\.metadata\[BATTLE\]\.hpHidden=d\.hidden/);
 const view=await readFile(new URL('../src/owlbear/initiative-view.mjs',import.meta.url),'utf8');
 assert.match(view,/type:'npc-hp-visibility'/);
 assert.match(view,/data-key="hp"/);
 assert.match(view,/battle-hp-privacy/);
});

test('GM Party overlay stays visible, supports directional docking and safe resizing',async()=>{
 const background=await readFile(new URL('../src/owlbear/background.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(background,/cosmosActionOpen\?\{\.\.\.dimensions,party:null\}:dimensions/,'do not hide Party from GM');
 assert.match(background,/d\.key==='partyDock'/);
 assert.match(background,/d\.key==='partySize'/);
 assert.doesNotMatch(background,/party-move|moveParty/);
 assert.match(background,/OBR\.popover\.setWidth\(id,width\)/);
 assert.match(background,/OBR\.popover\.setHeight\(id,height\)/);
 assert.match(background,/anchorPosition:\{left:anchor\.left,top:anchor\.top\}/);
 const html=await readFile(new URL('../scripts/build-owlbear.mjs',import.meta.url),'utf8');
 assert.match(html,/data-layout="partyColumns"/);
 assert.match(html,/data-party-dock="top"/);
 assert.match(html,/data-layout="partySize"/);
 assert.doesNotMatch(html,/data-party-drag/);
 assert.match(html,/<details class="cosmos-admin-settings" data-admin-settings hidden>/);
});
