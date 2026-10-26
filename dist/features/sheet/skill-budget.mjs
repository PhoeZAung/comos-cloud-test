import {classSkillBases} from './skill-bases.mjs';
import {number,modifier} from './model.mjs';
const normalize=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const bases=new Map(Object.entries(classSkillBases).map(([k,v])=>[normalize(k),v]));
export function skillBudget(data={}){
 let classes=Array.isArray(data.classes)&&data.classes.length?data.classes.map(c=>({name:c.name,level:c.level})):[];
 if(!classes.length){const name=data.class||data.className;if(name)classes.push({name,level:data.class_level||data.character_level||data.level||1});for(const c of data.multiclasses||[]){const name=c.className||c.class||c.name;if(name&&number(c.level||c.classLevel)>0)classes.push({name,level:c.level||c.classLevel});}if(data.prestige_class&&number(data.prestige_level)>0&&!classes.some(c=>normalize(c.name)===normalize(data.prestige_class)))classes.push({name:data.prestige_class,level:data.prestige_level});}
 const intKnown=data.int!==undefined&&data.int!==null&&data.int!==''&&Number.isFinite(Number(data.int)),intMod=intKnown?modifier(data.int):null;
 const rows=classes.map(c=>{const base=bases.get(normalize(c.name)),level=Math.max(0,Math.trunc(number(c.level)));return {className:String(c.name||''),level,skillBase:base??null,intMod,perLevel:base===undefined||intMod===null?null:Math.max(1,base+intMod),total:base===undefined||intMod===null?null:Math.max(1,base+intMod)*level};});
 const totalLevel=rows.reduce((s,c)=>s+c.level,0),seen=new Set();let favoredSkill=0;
 for(const map of [data.favoredClassBonuses,data.levelBonusChoicesV37,data.levelBonusChoicesV36,data.levelBonusChoicesV35,data.favored_bonuses,data.favoredBonuses]){
  if(!map||typeof map!=='object'||Array.isArray(map))continue;
  for(const [key,value] of Object.entries(map)){if(!/^\d+$/.test(key))continue;const level=Number(key),choice=String(value||'').trim().toLowerCase();if(level<1||level>totalLevel||seen.has(level))continue;if(['skill','+1 skill','+1 skill point','hp','+1 hp'].includes(choice)){seen.add(level);if(choice.includes('skill'))favoredSkill++;}}
 }
 const ranks=(Array.isArray(data.skills)?data.skills:[]).reduce((s,r)=>s+Math.max(0,Math.trunc(number(r.lvl??r.ranks??r.rank))),0),known=rows.length>0&&rows.every(c=>c.total!==null),classBudget=known?rows.reduce((s,c)=>s+c.total,0):null,totalBudget=known?classBudget+favoredSkill:null;
 return {known,classBudget,favoredSkill,totalBudget,ranks,unused:known?totalBudget-ranks:null,totalLevel,rows};
}
