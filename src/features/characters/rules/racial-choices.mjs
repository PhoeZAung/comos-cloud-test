import {fixedSkills} from '../../sheet/skills.mjs';
import {HUME_ID,HUME_SCORE,HUME_LANGUAGES,MITHRA_ID,MITHRA_LANGUAGES,humeTraitActive,languageName,validLanguageChoice} from './racial-progress.mjs';

const IMMORTAL='ffd20:race:immortal:pool:';
const MOOGLE_LANGUAGES='ffd20:race:moogle:pool:bonus-languages';
const HANDY='ffd20:race:moogle:pool:moogle-handy-craft-or-profession';
const ELVAAN_WEAPON='ffd20:race:elvaan:pool:martial-background-weapon';
const ELVAAN_LANGUAGES='ffd20:race:elvaan:pool:high-intelligence-bonus-languages';
const GALKA_LANGUAGES='ffd20:race:galka:pool:high-intelligence-bonus-languages';
const supported=new Set([MITHRA_LANGUAGES,HUME_SCORE,HUME_LANGUAGES,GALKA_LANGUAGES,HANDY,MOOGLE_LANGUAGES,ELVAAN_WEAPON,ELVAAN_LANGUAGES,IMMORTAL+'flexible-score',IMMORTAL+'long-lived-knowledge',IMMORTAL+'bonus-languages']);
export const supportsRacialPool=id=>supported.has(id);
const skillId=row=>'skill:'+row.name.toLowerCase().replace('knw: ','knowledge-').replaceAll(' ','-');

// The two reviewed-for-testing races use older extraction target names. Keep the
// source records intact and append only their verified unconditional sheet maps.
export function mappedRaceTraits(race,traits){
 if(!['ffd20:race:moogle','ffd20:race:immortal',HUME_ID,MITHRA_ID].includes(race.id))return traits;
 return traits.map(f=>{
  const mapped=[];
  const add=(e,target,value=e.value,textValue=e.textValue)=>mapped.push({...e,id:e.id+':sheet:'+mapped.length,target,value,textValue,automation:'automatic'});
  for(const e of f.effects||[]){
   if(e.condition)continue;
   if(e.automation==='automatic'&&e.kind==='skill_bonus'&&/^skills\.[a-z_-]+$/.test(e.target))add(e,'skills.skill:'+e.target.slice(7).replaceAll('_','-')+'.bonus');
   if(race.id===HUME_ID&&f.id.endsWith(':curiosity')&&e.kind==='class_skill')add(e,'skills.skill:'+e.target.slice(7)+'.class_skill',{kind:'constant',value:1});
   if(!race.data.standardTraitIds.includes(f.id))continue;
   if(e.target==='size_category')add(e,'identity.size_category');
   if(e.target==='speed.land'){
    const speed=e.value?.kind==='constant'?e.value.value:Number(/^\d+/.exec(e.textValue||'')?.[0]);
    if(Number.isFinite(speed))add(e,'identity.speed.land',{kind:'constant',value:speed});
   }
   if(e.target==='creature_type'){
    add(e,'identity.type',null,'Humanoid');
    add(e,'identity.subtypes',null,race.id.split(':').at(-1));
   }
   if(e.target==='languages.starting')for(const lang of (e.textValue||'').split(';').map(s=>s.trim()).filter(Boolean))add(e,'identity.languages.'+lang.toLowerCase(),null,lang);
   if(e.target==='senses.low_light_vision')add(e,'identity.senses.low_light_vision');
  }
  return mapped.length?{...f,effects:[...f.effects,...mapped]}:f;
 });
}

export function racialChoiceSpecs(race,traits){
 if(!race)return [];
 const active=new Set(traits.flatMap(t=>t.choicePoolIds||[]));
 return race.choicePools.filter(p=>active.has(p.id)&&supported.has(p.id)).map(pool=>{
  if(pool.id===HANDY)return {...pool,minimum:1,maximum:1,specialty:true,options:fixedSkills.flatMap((row,i)=>['Craft','Profession'].includes(row.name)?[{id:'skill-row:'+i,name:row.name+' '+(fixedSkills.slice(0,i).filter(r=>r.name===row.name).length+1),value:i}]:[])};
  if(pool.id===IMMORTAL+'long-lived-knowledge')return {...pool,minimum:0,maximum:4,options:fixedSkills.filter(row=>row.name.startsWith('Knw: ')).map(row=>({id:skillId(row),name:row.name,value:skillId(row)}))};
  if(pool.id===ELVAAN_WEAPON)return {...pool,minimum:1,maximum:1,options:pool.options.filter(o=>traits.some(f=>f.effects.some(e=>e.automation==='automatic'&&!e.condition&&e.target==='proficiencies.weapon.'+o.value)))};
  if(pool.id===HUME_LANGUAGES)return {...pool,minimum:0,maximum:null,freeText:true};
  return {...pool,minimum:pool.choiceType==='language'?0:1,maximum:pool.choiceType==='language'?null:1};
 });
}

export function racialChoiceEffects(b,race,traits){
 const effects=[];
 for(const spec of racialChoiceSpecs(race,traits)){
  const selected=b.racialChoices?.[spec.id]||[];
  const options=spec.freeText?selected.filter(validLanguageChoice).map(id=>({id,name:languageName(id),value:languageName(id).toLowerCase().replace(/\s+/g,'-')})):selected.map(id=>spec.options.find(o=>o.id===id)).filter(Boolean);
  for(const option of options){
   const base={id:spec.id+':selected:'+option.id,operation:'add',automation:'automatic',condition:null,bonusType:'racial'};
   if(spec.id===HANDY)effects.push({...base,kind:'skill_bonus',target:'skills.row.'+option.value+'.bonus',value:{kind:'constant',value:2},specialty:b.racialSpecialties?.[spec.id]||''});
   if([IMMORTAL+'flexible-score',HUME_SCORE].includes(spec.id)){
    const key={strength:'str',dexterity:'dex',constitution:'con',intelligence:'int',wisdom:'wis',charisma:'cha'}[option.value];
    if(key)effects.push({...base,kind:'ability_score',target:'ability_scores.'+key,value:{kind:'constant',value:2}});
   }
   if(spec.id===IMMORTAL+'long-lived-knowledge')effects.push({...base,kind:'class_skill',target:'skills.'+option.value+'.class_skill',value:{kind:'constant',value:1}});
   if(spec.choiceType==='language')effects.push({...base,kind:'language',target:'identity.languages.'+option.value,textValue:option.name});
  }
 }
 return effects;
}

export function racialChoiceIssues(b,race,traits,scores){
 const errors=[],specs=racialChoiceSpecs(race,traits),byId=new Map(specs.map(s=>[s.id,s]));
 for(const [id,values] of Object.entries(b.racialChoices||{})){
  const spec=byId.get(id);
  if(!spec||!Array.isArray(values)){errors.push('Unknown or inactive racial choice.');continue;}
  const identities=spec.freeText?values.map(v=>languageName(v).toLowerCase()):values;
  if(new Set(identities).size!==values.length||values.some(v=>spec.freeText?!validLanguageChoice(v):!spec.options.some(o=>o.id===v)))errors.push('Invalid or duplicate '+spec.name+' selection.');
 }
 for(const spec of specs){
  if(spec.id===ELVAAN_WEAPON&&!spec.options.length)errors.push('Martial Background requires a verified proficient weapon. Keep Elvaan Weapon Familiarity active for this limited integration.');
  const values=b.racialChoices?.[spec.id]||[],maximum=spec.maximum??Math.max(0,Math.floor((scores.int-10)/2));
  if(values.length<spec.minimum||values.length>maximum)errors.push(spec.name+': choose '+(spec.minimum===maximum?maximum:'up to '+maximum)+' option(s).');
  if(spec.specialty&&!(b.racialSpecialties?.[spec.id]||'').trim())errors.push('Name the Craft or Profession specialty for Moogle Handy.');
 }
 for(const [id,value] of Object.entries(b.racialSpecialties||{}))if(!byId.get(id)?.specialty||typeof value!=='string'||value.length>80||/[\u0000-\u001f]/.test(value))errors.push('Invalid racial skill specialty.');
 return errors;
}

// A chosen bonus feat is a visible manual card, never a blanket attack bonus.
export function racialChoiceFeats(b,race,traits,previous={}){
 if(b.raceId===MITHRA_ID&&traits.some(f=>f.id===MITHRA_ID+':trait:fleet-footed')){
  const id=MITHRA_ID+':bonus-feat:run',old=previous.feats?.find(f=>f.sourceRuleId===id);
  return [{...old,name:old?.rulesName&&old.name!==old.rulesName?old.name:'Run',desc:old?.rulesDescription&&old.desc!==old.rulesDescription?old.desc:'Granted by Mithra Fleet-Footed. Apply the Run feat’s movement benefits manually; Sprinter is a separate conditional rule.',rulesName:'Run',rulesDescription:'Granted by Mithra Fleet-Footed. Apply the Run feat’s movement benefits manually; Sprinter is a separate conditional rule.',sourceRuleId:id,sourceRace:'Mithra',rulesOwned:true,pendingFeat:false,automation:'manual'}];
 }
 if(humeTraitActive(b,'bonus-feat')){
  const id=HUME_ID+':bonus-feat:level-1',old=previous.feats?.find(f=>f.sourceRuleId===id);
  return [{...old,name:old?.name||'Hume bonus feat · level 1',desc:old?.desc||'One extra feat at first level from Hume Bonus Feat. Choose a feat and check its prerequisites manually.',sourceRuleId:id,sourceRace:'Hume',rulesOwned:true,pendingFeat:old?.pendingFeat??true,automation:'manual'}];
 }
 const spec=racialChoiceSpecs(race,traits).find(s=>s.id===ELVAAN_WEAPON);
 const option=spec?.options.find(o=>o.id===b.racialChoices?.[ELVAAN_WEAPON]?.[0]);
 if(!option)return [];
 const id='ffd20:race:elvaan:feature:martial-background:weapon-focus',name='Weapon Focus ('+option.name+')';
 const desc='Granted by Elvaan Martial Background at level 1 for the selected proficient weapon: '+option.name+'. Apply its benefits manually to qualifying attacks with this weapon. See the official feat rules.';
 const old=previous.feats?.find(f=>f.sourceRuleId===id);
 return [{...old,name:old?.rulesName&&old.name!==old.rulesName?old.name:name,
  desc:old?.rulesDescription&&old.desc!==old.rulesDescription?old.desc:desc,rulesName:name,rulesDescription:desc,
  sourceRuleId:id,sourceRace:'Elvaan',rulesOwned:true,pendingFeat:false,automation:'manual'}];
}

export function pruneRacialChoices(b,race,traits){
 const specs=racialChoiceSpecs(race,traits),active=new Set(specs.map(s=>s.id));
 b.racialChoices=Object.fromEntries(Object.entries(b.racialChoices||{}).filter(([id])=>active.has(id)));
 b.racialSpecialties=Object.fromEntries(Object.entries(b.racialSpecialties||{}).filter(([id])=>specs.some(s=>s.id===id&&s.specialty)));
}
