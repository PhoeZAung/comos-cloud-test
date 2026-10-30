// Source-staging checks only. This module does not enable companion gameplay.
const ID='ffd20:class:beastmaster';
const fail=reason=>{throw Error('Beastmaster companion source: '+reason);};
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const text=s=>typeof s==='string'&&s.trim().length>0;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const cited=refs=>Array.isArray(refs)&&refs.length>0&&refs.every(r=>r.sourceId==='companions'&&text(r.section)&&text(r.locator));

export function validateBeastmasterCompanions(definition){
 if(definition?.id!==ID)fail('wrong class family');
 const companion=definition.data?.companion;
 if(!companion?.species)return null; // Earlier main-page-only extraction checkpoints.
 const source=definition.sources?.find(s=>s.id==='companions');
 if(source?.url!=='https://finalfantasyd20.com/classes/core-classes/beastmaster/animal-companions/'||!/^[a-f0-9]{64}$/.test(source.archiveSha256||''))fail('hashed official species source required');
 if(companion.speciesStatus!=='staged-source-only'||companion.automation!=='none')fail('source staging cannot claim runtime support');
 const groups=companion.speciesGroups,species=companion.species;
 if(!Array.isArray(groups)||!Array.isArray(species)||!species.length)fail('groups and species are required');
 if(new Set(groups.map(g=>g.id)).size!==groups.length)fail('duplicate group ID');
 const byGroup=new Map(groups.map(g=>[g.id,g]));
 if(!same([...byGroup.keys()].sort(),['animal','magical-beast','plant','vermin']))fail('all four official groups required');
 for(const g of groups){
  if(!text(g.rulesText)||!cited(g.sourceRefs))fail('group rules and source required: '+g.id);
  const expected=g.id==='magical-beast'?{requiredFeatNames:['Beast Speaker'],requiredRaceIds:[],requiredArchetypeIds:[]}:
   g.id==='plant'?{requiredFeatNames:[],requiredRaceIds:['ffd20:race:mandragora'],requiredArchetypeIds:['ffd20:archetype:beastmaster:tree-guardian']}:
   {requiredFeatNames:[],requiredRaceIds:[],requiredArchetypeIds:[]};
  for(const key of Object.keys(expected))if(!same(g.requirements?.[key],expected[key]))fail('group prerequisites must be preserved: '+g.id);
  if(!same(g.requirements.masteryRequiredFeatNames,g.id==='magical-beast'?['Beast Speaker Mastery']:[]))fail('mastery prerequisite must be preserved: '+g.id);
 }
 if(new Set(species.map(s=>s.id)).size!==species.length)fail('duplicate species ID');
 for(const [i,s] of species.entries()){
  if(!s.id?.startsWith(ID+':companion:')||!text(s.name)||s.sourceOrder!==i+1)fail('stable species identity/order required');
  if(!byGroup.has(s.groupId)||!integer(s.starterLevel,1,20)||typeof s.entryPrerequisitesText!=='string')fail('eligibility fields required: '+s.id);
  if(!text(s.startingRules)||!cited(s.sourceRefs))fail('starting rules/source required: '+s.id);
  const stats=s.startingStatistics;
  if(!stats||!['Small','Medium','Large'].includes(stats.size)||!text(stats.attacksText)||!text(stats.sourceText))fail('starting statistics required: '+s.id);
  for(const key of ['str','dex','con','int','wis','cha'])if(!(key==='int'&&stats.scores?.[key]===null)&&!integer(stats.scores?.[key],1,45))fail('invalid ability score: '+s.id+'/'+key);
  if(stats.mindless!==(stats.scores.int===null))fail('mindlessness must preserve absent Intelligence');
  if(stats.naturalArmorBonus!==null&&!integer(stats.naturalArmorBonus,0,30))fail('natural armor must be explicit or omitted/null');
  if(!Array.isArray(stats.speeds)||!stats.speeds.length||stats.speeds.some(s=>!['land','climb','swim','fly','jet'].includes(s.mode)||!integer(s.feet,1,300)))fail('invalid source movement');
  if(!Array.isArray(s.advancements))fail('advancement source sections required');
  const seen=new Set();
  for(const a of s.advancements){
   const key=a.kind+'@'+a.atClassLevel;
   if(!['advancement','mastery'].includes(a.kind)||!integer(a.atClassLevel,s.starterLevel+1,20)||seen.has(key)||!text(a.description)||!cited(a.sourceRefs))fail('invalid or duplicate deferred advancement: '+s.id);
   if(a.kind==='mastery'&&s.groupId!=='magical-beast')fail('mastery must retain magical-beast eligibility');
   seen.add(key);
  }
 }
 const candidates=species.filter(s=>s.groupId==='animal'&&s.starterLevel===1&&!s.entryPrerequisitesText).map(s=>s.id);
 if(!same(companion.firstLevelOrdinaryCandidateIds,candidates))fail('ordinary first-level candidates include a gated or later starter, or omit a source candidate');
 return {species:species.length,groups:groups.length,firstLevelOrdinaryCandidates:candidates.length,advancementBlocks:species.reduce((sum,s)=>sum+s.advancements.length,0)};
}
