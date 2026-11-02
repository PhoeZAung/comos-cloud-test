// Source-checked Bard jingle mechanics; never apply gameplay effects automatically.
const fail=(path,message)=>{throw Error('Bard jingle mechanics: '+path+' — '+message);};
export function validateBardJingleMechanics(batch,catalog){
 if(batch?.schemaVersion!=='comos.song-mechanics.v1'||batch.kind!=='song_mechanics_batch'||batch.parentClassId!=='ffd20:class:bard'||batch.catalogId!=='ffd20:class:bard:songs')
  fail('batch','wrong schema, parent or catalog reference');
 if(!Array.isArray(catalog?.songs))fail('catalog','song catalog missing');
 if(!Array.isArray(batch.entries)||batch.entries.length!==11)fail('entries','all eleven official jingles are required in this batch');
 if(batch.review?.state!=='needs_review'||batch.review.blocking!==true)fail('review','must remain staged and blocked until verified adapter');
 if(batch.generalRules?.mpCost!==0||batch.generalRules?.performSkillCheckRequired!==false)
  fail('generalRules','Bard jingles do not use MP or Perform checks');
 const ids=new Set(),source=new Map(catalog.songs.filter(s=>s.kind==='jingle').map(s=>[s.id,s]));
 if(source.size!==11)fail('catalog','unexpected jingle index count');
 for(const e of batch.entries){
  const p=e.songId;
  if(ids.has(e.songId)||!source.has(e.songId)||source.get(e.songId).name!==e.name)fail(p,'unknown, duplicated or mismatched song ID');
  ids.add(e.songId);
  if(e.mpCost!==0||e.castingTime!=='1 standard action'||e.automation!=='manual'||e.reviewState!=='needs_review')
   fail(p,'jingle activation or safety state is invalid');
  if(!e.school?.includes('jingle')||!e.range||!e.targeting||!e.duration||!e.savingThrow||!e.spellResistance||!e.mechanicsSummary)
   fail(p,'missing sourced mechanics field');
  if(e.maintained!==(source.get(e.songId).usageMode==='maintained'))fail(p,'maintained flag disagrees with song index');
  if(!e.sourceURL?.startsWith('https://finalfantasyd20.com/magic/spells/')||!e.sourceURL.endsWith('/'))
   fail(p,'individual official spell URL required');
  if(!Array.isArray(e.sourceRefs)||!e.sourceRefs.length)fail(p,'source locator required');
  if(!Array.isArray(e.scaling))fail(p,'scaling must be explicit (empty if absent)');
  if(e.scaling.some(s=>!s.parameter||!s.expression||!/^[a-zA-Z0-9_ +*/().,-]+$/.test(s.expression)))fail(p,'invalid scaling expression');
 }
 for(const id of source.keys())if(!ids.has(id))fail(id,'jingle not in mechanics batch');
 return {total:ids.size,maintained:batch.entries.filter(e=>e.maintained).map(e=>e.songId),review:batch.review.state};
}
// Preview helper: does not mutate a character, cast a song, or spend MP.
export function jingleDetails(batch,songId){
 return batch.entries.find(e=>e.songId===songId)||null;
}
