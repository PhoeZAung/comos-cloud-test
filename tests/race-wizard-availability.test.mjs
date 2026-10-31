import test from 'node:test';
import assert from 'node:assert/strict';
import {registry,newBuild,buildIssues,compileBuild} from '../src/features/characters/rules/build.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
const get=key=>registry.races.find(r=>r.id==='ffd20:race:'+key);
test('Half-Breed parent and inherited-trait requirements cannot be bypassed by disabling every racial trait',()=>{
 const b=newBuild();Object.assign(b,{name:'Incomplete Half-Breed',raceId:'ffd20:race:half-breed',classId:'ffd20:class:dancer',hpRolls:[8],reviewed:true});
 b.skillRanks=fixedSkills.map((_,i)=>i<4?1:0);
 for(const disabled of [[],get('half-breed').data.standardTraitIds]){
  b.disabledTraits=[...disabled];
  assert(buildIssues(b,{complete:false}).some(i=>/two legal parent races/.test(i.message)));
  assert.throws(()=>compileBuild(b),/two legal parent races/);
 }
});
test('all races have neutral names in the wizard while review metadata remains unchanged',()=>{
 assert.equal(registry.races.length,63);
 const b=newBuild();b.raceId=get('velkk').id;
 const html=renderBuild(b,2);
 assert.match(html,/Official Velkk rules/);
 assert.doesNotMatch(html,/\(testing\)|Testing race/);
 assert.equal(get('velkk').reviewStatus,'needs_review');
});
test('critical trait choices and heritages are dimmed individually',()=>{
 const b=newBuild();b.raceId=get('viera').id;
 const html=renderBuild(b,2);
 assert.match(html,/rw-trait--review/);
 assert.match(html,/data-rw-trait="ffd20:race:viera:trait:elemental-summoner" disabled/);
 b.raceId=get('lamia').id;
 const heritage=get('lamia').data.heritages[0].id;
 assert.match(renderBuild(b,2),new RegExp('value="'+heritage+'"[^>]*disabled'));
});
test('unsupported standard trait choices and unavailable alternates cannot bypass validation',()=>{
 const b=newBuild();b.raceId=get('ixal').id;
 assert(buildIssues(b).some(i=>/Elemental Summoner/.test(i.message)));
 b.raceId=get('sylph').id;b.alternateIds=[b.raceId+':trait:improved-flight'];
 assert(buildIssues(b).some(i=>/Improved Flight/.test(i.message)));
});

test('Beastkin uses normal wizard name and greys out only unsupported alternates',()=>{
 const b=newBuild();b.raceId='ffd20:race:beastkin';const html=renderBuild(b,2);
 assert.match(html,/Official Beastkin rules/);assert.doesNotMatch(html,/Beastkin \(testing\)|Testing race/);
 for(const id of ['alluring','light-build','loper']){assert.match(html,new RegExp('data-rw-alternate="ffd20:race:beastkin:trait:'+id+'"'));assert.doesNotMatch(html,new RegExp('data-rw-alternate="ffd20:race:beastkin:trait:'+id+'" disabled'));}assert.match(html,/data-rw-alternate="ffd20:race:beastkin:trait:feral" disabled/);
 assert.match(html,/data-rw-alternate="ffd20:race:beastkin:trait:civilized"/);
 assert.doesNotMatch(html,/data-rw-alternate="ffd20:race:beastkin:trait:civilized" disabled/);
});
