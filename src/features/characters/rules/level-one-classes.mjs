import {classCatalog} from './class-catalog.mjs';
import {BEASTMASTER_ID,isBeastmaster,beastmasterClass,beastmasterFeatures,beastmasterIssues} from './beastmaster-level-one.mjs';

export const CHOCOBO_KNIGHT_ID='ffd20:class:chocobo-knight';
export const DANCER_ID='ffd20:class:dancer';
export const DRAGOON_ID='ffd20:class:dragoon';
export const DEADLY_LANCER_ID='ffd20:archetype:chocobo-knight:deadly-lancer';
export const MOG_KNIGHT_ID='ffd20:archetype:chocobo-knight:mog-knight';
export const isLevelOneClass=b=>[CHOCOBO_KNIGHT_ID,DANCER_ID,DRAGOON_ID,BEASTMASTER_ID].includes(b?.classId);
export const levelOneClasses=[...classCatalog.classes.filter(c=>c.adapter==='martial-level-one').map(c=>({
 ...c,resources:[],choicePools:[],sources:c.sources,data:c.data
})),...(beastmasterClass?[beastmasterClass]:[])];
export const mogKnight=classCatalog.archetypeRecords.find(a=>a.id===MOG_KNIGHT_ID&&a.adapter==='mog-knight-level-one');

export const deadlyLancer=classCatalog.archetypeRecords.find(a=>a.id===DEADLY_LANCER_ID&&a.adapter==='deadly-lancer-level-one');
export const levelOneArchetype=b=>b.classId===CHOCOBO_KNIGHT_ID?[mogKnight,deadlyLancer].find(a=>a?.id===b.archetypeId&&(!a.data.requiredRaceId||a.data.requiredRaceId===b.raceId)):null;

export function levelOneFeatures(b){
 if(isBeastmaster(b))return beastmasterFeatures(b);
 const c=levelOneClasses.find(c=>c.id===b.classId);
 if(!c)return [];
 let features=c.features.filter(f=>f.atLevel<=Math.max(1,b.level));
 const archetype=levelOneArchetype(b);
 if(archetype){
  const removed=new Set(archetype.data.replacements.filter(r=>r.atClassLevel<=b.level&&r.resolution==='resolved').flatMap(r=>r.targetFeatureIds));
  features=[...features.filter(f=>!removed.has(f.id)),...archetype.data.features.filter(f=>f.atLevel<=b.level)];
 }
 return features;
}

export function levelOnePreview(b,{scores,race,racial,hpRolls}){
 const c=levelOneClasses.find(c=>c.id===b.classId),row=c.data.levels[Math.max(0,Math.min(19,b.level-1))];
 const mod=n=>Math.floor((n-10)/2);
 return {scores,race,racial,features:levelOneFeatures(b),
  summary:{bab:row.bab,fort:row.fort,ref:row.ref,will:row.will,baseMp:0,bonusMp:0,mp:0,spellLevel:0,skillPerLevel:Math.max(1,4+mod(scores.int))},
  hp:hpRolls.reduce((sum,n)=>sum+Math.max(1,n+mod(scores.con)),0),skillBudget:Math.max(1,4+mod(scores.int))*b.level};
}

export function levelOneIssues(b,{complete=true}={}){
 if(isBeastmaster(b))return beastmasterIssues(b,{complete});
 const issues=[],add=(step,message)=>issues.push({step,message});
 const c=levelOneClasses.find(c=>c.id===b.classId);
 if(b.level!==1)add(3,c.name+' currently supports level-1 testing only. Later-level choices and progression are not enabled.');
 if(b.carry)add(3,'Multiclassing is not implemented for '+c.name+'.');
 if(b.archetypeId&&!levelOneArchetype(b))add(3,'Mog Knight requires both the Moogle race and Chocobo Knight class. Other archetypes are not enabled.');
 if(b.spellIds?.length||b.initialIntMod!==null&&b.initialIntMod!==undefined)add(5,c.name+' does not learn Black Mage spells or obtain an MP pool.');
 if(Object.keys(b.choices||{}).length)add(4,'No class talent choices are granted at level 1 for '+c.name+'.');
 if(complete){
  if(JSON.stringify(b.hpRolls)!==JSON.stringify([c.data.hitDie]))add(4,c.name+' starts with '+c.data.hitDie+' base HP before Constitution.');
  if(b.favored?.length)add(4,'Favored-class rewards remain manual for this first-level integration.');
  if(!b.reviewed)add(6,'Review the character and its manual conditional rules before saving.');
 }
 return issues;
}
