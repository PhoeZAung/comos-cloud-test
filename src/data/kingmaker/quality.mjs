// Conservative quality checks for staged Kingmaker PDF stat blocks.
// These checks identify likely layout extraction errors without changing any
// numeric game statistics, deleting source text, or marking a record reviewed.
const NAVIGATION=/\b(?:KINGMAKER|CHAPT(?:ER)?|INTROD(?:UCTION)?|BESTIARY|NPC CODEX|HAZARDS?|TRAPS?|COMPANIONS?|INDEX|AND TRA)\b/;
const SECTION_BLEED=/\b(?:DEFENSE|OFFENSE|STATISTICS|SPECIAL ABILITIES|ECOLOGY|TACTICS)\b/;
const FIELD_KEYS=[
 'sourceReference','senses','aura','defenses','energyResistances',
 'immunities','weaknesses','specialAttacks','languages','gear',
 'combatGear','feats','qualities','attackDetail','skillDetail',
 'spellLikeAbilities','spellsKnown','spellsPrepared','acDetail',
 'hpDetail','saveDetail','drBypass','raceClassLevels'
];
const XP_BY_CR=new Map([
 [0,200],[0.125,50],[0.16666666666666666,65],[0.25,100],
 [0.3333333333333333,135],[0.5,200],
 [1,400],[2,600],[3,800],[4,1200],[5,1600],[6,2400],
 [7,3200],[8,4800],[9,6400],[10,9600],[11,12800],
 [12,19200],[13,25600],[14,38400],[15,51200],[16,76800],
 [17,102400],[18,153600],[19,204800],[20,307200],
 [21,409600],[22,614400],[23,819200],[24,1228800],[25,1638400]
]);
function headingIn(value,otherNames){
 const source=value.replace(/[\u2018\u2019]/g,"'");
 for(const name of otherNames){
  if(typeof name!=='string'||name.length<5)continue;
  const target=name.toUpperCase().replace(/[\u2018\u2019]/g,"'");
  const start=source.indexOf(target);
  if(start<0)continue;
  const before=start===0?"":source[start-1],after=source[start+target.length]||"";
  if(!/[A-Z]/.test(before)&&!/[A-Z]/.test(after))return name;
 }
 return null;
}
export function kingmakerLayoutIssues(entry,otherNames=[]){
 if(!entry||entry.verified==='transcribed-from-PDF')return [];
 const problems=[];
 const text=entry.text||{};
 for(const key of FIELD_KEYS){
  const value=text[key];
  if(typeof value!=='string'||!value)continue;
  if(NAVIGATION.test(value))problems.push('PDF layout bleed in '+key+': page navigation or footer');
  const neighbor=headingIn(value,otherNames.filter(name=>name!==entry.name));
  if(neighbor)problems.push('PDF layout bleed in '+key+': neighboring heading '+neighbor);
  // Only detect section labels when they appear inside a scalar value.
  if(SECTION_BLEED.test(value)&&!['spellsPrepared','spellsKnown','spellLikeAbilities'].includes(key))
   problems.push('PDF layout bleed in '+key+': unexpected section heading');
  if(/\b[A-Z]{5,}(?:\s+[A-Z]{3,}){0,2}\s+(?=[A-Z][a-z]{3,})/.test(value))
   problems.push('PDF layout bleed in '+key+': possible adjoining paragraph');
 }
 if(!Number.isFinite(entry.hp)||entry.hp<=0)problems.push('Missing or invalid HP');
 if(!Number.isFinite(entry.stats?.ac))problems.push('Missing AC');
 if(entry.chapter!=='companions'){
  if(!Number.isFinite(entry.stats?.cr))problems.push('CR not numeric or not assigned');
  if(!Number.isFinite(entry.stats?.xp))problems.push('XP missing');
  if(Number.isFinite(entry.stats?.cr)&&Number.isFinite(entry.stats?.xp)&&
    XP_BY_CR.has(entry.stats.cr)&&entry.stats.xp!==XP_BY_CR.get(entry.stats.cr))
   problems.push('CR and XP do not match Pathfinder progression');
 }
 if((/\b(?:Melee|Ranged)\b/.test(text.attackDetail||''))&&!(entry.weapons||[]).length)
  problems.push('Attack text present but no parsed weapons');
 if((text.skillDetail||'').includes('+')&&!(entry.npcSkills||[]).length)
  problems.push('Skill text present but no parsed skills');
 return [...new Set(problems)];
}
export function withKingmakerReviewFlags(entry,names=[]){
 if(entry.verified==='transcribed-from-PDF')return entry;
 const flags=[...new Set([...(entry.reviewFlags||[]),...kingmakerLayoutIssues(entry,names)])];
 return {...entry,reviewFlags:flags};
}


// Remove only positively identified text spillover from the Cosmos-facing
// *text* fields. Original staged files remain unchanged as the audit trail.
// This never infers missing values, edits stats/attacks/skills, or verifies NPCs.
const SAFE_TRIM_FIELDS=new Set([
 'senses','aura','defenses','energyResistances','immunities',
 'weaknesses','specialAttacks','languages','gear','combatGear',
 'feats','qualities','attackDetail','skillDetail','spellLikeAbilities',
 'spellsKnown','spellsPrepared','acDetail','hpDetail','saveDetail','drBypass'
]);
const PRINTED_SIDEBAR=/\b(?:KINGMAKER BESTIARY|CHAPTER [1-4]:|INTRODUCTION|NPC CODEX|HAZARDS AND TRAPS|COMPANIONS|INDEX)\b/g;
function escapedName(name){
 return name.toUpperCase().replace(/[’‘]/g,"'").replace(/[^A-Z0-9 ]/g,'\\$&').replace(/ +/g,'\\s+');
}
function confirmedSpilloverCut(value,names,ownName){
 let cut=value.length;
 for(const m of value.matchAll(PRINTED_SIDEBAR)){
  if(m.index>0)cut=Math.min(cut,m.index);
 }
 for(const name of names){
  if(name===ownName||name.length<5)continue;
  // The source PDF prints monster names in uppercase. Require that case,
  // along with word boundaries; ordinary mentions must be preserved.
  const pattern=new RegExp('(?:^|\\s)('+escapedName(name)+')(?=\\s+[A-Z]|$)','g');
  const normalized=value.replace(/[’‘]/g,"'");
  for(const match of normalized.matchAll(pattern)){
   const start=match.index+match[0].indexOf(match[1]);
   if(start>0)cut=Math.min(cut,start);
  }
 }
 return cut;
}
export function withKingmakerCleanText(entry,names=[]){
 if(entry.verified==='transcribed-from-PDF')return entry;
 const cleaned={...entry.text};
 const trimmed=[];
 for(const [key,value] of Object.entries(cleaned)){
  if(!SAFE_TRIM_FIELDS.has(key)||typeof value!=='string')continue;
  const cut=confirmedSpilloverCut(value,names,entry.name);
  if(cut===value.length)continue;
  let replacement=value.slice(0,cut).trim();
  // The source PDF prints its page number before the sidebar book title.
  if(/\bKINGMAKER BESTIARY\b/.test(value.slice(cut)))
   replacement=replacement.replace(/\s+\d{1,3}\s*$/,'').trim();
  if(!replacement)continue; // Never turn an unknown field into an empty fact.
  cleaned[key]=replacement;
  trimmed.push(key);
 }
 if(!trimmed.length)return entry;
 return {...entry,text:cleaned,
  reviewFlags:[...new Set([...(entry.reviewFlags||[]),
   ...trimmed.map(key=>'PDF text trimmed in '+key+' (requires source review)')])]};
}
