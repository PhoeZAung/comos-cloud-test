// COSMOS class extraction contract. No website/network dependency.
export const CLASS_SCHEMA='comos.rules.v1';
const fail=(path,reason)=>{throw Error('Class extraction: '+path+' — '+reason);};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const integer=(n,min=0,max=20)=>Number.isInteger(n)&&n>=min&&n<=max;
const unique=(arr,path)=>{const seen=new Set();for(const v of arr){if(seen.has(v))fail(path,'duplicate '+v);seen.add(v);}return seen;};
const safeValue=x=>typeof x==='boolean'||typeof x==='string'&&x.length<500||typeof x==='number'&&Number.isFinite(x);
const pathValid=p=>typeof p==='string'&&/^rules\/classes\/[a-z0-9-]+(?:\.class)?\.json$/.test(p);
export function validateClassManifest(m){
 if(m?.schemaVersion!=='comos.classes.manifest.v1'||!Array.isArray(m.classes))fail('manifest','invalid schema');
 unique(m.classes.map(x=>x.id),'class IDs');unique(m.classes.map(x=>x.file),'file paths');
 for(const [i,row] of m.classes.entries()){
  if(!/^ffd20:class:[a-z][a-z0-9-]*$/.test(row.id))fail('manifest/classes/'+i,'invalid class ID');
  if(!pathValid(row.file))fail('manifest/classes/'+i,'unrecognized class file path');
  if(!['live','staged'].includes(row.status))fail('manifest/classes/'+i,'invalid status');
  if(row.status==='live'&&typeof row.adapter!=='string')fail('manifest/classes/'+i,'live class requires a verified adapter');
  if(row.status==='staged'&&row.adapter!==null)fail('manifest/classes/'+i,'staged classes cannot claim an enabled adapter');
  if(row.optionFile&&!/^rules\/classes\/[a-z0-9-]+-talents\.json$/.test(row.optionFile))fail('manifest/classes/'+i,'invalid options path');
 }
 return m;
}
export function validateClassDefinition(c,{optionCatalog=null,requireComplete=true}={}){
 if(c?.schemaVersion!==CLASS_SCHEMA||c.kind!=='class'||!/^ffd20:class:[a-z][a-z0-9-]*$/.test(c.id))fail('class','invalid schema/kind/id');
 if(typeof c.name!=='string'||!c.name.trim())fail(c.id,'class name missing');
 if(!Array.isArray(c.sources)||!c.sources.some(s=>/^https:\/\//.test(s.url)))fail(c.id,'official source URL missing');
 if(!object(c.review)||!['needs_review','approved'].includes(c.review.state))fail(c.id,'explicit review state required');
 if(c.review.coverage==='scaffold'||c.sources.some(s=>/REPLACE|CHECK-OFFICIAL/i.test(s.title||'')||/\/classes\/$/.test(s.url||'')))fail(c.id,'unfinished scaffold cannot be imported');
 const d=c.data;if(!object(d))fail(c.id,'data missing');
 if(!integer(d.hitDie,4,20))fail(c.id,'invalid Hit Die');
 if(!Array.isArray(d.levels)||(requireComplete&&d.levels.length!==20)||d.levels.length>20)fail(c.id,'must transcribe all 20 progression rows');
 if(d.levels.length&&d.levels.some((r,i)=>r.level!==i+1))fail(c.id,'levels must be sequential with no gaps');
 for(const row of d.levels){
  const path=c.id+'/level/'+row.level;
  for(const k of ['bab','fort','ref','will'])if(!integer(row[k],0,30))fail(path,'invalid '+k);
  if(!Array.isArray(row.iterativeAttacks)||row.iterativeAttacks.some(n=>!integer(n,1,30)))fail(path,'invalid attack sequence');
  const attacks=Array.from({length:Math.max(0,1+Math.floor((row.bab-1)/5))},(_,i)=>row.bab-5*i);
  if(JSON.stringify(row.iterativeAttacks)!==JSON.stringify(attacks))fail(path,'iterative attacks do not match BAB');
  if(!Array.isArray(row.sourceRefs)||!row.sourceRefs.length||row.sourceRefs.some(s=>/CHECK|TODO|REPLACE/i.test(s.locator||''))||/NOT EXTRACTED|TODO/i.test(row.special||''))fail(path,'verified source row reference required; placeholder not allowed');
 }
 if(!Array.isArray(d.features)||!Array.isArray(d.upgrades)||!Array.isArray(d.events))fail(c.id,'features/upgrades/events required');
 const features=new Map(d.features.map(f=>[f.id,f]));unique(d.features.map(f=>f.id),c.id+'/features');
 const upgrades=new Map(d.upgrades.map(u=>[u.id,u]));unique(d.upgrades.map(u=>u.id),c.id+'/upgrades');
 const allIds=unique(d.events.map(e=>e.id),c.id+'/events');
 for(const f of d.features){
  if(!f.id.startsWith(c.id+':feature:')||!integer(f.atLevel,1,20)||typeof f.description!=='string'||!f.description.trim())fail(c.id+'/features/'+f.id,'invalid feature fields');
  if(!Array.isArray(f.sourceRefs)||!f.sourceRefs.length||f.sourceRefs.some(s=>/CHECK|TODO|REPLACE/i.test(s.locator||'')))fail(c.id+'/features/'+f.id,'verified source reference required');
 }
 const paired=new Map();
 for(const u of d.upgrades){
  const f=features.get(u.featureId),key=u.featureId+'@'+u.atClassLevel;
  if(!f)fail(c.id+'/upgrades/'+u.id,'unknown feature target');
  if(!integer(u.atClassLevel,1,20)||u.atClassLevel<=f.atLevel)fail(c.id+'/upgrades/'+u.id,'upgrade must be after initial grant');
  if(paired.has(key))fail(c.id+'/upgrades/'+u.id,'duplicate upgrade at same level for '+f.name);
  paired.set(key,u.id);
  if(!object(u.changes)||!Object.keys(u.changes).length||Object.values(u.changes).some(v=>!safeValue(v)))fail(c.id+'/upgrades/'+u.id,'changes must SET concrete scalar values; do not use accumulating bonuses');
  if(!Array.isArray(u.sourceRefs)||!u.sourceRefs.length||u.sourceRefs.some(s=>/CHECK|TODO|REPLACE/i.test(s.locator||'')))fail(c.id+'/upgrades/'+u.id,'verified source evidence required');
 }
 const grants=new Map(),linked=new Map();
 for(const e of d.events){
  if(!integer(e.atClassLevel,1,20))fail(c.id+'/events/'+e.id,'invalid event level');
  if(!['grant_feature','upgrade_feature','choose'].includes(e.type))fail(c.id+'/events/'+e.id,'unsupported event type');
  if(e.type==='grant_feature'){
   const f=features.get(e.featureId);
   if(!f||f.atLevel!==e.atClassLevel)fail(c.id+'/events/'+e.id,'grant must target existing feature at its acquisition level');
   grants.set(f.id,(grants.get(f.id)||0)+1);
  }
  if(e.type==='upgrade_feature'){
   const u=upgrades.get(e.upgradeId);
   if(!u||u.featureId!==e.featureId||u.atClassLevel!==e.atClassLevel)fail(c.id+'/events/'+e.id,'upgrade event must link to matching canonical upgrade');
   linked.set(u.id,(linked.get(u.id)||0)+1);
  }
  if(e.type==='choose'&&!((typeof e.poolId==='string')||(Array.isArray(e.poolIds)&&e.poolIds.length)))fail(c.id+'/events/'+e.id,'choice pool reference required (even if not yet implemented)');
 }
 for(const f of d.features)if(grants.get(f.id)!==1)fail(c.id+'/features/'+f.id,'exactly one initial grant required; upgrades are not grants');
 for(const u of d.upgrades)if(linked.get(u.id)!==1)fail(c.id+'/upgrades/'+u.id,'exactly one upgrade event required');
 if(optionCatalog){
  if(optionCatalog.parentClassId!==c.id||!Array.isArray(optionCatalog.options))fail(c.id,'choice catalog mismatch');
  unique(optionCatalog.options.map(x=>x.id),c.id+'/options');
  const optionIds=new Set(optionCatalog.options.map(x=>x.id));
  for(const o of optionCatalog.options){
   const p=c.id+'/options/'+o.id;
   if(typeof o.id!=='string'||!o.id.startsWith(c.id+':talent:'))fail(p,'option ID must be under its parent class');
   if(!integer(o.minimumLevel,1,20)||!integer(o.repeatLimit,1,20)||!o.name?.trim()||!o.description?.trim())fail(p,'invalid name, level or repeat count');
   if(!Array.isArray(o.sourceRefs)||!o.sourceRefs.length||o.sourceRefs.some(s=>/CHECK|TODO|REPLACE/i.test(s.locator||'')))fail(p,'option source reference required');
   if(o.tier!==undefined&&!['normal','advanced'].includes(o.tier))fail(p,'invalid talent tier');
   if(o.tier==='advanced'&&o.minimumLevel<12)fail(p,'advanced Bard talents cannot appear before level 12');
   for(const need of o.requiresTalentIds||[])if(!optionIds.has(need)||need===o.id)fail(p,'missing or self-referencing talent prerequisite');
   for(const need of o.requiresClassFeatureIds||[])if(!features.has(need))fail(p,'unknown class feature prerequisite');
   const seenLevels=new Set();
   for(const u of o.upgrades||[]){
    if(!integer(u.atClassLevel,1,20)||u.atClassLevel<=o.minimumLevel)fail(p,'talent upgrade must follow minimum acquisition level');
    if(seenLevels.has(u.atClassLevel))fail(p,'duplicate talent upgrade at same class level');
    seenLevels.add(u.atClassLevel);
    if(!object(u.changes)||!Object.keys(u.changes).length||Object.values(u.changes).some(v=>!safeValue(v)))fail(p,'talent upgrades must SET scalar state fields');
    if(!Array.isArray(u.sourceRefs)||!u.sourceRefs.length)fail(p,'talent upgrade must cite its source');
   }
  }
 }
 return {id:c.id,name:c.name,levels:d.levels.length,features:d.features.length,upgrades:d.upgrades.length,choices:d.events.filter(e=>e.type==='choose').length};
}
export function classAtLevel(c,level){
 if(!integer(level,1,20)||level>c.data.levels.length)fail(c.id,'invalid level');
 const upgrades=c.data.upgrades.filter(u=>u.atClassLevel<=level);
 return {row:c.data.levels[level-1],features:c.data.features.filter(f=>f.atLevel<=level).map(f=>{
   const history=upgrades.filter(u=>u.featureId===f.id).sort((a,b)=>a.atClassLevel-b.atClassLevel);
   return {...f,state:history.reduce((state,u)=>({...state,...u.changes}),{...(f.initialState||{})}),history};
 }),changes:c.data.events.filter(e=>e.atClassLevel===level)};
}

// Returns one stable talent identity with replacement-value state at the given CLASS level.
// Upgrades never create a second copy of the selected talent.
export function classTalentAtLevel(option,level){
 if(!integer(level,1,20))fail(option?.id||'talent','invalid class level');
 const history=(option?.upgrades||[]).filter(u=>u.atClassLevel<=level).sort((a,b)=>a.atClassLevel-b.atClassLevel);
 const state=history.reduce((acc,u)=>({...acc,...u.changes}),{...(option?.initialState||{})});
 return {...option,state,history,available:level>=option.minimumLevel};
}
// Shared prerequisite/slot logic for all future imported class talent catalogs.
// Caller must pass choices already made BEFORE the current selection event.
export function eligibleClassTalents(c,optionCatalog,level,selected=[]){
 if(!integer(level,1,20))fail(c?.id||'class','invalid class level');
 const ids=selected.map(x=>typeof x==='string'?x:x.id),owned=new Set(ids),count=id=>ids.filter(x=>x===id).length;
 const granted=new Set((c.data.features||[]).filter(f=>f.atLevel<=level).map(f=>f.id));
 return (optionCatalog.options||[]).filter(o=>level>=o.minimumLevel
    &&count(o.id)<o.repeatLimit
    &&(o.requiresTalentIds||[]).every(t=>owned.has(t))
    &&(o.requiresClassFeatureIds||[]).every(f=>granted.has(f)))
  .map(o=>classTalentAtLevel(o,level));
}
