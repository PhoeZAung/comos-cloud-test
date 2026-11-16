// Offline, repeatable extraction from a locally supplied Kingmaker Bestiary PDF.
// Requires Poppler's pdftotext on PATH; PDF itself is NEVER uploaded to GitHub.
// Usage: node scripts/kingmaker-extract-pdf.mjs --pdf /path/Bestiary.pdf --out /tmp/kingmaker-extracted
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {extractKingmakerChapter} from './kingmaker-extract-layout.mjs';

const args=process.argv.slice(2),option=name=>args[args.indexOf(name)+1];
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
for(const [category,first,last,expected] of chapters){
 const entries=extractKingmakerChapter(pages.filter(p=>p.page>=first&&p.page<=last),category);
 if(entries.length!==expected)throw Error(category+' heading count mismatch: '+entries.length+' instead of '+expected+'. Review the layout; no files updated.');
 report.chapters[category]={found:entries.length,expected,
  missingCore:entries.filter(e=>e.hp===null||!Number.isFinite(e.stats.ac)||!Number.isFinite(e.stats.cr)).map(e=>e.name),
  flagged:entries.filter(e=>e.reviewFlags.length).length};
 await writeFile(path.join(out,category+'.json'),JSON.stringify(entries,null,2)+'\n','utf8');
}
await writeFile(path.join(out,'review-report.json'),JSON.stringify(report,null,2)+'\n','utf8');
console.log(JSON.stringify(report,null,2));
console.log('Extraction outputs are local only. Compare curated first 10, review flags, then stage via PR. No database changes.');
