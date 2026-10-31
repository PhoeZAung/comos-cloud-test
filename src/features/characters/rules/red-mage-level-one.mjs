import {classCatalog} from './class-catalog.mjs';
import {redMageSpells} from './red-mage-spells.mjs';
import {bonusMp} from '../rules-summary.mjs';
export const RED_MAGE_ID='ffd20:class:red-mage';
export const isRedMage=b=>b?.classId===RED_MAGE_ID;
const record=classCatalog.classes.find(c=>c.id===RED_MAGE_ID);
export const redMageClass=record?.adapter==='red-mage-level-one'?{...record,resources:[],choicePools:record.data.choicePools}:null;
export const RED_MAGERY_EVENT=RED_MAGE_ID+':event:red-magery:1';
export const RUBY_TALENT_EVENT=RED_MAGE_ID+':event:ruby-talent:2';
export const redMageOptions=(b=null,event=null,scores=null)=>{
 const pool=redMageClass?.choicePools.find(p=>event?event.poolIds.includes(p.id):p.id.endsWith(':red-magery'));
 return (pool?.options||[]).filter(o=>o.selectable!==false&&(!b||b.level>=(o.minimumLevel||1))&&(!o.minimumStrength||scores?.str>=o.minimumStrength));
};
export function redMageCounter(b,feature,scores){
 if(!isRedMage(b)||b.level<2)return null;
 if(feature.id===RED_MAGE_ID+':feature:arcane-pool')return {maximum:Math.max(0,Math.max(1,Math.floor(b.level/2))+Math.floor((Number(scores.cha)-10)/2)),formula:Math.max(1,Math.floor(b.level/2))+'+{CHA}'};
 const selected=Object.values(b.choices||{}).flat();
 const talent=redMageClass.choicePools.flatMap(p=>p.options).find(o=>o.id===feature.id&&selected.includes(o.id));
 return talent?.dailyUses?{maximum:talent.dailyUses}:null;
}
export const redMageChoiceEvents=b=>isRedMage(b)?redMageClass.data.events.filter(e=>e.type==='choose'&&e.atClassLevel<=b.level):[];
const mod=n=>Math.floor((n-10)/2);
export function redMageSummary(scores,level=1){
 const extra=bonusMp(Math.max(1,Math.min(45,scores.cha)),1);
 const row=redMageClass.data.levels[level-1]||redMageClass.data.levels[0];
 return {bab:row.bab,fort:row.fort,ref:row.ref,will:row.will,baseMp:row.baseMp,bonusMp:extra,mp:row.baseMp+extra,spellLevel:1,skillPerLevel:Math.max(1,6+mod(scores.int))};
}
export const redMageSpellOptions=()=>redMageSpells;
export const redMageSpellCounts=(scores,initialChaMod=null,level=1)=>({cantrips:2,leveled:3+(initialChaMod??mod(scores.cha))+2*(level-1)});
export function redMagePreview(b,{scores,race,racial,hpRolls}){
 const summary=redMageSummary(scores,b.level);
 return {scores,race,racial,summary,hp:hpRolls.reduce((n,r)=>n+Math.max(1,r+mod(scores.con)),0),skillBudget:summary.skillPerLevel*b.level,
  features:[...redMageClass.features.filter(f=>f.atLevel<=b.level),...redMageChoiceEvents(b).flatMap(event=>redMageOptions(b,event,scores).filter(o=>b.choices?.[event.id]?.includes(o.id)).map(o=>({...o,featureKind:'class_feature',activation:o.activation||'passive'})))]};
}
export function redMageIssues(b,scores,{complete=true}={}){
 const issues=[],add=(step,message)=>issues.push({step,message});
 if(![1,2].includes(b.level))add(3,'Red Mage currently supports levels 1–2 only; later progression is not enabled.');
 if(b.carry)add(3,'Red Mage multiclassing is not implemented.');
 if(b.archetypeId)add(3,'Red Mage archetypes are not enabled.');
 if(scores.cha<11||scores.cha>45)add(1,'Red Mage requires effective Charisma from 11 to 45 for its first-level spells and verified MP table.');
 if(b.initialIntMod!==null&&b.initialIntMod!==undefined)add(5,'Red Mage spell learning uses Charisma; Black Mage spellbook initialization is not supported.');
 const events=redMageChoiceEvents(b),allowed=new Set(events.map(e=>e.id));
 if(Object.keys(b.choices||{}).some(id=>!allowed.has(id)))add(4,'Unknown or premature Red Mage choice.');
 for(const event of events){const picked=b.choices?.[event.id],options=redMageOptions(b,event,scores);if(!Array.isArray(picked)||picked.length!==1||!options.some(o=>o.id===picked[0]))add(4,event.id===RED_MAGERY_EVENT?'Choose exactly one first-level Red Magery option: Quick Mind or Spell Combat Expertise.':'Choose exactly one eligible level-2 Ruby Talent.');}
 if(Object.keys(b.abilityIncreases||{}).length)add(1,'A first-level Red Mage has no level-based ability increase.');
 if(!complete)return issues;
 if(b.hpRolls?.length!==b.level||b.hpRolls[0]!==8||b.hpRolls.some(n=>!Number.isInteger(n)||n<1||n>8))add(4,'Record Red Mage HP, starting with 8 base HP before Constitution.');
 if(b.favored?.length)add(4,'Red Mage favored-class rewards remain manual for this first-level integration.');
 const counts=redMageSpellCounts(scores,b.initialChaMod,b.level),selected=b.spellIds.map(id=>redMageSpells.find(s=>s.id===id));
 if(selected.some(s=>!s)||new Set(b.spellIds).size!==b.spellIds.length)add(5,'Choose distinct first-level Red Mage spells and cantrips from the imported catalog.');
 if(selected.filter(s=>s?.level===0).length!==counts.cantrips||selected.filter(s=>s?.level===1).length!==counts.leveled)add(5,'Choose 2 cantrips and '+counts.leveled+' first-level Red Mage spells.');
 if(b.spellSelections&&['cantrips','leveled'].some(k=>b.spellSelections[k].length!==counts[k]||b.spellSelections[k].some(id=>!id||!redMageSpells.some(s=>s.id===id&&s.level===(k==='cantrips'?0:1)))))add(5,'Fill every Red Mage spell slot with a spell of the correct level.');
 if(!Array.isArray(b.skillRanks))add(7,'Allocate your Red Mage skill ranks before saving.');
 if(!b.reviewed)add(6,'Review the Red Mage preview and manual spell, armor and Spell Combat rules before saving.');
 return issues;
}
export function redMageSpellRows(b,previous={}){
 return b.spellIds.map(id=>{
  const spell=redMageSpells.find(s=>s.id===id),old=previous.spells?.find(s=>s.sourceRuleId===id);
  return {...old,sourceRuleId:id,rulesOwned:true,sourceClass:'Red Mage',
   name:old?.rulesName&&old.name!==old.rulesName?old.name:spell.name,
   desc:old?.rulesDescription&&old.desc!==old.rulesDescription?old.desc:spell.description,
   rulesName:spell.name,rulesDescription:spell.description,lvl:spell.level,mp_cost:spell.mpCost,casting_ability:'cha',
   school:spell.school,range:spell.range,duration:spell.duration,saving_throw:spell.save,target:spell.target,
   casting_time:spell.castingTime,spell_resistance:spell.spellResistance,maintained:spell.usageMode==='maintained',
   automation:'manual',sourceURL:spell.url};
 });
}
