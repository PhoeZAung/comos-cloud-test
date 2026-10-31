import test from 'node:test';
import assert from 'node:assert/strict';
import {newBuild,compileBuild,previewBuild,prepareLevelUp,levelUpBuild,choiceEvents,eligibleOptions,classFeatureChanges} from '../src/features/characters/rules/build.mjs';
import {selectMartialChoice,martialChoicePools,AKIMBO_ID,GUNBREAKER_ID,DOOM_SLAYER_ID} from '../src/features/characters/rules/martial-progression.mjs';
import {fixedSkills} from '../src/features/sheet/skills.mjs';
import {renderBuild} from '../src/ui/rules-wizard.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
const CK='ffd20:class:chocobo-knight',DANCER='ffd20:class:dancer',MOG='ffd20:archetype:chocobo-knight:mog-knight';
const families=[[CK,''],[CK,MOG],[DANCER,''],[DANCER,AKIMBO_ID],[GUNBREAKER_ID,''],[GUNBREAKER_ID,DOOM_SLAYER_ID]];
function complete(b){
 for(let changed=true;changed;){changed=false;for(const event of choiceEvents(b))if(!b.choices[event.id]?.length&&!event.optional){const option=eligibleOptions(b,event)[0];assert(option,'eligible '+event.id);selectMartialChoice(b,event.id,option.id);changed=true;}}
 b.skillRanks??=fixedSkills.map(()=>0);let remaining=previewBuild(b).skillBudget-b.skillRanks.reduce((a,v)=>a+v,0);
 for(let i=0;i<b.skillRanks.length;i++){const n=Math.min(b.level-b.skillRanks[i],remaining);b.skillRanks[i]+=n;remaining-=n;}assert.equal(remaining,0);b.reviewed=true;return b;
}
function create([classId,archetypeId]){const b=newBuild(),pool='ffd20:race:moogle:pool:moogle-handy-craft-or-profession';Object.assign(b,{name:'Polish fixture',classId,archetypeId,raceId:'ffd20:race:moogle',hpRolls:[classId===DANCER?8:10],racialChoices:{[pool]:['skill-row:4']},racialSpecialties:{[pool]:'Woodworking'}});return compileBuild(complete(b));}
function draft(data){const {build}=prepareLevelUp(data);if(build.level%4===0)build.abilityIncreases[build.level]='cha';return complete(build);}
test('legacy initialChaMod absence does not block Mog Knight level 1→2; real changes remain rejected',()=>{
 const saved=create([CK,MOG]);delete saved.rulesBuild.input.initialChaMod;
 const {build,baseline}=prepareLevelUp(saved);assert.equal(saved.rulesBuild.input.initialChaMod,undefined);assert.equal(build.initialChaMod,null);assert.equal(baseline.initialChaMod,null);
 const raw=complete(build);assert.equal(levelUpBuild(raw,saved).level,2);
 for(const mutate of [b=>b.initialChaMod=1,b=>b.baseScores.cha++,b=>b.classId=DANCER,b=>b.archetypeId='',b=>b.raceId='ffd20:race:galka',b=>b.level=3]){const forged=structuredClone(raw);mutate(forged);assert.throws(()=>levelUpBuild(forged,saved));}
});
test('all six class paths use the wizard preparation through levels 1–20, including old optional fields and CHA milestones',()=>{
 for(const family of families){let data=create(family);
  for(const key of ['initialChaMod','initialIntMod','abilityMethod','pointBudget','scorePool','scoreAssignments'])delete data.rulesBuild.input[key];
  for(let level=2;level<=20;level++){
   const raw=draft(data);raw.baseScores=Object.fromEntries(Object.entries(raw.baseScores).reverse());
   data=levelUpBuild(raw,JSON.parse(JSON.stringify(data)));assert.equal(data.level,level);assert.equal(data.rulesBuild.input.initialChaMod,null);
   const owned=['activeAbilities','passiveAbilities','feats'].flatMap(k=>data[k].filter(x=>x.rulesOwned).map(x=>x.sourceRuleId));assert.equal(new Set(owned).size,owned.length);
  }
  assert.equal(data.cha,17);assert.throws(()=>prepareLevelUp(data),/already level 20/);
 }
});
test('sheet CHA edits and resource expenditure survive real wizard preparation for all class paths',()=>{
 for(const family of families){let saved=create(family);saved.hp_curr=1;
  const resource=saved.activeAbilities.find(r=>r.u_max>0&&!r.limitBreak);if(resource)resource.u_curr=0;
  saved=mergeSheetData(saved,{action:'fields',fields:{cha:18}});
  const raw=draft(saved),next=levelUpBuild(raw,saved);assert.equal(next.cha,18);assert.equal(next.hp_curr,1);
  if(resource){const old=saved.activeAbilities.find(r=>r.sourceRuleId===resource.sourceRuleId),row=next.activeAbilities.find(r=>r.sourceRuleId===resource.sourceRuleId);assert.equal(row.u_max-row.u_curr,old.u_max-old.u_curr);}
 }
});
test('growth review shows actual resource upgrades and avoids relabeling static traits every level',()=>{
 const first=create([CK,MOG]),second=levelUpBuild(draft(first),first),third=draft(second);
 const changes=classFeatureChanges(third,second.rulesBuild.input);
 assert(changes.some(r=>r.feature.name==='Commander’s Aura'&&r.kind==='upgrade'));
 assert(!changes.some(r=>r.feature.name==='Limit Breaks'));
 assert.match(renderBuild(third,10,{mode:'levelup',baseline:second.rulesBuild.input}),/Maximum: 7 → 9/);
});
test('replacing a talent clears later choices whose owned prerequisite was removed',()=>{
 let data=create([GUNBREAKER_ID,'']);for(let l=2;l<=4;l++)data=levelUpBuild(draft(data),data);
 const b=structuredClone(data.rulesBuild.input),events=choiceEvents(b),early=events.find(e=>e.atClassLevel===2&&e.poolIds.some(p=>p.endsWith(':talents'))),later=events.find(e=>e.atClassLevel===4&&e.poolIds.some(p=>p.endsWith(':talents')));
 const pool=martialChoicePools(b).find(p=>early.poolIds.includes(p.id));
 let pair;
 for(const option of pool.options){if(!eligibleOptions(b,early).some(o=>o.id===option.id))continue;selectMartialChoice(b,early.id,option.id);const dependent=eligibleOptions(b,later).find(o=>o.prerequisiteText?.toLowerCase().includes(option.name.toLowerCase()));if(dependent){pair={option,dependent};break;}}
 assert(pair,'source-backed dependent talent pair');selectMartialChoice(b,later.id,pair.dependent.id);
 const replacement=eligibleOptions(b,early).find(o=>o.id!==pair.option.id);assert(replacement);selectMartialChoice(b,early.id,replacement.id);
 assert(!b.choices[later.id],'dependent choice returns to an empty required slot');
});
