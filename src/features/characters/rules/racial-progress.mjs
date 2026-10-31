// Explicitly supported racial progression; no inferred bonuses from free text.
import {registry} from './catalog.mjs';
export const QUADAV_ID='ffd20:race:quadav';
export const QUADAV_TERRAIN=QUADAV_ID+':pool:bond-to-the-land-selection';
export const DWARF_ID='ffd20:race:dwarf';
export const DWARF_LANGUAGES=DWARF_ID+':pool:high-intelligence-bonus-languages';
export const HUME_ID='ffd20:race:hume';
export const HUME_SCORE=HUME_ID+':pool:hume-2-racial-ability';
export const HUME_LANGUAGES=HUME_ID+':pool:high-intelligence-bonus-languages';
export const MITHRA_ID='ffd20:race:mithra';
export const MITHRA_LANGUAGES=MITHRA_ID+':pool:high-intelligence-bonus-languages';
export const LAMBKIN_ID='ffd20:race:lambkin';
export const LAMBKIN_LANGUAGES=LAMBKIN_ID+':pool:bonus-languages';
export const LAMBKIN_POLYGLOT_LANGUAGE=LAMBKIN_ID+':pool:polyglot-language';
export const TARUTARU_ID='ffd20:race:tarutaru';
export const TARUTARU_LANGUAGES=TARUTARU_ID+':pool:high-intelligence-bonus-languages';
export const TARUTARU_TALENTED=TARUTARU_ID+':pool:tarutaru-craft-profession-choice';
export const AEGYL_ID='ffd20:race:aegyl';
export const AEGYL_LANGUAGES=AEGYL_ID+':pool:high-intelligence-bonus-languages';
export const AL_BHED_ID='ffd20:race:al-bhed';
export const AL_BHED_LANGUAGES=AL_BHED_ID+':pool:high-intelligence-bonus-languages';
export const AL_BHED_GENIUS=AL_BHED_ID+':pool:mechanical-genius-specialty';
export const AU_RA_ID='ffd20:race:au-ra';
export const AU_RA_LANGUAGES=AU_RA_ID+':pool:high-intelligence-bonus-languages';
export const BANGAA_ID='ffd20:race:bangaa';
export const BANGAA_LANGUAGES=BANGAA_ID+':pool:high-intelligence-bonus-languages';
export const BEASTKIN_ID='ffd20:race:beastkin';
export const BEASTKIN_LANGUAGES=BEASTKIN_ID+':pool:high-intelligence-bonus-languages';
export const BURMECIAN_ID='ffd20:race:burmecian';
export const BURMECIAN_LANGUAGES=BURMECIAN_ID+':pool:high-intelligence-bonus-languages';
export const GARIF_ID='ffd20:race:garif';
export const GARIF_LANGUAGES=GARIF_ID+':pool:bonus-languages';
export const GARIF_TERRAIN=GARIF_ID+':pool:bond-terrain';
export const GARIF_PASTORALIST=GARIF_ID+':pool:pastoralist-skill';
export const GARLEAN_ID='ffd20:race:garlean';
export const GARLEAN_LANGUAGES=GARLEAN_ID+':pool:bonus-languages';
export const GARLEAN_WEAPON=GARLEAN_ID+':pool:sovereignty-weapon';
export const GARLEAN_CRAFT=GARLEAN_ID+':pool:technology-craft';
export const DRACOBALTIAN_ID='ffd20:race:dracobaltian';
export const DRACOBALTIAN_LANGUAGES=DRACOBALTIAN_ID+':pool:bonus-languages';
// Use the source replacement ownership instead of disabling every standard trait
// whenever any alternate/heritage is selected. Unrelated racial bonuses survive.
const standardTraitActive=(b,raceId,slug)=>{
 if(b?.raceId!==raceId|| (b.disabledTraits||[]).includes(raceId+':trait:'+slug))return false;
 const race=registry.races.find(r=>r.id===raceId);
 if(!race)return false;
 const id=raceId+':trait:'+slug;
 const heritage=race.data.heritages.find(h=>h.id===b.heritageId);
 const replacements=[...(heritage?.replacements||[]),...(b.alternateIds||[]).flatMap(id=>race.data.alternateReplacements.filter(op=>op.addsFeatureIds.includes(id)))];
 return !replacements.some(op=>op.operation==='replace'&&op.targetFeatureIds.includes(id));
};
export const humeTraitActive=(b,slug)=>standardTraitActive(b,HUME_ID,slug);
export const racialSkillRanks=(b,level)=>humeTraitActive(b,'skilled')?level:standardTraitActive(b,GARIF_ID,'pastoralist')&&level===1&&!b.carry?1:standardTraitActive(b,AL_BHED_ID,'mechanical-genius')&&level>=1?1:0;
export const racialCounter=(b,feature)=>b?.raceId==='ffd20:race:galka'&&(b.alternateIds||[]).includes('ffd20:race:galka:feature:tenacious')&&feature.id==='ffd20:race:galka:feature:tenacious'?{maximum:1}:[[MITHRA_ID,'cat-s-luck'],[AEGYL_ID,'eternal-hope'],[AU_RA_ID,'ferocity']].some(([race,slug])=>standardTraitActive(b,race,slug)&&feature.id===race+':trait:'+slug)?{maximum:1}:null;
export function applyRacialFlatStats(next,previous,b){
 for(const [key,owner,bonus] of [
  ['init_temp','racialInitiativeBonus',(standardTraitActive(b,MITHRA_ID,'fleet-footed')||standardTraitActive(b,BEASTKIN_ID,'fleet-footed'))?2:0],
  ['ac_natural','racialNaturalArmorBonus',(standardTraitActive(b,AU_RA_ID,'scales')||standardTraitActive(b,BANGAA_ID,'thick-skinned')||standardTraitActive(b,BEASTKIN_ID,'natural-armor')||standardTraitActive(b,DRACOBALTIAN_ID,'leathery-skinned'))?1:0],
  ['cmd_temp','racialCmdBonus',standardTraitActive(b,BURMECIAN_ID,'battle-hardened')?1:0]
 ]){
  const old=Number(previous.rulesBuild?.[owner]||0);if(!bonus&&!old)continue;
  next[key]=Number(previous[key]||0)-old+bonus;next.rulesBuild[owner]=bonus;
 }
}
export const languageChoice=name=>'language:'+String(name).normalize('NFC').trim().replace(/\s+/g,' ');
export const languageName=id=>typeof id==='string'&&id.startsWith('language:')?id.slice(9):'';
export const validLanguageChoice=id=>{
 const name=languageName(id);
 return languageChoice(name)===id&&/^[\p{L}\p{N}][\p{L}\p{M}\p{N} '\u2019()\-]{0,59}$/u.test(name)&&name.toLowerCase()!=='common';
};
