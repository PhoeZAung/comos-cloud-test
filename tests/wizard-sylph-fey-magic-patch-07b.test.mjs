import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,raceTraits,previewBuild,compileBuild,registry} from '../src/features/characters/rules/build.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {racialCounter} from '../src/features/characters/rules/racial-progress.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';

const ID='ffd20:race:sylph',prefix=ID+':trait:fey-magic:uses:';
function fixture(disable=false){
 const b=newBuild();Object.assign(b,{name:'Sylph Fey Magic test',classId:'ffd20:class:monk',
  raceId:ID,alignment:'True Neutral',reviewed:true});
 b.hpRolls=[classHitDie(b)];b.skillRanks=fixedSkills.map(()=>0);
 const budget=previewBuild(b).skillBudget;
 for(let i=0,left=budget;i<fixedSkills.length&&left>0;i++,left--)b.skillRanks[i]=1;
 if(disable)b.disabledTraits=[ID+':trait:fey-magic'];
 return b;
}
const cards=b=>raceTraits(b).traits.filter(f=>f.id.startsWith(prefix));

test('Sylph standard Fey Magic creates four source-named individual daily and weekly SLA counters',()=>{
 const b=fixture();
 const slate=cards(b);assert.deepEqual(slate.map(f=>f.id),[
  prefix+'hidden-presence',prefix+'charm',prefix+'lesser-confusion',prefix+'sleep']);
 assert.deepEqual(slate.map(f=>racialCounter(b,f)?.maximum),[1,3,3,3]);
 for(const f of slate){assert.match(f.description,/spell-like ability/);
  assert.match(f.description,/Caster level equals character level/);
  assert.match(f.description,/Charisma/);
  assert.match(f.description,/reset at the source-defined (?:day|week)/);}
 assert.match(renderBuild(b,2),/Fey Magic: illusion spells gain \+1 DC/);
 assert.equal(cards(fixture(true)).length,0);
});

test('Sylph Fey Magic counts render and persist as racial abilities, without restoring weekly powers on long rest',()=>{
 const b=fixture(),sheet=compileBuild(b);
 const rows=sheet.racialAbilities.filter(x=>x.sourceRuleId?.startsWith(prefix));
 assert.equal(rows.length,4);
 assert.deepEqual(rows.map(x=>x.u_max),[1,3,3,3]);
 assert.deepEqual(rows.map(x=>x.u_curr),[1,3,3,3]);
 assert(rows.every(x=>x.restoreOnLongRest===false));
 assert(!sheet.spells?.some(s=>s.sourceRuleId?.startsWith(prefix)),'SLA is not a learned class spell');
 const touched=mergeSheetData(sheet,{action:'entry',collection:'racialAbilities',
  index:sheet.racialAbilities.findIndex(x=>x.sourceRuleId===prefix+'charm'),mode:'update',fields:{u_curr:2}});
 const reopened=compileBuild(touched.rulesBuild.input,touched);
 const active=reopened.racialAbilities.find(x=>x.sourceRuleId===prefix+'charm');
 assert.equal(active.u_curr,2);
 assert.equal(mergeSheetData(reopened,{action:'rest'}).racialAbilities.find(x=>x.sourceRuleId===prefix+'charm').u_curr,2);
 const absent=compileBuild(fixture(true));
 assert(!absent.racialAbilities.some(x=>x.sourceRuleId?.startsWith(prefix)));
});

test('Sylph Fey Magic never automatically assigns variant heritage spell packages',()=>{
 const sylph=registry.races.find(r=>r.id===ID);
 assert.equal(sylph.data.heritages.length,3);
 for(const heritage of sylph.data.heritages)assert(heritage.replacements.some(x=>x.targetFeatureIds.includes(ID+':trait:fey-magic')));
 const base=fixture();const normal=cards(base);assert.equal(normal.length,4);
 const invalid={...base,heritageId:sylph.data.heritages[0].id};
 assert(raceTraits(invalid).errors.some(e=>/verified replacement/.test(e)));
});
