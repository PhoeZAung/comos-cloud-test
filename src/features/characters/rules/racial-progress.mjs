// Explicitly supported racial progression; no inferred bonuses from free text.
export const HUME_ID='ffd20:race:hume';
export const HUME_SCORE=HUME_ID+':pool:hume-2-racial-ability';
export const HUME_LANGUAGES=HUME_ID+':pool:high-intelligence-bonus-languages';
export const MITHRA_ID='ffd20:race:mithra';
export const MITHRA_LANGUAGES=MITHRA_ID+':pool:high-intelligence-bonus-languages';
export const TARUTARU_ID='ffd20:race:tarutaru';
export const TARUTARU_LANGUAGES=TARUTARU_ID+':pool:high-intelligence-bonus-languages';
export const TARUTARU_TALENTED=TARUTARU_ID+':pool:tarutaru-craft-profession-choice';
const standardTraitActive=(b,race,slug)=>b?.raceId===race&&!b.heritageId&&!(b.alternateIds||[]).length&&!(b.disabledTraits||[]).includes(race+':trait:'+slug);
export const humeTraitActive=(b,slug)=>b?.raceId===HUME_ID&&!b.heritageId&&!(b.alternateIds||[]).length&&!(b.disabledTraits||[]).includes(HUME_ID+':trait:'+slug);
export const racialSkillRanks=(b,level)=>humeTraitActive(b,'skilled')?level:0;
export const racialCounter=(b,feature)=>standardTraitActive(b,MITHRA_ID,'cat-s-luck')&&feature.id===MITHRA_ID+':trait:cat-s-luck'?{maximum:1}:null;
export function applyRacialFlatStats(next,previous,b){
 const bonus=standardTraitActive(b,MITHRA_ID,'fleet-footed')?2:0,old=Number(previous.rulesBuild?.racialInitiativeBonus||0);
 if(!bonus&&!old)return;
 next.init_temp=Number(previous.init_temp||0)-old+bonus;
 next.rulesBuild.racialInitiativeBonus=bonus;
}
export const languageChoice=name=>'language:'+String(name).normalize('NFC').trim().replace(/\s+/g,' ');
export const languageName=id=>typeof id==='string'&&id.startsWith('language:')?id.slice(9):'';
export const validLanguageChoice=id=>{
 const name=languageName(id);
 return languageChoice(name)===id&&/^[\p{L}\p{N}][\p{L}\p{M}\p{N} '\u2019()\-]{0,59}$/u.test(name)&&name.toLowerCase()!=='common';
};
