// Mutant dice audit. Source outcomes remain descriptive until the race's entire
// score/HP/MP/level-up projection has been reviewed. NEVER auto-grant table effects.
import {registry} from './catalog.mjs';
export const MUTANT_ID='ffd20:race:mutant';
export const MUTANT_TABLE=MUTANT_ID+':pool:table-variant-mutant-abilities';
export const MUTANT_PHYSICAL=MUTANT_ID+':pool:table-alternative-physical-features';
export const MUTANT_STATS=['str','dex','con','int','wis','cha'];
export const MUTANT_DEFENSES=['hp','mp','fort','ref','will','ac'];
export const mutantEmptyRolls=()=>({resistance:null,abilities:[],physical:[],levels:{}});
export const mutantIsDefense=b=>(b?.alternateIds||[]).includes(MUTANT_ID+':trait:variable-defenses');
export const mutantTable=(physical=false)=>registry.races.find(r=>r.id===MUTANT_ID)
 ?.choicePools.find(p=>p.id===(physical?MUTANT_PHYSICAL:MUTANT_TABLE));
const integer=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
const isObject=x=>x&&typeof x==='object'&&!Array.isArray(x);
export function mutantRollOutcome(roll,physical=false){
 if(!integer(roll,1,100))return null;
 return mutantTable(physical)?.options.find(o=>Number(o.value)===roll)||null;
}
export function mutantD100State(rolls,physical=false){
 const issues=[],outcomes=[];if(!Array.isArray(rolls))return {issues:['d100 log must be an array.'],outcomes,pending:1};
 if(rolls.length>100)issues.push('Too many recorded d100 throws.');
 let pending=1,initial=true;
 for(const roll of rolls){
  if(!integer(roll,1,100)){issues.push('d100 throws must be whole numbers 1–100.');continue;}
  if(pending<=0){issues.push('Extra d100 throw after the result was complete.');continue;}
  if(initial){
   initial=false;
   if(physical&&roll>=99){pending=roll===99?2:3;continue;}
   if(!physical&&roll===100){pending=2;continue;}
   pending--;
  }else if(physical&&roll>=99||!physical&&roll===100)continue; // ignore these on further rolls
  else pending--;
  outcomes.push(...(mutantRollOutcome(roll,physical)?[mutantRollOutcome(roll,physical)]:[]));
 }
 return {issues,outcomes,pending,complete:pending===0&&issues.length===0,
  description:physical?'Optional appearance table, 99/100 grant two/three further results; later 99/100 rolls are ignored.':'Ability table, first 100 grants two further results; later 100 rolls are ignored.'};
}
export function mutantD6State(rolls,defense=false){
 const raw=isObject(rolls)?rolls:{},issues=[],earned=[],counts=Object.fromEntries(
 (defense?MUTANT_DEFENSES:MUTANT_STATS).map(k=>[k,0]));
 if(!isObject(rolls))issues.push('Level d6 roll history must be an object.');
 for(const [key,throwLog] of Object.entries(raw).sort((a,b)=>Number(a[0])-Number(b[0]))){
  const level=Number(key);
  if(!Number.isInteger(level)||level<2||level>20||String(level)!==key){issues.push('Invalid Mutant advancement level.');continue;}
  if(!Array.isArray(throwLog)||!throwLog.length||throwLog.length>60){
   issues.push('Level '+level+' requires a d6 roll history (up to 60 throws).');continue;
  }
  let accepted=null;
  for(let i=0;i<throwLog.length;i++){
   const die=throwLog[i];
   if(!integer(die,1,6)){issues.push('Level '+level+' contains a non-d6 result.');continue;}
   const key=(defense?MUTANT_DEFENSES:MUTANT_STATS)[die-1],cap=defense?5:6;
   if(accepted!==null){issues.push('Level '+level+' has throws after an accepted result.');continue;}
   if(counts[key]>=cap)continue; // Source requires reroll when this benefit is capped.
   accepted=key;counts[key]++;
  }
  if(accepted===null)issues.push('Level '+level+' must end on a valid, uncapped d6 result.');
  else earned.push({level,die:(defense?MUTANT_DEFENSES:MUTANT_STATS).indexOf(accepted)+1,benefit:accepted});
 }
 return {issues,earned,counts};
}
export function mutantRollIssues(b,{requireComplete=false}={}){
 if(b?.raceId!==MUTANT_ID)return [];
 const input=b.mutantRolls;
 if(!isObject(input)||Object.keys(input).some(k=>!['resistance','abilities','physical','levels'].includes(k))||
    !Object.hasOwn(input,'resistance')||!Array.isArray(input.abilities)||!Array.isArray(input.physical)||
    !isObject(input.levels))
  return ['Mutant roll records require a resistance value, two d100 arrays and a level-history object.'];
 const issues=[];
 const traits=new Set((b.disabledTraits||[]));
 const replacedResistance=(b.alternateIds||[]).includes(MUTANT_ID+':trait:dual-minded');
 if(replacedResistance){
  if(input.resistance!==null)issues.push('Dual Minded replaces Variable Resistance; no resistance d6 is permitted.');
 }else if(input.resistance!==null&&!integer(input.resistance,1,6))
  issues.push('Variable Resistance must record one d6 result (1–6).');
 if(requireComplete&&!replacedResistance&&input.resistance===null)
  issues.push('Roll 1d6 for Variable Resistance at creation.');
 const ability=mutantD100State(input.abilities,false),physical=mutantD100State(input.physical,true);
 issues.push(...ability.issues.map(s=>'Variant Mutant Abilities: '+s),
  ...physical.issues.map(s=>'Alternative Physical Features: '+s));
 if(requireComplete&&!ability.complete)
  issues.push('Complete the required Variant Mutant Abilities d100 roll, including any extra rolls.');
 if(input.physical.length&&!physical.complete&&requireComplete)
  issues.push('Complete optional appearance-table follow-up d100 rolls.');
 if(!isObject(input.levels)){issues.push('Mutant level history must be an object.');return issues;}
 const def=mutantIsDefense(b),adv=mutantD6State(input.levels,def);
 issues.push(...adv.issues);
 if(Object.keys(input.levels).some(k=>Number(k)>b.level))
  issues.push('Future level d6 results may not be recorded before that level.');
 if(requireComplete)for(let i=2;i<=b.level;i++)
  if(!Object.hasOwn(input.levels,String(i)))issues.push('Record the level '+i+' Mutant d6 advancement roll.');
 // At levels 4,8,12,16,20, Mutant source progression replaces the standard +1.
 if(Object.keys(b.abilityIncreases||{}).length)
  issues.push('Mutant does not receive ordinary +1 score boosts at levels 4/8/12/16/20.');
 return issues;
}
export function mutantResistanceName(roll){
 return ['Earth','Fire','Ice','Lightning','Water','Wind'][roll-1]||'Not rolled';
}

// Patch 10B: deterministic, source-checked projections. These represent only
// independent numeric effects which have an unambiguous sheet mapping.
// All other d100 outcomes remain manual, never silently assumed inactive.
const verifiedAbilityRows=new Map([
 [9,['cha',2,/Additional \+2 racial Charisma/i]],
 [46,['int',2,/Additional \+2 racial Intelligence/i]],
 [90,['wis',2,/Additional \+2 racial Wisdom/i]]
]);
const verifiedSkillRows=new Map([
 [15,['diplomacy',2,/\+2 racial Diplomacy/i]],
 [35,['climb',2,/\+2 racial Climb/i]],
 [45,['disguise',2,/\+2 racial Disguise/i]],
 [55,['sleight-of-hand',2,/\+2 racial Sleight of Hand/i]],
 [65,['acrobatics',2,/\+2 racial Acrobatics/i]],
 [85,['perception',2,/Additional \+2 racial Perception/i]],
 [95,['escape-artist',2,/\+2 racial Escape Artist/i]]
]);
const saveRows=new Map([
 [29,['ref',1,/\+1 Reflex saves/i]],
 [59,['will',1,/\+1 Will saves/i]],
 [79,['fort',1,/\+1 Fortitude saves/i]]
]);
const bonusHpRow=[98,/\+1 bonus HP per character level/i];
const speedRow=[14,/\+5 feet to base land movement/i];
const trusted=(outcome,pattern)=>Boolean(outcome&&pattern.test(outcome.description||''));
export function mutantVerifiedOutcomes(b){
 const hasTrait=(b?.disabledTraits||[]).includes(MUTANT_ID+':trait:variable-mutant-abilities');
 return b?.raceId===MUTANT_ID&&!hasTrait?
  mutantD100State(b.mutantRolls?.abilities||[]).outcomes:[];
}
export function mutantVerifiedEffects(b){
 const prefix=MUTANT_ID+':trait:variable-mutant-abilities:rolled:';
 const effects=[];
 mutantVerifiedOutcomes(b).forEach((outcome,i)=>{
  const number=Number(outcome.value),score=verifiedAbilityRows.get(number),skill=verifiedSkillRows.get(number);
  if(score&&trusted(outcome,score[2]))effects.push({
   id:prefix+i+':score',kind:'ability_score',target:'ability_scores.'+score[0],
   operation:'add',value:{kind:'constant',value:score[1]},bonusType:'racial',
   automation:'automatic',condition:null,sourceOutcomeId:outcome.id});
  if(skill&&trusted(outcome,skill[2]))effects.push({
   id:prefix+i+':skill',kind:'skill_bonus',target:'skills.skill:'+skill[0]+'.bonus',
   operation:'add',value:{kind:'constant',value:skill[1]},bonusType:'racial',
   automation:'automatic',condition:null,sourceOutcomeId:outcome.id});
 });
 return effects;
}
export function mutantProjection(b){
 const empty={hp:0,mp:0,fort:0,ref:0,will:0,ac:0,
  speed:0,scoreBonuses:Object.fromEntries(MUTANT_STATS.map(k=>[k,0])),
  resistance:null,manualResults:[],appliedResults:[]};
 if(b?.raceId!==MUTANT_ID)return empty;
 const active=id=>!(b.disabledTraits||[]).includes(MUTANT_ID+':trait:'+id);
 const defense=mutantIsDefense(b),progress=mutantD6State(b.mutantRolls?.levels||{},defense);
 if(active(defense?'variable-defenses':'variable-stats')){
  for(const {benefit} of progress.earned){
   if(defense){
    if(benefit==='hp')empty.hp+=3;
    else if(benefit==='mp')empty.mp++;
    else if(['fort','ref','will','ac'].includes(benefit))empty[benefit]++;
   }else if(Object.hasOwn(empty.scoreBonuses,benefit))empty.scoreBonuses[benefit]++;
  }
 }
 if(active('variable-resistance')&&!(b.alternateIds||[]).includes(MUTANT_ID+':trait:dual-minded'))
  empty.resistance=mutantResistanceName(b.mutantRolls?.resistance);
 if((b.alternateIds||[]).includes(MUTANT_ID+':trait:dual-minded'))empty.will+=2;
 for(const outcome of mutantVerifiedOutcomes(b)){
  const number=Number(outcome.value);
  const mappedScore=verifiedAbilityRows.get(number),mappedSkill=verifiedSkillRows.get(number),
   save=saveRows.get(number);
  if(mappedScore&&trusted(outcome,mappedScore[2])||
     mappedSkill&&trusted(outcome,mappedSkill[2])){
   empty.appliedResults.push(outcome);
  }else if(save&&trusted(outcome,save[2])){
   empty[save[0]]+=save[1];empty.appliedResults.push(outcome);
  }else if(number===bonusHpRow[0]&&trusted(outcome,bonusHpRow[1])){
   empty.hp+=Math.max(1,Math.min(20,b.level||1));empty.appliedResults.push(outcome);
  }else if(number===speedRow[0]&&trusted(outcome,speedRow[1])){
   empty.speed+=5;empty.appliedResults.push(outcome);
  }else empty.manualResults.push(outcome);
 }
 return empty;
}
