// Full individual song pages, kept separate from the index and manual in play.
export function validateBardSongMechanics(batch,catalog){
 const fail=message=>{throw Error('Bard song mechanics: '+message);};
 if(batch?.schemaVersion!=='comos.song-mechanics.v1'||batch.kind!=='song_mechanics_batch'||batch.parentClassId!=='ffd20:class:bard'||batch.catalogId!==catalog?.id)fail('invalid batch identity');
 if(JSON.stringify(batch.levels)!=='[1]'||batch.review?.state!=='needs_review'||batch.review.blocking!==true)fail('first-level staged coverage and review required');
 const expected=new Map(catalog.songs.filter(s=>s.level===1).map(s=>[s.id,s]));
 if(expected.size!==30||!Array.isArray(batch.entries)||batch.entries.length!==expected.size)fail('all 30 first-level songs are required');
 const seen=new Set();
 for(const e of batch.entries){
  const song=expected.get(e.songId);
  if(!song||seen.has(e.songId)||e.name!==song.name||e.level!==1)fail('unknown, duplicate or mismatched song');
  seen.add(e.songId);
  if(e.mpCost!==1||e.automation!=='manual'||e.reviewState!=='needs_review')fail('unsafe cost or automation');
  for(const key of ['school','castingTime','range','duration','savingThrow','spellResistance','mechanicsSummary'])if(typeof e[key]!=='string'||!e[key].trim())fail(e.songId+' missing '+key);
  if(!['1 standard action','1 swift action','1 immediate action','1 round'].includes(e.castingTime))fail('unrecognized casting action');
  if(!e.targeting||Array.isArray(e.targeting)||!Object.keys(e.targeting).length||Object.entries(e.targeting).some(([k,v])=>!['target','targets','area','effect'].includes(k)||typeof v!=='string'||!v.trim()))fail('target or area required');
  if(e.maintained!==(song.usageMode==='maintained')||e.maintained!==/maintained/i.test(e.duration))fail(e.songId+' maintained mode disagrees with individual duration');
  const url=new URL(e.sourceURL);
  if(url.origin!=='https://finalfantasyd20.com'||!/^\/magic\/spells\/[a-z]\/[a-z0-9-]+\/$/.test(url.pathname)||url.search||url.hash)fail('individual official page required');
  if(e.archivePath!=='pages'+url.pathname.replace(/\/$/,'')||!/^[a-f0-9]{64}$/.test(e.archiveSha256)||!Number.isFinite(Date.parse(e.retrievedAt)))fail('archive provenance missing');
  const source=batch.sources?.find(s=>s.id===e.songId.split(':').at(-1));
  if(source?.url!==e.sourceURL||source.archiveSha256!==e.archiveSha256||source.archivePath!==e.archivePath||source.retrievedAt!==e.retrievedAt)fail('individual source reference mismatch');
  if(!e.sourceRefs?.some(r=>r.section?.includes('DESCRIPTION'))||!e.sourceRefs.some(r=>r.sourceId==='mp-system'))fail('mechanics and MP source locators required');
 }
 const mp=batch.sources?.find(s=>s.id==='mp-system');
 if(mp?.url!=='https://finalfantasyd20.com/magic/mp-system/'||!/^[a-f0-9]{64}$/.test(mp.archiveSha256||''))fail('MP source provenance missing');
 return {total:seen.size,maintained:batch.entries.filter(e=>e.maintained).length,coverage:'level-1-only'};
}
