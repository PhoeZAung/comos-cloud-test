// Offline, repeatable extraction from a locally supplied Kingmaker Bestiary PDF.
// Requires Poppler's pdftotext on PATH; PDF itself is NEVER uploaded to GitHub.
// Usage: node scripts/kingmaker-extract-pdf.mjs --pdf /path/Bestiary.pdf --out /tmp/kingmaker-extracted
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {extractKingmakerChapter} from './kingmaker-extract-layout.mjs';
import {withKingmakerReviewFlags} from '../src/data/kingmaker/quality.mjs';

const args=process.argv.slice(2),option=name=>{const at=args.indexOf(name);return at<0?null:args[at+1];};
const pdf=option('--pdf'),out=option('--out');
if(!pdf||!out||!pdf.toLowerCase().endsWith('.pdf'))throw Error('Usage: node scripts/kingmaker-extract-pdf.mjs --pdf FILE.pdf --out DIRECTORY');
await stat(pdf);
const source=execFileSync('pdftotext',['-enc','UTF-8','-layout',pdf,'-'],{maxBuffer:32*1024*1024,encoding:'utf8'});
const pages=source.split('\f').map((text,index)=>({page:index+1,text})).filter(page=>page.text.trim());
const chapters=[
 ['bestiary',10,66,105],['npc-codex',68,134,105]
];
await mkdir(out,{recursive:true});
const report={sourceFile:path.basename(pdf),totalPages:pages.length,chapters:{}};
// Parse both chapters before checking for headings accidentally spliced into
// another entry's field (these can span a page or chapter boundary).
const parsed=chapters.map(([category,first,last,expected])=>({
 category,expected,
 entries:extractKingmakerChapter(pages.filter(p=>p.page>=first&&p.page<=last),category)
}));
for(const chapter of parsed){
 if(chapter.entries.length!==chapter.expected)
  throw Error(chapter.category+' heading count mismatch: '+chapter.entries.length+
   ' instead of '+chapter.expected+'. Review the layout; no files updated.');
}
const knownNames=parsed.flatMap(chapter=>chapter.entries.map(entry=>entry.name));
for(const chapter of parsed){
 const {category,expected}=chapter;
 const entries=chapter.entries.map(entry=>withKingmakerReviewFlags(entry,knownNames));
 report.chapters[category]={found:entries.length,expected,
  missingCore:entries.filter(e=>e.hp===null||!Number.isFinite(e.stats.ac)||!Number.isFinite(e.stats.cr)).map(e=>e.name),
  flagged:entries.filter(e=>e.reviewFlags.length).length,
  layoutFlagged:entries.filter(e=>e.reviewFlags.some(flag=>flag.startsWith('PDF layout bleed'))).length};
 await writeFile(path.join(out,category+'.json'),JSON.stringify(entries,null,2)+'\n','utf8');
}
await writeFile(path.join(out,'review-report.json'),JSON.stringify(report,null,2)+'\n','utf8');
console.log(JSON.stringify(report,null,2));
console.log('Extraction outputs are local only. Compare curated first 10, review flags, then stage via PR. No database changes.');
