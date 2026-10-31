import {isSheetFamily,sheetFamilyEvents,sheetFamilyOptions,sheetFamilyCounter} from './sheet-family-progression.mjs';
import {withBuildDefaults,sameBuildValue} from './build-compatibility.mjs';
import {DOOM_SLAYER_ID,martialCounter,supportsMartialProgression,martialChoiceEvents,martialEligibleOptions} from './martial-progression.mjs';
import {isLevelOneClass,levelOnePreview,levelOneIssues} from './level-one-classes.mjs';
import {isBeastmaster,beastmasterChoiceEvents,beastmasterOptions,COMPANION_EVENT} from './beastmaster-level-one.mjs';
import {isRedMage,redMagePreview,redMageIssues,redMageSpellCounts,redMageChoiceEvents,redMageOptions,RED_MAGERY_EVENT,redMageHasSpells,redMageArchetype,redMageCounter} from './red-mage-level-one.mjs';
import {redMageSpells} from './red-mage-spells.mjs';
import {isBard,bardPreview,bardIssues,bardSpellCounts,bardSpellOptions} from './bard-level-one.mjs';
import {supportsRacialPool,replacementRequiresWizard,racialChoiceEffects,racialChoiceIssues,mappedRaceTraits,racialChoiceFeats,SYRICTA_ELEMENT,SYRICTA_BREATH,HALF_ANCESTRAL_SLOT,GRIA_WEAPON,NAMAZU_FOCUS_LEVELS,namazuFocusSlot,SHINDROID_SIMULATED_RACE,shindroidSimulationOptions,YAGUDO_RANK_LANGUAGES,YAGUDO_LINGUISTICS_ROW} from './racial-choices.mjs';
import {isSupportedRaceOperation,isSupportedRaceHeritage,applyRaceModification} from './race-replacement-operations.mjs';
import {seedRacialMovement} from '../../sheet/movement.mjs';
import {GARLEAN_ID,GARLEAN_WEAPON,GARLEAN_CRAFT,GARIF_ID,GARIF_TERRAIN,GARIF_PASTORALIST,DRACOBALTIAN_ID,BURMECIAN_ID,BEASTKIN_ID,BANGAA_ID,AU_RA_ID,AL_BHED_ID,AL_BHED_GENIUS,AEGYL_ID,HUME_ID,MITHRA_ID,TARUTARU_ID,racialSkillRanks,racialCounter,applyRacialFlatStats} from './racial-progress.mjs';
import {buildLevel,carriedLevels,carryCharacter,sameCarry} from './multiclass.mjs';
export {buildLevel,carryCharacter} from './multiclass.mjs';
import {syncLimitBreaks} from '../../sheet/limit-breaks.mjs';
import {registry} from './catalog.mjs';
import {mutantEmptyRolls,mutantRollIssues} from './mutant-progression.mjs';
import {spells} from './spells.mjs';
import {blackMageSummary} from '../rules-summary.mjs';
import {sheetStats} from '../../sheet/model.mjs';
import {fixedSkills} from '../../sheet/skills.mjs';
import {pointSpend,standardArray} from '../ability-generation.mjs';
import {ARCHER_ID,BLACK_MAGE_ID,availableClasses,classFor,classHasSpells,isArcher,classHitDie,classDefaultHp,className,classSkill,archerChoiceEvents,archerEligibleOptions,archerPreview,archerIssues,archerFeatureChanges,compileNoncastingBuild} from './class-adapters.mjs';
export {registry,spells,availableClasses,classFor,className,classSkill};
const supportsSheetProgression=b=>isSheetFamily(b)||supportsMartialProgression(b);
const isChaCaster=b=>isBard(b)||isRedMage(b)&&redMageHasSpells(b);
export const spellsForBuild=b=>isRedMage(b)?redMageSpells:isBard(b)?bardSpellOptions():spells;
export const stats=['str','dex','con','int','wis','cha'];
export const steps=['Identity','Base scores','Race','Class','Choices','Spells','Review'];
const mod=n=>Math.floor((n-10)/2),uniq=a=>[...new Set(a)];
const bad=m=>{throw Object.assign(Error(m),{code:'INVALID_CHARACTER'});};
export function newBuild(){return {version:registry.version,name:'',alignment:'',bio:'',portrait:'',baseScores:Object.fromEntries(stats.map(k=>[k,10])),abilityMethod:'manual',pointBudget:15,scorePool:[],scoreAssignments:[0,1,2,3,4,5],abilityIncreases:{},mutantRolls:mutantEmptyRolls(),initialIntMod:null,initialChaMod:null,raceId:'',classId:BLACK_MAGE_ID,heritageId:'',disabledTraits:[],alternateIds:[],level:1,carry:null,archetypeId:'',racialChoices:{},racialSpecialties:{},choices:{},spellIds:[],spellSelections:null,skillRanks:null,hpRolls:[6],favored:[],reviewed:false};}
export function raceFor(b){return registry.races.find(r=>r.id===b.raceId);}
import {replacementFor} from './race-replacement-resolvers.mjs';
export {replacementFor};
export function raceTraits(b){
 const r=raceFor(b);if(!r)return {traits:[],replaced:[],errors:[]};
 const disabled=new Set(b.disabledTraits),active=new Set(r.data.standardTraitIds.filter(id=>!disabled.has(id))),consumed=new Set(),modified=new Map(),errors=[];
 const hologram=r.id==='ffd20:race:shindroid'&&b.alternateIds.includes(r.id+':trait:hologram-simulation');
 if(hologram&&(b.heritageId||b.alternateIds.some(id=>
    [r.id+':trait:integrated-weaponry',r.id+':trait:race-simulation'].includes(id))))
  errors.push('Hologram Simulation cannot be combined with variant Shindroid heritages, Integrated Weaponry, or Race Simulation.');
 const heritage=r.data.heritages.find(h=>h.id===b.heritageId),heritageSafe=!heritage||isSupportedRaceHeritage(r,heritage);
 if(heritage&&!heritageSafe)errors.push('Selected heritage needs a verified replacement and automatic ability-score vector or required choice control.');
 const operations=[...(heritageSafe?heritage?.replacements||[]:[]),...b.alternateIds.flatMap(id=>{
  const candidates=replacementFor(r,id);
  if(r.id==='ffd20:race:half-breed'&&id==='ffd20:race:half-breed:trait:ancestral-arms'&&candidates.length===2){
   const chosen=b.racialChoices?.['ffd20:race:half-breed:pool:ancestral-arms-selected-slot']?.[0];
   return [candidates.find(op=>op.id===id+(chosen?.endsWith(':option:offense')?':slot-offense':':slot-feat-skill'))||candidates[0]];
  }
  return candidates;
 })];
 for(const op of operations){
  if(!isSupportedRaceOperation(r,op)){errors.push('This trait needs a precise replacement mapping: '+op.description);continue;}
  if(op.operation==='modify'){
   for(const id of op.targetFeatureIds){
    const previous=modified.get(id)||[];
    const beast='ffd20:race:beastkin:trait:',seto='ffd20:race:seto-lion:trait:';
    const pair=[previous[0]?.id,op.id];
    const independentBeast=r.id==='ffd20:race:beastkin'&&id===beast+'ability-score-racial-traits'&&
     previous.length===1&&pair[0]!==pair[1]&&
     pair.every(x=>[beast+'alluring:ability-modifier',beast+'light-build:ability-modifier'].includes(x));
    const independentSeto=r.id==='ffd20:race:seto-lion'&&id===seto+'base-speed'&&
     previous.length===1&&pair[0]!==pair[1]&&
     pair.every(x=>[seto+'faster:speed-modifier',seto+'nimble-attacks:speed-modifier'].includes(x));
    if(previous.length&&!independentBeast&&!independentSeto||consumed.has(id)||disabled.has(id))
     errors.push('Cannot modify an already replaced or disabled racial trait: '+(r.features.find(f=>f.id===id)?.name||id)+'.');
    modified.set(id,[...previous,op]);
   }
   // Approved partial modifications may also introduce a named alternate
   // without deleting unaffected portions of the standard racial trait.
   if(!op.targetFeatureIds.some(id=>disabled.has(id)||consumed.has(id)))
    for(const id of op.addsFeatureIds||[])active.add(id);
   continue;
  }
  for(const id of op.targetFeatureIds){if(consumed.has(id))errors.push('Two selections replace '+(r.features.find(f=>f.id===id)?.name||id)+'.');if(disabled.has(id)&&b.alternateIds.some(aid=>op.addsFeatureIds.includes(aid)))errors.push('Cannot replace an already disabled racial trait: '+(r.features.find(f=>f.id===id)?.name||id)+'.');consumed.add(id);active.delete(id);}
  // A user-disabled score/trait stays disabled when a heritage replaces its vector.
  if(!op.targetFeatureIds.some(id=>disabled.has(id)))for(const id of op.addsFeatureIds)active.add(id);
 }
 for(const [id] of modified)if(!active.has(id))errors.push('Cannot modify a racial trait replaced by another selection: '+(r.features.find(f=>f.id===id)?.name||id)+'.');
 const traits=mappedRaceTraits(r,r.features.filter(f=>active.has(f.id)).map(f=>modified.has(f.id)?modified.get(f.id).reduce((v,op)=>applyRaceModification(r,v,op),f):f)).map(f=>{
  if(r.id==='ffd20:race:shindroid'&&f.id===r.id+':trait:race-simulation'){
   const chosen=shindroidSimulationOptions().find(o=>o.id===b.racialChoices?.[SHINDROID_SIMULATED_RACE]?.[0]);
   return {...f,description:chosen?
    'Race Simulation: chosen playable humanoid '+chosen.name+'. Counts as both Shindroid and '+chosen.name+
    ' for race-specific effects, feats, spells, items and traits. Assumes '+chosen.size+
    ' size and ages as '+chosen.name+' (aging benefits and penalties are manual). Replaces Immortal only; does NOT grant other '+chosen.name+' racial traits, ability-score modifiers or languages.':
    'Race Simulation: choose one playable humanoid race. Counts as both Shindroid and the chosen race; uses its size and aging, not its other racial abilities. Requires a verified selection.'};
  }
  if(r.id==='ffd20:race:quadav'&&f.id==='ffd20:race:quadav:trait:bond-to-the-land'){
   const pool='ffd20:race:quadav:pool:bond-to-the-land-selection';
   const terrain=r.choicePools.find(p=>p.id===pool)?.options.find(o=>o.id===b.racialChoices?.[pool]?.[0])?.name;
   return {...f,description:f.description+(terrain?' Chosen terrain: '+terrain+'. Apply its +2 dodge AC only in that terrain.':'')};
  }
  if(r.id==='ffd20:race:trollkin'&&f.id==='ffd20:race:trollkin:trait:acid-or-fire')
   return {...f,description:'Source contradiction: the weakness is headed “Acid or Fire”, but the detailed effect says FIRE or EARTH damage suppresses Fast Healing for 1 minute. This is NOT a player choice. The GM must adjudicate the triggering element; no automatic healing or suppression is applied.'};
  if(r.id==='ffd20:race:trollkin'&&f.id==='ffd20:race:trollkin:trait:fast-healing')
   return {...f,description:f.description+' Restore 1 HP per round only when the feature is active. The Acid or Fire heading conflicts with the detailed FIRE or EARTH suppression trigger for 1 minute; use the GM adjudication. No automatic HP tick or suppression.'};
  if(r.id==='ffd20:race:trollkin'&&f.id==='ffd20:race:trollkin:trait:faster-healing'&&
   b.alternateIds.includes(f.id)&&consumed.has('ffd20:race:trollkin:trait:fast-healing')&&
   consumed.has('ffd20:race:trollkin:trait:thick-skin'))
   return {...f,description:'Fast Healing 2 HP each round replaces Fast Healing 1 and Thick Skin. Continues below 0 HP until death; cannot restore lost limbs, starvation, thirst or suffocation HP. Source contradiction: heading Acid or Fire, detailed trigger fire or earth damage suppresses healing for 1 minute. Ask the GM to adjudicate the element. This is not a player-selected trait and cannot automatically tick HP or suppress healing.'};
  if(r.id==='ffd20:race:sylph'&&f.id==='ffd20:race:sylph:trait:improved-flight'&&b.alternateIds.includes(f.id))
   return {...f,description:'Improved Flight: land speed becomes 10 ft, flight speed 60 ft (good maneuverability; two steps above poor). Replaces Camouflage and Beguiling Liar; all other traits remain.'};
  if(r.id===GARIF_ID&&f.id===GARIF_ID+':trait:bond-to-the-land'){
   const terrain=r.choicePools.find(p=>p.id===GARIF_TERRAIN)?.options.find(o=>o.id===b.racialChoices?.[GARIF_TERRAIN]?.[0])?.name;
   return {...f,description:f.description+(terrain?' Chosen terrain: '+terrain+'. This bonus is conditional and must be applied manually.':'')};
  }
  return f;
 }),effects=racialChoiceEffects(b,r,traits);
 const pick=(pool)=>r.choicePools.find(x=>x.id===pool)?.options.find(x=>x.id===b.racialChoices?.[pool]?.[0])?.name||'not selected';
 const syrictaChoices=[
   traits.some(f=>f.id===r.id+':trait:elemental-resistance')?'Chosen Elemental Resistance: '+pick(SYRICTA_ELEMENT)+' (resistance 5).':'',
   traits.some(f=>f.id===r.id+':trait:breath-weapon')?'Chosen Breath Weapon: '+pick(SYRICTA_BREATH)+' (3/day; damage/scaling and DC manual).':'',
   traits.some(f=>f.id===r.id+':trait:memories-of-the-forgotten')?'Memories of the Forgotten: two selected Knowledge skills have +2 racial bonuses and count as class skills.':''
  ].filter(Boolean).join(' ');
 const note=r.id==='ffd20:race:syricta'?syrictaChoices:
  r.id==='ffd20:race:half-breed'?'Ancestral Arms replaces the selected inherited '+(b.racialChoices?.[HALF_ANCESTRAL_SLOT]?.[0]?.endsWith(':option:offense')?'Offense':'Feat and Skill')+' slot, not both; inherited parent choices remain unverified.':
  'Your chosen racial benefits.';
 // Four source-defined Sylph Fey Magic spell-like abilities have separate
 // usage pools: one daily and three independently tracked weekly. These are
 // not learned class spells, and their recharge must not be guessed.
 const sylphUses=r.id==='ffd20:race:sylph'&&traits.some(f=>f.id===r.id+':trait:fey-magic')?
  [['hidden-presence','Hidden Presence',1,'day'],['charm','Charm',3,'week'],
   ['lesser-confusion','Lesser Confusion',3,'week'],['sleep','Sleep',3,'week']]
    .map(([slug,name,uses,period])=>({
     id:r.id+':trait:fey-magic:uses:'+slug,
     name:'Fey Magic · '+name+' ('+uses+'/'+period+')',
     description:name+' spell-like ability '+uses+'/'+period+'. Caster level equals character level; save DC uses Charisma. Track uses manually; reset at the source-defined '+period+' boundary. No class spell known or MP cost is added.',
     choicePoolIds:[],effects:[]
    })): [];
 const selected=effects.length?[...traits,{id:r.id+':selected-choices',name:'Selected racial choices',description:note,sheetTargets:['racialAbilities'],effects,choicePoolIds:[]}]:traits;
 return {traits:[...selected,...sylphUses],replaced:[...consumed],errors};
}
export function effectiveScores(b){const result={...b.baseScores};for(const [level,key] of Object.entries(b.abilityIncreases||{}))if(Number(level)<=buildLevel(b)&&stats.includes(key))result[key]++;for(const f of raceTraits(b).traits)for(const e of f.effects)if(e.automation==='automatic'&&!e.condition&&e.kind==='ability_score'&&e.value?.kind==='constant'){const k=e.target.split('.').at(-1);if(stats.includes(k))result[k]+=e.value.value;}if(b.archetypeId===DOOM_SLAYER_ID&&b.classId==='ffd20:class:gunbreaker'&&b.level===20)for(const key of ['str','dex','wis'])result[key]+=2;return result;}
// Kindred's +2 applies only to mage-class spells and features, never to the
// displayed Intelligence score, ability checks, skill points or other classes.
// Black Mage is currently the verified INT-based casting chassis.
export function mageCastingInt(b){
 const int=effectiveScores(b).int;
 return b.classId===BLACK_MAGE_ID&&raceTraits(b).traits.some(f=>f.id==='ffd20:race:kindred:trait:fiendish-magery')?int+2:int;
}
export function racialClassSkill(b,id,index){return raceTraits(b).traits.some(f=>f.effects.some(e=>e.automation==='automatic'&&!e.condition&&(e.target===`skills.${id}.class_skill`||Number.isInteger(index)&&e.target===`skills.row.${index}.class_skill`)));}
export function calculated(value,b,effective=effectiveScores(b)){
 if(!value)return null;if(value.kind==='constant')return value.value;
 if(value.kind==='level_table'){const level=value.levelBasis==='ability_score'?effective.int:b.level;return value.rows.filter(r=>r.from<=level).at(-1)?.value??value.belowFirst;}
 if(value.kind!=='formula')return null;
 let expression=value.expression;
 const vars={CLASS_LEVEL:b.level,CHARACTER_LEVEL:buildLevel(b),CASTER_LEVEL:b.level,SPELL_LEVEL:isRedMage(b)?redMagePreview(b,{scores:effective,race:raceFor(b),racial:raceTraits(b),hpRolls:hpHistory(b)}).summary.spellLevel:Math.min(9,Math.ceil(b.level/2)),FAVORED_SELECTIONS:0,CHOICE_RANK:1};
 for(const key of stats){vars[key.toUpperCase()+'_MOD']=mod(effective[key]);vars[key.toUpperCase()+'_SCORE']=effective[key];}
 expression=expression.replace(/\b[A-Z_]+\b/g,key=>{if(!Object.hasOwn(vars,key))bad('Unknown formula variable.');return '('+vars[key]+')';});
 const tokens=expression.match(/\d+(?:\.\d+)?|floor|ceil|min|max|[()+*/,\-]/g)||[];
 if(tokens.join('')!==expression.replace(/\s/g,'')||tokens.length>100)bad('Unsupported rules formula.');let at=0,depth=0;
 function atom(){if(++depth>20)bad('Formula nesting too deep.');let t=tokens[at++],v;
  if(t==='-'||t==='+')v=(t==='-'?-1:1)*atom();
  else if(t==='('){v=sum();if(tokens[at++]!==')')bad('Invalid formula.');}
  else if(['floor','ceil','min','max'].includes(t)){if(tokens[at++]!=='(')bad('Invalid formula.');const args=[sum()];while(tokens[at]===','){at++;args.push(sum());}if(tokens[at++]!==')'||args.length>8)bad('Invalid formula.');v=Math[t](...args);}
  else if(t&&/^\d/.test(t))v=Number(t);else bad('Invalid formula.');depth--;return v;}
 function product(){let v=atom();while(['*','/'].includes(tokens[at])){let op=tokens[at++],n=atom();if(op==='/'&&!n)bad('Division by zero.');v=op==='*'?v*n:v/n;}return v;}
 function sum(){let v=product();while(['+','-'].includes(tokens[at])){let op=tokens[at++],n=product();v=op==='+'?v+n:v-n;}return v;}
 let v=sum();if(at!==tokens.length||!Number.isFinite(v)||Math.abs(v)>1000000)bad('Invalid formula result.');
 v=value.rounding==='ceil'?Math.ceil(v):value.rounding==='none'?v:Math.floor(v);if(value.minimum!==null)v=Math.max(v,value.minimum);if(value.maximum!==null)v=Math.min(v,value.maximum);return v;
}
export function choiceEvents(b){if(isSheetFamily(b))return sheetFamilyEvents(b);if(isRedMage(b))return redMageChoiceEvents(b);if(supportsMartialProgression(b))return martialChoiceEvents(b);if(isBeastmaster(b))return beastmasterChoiceEvents(b);if(isLevelOneClass(b)||isBard(b))return [];if(isArcher(b))return archerChoiceEvents(b);return registry.class.data.events.filter(e=>e.type==='choose'&&e.atClassLevel<=b.level&&registry.class.choicePools.some(p=>e.poolIds.includes(p.id)&&p.options.length));}
export function eligibleOptions(b,event){if(isSheetFamily(b))return sheetFamilyOptions(b,event,effectiveScores(b));if(isRedMage(b))return redMageChoiceEvents(b).some(e=>e.id===event.id)?redMageOptions(b,event,effectiveScores(b)):[];if(supportsMartialProgression(b))return martialEligibleOptions(b,event);if(isBeastmaster(b))return beastmasterOptions(event);if(isArcher(b))return archerEligibleOptions(b,event);const pool=registry.class.choicePools.find(p=>event.poolIds.includes(p.id)&&p.options.length);return pool?.options||[];}
export function hpHistory(b){return Array.from({length:Math.max(1,Math.min(20,b.level||1))},(_,i)=>b.hpRolls?.[i]??(i===0&&!carriedLevels(b)?classHitDie(b):classDefaultHp(b)));}
export function spellCounts(b){if(isRedMage(b))return redMageSpellCounts(effectiveScores(b),b.initialChaMod,b.level,b);if(isBard(b))return bardSpellCounts(effectiveScores(b),b.initialChaMod);if(isArcher(b)||isLevelOneClass(b))return {cantrips:0,leveled:0};const int=b.initialIntMod??mod(mageCastingInt(b));return {cantrips:4+Math.floor((b.level-1)/3),leveled:Math.max(3,3+int)+2*(b.level-1)+(b.level>=7?1:0)+(b.level>=12?1:0)+(b.level>=17?1:0)};}
export function buildIssues(b,{complete=true}={}){
 const errors=[];const add=(step,message)=>errors.push({step,message});
 if(!b.name.trim())add(0,'Enter a character name.');
 for(const k of stats)if(!Number.isInteger(b.baseScores[k])||b.baseScores[k]<1||b.baseScores[k]>45)add(1,'Base scores must be whole numbers from 1 to 45.');
 if(b.abilityMethod==='point-buy'&&(stats.some(k=>b.baseScores[k]<7||b.baseScores[k]>18)||pointSpend(b.baseScores)>b.pointBudget))add(1,'Point-buy scores must be 7–18 and within the selected budget.');
 if(['array','rolled'].includes(b.abilityMethod)){const pool=b.abilityMethod==='array'?standardArray:b.scorePool;if(pool.length!==6||new Set(b.scoreAssignments).size!==6||b.scoreAssignments.some(i=>!Number.isInteger(i)||i<0||i>5)||stats.some((key,i)=>b.baseScores[key]!==pool[b.scoreAssignments[i]]))add(1,'Assign each generated score exactly once.');}
 if(b.skillRanks!==null&&b.skillRanks!==undefined){const budget=previewBuild(b).skillBudget;if(b.skillRanks.length!==fixedSkills.length||b.skillRanks.some(n=>!Number.isInteger(n)||n<0||n>buildLevel(b)))add(7,'Skill ranks must be whole numbers up to your character level.');else if(b.skillRanks.reduce((sum,n)=>sum+n,0)!==budget)add(7,'Allocate all '+budget+' skill points.');}
 const race=raceFor(b);if(!race)add(2,'Choose a race.');

 if(race?.id===GARLEAN_ID&&(b.level!==1||b.carry))add(3,'Garlean supports first-level creation and editing only; later levels and multiclassing need separate review.');
 if(race?.id===GARLEAN_ID&&raceTraits(b).traits.some(f=>f.id===GARLEAN_ID+':trait:magic-ineptitude')&&previewBuild(b).summary.mp>0)add(3,'Garlean Magic Ineptitude forbids an MP pool unless replaced by a compatible alternate trait.');

 if(race?.id===GARIF_ID&&(b.level!==1||b.carry))add(3,'Garif currently supports first-level creation and editing only; later ranks and multiclassing need a separate verified batch.');
 if(race?.id===GARIF_ID&&b.skillRanks){const chosen=b.racialChoices?.[GARIF_PASTORALIST]?.[0],index=Number(chosen?.split(':').at(-1));if(chosen&&!(b.skillRanks[index]>=1))add(7,'Allocate the Garif Pastoralist bonus rank to its chosen skill.');}

 if(race?.id===HUME_ID&&(b.level!==1||b.carry))add(3,'Hume currently supports first-level creation/editing only; progression and multiclassing require a separate verified batch.');

 if(race?.id===AL_BHED_ID&&(b.level!==1||b.carry))add(3,'Al Bhed currently supports first-level creation/editing only; later progression and multiclassing require a separate verified batch.');
 if(race?.id===AL_BHED_ID&&b.skillRanks){const chosen=b.racialChoices?.[AL_BHED_GENIUS]?.[0],index=Number(chosen?.split(':').at(-1));if(chosen&&!(b.skillRanks[index]>=1))add(7,'Allocate the Mechanical Genius bonus rank to its selected skill.');}








 if(race?.id==='ffd20:race:half-breed')add(2,'Half-Breed requires two legal parent races and verified inherited-trait choices. These choices are not available yet, so this race cannot be saved.');


 if(race){if(b.heritageId&&!race.data.heritages.some(h=>h.id===b.heritageId))add(2,'Invalid heritage.');if(b.disabledTraits.some(id=>!race.data.standardTraitIds.includes(id)))add(2,'Unknown standard trait.');if(b.alternateIds.some(id=>!race.data.alternateTraitIds.includes(id)))add(2,'Unknown alternate trait.');for(const error of raceTraits(b).errors)add(2,error);}
 if(race){
  const mustChoose=f=>Boolean(f?.choicePoolIds?.some(id=>!supportsRacialPool(id)));
  for(const message of racialChoiceIssues(b,race,raceTraits(b).traits,effectiveScores(b)))add(2,message);
  for(const f of raceTraits(b).traits)if(race.data.standardTraitIds.includes(f.id)&&mustChoose(f))add(2,f.name+' requires a racial choice the wizard cannot yet record.');
  for(const id of b.alternateIds){
   const f=race.features.find(f=>f.id===id),ops=replacementFor(race,id);
   if(replacementRequiresWizard(race,f))add(2,(f.name||'Alternate trait')+' requires a structured choice affecting automatic ability scores.');
   if(!ops.length||ops.some(op=>!isSupportedRaceOperation(race,op)))
    add(2,(f?.name||'Alternate trait')+' has an unresolved replacement rule.');
  }
  const heritage=race.data.heritages.find(h=>h.id===b.heritageId);
  if(heritage&&!isSupportedRaceHeritage(race,heritage))add(2,'Selected heritage needs a verified replacement and automatic ability-score vector or a required choice control.');
 }

 if(race?.id==='ffd20:race:mutant'){
  for(const issue of mutantRollIssues(b,{requireComplete:complete}))add(2,issue);
 }
 if(race?.id==='ffd20:race:mutant')add(3,'Mutant requires random level-based ability increases and replaces standard fourth-level ability increases. The current wizard cannot safely calculate this progression, so automated character saving is disabled until its progression is implemented.');
 if(b.archetypeId==='ffd20:archetype:red-mage:ishgardian-heretic'&&!raceTraits(b).traits.some(f=>f.name.toLowerCase()==='elemental resistance'))add(3,'Ishgardian Heretic requires the Elemental Resistance racial trait.');
 if(classHasSpells(b)&&race?.id==='ffd20:race:immortal')add(3,'Immortal Magic Ineptitude forbids obtaining an MP pool; this casting class is not currently supported for this race. You can explore its rules, but cannot save this incompatible automated build.');
 if(classHasSpells(b)&&race?.id==='ffd20:race:shindroid'&&!b.alternateIds.includes('ffd20:race:shindroid:trait:magitek-unit'))add(3,'Shindroid Magic Ineptitude forbids obtaining an MP pool without Magitek Unit; this casting build cannot be saved unless Magitek Unit is selected.');
 if(classHasSpells(b)&&race?.id==='ffd20:race:antica')add(3,'Antica cannot normally cast spells without Silent Spell or Telepathic Spellcaster. The current casting wizard cannot verify this exception; you can inspect Antica rules but cannot save this automatic build.');
 if(classHasSpells(b)&&race?.id==='ffd20:race:tonkin')add(3,'Tonkin cannot normally cast vocal-component spells, and Silent Spell/Telepathic Spellcaster compatibility is not yet verified in this casting wizard. Character saving is blocked until supported.');
 if(race?.id==='ffd20:race:kindred'){
  if(b.alternateIds.includes('ffd20:race:kindred:trait:maw-or-claw'))add(2,'Kindred Maw or Claw requires selecting one natural attack package, unsupported by the wizard; character saving is blocked.');
 }
 if(race?.id==='ffd20:race:loporrit'){
  const active=new Set(raceTraits(b).traits.map(f=>f.id));
  for(const [trait,description] of [['explorer','Explorer Knowledge specialty'],['hydaelyns-spark','Hydaelyn Spark skill'],['purpose-driven','Purpose-Driven class skill']])if(active.has('ffd20:race:loporrit:trait:'+trait))add(2,'Loporrit '+description+' requires an explicit racial skill selection; current wizard cannot store it, so save is blocked.');
 }
 if(race?.id==='ffd20:race:sahagin'){
  if(raceTraits(b).traits.some(f=>f.id==='ffd20:race:sahagin:trait:tempered'))add(2,'Sahagin Tempered requires choosing either water or ice resistance. Race choice storage is not implemented; save is blocked.');
 }
 if(race?.id==='ffd20:race:viera'){
  const active=new Set(raceTraits(b).traits.map(f=>f.id));
  if(active.has('ffd20:race:viera:trait:mist-sight'))add(2,'Viera Mist Sight requires one selected spell-like ability (not all three). Race-specific selection is not yet supported; save is blocked until the spell choice can be recorded.');
 }
 if(isRedMage(b)){for(const issue of redMageIssues(b,effectiveScores(b),{complete}))add(issue.step,issue.message);return errors;}
 if(isBard(b)){for(const issue of bardIssues(b,effectiveScores(b),{complete}))add(issue.step,issue.message);return errors;}
 if(isLevelOneClass(b)){for(const issue of levelOneIssues(b,{complete,scores:effectiveScores(b),race:raceFor(b),racial:raceTraits(b)}))add(issue.step,issue.message);return errors;}
 if(isArcher(b)){for(const issue of archerIssues(b,{complete}))add(issue.step,issue.message);return errors;}
 if(!classFor(b))add(3,'Unknown or unavailable class.');
 if(!Number.isInteger(b.level)||b.level<1||b.level>20||buildLevel(b)>20)add(3,'Choose a Black Mage level from 1 to 20.');
 if(b.archetypeId)add(3,'This archetype is not ready for automatic application. Choose base Black Mage for this release.');
 const effective=effectiveScores(b);if(effective.int>45)add(1,'Effective Intelligence above 45 needs a verified bonus-MP table extension.');
 if(complete){
  if(hpHistory(b).some(n=>!Number.isInteger(n)||n<1||n>6))add(4,'Invalid recorded class HP. Review this character’s HP history.');
  if(b.favored.slice(0,b.level).some(v=>!['','hp','skill','racial'].includes(v)))add(4,'Invalid favored class reward.');
  const seen=new Map();for(const event of choiceEvents(b)){const options=eligibleOptions(b,event),chosen=b.choices[event.id]||[],count=calculated(event.count,b);if(chosen.length!==count||chosen.some(id=>!options.some(o=>o.id===id)))add(4,`Level ${event.atClassLevel}: choose ${count} for ${registry.class.choicePools.find(p=>event.poolIds.includes(p.id))?.name}.`);for(const id of chosen){const o=options.find(o=>o.id===id);seen.set(id,(seen.get(id)||0)+1);if(o&&seen.get(id)>(o.repeatLimit||1))add(4,'Repeat limit exceeded for '+o.name+'.');}}
  const s=blackMageSummary(Math.min(20,Math.max(1,b.level)),Math.min(45,mageCastingInt(b))),chosen=b.spellIds.map(id=>spells.find(s=>s.id===id));
  if(chosen.some(x=>!x)||new Set(b.spellIds).size!==b.spellIds.length)add(5,'Invalid or duplicate learned spell.');
  if(chosen.some(x=>x&&x.level>s.spellLevel))add(5,'A learned spell exceeds the level or Intelligence requirement.');
  const counts=spellCounts(b);if(chosen.filter(x=>x?.level===0).length!==counts.cantrips||chosen.filter(x=>x?.level>0).length!==counts.leveled)add(5,`Choose ${counts.cantrips} cantrips and ${counts.leveled} other spells.`);
  const limits=[];for(let level=1;level<=b.level;level++){const count=level===1?Math.max(3,3+(b.initialIntMod??mod(mageCastingInt(b)))):2;for(let i=0;i<count+([7,12,17].includes(level)?1:0);i++)limits.push(Math.min(9,Math.ceil(level/2)));}
  const levels=chosen.filter(x=>x?.level>0).map(x=>x.level).sort((a,b)=>a-b);if(levels.some((level,i)=>limits[i]!==undefined&&level>limits[i]))add(5,'Some spells were not available at the level their learning opportunity was gained. Choose more lower-level spells.');
  if(!b.reviewed)add(6,'Confirm you have reviewed the character preview.');
 }
 return errors;
}
export function sanitizeBuild(raw){
 const b=newBuild(),keys=Object.keys(b);if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!keys.includes(k))||raw.version!==registry.version)bad('Unsupported character build.');
 if(raw.carry!==undefined&&raw.carry!==null){if(typeof raw.carry!=='object'||Array.isArray(raw.carry)||JSON.stringify(raw.carry).length>25000)bad('Invalid previous class data.');b.carry=structuredClone(raw.carry);}
 for(const k of ['name','alignment','bio','portrait','raceId','heritageId','archetypeId','classId']){const v=k==='classId'?(raw.classId??BLACK_MAGE_ID):raw[k];if(typeof v!=='string'||v.length>(k==='portrait'?160000:k==='bio'?2000:k==='name'?80:250))bad('Invalid '+k+'.');b[k]=v;}if(!classFor(b))bad('Class not enabled.');
 if(!raw.baseScores||Object.keys(raw.baseScores).some(k=>!stats.includes(k)))bad('Invalid base scores.');for(const k of stats){if(!Number.isInteger(raw.baseScores[k])||raw.baseScores[k]<1||raw.baseScores[k]>45)bad('Invalid base scores.');b.baseScores[k]=raw.baseScores[k];}
 for(const k of ['disabledTraits','alternateIds','spellIds']){if(!Array.isArray(raw[k])||raw[k].length>400||raw[k].some(v=>typeof v!=='string'||v.length>250))bad('Invalid '+k+'.');b[k]=uniq(raw[k]);}
 if(raw.spellSelections!==undefined&&raw.spellSelections!==null){const groups=raw.spellSelections;if(!groups||typeof groups!=='object'||Array.isArray(groups)||Object.keys(groups).some(k=>!['cantrips','leveled'].includes(k)))bad('Invalid spell slots.');for(const k of ['cantrips','leveled'])if(!Array.isArray(groups[k])||groups[k].length>200||groups[k].some(v=>v!==null&&(typeof v!=='string'||v.length>250)))bad('Invalid spell slots.');if(JSON.stringify([...groups.cantrips,...groups.leveled].filter(Boolean))!==JSON.stringify(b.spellIds))bad('Spell slots do not match learned spells.');b.spellSelections=structuredClone(groups);}
 if(raw.skillRanks!==undefined&&raw.skillRanks!==null){if(!Array.isArray(raw.skillRanks)||raw.skillRanks.length!==fixedSkills.length||raw.skillRanks.some(n=>!Number.isInteger(n)||n<0||n>20))bad('Invalid skill ranks.');b.skillRanks=[...raw.skillRanks];}
 for(const k of ['racialChoices','racialSpecialties']){const value=raw[k]??{};if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>10)bad('Invalid '+k+'.');for(const [id,v] of Object.entries(value)){if(id.length>250||(k==='racialChoices'?(!Array.isArray(v)||v.length>(b.raceId==='ffd20:race:yagudo'&&id===YAGUDO_RANK_LANGUAGES?40:20)||v.some(x=>typeof x!=='string'||x.length>250)):(typeof v!=='string'||v.length>80)))bad('Invalid '+k+'.');}b[k]=structuredClone(value);}
 for(const k of ['hpRolls','favored']){if(!Array.isArray(raw[k])||raw[k].length>20)bad('Invalid level selections.');b[k]=raw[k].slice();}
 if(raw.abilityMethod!==undefined){if(!['manual','point-buy','array','rolled'].includes(raw.abilityMethod))bad('Unknown score method.');b.abilityMethod=raw.abilityMethod;}
 if(raw.pointBudget!==undefined){if(![10,15,20,25].includes(raw.pointBudget))bad('Invalid point budget.');b.pointBudget=raw.pointBudget;}
 if(raw.scorePool!==undefined){if(!Array.isArray(raw.scorePool)||raw.scorePool.length>6||raw.scorePool.some(n=>!Number.isInteger(n)||n<3||n>18))bad('Invalid score pool.');b.scorePool=[...raw.scorePool];}
 if(raw.scoreAssignments!==undefined){if(!Array.isArray(raw.scoreAssignments)||raw.scoreAssignments.length!==6)bad('Invalid score assignments.');b.scoreAssignments=[...raw.scoreAssignments];}
 if(raw.initialIntMod!==undefined&&raw.initialIntMod!==null){if(!Number.isInteger(raw.initialIntMod)||raw.initialIntMod< -5||raw.initialIntMod>20)bad('Invalid initial INT.');b.initialIntMod=raw.initialIntMod;}
 if(raw.initialChaMod!==undefined&&raw.initialChaMod!==null){if(!Number.isInteger(raw.initialChaMod)||raw.initialChaMod<0||raw.initialChaMod>17)bad('Invalid starting Charisma modifier.');b.initialChaMod=raw.initialChaMod;}
 if(raw.mutantRolls!==undefined){
  if(!raw.mutantRolls||typeof raw.mutantRolls!=='object'||Array.isArray(raw.mutantRolls)||
    JSON.stringify(raw.mutantRolls).length>8000)bad('Invalid Mutant roll records.');
  b.mutantRolls=structuredClone(raw.mutantRolls);
  const error=mutantRollIssues(b)[0];if(error)bad(error);
 }
 if(raw.abilityIncreases!==undefined){if(!raw.abilityIncreases||typeof raw.abilityIncreases!=='object'||Array.isArray(raw.abilityIncreases)||Object.keys(raw.abilityIncreases).length>5)bad('Invalid level ability increases.');for(const [level,key] of Object.entries(raw.abilityIncreases)){if(!['4','8','12','16','20'].includes(level)||Number(level)>buildLevel({...b,level:raw.level})||!stats.includes(key))bad('Invalid level ability increase.');b.abilityIncreases[level]=key;}}
 if(!raw.choices||typeof raw.choices!=='object'||Array.isArray(raw.choices)||Object.keys(raw.choices).length>100)bad('Invalid choices.');
 for(const values of Object.values(raw.choices))if(!Array.isArray(values)||values.length>10||values.some(id=>typeof id!=='string'||id.length>250))bad('Invalid choice.');
 const validIds=new Set(choiceEvents({...b,level:20,choices:raw.choices}).map(e=>e.id));b.choices={};for(const [k,v] of Object.entries(raw.choices)){if(!validIds.has(k))bad('Invalid choice.');b.choices[k]=v;}
 if(typeof raw.reviewed!=='boolean'||!Number.isInteger(raw.level))bad('Invalid build.');b.reviewed=raw.reviewed;b.level=raw.level;
 if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(b.name+b.bio+b.alignment))bad('Invalid character text.');
 if(b.portrait&&!/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(b.portrait))bad('Invalid portrait.');
 const errors=buildIssues(b);if(errors.length)bad(errors[0].message);return b;
}
const skillId=row=>'skill:'+row.name.toLowerCase().replace('knw: ','knowledge-').replaceAll(' ','-');
export function previewBuild(b){
 const preview=classPreview(b);return {...preview,skillBudget:preview.skillBudget+racialSkillRanks(b,b.level)};
}
function classPreview(b){
 if(isRedMage(b))return redMagePreview(b,{scores:effectiveScores(b),race:raceFor(b),racial:raceTraits(b),hpRolls:hpHistory(b)});
 if(isBard(b))return bardPreview(b,{scores:effectiveScores(b),race:raceFor(b),racial:raceTraits(b),hpRolls:hpHistory(b)});
 if(isLevelOneClass(b)){const scores=effectiveScores(b);return levelOnePreview(b,{scores,race:raceFor(b),racial:raceTraits(b),hpRolls:hpHistory(b)});}
 if(isArcher(b)){const scores=effectiveScores(b);return archerPreview(b,{scores,race:raceFor(b),racial:raceTraits(b),hpRolls:hpHistory(b),carriedLevels:carriedLevels(b)});}
 const scores=effectiveScores(b),ownSummary=blackMageSummary(b.level,mageCastingInt(b)),summary={...ownSummary,
 skillPerLevel:Math.max(1,4+mod(scores.int)),bab:ownSummary.bab+Number(b.carry?.bab||0),fort:ownSummary.fort+Number(b.carry?.fort||0),ref:ownSummary.ref+Number(b.carry?.ref||0),will:ownSummary.will+Number(b.carry?.will||0),baseMp:ownSummary.baseMp+Number(b.carry?.mpClass||0),bonusMp:ownSummary.bonusMp+Number(b.carry?.mpBonus||0),mp:ownSummary.mp+Number(b.carry?.mpClass||0)+Number(b.carry?.mpBonus||0)},race=raceFor(b),racial=raceTraits(b);
 const featureIds=new Set(registry.class.data.events.filter(e=>e.type==='grant_feature'&&e.atClassLevel<=b.level).flatMap(e=>e.featureIds));
 for(const event of choiceEvents(b))for(const id of b.choices[event.id]||[]){const opt=eligibleOptions(b,event).find(o=>o.id===id);for(const f of opt?.featureIds||[])featureIds.add(f);}
 const features=registry.class.features.filter(f=>featureIds.has(f.id));
 const favored=b.favored.slice(0,b.level),hp=hpHistory(b).reduce((s,n)=>s+Math.max(1,(Number(n)||0)+mod(scores.con)),0)+favored.filter(v=>v==='hp').length;
 const carriedHp=Number(b.carry?.hpMax||0)+carriedLevels(b)*(mod(scores.con)-mod(b.carry?.con||scores.con));
 return {scores,summary,race,racial,features,hp:hp+carriedHp,skillBudget:Number(b.carry?.skillBudget||0)+carriedLevels(b)*(mod(scores.int)-mod(b.carry?.int??scores.int))+summary.skillPerLevel*b.level+favored.filter(v=>v==='skill').length};
}
function allowedNamazuNewMilestone(old,raw){
 if(old?.raceId!=='ffd20:race:namazu'||raw?.raceId!==old.raceId||
    !old.alternateIds?.includes('ffd20:race:namazu:trait:focused-study')||
    !raw.alternateIds?.includes('ffd20:race:namazu:trait:focused-study'))return false;
 const now=buildLevel(raw),before=buildLevel(old);
 if(now!==before+1||![8,16].includes(now))return false;
 const pool=namazuFocusSlot(now),original=old.racialChoices||{},updated=raw.racialChoices||{};
 if((original[pool]||[]).length||!Array.isArray(updated[pool])||updated[pool].length!==1)return false;
 const strip=choices=>Object.fromEntries(Object.entries(choices).filter(([id])=>id!==pool));
 return JSON.stringify(strip(original))===JSON.stringify(strip(updated));
}
// Existing selected languages are permanent; unfilled slots can be added as
// Linguistics ranks increase. No earlier language or unrelated racial pick changes.
function allowedYagudoLanguageGrowth(old,raw){
 if(old?.raceId!=='ffd20:race:yagudo'||raw?.raceId!==old.raceId||
   old.disabledTraits?.includes('ffd20:race:yagudo:trait:valiant-linguist')||
   old.alternateIds?.some(id=>['magical-linguist','stability','sturdy-feathers'].some(x=>id.endsWith(':trait:'+x))))return false;
 const oldChoices=old.racialChoices||{},newChoices=raw.racialChoices||{};
 const prior=oldChoices[YAGUDO_RANK_LANGUAGES]||[],next=newChoices[YAGUDO_RANK_LANGUAGES]||[];
 if(!Array.isArray(prior)||!Array.isArray(next)||next.length<prior.length||
    !prior.every((value,i)=>value===next[i]))return false;
 const ranks=raw.skillRanks?.[YAGUDO_LINGUISTICS_ROW];
 if(!Number.isInteger(ranks)||ranks<0||ranks>20||next.length>2*ranks)return false;
 const strip=choices=>Object.fromEntries(Object.entries(choices).filter(([key])=>key!==YAGUDO_RANK_LANGUAGES));
 return JSON.stringify(strip(oldChoices))===JSON.stringify(strip(newChoices));
}
const allowedNewRacialChoices=(old,raw)=>allowedNamazuNewMilestone(old,raw)||allowedYagudoLanguageGrowth(old,raw);
export function compileBuild(raw,previous={}, {allowRankReduction=false,append=false,levelTransition=false}={}){
 if(previous.rulesBuild?.input){
  const original=previous.rulesBuild.input;
  if(original.raceId===raw?.raceId){
   if((original.heritageId||'')!==(raw.heritageId||''))bad('Race heritage is chosen at character creation and is permanent.');
   if(JSON.stringify([...(original.alternateIds||[])].sort())!==JSON.stringify([...(raw.alternateIds||[])].sort()))bad('Alternate racial traits are chosen at character creation and are permanent.');
  }
 }
 // These starting and racial Knowledge choices are permanent once the character is saved.
 if(previous.rulesBuild?.input&&previous.rulesBuild.input.raceId===raw?.raceId){
  const raceId=raw.raceId,original=previous.rulesBuild.input;
  const fixedPools={
   'ffd20:race:genome':['bonus-languages'],
   'ffd20:race:gria':['bonus-languages','weapon-focus-weapon'],
   'ffd20:race:nu-mou':['sagacious-two-knowledge'],
   'ffd20:race:pupu':['technological-savant-specialty'],
   'ffd20:race:guado':['bonus-languages','summoner-element'],
   'ffd20:race:viera':['elemental-summoner-subtype'],
   'ffd20:race:ixal':['bond-to-the-ice-selection','elemental-summoner-selection'],
   'ffd20:race:lamia':['bond-to-the-land-selection','tempered-selection'],
   'ffd20:race:hypello':['bonus-languages'],
   'ffd20:race:mandragora':['bonus-languages'],
   'ffd20:race:palico':['starting-second-language','high-intelligence-bonus-languages'],
   'ffd20:race:kindred':['languages-selection','high-intelligence-bonus-languages'],
   'ffd20:race:shindroid':['race-simulation-humanoid'],
   'ffd20:race:syricta':['memories-knowledge-skills']
  }[raceId]||[];
  for(const suffix of fixedPools){
   const pool=raceId+':pool:'+suffix;
   if(JSON.stringify(original.racialChoices?.[pool]||[])!==JSON.stringify(raw.racialChoices?.[pool]||[]))
    bad('Starting racial language and Knowledge choices cannot be changed after character creation.');
  }
 }
 if(previous.rulesBuild?.input?.raceId==='ffd20:race:yagudo'&&
    !allowedYagudoLanguageGrowth(previous.rulesBuild.input,raw)&&
    JSON.stringify(previous.rulesBuild.input.racialChoices?.[YAGUDO_RANK_LANGUAGES]||[])!==
    JSON.stringify(raw.racialChoices?.[YAGUDO_RANK_LANGUAGES]||[]))
   bad('Previously chosen Yagudo Linguistics languages cannot be replaced or removed. New selections require available Linguistics ranks.');
 if(previous.rulesBuild?.input?.raceId==='ffd20:race:namazu'){
  const original=previous.rulesBuild.input;
  for(const at of NAMAZU_FOCUS_LEVELS){
   const slot=namazuFocusSlot(at),oldChoices=original.racialChoices?.[slot]||[],newChoices=raw?.racialChoices?.[slot]||[];
   if(JSON.stringify(oldChoices)!==JSON.stringify(newChoices)&&
       !(at===buildLevel(raw)&&allowedNamazuNewMilestone(original,raw)))
    bad('Namazu Focused Study choices cannot be changed after their level is completed.');
  }
 }
 if(previous.rulesBuild?.input?.raceId==='ffd20:race:quadav'){
  const pool='ffd20:race:quadav:pool:bond-to-the-land-selection';
  if((raw?.racialChoices?.[pool]||[]).join('|')!==(previous.rulesBuild.input.racialChoices?.[pool]||[]).join('|'))
   bad('Quadav Bond to the Land terrain is chosen at character creation and is permanent.');
 }
 if(previous.rulesBuild?.input?.raceId==='ffd20:race:syricta'){
  const original=previous.rulesBuild.input;
  for(const pool of [SYRICTA_ELEMENT,SYRICTA_BREATH])
   if(JSON.stringify(original.racialChoices?.[pool]||[])!==JSON.stringify(raw?.racialChoices?.[pool]||[]))
    bad('Syricta elemental resistance and breath shape are chosen at character creation and cannot be changed during editing.');
 }
 if(previous.rulesBuild?.input?.raceId===GARLEAN_ID){
  const initial=previous.rulesBuild.input;
  for(const pool of [GARLEAN_WEAPON,GARLEAN_CRAFT])if((raw?.racialChoices?.[pool]||[]).join('|')!==(initial.racialChoices?.[pool]||[]).join('|'))bad('Garlean starting racial choices cannot be changed during editing.');
  if((raw?.racialSpecialties?.[GARLEAN_CRAFT]||'')!==(initial.racialSpecialties?.[GARLEAN_CRAFT]||''))bad('Garlean technology Craft specialty cannot be changed during editing.');
 }
 if(previous.rulesBuild?.input?.raceId===GARIF_ID){
  const original=previous.rulesBuild.input;
  for(const pool of [GARIF_TERRAIN,GARIF_PASTORALIST])if((raw?.racialChoices?.[pool]||[]).join('|')!==(original.racialChoices?.[pool]||[]).join('|'))bad('Existing Garif terrain and first-level Pastoralist allocation cannot be changed during editing.');
 }
 if((isLevelOneClass(raw)&&!supportsSheetProgression(raw)||isBard(raw))&&raw.level!==1)bad('This class currently supports level-1 testing only.');
 if((supportsSheetProgression(raw)||isRedMage(raw))&&previous.rulesBuild&&!levelTransition&&raw.level!==previous.rulesBuild.input.level)bad('Use Level up to change the saved character level.');
 if((isRedMage(raw)||isSheetFamily(raw))&&previous.rulesBuild?.input&&raw.archetypeId!==previous.rulesBuild.input.archetypeId)bad('A saved character cannot change archetypes.');
 if(isRedMage(raw)&&previous.rulesBuild?.input&&(!sameBuildValue(raw.choices?.[RED_MAGERY_EVENT],previous.rulesBuild.input.choices?.[RED_MAGERY_EVENT])||!levelTransition&&!sameBuildValue(raw.choices,previous.rulesBuild.input.choices)))bad('Saved Red Magery cannot be replaced in this builder.');
 if(previous.rulesBuild?.input&&supportsSheetProgression(previous.rulesBuild.input)&&raw.archetypeId!==previous.rulesBuild.input.archetypeId)bad('A saved character cannot change archetypes.');
 if(isChaCaster(raw)&&Array.isArray(raw.spellIds)&&new Set(raw.spellIds).size!==raw.spellIds.length)bad('Choose distinct starting spells.');
 if(previous.rulesBuild?.input&&(previous.rulesBuild.input.classId||BLACK_MAGE_ID)!==(raw?.classId||BLACK_MAGE_ID))bad('A saved character cannot change classes.');
 if(isArcher(raw)||isLevelOneClass(raw)||isChaCaster(raw)||isRedMage(raw)){
  if((isLevelOneClass(raw)||isChaCaster(raw)||isRedMage(raw))&&Object.keys(previous).length&&!previous.rulesBuild)bad('Create a new first-level character; adopting an existing manual character is not supported for this class.');
  if(append||raw.carry)bad('Archer multiclassing is not yet supported.');
  if(previous.rulesBuild?.input&&(previous.rulesBuild.input.classId||BLACK_MAGE_ID)!==raw.classId)bad('A saved character cannot change its class.');
  const priorCaster=isChaCaster(raw)?previous.rulesBuild?.input:null;
  const startingCha=priorCaster?(priorCaster.initialChaMod??priorCaster.spellIds.filter(id=>spellsForBuild(priorCaster).some(s=>s.id===id&&s.level>0)).length-3-(isRedMage(priorCaster)?2*(priorCaster.level-1):0)):null;
  const b=sanitizeBuild(priorCaster&&raw.initialChaMod==null?{...raw,initialChaMod:startingCha}:raw),p=previewBuild(b);
  if(isChaCaster(b)){
   const prior=previous.rulesBuild?.input;
   // Migrate the first bounded Bard version from its actual learned song count.
   const starting=prior?startingCha:mod(p.scores.cha);
   if(b.initialChaMod!==null&&b.initialChaMod!==starting)bad('The starting spell allowance cannot be changed.');
   b.initialChaMod=starting;
   const issues=isRedMage(b)?redMageIssues(b,p.scores):bardIssues(b,p.scores);if(issues.length)bad(issues[0].message);
  }
  if(isSheetFamily(b)&&previous.rulesBuild?.input&&!levelTransition&&!sameBuildValue(b.choices,previous.rulesBuild.input.choices))bad('Saved class choices cannot be replaced in this builder.');
  if(supportsMartialProgression(b)&&previous.rulesBuild?.input){const old=previous.rulesBuild.input;if(old.archetypeId!==b.archetypeId)bad('A saved character cannot change archetypes.');for(const event of martialChoiceEvents({...b,level:1}))if(old.choices?.[event.id]&&JSON.stringify(old.choices[event.id])!==JSON.stringify(b.choices?.[event.id]))bad('The starting gun arm cannot be replaced in the builder.');}
  if(isBeastmaster(b)&&previous.rulesBuild&&JSON.stringify(b.choices[COMPANION_EVENT])!==JSON.stringify(previous.rulesBuild.input.choices?.[COMPANION_EVENT]))bad('The starting companion cannot be replaced in this builder. The 24-hour companion ceremony and replacement are handled manually.');
  if(!allowRankReduction&&previous.rulesBuild&&b.skillRanks?.some((n,i)=>n<Number(previous.rulesBuild.rankFloor?.[i]??previous.rulesBuild.input.skillRanks?.[i]??0)))bad('Confirmed skill ranks cannot be reduced.');
  return compileNoncastingBuild(b,previous,{preview:p,raceTraits,calculated,rankFloor:previous.rulesBuild?.rankFloor});
 }
 const previousManaged=append?null:previous.rulesBuild;
 const expectedCarry=append?carryCharacter(previous):previousManaged?.input?.carry;
 if(!sameCarry(raw?.carry,expectedCarry))bad('Previous class data cannot be replaced.');
 if(!append&&!previousManaged&&Object.keys(previous).length&&Array.isArray(previous.classes)&&previous.classes.some(c=>c.name!=='Black Mage'))bad('Add Black Mage through Level up to preserve existing classes.');
 const normalized={...raw,hpRolls:Array.isArray(raw?.hpRolls)?hpHistory(raw):raw?.hpRolls};
 const candidate=previousManaged?.input?.initialIntMod!==undefined?{...normalized,initialIntMod:previousManaged.input.initialIntMod}:normalized;
 const b=sanitizeBuild(candidate),p=previewBuild(b),next=structuredClone(previous);
 if(!allowRankReduction&&previousManaged&&b.skillRanks?.some((n,i)=>n<Number(previousManaged.rankFloor?.[i]??previousManaged.input.skillRanks?.[i]??0)))bad('Confirmed skill ranks cannot be reduced.');
 if(!previousManaged)b.initialIntMod=mod(mageCastingInt(b));
 const ownedKeys=['hp_max','bab','fort_base','ref_base','will_base','mp_class','mp_bonus','mp_max_spell_level','speed','size_category','languages','senses','proficiencies'];
 // Explicit first adoption retains a rollback snapshot; unknown/manual entries are preserved.
 const rollback=previous.rulesBuild?.rollback||structuredClone(previous);
 Object.assign(next,p.scores,{charName:b.name.trim(),alignment:b.alignment,bio:b.bio,portrait:b.portrait,source:'FFD20',race:p.race.name,class:'Black Mage',level:b.level,class_level:b.level,character_level:b.level,total_level:b.level,classes:[{name:'Black Mage',level:b.level,archetype:''}],archetype:'',hp_max:p.hp,bab:p.summary.bab,fort_base:p.summary.fort,ref_base:p.summary.ref,will_base:p.summary.will,mp_class:p.summary.baseMp,mp_bonus:p.summary.bonusMp,mp_max_spell_level:p.summary.spellLevel,spell_dc_base:'int'});
 const effects=p.racial.traits.flatMap(f=>f.effects).filter(e=>e.automation==='automatic'&&!e.condition),lang=[],senses=[],profs=[];
 next.speed=0;next.size_category='Medium';
 seedRacialMovement(next,previous,b.raceId,p.racial.traits);
 for(const e of effects){if(e.target==='identity.speed.land')next.speed=calculated(e.value,b);if(e.target==='identity.size_category')next.size_category=String(e.textValue||'Medium').replace(/^./,c=>c.toUpperCase());if(e.target.startsWith('identity.languages.'))lang.push(e.textValue||e.target.split('.').at(-1));if(e.target.startsWith('identity.senses.'))senses.push(e.textValue||e.target.split('.').at(-1));if(e.target.startsWith('proficiencies.weapon.'))profs.push(e.textValue||e.target.split('.').at(-1).replaceAll('-',' '));}
 next.languages=uniq(lang).join(', ');next.senses=uniq(senses).join('; ');next.proficiencies=uniq([...(b.carry?.proficiencies||'').split(/,\s*/).filter(Boolean),...profs,'Dagger','Sling','Power rod','Power staff','Animated dolls','Quarterstaff','Buckler','Light shields']).join(', ');next.size=next.size_category;
 next.racialIdentity=b.carry&&previous.racialIdentity?structuredClone(previous.racialIdentity):{type:effects.find(e=>e.target==='identity.type')?.textValue||'',subtypes:uniq(effects.filter(e=>e.target==='identity.subtypes').map(e=>e.textValue).filter(Boolean)),rules:p.racial.traits.filter(f=>f.sheetTargets.includes('identity')&&f.effects.some(e=>e.target.startsWith('identity.'))).map(f=>({id:f.id,name:f.name,description:f.description}))};
 const initial=!Object.keys(previous).length;
 if(initial){next.hp_curr=p.hp;next.mp=p.summary.mp;next.mp_curr=p.summary.mp;next.mp_temp=0;next.items=[{name:'Starting outfit',type:'Gear',amount:1,desc:'Starting outfit worth up to 10 gil, granted in addition to starting wealth.',value:10,sourceRuleId:'ffd20:class:black-mage:starting-outfit'}];next.weapons=[];next.currency_gil=70;next.gil=70;b.initialIntMod=mod(mageCastingInt(b));}
 else if(next.mp===undefined&&next.mp_curr!==undefined){next.mp=next.mp_curr;next.mp_temp=0;}
 next.favoredClassBonuses=Object.fromEntries(b.favored.slice(0,b.level).map((v,i)=>[String(i+1),v]));
 const originalRows=previous.skills||fixedSkills.map(r=>({...r,lvl:0,temp:0,cs:false,subName:''}));
 next.skills=originalRows.map((row,index)=>{const r={...row};if(b.skillRanks&&index<fixedSkills.length)r.lvl=b.skillRanks[index];const id=skillId(r);const ownedClassSkill=registry.class.data.classSkills.some(s=>s.skillId===id)||racialClassSkill(b,id,index);r.cs=b.carry?.classSkills?.[index]===true||ownedClassSkill||(row.cs===true&&row.rulesClassSkill!==true);r.rulesClassSkill=ownedClassSkill;
  // Remove only the last source contribution, preserving manually entered misc bonuses.
  r.temp=Number(row.temp||0)-Number(row.rulesBonus||0);let bonus=0;
  if(b.carry)bonus=Number(b.carry.ruleBonuses?.[index]||0);
  for(const e of b.carry?[]:effects)if(e.target===`skills.${id}.bonus`||e.target===`skills.row.${index}.bonus`)bonus+=Number(calculated(e.value,b)||0);else if(e.target===`skills.${id}.class_skill`)r.cs=true;
  for(const e of effects)if(e.target===`skills.row.${index}.bonus`&&e.specialty)r.subName=e.specialty;
  if(b.level>=7&&id.startsWith('skill:knowledge-'))bonus+=Math.max(1,Math.floor(b.level/2));r.rulesBonus=bonus;r.temp+=bonus;return r;});
 const rows={activeAbilities:[],passiveAbilities:[],racialAbilities:[],feats:[],spells:[]};
 function grant(f,key){const old=previous[key]?.find(r=>r.sourceRuleId===f.id);if(previousManaged?.ownedIds?.includes(f.id)&&!old)return;
  const action=f.actions?.[0],cost=action?.costs?.[0],pool=[...registry.class.resources,...p.race.resources].find(r=>r.id===cost?.resourceId||r.id===f.id.replace(':feature:',':resource:'));const maximum=pool?Math.max(0,calculated(pool.maximum,b)||0):0;
  const row={...old,name:old?.rulesName&&old.name!==old.rulesName?old.name:f.name,desc:old?.rulesDescription&&old.desc!==old.rulesDescription?old.desc:f.description,rulesName:f.name,rulesDescription:f.description,sourceRuleId:f.id,sourceClass:'Black Mage',rulesOwned:true,...(f.featureKind==='limit_break'?{limitBreak:true}:{})};
  if(pool){const spent=old?Math.max(0,Number(old.u_max||0)-Number(old.u_curr||0)):0;row.u_max=maximum;row.u_curr=Math.max(0,maximum-spent);row.restoreOnLongRest=false;
   if(pool.maximum.kind==='formula'&&!/\b(?:min|max|floor|ceil)\b/.test(pool.maximum.expression)){row.uses_formula=pool.maximum.expression.replace(/\b(STR|DEX|CON|INT|WIS|CHA)_MOD\b/g,'{$1}').replaceAll('CLASS_LEVEL',String(b.level));row.uses_min=pool.maximum.minimum??0;}
  }
  const counter=racialCounter(b,f);if(counter){const spent=old?Math.max(0,Number(old.u_max||0)-Number(old.u_curr||0)):0;row.u_max=counter.maximum;row.u_curr=Math.max(0,counter.maximum-spent);row.restoreOnLongRest=false;}
  rows[key].push(row);
 }
 for(const f of p.features){const target=f.featureKind==='limit_break'||f.activation==='active'||f.activation==='mixed'?'activeAbilities':'passiveAbilities';grant(f,target);}
 for(const f of p.racial.traits)if(!f.effects.length||!f.effects.every(e=>e.target.startsWith('identity.')||e.target.startsWith('ability_scores.')))grant(f,'racialAbilities');
 for(let level=1;level<=buildLevel(b);level+=2){const id='comos:feat-slot:'+level,old=previous.feats?.find(f=>f.sourceRuleId===id);rows.feats.push({...old,name:old?.name||'Feat · level '+level,desc:old?.desc||'',sourceRuleId:id,rulesOwned:true,pendingFeat:old?.pendingFeat??true});}
 rows.feats.push(...racialChoiceFeats(b,p.race,p.racial.traits,previous));
 const spellMasteryBonus=choiceEvents(b).flatMap(event=>b.choices[event.id]||[]).filter(id=>id==='ffd20:class:black-mage:option:black-magery:spell-mastery').length;
 const scopedMageIntBonus=mageCastingInt(b)>p.scores.int?1:0;
 const sylphIllusion=p.racial.traits.some(f=>f.id==='ffd20:race:sylph:trait:fey-magic');
 for(const id of b.spellIds){const spell=spells.find(s=>s.id===id),old=previous.spells?.find(s=>s.sourceRuleId===id);
  const illusionBonus=sylphIllusion&&/(?:^|[^a-z])illusion(?:$|[^a-z])/i.test(spell.school||'')?1:0;
  const rulesDc=(spell.level>0?spellMasteryBonus:0)+scopedMageIntBonus+illusionBonus;
  rows.spells.push({...old,sourceRuleId:id,rulesOwned:true,sourceClass:'Black Mage',name:spell.name,desc:spell.description,lvl:spell.level,mp_cost:spell.level,casting_ability:'int',school:spell.school,range:spell.range,duration:spell.duration,saving_throw:spell.save,target:spell.target,rulesDcBonus:rulesDc,dc_misc:Number(old?.dc_misc||0)-Number(old?.rulesDcBonus||0)+rulesDc});}
 for(const key of Object.keys(rows)){const owned=new Set(previousManaged?.ownedIds||[]);next[key]=[...(previous[key]||[]).filter(r=>!r.rulesOwned||!owned.has(r.sourceRuleId)&&!rows[key].some(n=>n.sourceRuleId===r.sourceRuleId)),...rows[key]];}
 next.standardRacialTraits=p.race.data.standardTraitIds.map(id=>({name:p.race.features.find(f=>f.id===id)?.name||id,enabled:!b.disabledTraits.includes(id)&&!p.racial.replaced.includes(id)}));
 next.alternateRacialTraits=b.alternateIds.map(id=>({name:p.race.features.find(f=>f.id===id)?.name||id,enabled:true}));
 next.favored_class_options=p.race.data.favoredRewards.filter(r=>r.classId===registry.class.id).map(r=>r.description).join('\n')+'\nApply favored-class rewards manually; they are not automatically awarded.';
 const lastValues=Object.fromEntries(ownedKeys.map(k=>[k,next[k]]));
 if(previousManaged)for(const key of ownedKeys){if(key==='mp_max_spell_level')continue;const oldBase=previousManaged.lastValues?.[key];if(typeof oldBase==='number'&&typeof previous[key]==='number')next[key]+=previous[key]-oldBase;else if(oldBase!==undefined&&previous[key]!==oldBase)next[key]=previous[key];}
 next.castingProfiles=[...(b.carry?.castingProfiles||[]),{className:'Black Mage',mode:'full',ability:'int',casterLevel:b.level,highestSpellLevel:p.summary.spellLevel}];
 if(b.carry){next.classes=[...structuredClone(b.carry.classes),{name:'Black Mage',level:b.level,archetype:''}];next.languages=b.carry.languages;next.senses=b.carry.senses;next.speed=b.carry.speed;next.size=next.size_category=b.carry.size;next.class=next.classes[0].name;next.class_level=next.classes[0].level;next.level=next.character_level=next.total_level=buildLevel(b);}
 next.rulesBuild={rankFloor:b.skillRanks?[...b.skillRanks]:previousManaged?.rankFloor,version:registry.version,input:b,ownedIds:Object.values(rows).flat().map(r=>r.sourceRuleId),lastValues,rollback};
 applyRacialFlatStats(next,previous,b);syncLimitBreaks(next);return next;
}
// The browser and regression fixtures use the same preparation path for every class.
export function prepareLevelUp(previous){
 if(!previous?.rulesBuild?.input)bad('Open Edit to establish this character’s reviewed class build before leveling up.');
 const baseline=withBuildDefaults(previous.rulesBuild.input,newBuild());
 if(buildLevel(baseline)>=20)bad('This character is already level 20.');
 const definition=classFor(baseline),supported=definition?.data.supportedLevels;
 if(Array.isArray(supported)&&!supported.includes(baseline.level+1))bad(definition.name+' progression beyond level '+baseline.level+' is not enabled yet.');
 baseline.hpRolls=hpHistory(baseline);
 baseline.skillRanks=fixedSkills.map((_,i)=>Number(previous.skills?.[i]?.lvl??baseline.skillRanks?.[i]??0));
 const build=structuredClone(baseline);build.level++;build.hpRolls.push(classDefaultHp(build));
 build.initialIntMod=!hasSpellcasting(classFor(build))||isChaCaster(build)?baseline.initialIntMod??null:baseline.initialIntMod??mod(effectiveScores(baseline).int);
 build.reviewed=false;
 return {build,baseline};
}
export function levelUpBuild(raw,previous){
 if(isBard(raw)||isBard(previous.rulesBuild?.input))bad('Bard currently supports level-1 testing only; level-up is not enabled.');
 if((isLevelOneClass(raw)||isLevelOneClass(previous.rulesBuild?.input))&&!supportsSheetProgression(raw))bad('This class currently supports level-1 testing only; level-up is not enabled.');
 if(supportsSheetProgression(raw)||isRedMage(raw)||isRedMage(previous.rulesBuild?.input)){
  const raceLimits=buildIssues(raw,{complete:false}).filter(i=>i.step===3);if(raceLimits.length)bad(raceLimits[0].message);
  const stored=previous.rulesBuild?.input;
  const old=stored?withBuildDefaults(stored,newBuild()):null,same=sameBuildValue;
  raw=withBuildDefaults(raw,newBuild());
  if(!old||!(supportsSheetProgression(old)||isRedMage(old))||raw.level!==old.level+1||raw.level>20)bad('Level up adds exactly one level, up to level 20.');
  for(const key of ['name','alignment','bio','portrait','baseScores','raceId','heritageId','disabledTraits','alternateIds','archetypeId','classId','carry','favored','initialChaMod','abilityMethod','pointBudget','scorePool','scoreAssignments'])if(!same(raw[key],old[key]))bad('Level up cannot change '+({baseScores:'existing ability scores',initialChaMod:'the starting spell allowance',raceId:'race',heritageId:'heritage',disabledTraits:'standard racial traits',alternateIds:'alternate racial traits',archetypeId:'archetype',classId:'class',carry:'previous class data',favored:'favored-class rewards',abilityMethod:'the ability score method',pointBudget:'the point-buy budget',scorePool:'recorded ability rolls',scoreAssignments:'ability score assignments'}[key]||key)+'.');
  for(const key of ['racialChoices','racialSpecialties'])if(!same(raw[key]??{},old[key]??{})&&!(key==='racialChoices'&&allowedNewRacialChoices(old,raw)))bad('Level up cannot change racial choices.');
  const boosts={...(old.abilityIncreases||{})};if(raw.level%4===0){if(!stats.includes(raw.abilityIncreases?.[raw.level]))bad('Choose a +1 ability increase.');boosts[raw.level]=raw.abilityIncreases[raw.level];}
  if(!same(raw.abilityIncreases||{},boosts))bad('Only the current milestone grants a boost.');
  if(!same(raw.hpRolls,[...hpHistory(old),classDefaultHp(raw)]))bad('Record the class default HP for the new level.');
  if(!Array.isArray(raw.skillRanks)||raw.skillRanks.some((n,i)=>n<Number(previous.skills?.[i]?.lvl||0)))bad('Level up cannot remove existing skill ranks.');
  for(const [id,value] of Object.entries(old.choices||{}))if(!same(raw.choices?.[id],value))bad('Earlier talent/feat choices cannot be changed on level up.');
  if(isRedMage(raw)&&old.spellIds.some(id=>!raw.spellIds?.includes(id)))bad('Level up cannot remove learned Red Mage spells.');
  return compileBuild(raw,previous,{levelTransition:true});
 }
 if(isArcher(raw)){
  const old=previous.rulesBuild?.input;if(!old||old.classId!==ARCHER_ID)bad('This is not an Archer build.');
  if(raw.level!==old.level+1||raw.level>20)bad('Archer level up adds exactly one level.');
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  for(const k of ['name','alignment','bio','portrait','baseScores','raceId','heritageId','disabledTraits','alternateIds','archetypeId','classId'])if(!same(raw[k],old[k]))bad('Level up cannot change '+k+'.');
  for(const k of ['racialChoices','racialSpecialties'])if(!same(raw[k]??{},old[k]??{})&&!(k==='racialChoices'&&allowedNewRacialChoices(old,raw)))bad('Level up cannot change racial choices.');
  const boosted={...(old.abilityIncreases||{})};
  if(raw.level%4===0){if(!stats.includes(raw.abilityIncreases?.[raw.level]))bad('Choose a +1 ability increase.');boosted[raw.level]=raw.abilityIncreases[raw.level];}
  if(!same(raw.abilityIncreases||{},boosted))bad('Only the current milestone grants a boost.');
  if(!same(raw.hpRolls,[...hpHistory(old),classDefaultHp(raw)]))bad('Archer gains 5 base HP per new level.');
  if(!Array.isArray(raw.skillRanks)||raw.skillRanks.some((n,i)=>n<Number(previous.skills?.[i]?.lvl||0)))bad('Level up cannot remove existing skill ranks.');
  if(raw.spellIds?.length||raw.initialIntMod!==null&&raw.initialIntMod!==undefined)bad('Archer has no spellbook.');
  for(const [id,v] of Object.entries(old.choices||{}))if(!same(raw.choices?.[id],v))bad('Earlier talent/feat choices cannot be changed on level up.');
  if(!same(raw.favored,old.favored))bad('Favored rewards remain manual.');
  const next=compileBuild(raw,previous),current=sheetStats(next);next.hp_curr=current.hpMax;next.mp=next.mp_curr=0;next.mp_temp=0;return next;
 }
 const old=previous.rulesBuild?.input;if(!sameCarry(raw?.carry,old?.carry))bad('Previous class data cannot be replaced.');if(!old)bad('Open Edit to establish this character’s reviewed class build before leveling up.');
 if(buildLevel(old)>=20||raw.level!==old.level+1)bad('Level up adds exactly one level, up to level 20.');
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 for(const key of ['name','alignment','bio','portrait','baseScores','raceId','heritageId','disabledTraits','alternateIds','archetypeId'])if(!same(raw[key],old[key]))bad('Level up cannot change '+key+'. Use Edit instead.');
 for(const k of ['racialChoices','racialSpecialties'])if(!same(raw[k]??{},old[k]??{})&&!(k==='racialChoices'&&allowedNewRacialChoices(old,raw)))bad('Level up cannot change racial choices.');
 const boosts={...(old.abilityIncreases||{})};if(buildLevel(raw)%4===0){if(!stats.includes(raw.abilityIncreases?.[buildLevel(raw)]))bad('Choose one ability to increase by +1.');boosts[buildLevel(raw)]=raw.abilityIncreases[buildLevel(raw)];}
 if(!same(raw.abilityIncreases||{},boosts))bad('Only the current milestone grants a new +1 ability increase.');
 if(!same(raw.hpRolls,[...hpHistory(old),4]))bad('Black Mage gains 4 base HP at this level.');
 if(raw.skillRanks&&raw.skillRanks.some((n,i)=>n<Number(previous.skills?.[i]?.lvl||0)))bad('Level up cannot remove existing skill ranks.');
 if(old.spellIds.some(id=>!raw.spellIds.includes(id)))bad('Level up cannot remove learned spells.');
 for(const [id,values] of Object.entries(old.choices))if(!same(raw.choices[id],values))bad('Level up cannot replace earlier class choices.');
 if(!same(raw.favored,old.favored))bad('Favored rewards are applied manually.');
 const expectedInitial=old.initialIntMod??mod(effectiveScores(old).int);if(raw.initialIntMod!==expectedInitial)bad('Starting spell entitlement is fixed at creation.');
 if(old.hpRolls.length<old.level){previous=structuredClone(previous);previous.rulesBuild.lastValues.hp_max=previewBuild({...old,hpRolls:hpHistory(old)}).hp;}
 const next=compileBuild(raw,previous),current=sheetStats(next);next.hp_curr=current.hpMax;next.mp=current.mpMax;next.mp_curr=current.mpMax;next.mp_temp=0;return next;
}

export function classFeatureChanges(build,baseline){
 if(isRedMage(build)){const after=previewBuild(build),before=baseline?previewBuild(baseline):null,prior=new Map((before?.features||[]).map(f=>[f.id,f]));return after.features.map(feature=>({feature,kind:!prior.has(feature.id)?'new':!sameBuildValue(feature.state,prior.get(feature.id).state)?'upgrade':null})).filter(row=>row.kind);}
 if(isChaCaster(build))return previewBuild(build).features.filter(f=>!baseline||!previewBuild(baseline).features.some(old=>old.id===f.id)).map(feature=>({feature,kind:'new'}));
 if(isLevelOneClass(build)){
  const after=previewBuild(build),before=baseline?previewBuild(baseline):null,oldFeatures=new Map((before?.features||[]).map(f=>[f.id,f]));
  const signature=(f,b,scores)=>({name:f.name,state:f.state||{},description:(f.progressionDescription||f.description).replace(/Current at level \d+:/g,'Current:'),counter:sheetFamilyCounter(b,f,scores)||martialCounter(b,f,scores)});
  return after.features.map(feature=>{const old=oldFeatures.get(feature.id),current=(sheetFamilyCounter(build,feature,after.scores)||martialCounter(build,feature,after.scores))?.maximum,previous=old?(sheetFamilyCounter(baseline,old,before.scores)||martialCounter(baseline,old,before.scores))?.maximum:undefined;return {feature,kind:!old?'new':!sameBuildValue(signature(feature,build,after.scores),signature(old,baseline,before.scores))?'upgrade':null,...(Number.isFinite(current)&&current!==previous?{resourceChange:{previous,current}}:{})};}).filter(row=>row.kind);
 }
 if(isArcher(build))return archerFeatureChanges(build,baseline);
 const after=previewBuild(build).features,before=baseline?previewBuild(baseline).features:[],oldIds=new Set(before.map(f=>f.id));
 const signature=(f,b)=>JSON.stringify({selectionCount:Object.values(b.choices||{}).flat().filter(id=>registry.class.choicePools.some(pool=>pool.options.some(o=>o.id===id&&o.featureIds.includes(f.id)))).length,resources:registry.class.resources.filter(r=>r.id===f.id.replace(':feature:',':resource:')||f.actions?.some(a=>a.costs?.some(c=>c.resourceId===r.id))).map(r=>calculated(r.maximum,b)),effects:(f.effects||[]).map(e=>calculated(e.value,b)),notes:(f.scalingNotes||[]).filter(n=>n.fromClassLevel<=b.level)});
 return after.map(feature=>({feature,kind:!oldIds.has(feature.id)?'new':baseline&&signature(feature,build)!==signature(feature,baseline)?'upgrade':null})).filter(row=>row.kind);
}
export const hasSpellcasting=definition=>Boolean(definition?.data?.spellcasting&&definition.data.spellcasting.learningMode!=='none');

export function appendClassBuild(raw,previous){
 if(isRedMage(raw)||isRedMage(previous.rulesBuild?.input))bad('Red Mage multiclassing is not enabled.');
 if(isBard(raw)||isBard(previous.rulesBuild?.input))bad('Bard multiclassing is not enabled.');
 if(isLevelOneClass(raw)||isLevelOneClass(previous.rulesBuild?.input))bad('Multiclassing is not enabled for the level-1 test classes.');
 if(isArcher(raw))bad('Archer multiclassing is not yet verified. Create or level up an Archer for now.');
 if(raw.level!==1)bad('A new class begins at level 1.');
 const carry=carryCharacter(previous);if(!sameCarry(raw.carry,carry))bad('Previous class data cannot be replaced.');if(JSON.stringify(raw.hpRolls)!=='[4]')bad('A new class adds 4 base HP after character level 1.');const milestones=raw.abilityIncreases||{},total=buildLevel(raw);if(total%4===0?Object.keys(milestones).length!==1||!stats.includes(milestones[total]):Object.keys(milestones).length!==0)bad('Choose one ability increase only at a character-level milestone.');if(raw.initialIntMod!==null&&raw.initialIntMod!==mod(effectiveScores(raw).int))bad('Starting spell entitlement uses the new class starting modifier.');if(buildLevel({...raw,carry})>20)bad('Total level cannot exceed 20.');
 if(!Array.isArray(raw.skillRanks)||raw.skillRanks.some((n,i)=>n<carry.ranks[i]))bad('Adding a class cannot reduce existing skill ranks.');
 const scores=effectiveScores(raw);for(const k of stats){const before=Number(previous[k]),growth=buildLevel(raw)%4===0&&raw.abilityIncreases?.[buildLevel(raw)]===k?1:0;if(scores[k]!==before+growth)bad('Adding a class preserves existing ability scores.');}
 for(const [key,old] of [['name',previous.charName],['alignment',previous.alignment||''],['bio',previous.bio||''],['portrait',previous.portrait||'']])if(raw[key]!==old)bad('Adding a class preserves '+key+'.');
 if(raceFor(raw)?.name!==previous.race)bad('Adding a class preserves race.');
 const next=compileBuild(raw,previous,{append:true}),s=sheetStats(next);next.hp_curr=s.hpMax;next.mp=next.mp_curr=s.mpMax;next.mp_temp=0;return next;
}
