// Validate the data contract used by the sheet family adapter, independently of source review.
export function validateSheetFamily(c,{parent=null}={}){
 const d=c.data,base=parent?.data||d,fail=message=>{throw Error(c.id+': sheet family '+message);};
 if(JSON.stringify(d.supportedLevels)!==JSON.stringify(Array.from({length:20},(_,i)=>i+1)))fail('requires declared levels 1–20');
 const features=[...(parent?base.features:[]),...d.features],featureIds=new Set(features.map(f=>f.id));
 const pools=[...(parent?base.choicePools||[]:[]),...(d.choicePools||[])],poolIds=new Set(pools.map(p=>p.id)),options=[...pools.flatMap(p=>p.options||[]),...(d.extraOptions||[]).flatMap(x=>x.options||[])],optionIds=new Set(options.map(o=>o.id));
 if(poolIds.size!==pools.length)fail('duplicate choice pool');
 for(const extra of d.extraOptions||[])if(!poolIds.has(extra.poolId))fail('extra options target unknown pool');
 for(const pool of pools)if(!pool.name||!Array.isArray(pool.options)||!pool.options.length)fail('empty or unnamed choice pool');
 for(const o of options){
  if(!o.id||!o.name||!o.description||!Number.isInteger(o.minimumLevel)||o.minimumLevel<1||o.minimumLevel>20||!Number.isInteger(o.repeatLimit)||o.repeatLimit<1||o.repeatLimit>20)fail('invalid option '+o.id);
  if(!o.sourceRefs?.length)fail('option lacks source '+o.id);
  for(const id of o.requiresOptionIds||[])if(id===o.id||!optionIds.has(id))fail('option prerequisite missing '+id);
  for(const id of o.requiresFeatureIds||[])if(!featureIds.has(id))fail('feature prerequisite missing '+id);
 }
 const events=[...(parent?base.events:[]),...(d.events||[])].filter(e=>e.type==='choose');
 for(const e of events)if(!e.poolIds?.length||e.poolIds.some(id=>!poolIds.has(id))||e.count?.kind!=='constant'||e.count.value!==1||!e.sourceRefs?.length)fail('invalid or unlinked choice event '+e.id);
 for(const r of d.resources||[]){
  if(!featureIds.has(r.featureId))fail('resource target missing '+r.featureId);
  if(r.ability&&!['str','dex','con','int','wis','cha'].includes(r.ability))fail('invalid resource ability');
  for(const k of ['base','perLevel','minimum'])if(r[k]!==undefined&&(!Number.isFinite(r[k])||r[k]<0))fail('invalid resource scalar');
  if(r.byLevel&&(!Array.isArray(r.byLevel)||r.byLevel.length!==20||r.byLevel.some(v=>!Number.isFinite(v)||v<0)))fail('invalid resource level table');
 }
 const profile=parent?d.profile||{}:d;
 if(profile.levels&&(profile.levels.length!==20||profile.levels.some((r,i)=>r.level!==i+1||['bab','fort','ref','will'].some(k=>!Number.isInteger(r[k])||r[k]<0))))fail('invalid profile progression');
 if(profile.manualSpellcasting&&(!profile.castingAbility||!profile.levels||profile.levels.some(r=>!Number.isFinite(r.baseMp)||!Number.isInteger(r.maxSpellLevel))))fail('manual caster needs source MP, spell levels and ability');
 return true;
}
