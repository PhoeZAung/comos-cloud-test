// Validate the progression data consumed by the martial save adapter.
export function validateMartialProgression(definition,{archetype=false}={}){
 const d=definition.data,fail=message=>{throw Error(definition.id+': '+message);};
 const ids=new Set(),names=new Set();
 for(const feature of d.features){if(ids.has(feature.id)||names.has(feature.name))fail('duplicate feature identity');ids.add(feature.id);names.add(feature.name);}
 if(JSON.stringify(d.supportedLevels)!==JSON.stringify(Array.from({length:20},(_,i)=>i+1)))fail('martial progression requires all twenty supported levels');
 if(!archetype&&d.ammunitionProfiles?.length&&d.levels.some(row=>row.level<19?(!Number.isInteger(row.magickedAmmoPerLoad)||row.magickedAmmoPerLoad<1||row.magickedAmmoPerLoad>1000):row.magickedAmmoPerLoad!=='capacity'))fail('invalid magicked ammo allowance');
 const profileIds=new Set();for(const p of d.ammunitionProfiles||[]){if(profileIds.has(p.id)||!p.id.startsWith(definition.id+':ammo-profile:')||!p.name||!Number.isInteger(p.capacity)||p.capacity<1||p.capacity>1000||!Number.isInteger(p.minimumLevel)||p.minimumLevel<1||p.minimumLevel>20||!p.sourceRefs?.length)fail('invalid ammunition profile '+p.id);profileIds.add(p.id);}
 const pools=new Map(),options=new Set();
 for(const pool of d.choicePools||[]){
  if(pools.has(pool.id)||!pool.name||!Array.isArray(pool.options)||!pool.options.length)fail('empty or duplicate choice pool');pools.set(pool.id,pool);
  for(const o of pool.options){
   if(options.has(o.id)||!o.name||!o.description||!Number.isInteger(o.minimumLevel)||o.minimumLevel<1||o.minimumLevel>20||!Number.isInteger(o.repeatLimit)||o.repeatLimit<1||o.repeatLimit>20)fail('invalid choice option '+o.id);options.add(o.id);
  }
 }
 for(const pool of pools.values())for(const o of pool.options)if(o.grantsChoicePoolId&&(!pools.has(o.grantsChoicePoolId)||pools.get(o.grantsChoicePoolId).options.some(next=>next.grantsChoicePoolId)))fail('invalid or recursive follow-up choice pool '+o.id);
 const events=new Set();
 for(const e of d.progressionChoices||[]){
  if(events.has(e.id)||!Number.isInteger(e.atClassLevel)||e.atClassLevel<1||e.atClassLevel>20||e.count?.kind!=='constant'||e.count.value!==1||e.poolIds?.length!==1||!pools.has(e.poolIds[0]))fail('invalid progression choice event '+e.id);events.add(e.id);
 }
 if(!archetype&&d.levels.length!==20)fail('twenty progression rows are required');
 return true;
}
