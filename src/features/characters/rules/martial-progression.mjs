import {classCatalog} from './class-catalog.mjs';
export const GUNBREAKER_ID='ffd20:class:gunbreaker';
export const DOOM_SLAYER_ID='ffd20:archetype:gunbreaker:doom-slayer';
export const AKIMBO_ID='ffd20:archetype:dancer:akimbo';
const progressionIds=['ffd20:class:chocobo-knight','ffd20:class:dancer',GUNBREAKER_ID];
export const martialDefinition=b=>classCatalog.classes.find(c=>c.id===b?.classId&&c.adapter==='martial-progression');
export const martialArchetype=b=>classCatalog.archetypeRecords.find(a=>a.id===b?.archetypeId&&a.parentClassId===b.classId&&a.adapter==='martial-progression'&&(!a.data.requiredRaceId||a.data.requiredRaceId===b.raceId));
export const supportsMartialProgression=b=>progressionIds.includes(b?.classId)&&(!b.archetypeId||Boolean(martialArchetype(b)));
export function martialChoicePools(b){
 const c=martialDefinition(b);if(!c)return [];
 const a=martialArchetype(b),excluded=b.archetypeId===DOOM_SLAYER_ID?['mastery','starting-gun-arm']:b.archetypeId===AKIMBO_ID?['talents','mystic-dances']:[];
 return [...c.data.choicePools.filter(p=>!excluded.some(k=>p.id.endsWith(':'+k))),...(a?.data.choicePools||[])];
}
export function martialChoiceEvents(b){
 if(!supportsMartialProgression(b))return [];
 const pools=new Set(martialChoicePools(b).map(p=>p.id));
 return [...new Map([...(martialDefinition(b)?.data.progressionChoices||[]),...(martialArchetype(b)?.data.progressionChoices||[])].map(e=>[e.id,e])).values()]
 .filter(e=>e.atClassLevel<=b.level&&e.poolIds.some(id=>pools.has(id)))
 .sort((a,b)=>a.atClassLevel-b.atClassLevel||a.id.localeCompare(b.id));
}
const normalized=s=>s.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
export function martialEligibleOptions(b,event){
 const pool=martialChoicePools(b).find(p=>event.poolIds.includes(p.id));if(!pool)return [];
 const prior=martialChoiceEvents(b).filter(e=>e.atClassLevel<event.atClassLevel),selected=prior.flatMap(e=>b.choices?.[e.id]||[]);
 const all=martialChoicePools(b).flatMap(p=>p.options),names=new Set(all.filter(o=>selected.includes(o.id)).map(o=>normalized(o.name)));
 const a=martialArchetype(b),removed=new Set((a?.data.replacements||[]).filter(r=>r.atClassLevel<=event.atClassLevel).flatMap(r=>r.targetFeatureIds));
 const features=[...martialDefinition(b).features.filter(f=>!removed.has(f.id)),...(a?.data.features||[])].filter(f=>f.atLevel<=event.atClassLevel);
 const featureNames=new Set(features.map(f=>normalized(f.name)));
 const requirements=req=>{
  if(!req||['—','-','None'].includes(req))return true;
  let text=normalized(req).replace(/(?:dancer|gunbreaker|gunner|chocobo knight) \d+/g,'').trim();
  if(!text)return true;
  // The source catalogs include external feats, equipment choices and exclusions.
  // Only requirements proved by owned features / earlier selections are offered.
  if(text==='must not have a ki pool')return !featureNames.has('ki pool')&&!names.has('ki pool');
  if(text==='any gun arm technique')return prior.some(e=>e.poolIds.some(p=>p.endsWith(':techniques'))&&(b.choices?.[e.id]||[]).length);
  for(const name of [...names,...featureNames].sort((a,b)=>b.length-a.length))text=text.replaceAll(name,' owned ');
  text=text.replace(/class features?|dance talents?|mounted talents?|gunbreaker talents?|gunnery talents?|mystic dances?|demonic runes?|gun arm techniques?/g,'').trim();
  return text.split(/\bor\b/).some(part=>part.split(/\band\b/).every(p=>p.trim()==='owned'||p.trim()==='owned owned'));
 };
 return pool.options.filter(o=>event.atClassLevel>=(o.minimumLevel||1)&&selected.filter(id=>id===o.id).length<(o.repeatLimit||1)&&requirements(o.prerequisiteText)
 &&(!o.name.includes('Infernal Munitions')||names.has('mutilating strike')));
}
export function martialSelectedFeatures(b){
 const rows=new Map();
 for(const event of martialChoiceEvents(b))for(const id of b.choices?.[event.id]||[]){
  const option=martialChoicePools(b).flatMap(p=>p.options).find(o=>o.id===id);if(!option)continue;
  const old=rows.get(id),count=(old?.selectionCount||0)+1;
  rows.set(id,{id,name:option.name,atLevel:event.atClassLevel,description:option.description+(count>1?'\nSelected '+count+' times.':''),selectionCount:count,activation:/action|once per|activate/i.test(option.description)?'mixed':'passive',featureKind:'class_feature',automation:'manual',sourceRefs:option.sourceRefs||[]});
 }
 return [...rows.values()];
}
export function martialProgressionIssues(b,{complete=true}={}){
 const issues=[],add=(step,message)=>issues.push({step,message}),c=martialDefinition(b);
 if(!Number.isInteger(b.level)||b.level<1||b.level>20)add(3,'Choose a '+c.name+' level from 1 to 20.');
 if(b.carry)add(3,'Multiclassing requires a separate verified integration.');
 if(b.spellIds?.length||b.initialIntMod!=null)add(5,c.name+' does not learn spells or obtain an MP pool.');
 if(!complete)return issues;
 if(b.hpRolls?.length!==b.level||b.hpRolls.some((n,i)=>!Number.isInteger(n)||n<1||n>c.data.hitDie||i===0&&n!==c.data.hitDie))add(9,'Record one legal HP roll per level, starting with maximum d'+c.data.hitDie+'.');
 for(let l=4;l<=b.level;l+=4)if(!['str','dex','con','int','wis','cha'].includes(b.abilityIncreases?.[l]))add(1,'Choose the ability increase for level '+l+'.');
 const events=martialChoiceEvents(b),allowed=new Set(events.map(e=>e.id));
 if(Object.keys(b.choices||{}).some(id=>!allowed.has(id)))add(4,'Unknown or premature martial choice.');
 for(const event of events){const ids=b.choices?.[event.id]||[],eligible=martialEligibleOptions(b,event);
  if(event.optional&&!ids.length)continue;
  if(ids.length!==event.count.value||new Set(ids).size!==ids.length||ids.some(id=>!eligible.some(o=>o.id===id)))add(4,'Choose exactly one valid '+martialChoicePools(b).find(p=>event.poolIds.includes(p.id)).name+' for level '+event.atClassLevel+'.');
 }
 if(b.favored?.length)add(9,'Favored-class rewards remain manual.');
 if(!b.reviewed)add(6,'Review the character and its conditional rules before saving.');
 return issues;
}
export function martialCounter(b,f,scores){
 const mod=k=>Math.floor((Number(scores[k])-10)/2),id=f.id||'',lv=b.level;
 if(id==='ffd20:class:chocobo-knight:feature:challenge')return {maximum:1+Math.floor((lv-1)/3)};
 if(id==='ffd20:class:chocobo-knight:feature:commanders-aura'||id==='ffd20:class:dancer:feature:battle-dance')return {maximum:Math.max(0,4+mod('cha')+2*(lv-1)),formula:(4+2*(lv-1))+'+{CHA}'};
 if(id==='ffd20:class:dancer:feature:ki-pool')return {maximum:Math.max(0,Math.floor(lv/2)+mod('cha')),formula:Math.floor(lv/2)+'+{CHA}'};
 if(id===AKIMBO_ID+':feature:flair')return {maximum:Math.max(1,mod('cha'))+lv-1};
 if(id===GUNBREAKER_ID+':feature:magicked-ammo'){const maximum=martialDefinition(b)?.data.levels[lv-1]?.magickedAmmoPerLoad;return Number.isInteger(maximum)?{maximum}:null;}
 if(id===GUNBREAKER_ID+':feature:aurora')return {maximum:Math.max(0,3+mod('wis')),formula:'3+{WIS}'};
 return null;
}
