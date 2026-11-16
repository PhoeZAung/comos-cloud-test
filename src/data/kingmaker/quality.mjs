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


// Clean only identifiable PDF bleed in the Cosmos-facing *text* fields.
// Keep original auto-staged files unchanged. Never alter stats or mark verified.
const SAFE_TRIM_FIELDS=new Set([
 'senses','aura','defenses','energyResistances','immunities',
 'weaknesses','specialAttacks','languages','gear','combatGear',
 'feats','qualities','attackDetail','skillDetail','spellLikeAbilities',
 'spellsKnown','spellsPrepared','acDetail','hpDetail','saveDetail','drBypass'
]);
function escapedName(name){
 return name.toUpperCase().replace(/[’‘]/g,"'").replace(/[^A-Z0-9 ]/g,'\\$&').replace(/ +/g,'\\s+');
}
function confirmedNeighborCut(value,names,ownName){
 let cut=value.length;
 const normalized=value.replace(/[’‘]/g,"'");
 for(const name of names){
  if(name===ownName||name.length<5||!normalized.includes(name.toUpperCase().replace(/[’‘]/g,"'")))continue;
  const pattern=new RegExp('(?:^|\\s)('+escapedName(name)+')(?=\\s+[A-Z]|$)','g');
  for(const match of normalized.matchAll(pattern)){
   const start=match.index+match[0].indexOf(match[1]);
   if(start>0)cut=Math.min(cut,start);
  }
 }
 return cut;
}
// The sidebar can interrupt a legitimate feat, skill or spell list; *never*
// truncate a field at navigation. Remove the page marker in-place instead.
function withoutSidebar(value){
 return value
  .replace(/(?:\b\d{1,3}\s+)?KINGMAKER BESTIARY(?:\s+(?:BESTIARY|BESTIA|BES))(?:\s*\(FIRST EDITI(?:ON)?\))?/g,' ')
  .replace(/\(?First Editi(?:o(?:n)?)?\)?\s*INTRODUCTION\b/g,' ')
  .replace(/\bCHAPTER\s+[1-4]\s*:?/g,' ')
  .replace(/\b(?:INTRODUCTION|NPC CODEX|HAZARDS AND TRAPS|COMPANIONS|INDEX)\b/g,' ')
  .replace(/\s+/g,' ').trim();
}
export function withKingmakerCleanText(entry,names=[]){
 if(entry.verified==='transcribed-from-PDF')return entry;
 const cleaned={...entry.text},changed=[];
 for(const [key,value] of Object.entries(cleaned)){
  if(!SAFE_TRIM_FIELDS.has(key)||typeof value!=='string')continue;
  // A known adjacent CREATURE HEADING can end the field and introduce prose.
  // Anything more ambiguous remains present with a review flag.
  const cut=confirmedNeighborCut(value,names,entry.name);
  const trimmed=cut<value.length&&value.slice(0,cut).trim()?value.slice(0,cut).trim():value;
  const replacement=withoutSidebar(trimmed);
  if(!replacement||replacement===value)continue;
  cleaned[key]=replacement;
  changed.push(key);
 }
 if(!changed.length)return entry;
 return {...entry,text:cleaned,
  reviewFlags:[...new Set([...(entry.reviewFlags||[]),
   ...changed.map(key=>'PDF text cleaned in '+key+' (requires source review)')])]};
}
