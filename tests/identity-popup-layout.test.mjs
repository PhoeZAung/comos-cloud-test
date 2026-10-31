import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderIdentityEditor} from '../src/ui/sheet.mjs';
import {renderSection} from '../src/features/sheet/view.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';

const saved={size_category:'Small',languages:'Common, Aegyllan',senses:'Darkvision',speed:30,speed_burrow:10,speed_climb:15,speed_fly:20,speed_swim:25,speed_fly_maneuverability:'poor'};

test('Identity popup groups character details and movement speeds without extra descriptions or maneuverability control',()=>{
 const html=renderIdentityEditor(saved);
 assert.equal((html.match(/<fieldset class="cs-identity-group"/g)||[]).length,2);
 assert.match(html,/<legend>Character details<\/legend>/);
 assert.match(html,/<legend>Movement speeds<\/legend>/);
 const first=html.indexOf('cs-identity-details'),second=html.indexOf('cs-identity-movement');
 assert.ok(first>0&&second>first);
 const details=html.slice(first,second),movement=html.slice(second);
 assert.deepEqual([...details.matchAll(/name="([^"]+)"/g)].map(m=>m[1]),['size_category','languages','senses']);
 assert.deepEqual([...movement.matchAll(/name="([^"]+)"/g)].map(m=>m[1]),['speed','speed_burrow','speed_climb','speed_fly','speed_swim']);
 assert.match(movement,/name="speed"[^>]*value="30"/);
 assert.match(movement,/name="speed_fly"[^>]*value="20"/);
 assert.doesNotMatch(html,/speed_fly_maneuverability|Fly Maneuverability|cs-movement-hint|cs-movement-summary|Tunneling;|hazardous|ascent restrictions/i);
 assert.equal((html.match(/name="speed"/g)||[]).length,1);
});
test('Identity overview has only the header edit action, with land speed visible and no extra descriptions',()=>{
 const html=renderSection({id:'a',name:'One Edit',data:{...saved,racialIdentity:{rules:[{name:'Base Speed',description:'Long flight explanation'}]}}},'overview');
 const identity=html.slice(html.indexOf('<h2>Identity</h2>'),html.indexOf('<h2>Proficiencies</h2>'));
 assert.ok(identity.length>0);
 assert.equal((identity.match(/data-edit-stats="identity"/g)||[]).length,1);
 assert.match(identity,/Speed<\/dt><dd>30 ft/);
 assert.doesNotMatch(identity,/cs-speed-trigger|cs-movement-summary|Fly 20 ft|Racial identity rules|Long flight explanation/);
});
test('Removing fly maneuverability from editor does not erase existing stored values or other speed updates',()=>{
 const html=renderIdentityEditor(saved);
 assert.doesNotMatch(html,/name="speed_fly_maneuverability"/);
 const changed=mergeSheetData(saved,{action:'fields',fields:{speed:35,speed_burrow:5,speed_climb:20,speed_fly:40,speed_swim:0}});
 assert.equal(changed.speed_fly_maneuverability,'poor');
 assert.deepEqual([changed.speed,changed.speed_burrow,changed.speed_climb,changed.speed_fly,changed.speed_swim],[35,5,20,40,0]);
});
test('Identity modal uses two tidy columns on desktop and one on narrow screens',()=>{
 const css=readFileSync(new URL('../src/styles/sheet.css',import.meta.url),'utf8');
 assert.match(css,/\.cs-identity-fields\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:460px\)\{\.cs-identity-fields\{grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/\.cs-identity-fields>\.cs-field:first-child\{grid-column:1\/-1\}/);
 assert.doesNotMatch(css,/\.cs-speed-trigger\{/);
});
