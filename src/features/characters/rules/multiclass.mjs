import {characterClasses,totalClassLevel} from '../ffd20.mjs';
import {skillBudget} from '../../sheet/skill-budget.mjs';
import {fixedSkills} from '../../sheet/skills.mjs';
import {number} from '../../sheet/model.mjs';
export const carriedLevels=b=>totalClassLevel(b.carry?.classes||[]);
export const buildLevel=b=>carriedLevels(b)+b.level;
export function carryCharacter(data){
 const classes=characterClasses(data).filter(c=>c.name),budget=skillBudget(data);
 if(!classes.length||!budget.known)throw Error('Existing class levels and skill budget must be established before adding a class.');
 if(classes.some(c=>c.name.toLowerCase()==='black mage'))throw Error('Black Mage is already present. Use Level up for that class.');
 return {classes,hpMax:number(data.hp_max),con:number(data.con),int:number(data.int),bab:number(data.bab),fort:number(data.fort_base),ref:number(data.ref_base),will:number(data.will_base),mpClass:number(data.mp_class),mpBonus:number(data.mp_bonus),skillBudget:budget.totalBudget,classSkills:fixedSkills.map((_,i)=>data.skills?.[i]?.cs===true),ranks:fixedSkills.map((_,i)=>number(data.skills?.[i]?.lvl)),proficiencies:String(data.proficiencies||''),languages:String(data.languages||''),senses:String(data.senses||''),speed:number(data.speed),size:String(data.size_category||data.size||'Medium'),ruleBonuses:fixedSkills.map((_,i)=>number(data.skills?.[i]?.rulesBonus)),castingProfiles:structuredClone(data.castingProfiles||[])};
}
export function sameCarry(a,b){return JSON.stringify(a??null)===JSON.stringify(b??null);}
