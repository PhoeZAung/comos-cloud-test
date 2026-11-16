import {normalizeNpcSheet} from '../../features/characters/npc-stat-block.mjs';
import {KINGMAKER_BESTIARY_BATCH_001} from './bestiary-batch-001.mjs';

// Provisional stat-block totals counted from the chapter text; confirmed
// entries will be reconciled against all chapter headings as extraction grows.
export const KINGMAKER_CHAPTERS=Object.freeze([
 {id:'bestiary',name:'Bestiary',chapter:1,total:103},
 {id:'npc-codex',name:'NPC Codex',chapter:2,total:105},
 {id:'hazards',name:'Hazards & Traps',chapter:3,total:null,deferred:true},
 {id:'companions',name:'Companions',chapter:4,total:7}
]);
export const KINGMAKER_STAGED_ENTRIES=Object.freeze([...KINGMAKER_BESTIARY_BATCH_001]);
export const KINGMAKER_BOOK_ID='kingmaker-bestiary-first-edition';

// Convert a staged record to the same shape as an editable Cosmos NPC sheet.
// No insertion here. A separately approved QNAP import will use this adapter.
export function kingmakerNpcData(entry){
 if(!entry||!['bestiary','npc-codex','companions'].includes(entry.chapter))
  throw Error('Unsupported Kingmaker category.');
 const page=Number.isInteger(entry.printedPage)?entry.printedPage:null;
 return normalizeNpcSheet({
  manualCharacter:true,charName:entry.name,
  npcCategory:entry.chapter,npcImportSource:KINGMAKER_BOOK_ID,
  npcImportKey:entry.slug,npcSourcePdfPage:entry.pdfPage,
  npcNeedsRulesReference:entry.needsRulesReference===true,
  hp_curr:entry.hp,hp_max:entry.hp,
  npcStats:{...entry.stats,sourcePage:page},
  npcText:{...entry.text,source:entry.source,sourceReference:
   [entry.text?.sourceReference,entry.source,'p. '+page].filter(Boolean).join(' · ')},
  weapons:entry.weapons||[],npcSkills:entry.npcSkills||[],
  activeAbilities:entry.activeAbilities||[]
 });
}
export function kingmakerProgress(imported={}){
 return KINGMAKER_CHAPTERS.map(chapter=>{
  const staged=KINGMAKER_STAGED_ENTRIES.filter(item=>item.chapter===chapter.id).length;
  return {...chapter,staged,imported:Number(imported[chapter.id]||0),
   percent:chapter.total?Math.round(100*staged/chapter.total):0};
 });
}
