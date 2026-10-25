import test from 'node:test';
import assert from 'node:assert/strict';
import {browseLore,renderLoreLibrary} from '../src/features/lore/library.mjs';
const entries=[
 {id:'1',title:'Beta',excerpt:'moon',worldId:'w1',worldName:'One',partyId:'p1',partyName:'A',updatedAt:'2026-01-03'},
 {id:'2',title:'Alpha',excerpt:'lake',worldId:'w1',worldName:'One',playerId:'user1',updatedAt:'2026-01-01'},
 {id:'3',title:'Gamma',excerpt:'moon',worldId:'w2',worldName:'Two',partyId:'p2',partyName:'B',updatedAt:'2026-01-02'},
 {id:'4',title:'Delta',excerpt:'sun',worldId:'w2',worldName:'Two',updatedAt:'2026-01-04'}
];
test('Step 6.1 four sorts are stable, bounded and paginated',()=>{
 assert.deepEqual(browseLore(entries,{sort:'az'}).entries.map(x=>x.title),['Alpha','Beta','Delta','Gamma']);
 assert.deepEqual(browseLore(entries,{sort:'za'}).entries.map(x=>x.title),['Gamma','Delta','Beta','Alpha']);
 assert.deepEqual(browseLore(entries,{sort:'newest'}).entries.map(x=>x.title),['Delta','Beta','Gamma','Alpha']);
 assert.deepEqual(browseLore(entries,{sort:'oldest'}).entries.map(x=>x.title),['Alpha','Gamma','Beta','Delta']);
 assert.deepEqual(browseLore(entries,{sort:'az',page:2,pageSize:2}).entries.map(x=>x.title),['Delta','Gamma']);
 assert.equal(browseLore(entries,{page:500,pageSize:2}).page,2);
});
test('Step 6.1 search, world, party and personal filters intersect',()=>{
 assert.deepEqual(browseLore(entries,{worldId:'w1',partyId:'p1'}).entries.map(x=>x.title),['Beta']);
 assert.deepEqual(browseLore(entries,{scope:'personal'}).entries.map(x=>x.title),['Alpha']);
 assert.deepEqual(browseLore(entries,{query:'MOON'}).entries.map(x=>x.title),['Beta','Gamma']);
 assert.equal(browseLore(entries,{worldId:'w2',scope:'personal'}).total,0);
});
test('Step 6.1 client escaped markup and no live scope leakage',()=>{
 const markup=renderLoreLibrary({entries:[{id:'fixture:lore:<x>',title:'<img src=x onerror=alert(1)>',worldId:'w<svg>',worldName:'<world>',excerpt:'<script>x</script>'}],preview:true});
 assert.doesNotMatch(markup,/<img src=x|<script>|<world>/);assert.match(markup,/&lt;world&gt;/);assert.match(markup,/&lt;script&gt;/);
 const live=renderLoreLibrary();assert.doesNotMatch(live,/World 01|fixture:/);assert.match(live,/No matching lore entries/);
});
test('Step 6.1 error/loading/empty states and allowed sort validate',()=>{
 for(const state of ['error','loading','empty'])assert.match(renderLoreLibrary({entries,state}),/role="status"/);
 assert.throws(()=>browseLore(entries,{sort:'bogus'}),/Invalid lore sort/);
});