import test from 'node:test';
import assert from 'node:assert/strict';
import {registry,newBuild,buildIssues,raceTraits,compileBuild,levelUpBuild,previewBuild} from '../src/features/characters/rules/build.mjs';
import {racialChoiceSpecs,GRIA_WEAPON,namazuFocusSlot} from '../src/features/characters/rules/racial-choices.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {classHitDie} from '../src/features/characters/rules/class-adapters.mjs';
import {familyFixture,advanceFamily,completeFamilyBuild} from './helpers/sheet-family-fixtures.mjs';

const race=slug=>registry.races.find(r=>r.id==='ffd20:race:'+slug);
const named=slug=>({...newBuild(),name:'Patch 3B '+slug,alignment:'True Neutral',
 raceId:race(slug).id,classId:'ffd20:class:dancer',reviewed:true});
function finish(b){
 b.hpRolls=[classHitDie(b)];b.skillRanks=fixedSkills.map(()=>0);
 for(let i=0,n=previewBuild(b).skillBudget;i<fixedSkills.length&&n>0;i++,n--)b.skillRanks[i]=1;
 return b;
}

test('Gria chooses Weapon Focus only from confirmed racial proficiencies and keeps feat on sheet',()=>{
 const b=named('gria');
 const spec=racialChoiceSpecs(race('gria'),raceTraits(b).traits).find(s=>s.id===GRIA_WEAPON);
 assert.deepEqual(spec.options.map(o=>o.name),['Knight sword','Longbow','Composite longbow']);
 assert.match(renderBuild(b,2),new RegExp('data-rw-racial-choice="'+GRIA_WEAPON+'"'));
 assert(buildIssues(b,{complete:false}).some(x=>/Weapon Focus weapon: choose 1/.test(x.message)));
 b.racialChoices[GRIA_WEAPON]=[spec.options[1].id];
 const data=compileBuild(finish(b));
 assert.match(data.proficiencies,/Knight sword/);
 assert.match(data.proficiencies,/Longbow/);
 const feat=data.feats.find(x=>x.sourceRuleId==='ffd20:race:gria:bonus-feat:weapon-focus');
 assert.equal(feat.name,'Weapon Focus (Longbow)');
 assert.equal(feat.pendingFeat,false);
 assert.equal(feat.automation,'manual');
 assert.deepEqual(compileBuild(data.rulesBuild.input,data).rulesBuild.input.racialChoices,b.racialChoices);
 const changed=structuredClone(b);changed.racialChoices[GRIA_WEAPON]=[spec.options[0].id];
 assert.throws(()=>compileBuild(changed,data),/cannot be changed/);
 const invalid=structuredClone(b);invalid.racialChoices[GRIA_WEAPON]=['forged'];
 assert(buildIssues(invalid,{complete:false}).some(x=>/Invalid or duplicate Weapon Focus weapon/.test(x.message)));
});

test('Gria cannot choose non-proficient weapons or silently use removed Weapon Familiarity',()=>{
 const b=named('gria'),r=race('gria'),weapon=r.id+':trait:weapon-familiarity';
 b.disabledTraits=[weapon];const specs=racialChoiceSpecs(r,raceTraits(b).traits);
 assert.equal(specs.find(x=>x.id===GRIA_WEAPON).options.length,0);
 assert(buildIssues(b,{complete:false}).some(x=>/verified proficient weapon/.test(x.message)));
});

test('Namazu Focused Study removes exactly Festive Culture and Skilled Traders, not unrelated racial traits',()=>{
 const b=named('namazu'),r=race('namazu');b.alternateIds=[r.id+':trait:focused-study'];
 const result=raceTraits(b),ids=new Set(result.traits.map(f=>f.id));
 assert.deepEqual(result.errors,[]);
 for(const slug of ['festive-culture','skilled-traders'])assert(!ids.has(r.id+':trait:'+slug));
 for(const slug of ['craftsman','craftsman-knowledge','water-sense','base-speed'])assert(ids.has(r.id+':trait:'+slug));
 const op=r.data.alternateReplacements.find(x=>x.id===r.id+':trait:focused-study:replacement');
 assert.equal(op.scope,'partial_feature'); // original staging remains unmodified
 assert(buildIssues(b,{complete:false}).some(x=>/Focused Study.*level 1: choose 1/.test(x.message)));
 b.racialChoices[namazuFocusSlot(1)]=['skill-row:29'];
 const card=compileBuild(finish(b)).feats.find(f=>f.sourceRuleId===r.id+':bonus-feat:skill-focus:1');
 assert.equal(card.name,'Skill Focus (Perception)');
 assert.equal(card.pendingFeat,false);
 assert.equal(card.automation,'manual');
 assert(!buildIssues(b,{complete:false}).some(x=>/Focused Study.*choose 1/.test(x.message)));
 b.racialChoices[namazuFocusSlot(8)]=['skill-row:30'];
 assert(buildIssues(b,{complete:false}).some(x=>/Unknown or inactive racial choice/.test(x.message)));
});

test('Namazu earns separate and unchangeable Focus selections exactly at level 8 and level 16',()=>{
 const b=familyFixture('ffd20:class:warrior');
 b.raceId='ffd20:race:namazu';b.alternateIds=[b.raceId+':trait:focused-study'];
 b.racialChoices={[namazuFocusSlot(1)]:['skill-row:29']};
 let data=compileBuild(completeFamilyBuild(b));
 let prior;
 for(let level=2;level<=16;level++){
  const next=advanceFamily(data);
  if(level===8||level===16){
   assert.match(renderBuild(next,9,{mode:'levelup',baseline:data.rulesBuild.input}),new RegExp('data-rw-racial-choice="'+namazuFocusSlot(level)+'"'));
   assert(buildIssues(next,{complete:false}).some(x=>x.message.includes('Focused Study · level '+level)));
   next.racialChoices[namazuFocusSlot(level)]=['skill-row:'+(level===8?20:27)];
   const bad=structuredClone(next);bad.racialChoices[namazuFocusSlot(level)]=['skill-row:29'];
   assert(buildIssues(bad,{complete:false}).some(x=>/different skill/.test(x.message)));
  }
  prior=data;data=levelUpBuild(next,data);
  assert.equal(data.feats.filter(f=>f.sourceRace==='Namazu'&&f.name.startsWith('Skill Focus')).length,
    level>=16?3:level>=8?2:1);
 }
 assert.equal(data.level,16);
 assert(data.feats.some(f=>f.sourceRuleId==='ffd20:race:namazu:bonus-feat:skill-focus:16'));
 const replaced=structuredClone(data.rulesBuild.input);replaced.racialChoices[namazuFocusSlot(1)]=['skill-row:1'];
 assert.throws(()=>compileBuild(replaced,data),/cannot be changed/);
 const retro=structuredClone(prior.rulesBuild.input);retro.racialChoices[namazuFocusSlot(16)]=['skill-row:18'];
 assert(buildIssues(retro,{complete:false}).some(x=>/Unknown or inactive racial choice/.test(x.message)));
});
