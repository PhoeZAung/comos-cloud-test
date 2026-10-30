import {carriedLevels} from './rules/multiclass.mjs';
import {blackMageSummary} from './rules-summary.mjs';
import {classHasSpells} from './rules/class-adapters.mjs';
import {isBard,bardSummary} from './rules/bard-level-one.mjs';
const abilities=['str','dex','con','int','wis','cha'];
export function updateManagedStats(data,previous){
 const managed=data.rulesBuild;if(!managed||!abilities.some(k=>Number(data[k])!==Number(previous[k])))return;
 if(isBard(managed.input)&&Number(data.cha)>45)throw Error('Bonus MP above Charisma 45 needs a verified table extension.');
 const level=managed.input.level,mpSummary=values=>isBard(managed.input)?bardSummary({cha:Number(values.cha),int:Number(values.int)}):classHasSpells(managed.input)?blackMageSummary(level,Number(values.int)):{bonusMp:0},summary=mpSummary(data),old=mpSummary(previous);
 data.mp_bonus=Number(data.mp_bonus||0)+summary.bonusMp-old.bonusMp;
 const mod=n=>Math.floor((Number(n)-10)/2),rolls=managed.input.hpRolls.slice(0,level);
 const hp=con=>rolls.reduce((n,r)=>n+Math.max(1,r+mod(con)),0);
 const delta=hp(data.con)-hp(previous.con)+carriedLevels(managed.input)*(mod(data.con)-mod(previous.con));data.hp_max=Number(data.hp_max||0)+delta;
 managed.lastValues.mp_bonus+=summary.bonusMp-old.bonusMp;managed.lastValues.hp_max+=delta;
 for(const key of abilities)managed.input.baseScores[key]+=Number(data[key])-Number(previous[key]);
 managed.input.abilityMethod='manual';
 // Current HP/MP are deliberately untouched; increasing a maximum is not healing.
}
