import {fixedSkills} from '../../sheet/skills.mjs';

const IMMORTAL='ffd20:race:immortal:pool:';
const HANDY='ffd20:race:moogle:pool:moogle-handy-craft-or-profession';
const supported=new Set([HANDY,IMMORTAL+'flexible-score',IMMORTAL+'long-lived-knowledge',IMMORTAL+'bonus-languages']);
export const supportsRacialPool=id=>supported.has(id);
const skillId=row=>'skill:'+row.name.toLowerCase().replace('knw: ','knowledge-').replaceAll(' ','-');

// The two reviewed-for-testing races use older extraction target names. Keep the
// source records intact and append only their verified unconditional sheet maps.
export function mappedRaceTraits(race,traits){
 if(!['ffd20:race:moogle','ffd20:race:immortal'].includes(race.id))return traits;
 return traits.map(f=>{
  const mapped=[];
  const add=(e,target,value=e.value,textValue=e.textValue)=>mapped.push({...e,id:e.id+':sheet:'+mapped.length,target,value,textValue,automation:'automatic'});
  for(const e of f.effects||[]){
   if(e.condition)continue;
   if(e.automation==='automatic'&&e.kind==='skill_bonus'&&/^skills\.[a-z_]+$/.test(e.target))add(e,'skills.skill:'+e.target.slice(7).replaceAll('_','-')+'.bonus');
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
  return {...pool,minimum:pool.choiceType==='language'?0:1,maximum:pool.choiceType==='language'?null:1};
 });
}

export function racialChoiceEffects(b,race,traits){
 const effects=[];
 for(const spec of racialChoiceSpecs(race,traits)){
  const selected=b.racialChoices?.[spec.id]||[];
  const options=selected.map(id=>spec.options.find(o=>o.id===id)).filter(Boolean);
  for(const option of options){
   const base={id:spec.id+':selected:'+option.id,operation:'add',automation:'automatic',condition:null,bonusType:'racial'};
   if(spec.id===HANDY)effects.push({...base,kind:'skill_bonus',target:'skills.row.'+option.value+'.bonus',value:{kind:'constant',value:2},specialty:b.racialSpecialties?.[spec.id]||''});
   if(spec.id===IMMORTAL+'flexible-score'){
    const key={strength:'str',dexterity:'dex',constitution:'con',intelligence:'int',wisdom:'wis',charisma:'cha'}[option.value];
    if(key)effects.push({...base,kind:'ability_score',target:'ability_scores.'+key,value:{kind:'constant',value:2}});
   }
   if(spec.id===IMMORTAL+'long-lived-knowledge')effects.push({...base,kind:'class_skill',target:'skills.'+option.value+'.class_skill',value:{kind:'constant',value:1}});
   if(spec.id===IMMORTAL+'bonus-languages')effects.push({...base,kind:'language',target:'identity.languages.'+option.value,textValue:option.name});
  }
 }
 return effects;
}

export function racialChoiceIssues(b,race,traits,scores){
 const errors=[],specs=racialChoiceSpecs(race,traits),byId=new Map(specs.map(s=>[s.id,s]));
 for(const [id,values] of Object.entries(b.racialChoices||{})){
  const spec=byId.get(id);
  if(!spec||!Array.isArray(values)){errors.push('Unknown or inactive racial choice.');continue;}
  if(new Set(values).size!==values.length||values.some(v=>!spec.options.some(o=>o.id===v)))errors.push('Invalid or duplicate '+spec.name+' selection.');
 }
 for(const spec of specs){
  const values=b.racialChoices?.[spec.id]||[],maximum=spec.maximum??Math.max(0,Math.floor((scores.int-10)/2));
  if(values.length<spec.minimum||values.length>maximum)errors.push(spec.name+': choose '+(spec.minimum===maximum?maximum:'up to '+maximum)+' option(s).');
  if(spec.specialty&&!(b.racialSpecialties?.[spec.id]||'').trim())errors.push('Name the Craft or Profession specialty for Moogle Handy.');
 }
 for(const [id,value] of Object.entries(b.racialSpecialties||{}))if(!byId.get(id)?.specialty||typeof value!=='string'||value.length>80||/[\u0000-\u001f]/.test(value))errors.push('Invalid racial skill specialty.');
 return errors;
}

export function pruneRacialChoices(b,race,traits){
 const specs=racialChoiceSpecs(race,traits),active=new Set(specs.map(s=>s.id));
 b.racialChoices=Object.fromEntries(Object.entries(b.racialChoices||{}).filter(([id])=>active.has(id)));
 b.racialSpecialties=Object.fromEntries(Object.entries(b.racialSpecialties||{}).filter(([id])=>specs.some(s=>s.id===id&&s.specialty)));
}
