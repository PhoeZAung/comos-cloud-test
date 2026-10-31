import {fixedSkills} from '../../sheet/skills.mjs';
import {registry} from './catalog.mjs';
import {buildLevel} from './multiclass.mjs';
import {QUADAV_ID,QUADAV_TERRAIN,LAMBKIN_ID,LAMBKIN_LANGUAGES,LAMBKIN_POLYGLOT_LANGUAGE,DWARF_ID,DWARF_LANGUAGES,GARLEAN_ID,GARLEAN_LANGUAGES,GARLEAN_WEAPON,GARLEAN_CRAFT,GARIF_ID,GARIF_LANGUAGES,GARIF_TERRAIN,GARIF_PASTORALIST,DRACOBALTIAN_ID,DRACOBALTIAN_LANGUAGES,BURMECIAN_ID,BURMECIAN_LANGUAGES,BEASTKIN_ID,BEASTKIN_LANGUAGES,BANGAA_ID,BANGAA_LANGUAGES,AU_RA_ID,AU_RA_LANGUAGES,AL_BHED_ID,AL_BHED_LANGUAGES,AL_BHED_GENIUS,AEGYL_ID,AEGYL_LANGUAGES,HUME_ID,HUME_SCORE,HUME_LANGUAGES,MITHRA_ID,MITHRA_LANGUAGES,TARUTARU_ID,TARUTARU_LANGUAGES,TARUTARU_TALENTED,humeTraitActive,languageName,validLanguageChoice} from './racial-progress.mjs';

const SHINDROID='ffd20:race:shindroid';
export const SHINDROID_SIMULATED_RACE=SHINDROID+':pool:race-simulation-humanoid';
const SHINDROID_HOLOGRAM=SHINDROID+':trait:hologram-simulation';

// A simulated race must be a playable source-listed humanoid with a verified
// standard size. No copying its other racial bonuses, immunities or languages.
export function shindroidSimulationOptions(){
 return registry.races.filter(r=>{
  if(r.id===SHINDROID)return false;
  const type=r.features.find(f=>f.id===r.id+':trait:type'||f.name==='Type');
  // Generated race catalog changes legacy creature_type/size_category
  // effect automation to manual because the generic runtime does not own those
  // raw target paths. Their explicit source type/size text remains authoritative.
  const identity=type?.effects?.find(e=>!e.condition&&
   (e.target==='identity.type'&&e.automation==='automatic'||e.target==='creature_type'&&e.textValue));
  const size=r.features.find(f=>f.id===r.id+':trait:size'||f.name==='Size');
  const sz=size?.effects?.find(e=>!e.condition&&
   (e.target==='identity.size_category'&&e.automation==='automatic'||e.target==='size_category'&&e.textValue));
  return /^humanoid(?:\s|\(|$)/i.test(identity?.textValue||'')&&
   ['Fine','Diminutive','Tiny','Small','Medium','Large','Huge'].includes(
    (sz?.textValue||'').replace(/^./,ch=>ch.toUpperCase()));
 }).map(r=>{
  const sz=r.features.find(f=>f.id===r.id+':trait:size'||f.name==='Size').effects
   .find(e=>!e.condition&&(e.target==='identity.size_category'&&e.automation==='automatic'||e.target==='size_category'&&e.textValue));
  return {id:SHINDROID_SIMULATED_RACE+':option:'+r.id.split(':').at(-1),
   name:r.name,value:r.id,size:sz.textValue.replace(/^./,ch=>ch.toUpperCase())};
 }).sort((a,b)=>a.name.localeCompare(b.name));
}
const IMMORTAL='ffd20:race:immortal:pool:';
const POLYGLOT=TARUTARU_ID+':trait:polyglot';
const LAMBKIN_POLYGLOT=LAMBKIN_ID+':trait:polyglot';
export const TARUTARU_POLYGLOT_LANGUAGE=TARUTARU_ID+':pool:polyglot-starting-language';
const MOOGLE_LANGUAGES='ffd20:race:moogle:pool:bonus-languages';
const HANDY='ffd20:race:moogle:pool:moogle-handy-craft-or-profession';
const SYRICTA='ffd20:race:syricta';
export const SYRICTA_ELEMENT=SYRICTA+':pool:elemental-resistance-selection';
export const SYRICTA_BREATH=SYRICTA+':pool:breath-weapon-selection';
export const SYRICTA_MEMORIES=SYRICTA+':pool:memories-knowledge-skills';
const GENOME='ffd20:race:genome',PALICO='ffd20:race:palico',KINDRED='ffd20:race:kindred';
const PALICO_START=PALICO+':pool:starting-second-language',KINDRED_START=KINDRED+':pool:languages-selection';
const extraLanguageRacePools=new Map([
 ['genome','bonus-languages'],['gria','bonus-languages'],['guado','bonus-languages'],
 ['hypello','bonus-languages'],['mandragora','bonus-languages'],
 ['palico','starting-second-language'],['kindred','languages-selection']
].map(([slug,pool])=>['ffd20:race:'+slug+':pool:'+pool,{slug,pool}]));
const optionalLangs={
 palico:['Abyssal','Celestial','Elvaan','Galkan','Goblin','Orc'],
 kindred:['Abyssal','Draconic','Dwarven','Elvaan','Infernal','Lalafellen','Orc']
};
const languageBonusId=id=>id+':pool:high-intelligence-bonus-languages';

const MUTANT='ffd20:race:mutant';
const MUTANT_PHYSICAL=MUTANT+':pool:physical-2',MUTANT_MENTAL=MUTANT+':pool:mental-2',MUTANT_PENALTY=MUTANT+':pool:penalty-2';
const mutantScorePools=new Set([MUTANT_PHYSICAL,MUTANT_MENTAL,MUTANT_PENALTY]);

const ORC_SKILL='ffd20:race:orc:pool:skill-bonus-selection';
const MATANGA_ACADEMIC='ffd20:race:matanga:pool:academic-selection';
const LOPORRIT_HANDY='ffd20:race:loporrit:pool:handy-selection';
const YAGUDO='ffd20:race:yagudo';
export const YAGUDO_RANK_LANGUAGES=YAGUDO+':pool:valiant-linguist-rank-languages';
export const YAGUDO_LINGUISTICS_ROW=27;
export const YAGUDO_RELIGION_ROW=25;
export const GUADO_ELEMENT='ffd20:race:guado:pool:summoner-element';
export const VIERA_ELEMENT='ffd20:race:viera:pool:elemental-summoner-subtype';
export const IXAL_ELEMENT='ffd20:race:ixal:pool:elemental-summoner-selection';
export const IXAL_TERRAIN='ffd20:race:ixal:pool:bond-to-the-ice-selection';
export const LAMIA_TERRAIN='ffd20:race:lamia:pool:bond-to-the-land-selection';
export const LAMIA_TEMPERED='ffd20:race:lamia:pool:tempered-selection';
const elementalSummonerPools=new Set([GUADO_ELEMENT,VIERA_ELEMENT,IXAL_ELEMENT]);
const terrainPools=new Set([IXAL_TERRAIN,LAMIA_TERRAIN]);
export const NU_MOU_SAGACIOUS='ffd20:race:nu-mou:pool:sagacious-two-knowledge';
export const PUPU_TECH_SAVANT='ffd20:race:pupu:pool:technological-savant-specialty';
export const GRIA_WEAPON='ffd20:race:gria:pool:weapon-focus-weapon';
export const NAMAZU_FOCUS='ffd20:race:namazu:pool:focused-study-selection';
export const NAMAZU_FOCUS_LEVELS=[1,8,16];
export const namazuFocusSlot=level=>NAMAZU_FOCUS+':level-'+level;
const GRIA='ffd20:race:gria',NAMAZU='ffd20:race:namazu';
const HALF='ffd20:race:half-breed';
export const HALF_ANCESTRAL_SLOT=HALF+':pool:ancestral-arms-selected-slot';
const ELVAAN_WEAPON='ffd20:race:elvaan:pool:martial-background-weapon';
const ELVAAN_LANGUAGES='ffd20:race:elvaan:pool:high-intelligence-bonus-languages';
const GALKA_LANGUAGES='ffd20:race:galka:pool:high-intelligence-bonus-languages';
const supported=new Set([SHINDROID_SIMULATED_RACE,YAGUDO_RANK_LANGUAGES,...elementalSummonerPools,...terrainPools,LAMIA_TEMPERED,GRIA_WEAPON,...NAMAZU_FOCUS_LEVELS.map(namazuFocusSlot),ORC_SKILL,MATANGA_ACADEMIC,LOPORRIT_HANDY,NU_MOU_SAGACIOUS,PUPU_TECH_SAVANT,...mutantScorePools,...extraLanguageRacePools.keys(),LAMBKIN_LANGUAGES,LAMBKIN_POLYGLOT_LANGUAGE,QUADAV_TERRAIN,SYRICTA_ELEMENT,SYRICTA_BREATH,HALF_ANCESTRAL_SLOT,DWARF_LANGUAGES,GARLEAN_LANGUAGES,GARLEAN_WEAPON,GARLEAN_CRAFT,GARIF_LANGUAGES,GARIF_TERRAIN,GARIF_PASTORALIST,DRACOBALTIAN_LANGUAGES,BURMECIAN_LANGUAGES,BEASTKIN_LANGUAGES,BANGAA_LANGUAGES,AU_RA_LANGUAGES,AL_BHED_LANGUAGES,AL_BHED_GENIUS,AEGYL_LANGUAGES,TARUTARU_LANGUAGES,TARUTARU_TALENTED,MITHRA_LANGUAGES,HUME_SCORE,HUME_LANGUAGES,GALKA_LANGUAGES,HANDY,MOOGLE_LANGUAGES,ELVAAN_WEAPON,ELVAAN_LANGUAGES,IMMORTAL+'flexible-score',IMMORTAL+'long-lived-knowledge',IMMORTAL+'bonus-languages']);
export const supportsRacialPool=id=>supported.has(id);
// An alternate with a resolved whole-trait replacement may leave a situational,
// descriptive or player-recorded choice manual. Only choices driving a concrete
// ability-score vector require a structured wizard before safe automation.
export function replacementRequiresWizard(race,feature){
 if(!feature)return false;
 return (feature.choicePoolIds||[]).some(id=>{
  if(supportsRacialPool(id))return false;
  const pool=race.choicePools.find(p=>p.id===id);
  if(!pool)return true; // unknown choice semantics, not a safe manual-only assumption
  const grantsAbilityScore=(pool.options||[]).some(option=>
   (option.featureIds||[]).some(fid=>race.features.find(f=>f.id===fid)?.effects?.some(e=>e.kind==='ability_score')));
  return grantsAbilityScore||(/(?:ability|score)\b/i.test(pool.name)&&pool.choiceType!=='language')||
    feature.effects?.some(e=>e.kind==='ability_score'&&e.automation==='automatic');
 });
}

const skillId=row=>'skill:'+row.name.toLowerCase().replace('knw: ','knowledge-').replaceAll(' ','-');

// Some source definitions use older extraction target names. Keep the
// source records intact and append only their verified unconditional sheet maps.
export function mappedRaceTraits(race,traits){
 const holo=race.id===SHINDROID&&traits.some(t=>t.id===SHINDROID_HOLOGRAM);
 const sourceVector=race.features.find(f=>f.id===SHINDROID+':trait:ability-score-racial-traits')?.effects||[];
 const standardVectorOK=sourceVector.filter(e=>e.kind==='ability_score'&&e.automation==='automatic')
  .map(e=>[e.target,e.value?.value]);
 const expected=[['ability_scores.dex',2],['ability_scores.int',2],['ability_scores.cha',-2]];
 const verifiedHolo=expected.every(([k,v])=>standardVectorOK.some(([a,b])=>a===k&&b===v))&&
  standardVectorOK.length===3;

 if(![...['genome','gria','guado','hypello','mandragora'].map(slug=>'ffd20:race:'+slug),SYRICTA,LAMBKIN_ID,'ffd20:race:moomba','ffd20:race:shindroid','ffd20:race:moogle','ffd20:race:immortal',HUME_ID,MITHRA_ID,TARUTARU_ID,AEGYL_ID,AL_BHED_ID,AU_RA_ID,BANGAA_ID,BURMECIAN_ID,DRACOBALTIAN_ID,GARIF_ID,GARLEAN_ID].includes(race.id))return traits;
 return traits.map(f=>{
  const mapped=[];
  const add=(e,target,value=e.value,textValue=e.textValue)=>mapped.push({...e,id:e.id+':sheet:'+mapped.length,target,value,textValue,automation:'automatic'});
  for(const e of f.effects||[]){
   if(e.condition)continue;
   if(e.automation==='automatic'&&e.kind==='skill_bonus'&&/^skills\.[a-z_-]+$/.test(e.target))add(e,'skills.skill:'+e.target.slice(7).replaceAll('_','-')+'.bonus');
   if(race.id===LAMBKIN_ID&&f.id===LAMBKIN_ID+':trait:size'&&e.target==='skills.stealth'&&
    e.kind==='skill_bonus'&&e.value?.kind==='constant'&&e.value.value===4)
    add(e,'skills.skill:stealth.bonus');
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
  if(race.id==='ffd20:race:moomba'&&f.id==='ffd20:race:moomba:trait:climb'&&
   f.effects?.some(e=>e.target==='identity.speed.climb'&&e.value?.value===20))
   mapped.push({id:f.id+':sheet:climb-speed-skill',kind:'skill_bonus',target:'skills.skill:climb.bonus',
    operation:'add',value:{kind:'constant',value:8},bonusType:'racial',condition:null,automation:'automatic'});
  if(race.id==='ffd20:race:shindroid'&&f.id==='ffd20:race:shindroid:trait:anomaly')
   for(const name of ['bluff','sense-motive'])mapped.push({
    id:f.id+':sheet:class-skill:'+name,kind:'class_skill',target:'skills.skill:'+name+'.class_skill',
    operation:'add',value:{kind:'constant',value:1},bonusType:'racial',condition:null,automation:'automatic'});
  if(race.id===SYRICTA&&f.id===SYRICTA+':trait:wing-clipped')
   for(const skill of ['bluff','climb','diplomacy'])mapped.push({
    id:f.id+':sheet:'+skill,kind:'skill_bonus',target:'skills.skill:'+skill+'.bonus',operation:'add',
    value:{kind:'constant',value:2},bonusType:'racial',condition:null,automation:'automatic'});
  if((race.id===TARUTARU_ID&&f.id===POLYGLOT)||(race.id===LAMBKIN_ID&&f.id===LAMBKIN_POLYGLOT))
   mapped.push({id:f.id+':sheet:linguistics-class-skill',kind:'class_skill',target:'skills.skill:linguistics.class_skill',operation:'add',value:{kind:'constant',value:1},bonusType:'racial',condition:null,automation:'automatic'});
  if(race.id===GARLEAN_ID&&f.id===GARLEAN_ID+':trait:noble-upbringing')for(const [row,label] of [[20,'history'],[23,'nobility']])mapped.push({id:f.id+':sheet:class-skill:'+label,kind:'class_skill',target:'skills.row.'+row+'.class_skill',operation:'add',value:{kind:'constant',value:1},bonusType:null,condition:null,automation:'automatic'});
  if(race.id===GRIA&&f.id===GRIA+':trait:weapon-familiarity')
   for(const name of ['Knight sword','Longbow','Composite longbow'])mapped.push({
    id:f.id+':sheet:weapon:'+name.toLowerCase().replaceAll(' ','-'),kind:'proficiency',
    target:'proficiencies.weapon.'+name.toLowerCase().replaceAll(' ','-'),
    operation:'grant',value:null,textValue:name,bonusType:null,condition:null,automation:'automatic'});
  if(race.id===GARIF_ID&&f.id===GARIF_ID+':trait:weapon-familiarity')for(const name of ['Longspear','Shortspear','Javelin','Boar spear'])mapped.push({id:f.id+':sheet:weapon:'+name.toLowerCase().replaceAll(' ','-'),kind:'proficiency',target:'proficiencies.weapon.'+name.toLowerCase().replaceAll(' ','-'),operation:'grant',value:null,textValue:name,bonusType:null,condition:null,automation:'automatic'});
  let result=mapped.length?{...f,effects:[...f.effects,...mapped]}:f;
  if(holo&&verifiedHolo){
   const id=f.id,automatic=(suffix,kind,target,value,textValue)=>({
    id:id+':hologram:'+suffix,kind,target,operation:kind==='identity'?'set':'add',
    value:value==null?null:{kind:'constant',value},textValue:textValue??null,
    condition:null,automation:'automatic',bonusType:null});
   if(id===SHINDROID_HOLOGRAM)result={...result,
    description:'Natural core: Diminutive construct (technological subtype). Only mental actions or full-round projection while unprojected. Hardlight body takes a full-round action to activate, remains indefinitely, and can be deactivated with a standard action (automatically upon death). Hardlight body can act physically, has two arms and 30 ft movement; its size comes from its programmed appearance and must be entered/adjudicated manually. Ability bonuses are +4 INT, -2 WIS, replacing the standard +2 DEX/+2 INT/-2 CHA. The sheet shows core size/type; hardlight mode and its size modifiers are not automatically switched.',
    effects:[automatic('int','ability_score','ability_scores.int',4),automatic('wis','ability_score','ability_scores.wis',-2)]};
   if(id===SHINDROID+':trait:size')result={...result,
    description:'Hologram natural core is Diminutive. Hardlight body size depends on the programmed appearance and is manual, not assumed Diminutive.',
    effects:[automatic('core-size','identity','identity.size_category',null,'Diminutive')]};
   if(id===SHINDROID+':trait:type')result={...result,
    description:'Hologram natural core is a construct with the technological subtype. Do not also grant default constructed-humanoid dual-targeting.',
    effects:[automatic('core-type','identity','identity.type',null,'Construct'),
      {...automatic('tech-subtype','identity','identity.subtypes',null,'technological'),operation:'grant'}]};
   if(id===SHINDROID+':trait:base-speed')result={...result,
    description:'Core cannot take physical actions; projected hardlight body moves 30 ft. Base speed of hardlight form is applied manually; core form does not inherit a permanent 30 ft movement speed.',
    effects:(result.effects||[]).filter(e=>!['identity.speed.land','speed.land'].includes(e.target))};
  }
  return result;
 });
}

export function racialChoiceSpecs(race,traits,level=1,b=null){
 if(!race)return [];
 const active=new Set(traits.flatMap(t=>t.choicePoolIds||[]));
 // Legacy Dwarf's extracted language trait predates choice-pool links. Keep
 // canonical source unchanged; expose its existing list only while trait active.
 if(race.id===DWARF_ID&&traits.some(f=>f.id===DWARF_ID+':feature:languages'))active.add(DWARF_LANGUAGES);
 const specs=race.choicePools.filter(p=>active.has(p.id)&&supported.has(p.id)).map(pool=>{
  if(pool.id===GRIA_WEAPON)return {...pool,minimum:1,maximum:1,
   options:traits.some(f=>f.id===GRIA+':trait:weapon-familiarity')?
    ['Knight sword','Longbow','Composite longbow'].filter(name=>traits.some(f=>f.effects.some(e=>
     e.automation==='automatic'&&e.target==='proficiencies.weapon.'+name.toLowerCase().replaceAll(' ','-'))))
    .map(name=>({id:pool.id+':option:'+name.toLowerCase().replaceAll(' ','-'),name,value:name})):[]};
  if(pool.id===NU_MOU_SAGACIOUS)return {...pool,minimum:2,maximum:2,
   options:fixedSkills.flatMap((row,i)=>row.name.startsWith('Knw: ')?
    [{id:'skill-row:'+i,name:row.name,value:i}]:[])};
  if(pool.id===PUPU_TECH_SAVANT)return {...pool,minimum:1,maximum:1};
  if(elementalSummonerPools.has(pool.id)||terrainPools.has(pool.id)||pool.id===LAMIA_TEMPERED)
   return {...pool,minimum:1,maximum:1};
  if(pool.id===ORC_SKILL)return {...pool,minimum:1,maximum:1};
  if(pool.id===MATANGA_ACADEMIC)return {...pool,minimum:1,maximum:1,
   options:fixedSkills.flatMap((row,i)=>row.name.startsWith('Knw: ')?[{id:'skill-row:'+i,name:row.name,value:i}]:[])};
  if(pool.id===LOPORRIT_HANDY)return {...pool,minimum:1,maximum:1,specialty:true,
   options:fixedSkills.flatMap((row,i)=>['Craft','Profession'].includes(row.name)?
    [{id:'skill-row:'+i,name:row.name+' '+(fixedSkills.slice(0,i).filter(x=>x.name===row.name).length+1),value:i}]:[])};
  if(pool.id===GENOME+':pool:bonus-languages')return {...pool,minimum:0,maximum:null,freeText:true};
   if([PALICO_START,KINDRED_START].includes(pool.id))return {...pool,choiceType:'language',minimum:1,maximum:1};
   if(pool.id===HALF_ANCESTRAL_SLOT)return {...pool,minimum:1,maximum:1,options:[
    {id:pool.id+':option:feat-and-skill',name:'Replace inherited Feat and Skill slot',value:'feat-and-skill'},
    {id:pool.id+':option:offense',name:'Replace inherited Offense slot',value:'offense'}]};
  if([SYRICTA_ELEMENT,SYRICTA_BREATH].includes(pool.id))return {...pool,minimum:1,maximum:1};
  if(pool.id===GARLEAN_WEAPON)return {...pool,minimum:1,maximum:1,options:pool.options.filter(o=>o.value==='firearms-simple')};
  if(pool.id===GARLEAN_CRAFT)return {...pool,minimum:1,maximum:1,specialty:true,options:fixedSkills.flatMap((row,i)=>row.name==='Craft'?[{id:'skill-row:'+i,name:'Craft '+(i-3),value:i}]:[])};
  if(pool.id===GARIF_PASTORALIST)return {...pool,minimum:1,maximum:1,specialty:true,specialtyRequiredFor:[4,5,6,34,35,36].map(i=>'skill-row:'+i),options:fixedSkills.flatMap((row,i)=>[4,5,6,22,34,35,36,43].includes(i)?[{id:'skill-row:'+i,name:['Craft','Profession'].includes(row.name)?row.name+' '+(fixedSkills.slice(0,i).filter(r=>r.name===row.name).length+1):row.name,value:i}]:[])};
  if([GARIF_TERRAIN,QUADAV_TERRAIN].includes(pool.id))return {...pool,minimum:1,maximum:1};
  if(pool.id===AL_BHED_GENIUS)return {...pool,minimum:1,maximum:1,specialty:true,specialtyRequiredFor:[4,5,6].map(i=>'skill-row:'+i),options:fixedSkills.flatMap((row,i)=>[4,5,6,8,18,34,35,36,45].includes(i)?[{id:'skill-row:'+i,name:row.name==='Profession'?'Profession (engineering) '+(i-33):row.name==='Craft'?'Craft '+(i-3):row.name,value:i}]:[])};
  if([HANDY,TARUTARU_TALENTED].includes(pool.id))return {...pool,minimum:1,maximum:1,specialty:true,options:fixedSkills.flatMap((row,i)=>['Craft','Profession'].includes(row.name)?[{id:'skill-row:'+i,name:row.name+' '+(fixedSkills.slice(0,i).filter(r=>r.name===row.name).length+1),value:i}]:[])};
  if(pool.id===IMMORTAL+'long-lived-knowledge')return {...pool,minimum:0,maximum:4,options:fixedSkills.filter(row=>row.name.startsWith('Knw: ')).map(row=>({id:skillId(row),name:row.name,value:skillId(row)}))};
  if(pool.id===ELVAAN_WEAPON)return {...pool,minimum:1,maximum:1,options:pool.options.filter(o=>traits.some(f=>f.effects.some(e=>e.automation==='automatic'&&!e.condition&&e.target==='proficiencies.weapon.'+o.value)))};
  if(pool.id===HUME_LANGUAGES)return {...pool,minimum:0,maximum:null,freeText:true};
  if(pool.id===LAMBKIN_POLYGLOT_LANGUAGE)return {...pool,name:'Polyglot starting language',minimum:1,maximum:1,freeText:true};
  return {...pool,minimum:pool.choiceType==='language'?0:1,maximum:pool.choiceType==='language'?null:1};
 });
 if(race.id===SHINDROID&&traits.some(f=>f.id===SHINDROID+':trait:race-simulation')){
  specs.push({id:SHINDROID_SIMULATED_RACE,name:'Race Simulation · playable humanoid race',
   choiceType:'race_trait_option',options:shindroidSimulationOptions(),minimum:1,maximum:1});
 }
 // The source grants two independently selected languages per Linguistics rank,
 // not a fixed list or an extra language per character level. No guessed picks.
 if(race.id===YAGUDO&&traits.some(f=>f.id===YAGUDO+':trait:valiant-linguist')){
  const ranks=Math.max(0,Math.min(20,Number(b?.skillRanks?.[YAGUDO_LINGUISTICS_ROW])||0));
  specs.push({id:YAGUDO_RANK_LANGUAGES,name:'Valiant Linguist · languages from Linguistics ranks',
   choiceType:'language',freeText:true,options:[],minimum:0,maximum:2*ranks});
 }
 // One immutable Skill Focus selection unlocks at each Namazu milestone.
 if(race.id===NAMAZU&&traits.some(f=>f.id===NAMAZU+':trait:focused-study')){
  for(const at of NAMAZU_FOCUS_LEVELS.filter(n=>n<=level)){
   specs.push({id:namazuFocusSlot(at),name:'Focused Study · level '+at,choiceType:'race_trait_option',
    options:fixedSkills.map((row,i)=>({id:'skill-row:'+i,
     name:row.name+(['Craft','Profession','Perform'].includes(row.name)?
       ' '+(fixedSkills.slice(0,i).filter(r=>r.name===row.name).length+1):''),value:i})),
    minimum:1,maximum:1});
  }
 }
 // The official Palico/Kindred high-INT language lists were not staged as pools.
  // Expose the verified list only while the source Languages trait is active.
  if([PALICO,KINDRED].includes(race.id)&&traits.some(t=>t.id===race.id+':trait:languages')){
   const slug=race.id.split(':').at(-1),id=languageBonusId(race.id);
   specs.push({id,name:'Bonus languages',choiceType:'language',options:optionalLangs[slug].map(name=>({
    id:id+':option:'+name.toLowerCase().replace(/\s+/g,'-'),name,value:name.toLowerCase().replace(/\s+/g,'-')
   })),minimum:0,maximum:null});
  }
  if(race.id===SYRICTA&&traits.some(f=>f.id===SYRICTA+':trait:memories-of-the-forgotten'))
   specs.push({id:SYRICTA_MEMORIES,name:'Memories of the Forgotten: two Knowledge skills',choiceType:'race_trait_option',
    options:fixedSkills.flatMap((row,i)=>row.name.startsWith('Knw: ')?[{id:'skill-row:'+i,name:row.name,value:i}]:[]),
    minimum:2,maximum:2});
 // The seven high-INT bonus languages are unchanged; one unrestricted extra
 // language is a separate required slot on the existing Ability Scores step.
 if(race.id===TARUTARU_ID&&traits.some(f=>f.id===POLYGLOT))
  specs.push({id:TARUTARU_POLYGLOT_LANGUAGE,name:'Polyglot starting language',choiceType:'language',freeText:true,options:[],minimum:1,maximum:1});
 return specs;
}

export function racialChoiceEffects(b,race,traits){
 const effects=[];
 for(const spec of racialChoiceSpecs(race,traits,buildLevel(b),b)){
  const selected=b.racialChoices?.[spec.id]||[];
  const options=spec.freeText?selected.filter(validLanguageChoice).map(id=>({id,name:languageName(id),value:languageName(id).toLowerCase().replace(/\s+/g,'-')})):selected.map(id=>spec.options.find(o=>o.id===id)).filter(Boolean);
  for(const option of options){
   const base={id:spec.id+':selected:'+option.id,operation:'add',automation:'automatic',condition:null,bonusType:'racial'};
   if([SYRICTA_ELEMENT,SYRICTA_BREATH].includes(spec.id))
    effects.push({...base,kind:'custom',target:'race.syricta.'+(spec.id===SYRICTA_ELEMENT?'elemental-resistance':'breath-shape'),
     textValue:spec.id===SYRICTA_ELEMENT?'Chosen resistance '+option.name+': 5 (manual application)':
      'Chosen breath weapon shape: '+option.name+'; 3/day, scales by character level (manual damage/uses)',
     automation:'manual'});
   if(spec.id===SYRICTA_MEMORIES&&Number.isInteger(option.value)){
     effects.push({...base,kind:'skill_bonus',target:'skills.row.'+option.value+'.bonus',value:{kind:'constant',value:2}});
     effects.push({...base,id:base.id+':class-skill',kind:'class_skill',target:'skills.row.'+option.value+'.class_skill',value:{kind:'constant',value:1}});
    }
    if(spec.id===HALF_ANCESTRAL_SLOT)effects.push({...base,kind:'custom',target:'race.half-breed.ancestral-arms-slot',
    textValue:'Ancestral Arms replaces '+(option.value==='offense'?'Offense':'Feat and Skill')+' slot only. Weapon proficiency type and weapon must still be chosen with verified parent race rules.',
    automation:'manual'});
   if(elementalSummonerPools.has(spec.id))
    effects.push({...base,kind:'custom',target:'race.elemental-summoner.subtype',textValue:
     'Selected '+option.name+' elemental subtype: summon spells creating a creature with that subtype last +2 rounds. Applies only to matching summons; manual spell-duration adjudication and retraining to change.',
     automation:'manual'});
   if(terrainPools.has(spec.id))
    effects.push({...base,kind:'custom',target:'race.terrain.bond',textValue:
     'Chosen '+option.name+' terrain: +2 dodge AC only while in this terrain. No permanent AC bonus; apply manually.',
     automation:'manual'});
   if(spec.id===LAMIA_TEMPERED)
    effects.push({...base,kind:'custom',target:'race.lamia.tempered-resistance',textValue:
     'Chosen '+option.name+' resistance 5 (not both Water and Wind). Apply matching elemental damage resistance manually.',
     automation:'manual'});
   if(spec.id===ORC_SKILL){
    if(option.value==='2-acrobatics')
     effects.push({...base,kind:'skill_bonus',target:'skills.row.0.bonus',value:{kind:'constant',value:2}});
    if(option.value==='1-climb-and-jump'){
     effects.push({...base,kind:'skill_bonus',target:'skills.row.3.bonus',value:{kind:'constant',value:1}});
     effects.push({...base,id:base.id+':jump',kind:'custom',target:'race.orc.jump',
      textValue:'+1 to Acrobatics checks made to jump only; do not add to all Acrobatics checks.',automation:'manual'});
    }
   }
   if(spec.id===NU_MOU_SAGACIOUS&&Number.isInteger(option.value)){
    effects.push({...base,kind:'skill_bonus',target:'skills.row.'+option.value+'.bonus',value:{kind:'constant',value:2}});
    effects.push({...base,id:base.id+':class-skill',kind:'class_skill',target:'skills.row.'+option.value+'.class_skill',value:{kind:'constant',value:1}});
   }
   if(spec.id===PUPU_TECH_SAVANT){
    const target=option.value==='knowledge-technology'?26:option.value==='knowledge-engineering'?18:null;
    if(target!==null)effects.push({...base,kind:'skill_bonus',target:'skills.row.'+target+'.bonus',value:{kind:'constant',value:2}});
   }
   if(spec.id===MATANGA_ACADEMIC&&Number.isInteger(option.value)){
    effects.push({...base,kind:'skill_bonus',target:'skills.row.'+option.value+'.bonus',value:{kind:'constant',value:2}});
    effects.push({...base,id:base.id+':class-skill',kind:'class_skill',target:'skills.row.'+option.value+'.class_skill',value:{kind:'constant',value:1}});
   }
   if(spec.id===LOPORRIT_HANDY&&Number.isInteger(option.value))
    effects.push({...base,kind:'skill_bonus',target:'skills.row.'+option.value+'.bonus',value:{kind:'constant',value:2},
     specialty:b.racialSpecialties?.[spec.id]||''});
   if(spec.id===SHINDROID_SIMULATED_RACE){
    effects.push({...base,id:base.id+':size',kind:'identity',operation:'set',
     target:'identity.size_category',textValue:option.size,value:null,bonusType:null});
    effects.push({...base,id:base.id+':race',kind:'custom',target:'race.shindroid.simulated-humanoid',
     textValue:'Race Simulation: counts as Shindroid and '+option.name+
      ' for race-related traits, feats, spells and magic items. Size is '+option.size+
      '. Ages as '+option.name+' with its source age benefits and penalties (manual); does not gain the race’s unrelated traits, ability-score adjustments or languages.',
     automation:'manual'});
   }
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
    if(mutantScorePools.has(spec.id)){
    const key=option.value,delta=spec.id===MUTANT_PENALTY?-2:2;
    if(['str','dex','con','int','wis','cha'].includes(key))
     effects.push({...base,kind:'ability_score',target:'ability_scores.'+key,value:{kind:'constant',value:delta}});
   }
  if([IMMORTAL+'flexible-score',HUME_SCORE].includes(spec.id)){
    const key={strength:'str',dexterity:'dex',constitution:'con',intelligence:'int',wisdom:'wis',charisma:'cha'}[option.value];
    if(key)effects.push({...base,kind:'ability_score',target:'ability_scores.'+key,value:{kind:'constant',value:2}});
   }
   if(spec.id===IMMORTAL+'long-lived-knowledge')effects.push({...base,kind:'class_skill',target:'skills.'+option.value+'.class_skill',value:{kind:'constant',value:1}});
   if(spec.choiceType==='language')effects.push({...base,kind:'language',target:'identity.languages.'+option.value,textValue:option.name});
  }
 }
 if(race?.id===YAGUDO&&traits.some(f=>f.id===YAGUDO+':trait:zealot-devotee')){
  const ranks=Number(b.skillRanks?.[YAGUDO_RELIGION_ROW])||0;
  const extra=Math.floor(Math.max(0,ranks)/5);
  if(extra>0)effects.push({id:YAGUDO+':trait:zealot-devotee:rank-scaling',
   kind:'skill_bonus',target:'skills.row.'+YAGUDO_RELIGION_ROW+'.bonus',
   operation:'add',value:{kind:'constant',value:extra},bonusType:'racial',
   condition:null,automation:'automatic'});
 }
 return effects;
}

export function racialChoiceIssues(b,race,traits,scores){
 const errors=[],specs=racialChoiceSpecs(race,traits,buildLevel(b),b),byId=new Map(specs.map(s=>[s.id,s]));
 for(const [id,values] of Object.entries(b.racialChoices||{})){
  const spec=byId.get(id);
  if(!spec||!Array.isArray(values)){errors.push('Unknown or inactive racial choice.');continue;}
  const identities=spec.freeText?values.map(v=>languageName(v).toLowerCase()):values;
  if(new Set(identities).size!==values.length||values.some(v=>spec.freeText?!validLanguageChoice(v):!spec.options.some(o=>o.id===v)))errors.push('Invalid or duplicate '+spec.name+' selection.');
 }
 if(race?.id===YAGUDO&&byId.has(YAGUDO_RANK_LANGUAGES)){
  const choices=b.racialChoices?.[YAGUDO_RANK_LANGUAGES]||[];
  if(choices.some(id=>['common','yagudo'].includes(languageName(id).trim().toLowerCase())))
   errors.push('Yagudo already starts with Common and Yagudo; rank languages must be new.');
 }
 // A starting language is not also a valid high-INT bonus-language pick.
  if([PALICO,KINDRED].includes(race?.id)){
   const startingPool=race.id===PALICO?PALICO_START:KINDRED_START;
   const chosen=byId.get(startingPool)?.options.find(o=>o.id===b.racialChoices?.[startingPool]?.[0])?.name?.toLowerCase();
   const bonusPool=byId.get(languageBonusId(race.id));
   if(chosen&&(b.racialChoices?.[bonusPool?.id]||[]).some(id=>bonusPool.options.find(o=>o.id===id)?.name?.toLowerCase()===chosen))
    errors.push('The chosen starting language cannot be selected again as a bonus language.');
  }
  if(race?.id===GENOME&&byId.has(GENOME+':pool:bonus-languages')&&
    (b.racialChoices?.[GENOME+':pool:bonus-languages']||[]).some(v=>languageName(v).toLowerCase()==='common'))
    errors.push('Genome already starts with Common; bonus languages must be different.');
  for(const [raceId,polyglotId,normalId,starting] of [
  [TARUTARU_ID,TARUTARU_POLYGLOT_LANGUAGE,TARUTARU_LANGUAGES,'lalafellan'],
  [LAMBKIN_ID,LAMBKIN_POLYGLOT_LANGUAGE,LAMBKIN_LANGUAGES,'lambkin']
 ])if(race?.id===raceId&&byId.has(polyglotId)){
  const extra=languageName(b.racialChoices?.[polyglotId]?.[0]).toLowerCase();
  const standardPool=byId.get(normalId);
  const normal=new Set((b.racialChoices?.[normalId]||[]).map(id=>standardPool?.options.find(o=>o.id===id)?.name?.toLowerCase()).filter(Boolean));
  if(extra===starting||normal.has(extra))errors.push('Polyglot extra language must be different from starting languages and selected bonus languages.');
 }
 if(race?.id===NAMAZU&&traits.some(f=>f.id===NAMAZU+':trait:focused-study')){
  const chosen=NAMAZU_FOCUS_LEVELS.filter(n=>n<=buildLevel(b)).map(n=>b.racialChoices?.[namazuFocusSlot(n)]?.[0]).filter(Boolean);
  if(new Set(chosen).size!==chosen.length)errors.push('Focused Study must choose a different skill at each milestone.');
 }
 for(const spec of specs){
  if(spec.id===GRIA_WEAPON&&!spec.options.length)errors.push('Gria Martial Background needs a verified proficient weapon. Keep Weapon Familiarity enabled until class-based proficiency selections are supported.');
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
 if(b.raceId===GRIA&&traits.some(f=>f.id===GRIA+':trait:martial-background')){
  const spec=racialChoiceSpecs(race,traits,buildLevel(b)).find(x=>x.id===GRIA_WEAPON);
  const weapon=spec?.options.find(o=>o.id===b.racialChoices?.[GRIA_WEAPON]?.[0])?.value;
  if(!weapon)return [];
  const id=GRIA+':bonus-feat:weapon-focus',name='Weapon Focus ('+weapon+')',old=previous.feats?.find(x=>x.sourceRuleId===id);
  const desc='Granted by Gria Martial Background at character level 1 for the chosen proficient '+weapon+'. Apply the Weapon Focus attack benefit manually to qualifying attacks.';
  return [{...old,name:old?.rulesName&&old.name!==old.rulesName?old.name:name,
   desc:old?.rulesDescription&&old.desc!==old.rulesDescription?old.desc:desc,rulesName:name,rulesDescription:desc,
   sourceRuleId:id,sourceRace:'Gria',rulesOwned:true,pendingFeat:false,automation:'manual'}];
 }
 if(b.raceId===NAMAZU&&traits.some(f=>f.id===NAMAZU+':trait:focused-study')){
  return NAMAZU_FOCUS_LEVELS.filter(n=>n<=buildLevel(b)).flatMap(n=>{
   const selected=b.racialChoices?.[namazuFocusSlot(n)]?.[0],index=Number(selected?.split(':').at(-1));
   if(!selected||!Number.isInteger(index)||index<0||index>=fixedSkills.length)return [];
   const skill=fixedSkills[index],label=skill.name+(['Craft','Profession','Perform'].includes(skill.name)?
    ' '+(fixedSkills.slice(0,index).filter(r=>r.name===skill.name).length+1):'');
   const id=NAMAZU+':bonus-feat:skill-focus:'+n,name='Skill Focus ('+label+')';
   const old=previous.feats?.find(x=>x.sourceRuleId===id);
   const desc='Granted by Namazu Focused Study at character level '+n+' for '+label+'. Apply Skill Focus (+3, or +6 with 10 ranks) to its qualifying skill checks manually.';
   return [{...old,name:old?.rulesName&&old.name!==old.rulesName?old.name:name,
    desc:old?.rulesDescription&&old.desc!==old.rulesDescription?old.desc:desc,rulesName:name,rulesDescription:desc,
    sourceRuleId:id,sourceRace:'Namazu',rulesOwned:true,pendingFeat:false,automation:'manual'}];
  });
 }
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
 const specs=racialChoiceSpecs(race,traits,buildLevel(b),b),active=new Set(specs.map(s=>s.id));
 b.racialChoices=Object.fromEntries(Object.entries(b.racialChoices||{}).filter(([id])=>active.has(id)));
 b.racialSpecialties=Object.fromEntries(Object.entries(b.racialSpecialties||{}).filter(([id])=>specs.some(s=>s.id===id&&s.specialty)));
}
