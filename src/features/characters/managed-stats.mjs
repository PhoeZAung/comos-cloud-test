import {carriedLevels} from './rules/multiclass.mjs';
import {blackMageSummary} from './rules-summary.mjs';
import {classHasSpells} from './rules/class-adapters.mjs';
const abilities=['str','dex','con','int','wis','cha'];
export function updateManagedStats(data,previous){
 const managed=data.rulesBuild;if(!managed||!abilities.some(k=>Number(data[k])!==Number(previous[k])))return;
 const level=managed.input.level,summary=classHasSpells(managed.input)?blackMageSummary(level,Number(data.int)):{bonusMp:0},old=classHasSpells(managed.input)?blackMageSummary(level,Number(previous.int)):{bonusMp:0};
 data.mp_bonus=Number(data.mp_bonus||0)+summary.bonusMp-old.bonusMp;
 const mod=n=>Math.floor((Number(n)-10)/2),rolls=managed.input.hpRolls.slice(0,level);
 const hp=con=>rolls.reduce((n,r)=>n+Math.max(1,r+mod(con)),0);
 const delta=hp(data.con)-hp(previous.con)+carriedLevels(managed.input)*(mod(data.con)-mod(previous.con));data.hp_max=Number(data.hp_max||0)+delta;
 managed.lastValues.mp_bonus+=summary.bonusMp-old.bonusMp;managed.lastValues.hp_max+=delta;
 for(const key of abilities)managed.input.baseScores[key]+=Number(data[key])-Number(previous[key]);
 managed.input.abilityMethod='manual';
 // Current HP/MP are deliberately untouched; increasing a maximum is not healing.
}
