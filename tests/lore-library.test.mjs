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
test('Lore has only icon search and owned-character tag controls',()=>{
 const html=renderLoreLibrary({entries,availableTags:[{id:'magic',name:'Arcane'},{id:'hero',name:'Heroes'}],selectedTags:['magic'],searchOpen:true,tagsOpen:true,query:'moon'});
 assert.match(html,/data-lore-toggle="search"/);
 assert.match(html,/data-lore-toggle="tags"/);
 assert.match(html,/data-lore-tag value="magic" checked/);
 assert.match(html,/name="query"/);
 assert.doesNotMatch(html,/<select|name="worldId"|name="partyId"|name="scope"|name="sort"|>Search<\/button>/);
 assert.doesNotMatch(html,/data-lore-tag value="missing"/);
 const noTags=renderLoreLibrary({availableTags:[],tagsOpen:true});
 assert.match(noTags,/No tags are attached to your characters yet/);
 assert.doesNotMatch(noTags,/data-lore-tag value=/);
});
test('only explicitly permitted character tags filter Lore, even if a forged tag is supplied',()=>{
 const tagged=[
  {id:'a',title:'Magical',updatedAt:'2026-01-01',tags:[{id:'magic',name:'Arcane'}]},
  {id:'b',title:'Heroic',updatedAt:'2026-01-02',tags:['hero']},
  {id:'c',title:'Hidden',updatedAt:'2026-01-03',tags:['secret']}
 ];
 const allowed=[{id:'magic',name:'Arcane'},{id:'hero',name:'Heroes'}];
 assert.deepEqual(browseLore(tagged,{selectedTags:['magic'],allowedTags:allowed}).entries.map(e=>e.id),['a']);
 assert.deepEqual(browseLore(tagged,{selectedTags:['magic','hero'],allowedTags:allowed}).entries.map(e=>e.id),['b','a']);
 assert.equal(browseLore(tagged,{selectedTags:['secret'],allowedTags:allowed}).total,0);
 assert.equal(browseLore(tagged,{selectedTags:['magic','secret'],allowedTags:allowed}).total,0);
 const markup=renderLoreLibrary({entries:tagged,availableTags:allowed,selectedTags:['secret'],tagsOpen:true});
 assert.doesNotMatch(markup,/value="secret"/);
 assert.match(markup,/value="magic"/);
});
test('Lore tag and search inputs are escaped',()=>{
 const html=renderLoreLibrary({availableTags:[{id:'a"><svg',name:'<script>alert(1)</script>'}],tagsOpen:true,searchOpen:true,query:'<img src=x onerror=alert(1)>'});
 assert.doesNotMatch(html,/<script>|<img src=x|<svg onload/);
 assert.match(html,/&lt;script&gt;/);
 assert.match(html,/&lt;img/);
});
