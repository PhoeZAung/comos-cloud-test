import {fixedSkills} from '../../sheet/skills.mjs';
import {DWARF_ID,DWARF_LANGUAGES,DWARF_MOUNTAIN_LANDSCAPE,GARLEAN_ID,GARLEAN_LANGUAGES,GARLEAN_WEAPON,GARLEAN_CRAFT,GARIF_ID,GARIF_LANGUAGES,GARIF_TERRAIN,GARIF_PASTORALIST,DRACOBALTIAN_ID,DRACOBALTIAN_LANGUAGES,BURMECIAN_ID,BURMECIAN_LANGUAGES,BEASTKIN_ID,BEASTKIN_LANGUAGES,BANGAA_ID,BANGAA_LANGUAGES,AU_RA_ID,AU_RA_LANGUAGES,AL_BHED_ID,AL_BHED_LANGUAGES,AL_BHED_GENIUS,AEGYL_ID,AEGYL_LANGUAGES,HUME_ID,HUME_SCORE,HUME_LANGUAGES,MITHRA_ID,MITHRA_LANGUAGES,TARUTARU_ID,TARUTARU_LANGUAGES,TARUTARU_TALENTED,humeTraitActive,languageName,validLanguageChoice} from './racial-progress.mjs';

const IMMORTAL='ffd20:race:immortal:pool:';
const MOOGLE_LANGUAGES='ffd20:race:moogle:pool:bonus-languages';
const HANDY='ffd20:race:moogle:pool:moogle-handy-craft-or-profession';
const ELVAAN_WEAPON='ffd20:race:elvaan:pool:martial-background-weapon';
const ELVAAN_LANGUAGES='ffd20:race:elvaan:pool:high-intelligence-bonus-languages';
const GALKA_LANGUAGES='ffd20:race:galka:pool:high-intelligence-bonus-languages';
const supported=new Set([DWARF_LANGUAGES,DWARF_MOUNTAIN_LANDSCAPE,GARLEAN_LANGUAGES,GARLEAN_WEAPON,GARLEAN_CRAFT,GARIF_LANGUAGES,GARIF_TERRAIN,GARIF_PASTORALIST,DRACOBALTIAN_LANGUAGES,BURMECIAN_LANGUAGES,BEASTKIN_LANGUAGES,BANGAA_LANGUAGES,AU_RA_LANGUAGES,AL_BHED_LANGUAGES,AL_BHED_GENIUS,AEGYL_LANGUAGES,TARUTARU_LANGUAGES,TARUTARU_TALENTED,MITHRA_LANGUAGES,HUME_SCORE,HUME_LANGUAGES,GALKA_LANGUAGES,HANDY,MOOGLE_LANGUAGES,ELVAAN_WEAPON,ELVAAN_LANGUAGES,IMMORTAL+'flexible-score',IMMORTAL+'long-lived-knowledge',IMMORTAL+'bonus-languages']);
export const supportsRacialPool=id=>supported.has(id);
const skillId=row=>'skill:'+row.name.toLowerCase().replace('knw: ','knowledge-').replaceAll(' ','-');

// Some source definitions use older extraction target names. Keep the
// source records intact and append only their verified unconditional sheet maps.
export function mappedRaceTraits(race,traits){
 if(!['ffd20:race:moogle','ffd20:race:immortal',HUME_ID,MITHRA_ID,TARUTARU_ID,AEGYL_ID,AL_BHED_ID,AU_RA_ID,BANGAA_ID,BURMECIAN_ID,DRACOBALTIAN_ID,GARIF_ID,GARLEAN_ID].includes(race.id))return traits;
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
    add(e,'identity.subtypes',null,[BANGAA_ID,DRACOBALTIAN_ID].includes(race.id)?'reptilian':race.id.split(':').at(-1));
   }
   if(e.target==='languages.starting')for(const lang of (e.textValue||'').split(';').map(s=>s.trim()).filter(Boolean))add(e,'identity.languages.'+lang.toLowerCase(),null,lang);
   if([AU_RA_ID,BURMECIAN_ID].includes(race.id)&&e.target==='senses.darkvision')add(e,'identity.senses.darkvision',null,'Darkvision '+e.textValue);
   if(e.target==='senses.low_light_vision')add(e,'identity.senses.low_light_vision');
  }
  if(race.id===GARLEAN_ID&&f.id===GARLEAN_ID+':trait:noble-upbringing')for(const [row,label] of [[20,'history'],[23,'nobility']])mapped.push({id:f.id+':sheet:class-skill:'+label,kind:'class_skill',target:'skills.row.'+row+'.class_skill',operation:'add',value:{kind:'constant',value:1},bonusType:null,condition:null,automation:'automatic'});
  if(race.id===GARIF_ID&&f.id===GARIF_ID+':trait:weapon-familiarity')for(const name of ['Longspear','Shortspear','Javelin','Boar spear'])mapped.push({id:f.id+':sheet:weapon:'+name.toLowerCase().replaceAll(' ','-'),kind:'proficiency',target:'proficiencies.weapon.'+name.toLowerCase().replaceAll(' ','-'),operation:'grant',value:null,textValue:name,bonusType:null,condition:null,automation:'automatic'});
  return mapped.length?{...f,effects:[...f.effects,...mapped]}:f;
 });
}

export function racialChoiceSpecs(race,traits){
 if(!race)return [];
 const active=new Set(traits.flatMap(t=>t.choicePoolIds||[]));
 // Legacy Dwarf's extracted language trait predates choice-pool links. Keep
 // canonical source unchanged; expose its existing list only while trait active.
 if(race.id===DWARF_ID&&traits.some(f=>f.id===DWARF_ID+':feature:languages'))active.add(DWARF_LANGUAGES);
 return race.choicePools.filter(p=>active.has(p.id)&&supported.has(p.id)).map(pool=>{
  if(pool.id===DWARF_MOUNTAIN_LANDSCAPE)return {...pool,minimum:1,maximum:1};
  if(pool.id===GARLEAN_WEAPON)return {...pool,minimum:1,maximum:1,options:pool.options.filter(o=>o.value==='firearms-simple')};
  if(pool.id===GARLEAN_CRAFT)return {...pool,minimum:1,maximum:1,specialty:true,options:fixedSkills.flatMap((row,i)=>row.name==='Craft'?[{id:'skill-row:'+i,name:'Craft '+(i-3),value:i}]:[])};
  if(pool.id===GARIF_PASTORALIST)return {...pool,minimum:1,maximum:1,specialty:true,specialtyRequiredFor:[4,5,6,34,35,36].map(i=>'skill-row:'+i),options:fixedSkills.flatMap((row,i)=>[4,5,6,22,34,35,36,43].includes(i)?[{id:'skill-row:'+i,name:['Craft','Profession'].includes(row.name)?row.name+' '+(fixedSkills.slice(0,i).filter(r=>r.name===row.name).length+1):row.name,value:i}]:[])};
  if(pool.id===GARIF_TERRAIN)return {...pool,minimum:1,maximum:1};
  if(pool.id===AL_BHED_GENIUS)return {...pool,minimum:1,maximum:1,specialty:true,specialtyRequiredFor:[4,5,6].map(i=>'skill-row:'+i),options:fixedSkills.flatMap((row,i)=>[4,5,6,8,18,34,35,36,45].includes(i)?[{id:'skill-row:'+i,name:row.name==='Profession'?'Profession (engineering) '+(i-33):row.name==='Craft'?'Craft '+(i-3):row.name,value:i}]:[])};
  if([HANDY,TARUTARU_TALENTED].includes(pool.id))return {...pool,minimum:1,maximum:1,specialty:true,options:fixedSkills.flatMap((row,i)=>['Craft','Profession'].includes(row.name)?[{id:'skill-row:'+i,name:row.name+' '+(fixedSkills.slice(0,i).filter(r=>r.name===row.name).length+1),value:i}]:[])};
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
   if(spec.id===GARLEAN_WEAPON&&option.value==='firearms-simple')effects.push({...base,kind:'proficiency',target:'proficiencies.weapon.firearms-simple',textValue:'Firearms (Simple)'});
   if(spec.id===GARLEAN_CRAFT)effects.push({...base,kind:'skill_bonus',target:'skills.row.'+option.value+'.bonus',value:{kind:'constant',value:2},specialty:b.racialSpecialties?.[spec.id]||''});
   if(spec.id===GARIF_PASTORALIST){
    effects.push({...base,kind:'class_skill',target:'skills.row.'+option.value+'.class_skill',value:{kind:'constant',value:1}});
    if(spec.specialtyRequiredFor.includes(option.id))effects.push({...base,id:base.id+':specialty',kind:'skill_bonus',target:'skills.row.'+option.value+'.bonus',value:{kind:'constant',value:0},specialty:b.racialSpecialties?.[spec.id]||''});
   }
   if(spec.id===AL_BHED_GENIUS){
    const profession=fixedSkills[option.value]?.name==='Profession',craft=fixedSkills[option.value]?.name==='Craft';
    effects.push({...base,kind:'skill_bonus',target:'skills.row.'+option.value+'.bonus',value:{kind:'constant',value:2},specialty:profession?'Engineering':craft?b.racialSpecialties?.[spec.id]||'':''});
    if(profession)effects.push({...base,id:base.id+':class-skill',kind:'class_skill',target:'skills.row.'+option.value+'.class_skill',value:{kind:'constant',value:1}});
   }
   if([HANDY,TARUTARU_TALENTED].includes(spec.id))effects.push({...base,kind:'skill_bonus',target:'skills.row.'+option.value+'.bonus',value:{kind:'constant',value:2},specialty:b.racialSpecialties?.[spec.id]||''});
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
  if(spec.specialty&&(!spec.specialtyRequiredFor||spec.specialtyRequiredFor.includes(values[0]))&&!(b.racialSpecialties?.[spec.id]||'').trim())errors.push('Name the Craft or Profession specialty for '+spec.name+'.');
 }
 for(const [id,value] of Object.entries(b.racialSpecialties||{}))if(!byId.get(id)?.specialty||typeof value!=='string'||value.length>80||/[\u0000-\u001f]/.test(value))errors.push('Invalid racial skill specialty.');
 return errors;
}

// A chosen bonus feat is a visible manual card, never a blanket attack bonus.
export function racialChoiceFeats(b,race,traits,previous={}){
 if(b.raceId===BURMECIAN_ID&&traits.some(f=>f.id===BURMECIAN_ID+':trait:quick-reactions')){
  const id=BURMECIAN_ID+':bonus-feat:improved-initiative',old=previous.feats?.find(f=>f.sourceRuleId===id),name='Improved Initiative',desc='Granted by Burmecian Quick Reactions. Apply the official feat’s initiative benefits manually; this card does not change the initiative field.';
  return [{...old,name:old?.rulesName&&old.name!==old.rulesName?old.name:name,desc:old?.rulesDescription&&old.desc!==old.rulesDescription?old.desc:desc,rulesName:name,rulesDescription:desc,sourceRuleId:id,sourceRace:'Burmecian',rulesOwned:true,pendingFeat:false,automation:'manual'}];
 }
 if(b.raceId===AL_BHED_ID&&traits.some(f=>f.id===AL_BHED_ID+':trait:technologist')){
  const id=AL_BHED_ID+':bonus-feat:technologist',old=previous.feats?.find(f=>f.sourceRuleId===id),name='Technologist',desc='Granted by Al Bhed Technologist. Resolve technological skills and feat effects manually using the official feat rules.';
  return [{...old,name:old?.rulesName&&old.name!==old.rulesName?old.name:name,desc:old?.rulesDescription&&old.desc!==old.rulesDescription?old.desc:desc,rulesName:name,rulesDescription:desc,sourceRuleId:id,sourceRace:'Al Bhed',rulesOwned:true,pendingFeat:false,automation:'manual'}];
 }
 if([MITHRA_ID,BEASTKIN_ID].includes(b.raceId)&&traits.some(f=>f.id===b.raceId+':trait:fleet-footed')){
  const id=b.raceId+':bonus-feat:run',old=previous.feats?.find(f=>f.sourceRuleId===id);
  return [{...old,name:old?.rulesName&&old.name!==old.rulesName?old.name:'Run',desc:old?.rulesDescription&&old.desc!==old.rulesDescription?old.desc:'Granted by '+race.name+' Fleet-Footed. Apply the Run feat’s movement benefits manually; Sprinter is a separate conditional rule.',rulesName:'Run',rulesDescription:'Granted by '+race.name+' Fleet-Footed. Apply the Run feat’s movement benefits manually; Sprinter is a separate conditional rule.',sourceRuleId:id,sourceRace:race.name,rulesOwned:true,pendingFeat:false,automation:'manual'}];
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
