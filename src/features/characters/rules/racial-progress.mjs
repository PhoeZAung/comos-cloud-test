// Explicitly supported racial progression; no inferred bonuses from free text.
export const HUME_ID='ffd20:race:hume';
export const HUME_SCORE=HUME_ID+':pool:hume-2-racial-ability';
export const HUME_LANGUAGES=HUME_ID+':pool:high-intelligence-bonus-languages';
export const humeTraitActive=(b,slug)=>b?.raceId===HUME_ID&&!b.heritageId&&!(b.alternateIds||[]).length&&!(b.disabledTraits||[]).includes(HUME_ID+':trait:'+slug);
export const racialSkillRanks=(b,level)=>humeTraitActive(b,'skilled')?level:0;
export const languageChoice=name=>'language:'+String(name).normalize('NFC').trim().replace(/\s+/g,' ');
export const languageName=id=>typeof id==='string'&&id.startsWith('language:')?id.slice(9):'';
export const validLanguageChoice=id=>{
 const name=languageName(id);
 return languageChoice(name)===id&&/^[\p{L}\p{N}][\p{L}\p{M}\p{N} '\u2019()\-]{0,59}$/u.test(name)&&name.toLowerCase()!=='common';
};
