// Repeatable audit; reads staged data only, never writes to the Cosmos database.
// Usage: node scripts/kingmaker-quality-report.mjs [--out report.json]
import {writeFile} from 'node:fs/promises';
import {KINGMAKER_STAGED_ENTRIES,KINGMAKER_CHAPTERS} from '../src/data/kingmaker/catalog.mjs';

const report={
 generatedAt:new Date().toISOString(),
 source:'Pathfinder Kingmaker Bestiary (First Edition)',
 totalStaged:KINGMAKER_STAGED_ENTRIES.length,
 verified:KINGMAKER_STAGED_ENTRIES.filter(e=>e.verified==='transcribed-from-PDF').length,
 chapters:KINGMAKER_CHAPTERS.map(chapter=>{
  const entries=KINGMAKER_STAGED_ENTRIES.filter(e=>e.chapter===chapter.id);
  return {
   category:chapter.id,staged:entries.length,sourceReviewed:entries.filter(e=>e.verified==='transcribed-from-PDF').length,
   withReviewFlags:entries.filter(e=>e.reviewFlags?.length).length,
   withPdfLayoutFlags:entries.filter(e=>e.reviewFlags?.some(f=>f.startsWith('PDF layout bleed'))).length,
   needsReview:entries.filter(e=>e.verified!=='transcribed-from-PDF').map(e=>({
    name:e.name,pdfPage:e.pdfPage,flags:e.reviewFlags||[]
   }))
  };
 })
};
const output=JSON.stringify(report,null,2)+'\n';
const args=process.argv.slice(2);
if(args.length>0){
 if(args.length!==2||args[0]!=='--out'||!args[1])throw Error('Usage: node scripts/kingmaker-quality-report.mjs [--out report.json]');
 await writeFile(args[1],output,'utf8');
}
console.log(JSON.stringify({
 totalStaged:report.totalStaged,verified:report.verified,
 chapters:report.chapters.map(({category,staged,sourceReviewed,withReviewFlags,withPdfLayoutFlags})=>({
  category,staged,sourceReviewed,withReviewFlags,withPdfLayoutFlags
 }))
},null,2));
