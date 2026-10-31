// Source-backed sheet progression: conditional combat effects remain on reference cards.
import {classCatalog} from './class-catalog.mjs';
import {familyChoiceEvents,familyFeatures} from './family-progression.mjs';
import {bonusMp} from '../rules-summary.mjs';
const mod=n=>Math.floor((Number(n)-10)/2);
const normalized=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export const sheetFamilyClasses=classCatalog.classes.filter(c=>c.adapter==='sheet-family-progression'&&c.status==='live').map(c=>({...c,resources:c.data.resources||[],choicePools:c.data.choicePools||[]}));
export const isSheetFamily=b=>sheetFamilyClasses.some(c=>c.id===b?.classId);
export const sheetFamilyArchetypes=b=>classCatalog.archetypeRecords.filter(a=>a.parentClassId===b?.classId&&a.adapter==='sheet-family-progression'&&a.status==='live');
export const sheetFamilyArchetype=b=>sheetFamilyArchetypes(b).find(a=>a.id===b.archetypeId)||null;
export const sheetFamilyProfile=b=>sheetFamilyArchetype(b)?.data.profile||{};
const parent=b=>sheetFamilyClasses.find(c=>c.id===b?.classId);
export function sheetFamilyPools(b){
 const base=parent(b),a=sheetFamilyArchetype(b);if(!base)return [];
 return [...base.choicePools.map(pool=>({...pool,options:[...pool.options,...(a?.data.extraOptions||[]).filter(x=>x.poolId===pool.id).flatMap(x=>x.options)]})),...(a?.data.choicePools||[])];
}
export function sheetFamilyDefinition(b){
 const c=parent(b);if(!c)return null;const profile=sheetFamilyProfile(b),data={...c.data,...profile,spellcasting:{learningMode:'none'},choicePools:sheetFamilyPools(b)};
 if(profile.fullBab&&!profile.levels)data.levels=c.data.levels.map((r,i)=>({...r,bab:i+1,iterativeAttacks:Array.from({length:1+Math.floor(i/5)},(_,k)=>i+1-5*k)}));
 return {...c,data,choicePools:data.choicePools};
}
export const sheetFamilyEvents=b=>{if(!isSheetFamily(b))return [];const c=parent(b),a=sheetFamilyArchetype(b);return [...c.data.events,...(a?.data.events||[])].filter(e=>e.type==='choose'&&e.atClassLevel<=b.level&&familyChoiceEvents(c,a,e.atClassLevel,b.choices).some(x=>x.id===e.id)).sort((a,b)=>a.atClassLevel-b.atClassLevel||a.id.localeCompare(b.id));};
export function sheetFamilyOptions(b,event,scores){
 const events=sheetFamilyEvents(b),index=events.findIndex(e=>e.id===event.id),pool=sheetFamilyPools(b).find(p=>event.poolIds.includes(p.id));if(index<0||!pool)return [];
 const selected=events.slice(0,index).flatMap(e=>b.choices?.[e.id]||[]),profile=sheetFamilyProfile(b),owned=new Set(familyFeatures(parent(b),sheetFamilyArchetype(b),event.atClassLevel,b.choices).map(f=>f.id));
 return pool.options.filter(o=>(o.minimumLevel||1)<=event.atClassLevel&&(!o.rankMinimumLevels||(o.rankMinimumLevels[selected.filter(id=>id===o.id).length]??21)<=event.atClassLevel)&&(!o.maximumLevel||event.atClassLevel<=o.maximumLevel)&&(!o.allowedLevels||o.allowedLevels.includes(event.atClassLevel))&&selected.filter(id=>id===o.id).length<(o.repeatLimit||1)&&(o.requiresOptionIds||[]).every(id=>selected.includes(id))&&(o.requiresFeatureIds||[]).every(id=>owned.has(id))&&(!o.minimumScores||Object.entries(o.minimumScores).every(([key,value])=>scores[key]>=value))&&!profile.excludedOptionNames?.some(n=>normalized(n)===normalized(o.name)));
}
export function selectSheetFamilyChoice(b,eventId,optionId,scores){
 const event=sheetFamilyEvents(b).find(e=>e.id===eventId);if(!event||!sheetFamilyOptions(b,event,scores).some(o=>o.id===optionId))throw Error('Choose an eligible class option.');
 b.choices??={};b.choices[eventId]=[optionId];
 for(const other of sheetFamilyEvents(b))if(other.id!==eventId&&b.choices[other.id]?.length&&!b.choices[other.id].every(id=>sheetFamilyOptions(b,other,scores).some(o=>o.id===id)))delete b.choices[other.id];
 return b;
}
export function sheetFamilyCounter(b,f,scores){
 if(!isSheetFamily(b))return null;const c=parent(b),a=sheetFamilyArchetype(b),option=sheetFamilyPools(b).flatMap(p=>p.options).find(o=>o.id===f.id);
 const resource=[...(a?.data.resources||[]),...(c.data.resources||[])].find(r=>r.featureId===f.id)||option?.resource;
 if(!resource)return null;
 const value=resource.byLevel?.[b.level-1]??Math.floor(Number(resource.base||0)+Number(resource.perLevel||0)*b.level),maximum=Math.max(resource.minimum??0,value+(resource.ability?mod(scores[resource.ability]):0));
 return {maximum};
}
export function sheetFamilyFeatures(b,scores){
 const features=familyFeatures(parent(b),sheetFamilyArchetype(b),b.level,b.choices),selected=new Map();
 for(const event of sheetFamilyEvents(b))for(const id of b.choices?.[event.id]||[]){const o=sheetFamilyPools(b).flatMap(p=>p.options).find(o=>o.id===id);if(!o)continue;const count=(selected.get(id)?.selectionCount||0)+1;selected.set(id,{...o,atLevel:event.atClassLevel,selectionCount:count,state:{selectionCount:count},featureKind:o.featureKind||'class_feature',activation:o.activation||(/action|once per|times per/i.test(o.description)?'mixed':'passive'),description:o.description+(count>1?'\nSelected '+count+' times; record each required subchoice on existing sheet rows.':'')});}
 return [...features,...selected.values()].map(f=>{const counter=sheetFamilyCounter(b,f,scores);return counter?{...f,activation:'mixed',state:{...f.state,maximum:counter.maximum},description:f.description+'\nCurrent maximum: '+counter.maximum+'. Refresh only under the source conditions; leveling preserves spent uses.'}:f;});
}
export function sheetFamilySummary(b,scores){
 const d=sheetFamilyDefinition(b).data,row=d.levels[b.level-1]||d.levels[0],extra=d.manualSpellcasting&&d.castingAbility&&row.maxSpellLevel?bonusMp(Math.max(1,Math.min(45,scores[d.castingAbility])),row.maxSpellLevel):0;
 return {bab:row.bab,fort:row.fort,ref:row.ref,will:row.will,baseMp:row.baseMp||0,bonusMp:extra,mp:(row.baseMp||0)+extra,spellLevel:row.maxSpellLevel||0,skillPerLevel:Math.max(1,(d.skillRanksPerLevel??4)+mod(scores.int))};
}
export function sheetFamilyPreview(b,{scores,race,racial,hpRolls}){
 const features=sheetFamilyFeatures(b,scores),summary=sheetFamilySummary(b,scores),bodybuilding=features.some(f=>f.id==='ffd20:class:monk:feature:bodybuilding');
 return {scores,race,racial,features,summary,hp:hpRolls.reduce((sum,n)=>sum+Math.max(1,n+mod(scores.con)),0)+(bodybuilding?Math.max(0,mod(scores.con))*b.level:0),skillBudget:summary.skillPerLevel*b.level};
}
export function sheetFamilyIssues(b,{scores,race,racial,complete=true}){
 const c=sheetFamilyDefinition(b),profile=sheetFamilyProfile(b),issues=[],add=(step,message)=>issues.push({step,message});
 if(!Number.isInteger(b.level)||b.level<1||b.level>20)add(3,'Choose a '+c.name+' level from 1 to 20.');
 if(b.carry)add(3,'Multiclassing is not enabled for '+c.name+'.');
 if(b.archetypeId&&!sheetFamilyArchetype(b))add(3,'Choose a supported '+c.name+' archetype.');
 const races=profile.requiredRaceIds||[profile.requiredRaceId].filter(Boolean);if(races.length&&!races.includes(b.raceId))add(3,'This archetype requires '+races.map(id=>id.split(':').at(-1)).join(' or ')+'.');
 if(profile.allowedAlignments&&!profile.allowedAlignments.includes(b.alignment))add(3,'This archetype requires '+profile.allowedAlignments.join(' or ')+'.');
 if(profile.requiredSize){const size=racial.traits.flatMap(f=>f.effects||[]).find(e=>e.target==='identity.size_category'&&e.automation==='automatic'&&!e.condition)?.textValue;if(normalized(size)!==normalized(profile.requiredSize))add(3,'This archetype requires '+profile.requiredSize+' size.');}
 for(const name of profile.requiredRacialTraitNames||[])if(!racial.traits.some(t=>normalized(t.name)===normalized(name)))add(3,'This archetype requires the '+name+' racial trait.');
 if(b.spellIds?.length||b.initialIntMod!=null||b.initialChaMod!=null)add(5,'This family records spell subchoices manually on the sheet, without a starting spell allowance.');
 for(const [level,stat]of Object.entries(b.abilityIncreases||{}))if(Number(level)>b.level||Number(level)%4!==0||!['str','dex','con','int','wis','cha'].includes(stat))add(1,'Only fourth-level milestones grant ability increases.');
 for(let level=4;level<=b.level;level+=4)if(!b.abilityIncreases?.[level])add(1,'Choose an ability increase for level '+level+'.');
 if(!complete)return issues;
 if(b.hpRolls?.length!==b.level||b.hpRolls.some((n,i)=>!Number.isInteger(n)||n<1||n>c.data.hitDie||i===0&&n!==c.data.hitDie))add(4,'Record one legal HP entry per level, starting with maximum d'+c.data.hitDie+'.');
 const events=sheetFamilyEvents(b),known=new Set(events.map(e=>e.id));
 if(Object.keys(b.choices||{}).some(id=>!known.has(id)))add(4,'Unknown or premature class choice.');
 for(const event of events){const picked=b.choices?.[event.id]||[],options=sheetFamilyOptions(b,event,scores);if(event.optional&&!picked.length)continue;if(picked.length!==(event.count?.value||1)||picked.some(id=>!options.some(o=>o.id===id)))add(4,'Choose '+(event.count?.value||1)+' eligible '+sheetFamilyPools(b).find(p=>event.poolIds.includes(p.id))?.name+' option for level '+event.atClassLevel+'.');}
 if(b.favored?.length)add(4,'Favored-class rewards remain manual.');
 if(!b.reviewed)add(6,'Review the character and manual prerequisites/effects before saving.');
 return issues;
}
