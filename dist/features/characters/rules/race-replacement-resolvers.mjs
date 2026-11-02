// Integrate disjoint source-verified race resolvers without relaxing their original guards.
// Original branch PR #46, source-specific reconciliation
function replacementForBatch46(r,id){
 const raw=r.data.alternateReplacements.filter(x=>x.addsFeatureIds.includes(id)||x.id.startsWith(id+':'));
 const prefix='ffd20:race:lambkin:trait:';
 if(r.id!== 'ffd20:race:lambkin'||id!==prefix+'polyglot')return raw;
 // Preserve the extracted record. The source specifies a whole Magic Expert
 // replacement AND a partial Languages modification, not one combined removal.
 const op=raw.find(x=>x.id===id+':replacement'&&x.operation==='modify'&&x.scope==='whole_feature'&&
  x.targetFeatureIds?.length===2&&x.targetFeatureIds.includes(prefix+'magic-expert')&&
  x.targetFeatureIds.includes(prefix+'languages')&&x.addsFeatureIds?.length===1&&x.addsFeatureIds[0]===id);
 if(!op)return raw; // Any unexpected source change remains blocked.
 return [
  {...op,id:id+':magic-expert-replacement',operation:'replace',scope:'whole_feature',
   targetFeatureIds:[prefix+'magic-expert'],description:'Polyglot replaces Magic Expert.'},
  {...op,id:id+':language-modifier',operation:'modify',scope:'part_of_feature',
   targetFeatureIds:[prefix+'languages'],addsFeatureIds:[],
   description:'Polyglot modifies Languages; keep Common, Lambkin and all normal Intelligence bonus-language choices.'}
 ];
}

// Original branch PR #47, source-specific reconciliation
function replacementForBatch47(r,id){
 const ops=r.data.alternateReplacements.filter(x=>x.addsFeatureIds.includes(id)||x.id.startsWith(id+':'));
 const prefix='ffd20:race:tonkin:trait:';
 if(r.id!=='ffd20:race:tonkin'||id!==prefix+'dancing-lantern')return ops;
 // The source replaces *only* the torchlight spell-like component. Preserve
 // the whole Lantern Bearer feature and its independent light defenses.
 const source=ops.find(op=>op.id===id+':replacement'&&op.operation==='replace'&&
  op.scope==='partial_feature'&&op.resolution==='unresolved'&&
  op.targetFeatureIds?.length===1&&op.targetFeatureIds[0]===prefix+'lantern-bearer'&&
  op.addsFeatureIds?.length===1&&op.addsFeatureIds[0]===id&&
  !(op.targetEventIds||[]).length&&!(op.addsEventIds||[]).length&&!(op.removesComponents||[]).length);
 if(!source)return ops; // Unexpected source changes remain blocked.
 return [{...source,id:id+':torchlight-modifier',operation:'modify',scope:'part_of_feature',
  resolution:'manual',description:'Dancing Lantern replaces only the at-will torchlight spell-like ability of Lantern Bearer; retain its light defenses.'}];
}

// Original branch PR #48, source-specific reconciliation
function replacementForBatch48(r,id){
 const ops=r.data.alternateReplacements.filter(x=>x.addsFeatureIds.includes(id)||x.id.startsWith(id+':'));
 const prefix='ffd20:race:quadav:trait:',water=prefix+'water-tribe';
 if(r.id!=='ffd20:race:quadav'||id!==water)return ops;
 const op=ops.find(x=>x.id===water+':replacement'&&x.operation==='replace'&&
  x.scope==='partial_feature'&&x.resolution==='unresolved'&&
  x.targetFeatureIds?.length===1&&x.targetFeatureIds[0]===prefix+'full-withdrawal'&&
  x.addsFeatureIds?.length===1&&x.addsFeatureIds[0]===water&&
  !(x.targetEventIds||[]).length&&!(x.addsEventIds||[]).length&&!(x.removesComponents||[]).length);
 if(!op)return ops;
 // Source says Full Withdrawal is replaced completely, while the swim-speed
 // component of Base Speed increases by 20. Keep its land-speed component.
 return [
  {...op,id:water+':withdrawal-replacement',scope:'whole_feature',resolution:'manual',
   description:'Water Tribe replaces Full Withdrawal.'},
  {...op,id:water+':swim-speed-modifier',operation:'modify',scope:'part_of_feature',
   resolution:'manual',targetFeatureIds:[prefix+'base-speed'],addsFeatureIds:[],
   description:'Water Tribe adds 20 ft to Base Speed swim only; land speed remains 20 ft.'}
 ];
}

// Original branch PR #49, source-specific reconciliation
function replacementForBatch49(r,id){
 const ops=r.data.alternateReplacements.filter(x=>x.addsFeatureIds.includes(id)||x.id.startsWith(id+':'));
 const moomba='ffd20:race:moomba',namazu='ffd20:race:namazu',seto='ffd20:race:seto-lion';
 const pair=(slug,targets,split)=>{
  const prefix=r.id+':trait:',fid=prefix+slug;
  const source=ops.find(x=>x.id===fid+':replacement'&&x.operation==='replace'&&
   x.scope===split.scope&&x.resolution===split.resolution&&
   JSON.stringify(x.targetFeatureIds)===JSON.stringify(targets.map(t=>prefix+t))&&
   x.addsFeatureIds?.length===1&&x.addsFeatureIds[0]===fid&&
   !(x.targetEventIds||[]).length&&!(x.addsEventIds||[]).length&&!(x.removesComponents||[]).length);
  if(!source||ops.length!==1)return ops;
  const whole=split.replaced.map(t=>({...source,id:fid+':whole-'+t,operation:'replace',scope:'whole_feature',
   resolution:'manual',targetFeatureIds:[prefix+t],description:slug+' replaces '+t+'.'}));
  return [...whole,{...source,id:fid+':speed-modifier',operation:'modify',scope:'part_of_feature',
   resolution:'manual',targetFeatureIds:[prefix+split.speed],addsFeatureIds:split.adds?[fid]:[],
   description:slug+' modifies only '+split.speed+' land movement; retain other components.'}];
 };
 if(r.id===moomba&&id===moomba+':trait:climb')
  return pair('climb',[],{scope:'whole_feature',resolution:'manual',replaced:[],speed:'base-speed',adds:true});
 if(r.id===namazu&&id===namazu+':trait:focused-study'){
  const prefix=namazu+':trait:',focus=prefix+'focused-study';
  const source=ops.find(o=>o.id===focus+':replacement'&&o.operation==='replace'&&
   o.scope==='partial_feature'&&o.resolution==='unresolved'&&
   JSON.stringify(o.targetFeatureIds)===JSON.stringify([prefix+'festive-culture',prefix+'skilled-traders'])&&
   JSON.stringify(o.addsFeatureIds)===JSON.stringify([focus])&&
   !(o.targetEventIds||[]).length&&!(o.addsEventIds||[]).length&&!(o.removesComponents||[]).length);
  // The official detailed rule explicitly replaces BOTH complete standard traits.
  return source&&ops.length===1?[{...source,scope:'whole_feature',resolution:'manual',
   description:'Focused Study replaces Festive Culture and Skilled Traders completely.'}]:ops;
 }
 if(r.id===namazu&&id===namazu+':trait:fast')
  return pair('fast',['skilled-traders','base-speed'],{scope:'partial_feature',resolution:'unresolved',replaced:['skilled-traders'],speed:'base-speed',adds:true});
 if(r.id===seto&&id===seto+':trait:faster')
  return pair('faster',['claws'],{scope:'partial_feature',resolution:'unresolved',replaced:['claws'],speed:'base-speed',adds:true});
 if(r.id===seto&&id===seto+':trait:nimble-attacks')
  return pair('nimble-attacks',['bite','fast'],{scope:'partial_feature',resolution:'unresolved',replaced:['bite','fast'],speed:'base-speed',adds:true});
 return ops;
}

// Original branch PR #50, source-specific reconciliation
function replacementForBatch50(r,id){
 const ops=r.data.alternateReplacements.filter(x=>x.addsFeatureIds.includes(id)||x.id.startsWith(id+':'));
 const base='ffd20:race:',trait=base+(r.id.slice(base.length))+':trait:';
 const exact=(slug,target,operation,scope,resolution)=>{
  const source=ops.find(x=>x.id===trait+slug+':replacement'&&x.operation===operation&&
   x.scope===scope&&x.resolution===resolution&&
   JSON.stringify(x.targetFeatureIds)===JSON.stringify(target.map(t=>trait+t))&&
   x.addsFeatureIds?.length===1&&x.addsFeatureIds[0]===trait+slug&&
   !(x.targetEventIds||[]).length&&!(x.addsEventIds||[]).length&&!(x.removesComponents||[]).length);
  return source&&ops.length===1?source:null;
 };
 if(r.id==='ffd20:race:beastkin'){
  for(const [slug,target] of [['alluring','ability-score-racial-traits'],['light-build','ability-score-racial-traits']]){
   if(id!==trait+slug)continue;
   const op=exact(slug,[target],'replace','partial_feature','unresolved');
   return op?[{...op,id:id+':ability-modifier',operation:'modify',scope:'part_of_feature',resolution:'manual',
    description:slug+' modifies one ability bonus; the other racial ability effects remain.'}]:ops;
  }
  if(id===trait+'loper'){
   const op=exact('loper',['natural-armor'],'replace','partial_feature','unresolved');
   return op?[
    {...op,id:id+':armor-replacement',scope:'whole_feature',resolution:'manual',
     description:'Loper replaces Natural Armor.'},
    {...op,id:id+':speed-modifier',operation:'modify',scope:'part_of_feature',resolution:'manual',
     targetFeatureIds:[trait+'base-speed'],addsFeatureIds:[],
     description:'Loper increases land speed from 30 to 40 feet without removing Sprinter.'}
   ]:ops;
  }
 }
 if(r.id==='ffd20:race:garlean'&&id===trait+'xenophobia-extremis'){
  const op=exact('xenophobia-extremis',['ability-score-adjustment','languages'],'modify','whole_feature','manual');
  return op?[{...op,id:id+':component-modifier',scope:'part_of_feature',
   description:'Change -2 Wisdom to -2 Charisma and prevent high-Intelligence bonus languages; keep Common.'}]:ops;
 }
 if(r.id==='ffd20:race:shindroid'){
  // These two replacements are whole-trait substitutions in the official
  // description. The extraction labels them partial/unresolved; normalize only
  // when the exact staged identity and target set still match.
  if(id===trait+'hologram-simulation'){
   const op=exact('hologram-simulation',['composite-plating','ability-score-racial-traits'],
    'replace','partial_feature','unresolved');
   return op?[{...op,scope:'whole_feature',resolution:'manual',
    description:'Hologram Simulation replaces Composite Plating and the starting Ability Score Racial Traits only; core form and hardlight projection have different size and action rules.'}]:ops;
  }
  if(id===trait+'race-simulation'){
   const op=exact('race-simulation',['immortal'],'replace','partial_feature','unresolved');
   return op?[{...op,scope:'whole_feature',resolution:'manual',
    description:'Race Simulation replaces Immortal only; select one playable humanoid race and apply its size and aging, not its other racial traits.'}]:ops;
  }
  if(id===trait+'heavy-platform'){
   const op=exact('heavy-platform',['base-speed'],'replace','partial_feature','unresolved');
   return op?[{...op,id:id+':speed-modifier',operation:'modify',scope:'part_of_feature',resolution:'manual',
    description:'Change only land speed 30 to 20 feet, retain the base-speed feature; ignore armor and encumbrance penalties.'}]:ops;
  }
  if(id===trait+'anomaly'){
   const op=exact('anomaly',['emotionless'],'replace','partial_feature','unresolved');
   return op?[
    {...op,id:id+':emotionless-replacement',scope:'whole_feature',resolution:'manual',
     description:'Anomaly replaces Emotionless.'},
    {...op,id:id+':immunity-modifier',operation:'modify',scope:'part_of_feature',resolution:'manual',
     targetFeatureIds:[trait+'robotic-immunities'],addsFeatureIds:[],
     description:'Anomaly changes the emotion/fear immunities but retains other robotic immunities.'}
   ]:ops;
  }
 }
 return ops;
}

// Original branch PR #51, source-specific reconciliation
function replacementForBatch51(r,id){
 const ops=r.data.alternateReplacements.filter(x=>x.addsFeatureIds.includes(id)||x.id.startsWith(id+':'));
 if(!r||ops.length!==1)return ops;
 const base=r.id+':trait:',sylph='ffd20:race:sylph',trollkin='ffd20:race:trollkin',forgiven='ffd20:race:forgiven';
 const verified=(slug,targets,scope,resolution)=>{
  const op=ops[0];
  return id===base+slug&&op.id===base+slug+':replacement'&&op.operation==='replace'&&
   op.scope===scope&&op.resolution===resolution&&
   JSON.stringify(op.targetFeatureIds)===JSON.stringify(targets.map(x=>base+x))&&
   op.addsFeatureIds?.length===1&&op.addsFeatureIds[0]===id&&
   !(op.targetEventIds||[]).length&&!(op.addsEventIds||[]).length&&!(op.removesComponents||[]).length;
 };
 if(r.id===sylph&&verified('improved-flight',['camouflage','beguiling-liar'],'partial_feature','unresolved')){
  const op=ops[0];
  return [{...op,id:id+':skill-replacement',scope:'whole_feature',resolution:'manual',
   description:'Improved Flight replaces Camouflage and Beguiling Liar.'},
   {...op,id:id+':speed-modifier',operation:'modify',scope:'part_of_feature',resolution:'manual',
    targetFeatureIds:[base+'base-speed'],addsFeatureIds:[],
    description:'Improved Flight modifies Base Speed land 20 to 10 ft, fly 40 to 60 ft (good maneuverability).'}];
 }
 if(r.id===trollkin&&verified('faster-healing',['thick-skin','fast-healing'],'partial_feature','unresolved')){
  return [{...ops[0],id:id+':two-part-replacement',scope:'whole_feature',resolution:'manual',
   description:'Faster Healing 2 replaces baseline Fast Healing 1 and replaces Thick Skin.'}];
 }
 if(r.id===forgiven&&verified('scion-of-mortality',['languages','type'],'whole_feature','manual')){
  return [{...ops[0],id:id+':identity-modifier',operation:'modify',scope:'part_of_feature',resolution:'manual',
   description:'Scion of Mortality removes Celestial only, retains Common, and records humanoid (hume) eligibility alongside outsider (native) without deleting racial identity.'}];
 }
 return ops;
}

// Original branch PR #53, source-specific reconciliation
function replacementForBatch53(r,id){
 const ops=r.data.alternateReplacements.filter(x=>x.addsFeatureIds.includes(id)||x.id.startsWith(id+':'));
 if(ops.length!==1)return ops;
 const source=ops[0],p=r.id+':trait:';
 const exactly=(slug,targets,operation,scope,resolution)=> id===p+slug&&
  source.id===id+':replacement'&&source.operation===operation&&source.scope===scope&&
  source.resolution===resolution&&JSON.stringify(source.targetFeatureIds)===JSON.stringify(targets.map(x=>p+x))&&
  source.addsFeatureIds?.length===1&&source.addsFeatureIds[0]===id&&
  !(source.targetEventIds||[]).length&&!(source.addsEventIds||[]).length&&!(source.removesComponents||[]).length;
 if(r.id==='ffd20:race:al-bhed'&&exactly('xenophobic',['languages'],'replace','whole_feature','manual'))
  return [{...source,id:id+':language-modifier',operation:'modify',scope:'part_of_feature',resolution:'manual',
   description:'Xenophobic modifies normal Languages to Albhedian only with no high-INT bonus language picks.'}];
 if(r.id==='ffd20:race:syricta'){
   // These exact official swaps are not full Base Speed or Type removal.
   // Retain the identity Type trait and the 20-ft land speed component.
   if(exactly('dragon-type',['type','elemental-resistance','dragon-resistances','breath-weapon'],
      'replace','partial_feature','unresolved'))
    return [
     {...source,id:id+':type-modifier',operation:'modify',scope:'part_of_feature',resolution:'manual',
      targetFeatureIds:[p+'type'],addsFeatureIds:[],description:'Dragon Type changes the humanoid/reptilian creature type to dragon.'},
     {...source,id:id+':defenses-and-breath-replacement',scope:'whole_feature',resolution:'manual',
      targetFeatureIds:[p+'elemental-resistance',p+'dragon-resistances',p+'breath-weapon'],
      description:'Dragon Type replaces Elemental Resistance, Dragon Resistances, and Breath Weapon.'}
    ];
   if(exactly('evasive-maneuvers',['darkvision','dragon-resistances'],'replace','partial_feature','unresolved'))
    return [
     {...source,id:id+':senses-and-defenses-replacement',scope:'whole_feature',resolution:'manual',
      description:'Evasive Maneuvers replaces Darkvision and Dragon Resistances.'},
     {...source,id:id+':maneuverability-modifier',operation:'modify',scope:'part_of_feature',resolution:'manual',
      targetFeatureIds:[p+'base-speed'],addsFeatureIds:[],
      description:'Evasive Maneuvers grants average fly maneuverability; retain land and fly speeds.'}
    ];
   if(exactly('memories-of-the-forgotten',['base-speed'],'replace','partial_feature','unresolved'))
    return [{...source,id:id+':flight-modifier',operation:'modify',scope:'part_of_feature',resolution:'manual',
     description:'Memories of the Forgotten removes only flight, preserves land speed, and requires two Knowledge choices.'}];

  if(exactly('wing-clipped',['base-speed','ability-score-racial-traits'],'replace','partial_feature','unresolved'))
   return [{...source,id:id+':component-modifier',operation:'modify',scope:'part_of_feature',resolution:'manual',
    description:'Wing-Clipped modifies only fly speed, maneuverability and the -2 DEX racial penalty.'}];
  if(exactly('neglected-heritage',['languages'],'replace','partial_feature','unresolved'))
   return [{...source,id:id+':language-modifier',operation:'modify',scope:'part_of_feature',resolution:'manual',
    description:'Neglected Heritage removes Draconic starting language, preserving Common.'}];
 }
 if(r.id==='ffd20:race:half-breed'&&exactly('ancestral-arms',
  ['feat-and-skill-trait-selection','offense-trait-selection'],'replace','whole_feature','manual'))
  return ['feat-and-skill-trait-selection','offense-trait-selection'].map((slug,i)=>({
   ...source,id:id+':slot-'+(i?'offense':'feat-skill'),targetFeatureIds:[p+slug],
   description:'Ancestral Arms replaces the chosen '+(i?'Offense':'Feat and Skill')+' Trait Selection slot only.'}));
 return ops;
}

export function replacementFor(r,id){
 if(!r)return [];
 const name=r.id.split(':').at(-1);
 const handler={lambkin:replacementForBatch46,tonkin:replacementForBatch47,quadav:replacementForBatch48,
  moomba:replacementForBatch49,namazu:replacementForBatch49,'seto-lion':replacementForBatch49,
  beastkin:replacementForBatch50,garlean:replacementForBatch50,shindroid:replacementForBatch50,
  sylph:replacementForBatch51,trollkin:replacementForBatch51,forgiven:replacementForBatch51,
  'al-bhed':replacementForBatch53,syricta:replacementForBatch53,'half-breed':replacementForBatch53}[name];
 return handler?handler(r,id):r.data.alternateReplacements.filter(x=>x.addsFeatureIds.includes(id)||x.id.startsWith(id+':'));
}
