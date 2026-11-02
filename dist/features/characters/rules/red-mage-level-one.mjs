import {classCatalog} from './class-catalog.mjs';
import {redMageSpells} from './red-mage-spells.mjs';
import {bonusMp} from '../rules-summary.mjs';
import {familyChoiceEvents,familyFeatures} from './family-progression.mjs';
export const RED_MAGE_ID='ffd20:class:red-mage';
export const RED_MAGERY_EVENT=RED_MAGE_ID+':event:red-magery:1';
export const RUBY_TALENT_EVENT=RED_MAGE_ID+':event:ruby-talent:2';
export const isRedMage=b=>b?.classId===RED_MAGE_ID;
const record=classCatalog.classes.find(c=>c.id===RED_MAGE_ID);
export const redMageClass=record?.adapter==='red-mage-level-one'?{...record,resources:[],choicePools:record.data.choicePools}:null;
export const redMageArchetypes=classCatalog.archetypeRecords.filter(a=>a.parentClassId===RED_MAGE_ID&&a.adapter==='red-mage-progression'&&a.status==='live');
export const redMageArchetype=b=>isRedMage(b)?redMageArchetypes.find(a=>a.id===b.archetypeId):null;
export const redMageProfile=b=>redMageArchetype(b)?.data.profile||{};
export const redMageHasSpells=b=>redMageProfile(b).spellcasting!==false;
const mod=n=>Math.floor((Number(n)-10)/2);
const normal=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const diminished=[1,2,3,4,5,6,8,10,12,15,18,21,25,29,33,38,43,48,53,58];
export function redMageDefinition(b){
 if(!redMageClass)return null;
 const profile=redMageProfile(b),data={...redMageClass.data,...profile,spellcasting:{...redMageClass.data.spellcasting,learningMode:redMageHasSpells(b)?'known':'none'}};
 data.levels=redMageClass.data.levels.map((row,i)=>({...row,...(profile.fullBab?{bab:i+1}:{}),...(profile.mpMode==='diminished'?{baseMp:diminished[i]}:{}),...(!redMageHasSpells(b)?{baseMp:0,maxSpellLevel:0}:{})}));
 return {...redMageClass,data,choicePools:redMageChoicePools(b)};
}
export function redMageChoicePools(b={classId:RED_MAGE_ID}){
 const a=redMageArchetype(b),profile=a?.data.profile||{};
 return [...redMageClass.choicePools.map(pool=>({...pool,options:pool.id.endsWith(':red-magery')&&profile.mageryOptions?profile.mageryOptions:[...pool.options,...(a?.data.extraOptions||[]).filter(x=>x.poolId===pool.id).flatMap(x=>x.options)]})),...(a?.data.choicePools||[])];
}
export const redMageChoiceEvents=b=>isRedMage(b)?familyChoiceEvents(redMageClass,redMageArchetype(b),b.level,b.choices):[];
export const redMageOptions=(b=null,event=null,scores=null)=>{
 const pools=b?redMageChoicePools(b):redMageClass.choicePools,pool=pools.find(p=>event?event.poolIds.includes(p.id):p.id.endsWith(':red-magery'));
 if(!pool)return [];
 const before=b&&event?redMageChoiceEvents(b).filter(e=>e.atClassLevel<event.atClassLevel||e.atClassLevel===event.atClassLevel&&e.id.localeCompare(event.id)<0):[];
 const selected=before.flatMap(e=>b.choices?.[e.id]||[]),profile=b?redMageProfile(b):{};
 return pool.options.filter(o=>(!event||(o.minimumLevel||1)<=event.atClassLevel)&&(!o.allowedLevels||!event||o.allowedLevels.includes(event.atClassLevel))&&(!o.minimumStrength||scores?.str>=o.minimumStrength)&&(o.requiresOptionIds||[]).every(id=>selected.includes(id))&&selected.filter(id=>id===o.id).length<(o.repeatLimit||1)&&!profile.excludedOptionNames?.some(n=>normal(n)===normal(o.name))&&!(pool.id.endsWith(':red-magery')&&profile.excludedMageryOptions?.includes(o.name)));
};
export function redMageSummary(scores,level=1,b={classId:RED_MAGE_ID,level}){
 const row=redMageDefinition(b).data.levels[level-1]||redMageClass.data.levels[0],extra=redMageHasSpells(b)?bonusMp(Math.max(1,Math.min(45,scores.cha)),row.maxSpellLevel):0;
 return {bab:row.bab,fort:row.fort,ref:row.ref,will:row.will,baseMp:row.baseMp,bonusMp:extra,mp:row.baseMp+extra,spellLevel:row.maxSpellLevel,skillPerLevel:Math.max(1,6+mod(scores.int))};
}
export const redMageSpellOptions=()=>redMageSpells;
export const redMageSpellCounts=(scores,initialChaMod=null,level=1,b={classId:RED_MAGE_ID,level})=>redMageHasSpells(b)?{cantrips:2+Math.floor((level-1)/4),leveled:3+(initialChaMod??mod(scores.cha))+2*(level-1)}:{cantrips:0,leveled:0};
export function redMageCounter(b,feature,scores){
 if(!isRedMage(b))return null;
 const all=[...redMageClass.features,...(redMageArchetype(b)?.data.features||[])],f=all.find(f=>f.id===feature.id)||feature;
 const profile=redMageProfile(b),lv=b.level,selected=Object.values(b.choices||{}).flat();
 if(f.name==='Arcane Pool'||f.name==='Thread Pool'||f.name==='Spell Dance'){
  const base=(profile.arcanePoolMode==='full'?lv:Math.max(1,Math.floor(lv/2)))+(profile.arcanePoolBonus||0);
  return {maximum:Math.max(0,base+mod(scores.cha)),formula:base+'+{CHA}'};
 }
 if(f.name==='Stamina Pool')return {maximum:Math.max(1,Math.floor(lv/2)+mod(scores.con))};
 const extra=selected.filter(id=>id===RED_MAGE_ID+':magery:extra-quick-casts').length;
 if(f.id===RED_MAGE_ID+':feature:quick-cast')return {maximum:Math.floor(lv/4)+extra};
 if(f.id===RED_MAGE_ID+':feature:convert')return {maximum:1+Math.floor((lv-5)/4)};
 if(f.id===RED_MAGE_ID+':feature:doublecast')return {maximum:lv>=20?2:1};
 if(f.id===RED_MAGE_ID+':feature:1-mp-spell')return {maximum:3};
 const talent=redMageChoicePools(b).flatMap(p=>p.options).find(o=>o.id===feature.id&&selected.includes(o.id));
 return talent?.dailyUses?{maximum:talent.dailyUses}:null;
}
export function redMagePreview(b,{scores,race,racial,hpRolls}){
 const summary=redMageSummary(scores,b.level,b),choices=new Map();
 for(const event of redMageChoiceEvents(b))for(const id of b.choices?.[event.id]||[]){const option=redMageChoicePools(b).flatMap(p=>p.options).find(o=>o.id===id);if(!option)continue;const prior=choices.get(id),count=(prior?.selectionCount||0)+1;choices.set(id,{...option,selectionCount:count,state:{selectionCount:count},atLevel:event.atClassLevel,featureKind:'class_feature',activation:option.activation||'passive',description:option.description+(count>1?'\nSelected '+count+' times.':'')});}
 const features=[...familyFeatures(redMageClass,redMageArchetype(b),b.level,b.choices),...choices.values()].map(f=>{const counter=redMageCounter(b,f,scores);return counter?{...f,state:{...f.state,maximum:counter.maximum},description:f.description+'\nCurrent maximum: '+counter.maximum+'. Refresh under the source conditions; leveling does not refill spent uses.'}:f;});
 return {scores,race,racial,summary,hp:hpRolls.reduce((n,r)=>n+Math.max(1,r+mod(scores.con)),0),skillBudget:summary.skillPerLevel*b.level,features};
}
export function redMageIssues(b,scores,{complete=true}={}){
 const issues=[],add=(step,message)=>issues.push({step,message});
 if(!Number.isInteger(b.level)||b.level<1||b.level>20)add(3,'Choose a Red Mage level from 1 to 20.');
 if(b.carry)add(3,'Red Mage multiclassing is not implemented.');
 if(b.archetypeId&&!redMageArchetype(b))add(3,'Choose a supported Red Mage archetype.');
 if(redMageHasSpells(b)&&(scores.cha<11||scores.cha>45))add(1,'Red Mage spell learning requires Charisma 11–45; select spells within your Charisma limit.');
 if(b.initialIntMod!=null)add(5,'Red Mage learning uses Charisma, not Black Mage initialization.');
 if(!redMageHasSpells(b)&&b.initialChaMod!=null)add(5,'This Red Mage archetype has no starting spell entitlement.');
 const events=redMageChoiceEvents(b),allowed=new Set(events.map(e=>e.id));
 if(Object.keys(b.choices||{}).some(id=>!allowed.has(id)))add(4,'Unknown or premature Red Mage choice.');
 for(const event of events){const picked=b.choices?.[event.id],options=redMageOptions(b,event,scores);if(!Array.isArray(picked)||picked.length!==1||!options.some(o=>o.id===picked[0]))add(4,'Choose exactly one eligible '+redMageChoicePools(b).find(p=>event.poolIds.includes(p.id)).name+' for level '+event.atClassLevel+'.');}
 for(const [level,stat] of Object.entries(b.abilityIncreases||{}))if(Number(level)>b.level||Number(level)%4!==0||!['str','dex','con','int','wis','cha'].includes(stat))add(1,'Only fourth-level milestones grant ability increases.');
 for(let lv=4;lv<=b.level;lv+=4)if(!b.abilityIncreases?.[lv])add(1,'Choose the ability increase for level '+lv+'.');
 if(!complete)return issues;
 const hitDie=redMageDefinition(b).data.hitDie;
 if(b.hpRolls?.length!==b.level||b.hpRolls[0]!==hitDie||b.hpRolls.some(n=>!Number.isInteger(n)||n<1||n>hitDie))add(4,'Record one legal HP entry per level, starting with maximum d'+hitDie+'.');
 if(b.favored?.length)add(4,'Red Mage favored-class rewards remain manual.');
 const counts=redMageSpellCounts(scores,b.initialChaMod,b.level,b),selected=b.spellIds.map(id=>redMageSpells.find(s=>s.id===id)),maximum=redMageSummary(scores,b.level,b).spellLevel;
 if(selected.some(s=>!s||s.level>maximum||s.level>scores.cha-10)||new Set(b.spellIds).size!==b.spellIds.length)add(5,'Choose distinct legal Red Mage spells within the class and Charisma limits.');
 if(selected.filter(s=>s?.level===0).length!==counts.cantrips||selected.filter(s=>s?.level>0).length!==counts.leveled)add(5,'Choose '+counts.cantrips+' cantrips and '+counts.leveled+' learned Red Mage spells.');
 if(b.spellSelections&&['cantrips','leveled'].some(k=>b.spellSelections[k].length!==counts[k]||b.spellSelections[k].some(id=>!id||!redMageSpells.some(s=>s.id===id&&(k==='cantrips'?s.level===0:s.level>0)))))add(5,'Fill each spell slot with a spell of the correct level.');
 if(!Array.isArray(b.skillRanks))add(7,'Allocate your Red Mage skill ranks before saving.');
 if(!b.reviewed)add(6,'Review the character, archetype prerequisites and manual choices/effects before saving.');
 return issues;
}
export function redMageSpellRows(b,previous={}){
 return b.spellIds.map(id=>{
  const spell=redMageSpells.find(s=>s.id===id),old=previous.spells?.find(s=>s.sourceRuleId===id);
  return {...old,sourceRuleId:id,rulesOwned:true,sourceClass:'Red Mage',name:old?.rulesName&&old.name!==old.rulesName?old.name:spell.name,desc:old?.rulesDescription&&old.desc!==old.rulesDescription?old.desc:spell.description,rulesName:spell.name,rulesDescription:spell.description,lvl:spell.level,mp_cost:spell.mpCost,casting_ability:'cha',school:spell.school,range:spell.range,duration:spell.duration,saving_throw:spell.save,target:spell.target,casting_time:spell.castingTime,spell_resistance:spell.spellResistance,automation:'manual',sourceURL:spell.url};
 });
}
