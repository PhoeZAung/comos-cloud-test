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
// Source-verified Syricta partials: only creature type and flight components.
const SYRICTA_DRAGON=SYRICTA+':trait:dragon-type';
const SYRICTA_MEMORIES=SYRICTA+':trait:memories-of-the-forgotten';
const isSyrictaModifier=(race,op)=>{
 if(race?.id!==SYRICTA)return false;
 if(isExactScoped(op,SYRICTA_DRAGON+':type-modifier',[SYRICTA+':trait:type'],[])){
  const effects=sr(race,'type')?.effects||[];
  return effects.some(e=>e.target==='identity.type'&&e.textValue==='humanoid'&&e.automation==='automatic')&&
   effects.some(e=>e.target==='identity.subtypes'&&e.textValue==='reptilian'&&e.automation==='automatic');
 }
 return isExactScoped(op,SYRICTA_MEMORIES+':flight-modifier',[SYRICTA+':trait:base-speed'],[SYRICTA_MEMORIES])&&
  baseSpeed(race,20,40);
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
// Integrated source-reviewed PR #46 operation guards
const LAMBKIN='ffd20:race:lambkin';
const LAMBKIN_POLYGLOT=LAMBKIN+':trait:polyglot';
const LAMBKIN_LANGUAGES=LAMBKIN+':trait:languages';
const LAMBKIN_POLYGLOT_MODIFIER=LAMBKIN_POLYGLOT+':language-modifier';
// Integrated source-reviewed PR #47 operation guards
const TONKIN='ffd20:race:tonkin';
const DANCING_LANTERN=TONKIN+':trait:dancing-lantern';
const LANTERN_BEARER=TONKIN+':trait:lantern-bearer';
const DANCING_LANTERN_MODIFIER=DANCING_LANTERN+':torchlight-modifier';
// Integrated source-reviewed PR #48 operation guards
const QUADAV='ffd20:race:quadav';
const WATER_TRIBE=QUADAV+':trait:water-tribe';
const QUADAV_SPEED=QUADAV+':trait:base-speed';
const SWIM_MODIFIER=WATER_TRIBE+':swim-speed-modifier';
// Integrated source-reviewed PR #49 operation guards
const MOOMBA='ffd20:race:moomba';
const NAMAZU='ffd20:race:namazu';
const SETO='ffd20:race:seto-lion';
const speedOps=new Map([
 [MOOMBA+':trait:climb:speed-modifier',{race:MOOMBA,slug:'climb',speed:MOOMBA+':trait:base-speed',adds:true,starting:40,delta:-10}],
 [NAMAZU+':trait:fast:speed-modifier',{race:NAMAZU,slug:'fast',speed:NAMAZU+':trait:base-speed',adds:true,starting:30,delta:10}],
 [SETO+':trait:faster:speed-modifier',{race:SETO,slug:'faster',speed:SETO+':trait:base-speed',adds:true,starting:50,delta:10}],
 [SETO+':trait:nimble-attacks:speed-modifier',{race:SETO,slug:'nimble-attacks',speed:SETO+':trait:base-speed',adds:true,starting:50,delta:-10}]
]);
const speedSourceReady=(race,config)=>race?.id===config?.race&&
 race?.features.some(f=>f.id===config.speed&&f.effects?.some(e=>e.target==='identity.speed.land'&&
 e.automation==='automatic'&&!e.condition&&e.value?.kind==='constant'&&e.value.value===config.starting));
const supportedSpeedModifier=(race,op)=>{
 const config=speedOps.get(op?.id);
 return Boolean(config&&speedSourceReady(race,config)&&op.operation==='modify'&&
  op.scope==='part_of_feature'&&op.resolution==='manual'&&
  op.targetFeatureIds?.length===1&&op.targetFeatureIds[0]===config.speed&&
  (op.addsFeatureIds||[]).length===1&&op.addsFeatureIds[0]===config.race+':trait:'+config.slug&&
  !(op.targetEventIds||[]).length&&!(op.addsEventIds||[]).length&&!(op.removesComponents||[]).length);
};
// Integrated source-reviewed PR #50 operation guards
const BEASTKIN='ffd20:race:beastkin';
const GARLEAN='ffd20:race:garlean';
const SHINDROID='ffd20:race:shindroid';
const trait=(race,slug)=>race+':trait:'+slug;
const scoreVector=(race,slug,values)=>{
 const feature=race?.features?.find(f=>f.id===trait(race.id,slug));
 const actual=(feature?.effects||[]).filter(e=>e.kind==='ability_score'&&e.automation==='automatic'&&!e.condition)
  .map(e=>[e.target,e.value?.kind,e.value?.value]);
 return actual.length===values.length&&values.every(([k,v])=>actual.some(([target,kind,n])=>target==='ability_scores.'+k&&kind==='constant'&&n===v));
};
const isBaseLand=(race,feet)=>race?.features?.some(f=>
 f.id===trait(race.id,'base-speed')&&f.effects?.some(e=>e.target==='identity.speed.land'&&
 e.value?.kind==='constant'&&e.value.value===feet&&e.automation==='automatic'&&!e.condition));
const scopedModifier=(race,op,id,targets,added=[],ready=true)=> Boolean(ready&&race&&op&&op.id===id&&
 op.operation==='modify'&&op.scope==='part_of_feature'&&op.resolution==='manual'&&
 op.targetFeatureIds?.length===targets.length&&targets.every((t,i)=>op.targetFeatureIds[i]===t)&&
 (op.addsFeatureIds||[]).length===added.length&&added.every((t,i)=>op.addsFeatureIds[i]===t)&&
 !(op.targetEventIds||[]).length&&!(op.addsEventIds||[]).length&&!(op.removesComponents||[]).length);
const isBatchModifier=(race,op)=>{
 if(!race)return false;
 if(race.id===BEASTKIN){
  const score=trait(BEASTKIN,'ability-score-racial-traits'),
   ready=scoreVector(race,'ability-score-racial-traits',[['str',2],['wis',2],['int',-2]]);
  for(const slug of ['alluring','light-build'])
   if(scopedModifier(race,op,trait(BEASTKIN,slug)+':ability-modifier',[score],[trait(BEASTKIN,slug)],ready))return true;
  if(scopedModifier(race,op,trait(BEASTKIN,'loper')+':speed-modifier',
   [trait(BEASTKIN,'base-speed')],[],isBaseLand(race,30)))return true;
 }
 if(race.id===GARLEAN){
  const ready=scoreVector(race,'ability-score-adjustment',[['con',2],['int',2],['wis',-2]])&&
   race.features.some(f=>f.id===trait(GARLEAN,'languages')&&f.choicePoolIds?.includes(GARLEAN+':pool:bonus-languages')&&
    f.effects?.some(e=>e.target==='languages.starting'&&e.textValue==='Common'));
  return scopedModifier(race,op,trait(GARLEAN,'xenophobia-extremis')+':component-modifier',
   [trait(GARLEAN,'ability-score-adjustment'),trait(GARLEAN,'languages')],
   [trait(GARLEAN,'xenophobia-extremis')],ready);
 }
 if(race.id===SHINDROID){
  if(scopedModifier(race,op,trait(SHINDROID,'heavy-platform')+':speed-modifier',
   [trait(SHINDROID,'base-speed')],[trait(SHINDROID,'heavy-platform')],isBaseLand(race,30)))return true;
  if(scopedModifier(race,op,trait(SHINDROID,'anomaly')+':immunity-modifier',
   [trait(SHINDROID,'robotic-immunities')],[],
   race.features.some(f=>f.id===trait(SHINDROID,'robotic-immunities')&&/fear and emotion/.test(f.description))))return true;
 }
 return false;
};
// Integrated source-reviewed PR #51 operation guards
const SYLPH='ffd20:race:sylph';
const SYLPH_SPEED=SYLPH+':trait:base-speed';
const SYLPH_IMPROVED=SYLPH+':trait:improved-flight';
const FORGIVEN='ffd20:race:forgiven';
const FORGIVEN_SCION=FORGIVEN+':trait:scion-of-mortality';
const FORGIVEN_LANGUAGES=FORGIVEN+':trait:languages';
const FORGIVEN_TYPE=FORGIVEN+':trait:type';
const sourceSylphSpeed=race=>{
 const effects=race?.features?.find(f=>f.id===SYLPH_SPEED)?.effects||[];
 return race?.id===SYLPH&&
  [['identity.speed.land',20],['identity.speed.fly',40]].every(([target,value])=>
   effects.some(e=>e.target===target&&e.kind==='identity'&&e.automation==='automatic'&&!e.condition&&
    e.value?.kind==='constant'&&e.value.value===value));
};
const sourceForgivenIdentity=race=>{
 const language=race?.features?.find(f=>f.id===FORGIVEN_LANGUAGES)?.effects||[],
  type=race?.features?.find(f=>f.id===FORGIVEN_TYPE)?.effects||[];
 return race?.id===FORGIVEN&&
  [['identity.languages.common','Common'],['identity.languages.celestial','Celestial']].every(([target,text])=>
   language.some(e=>e.target===target&&e.kind==='identity'&&e.automation==='automatic'&&e.textValue===text))&&
  [['identity.type','outsider'],['identity.subtypes','native']].every(([target,text])=>
   type.some(e=>e.target===target&&e.kind==='identity'&&e.automation==='automatic'&&e.textValue===text));
};
const isNewPartial=(race,op,id,targets,added,verified)=>Boolean(verified&&op?.id===id&&
 op.operation==='modify'&&op.scope==='part_of_feature'&&op.resolution==='manual'&&
 JSON.stringify(op.targetFeatureIds)===JSON.stringify(targets)&&
 JSON.stringify(op.addsFeatureIds)===JSON.stringify(added)&&
 !(op.targetEventIds||[]).length&&!(op.addsEventIds||[]).length&&!(op.removesComponents||[]).length);
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
 isSyrictaModifier(race,op)||
 newBatchModifier(race,op)||
 isHalfSlot(race,op)||
 // PR #46 source-approved partial
 (race?.id===LAMBKIN&&op.id===LAMBKIN_POLYGLOT_MODIFIER&&op.operation==='modify'&&op.scope==='part_of_feature'&&op.resolution==='manual'&&
 op.targetFeatureIds?.length===1&&op.targetFeatureIds[0]===LAMBKIN_LANGUAGES&&!(op.addsFeatureIds||[]).length)||
 // PR #47 source-approved partial
 (race?.id===TONKIN&&op.id===DANCING_LANTERN_MODIFIER&&op.operation==='modify'&&op.scope==='part_of_feature'&&
 op.resolution==='manual'&&op.targetFeatureIds?.length===1&&op.targetFeatureIds[0]===LANTERN_BEARER&&
 op.addsFeatureIds?.length===1&&op.addsFeatureIds[0]===DANCING_LANTERN&&
 !(op.targetEventIds||[]).length&&!(op.addsEventIds||[]).length&&!(op.removesComponents||[]).length)||
 // PR #48 source-approved partial
 (race?.id===QUADAV&&op.id===SWIM_MODIFIER&&op.operation==='modify'&&op.scope==='part_of_feature'&&op.resolution==='manual'&&
 op.targetFeatureIds?.length===1&&op.targetFeatureIds[0]===QUADAV_SPEED&&!(op.addsFeatureIds||[]).length&&
 !(op.targetEventIds||[]).length&&!(op.addsEventIds||[]).length&&!(op.removesComponents||[]).length)||
 // PR #49 source-approved partial
 supportedSpeedModifier(race,op)||
 // PR #50 source-approved partial
 isBatchModifier(race,op)||
 // PR #51 source-approved partial
 isNewPartial(race,op,SYLPH_IMPROVED+':speed-modifier',[SYLPH_SPEED],[],sourceSylphSpeed(race))||
 isNewPartial(race,op,FORGIVEN_SCION+':identity-modifier',
  [FORGIVEN_LANGUAGES,FORGIVEN_TYPE],[FORGIVEN_SCION],sourceForgivenIdentity(race))||
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
 if(isSyrictaModifier(race,op)){
  if(op.id===SYRICTA_DRAGON+':type-modifier'){
   return {...feature,description:'Dragon Type: creature type Dragon with sleep and paralysis immunity; no reptilian subtype. Elemental Resistance, Dragon Resistances and Breath Weapon are replaced.',
    effects:(feature.effects||[]).filter(e=>e.target!=='identity.subtypes').map(e=>e.target==='identity.type'?
     {...e,textValue:'Dragon'}:e)};
  }
  if(op.id===SYRICTA_MEMORIES+':flight-modifier')
   return {...feature,description:'Memories of the Forgotten retains 20-foot land speed but replaces flight. The alternate grants two Knowledge specialties (class skills and +2 each); record those choices manually.',
    effects:(feature.effects||[]).filter(e=>e.target!=='identity.speed.fly')};
 }

 // PR #51 source-approved runtime effects
 if(sourceSylphSpeed(race)&&feature?.id===SYLPH_SPEED&&op?.id===SYLPH_IMPROVED+':speed-modifier'){
  return {...feature,description:'Improved Flight: base land speed 10 ft and fly speed 60 ft (good maneuverability); Camouflage and Beguiling Liar are lost.',
   effects:(feature.effects||[]).map(e=>e.target==='identity.speed.land'?
    {...e,value:{...e.value,value:10}}:e.target==='identity.speed.fly'?
    {...e,value:{...e.value,value:60}}:e)};
 }
 if(sourceForgivenIdentity(race)&&op?.id===FORGIVEN_SCION+':identity-modifier'){
  if(feature?.id===FORGIVEN_LANGUAGES)return {...feature,
   description:'Scion of Mortality: starts speaking Common; replaces only the Celestial starting language. Normal source-defined high-Intelligence bonus languages remain available.',
   effects:(feature.effects||[]).filter(e=>e.target!=='identity.languages.celestial')};
  if(feature?.id===FORGIVEN_TYPE)return {...feature,
   description:'Scion of Mortality: outsider (native), also counts as humanoid (hume) for race-dependent effects, feats, and spells; passes as Hume without Disguise. Dual-race eligibility is a manual rules card.',
   effects:feature.effects};
 }

 // PR #50 source-approved runtime effects
 if(isBatchModifier(race,op)){
  if(race.id===BEASTKIN&&feature.id===trait(BEASTKIN,'ability-score-racial-traits')){
   const alluring=op.id===trait(BEASTKIN,'alluring')+':ability-modifier';
   const old='ability_scores.'+(alluring?'wis':'str'),updated='ability_scores.'+(alluring?'cha':'dex');
   return {...feature,description:feature.description+' '+(alluring?'Alluring: +2 CHA instead of +2 WIS.':'Light Build: +2 DEX instead of +2 STR.'),
    effects:(feature.effects||[]).map(e=>e.target===old?{...e,target:updated}:e)};
  }
  if(race.id===BEASTKIN&&feature.id===trait(BEASTKIN,'base-speed'))
   return {...feature,description:'Loper: base land speed 40 ft; Sprinter remains +10 ft only when charging, running or withdrawing.',
    effects:(feature.effects||[]).map(e=>e.target==='identity.speed.land'?{...e,value:{...e.value,value:40}}:e)};
  if(race.id===GARLEAN){
   if(feature.id===trait(GARLEAN,'ability-score-adjustment'))
    return {...feature,description:'+2 CON; +2 INT; -2 CHA (Xenophobia Extremis replaces the normal -2 WIS).',
     effects:(feature.effects||[]).map(e=>e.target==='ability_scores.wis'&&e.value?.value===-2?
      {...e,target:'ability_scores.cha'}:e)};
   if(feature.id===trait(GARLEAN,'languages'))
    return {...feature,description:'Xenophobia Extremis: starts speaking Common; no high-Intelligence bonus languages. Normal Linguistics learning is not removed.',
     choicePoolIds:[]};
  }
  if(race.id===SHINDROID){
   if(feature.id===trait(SHINDROID,'base-speed'))
    return {...feature,description:'Heavy Platform: land speed 20 ft, never reduced by armor or encumbrance. Body weight +50 lb (track manually).',
     effects:(feature.effects||[]).map(e=>e.target==='identity.speed.land'?{...e,value:{...e.value,value:20}}:e)};
   if(feature.id===trait(SHINDROID,'robotic-immunities'))
    return {...feature,description:'Anomaly: retains immunity to Fatigued, Exhausted and Sleep, but no longer has the normal blanket fear/emotion immunities. -2 racial saving throws against mind-affecting, fear and emotion effects (conditional; apply manually). Anomaly can benefit from morale bonuses.'};
  }
 }

 // PR #49 source-approved runtime effects
 if(supportedSpeedModifier(race,op)&&feature?.id===speedOps.get(op.id).speed){
  const config=speedOps.get(op.id);
  return {...feature,
   description:race.id===MOOMBA?'Land speed 30 ft with Climb; Climb 20 ft and its +8 skill bonus are granted separately.':
    race.id===NAMAZU?'Fast: land speed 40 ft, swim speed remains 30 ft; Skilled Traders is lost.':
    'Seto Lion land speed includes Quadruped and the remaining Fast/Faster benefits; apply both chosen alternates once.',
   effects:(feature.effects||[]).map(e=>e.target==='identity.speed.land'&&e.automation==='automatic'&&e.value?.kind==='constant'?
    {...e,value:{...e.value,value:e.value.value+config.delta}}:e)};
 }

 // PR #48 source-approved runtime effects
 if(race?.id===QUADAV&&feature?.id===QUADAV_SPEED&&op?.id===SWIM_MODIFIER){
  const swim=(feature.effects||[]).find(e=>e.target==='identity.speed.swim'&&e.automation==='automatic'&&
   e.value?.kind==='constant'&&e.value.value===30);
  if(!swim)return feature; // Do not invent a speed if the source vector changes.
  return {...feature,description:'20-foot land speed and 50-foot swim speed with Water Tribe. Armor and encumbrance do not reduce these racial speeds.',
   effects:(feature.effects||[]).map(e=>e.id===swim.id?{...e,value:{...e.value,value:50}}:e)};
 }

 // PR #47 source-approved runtime effects
 if(race?.id===TONKIN&&feature?.id===LANTERN_BEARER&&op?.id===DANCING_LANTERN_MODIFIER)
  return {...feature,description:'Lantern Bearer (Dancing Lantern modification): immune to light-caused blindness and dazzle; treated as one level higher when determining effects of light spells/effects cast. The torchlight spell-like ability is replaced by Dancing Lantern at will (listed separately). The light defenses remain active.'};

 // PR #46 source-approved runtime effects
 if(race?.id===LAMBKIN&&feature?.id===LAMBKIN_LANGUAGES&&op?.id===LAMBKIN_POLYGLOT_MODIFIER)
  return {...feature,description:'Polyglot: starts with Common, Lambkin and one freely chosen additional language; retains the normal high-Intelligence bonus-language options (Galkan, Giant, Goblin, Lalafellan and Orc).'};
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
