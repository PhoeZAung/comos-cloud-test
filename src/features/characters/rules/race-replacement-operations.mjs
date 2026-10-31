// Runtime-only rule reconciliation. Do not edit the extracted source definitions.
// Whitelist precisely verified component modifications; all other partial or
// source-unresolved operations remain blocked for independent review.
const AEGYL='ffd20:race:aegyl';
const WING_CLIPPED=AEGYL+':trait:wing-clipped';
const AEGYL_SPEED=AEGYL+':trait:base-speed';
const WING_FLIGHT_MODIFIER=WING_CLIPPED+':flight-modifier';
const ALBHED='ffd20:race:al-bhed',SYRICTA='ffd20:race:syricta',HALF='ffd20:race:half-breed';
const ALBHED_X=ALBHED+':trait:xenophobic',SYRICTA_W=SYRICTA+':trait:wing-clipped',
 SYRICTA_N=SYRICTA+':trait:neglected-heritage',HALF_A=HALF+':trait:ancestral-arms';
const sr=(race,slug)=>race?.features?.find(f=>f.id===race.id+':trait:'+slug);
const baseSpeed=(race,land,fly)=>sr(race,'base-speed')?.effects?.filter(e=>
 e.automation==='automatic'&&e.kind==='identity'&&e.value?.kind==='constant'&&!e.condition)
 .some(e=>e.target==='identity.speed.land'&&e.value.value===land)&&
 sr(race,'base-speed')?.effects?.some(e=>e.target==='identity.speed.fly'&&e.value?.value===fly);
const sourceScores=(race)=>[ ['str',2],['dex',-2],['cha',2] ].every(([key,n])=>
 sr(race,'ability-score-racial-traits')?.effects?.some(e=>e.kind==='ability_score'&&e.target==='ability_scores.'+key&&
 e.operation==='add'&&e.value?.kind==='constant'&&e.value.value===n&&e.automation==='automatic'&&!e.condition));
const sourceLang=(race,a,b)=>sr(race,'languages')?.effects?.some(e=>e.automation==='automatic'&&e.kind==='identity'&&
 e.target===a&&e.textValue===b);
const isExactScoped=(op,id,targets,adds)=>op?.id===id&&op.operation==='modify'&&op.scope==='part_of_feature'&&
 op.resolution==='manual'&&JSON.stringify(op.targetFeatureIds)===JSON.stringify(targets)&&
 JSON.stringify(op.addsFeatureIds)===JSON.stringify(adds)&&!(op.targetEventIds||[]).length&&
 !(op.addsEventIds||[]).length&&!(op.removesComponents||[]).length;
const newBatchModifier=(race,op)=>{
 if(race?.id===ALBHED){
  const ready=race.data.alternateReplacements.some(source=>source.id===ALBHED_X+':replacement'&&
   source.operation==='replace'&&source.scope==='whole_feature'&&source.resolution==='manual'&&
   JSON.stringify(source.targetFeatureIds)===JSON.stringify([ALBHED+':trait:languages'])&&
   JSON.stringify(source.addsFeatureIds)===JSON.stringify([ALBHED_X]));
  return isExactScoped(op,ALBHED_X+':language-modifier',[ALBHED+':trait:languages'],[ALBHED_X])&&ready;
 }
 if(race?.id===SYRICTA){
  const ready=sourceLang(race,'identity.languages.common','Common')&&
   sourceLang(race,'identity.languages.draconic','Draconic');
  if(isExactScoped(op,SYRICTA_N+':language-modifier',[SYRICTA+':trait:languages'],[SYRICTA_N])&&ready)return true;
  return isExactScoped(op,SYRICTA_W+':component-modifier',
   [SYRICTA+':trait:base-speed',SYRICTA+':trait:ability-score-racial-traits'],[SYRICTA_W])&&
   baseSpeed(race,20,40)&&sourceScores(race);
 }
 return false;
};
const isHalfSlot=(race,op)=>{
 if(race?.id!==HALF||!op)return false;
 const source=race.data.alternateReplacements.find(x=>x.id===HALF_A+':replacement');
 if(source?.operation!=='replace'||source.scope!=='whole_feature'||source.resolution!=='manual'||
  JSON.stringify(source.targetFeatureIds)!==JSON.stringify([HALF+':trait:feat-and-skill-trait-selection',HALF+':trait:offense-trait-selection'])||
  JSON.stringify(source.addsFeatureIds)!==JSON.stringify([HALF_A]))return false;
 const index=[HALF_A+':slot-feat-skill',HALF_A+':slot-offense'].indexOf(op.id);
 return index>=0&&op.operation==='replace'&&op.scope==='whole_feature'&&op.resolution==='manual'&&
  JSON.stringify(op.targetFeatureIds)===JSON.stringify([source.targetFeatureIds[index]])&&
  JSON.stringify(op.addsFeatureIds)===JSON.stringify([HALF_A])&&
  !(op.targetEventIds||[]).length&&!(op.addsEventIds||[]).length&&!(op.removesComponents||[]).length;
};
const TARUTARU='ffd20:race:tarutaru';
const POLYGLOT=TARUTARU+':trait:polyglot';
const TARUTARU_LANGUAGES=TARUTARU+':trait:languages';
const POLYGLOT_LANGUAGE_MODIFIER=POLYGLOT+':language-modifier';
const MOOGLE='ffd20:race:moogle';
const GROUNDED=MOOGLE+':trait:grounded';
const MOOGLE_BASE_SPEED=MOOGLE+':trait:base-speed';
const GROUNDED_MODIFIER=GROUNDED+':replacement';
const DWARF='ffd20:race:dwarf';
const SALTBEARD=DWARF+':feature:saltbeard';
const GREED=DWARF+':feature:greed';
const SALTBEARD_GREED=DWARF+':replacement:saltbeard-modifies-greed';
const isWholeTraitReplacement=(race,op)=>{
 if(!race||op.operation!=='replace'||op.scope!=='whole_feature')return false;
 if(race.id===HALF&&op.id===HALF_A+':replacement')return false; // old staged record erroneously consumed BOTH inherited slots
 if(race.id===HALF&&op.id.startsWith(HALF_A+':slot-'))return isHalfSlot(race,op); // never fall through to generic whole-feature rule
 if(op.resolution==='resolved')return true; // existing approved mappings remain intact
 if(op.resolution!=='manual'||!/(?:replac|substitut|supersed)/i.test(op.description||''))return false;
 // "Manual" can indicate an unautomated *benefit*, not an uncertain replacement.
 // Require complete and consistent source identities before exposing the swap.
 const targets=op.targetFeatureIds||[],adds=op.addsFeatureIds||[],std=new Set(race.data.standardTraitIds),features=new Set(race.features.map(f=>f.id));
 if(!targets.length||!adds.length||new Set(targets).size!==targets.length)return false;
 if(!targets.every(id=>std.has(id)&&features.has(id))||!adds.every(id=>features.has(id)))return false;
 if((op.targetEventIds||[]).length||(op.addsEventIds||[]).length||(op.removesComponents||[]).length)return false;
 // Replacing only identity-language or type records without an automatic
 // replacement would silently erase the character's actual race/languages.
 const prior= race.features.filter(f=>targets.includes(f.id)).flatMap(f=>f.effects||[]);
 const identityTargets=prior.filter(e=>e.automation==='automatic'&&e.kind==='identity'&&
   /(?:^identity\.(?:type|subtypes|languages)|^languages\.starting)/.test(e.target)).map(e=>e.target);
 if(identityTargets.length){
   const after=race.features.filter(f=>adds.includes(f.id)).flatMap(f=>f.effects||[]);
   if(!identityTargets.every(target=>after.some(e=>e.automation==='automatic'&&e.kind==='identity'&&
      e.target===target)))return false;
 }
 return true;
};
export const isSupportedRaceOperation=(race,op)=>
 isWholeTraitReplacement(race,op)||
 newBatchModifier(race,op)||
 isHalfSlot(race,op)||
 (race?.id===DWARF&&op.id===SALTBEARD_GREED&&op.operation==='modify'&&op.scope==='part_of_feature'&&op.resolution==='manual'&&
 op.targetFeatureIds?.length===1&&op.targetFeatureIds[0]===GREED&&op.addsFeatureIds?.length===1&&op.addsFeatureIds[0]===SALTBEARD)||
 (race?.id===AEGYL&&op.id===WING_FLIGHT_MODIFIER&&op.operation==='modify'&&op.scope==='part_of_feature'&&op.resolution==='manual'&&
 op.targetFeatureIds?.length===1&&op.targetFeatureIds[0]===AEGYL_SPEED&&!(op.addsFeatureIds||[]).length)||
 (race?.id===MOOGLE&&op.id===GROUNDED_MODIFIER&&op.operation==='modify'&&op.scope==='part_of_feature'&&op.resolution==='manual'&&
 op.targetFeatureIds?.length===1&&op.targetFeatureIds[0]===MOOGLE_BASE_SPEED&&
 op.addsFeatureIds?.length===1&&op.addsFeatureIds[0]===GROUNDED)||
 (race?.id===TARUTARU&&op.id===POLYGLOT_LANGUAGE_MODIFIER&&op.operation==='modify'&&op.scope==='part_of_feature'&&op.resolution==='manual'&&
 op.targetFeatureIds?.length===1&&op.targetFeatureIds[0]===TARUTARU_LANGUAGES&&!(op.addsFeatureIds||[]).length);

// A replacement-only heritage is safe to enable when all its affected ability
// score vectors already have exact automatic effects. Otherwise leaving the
// original vector disabled without its replacement would corrupt the sheet.
export function isSupportedRaceHeritage(race,heritage){
 if(!race||!heritage||!(heritage.replacements||[]).length||(heritage.choicePoolIds||[]).length)return false;
 if(!heritage.replacements.every(op=>isWholeTraitReplacement(race,op)))return false;
 const targets=new Set(heritage.replacements.flatMap(op=>op.targetFeatureIds||[]));
 const adds=new Set(heritage.replacements.flatMap(op=>op.addsFeatureIds||[]));
 if((heritage.featureIds||[]).some(id=>!adds.has(id)))return false;
 const scoreRemoved=race.features.filter(f=>targets.has(f.id)).some(f=>/(?:ability[-:]?scores?|racial[-:]?ability)/i.test(f.id+' '+f.name)||f.effects?.some(e=>e.kind==='ability_score'));
 if(!scoreRemoved)return true;
 const replacementEffects=race.features.filter(f=>adds.has(f.id)).flatMap(f=>f.effects||[]).filter(e=>e.kind==='ability_score');
 return replacementEffects.length>0&&replacementEffects.every(e=>
  e.automation==='automatic'&&!e.condition&&e.operation==='add'&&e.value?.kind==='constant'&&
  /^ability_scores\.(str|dex|con|int|wis|cha)$/.test(e.target)&&Number.isInteger(e.value.value));
}

export function applyRaceModification(race,feature,op){
 if(newBatchModifier(race,op)){
  if(race.id===ALBHED&&feature.id===ALBHED+':trait:languages')
   return {...feature,description:'Xenophobic: starts speaking Albhedian only, not Common; no high-Intelligence bonus languages. Gain one language per TWO Linguistics ranks instead of every rank; apply conditional +1 save against mind-affecting except fear manually.',
    choicePoolIds:[],
    effects:(feature.effects||[]).map(e=>e.target==='languages.starting'?{...e,textValue:'Albhedian'}:e)};
  if(race.id===SYRICTA&&feature.id===SYRICTA+':trait:languages')
   return {...feature,description:'Neglected Heritage: starts speaking Common only, not Draconic. Draconic is not a high-Intelligence bonus choice but can be learned with Linguistics. Conditional +1 Diplomacy to requests and gathering information must be applied manually.',
    effects:(feature.effects||[]).filter(e=>e.target!=='identity.languages.draconic')};
  if(race.id===SYRICTA&&feature.id===SYRICTA+':trait:base-speed')
   return {...feature,description:'Wing-Clipped: land speed 20 feet and fly speed 20 feet (clumsy maneuverability); DC 30 Fly check required to ascend.',
    effects:(feature.effects||[]).map(e=>e.target==='identity.speed.fly'?{...e,value:{...e.value,value:20}}:e)};
  if(race.id===SYRICTA&&feature.id===SYRICTA+':trait:ability-score-racial-traits')
   return {...feature,description:'+2 STR, +2 CHA; Wing-Clipped removes the normal -2 DEX penalty.',
    effects:(feature.effects||[]).filter(e=>e.target!=='ability_scores.dex')};
 }

 if(race?.id===TARUTARU&&feature?.id===TARUTARU_LANGUAGES&&op?.id===POLYGLOT_LANGUAGE_MODIFIER)
  return {...feature,description:'Polyglot: starts with Common, Lalafellan, and one freely chosen additional starting language; retains all normal high-Intelligence bonus languages (Draconic, Dwarven, Elvaan, Galkan, Giant, Goblin and Orc).'};

 if(race?.id===MOOGLE&&feature?.id===MOOGLE_BASE_SPEED&&op?.id===GROUNDED_MODIFIER){
  return {...feature,
   description:'Grounded: land speed remains 20 ft despite encumbrance, medium/heavy armor or similar speed reductions. Limited wing-assisted flight and its conditional +4 Acrobatics benefit are lost. The +1 racial saving throw bonus against effects reducing movement speed is situational; apply it when appropriate.',
   effects:(feature.effects||[]).filter(effect=>effect.target!=='speed.fly')};
 }
 if(race?.id===AEGYL&&feature?.id===AEGYL_SPEED&&op?.id===WING_FLIGHT_MODIFIER){
  return {...feature,
   description:'Land speed remains 30 ft; Wing-Clipped fly speed is 20 ft (poor maneuverability). Flying upward requires a DC 30 Fly check. Aegyl still need space to extend their wings.',
   effects:(feature.effects||[]).map(e=>e.target==='speed.fly'?{...e,textValue:'20 feet (poor maneuverability); DC 30 Fly check to ascend',automation:'manual'}:e)};
 }
 if(race?.id!==DWARF||feature?.id!==GREED||op?.id!==SALTBEARD_GREED) return feature;
 const condition='Only for Appraise checks on treasure found in or under water, regardless of whether the treasure contains metals or gemstones. The old valuable-metal/gemstone condition no longer applies on land.';
 return {...feature,
  description:'Saltbeard-modified Greed: +2 racial bonus on Appraise checks for treasure found in or under water, including treasure without precious metals or gemstones. The standard Greed condition no longer applies.',
  effects:(feature.effects||[]).map(effect=>effect.kind==='skill_bonus'&&effect.target==='skills.skill:appraise.bonus'?
   {...effect,condition:{type:'manual',description:condition},automation:'conditional'}:effect)};
}
