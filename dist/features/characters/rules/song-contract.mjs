// Bard song extraction and choice-gating contract.
// Catalog contains source-index summaries, NOT automated spell effects.
const fail=(path,message)=>{throw Error('Bard songs: '+path+' — '+message);};
const int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
const idPattern=/^ffd20:song:bard:[a-z][a-z0-9-]*$/;
export function validateBardSongCatalog(c){
 if(c?.schemaVersion!=='comos.songs.v1'||c.kind!=='song_catalog'||
    c.parentClassId!=='ffd20:class:bard'||c.id!=='ffd20:class:bard:songs')
  fail('catalog','wrong schema, kind or class');
 if(!Array.isArray(c.sources)||!c.sources.some(s=>/^https:\/\/finalfantasyd20\.com\/magic\/spells-by-class\/bard\/$/.test(s.url)))
  fail('sources','official source index missing');
 if(!c.review||!['needs_review','approved'].includes(c.review.state))
  fail('review','review status required');
 if(!Array.isArray(c.extractedLevels)||!c.extractedLevels.length||
    new Set(c.extractedLevels).size!==c.extractedLevels.length||
    c.extractedLevels.some((v,i)=>!int(v,0,6)||v!==i))
  fail('extractedLevels','levels must form an increasing sequence starting at 0');
 if(c.review.complete&&(c.extractedLevels.length!==7||c.review.coverage==='partial_levels_0_to_2'))
  fail('review','cannot claim complete before all seven song levels are extracted');
 if(!c.review.complete&&c.review.state==='approved')
  fail('review','incomplete catalog cannot be approved');
 if(c.rules?.maintainedBaseLimit!==1||c.rules?.jinglesKnownAtStart!==2||
    JSON.stringify(c.rules.extraJingleLevels)!=='[5,9,13,17]'||
    c.rules.songsGainedEachLevelAfterFirst!==2)
  fail('rules','Bard source learning and maintained-song limits changed');
 if(!Array.isArray(c.songs)||!c.songs.length)fail('songs','songs missing');
 const ids=new Set(),names=new Set(),counts=new Map();
 for(const [index,s] of c.songs.entries()){
  const p='songs/'+index;
  if(!idPattern.test(s.id||'')||ids.has(s.id))fail(p,'duplicate or invalid stable song ID');
  ids.add(s.id);
  if(!int(s.level,0,6)||!c.extractedLevels.includes(s.level))fail(p,'song level is not extracted');
  if(!s.name?.trim()||!s.summary?.trim()||!['normal','maintained'].includes(s.usageMode)||
     s.kind!==(s.level===0?'jingle':'song')||s.automation!=='manual')
   fail(p,'incomplete or unsafe song fields');
  const nameKey=s.level+':'+s.name.toLocaleLowerCase();
  if(names.has(nameKey))fail(p,'duplicate song title at same level');
  names.add(nameKey);
  if(!Array.isArray(s.sourceRefs)||!s.sourceRefs.some(r=>r.sourceId==='bard-songs'&&
     r.section?.includes('Bard Songs')&&r.locator?.includes(s.name)))
   fail(p,'source index row locator missing');
  counts.set(s.level,(counts.get(s.level)||0)+1);
 }
 if(c.extractedLevels.some(l=>!counts.get(l)))fail('extractedLevels','level has no indexed songs');
 return {id:c.id,counts:Object.fromEntries([...counts].sort((a,b)=>a[0]-b[0])),total:ids.size,complete:c.review.complete};
}
export function bardSongLearningSlots(level,chaScore){
 if(!int(level,1,20)||!int(chaScore,1,99))fail('choices','invalid class level or Charisma');
 const mod=Math.floor((chaScore-10)/2);
 return {songs:level===1?3+mod:2,jingles:level===1?2:(level>=5&&(level-1)%4===0?1:0)};
}
export function eligibleBardSongChoices(bardClass,catalog,{bardLevel,chaScore,kind='song',knownIds=[]}){
 if(!int(bardLevel,1,20)||!int(chaScore,1,99)||!['song','jingle'].includes(kind))
  fail('choices','invalid class level, Charisma or choice kind');
 if(bardClass?.id!=='ffd20:class:bard'||bardClass.data?.levels?.[bardLevel-1]?.level!==bardLevel)
  fail('choices','Bard level table missing');
 const row=bardClass.data.levels[bardLevel-1],known=new Set(knownIds);
 return catalog.songs.filter(s=>s.kind===kind&&!known.has(s.id)&&
   chaScore>=10+s.level&&(kind==='jingle'||s.level<=row.maxSpellLevel));
}
// A null result is distinct from an empty eligible list: the chosen tier has not
// been extracted, so a future wizard must NOT pretend the list is exhaustive.
export function bardSongCatalogCoverage(catalog,bardClass,level){
 if(!int(level,1,20))fail('coverage','invalid class level');
 const max=bardClass?.data?.levels?.[level-1]?.maxSpellLevel;
 if(!int(max,1,6))fail('coverage','Bard song level missing');
 return {completeForLevel:Array.from({length:max+1},(_,i)=>i).every(x=>catalog.extractedLevels.includes(x)),
  requiredLevels:Array.from({length:max+1},(_,i)=>i),extractedLevels:[...catalog.extractedLevels]};
}
