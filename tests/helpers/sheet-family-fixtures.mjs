import assert from 'node:assert/strict';
import {newBuild,previewBuild,choiceEvents,eligibleOptions,prepareLevelUp,classFor,raceFor,raceTraits,registry} from '../../src/features/characters/rules/build.mjs';
import {sheetFamilyProfile} from '../../src/features/characters/rules/sheet-family-progression.mjs';
import {supportsRacialPool,racialChoiceSpecs} from '../../src/features/characters/rules/racial-choices.mjs';
import {fixedSkills} from '../../src/features/sheet/skills.mjs';
export const fixtureRaceLimits=new Map();
export function completeFamilyBuild(b){
 for(const event of choiceEvents(b))if(!b.choices[event.id]?.length){const option=eligibleOptions(b,event)[0];assert(option,'No option for '+event.id+' at level '+b.level);b.choices[event.id]=[option.id];}
 b.skillRanks??=fixedSkills.map(()=>0);let remaining=previewBuild(b).skillBudget-b.skillRanks.reduce((n,v)=>n+v,0);
 for(let i=0;i<b.skillRanks.length;i++){const add=Math.min(b.level-b.skillRanks[i],remaining);if(add>0){b.skillRanks[i]+=add;remaining-=add;}}
 assert.equal(remaining,0,'skill budget '+b.classId+' '+b.archetypeId);b.reviewed=true;return b;
}
export function familyFixture(classId,archetypeId=''){
 const b=newBuild();Object.assign(b,{classId,archetypeId,name:'Family '+(archetypeId||classId),raceId:'ffd20:race:galka',alignment:'True Neutral',baseScores:{str:16,dex:16,con:12,int:10,wis:14,cha:14}});
 const profile=sheetFamilyProfile(b);b.raceId=profile.requiredRaceId||profile.requiredRaceIds?.[0]||b.raceId;
 if(profile.requiredSize==='small')b.raceId='ffd20:race:moogle';
 if(profile.requiredRacialTraitNames?.length){const race=registry.races.find(r=>profile.requiredRacialTraitNames.every(name=>r.features.some(f=>(r.data.standardTraitIds.includes(f.id)||r.data.alternateTraitIds.includes(f.id))&&f.name.toLowerCase()===name.toLowerCase())));assert(race,'required racial trait fixture');b.raceId=race.id;for(const f of race.features)if(profile.requiredRacialTraitNames.some(name=>f.name.toLowerCase()===name.toLowerCase())&&race.data.alternateTraitIds.includes(f.id))b.alternateIds.push(f.id);}
 b.alignment=profile.allowedAlignments?.[0]||b.alignment;
 const race=raceFor(b);assert(race,b.raceId);const manual=[];
 // Isolate class progression using the product's explicit standard-trait toggles.
 // Unsupported racial choices stay guarded in production; no race implementation is changed.
 for(const f of race.features.filter(f=>race.data.standardTraitIds.includes(f.id)))if(f.choicePoolIds?.some(id=>!supportsRacialPool(id))){b.disabledTraits.push(f.id);manual.push(f.name);}
 if(manual.length)fixtureRaceLimits.set(archetypeId||classId,manual);
 if(b.raceId==='ffd20:race:palico'){const id='ffd20:race:palico:pool:starting-second-language';b.racialChoices[id]=[id+':option:mithran'];}
 if(b.raceId==='ffd20:race:kindred'){const id='ffd20:race:kindred:pool:languages-selection';b.racialChoices[id]=[id+':option:abyssal'];}
 if(b.raceId==='ffd20:race:moogle'){const id='ffd20:race:moogle:pool:moogle-handy-craft-or-profession';b.racialChoices[id]=['skill-row:4'];b.racialSpecialties[id]='Woodworking';}
 b.hpRolls=[classFor(b).data.hitDie];return completeFamilyBuild(b);
}
export function advanceFamily(data){const {build}=prepareLevelUp(data);if(build.level%4===0)build.abilityIncreases[build.level]='str';return completeFamilyBuild(build);}
