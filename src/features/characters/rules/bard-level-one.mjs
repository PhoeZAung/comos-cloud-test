import {classCatalog} from './class-catalog.mjs';
import {bardSongs} from './bard-songs.mjs';
import {bonusMp} from '../rules-summary.mjs';
export const BARD_ID='ffd20:class:bard';
export const isBard=b=>b?.classId===BARD_ID;
const record=classCatalog.classes.find(c=>c.id===BARD_ID);
export const bardClass=record?.adapter==='bard-level-one'?{...record,resources:[],choicePools:[],data:{...record.data,proficiencies:['Simple weapons','Harp bows','Light armor'],startingWealth:105}}:null;
const mod=n=>Math.floor((n-10)/2);
export function bardSummary(scores){
 const extra=bonusMp(Math.max(1,Math.min(45,scores.cha)),1);
 return {bab:0,fort:0,ref:2,will:2,baseMp:2,bonusMp:extra,mp:2+extra,spellLevel:1,skillPerLevel:Math.max(1,6+mod(scores.int))};
}
export const bardSpellOptions=()=>bardSongs;
export const bardSpellCounts=scores=>({cantrips:2,leveled:3+mod(scores.cha)});
export function bardPreview(b,{scores,race,racial,hpRolls}){
 const summary=bardSummary(scores);
 return {scores,race,racial,summary,hp:hpRolls.reduce((n,r)=>n+Math.max(1,r+mod(scores.con)),0),skillBudget:summary.skillPerLevel,
  features:bardClass.features.filter(f=>f.atLevel===1).map(f=>({...f,featureKind:['sirens-song','soul-voice'].some(s=>f.id.endsWith(':'+s))?'limit_break':f.featureKind}))};
}
export function bardIssues(b,scores,{complete=true}={}){
 const issues=[],add=(step,message)=>issues.push({step,message});
 if(b.level!==1)add(3,'Bard currently supports level-1 testing only; later progression is not enabled.');
 if(b.carry)add(3,'Bard multiclassing is not implemented.');
 if(b.archetypeId)add(3,'Bard archetypes are not enabled.');
 if(scores.cha<11||scores.cha>45)add(1,'Bard requires effective Charisma from 11 to 45 for its first-level songs and verified MP table.');
 if(b.initialIntMod!==null&&b.initialIntMod!==undefined)add(5,'Bard song learning uses Charisma; Black Mage spellbook initialization is not supported.');
 if(Object.keys(b.choices||{}).length)add(4,'Bard gains no song talent or Versatile Performance choice until level 2.');
 if(Object.keys(b.abilityIncreases||{}).length)add(1,'A first-level Bard has no level-based ability increase.');
 if(!complete)return issues;
 if(JSON.stringify(b.hpRolls)!=='[8]')add(4,'Bard starts with 8 base HP before Constitution.');
 if(b.favored?.length)add(4,'Bard favored-class rewards remain manual for this first-level integration.');
 const counts=bardSpellCounts(scores),selected=b.spellIds.map(id=>bardSongs.find(s=>s.id===id));
 if(selected.some(s=>!s)||new Set(b.spellIds).size!==b.spellIds.length)add(5,'Choose distinct first-level Bard songs and jingles from the imported catalog.');
 if(selected.filter(s=>s?.level===0).length!==counts.cantrips||selected.filter(s=>s?.level===1).length!==counts.leveled)add(5,'Choose 2 jingles and '+counts.leveled+' first-level Bard songs.');
 if(b.spellSelections&&['cantrips','leveled'].some(k=>b.spellSelections[k].length!==counts[k]||b.spellSelections[k].some(id=>!id||!bardSongs.some(s=>s.id===id&&s.level===(k==='cantrips'?0:1)))))add(5,'Fill every Bard song slot with a song of the correct level.');
 if(!Array.isArray(b.skillRanks))add(7,'Allocate your Bard skill ranks before saving.');
 if(!b.reviewed)add(6,'Review the Bard preview and manual song and performance rules before saving.');
 return issues;
}
export function bardSpellRows(b,previous={}){
 return b.spellIds.map(id=>{
  const spell=bardSongs.find(s=>s.id===id),old=previous.spells?.find(s=>s.sourceRuleId===id);
  return {...old,sourceRuleId:id,rulesOwned:true,sourceClass:'Bard',
   name:old?.rulesName&&old.name!==old.rulesName?old.name:spell.name,
   desc:old?.rulesDescription&&old.desc!==old.rulesDescription?old.desc:spell.description,
   rulesName:spell.name,rulesDescription:spell.description,lvl:spell.level,mp_cost:spell.mpCost,casting_ability:'cha',
   school:spell.school,range:spell.range,duration:spell.duration,saving_throw:spell.save,target:spell.target,
   casting_time:spell.castingTime,spell_resistance:spell.spellResistance,maintained:spell.usageMode==='maintained',
   automation:'manual',sourceURL:spell.url};
 });
}
