import {readFile,writeFile,open,rename,unlink,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const KINDS=['class','race','archetype'];
const STATES=['queued','in_progress','blocked','live_partial','complete'];
const directory=root=>path.join(root,'docs/imports');
const readJSON=async file=>JSON.parse(await readFile(file,'utf8'));
const exists=async file=>{try{await access(file);return true;}catch{return false;}};
const fail=message=>{throw Error(message);};
const safePath=value=>typeof value==='string'&&value.length>0&&!value.includes('\0')&&!path.isAbsolute(value)&&!value.split(/[\\/]/).includes('..');
const evidence=value=>typeof value==='string'&&value.length>0&&value.length<=2000&&(value.startsWith('https://')||safePath(value));

export function validateCatalog(catalog){
 if(catalog?.schemaVersion!=='comos.import-catalog.v1'||!Array.isArray(catalog.items))fail('Unsupported import catalog.');
 const ids=new Map();
 for(const item of catalog.items){
  if(!KINDS.includes(item.kind)||!item.id?.startsWith('ffd20:'+item.kind+':')||ids.has(item.id))fail('Invalid or duplicate import ID.');
  if(!item.name||!Number.isInteger(item.order)||item.order<1||!safePath(item.definitionFile)||!/^(rules|src)\//.test(item.definitionFile))fail('Invalid import record.');
  if(!/^https:\/\/finalfantasyd20\.com\//.test(item.source?.url)||!/^[a-f0-9]{64}$/.test(item.source?.sha256)||!safePath(item.source?.archivePath)||!item.source.archivePath.startsWith('pages/'))fail('Missing or invalid archived source evidence.');
  ids.set(item.id,item);
 }
 for(const item of catalog.items)if(item.kind==='archetype'&&ids.get(item.parentId)?.kind!=='class')fail('Archetype has no catalogued parent class.');
 return catalog;
}

export function progressFor(progress,item){
 return {state:'queued',stage:'source-review',cursor:'Start of source review',nextAction:item.scopeHint,scope:'',note:'',coverage:'partial',reviewEvidence:'',evidence:[],...progress.items[item.id]};
}

export function validateProgress(catalog,progress){
 validateCatalog(catalog);
 if(progress?.schemaVersion!=='comos.import-progress.v1'||!Number.isInteger(progress.revision)||progress.revision<1||!progress.items||Array.isArray(progress.items))fail('Unsupported import progress.');
 if(!Array.isArray(progress.schedule)||!progress.schedule.length||progress.schedule.some(k=>!KINDS.includes(k))||!Number.isInteger(progress.schedulePosition)||progress.schedulePosition<0||progress.schedulePosition>=progress.schedule.length)fail('Invalid batch schedule.');
 const ids=new Set(catalog.items.map(i=>i.id));let active=0;
 for(const [id,checkpoint] of Object.entries(progress.items)){
  if(!ids.has(id)||!STATES.includes(checkpoint.state))fail('Unknown checkpoint ID or state.');
  if(checkpoint.state==='in_progress')active++;
  for(const field of ['stage','cursor','nextAction','scope','note','reviewEvidence'])if(checkpoint[field]!==undefined&&(typeof checkpoint[field]!=='string'||checkpoint[field].length>8000))fail('Invalid checkpoint '+field+'.');
  if(!Array.isArray(checkpoint.evidence)||checkpoint.evidence.length>100||checkpoint.evidence.some(v=>!evidence(v)))fail('Invalid checkpoint evidence.');
  if(checkpoint.state==='complete'&&(checkpoint.coverage!=='full'||!checkpoint.scope?.trim()||!checkpoint.evidence.length||!evidence(checkpoint.reviewEvidence)))fail('Full completion requires declared scope, full coverage and review/validation evidence.');
 }
 if(active>1)fail('Only one import item may be active.');
 if(!Array.isArray(progress.history))fail('Invalid checkpoint history.');
 return progress;
}

export async function observeRepository(root,catalog){
 const warnings=[];
 async function manifest(file,key){
  try{const value=await readJSON(path.join(root,file));if(!Array.isArray(value[key]))throw Error('missing '+key+' list');return value;}
  catch(error){warnings.push(file+': '+error.message);return {[key]:[]};}
 }
 const classes=await manifest('rules/classes/manifest.json','classes');
 const archetypes=await manifest('rules/classes/archetypes/manifest.json','archetypes');
 const races=await manifest('rules/manifest.json','races');
 const classEntries=new Map(classes.classes.map(c=>[c.id,c]));
 const archetypeEntries=new Map(archetypes.archetypes.map(a=>[a.id,a]));
 const result=new Map();
 for(const item of catalog.items){
  const entry=item.kind==='class'?classEntries.get(item.id):item.kind==='archetype'?archetypeEntries.get(item.id):null;
  const file=entry?.file||item.definitionFile;
  const present=await exists(path.join(root,file));let definition=null,parseError=null;
  if(present&&!item.legacy){try{definition=await readJSON(path.join(root,file));}catch(error){parseError=error.message;}}
  const registered=item.legacy||item.kind==='race'&&races.races.includes(file.replace(/^rules\//,''))||Boolean(entry);
  const available=Boolean(item.legacy||item.kind==='race'&&registered||entry?.status==='live'&&entry?.adapter);
  const levels=definition?.data?.supportedLevels;
  result.set(item.id,{definitionFile:file,definitionPresent:present,registered,available,
   reviewState:definition?.review?.state||'not-recorded',parseError,
   availability:item.kind==='race'&&available?'testing option; saving can be guarded':available?'existing live adapter':'not enabled',
   supportedLevels:Array.isArray(levels)&&levels.every(Number.isInteger)?levels:null,maximumLevel:definition?.data?.maximumLevel||definition?.data?.levels?.length||null,adapter:entry?.adapter||(item.legacy?'legacy-black-mage':null)});
 }
 result.warnings=warnings;
 return result;
}

function parentReady(item,observations){
 if(!item.parentId)return true;
 const parent=observations.get(item.parentId);
 return Boolean(parent?.definitionPresent&&parent.registered&&!parent.parseError);
}

export function chooseNext(catalog,progress,observations,{kind='all',includePartial=false}={}){
 validateProgress(catalog,progress);
 if(kind!=='all'&&!KINDS.includes(kind))fail('Choose class, race, archetype or all.');
 const active=catalog.items.find(item=>progressFor(progress,item).state==='in_progress');
 if(active){if(kind!=='all'&&kind!==active.kind)fail('Checkpoint or park the current item before starting another kind.');return active;}
 const candidate=kind=>catalog.items.filter(item=>item.kind===kind).sort((a,b)=>a.order-b.order).find(item=>{
  const state=progressFor(progress,item).state;
  return (state==='queued'||includePartial&&state==='live_partial')&&parentReady(item,observations);
 });
 if(kind!=='all')return candidate(kind)||null;
 for(let offset=0;offset<progress.schedule.length;offset++){
  const next=candidate(progress.schedule[(progress.schedulePosition+offset)%progress.schedule.length]);
  if(next)return next;
 }
 return null;
}

function moveSchedule(progress,kind){
 for(let i=0;i<progress.schedule.length;i++){
  const at=(progress.schedulePosition+i)%progress.schedule.length;
  if(progress.schedule[at]===kind){progress.schedulePosition=(at+1)%progress.schedule.length;return;}
 }
}

export function applyCheckpoint(catalog,original,id,patch,{expectedRevision=original.revision,time=new Date().toISOString()}={}){
 validateProgress(catalog,original);
 if(original.revision!==expectedRevision)fail('Checkpoint revision changed; reread the queue before writing.');
 const item=catalog.items.find(i=>i.id===id);if(!item)fail('Unknown import ID.');
 const allowed=['state','stage','cursor','nextAction','scope','note','coverage','reviewEvidence','evidence'];
 if(Object.keys(patch).some(k=>!allowed.includes(k)))fail('Unknown checkpoint field.');
 const progress=structuredClone(original),current=progressFor(progress,item),next={...current,...patch,updatedAt:time};
 if(!STATES.includes(next.state)||!['partial','full'].includes(next.coverage))fail('Invalid checkpoint state/coverage.');
 if(next.state==='blocked'&&!patch.note?.trim())fail('A blocked item needs a specific reason.');
 if(next.state==='live_partial'&&(!next.scope.trim()||!next.evidence.length))fail('A partial-live milestone needs its limits and evidence.');
 progress.items[id]=next;
 if(['blocked','live_partial','complete'].includes(next.state)&&next.state!==current.state)moveSchedule(progress,item.kind);
 progress.revision++;progress.history??=[];
 progress.history.push({revision:progress.revision,itemId:id,from:current.state,to:next.state,stage:next.stage,cursor:next.cursor,time});
 progress.history=progress.history.slice(-2000);
 validateProgress(catalog,progress);
 return progress;
}

export async function writeAtomicJSON(file,value){
 const temp=file+'.'+process.pid+'.'+randomUUID()+'.tmp';let handle;
 try{handle=await open(temp,'wx');await handle.writeFile(JSON.stringify(value,null,2)+'\n');await handle.sync();await handle.close();handle=null;await rename(temp,file);}
 finally{await handle?.close();await unlink(temp).catch(error=>{if(error.code!=='ENOENT')throw error;});}
}

async function acquireLock(file){
 for(let attempt=0;attempt<2;attempt++){
  try{const handle=await open(file,'wx');await handle.writeFile(JSON.stringify({pid:process.pid,host:os.hostname()}));return handle;}
  catch(error){
   if(error.code!=='EEXIST')throw error;
   const owner=await readJSON(file);
   if(owner.host!==os.hostname()||!Number.isInteger(owner.pid))fail('Queue lock belongs to another environment or is unreadable; inspect it before recovery.');
   try{process.kill(owner.pid,0);fail('Another queue writer is active.');}
   catch(check){if(check.code!=='ESRCH')throw check;}
   await unlink(file);
  }
 }
 fail('Could not acquire the queue checkpoint lock.');
}

export async function checkpoint(root,id,patch,options={}){
 const dir=directory(root),lockFile=path.join(dir,'.import-queue.lock'),lock=await acquireLock(lockFile);
 try{
  const catalog=await readJSON(path.join(dir,'catalog.json')),progress=await readJSON(path.join(dir,'progress.json'));
  if(patch.state==='complete'){
   const observations=await observeRepository(root,catalog),item=catalog.items.find(i=>i.id===id),observed=observations.get(id);
   if(observations.warnings.length||!observed?.available||observed.parseError||observed.reviewState!=='approved')fail('The definition is not fully reviewed/enabled. Record a partial milestone instead of full completion.');
   const maximum=observed.maximumLevel||observations.get(item?.parentId)?.maximumLevel;
   if(observed.supportedLevels&&maximum&&observed.supportedLevels.length<maximum)fail('The adapter only supports part of the progression. Record a partial milestone.');
  }
  const updated=applyCheckpoint(catalog,progress,id,patch,options);
  await writeAtomicJSON(path.join(dir,'progress.json'),updated);
  return updated;
 }finally{await lock.close();await unlink(lockFile);}
}

const md=value=>String(value??'').replaceAll('|','\\|').replaceAll('\n',' ').replaceAll('[','\\[').replaceAll(']','\\]');
export function summarize(catalog,progress,observations){
 const groups=Object.fromEntries(KINDS.map(kind=>[kind,{total:0,archived:0,definitions:0,available:0,queued:0,in_progress:0,blocked:0,live_partial:0,complete:0,waitingForParent:0}]));
 for(const item of catalog.items){const group=groups[item.kind],p=progressFor(progress,item),o=observations.get(item.id);group.total++;group.archived++;if(o?.definitionPresent&&o.registered)group.definitions++;if(o?.available)group.available++;group[p.state]++;if(p.state==='queued'&&!parentReady(item,observations))group.waitingForParent++;}
 return {revision:progress.revision,groups,repositoryWarnings:observations.warnings||[],active:catalog.items.find(i=>progressFor(progress,i).state==='in_progress')?.id||null,next:chooseNext(catalog,progress,observations)?.id||null};
}

export async function renderReports(root,catalog,progress,observations){
 const summary=summarize(catalog,progress,observations);
 const lines=['# Class and race import queue','','This is a resumable work queue. It does not execute AI work or activate rules. A Codex pause pauses implementation; the committed checkpoint remains.','','Authoritative state: [progress.json](progress.json). Source inventory: [catalog.json](catalog.json). [Resume instructions](RESUME.md).','','Partial-live support, testing availability, source archiving and full completion are separate. Conditional rules remain manual or guarded until implemented and reviewed.','','| Kind | Archived | Definitions present | Available options/paths | Queued | Partial milestones | Fully complete | Waiting for parent |','| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'];
 for(const kind of KINDS){const s=summary.groups[kind];lines.push(`| ${kind} | ${s.archived}/${s.total} | ${s.definitions} | ${s.available} | ${s.queued} | ${s.live_partial} | ${s.complete} | ${s.waitingForParent} |`);}
 if(summary.repositoryWarnings.length)lines.push('','Repository observations are incomplete; repair these files before validating/enabling rules:',...summary.repositoryWarnings.map(w=>'- '+md(w)));
 lines.push('',`Checkpoint revision: **${progress.revision}**. Active: **${summary.active||'none'}**. Next: **${summary.next||'no unblocked baseline item'}**.`,'','Default schedule: one class, three races, then one eligible archetype. An active item is resumed first. Blocked entries retain their cursor and are skipped. Parent definitions must exist before an archetype is selected.','','The race count includes testing options whose mandatory choices can still prevent saving. Full completion requires explicit full coverage and review evidence; existing limited integrations are not counted as complete.');
 for(const kind of ['class','race']){
  lines.push('',`## ${kind==='class'?'Classes':'Races'}`,'','| Order | Entry | Repository state | Work state | Resume point / next action |','| ---: | --- | --- | --- | --- |');
  for(const item of catalog.items.filter(i=>i.kind===kind).sort((a,b)=>a.order-b.order)){
   const p=progressFor(progress,item),o=observations.get(item.id);
   lines.push(`| ${item.order} | [${md(item.name)}](${item.source.url}) | ${md(o?.availability)}${o?.supportedLevels?' · levels '+o.supportedLevels.join(','):''} | ${p.state} · ${md(p.stage)} | ${md(p.cursor)}; ${md(p.nextAction)} |`);
  }
 }
 lines.push('','[All archetype entries, grouped by parent](ARCHETYPES.md).','','Raw source HTML is stored outside this Git repository. Restore the extractor workspace/local archive if it is absent in a new cloud task; the catalog retains URLs, hashes and relative cache locations.');
 const archetypes=['# Archetype import queue','','These are actual archetype pages; nested supporting pages are not counted as additional archetypes. Source records and checkpoints use permanent IDs.','','[Class/race queue](QUEUE.md) · [Resume instructions](RESUME.md)'];
 for(const parent of catalog.items.filter(i=>i.kind==='class').sort((a,b)=>a.order-b.order)){
  const children=catalog.items.filter(i=>i.parentId===parent.id);if(!children.length)continue;
  archetypes.push('',`## ${md(parent.name)} (${children.length})`,'','| Archetype | Work state | Resume point |','| --- | --- | --- |');
  for(const item of children){const p=progressFor(progress,item);archetypes.push(`| [${md(item.name)}](${item.source.url}) | ${p.state} · ${md(p.stage)} | ${md(p.cursor)}${parentReady(item,observations)?'':' · waiting for parent definition'} |`);}
 }
 await writeFile(path.join(directory(root),'QUEUE.md'),lines.join('\n')+'\n');
 await writeFile(path.join(directory(root),'ARCHETYPES.md'),archetypes.join('\n')+'\n');
 return summary;
}

function argumentsFor(argv){
 const args={command:argv.shift()||'status',id:null,flags:{},evidence:[]};
 const allowed=new Set(['json','include-partial','kind','count','state','stage','cursor','next','scope','note','coverage','review-evidence','expect-revision','evidence']);
 while(argv.length){const value=argv.shift();if(value.startsWith('--')){const key=value.slice(2);if(!allowed.has(key))fail('Unknown option '+value);if(['json','include-partial'].includes(key))args.flags[key]=true;else{const data=argv.shift();if(data===undefined)fail('Missing value for '+value);if(key==='evidence')args.evidence.push(data);else args.flags[key]=data;}}else if(!args.id)args.id=value;else fail('Unexpected argument.');}
 return args;
}

async function main(argv){
 const args=argumentsFor([...argv]),dir=directory(ROOT);
 let catalog=validateCatalog(await readJSON(path.join(dir,'catalog.json'))),progress=validateProgress(catalog,await readJSON(path.join(dir,'progress.json')));
 const observations=await observeRepository(ROOT,catalog);
 const options={kind:args.flags.kind||'all',includePartial:Boolean(args.flags['include-partial'])};
 if(['start','checkpoint','block'].includes(args.command)){
  const item=args.id?catalog.items.find(i=>i.id===args.id):chooseNext(catalog,progress,observations,options);if(!item)fail('No matching unblocked item.');
  if(args.command==='start'&&!parentReady(item,observations))fail('Parent definition must be staged before starting this archetype.');
  const patch={};for(const [flag,key] of [['state','state'],['stage','stage'],['cursor','cursor'],['next','nextAction'],['scope','scope'],['note','note'],['coverage','coverage'],['review-evidence','reviewEvidence']])if(args.flags[flag]!==undefined)patch[key]=args.flags[flag];
  if(args.evidence.length)patch.evidence=[...new Set([...progressFor(progress,item).evidence,...args.evidence])];
  if(args.command==='start')patch.state='in_progress';if(args.command==='block')patch.state='blocked';
  progress=await checkpoint(ROOT,item.id,patch,{expectedRevision:args.flags['expect-revision']===undefined?progress.revision:Number(args.flags['expect-revision'])});
  await renderReports(ROOT,catalog,progress,observations);console.log(JSON.stringify({id:item.id,revision:progress.revision,checkpoint:progressFor(progress,item)},null,2));return;
 }
 if(args.command==='next'){
  const item=chooseNext(catalog,progress,observations,options);
  console.log(item?JSON.stringify({...item,checkpoint:progressFor(progress,item),repository:observations.get(item.id)},null,2):'No unblocked baseline work. Review blocked items or use --include-partial for later milestones.');return;
 }
 if(args.command==='plan'){
  const copy=structuredClone(progress),result=[];const count=Number(args.flags.count||5);if(!Number.isInteger(count)||count<1||count>20)fail('Plan count must be 1–20.');
  for(let i=0;i<count;i++){const item=chooseNext(catalog,copy,observations,options);if(!item)break;result.push({id:item.id,name:item.name,kind:item.kind,cursor:progressFor(copy,item).cursor});copy.items[item.id]={...progressFor(copy,item),state:'live_partial'};moveSchedule(copy,item.kind);}
  console.log(JSON.stringify(result,null,2));return;
 }
 if(!['status','render'].includes(args.command))fail('Use status, next, plan, start, checkpoint, block or render.');
 const summary=args.command==='render'?await renderReports(ROOT,catalog,progress,observations):summarize(catalog,progress,observations);
 if(args.flags.json)console.log(JSON.stringify(summary,null,2));else{for(const kind of KINDS){const s=summary.groups[kind];console.log(`${kind}: ${s.total} entries; ${s.queued} queued; ${s.live_partial} partial; ${s.complete} fully complete; ${s.blocked} blocked.`);}for(const warning of summary.repositoryWarnings)console.log('Repository warning:',warning);console.log('Active:',summary.active||'none');console.log('Next:',summary.next||'none');console.log('Checkpoint revision:',summary.revision);}
}
if(process.argv[1]===fileURLToPath(import.meta.url))main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
