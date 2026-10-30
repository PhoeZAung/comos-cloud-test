import {classCatalog} from './class-catalog.mjs';

export const BEASTMASTER_ID='ffd20:class:beastmaster';
export const COMPANION_EVENT=BEASTMASTER_ID+':event:starting-companion';
export const COMPANION_POOL=BEASTMASTER_ID+':pool:starting-companion';
export const NO_COMPANION=BEASTMASTER_ID+':companion:none';
export const isBeastmaster=b=>b?.classId===BEASTMASTER_ID;
const record=classCatalog.classes.find(c=>c.id===BEASTMASTER_ID&&c.status==='live'&&c.adapter==='beastmaster-level-one');
const species=record?.data?.companion?.species||[];
const source=record?.sources?.find(s=>s.id==='companions')?.url;
const mod=n=>Math.floor((n-10)/2);
const statsText=s=>[
 'Size '+s.size+'; movement '+s.speeds.map(m=>m.mode+' '+m.feet+' ft'+(m.maneuverability?' ('+m.maneuverability+')':'')).join(', ')+'.',
 Object.entries(s.scores).map(([k,v])=>k.toUpperCase()+' '+(v??'—')).join(', ')+'.',
 'Species natural armor: '+(s.naturalArmorBonus===null?'not specified by the source':s.naturalArmorBonus)+'. Attacks: '+s.attacksText+'.'
].join('\n');
const training='Companion HP, skills, feats, tricks, attacks and combat effects are tracked manually. At Beastmaster level 1 the companion has 2d10 HD, BAB +2, Fort +3, Ref +3, Will +0, 2 skill ranks, 1 feat and 1 bonus trick. Natural weapons gain no iterative attacks from BAB. The companion does not use the character’s HP or feat slots.';
const noCompanionDescription='Begin without an animal companion. The companion-only benefits require an actual companion; starting without one does not grant the dead-companion animal focus. Adding or replacing a companion later requires manual handling of the source ceremony.';
export const beastmasterClass=record?{...record,resources:[],choicePools:[{id:COMPANION_POOL,name:'Starting animal companion',options:[
 {id:NO_COMPANION,name:'No starting companion',description:noCompanionDescription,featureIds:[],repeatLimit:1,url:record.source},
 ...species.map(s=>({id:s.id,name:s.name,description:statsText(s.startingStatistics)+'\n\n'+s.startingRules+'\n\n'+training,featureIds:[],repeatLimit:1,url:source}))
]}]}:null;
export const beastmasterChoiceEvents=b=>isBeastmaster(b)?beastmasterClass?.data.events.filter(e=>e.type==='choose'&&e.atClassLevel<=b.level)||[]:[];
export const beastmasterOptions=event=>event?.id===COMPANION_EVENT?beastmasterClass?.choicePools[0].options||[]:[];
export const startingCompanion=b=>species.find(s=>s.id===b.choices?.[COMPANION_EVENT]?.[0])||null;
export const beastmasterSkillBonus=(b,id)=>isBeastmaster(b)&&['skill:knowledge-nature','skill:survival'].includes(id)?2:0;

export function beastmasterFeatures(b){
 if(!beastmasterClass)return [];
 const companion=startingCompanion(b),link=beastmasterClass.data.companion.linkDescription;
 return beastmasterClass.features.filter(f=>f.atLevel===1&&(!f.requiresCompanion||companion)).map(f=>{
  if(f.id.endsWith(':animal-companion'))return {...f,name:companion?'Animal Companion — '+companion.name:f.name,
   description:companion?statsText(companion.startingStatistics)+'\n\n'+companion.startingRules+'\n\n'+training+'\n\nLink: '+link+'\n\nOfficial companion source: '+source:noCompanionDescription};
  if(f.id.endsWith(':animal-focus'))return {...f,description:'Level 1: one minute per day for your own limited focus, spent in one-minute increments. Spend one counter use per minute. Apply focus effects manually; do not add them as permanent ability-score or skill bonuses. A companion’s ongoing focus is separate from this counter.\n\n'+f.description};
  return f;
 });
}
export function beastmasterCounter(feature,scores){
 if(feature.id===BEASTMASTER_ID+':feature:animal-focus')return {maximum:1,formula:'1'};
 if(feature.id===BEASTMASTER_ID+':feature:shared-senses')return {maximum:Math.max(0,mod(scores.wis)),formula:'{WIS}'};
 return null;
}
export function beastmasterIssues(b,{complete=true}={}){
 const issues=[],add=(step,message)=>issues.push({step,message});
 if(!beastmasterClass)add(3,'Beastmaster is unavailable.');
 if(b.level!==1)add(3,'Beastmaster currently supports level-1 testing only.');
 if(b.carry)add(3,'Beastmaster multiclassing is not enabled.');
 if(b.archetypeId)add(3,'Beastmaster archetypes are not enabled.');
 if(b.spellIds?.length||b.initialIntMod!=null||b.initialChaMod!=null)add(5,'Beastmaster does not learn spells or obtain an MP pool.');
 if(Object.keys(b.abilityIncreases||{}).length)add(1,'A first-level Beastmaster has no level-based ability increase.');
 if(Object.keys(b.choices||{}).some(id=>id!==COMPANION_EVENT))add(4,'Unknown Beastmaster class choice.');
 if(!complete)return issues;
 const chosen=b.choices?.[COMPANION_EVENT];
 if(!Array.isArray(chosen)||chosen.length!==1||!beastmasterOptions({id:COMPANION_EVENT}).some(o=>o.id===chosen[0]))add(4,'Choose one supported starting animal companion, or explicitly choose no starting companion.');
 if(JSON.stringify(b.hpRolls)!=='[10]')add(4,'Beastmaster starts with 10 base HP before Constitution.');
 if(b.favored?.length)add(4,'Beastmaster favored-class rewards remain manual.');
 if(!Array.isArray(b.skillRanks))add(7,'Allocate your Beastmaster skill ranks before saving.');
 if(!b.reviewed)add(6,'Review the Beastmaster and its manual companion and animal-focus rules before saving.');
 return issues;
}
