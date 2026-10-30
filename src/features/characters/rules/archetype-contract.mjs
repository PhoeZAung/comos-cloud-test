// Separate, source-traceable archetype extraction. Never activates gameplay by itself.
const invalid=(path,reason)=>{throw Error('Archetype extraction: '+path+' — '+reason);};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const level=n=>Number.isInteger(n)&&n>=1&&n<=20;
const unique=(values,path)=>{if(new Set(values).size!==values.length)invalid(path,'duplicate ID');};
const sourceRefs=refs=>Array.isArray(refs)&&refs.length>0&&refs.every(r=>r.sourceId&&r.section&&!/TODO|CHECK|REPLACE/i.test(r.locator||''));
export function validateArchetypeManifest(manifest){
 if(manifest?.schemaVersion!=='comos.archetypes.manifest.v1'||!Array.isArray(manifest.archetypes))invalid('manifest','invalid schema');
 unique(manifest.archetypes.map(x=>x.id),'manifest/ids');unique(manifest.archetypes.map(x=>x.file),'manifest/paths');
 for(const row of manifest.archetypes){
  if(!/^ffd20:archetype:[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/.test(row.id))invalid('manifest','invalid ID');
  if(!/^rules\/classes\/archetypes\/[a-z][a-z0-9-]*-[a-z][a-z0-9-]*\.archetype\.json$/.test(row.file))invalid('manifest','unsafe path');
  const supported=row.status==='live'&&((row.id==='ffd20:archetype:chocobo-knight:mog-knight'&&row.adapter==='mog-knight-level-one')||(row.id==='ffd20:archetype:chocobo-knight:deadly-lancer'&&row.adapter==='deadly-lancer-level-one')||(row.id==='ffd20:archetype:chocobo-knight:fell-rider'&&row.adapter==='fell-rider-level-one')||(row.id==='ffd20:archetype:gunbreaker:doom-slayer'&&row.adapter==='doom-slayer-level-one'));
  if(!supported&&(row.status!=='staged'||row.adapter!==null))invalid('manifest','no archetype can become live without its specialized validated adapter');
 }
 return manifest;
}
export function validateArchetypeDefinition(def,parent){
 if(def?.schemaVersion!=='comos.rules.v1'||def?.kind!=='archetype'||def.parentClassId!==parent?.id)invalid('archetype','wrong kind, parent ID, or schema');
 if(!def.id.startsWith('ffd20:archetype:'+parent.id.split(':').at(-1)+':')||!def.name?.trim())invalid(def.id,'name or ID invalid');
 if(!def.sources?.some(s=>/^https:\/\//.test(s.url)&&!/classes\/$/.test(s.url)))invalid(def.id,'source page missing');
 if(def.review?.state!=='needs_review'||def.review.coverage==='scaffold')invalid(def.id,'must be an extracted, staged archetype needing review');
 const data=def.data;
 if(!object(data)||!Array.isArray(data.replacements)||!Array.isArray(data.features)||!Array.isArray(data.upgrades))invalid(def.id,'missing feature or replacement arrays');
 if(!data.replacements.length&&!data.features.length)invalid(def.id,'no actual archetype features or replacements extracted');
 const baseIds=new Set(parent.data.features.map(f=>f.id)),added=new Set(data.features.map(f=>f.id));
 unique(data.features.map(f=>f.id),def.id+'/features');unique(data.replacements.map(r=>r.id),def.id+'/replacements');
 for(const f of data.features){
  if(!f.id.startsWith(def.id+':feature:')||!level(f.atLevel)||!sourceRefs(f.sourceRefs)||!f.description?.trim())invalid(def.id+'/features/'+f.id,'invalid feature or source locator');
 }
 for(const op of data.replacements){
  if(!op.id.startsWith(def.id+':replacement:')||!level(op.atClassLevel)||!['replace','remove','modify'].includes(op.operation))invalid(def.id+'/replacements/'+op.id,'invalid replacement rule');
  if(!['whole_feature','partial'].includes(op.scope)||!['resolved','needs_review'].includes(op.resolution))invalid(def.id+'/replacements/'+op.id,'missing replacement scope/resolution');
  if(!Array.isArray(op.targetFeatureIds)||!op.targetFeatureIds.length||op.targetFeatureIds.some(id=>!baseIds.has(id)&&!added.has(id)))invalid(def.id+'/replacements/'+op.id,'missing/unknown parent feature target');
  if((op.replacementFeatureIds||[]).some(id=>!added.has(id)))invalid(def.id+'/replacements/'+op.id,'unknown newly granted feature');
  if(!sourceRefs(op.sourceRefs))invalid(def.id+'/replacements/'+op.id,'missing official source locator');
  if(op.resolution==='resolved'&&op.scope==='partial'&&!op.componentKeys?.length)invalid(def.id+'/replacements/'+op.id,'partial replacements require exact changed components');
 }
 for(const u of data.upgrades){
  if(!level(u.atClassLevel)||(!added.has(u.featureId)&&!baseIds.has(u.featureId))||!object(u.changes)||!Object.keys(u.changes).length||!sourceRefs(u.sourceRefs))invalid(def.id+'/upgrades/'+u.id,'invalid upgrade or missing target');
  const base=parent.data.features.find(f=>f.id===u.featureId),addedFeature=data.features.find(f=>f.id===u.featureId);
  if(u.atClassLevel<=(base||addedFeature).atLevel)invalid(def.id+'/upgrades/'+u.id,'upgrade precedes acquisition');
 }
 return {id:def.id,parentClassId:parent.id,name:def.name,replacements:data.replacements.length,features:data.features.length,upgrades:data.upgrades.length};
}
