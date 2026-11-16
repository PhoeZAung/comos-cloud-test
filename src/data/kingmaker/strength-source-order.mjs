// Strength values recovered from the user's 162-page Kingmaker Bestiary (First Edition).
// Ordered PDF CR-heading streams: Chapter 1 pp. 10–66, Chapter 2 pp. 68–134.
// These remain AUTO-EXTRACTED and need human review except for explicitly
// source-checked entries. null means the printed Strength is a dash (no score).
// The FNV hashes below lock each array to the exact source name order; no
// array may be applied after a reorder, insertion or removal.
export const KINGMAKER_BESTIARY_PDF_STRENGTH=Object.freeze([
30,28,1,38,33,null,20,18,12,12,18,16,14,18,24,20,24,14,16,13,13,3,18,12,14,12,8,18,24,32,22,25,15,28,30,22,30,26,8,14,12,12,16,null,27,31,12,11,8,19,24,24,19,12,17,18,34,14,22,18,27,33,11,22,28,14,15,44,11,16,25,18,22,12,28,16,40,28,28,28,25,34,35,19,1,15,21,1,13,18,10,8,16,30,21,30,32,26,33,25,5,31,19,24,25
]);
export const KINGMAKER_NPC_PDF_STRENGTH=Object.freeze([
20,14,18,23,25,14,8,22,20,28,32,24,18,12,11,14,21,22,25,16,19,12,14,5,22,8,11,14,null,18,8,15,null,20,14,10,21,21,20,14,26,10,33,26,18,37,16,10,26,28,29,11,null,23,35,6,25,24,24,16,24,27,10,13,21,12,7,32,24,22,20,36,12,34,10,18,11,14,13,8,11,14,9,8,32,8,8,12,28,1,14,8,8,16,24,22,18,16,18,21,21,20,10,null,24
]);
function orderFingerprint(entries){
 const names=entries.map(entry=>entry.name.toUpperCase()
   .replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'')).join('|');
 let hash=2166136261;
 for(let i=0;i<names.length;i++)hash=Math.imul(hash^names.charCodeAt(i),16777619)>>>0;
 return hash.toString(16).padStart(8,'0');
}
export function validateKingmakerStrengthOrder(bestiaryEntries,npcEntries){
 if(bestiaryEntries.length!==105||npcEntries.length!==105||
   KINGMAKER_BESTIARY_PDF_STRENGTH.length!==105||
   KINGMAKER_NPC_PDF_STRENGTH.length!==105||
   orderFingerprint(bestiaryEntries)!=='1cd01472'||
   orderFingerprint(npcEntries)!=='0af68d0a')
  throw Error('Kingmaker source order changed; do not apply ordinal Strength values without rematching PDF names.');
 return true;
}
export function withKingmakerExtractedStrength(entry,strength){
 if(!Number.isFinite(strength)||Number.isFinite(entry.stats?.str))return entry;
 return {...entry,stats:{...entry.stats,str:strength},
  text:{...entry.text,
   importNotes:[entry.text?.importNotes,'Strength extracted from PDF numeric stat line; overall entry still requires source review.'].filter(Boolean).join(' ')
  }
 };
}
