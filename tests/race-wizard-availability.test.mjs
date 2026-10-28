import test from 'node:test';
import assert from 'node:assert/strict';
import {registry,newBuild,buildIssues} from '../src/features/characters/rules/build.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
const get=key=>registry.races.find(r=>r.id==='ffd20:race:'+key);
test('all races have neutral names in the wizard while review metadata remains unchanged',()=>{
 assert.equal(registry.races.length,59);
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
