import {classCatalog} from './class-catalog.mjs';
import {redMageSpells} from './red-mage-spells.mjs';
import {bonusMp} from '../rules-summary.mjs';
export const RED_MAGE_ID='ffd20:class:red-mage';
export const isRedMage=b=>b?.classId===RED_MAGE_ID;
const record=classCatalog.classes.find(c=>c.id===RED_MAGE_ID);
export const redMageClass=record?.adapter==='red-mage-level-one'?{...record,resources:[],choicePools:record.data.choicePools}:null;
export const RED_MAGERY_EVENT=RED_MAGE_ID+':event:red-magery:1';
export const redMageOptions=()=>redMageClass?.choicePools[0].options||[];
export const redMageChoiceEvents=b=>isRedMage(b)?redMageClass.data.events.filter(e=>e.type==='choose'&&e.atClassLevel<=b.level):[];
const mod=n=>Math.floor((n-10)/2);
export function redMageSummary(scores){
 const extra=bonusMp(Math.max(1,Math.min(45,scores.cha)),1);
 return {bab:0,fort:2,ref:0,will:2,baseMp:2,bonusMp:extra,mp:2+extra,spellLevel:1,skillPerLevel:Math.max(1,6+mod(scores.int))};
}
export const redMageSpellOptions=()=>redMageSpells;
export const redMageSpellCounts=(scores,initialChaMod=null)=>({cantrips:2,leveled:3+(initialChaMod??mod(scores.cha))});
export function redMagePreview(b,{scores,race,racial,hpRolls}){
 const summary=redMageSummary(scores);
 return {scores,race,racial,summary,hp:hpRolls.reduce((n,r)=>n+Math.max(1,r+mod(scores.con)),0),skillBudget:summary.skillPerLevel,
  features:[...redMageClass.features.filter(f=>f.atLevel===1),...redMageOptions().filter(o=>b.choices?.[RED_MAGERY_EVENT]?.includes(o.id)).map(o=>({...o,activation:'passive',featureKind:'class_feature'}))]};
}
export function redMageIssues(b,scores,{complete=true}={}){
 const issues=[],add=(step,message)=>issues.push({step,message});
 if(b.level!==1)add(3,'Red Mage currently supports level-1 testing only; later progression is not enabled.');
 if(b.carry)add(3,'Red Mage multiclassing is not implemented.');
 if(b.archetypeId)add(3,'Red Mage archetypes are not enabled.');
 if(scores.cha<11||scores.cha>45)add(1,'Red Mage requires effective Charisma from 11 to 45 for its first-level spells and verified MP table.');
 if(b.initialIntMod!==null&&b.initialIntMod!==undefined)add(5,'Red Mage spell learning uses Charisma; Black Mage spellbook initialization is not supported.');
 if(Object.keys(b.choices||{}).some(k=>k!==RED_MAGERY_EVENT)||!Array.isArray(b.choices?.[RED_MAGERY_EVENT])||b.choices[RED_MAGERY_EVENT].length!==1||!redMageOptions().some(o=>o.id===b.choices[RED_MAGERY_EVENT][0]))add(4,'Choose exactly one first-level Red Magery option: Quick Mind or Spell Combat Expertise.');
 if(Object.keys(b.abilityIncreases||{}).length)add(1,'A first-level Red Mage has no level-based ability increase.');
 if(!complete)return issues;
 if(JSON.stringify(b.hpRolls)!=='[8]')add(4,'Red Mage starts with 8 base HP before Constitution.');
 if(b.favored?.length)add(4,'Red Mage favored-class rewards remain manual for this first-level integration.');
 const counts=redMageSpellCounts(scores,b.initialChaMod),selected=b.spellIds.map(id=>redMageSpells.find(s=>s.id===id));
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
