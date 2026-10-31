// Reusable class-family replacement reducer. Rules are declared in source-backed data.
export function familyReplacementState(parent,archetype,level,choices={}){
 const removedFeatures=new Set(),removedEvents=new Set();
 for(const op of archetype?.data.replacements||[]){
  if(op.atClassLevel>level||op.resolution!=='resolved')continue;
  if(!op.eventOnly)for(const id of op.targetFeatureIds)removedFeatures.add(id);
  for(const id of op.targetEventIds||[])removedEvents.add(id);
 }
 for(const option of archetype?.data.choicePools?.flatMap(p=>p.options)||[])if(option.targetFeatureId&&Object.values(choices).flat().includes(option.id))removedFeatures.add(option.targetFeatureId);
 return {removedFeatures,removedEvents};
}
export function familyChoiceEvents(parent,archetype,level,choices={}){
 const {removedFeatures,removedEvents}=familyReplacementState(parent,archetype,level,choices);
 return [...parent.data.events,...(archetype?.data.events||[])].filter(e=>e.type==='choose'&&e.atClassLevel<=level&&!removedEvents.has(e.id)&&!e.poolIds.some(id=>removedFeatures.has(id.replace(':pool:',':feature:')))).sort((a,b)=>a.atClassLevel-b.atClassLevel||a.id.localeCompare(b.id));
}
export function familyFeatures(parent,archetype,level,choices={}){
 const {removedFeatures}=familyReplacementState(parent,archetype,level,choices);
 const noRemainingPool=feature=>parent.data.choicePools.some(p=>p.id.replace(':pool:',':feature:')===feature.id)&&!familyChoiceEvents(parent,archetype,20,choices).some(e=>e.poolIds.includes(feature.id.replace(':feature:',':pool:')));
 const canonical=[];
 for(const feature of [...parent.features.filter(f=>!removedFeatures.has(f.id)&&!noRemainingPool(f)),...(archetype?.data.features||[])].filter(f=>f.atLevel<=level)){
  const existing=canonical.find(f=>f.name===feature.name&&f.featureKind===feature.featureKind);
  if(existing){existing.description+='\nArchetype changes: '+feature.description;existing.supplementalFeatureIds.push(feature.id);}
  else canonical.push({...feature,supplementalFeatureIds:[]});
 }
 return canonical.map(f=>{
  const state=[...(parent.upgrades||[]),...(archetype?.data.upgrades||[])].filter(u=>[f.id,...f.supplementalFeatureIds].includes(u.featureId)&&u.atClassLevel<=level).reduce((v,u)=>({...v,...u.changes}),{...(f.initialState||{})});
  return {...f,state,description:f.description+(Object.keys(state).length?'\nCurrent progression: '+Object.entries(state).map(([k,v])=>k+' = '+v).join('; ')+'.':'')};
 });
}
