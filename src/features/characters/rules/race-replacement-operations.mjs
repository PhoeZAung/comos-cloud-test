// Runtime-only rule reconciliation. Do not edit the extracted source definitions.
// Whitelist precisely verified component modifications; all other partial or
// source-unresolved operations remain blocked for independent review.
const AEGYL='ffd20:race:aegyl';
const WING_CLIPPED=AEGYL+':trait:wing-clipped';
const AEGYL_SPEED=AEGYL+':trait:base-speed';
const WING_FLIGHT_MODIFIER=WING_CLIPPED+':flight-modifier';
const LAMBKIN='ffd20:race:lambkin';
const LAMBKIN_POLYGLOT=LAMBKIN+':trait:polyglot';
const LAMBKIN_LANGUAGES=LAMBKIN+':trait:languages';
const LAMBKIN_POLYGLOT_MODIFIER=LAMBKIN_POLYGLOT+':language-modifier';
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
 (race?.id===DWARF&&op.id===SALTBEARD_GREED&&op.operation==='modify'&&op.scope==='part_of_feature'&&op.resolution==='manual'&&
 op.targetFeatureIds?.length===1&&op.targetFeatureIds[0]===GREED&&op.addsFeatureIds?.length===1&&op.addsFeatureIds[0]===SALTBEARD)||
 (race?.id===AEGYL&&op.id===WING_FLIGHT_MODIFIER&&op.operation==='modify'&&op.scope==='part_of_feature'&&op.resolution==='manual'&&
 op.targetFeatureIds?.length===1&&op.targetFeatureIds[0]===AEGYL_SPEED&&!(op.addsFeatureIds||[]).length)||
 (race?.id===MOOGLE&&op.id===GROUNDED_MODIFIER&&op.operation==='modify'&&op.scope==='part_of_feature'&&op.resolution==='manual'&&
 op.targetFeatureIds?.length===1&&op.targetFeatureIds[0]===MOOGLE_BASE_SPEED&&
 op.addsFeatureIds?.length===1&&op.addsFeatureIds[0]===GROUNDED)||
 (race?.id===TARUTARU&&op.id===POLYGLOT_LANGUAGE_MODIFIER&&op.operation==='modify'&&op.scope==='part_of_feature'&&op.resolution==='manual'&&
 op.targetFeatureIds?.length===1&&op.targetFeatureIds[0]===TARUTARU_LANGUAGES&&!(op.addsFeatureIds||[]).length)||
 (race?.id===LAMBKIN&&op.id===LAMBKIN_POLYGLOT_MODIFIER&&op.operation==='modify'&&op.scope==='part_of_feature'&&op.resolution==='manual'&&
 op.targetFeatureIds?.length===1&&op.targetFeatureIds[0]===LAMBKIN_LANGUAGES&&!(op.addsFeatureIds||[]).length);

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
 if(race?.id===LAMBKIN&&feature?.id===LAMBKIN_LANGUAGES&&op?.id===LAMBKIN_POLYGLOT_MODIFIER)
  return {...feature,description:'Polyglot: starts with Common, Lambkin and one freely chosen additional language; retains the normal high-Intelligence bonus-language options (Galkan, Giant, Goblin, Lalafellan and Orc).'};
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
