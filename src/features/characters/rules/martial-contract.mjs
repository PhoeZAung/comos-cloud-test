// Validate the progression data consumed by the martial save adapter.
export function validateMartialProgression(definition,{archetype=false}={}){
 const d=definition.data,fail=message=>{throw Error(definition.id+': '+message);};
 const ids=new Set(),names=new Set();
 for(const feature of d.features){if(ids.has(feature.id)||names.has(feature.name))fail('duplicate feature identity');ids.add(feature.id);names.add(feature.name);}
 if(JSON.stringify(d.supportedLevels)!==JSON.stringify(Array.from({length:20},(_,i)=>i+1)))fail('martial progression requires all twenty supported levels');
 const pools=new Map(),options=new Set();
 for(const pool of d.choicePools||[]){
  if(pools.has(pool.id)||!pool.name||!Array.isArray(pool.options)||!pool.options.length)fail('empty or duplicate choice pool');pools.set(pool.id,pool);
  for(const o of pool.options){
   if(options.has(o.id)||!o.name||!o.description||!Number.isInteger(o.minimumLevel)||o.minimumLevel<1||o.minimumLevel>20||!Number.isInteger(o.repeatLimit)||o.repeatLimit<1||o.repeatLimit>20)fail('invalid choice option '+o.id);options.add(o.id);
  }
 }
 const events=new Set();
 for(const e of d.progressionChoices||[]){
  if(events.has(e.id)||!Number.isInteger(e.atClassLevel)||e.atClassLevel<1||e.atClassLevel>20||e.count?.kind!=='constant'||e.count.value!==1||e.poolIds?.length!==1||!pools.has(e.poolIds[0]))fail('invalid progression choice event '+e.id);events.add(e.id);
 }
 if(!archetype&&d.levels.length!==20)fail('twenty progression rows are required');
 return true;
}
