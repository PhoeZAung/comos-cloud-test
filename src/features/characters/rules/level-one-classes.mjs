import {classCatalog} from './class-catalog.mjs';
import {BEASTMASTER_ID,isBeastmaster,beastmasterClass,beastmasterFeatures,beastmasterIssues} from './beastmaster-level-one.mjs';

export const CHOCOBO_KNIGHT_ID='ffd20:class:chocobo-knight';
export const DANCER_ID='ffd20:class:dancer';
export const MONK_ID='ffd20:class:monk';
export const KNIGHT_ID='ffd20:class:knight';
export const DRAGOON_ID='ffd20:class:dragoon';
export const GUNBREAKER_ID='ffd20:class:gunbreaker';
export const DOOM_SLAYER_ID='ffd20:archetype:gunbreaker:doom-slayer';
export const FELL_RIDER_ID='ffd20:archetype:chocobo-knight:fell-rider';
export const DEADLY_LANCER_ID='ffd20:archetype:chocobo-knight:deadly-lancer';
export const MOG_KNIGHT_ID='ffd20:archetype:chocobo-knight:mog-knight';
export const isLevelOneClass=b=>[CHOCOBO_KNIGHT_ID,DANCER_ID,DRAGOON_ID,KNIGHT_ID,MONK_ID,GUNBREAKER_ID,BEASTMASTER_ID].includes(b?.classId);
export const levelOneClasses=[...classCatalog.classes.filter(c=>c.adapter==='martial-level-one').map(c=>({
 ...c,resources:[],choicePools:c.id===GUNBREAKER_ID?[{id:GUNBREAKER_ID+':pool:talents',name:'Gunbreaker Talent',options:c.data.levelTwoTalents||[]}]:[],sources:c.sources,data:c.data
})),...(beastmasterClass?[beastmasterClass]:[])];
export const mogKnight=classCatalog.archetypeRecords.find(a=>a.id===MOG_KNIGHT_ID&&a.adapter==='mog-knight-level-one');

export const deadlyLancer=classCatalog.archetypeRecords.find(a=>a.id===DEADLY_LANCER_ID&&a.adapter==='deadly-lancer-level-one');
export const fellRider=classCatalog.archetypeRecords.find(a=>a.id===FELL_RIDER_ID&&a.adapter==='fell-rider-level-one');
export const doomSlayer=classCatalog.archetypeRecords.find(a=>a.id===DOOM_SLAYER_ID&&a.adapter==='doom-slayer-level-one');
export const levelOneArchetype=b=>(b.classId===CHOCOBO_KNIGHT_ID?[mogKnight,deadlyLancer,fellRider]:b.classId===GUNBREAKER_ID?[doomSlayer]:[]).find(a=>a?.id===b.archetypeId&&(!a.data.requiredRaceId||a.data.requiredRaceId===b.raceId))||null;

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
 if(b.classId===GUNBREAKER_ID&&b.level>=2){
  for(const event of gunbreakerChoiceEvents(b))for(const id of b.choices?.[event.id]||[]){
   const option=gunbreakerEligibleOptions(event).find(o=>o.id===id);
   if(option)features.push({id:option.id,name:option.name,description:option.description,atLevel:event.atClassLevel,activation:'passive',featureKind:'class_feature',automation:'manual'});
  }
 }
 return features;
}

export const gunbreakerChoiceEvents=b=>b.classId===GUNBREAKER_ID?levelOneClasses.find(c=>c.id===GUNBREAKER_ID)?.data.events.filter(e=>e.type==='choose'&&e.atClassLevel<=b.level)||[]:[];
export const gunbreakerEligibleOptions=event=>levelOneClasses.find(c=>c.id===GUNBREAKER_ID)?.choicePools.find(p=>p.id===(event.poolId||event.poolIds?.[0]))?.options||[];

export const levelOneExtraHp=(b,scores)=>b?.classId===MONK_ID?Math.max(0,Math.floor((Number(scores.con)-10)/2))*b.level:0;

export function levelOnePreview(b,{scores,race,racial,hpRolls}){
 const c=levelOneClasses.find(c=>c.id===b.classId),row=c.data.levels[Math.max(0,Math.min(19,b.level-1))];
 const mod=n=>Math.floor((n-10)/2);
 return {scores,race,racial,features:levelOneFeatures(b),
  summary:{bab:row.bab,fort:row.fort,ref:row.ref,will:row.will,baseMp:0,bonusMp:0,mp:0,spellLevel:0,skillPerLevel:Math.max(1,4+mod(scores.int))},
  hp:hpRolls.reduce((sum,n)=>sum+Math.max(1,n+mod(scores.con)),0)+levelOneExtraHp(b,scores),skillBudget:Math.max(1,4+mod(scores.int))*b.level};
}

export const levelOneCounter=(b,feature,scores)=>b.classId===KNIGHT_ID&&feature.id===KNIGHT_ID+':feature:defensive-stance'?{maximum:Math.max(0,4+Math.floor((scores.con-10)/2))}:b.classId===GUNBREAKER_ID&&feature.id===GUNBREAKER_ID+':feature:magicked-ammo'?{maximum:3}:b.classId===GUNBREAKER_ID&&feature.id===GUNBREAKER_ID+':feature:aurora'?{maximum:Math.max(0,3+Math.floor((scores.wis-10)/2))}:null;

export function levelOneIssues(b,{complete=true}={}){
 if(isBeastmaster(b))return beastmasterIssues(b,{complete});
 const issues=[],add=(step,message)=>issues.push({step,message});
 const c=levelOneClasses.find(c=>c.id===b.classId);
 if(b.classId===GUNBREAKER_ID?(b.level<1||b.level>2):b.level!==1)add(3,c.name+' currently supports only '+(b.classId===GUNBREAKER_ID?'levels 1–2':'level 1')+'. Later-level choices and progression are not enabled.');
 if(b.classId===KNIGHT_ID&&!['Lawful Good','Lawful Neutral','Lawful Evil'].includes(b.alignment))add(3,'Knight requires a lawful alignment. Choose it under Identity.');
 if(b.carry)add(3,'Multiclassing is not implemented for '+c.name+'.');
 if(b.archetypeId&&!levelOneArchetype(b))add(3,b.classId===GUNBREAKER_ID?'This archetype is not enabled or does not match Gunbreaker.':'Mog Knight requires both the Moogle race and Chocobo Knight class. Other archetypes are not enabled.');
 if(b.spellIds?.length||b.initialIntMod!==null&&b.initialIntMod!==undefined)add(5,c.name+' does not learn Black Mage spells or obtain an MP pool.');
 if(b.classId===GUNBREAKER_ID){const events=gunbreakerChoiceEvents(b),allowed=new Set(events.map(e=>e.id));if(Object.keys(b.choices||{}).some(id=>!allowed.has(id)))add(4,'Unknown or premature Gunbreaker talent selection.');for(const event of events){const chosen=b.choices?.[event.id]||[],options=gunbreakerEligibleOptions(event);if(complete&&(chosen.length!==1||!options.some(o=>o.id===chosen[0])))add(4,'Choose exactly one verified Gunbreaker talent at level 2.');}}
 else if(Object.keys(b.choices||{}).length)add(4,'No class talent choices are granted at level 1 for '+c.name+'.');
 if(complete){
  const expectedHp=b.classId===GUNBREAKER_ID&&b.level===2?[c.data.hitDie,Math.floor(c.data.hitDie/2)+1]:[c.data.hitDie];
  if(JSON.stringify(b.hpRolls)!==JSON.stringify(expectedHp))add(4,c.name+' requires '+expectedHp.join(' then ')+' base HP at the supported levels before Constitution.');
  if(b.favored?.length)add(4,'Favored-class rewards remain manual for this first-level integration.');
  if(!b.reviewed)add(6,'Review the character and its manual conditional rules before saving.');
 }
 return issues;
}
