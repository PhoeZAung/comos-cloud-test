import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {validateCatalog,validateProgress,progressFor,chooseNext,applyCheckpoint,checkpoint,observeRepository,summarize} from '../scripts/import-queue.mjs';

const item=(kind,slug,order,parentId=null)=>({id:`ffd20:${kind}:${slug}`,kind,name:slug,category:'core-classes',order,parentId,
 source:{url:'https://finalfantasyd20.com/'+kind+'/'+slug+'/',sha256:'1'.repeat(64),archivePath:'pages/'+kind+'/'+slug,retrievedAt:'2026-10-29T00:00:00Z'},
 definitionFile:'rules/'+kind+'/'+slug+'.json',scopeHint:'Review the source and mandatory choices.'});
function fixture(){
 const catalog={schemaVersion:'comos.import-catalog.v1',items:[item('class','bard',1),item('class','future',2),
  item('race','elvaan',1),item('race','galka',2),item('race','half-breed',3),
  item('archetype','bard:child',1,'ffd20:class:bard'),item('archetype','future:child',2,'ffd20:class:future')]};
 const progress={schemaVersion:'comos.import-progress.v1',revision:1,schedule:['class','race','race','race','archetype'],schedulePosition:0,items:{},history:[]};
 const observations=new Map(catalog.items.map(i=>[i.id,{definitionPresent:i.id!=='ffd20:class:future',registered:i.id!=='ffd20:class:future',available:false,reviewState:'needs_review'}]));
 return {catalog,progress,observations};
}
const partial={state:'live_partial',stage:'deployed',scope:'First-level baseline only; conditional mechanics manual.',evidence:['docs/review.md']};

test('committed source catalog covers all classes/races/archetypes without counting support pages as archetypes',async()=>{
 const catalog=JSON.parse(await readFile(new URL('../docs/imports/catalog.json',import.meta.url),'utf8'));
 validateCatalog(catalog);
 assert.deepEqual(['class','race','archetype'].map(k=>catalog.items.filter(i=>i.kind===k).length),[73,63,579]);
 assert.deepEqual(catalog.items.filter(i=>i.kind==='class').slice(0,2).map(i=>i.name),['Chocobo Knight','Dancer']);
 const ids=new Set(catalog.items.map(i=>i.id));assert.equal(ids.size,715);
 for(const entry of catalog.items.filter(i=>i.kind==='archetype'))assert(ids.has(entry.parentId));
 const broken=structuredClone(catalog);broken.items[0].source.sha256='g'.repeat(64);assert.throws(()=>validateCatalog(broken),/source evidence/);
 const orphan=structuredClone(catalog);orphan.items.find(i=>i.kind==='archetype').parentId='missing';assert.throws(()=>validateCatalog(orphan),/parent/);
});

test('one-class/three-race/archetype schedule advances only at milestones',()=>{
 const f=fixture();let p=f.progress;const selected=[];
 for(let n=0;n<5;n++){
  const next=chooseNext(f.catalog,p,f.observations);selected.push(next.id);
  p=applyCheckpoint(f.catalog,p,next.id,partial);
 }
 assert.deepEqual(selected,['ffd20:class:bard','ffd20:race:elvaan','ffd20:race:galka','ffd20:race:half-breed','ffd20:archetype:bard:child']);
 assert.equal(chooseNext(f.catalog,p,f.observations).id,'ffd20:class:future');
});

test('serialized active work resumes at its precise cursor and cannot acquire a second active item',()=>{
 const f=fixture();let p=applyCheckpoint(f.catalog,f.progress,'ffd20:class:bard',{state:'in_progress',stage:'runtime-adapter',cursor:'Starting song entitlement',nextAction:'Validate the selected song count'});
 p=JSON.parse(JSON.stringify(p));const next=chooseNext(f.catalog,p,f.observations);
 assert.equal(next.id,'ffd20:class:bard');assert.equal(progressFor(p,next).cursor,'Starting song entitlement');
 assert.throws(()=>applyCheckpoint(f.catalog,p,'ffd20:race:elvaan',{state:'in_progress'}),/one import item/i);
 assert.throws(()=>chooseNext(f.catalog,p,f.observations,{kind:'race'}),/current item/);
});

test('blocking preserves previous progress and skips dependencies whose parents are not staged',()=>{
 const f=fixture();let p=applyCheckpoint(f.catalog,f.progress,'ffd20:class:bard',{state:'in_progress',cursor:'Songs > starting choices',evidence:['docs/review.md']});
 p=applyCheckpoint(f.catalog,p,'ffd20:class:bard',{state:'blocked',note:'An exact choice rule needs a source locator',nextAction:'Resolve that source paragraph'});
 assert.equal(progressFor(p,f.catalog.items[0]).cursor,'Songs > starting choices');
 assert.deepEqual(progressFor(p,f.catalog.items[0]).evidence,['docs/review.md']);
 assert.equal(chooseNext(f.catalog,p,f.observations).kind,'race');
 f.observations.get('ffd20:class:bard').definitionPresent=false;
 assert.equal(chooseNext(f.catalog,p,f.observations,{kind:'archetype'}),null);
 assert.throws(()=>applyCheckpoint(f.catalog,p,'ffd20:race:elvaan',{state:'blocked'}),/specific reason/);
});

test('archiving and selectable partial support are never counted as full import completion',()=>{
 const f=fixture();let p=applyCheckpoint(f.catalog,f.progress,'ffd20:class:bard',partial);
 f.observations.get('ffd20:class:bard').available=true;
 const report=summarize(f.catalog,p,f.observations);
 assert.equal(report.groups.class.archived,2);assert.equal(report.groups.class.available,1);
 assert.equal(report.groups.class.live_partial,1);assert.equal(report.groups.class.complete,0);
 assert.throws(()=>applyCheckpoint(f.catalog,p,'ffd20:race:elvaan',{state:'complete'}),/Full completion/);
 assert.throws(()=>applyCheckpoint(f.catalog,p,'ffd20:race:elvaan',{state:'live_partial'}),/limits and evidence/);
});

async function diskFixture(){
 const root=await mkdtemp(path.join(os.tmpdir(),'comos-import-queue-')),f=fixture();
 await mkdir(path.join(root,'docs/imports'),{recursive:true});
 await writeFile(path.join(root,'docs/imports/catalog.json'),JSON.stringify(f.catalog));
 await writeFile(path.join(root,'docs/imports/progress.json'),JSON.stringify(f.progress));
 return {root,...f};
}

test('atomic disk checkpoints survive stale temporary files and reject stale revision writes',async()=>{
 const f=await diskFixture();
 try{
  const file=path.join(f.root,'docs/imports/progress.json');
  await writeFile(file+'.interrupted.tmp','{"unfinished":');
  const saved=await checkpoint(f.root,'ffd20:class:bard',{state:'in_progress',cursor:'Song choices',nextAction:'Check minimum CHA'},{expectedRevision:1});
  assert.equal(saved.revision,2);assert.equal(saved.items['ffd20:class:bard'].cursor,'Song choices');
  const before=await readFile(file,'utf8');
  await assert.rejects(checkpoint(f.root,'ffd20:class:bard',{cursor:'Overwrite from old session'},{expectedRevision:1}),/revision changed/);
  assert.equal(await readFile(file,'utf8'),before);
  const loaded=JSON.parse(await readFile(file,'utf8'));validateProgress(f.catalog,loaded);
  assert.equal(chooseNext(f.catalog,loaded,f.observations).id,'ffd20:class:bard');
  assert.equal(loaded.items['ffd20:race:elvaan'],undefined,'unrelated work was not overwritten');
 }finally{await rm(f.root,{recursive:true,force:true});}
});

test('writer locks protect active writers and recover only a dead same-host owner',async()=>{
 const f=await diskFixture();
 try{
  const lock=path.join(f.root,'docs/imports/.import-queue.lock');
  await writeFile(lock,JSON.stringify({pid:process.pid,host:os.hostname()}));
  await assert.rejects(checkpoint(f.root,'ffd20:class:bard',{state:'in_progress'}),/writer is active/);
  assert.equal(JSON.parse(await readFile(lock,'utf8')).pid,process.pid);
  await writeFile(lock,JSON.stringify({pid:999999999,host:os.hostname()}));
  const result=await checkpoint(f.root,'ffd20:class:bard',{state:'in_progress'});assert.equal(result.revision,2);
  await writeFile(lock,JSON.stringify({pid:999999999,host:'another-machine'}));
  await assert.rejects(checkpoint(f.root,'ffd20:class:bard',{cursor:'Unsafe recovery'}),/another environment/);
 }finally{await rm(f.root,{recursive:true,force:true});}
});

test('real checkpoint completion refuses an unreviewed or level-limited live definition',async()=>{
 const f=await diskFixture();
 try{
  for(const folder of ['rules/classes/archetypes','rules/class'])await mkdir(path.join(f.root,folder),{recursive:true});
  const definition={kind:'class',review:{state:'needs_review'},data:{supportedLevels:[1],levels:Array.from({length:20},()=>({}))}};
  const file=path.join(f.root,f.catalog.items[0].definitionFile);await writeFile(file,JSON.stringify(definition));
  await writeFile(path.join(f.root,'rules/classes/manifest.json'),JSON.stringify({classes:[{id:'ffd20:class:bard',file:f.catalog.items[0].definitionFile,status:'live',adapter:'level-one'}]}));
  await writeFile(path.join(f.root,'rules/classes/archetypes/manifest.json'),JSON.stringify({archetypes:[]}));
  await writeFile(path.join(f.root,'rules/manifest.json'),JSON.stringify({races:[]}));
  const patch={state:'complete',coverage:'full',scope:'All declared rules',reviewEvidence:'docs/review.md',evidence:['docs/tests.md']};
  await assert.rejects(checkpoint(f.root,'ffd20:class:bard',patch),/not fully reviewed/);
  definition.review.state='approved';await writeFile(file,JSON.stringify(definition));
  await assert.rejects(checkpoint(f.root,'ffd20:class:bard',patch),/part of the progression/);
  const observed=await observeRepository(f.root,f.catalog);assert.equal(observed.get('ffd20:class:bard').available,true);
  assert.equal(JSON.parse(await readFile(path.join(f.root,'docs/imports/progress.json'),'utf8')).revision,1);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
