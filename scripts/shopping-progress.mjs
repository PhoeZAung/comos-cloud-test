#!/usr/bin/env node
// Production-aware shopping audit: staging != runtime JSON != QNAP deployment.
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';

const base=new URL('../',import.meta.url);
export function normalizeName(v){
 return String(v??'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[–—]/g,'-').replace(/[^\p{L}\p{N}]+/gu,'');
}
export function normalizeSource(v){
 try{const u=new URL(v);return (u.hostname.toLowerCase().replace(/^www\./,'')+u.pathname.replace(/\/$/,'')+u.search).toLowerCase();}
 catch{return '';}
}
export function recordSystem(x){
 const url=String(x.sourceUrl??x.raw?.['Source URL']??'');
 if(/finalfantasyd20\.com/i.test(url))return 'ffd20';
 if(/aonprd\.com/i.test(url))return 'pathfinder';
 const sys=String(x.sourceSystem??x.raw?.['Source System']??'').toLowerCase();
 return sys.includes('ffd20')?'ffd20':sys.includes('pathfinder')||sys.includes('aon')?'pathfinder':'unknown';
}
export function fraction(n,denominator){return denominator?Number((100*n/denominator).toFixed(1)):null;}
export function computeProgress(queue,master,manifest,supplemental={items:[]},bulk={items:[]}){
 if(queue.schemaVersion!=='cosmos.shopping-review-queue.v1'||!Array.isArray(queue.candidates))throw Error('Invalid shopping queue');
 if(!Array.isArray(master.items)||master.items.length!==manifest.count)throw Error('Catalog manifest count mismatch');
 if(supplemental?.schemaVersion && supplemental.schemaVersion!=='cosmos.shopping-approved-batch.v1')throw Error('Invalid supplemental runtime JSON');
 if(!Array.isArray(supplemental.items))throw Error('Invalid supplemental items');
 if(bulk?.schemaVersion&&bulk.schemaVersion!=='cosmos.shopping-bulk-metadata.v1')throw Error('Invalid bulk shopping JSON');
 if(!Array.isArray(bulk.items))throw Error('Invalid bulk shopping items');
 const seen=new Set(),matched=[];
 const names=new Map();
 for(const item of master.items){
  const name=normalizeName(item.name);
  if(!name)continue;
  if(!names.has(name))names.set(name,[]);
  names.get(name).push(item);
 }
 for(const c of queue.candidates){
  if(!c.id||seen.has(c.id))throw Error('Duplicate/invalid candidate ID: '+c.id);
  seen.add(c.id);
  if(!['pending','approved','rejected'].includes(c.reviewState)||!['not_added','added'].includes(c.masterJsonState)||!['unverified','verified'].includes(c.productionState))throw Error('Invalid review state');
  const rows=names.get(normalizeName(c.name))??[];
  const sameSystem=rows.filter(row=>recordSystem(row)===c.sourceSystem);
  const sameSource=sameSystem.filter(row=>normalizeSource(row.sourceUrl??row.raw?.['Source URL'])===normalizeSource(c.sourceUrl));
  const sameSupplement=supplemental.items.filter(row=>row.id===c.id&&normalizeName(row.name)===normalizeName(c.name)&&
    recordSystem(row)===c.sourceSystem&&normalizeSource(row.sourceUrl)===normalizeSource(c.sourceUrl)&&
    row.priceGil===c.priceAmount);
  const sameBulk=bulk.items.filter(row=>row.id===c.id&&normalizeName(row.originalName)===normalizeName(c.name)&&
    recordSystem(row)===c.sourceSystem&&normalizeSource(row.sourceUrl)===normalizeSource(c.sourceUrl)&&
    row.originalCurrency===c.currency&&row.reviewStatus==='metadata-only'&&
    (c.currency!=='gil'||row.priceGil===c.priceAmount));
  if(c.masterJsonState==='added'&&
     !(sameSource.length||(sameSupplement.length&&c.reviewState==='approved')||sameBulk.length))
    throw Error('Catalog marked added without a reviewed matching runtime source: '+c.id);
  if(c.productionState==='verified'&&!(c.masterJsonState==='added'&&c.productionEvidence?.qnapCommitSha?.length===40&&c.productionEvidence?.browserCheckedAt))throw Error('Production verified without QNAP receipt and browser test: '+c.id);
  matched.push({candidateId:c.id,name:c.name,sourceSystem:c.sourceSystem,masterMatch:sameSource.length?'same-source':sameSystem.length?'same-system-other-source':rows.length?'other-system-only':'not-found',masterJsonState:c.masterJsonState,productionState:c.productionState});
 }
 const denominator=queue.candidates.length, reviewStaged=denominator;
 const source=queue.sourceAudit;
 const integrated=matched.filter((m)=>m.masterJsonState==='added').length;
 const verified=matched.filter((m)=>m.productionState==='verified').length;
 return {schemaVersion:'cosmos.shopping-progress.v1',scope:`${denominator} missing/ambiguous candidates vs historical snapshot, not the entire Pathfinder/FFd20 item universe`,
  historicalCatalog:{manifestCount:manifest.count,archiveVersion:manifest.version},
  sourcePages:{total:source.siteCategoriesTotal,ffd20Total:source.ffd20Categories,aonTotal:source.aonCategories,
   ffd20Attempted:source.ffd20PagesAttempted,ffd20YieldingRows:source.ffd20PagesWithRows,
   attemptedPercent:fraction(source.ffd20PagesAttempted,source.ffd20Categories),
   yieldingRowsPercent:fraction(source.ffd20PagesWithRows,source.ffd20Categories),
   freshRowsNotDeduplicated:source.ffd20RowsParsedOrIndexed},
  candidatePipeline:{total:denominator,reviewJsonStaged:{count:reviewStaged,percent:fraction(reviewStaged,denominator)},
   approvedForImport:{count:queue.candidates.filter(c=>c.reviewState==='approved').length,percent:fraction(queue.candidates.filter(c=>c.reviewState==='approved').length,denominator)},
   masterJsonIntegrated:{count:integrated,percent:fraction(integrated,denominator)},
   verifiedLiveOnQnap:{count:verified,percent:fraction(verified,denominator)}},
  comparisonWithCurrentRepoMaster:{sameSource:matched.filter(m=>m.masterMatch==='same-source').length,
   sameSystemElsewhere:matched.filter(m=>m.masterMatch==='same-system-other-source').length,
   otherSystemOnly:matched.filter(m=>m.masterMatch==='other-system-only').length,
   notFound:matched.filter(m=>m.masterMatch==='not-found').length},
  warnings:['Runtime JSON now includes approved items and metadata-only bulk entries; runtime records and rules are NOT verified live without QNAP deployment.',
   'A merged GitHub commit cannot prove QNAP production is current. Live requires QNAP release receipt plus authenticated browser verification.',
   `Legacy 5,604-item archive is preserved independently of these ${denominator} audit candidates. Page counts do not prove item-level completeness.`,
   'No automatic AoN extraction after robots.txt HTTP 403.']
 };
}
export async function loadProgress(){
 const [q,m,compressed,approved,bulk]=await Promise.all([
  readFile(new URL('./docs/shopping/review-queue.json',base),'utf8'),
  readFile(new URL('./backend/items/catalog/manifest.json',base),'utf8'),
  readFile(new URL('./backend/items/catalog/master-items.json.gz',base)),
  readFile(new URL('./backend/items/catalog/ffd20-verified-batch-01.json',base),'utf8'),
  readFile(new URL('./backend/items/catalog/shopping-bulk-02.json',base),'utf8')
 ]);
 const queue=JSON.parse(q),manifest=JSON.parse(m);
 const bytes=gunzipSync(compressed,{maxOutputLength:16000000});
 if(createHash('sha256').update(bytes).digest('hex')!==manifest.sha256)throw Error('Master catalog checksum mismatch');
 return computeProgress(queue,JSON.parse(bytes),manifest,JSON.parse(approved),JSON.parse(bulk));
}
export function asMarkdown(p){
 const a=p.candidatePipeline,s=p.sourcePages;
 return [
  '# Shopping extraction and Cosmos publication — progress',
  '',
  'Scope: **'+a.total+' review candidates** from the AoN + FFd20 audit, rather than a claim about all rules/items on either site.',
  '',
  '| Stage | Done | Percentage |',
  '|---|---:|---:|',
  '| FFd20 category pages visited | '+s.ffd20Attempted+'/'+s.ffd20Total+' | '+s.attemptedPercent+'% |',
  '| FFd20 category pages yielding parsed/indexed records | '+s.ffd20YieldingRows+'/'+s.ffd20Total+' | '+s.yieldingRowsPercent+'% |',
  '| Candidates in review-only JSON | '+a.reviewJsonStaged.count+'/'+a.total+' | '+a.reviewJsonStaged.percent+'% |',
  '| Candidates approved for Cosmos import | '+a.approvedForImport.count+'/'+a.total+' | '+a.approvedForImport.percent+'% |',
  '| Candidates included in deployable runtime catalog JSON | '+a.masterJsonIntegrated.count+'/'+a.total+' | '+a.masterJsonIntegrated.percent+'% |',
  '| Candidates actually verified live on QNAP Cosmos | '+a.verifiedLiveOnQnap.count+'/'+a.total+' | '+a.verifiedLiveOnQnap.percent+'% |',
  '',
  '**Shipped end-to-end:** '+a.verifiedLiveOnQnap.percent+'% of the currently known candidate queue. This is **not** overall website completeness.',
  '',
  '**Existing catalog:** '+p.historicalCatalog.manifestCount+' records already in the repository master archive, independent of this new candidate queue.',
  '',
  'Master-archive name/source overlap (not import completion): '+JSON.stringify(p.comparisonWithCurrentRepoMaster)+'.',
  '',
  '> GitHub merges do not publish the production QNAP site. Live entries need a successful commit-pinned NAS deploy and authenticated site verification.',
  '',
  ...p.warnings.map(x=>'- '+x),''
 ].join('\n');
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const p=await loadProgress();console.log(process.argv.includes('--json')?JSON.stringify(p,null,2):asMarkdown(p));
}
