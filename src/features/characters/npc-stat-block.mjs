import {diceTerms} from '../sheet/calculations.mjs';
import {parseDr,parseSr} from '../sheet/pathfinder-defenses.mjs';

export const npcStatLabels={
 cr:'CR',initiative:'Initiative',ac:'AC',touch:'Touch AC',flat:'Flat-footed AC',
 fort:'Fortitude',ref:'Reflex',will:'Will',speed:'Land speed (ft)',
 flySpeed:'Fly speed (ft)',swimSpeed:'Swim speed (ft)',climbSpeed:'Climb speed (ft)',burrowSpeed:'Burrow speed (ft)',
 reach:'Reach (ft)',perception:'Perception bonus',fastHealing:'Fast healing per round',regeneration:'Regeneration per round',
 bab:'Base attack bonus',cmb:'CMB',cmd:'CMD',dr:'Damage reduction (DR)',sr:'Spell resistance (SR)',casterLevel:'Caster level (CL)',
 meleeAttack:'Melee attack bonus',rangedAttack:'Ranged attack bonus',spellPenetration:'Bonus to overcome SR',spellDC:'Default spell DC',
 str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma'
};
export const npcTextLabels={
 summary:'Identity',source:'Source',alignment:'Alignment',size:'Size',creatureType:'Creature type',subtypes:'Subtypes',
 senses:'Senses',languages:'Languages',defenses:'Defensive abilities',
 specialAttacks:'Special attacks',qualities:'Special qualities',gear:'Gear',feats:'Feats',
 drBypass:'DR bypass (e.g. silver and good)',energyResistances:'Energy resistances (e.g. fire 10)',immunities:'Immunities',vulnerabilities:'Vulnerabilities',
 saveSpecial:'Special save rules (evasion, immunities)',spellNotes:'Spell/ability limitations',
 hpDetail:'Hit dice',acDetail:'AC breakdown',saveDetail:'Save modifiers',
 maneuverDetail:'Maneuver modifiers',movementDetail:'Movement',attackDetail:'Printed attacks',
 skillDetail:'Printed skills'
};
// Every combat-relevant slot is visible and nullable; a blank is *unknown*,
// never an implicit +0, AC 10, or resistance 0.
export const npcStatGroups=Object.freeze([
 {title:'Defense & saves',keys:['ac','touch','flat','fort','ref','will','cmd','dr','sr']},
 {title:'Attacks & casting',keys:['initiative','bab','cmb','meleeAttack','rangedAttack','casterLevel','spellPenetration','spellDC','perception','reach']},
 {title:'Movement & recovery',keys:['speed','flySpeed','swimSpeed','climbSpeed','burrowSpeed','fastHealing','regeneration']},
 {title:'Challenge & ability scores',keys:['cr','str','dex','con','int','wis','cha']}
]);
export const npcTextGroups=Object.freeze([
 {title:'Identity & creature',keys:['summary','source','alignment','size','creatureType','subtypes','senses','languages']},
 {title:'Defenses & exceptions',keys:['defenses','drBypass','energyResistances','immunities','vulnerabilities','saveSpecial','spellNotes','acDetail','saveDetail','hpDetail']},
 {title:'Offense & equipment',keys:['specialAttacks','attackDetail','maneuverDetail','movementDetail','skillDetail','qualities','feats','gear']}
]);
export const npcNumericKeys=Object.freeze(npcStatGroups.flatMap(group=>group.keys));
export const npcTextKeys=Object.freeze(npcTextGroups.flatMap(group=>group.keys));
export function normalizeNpcSheet(data={}){
 const oldStats=data?.npcStats&&typeof data.npcStats==='object'&&!Array.isArray(data.npcStats)?data.npcStats:{};
 const oldText=data?.npcText&&typeof data.npcText==='object'&&!Array.isArray(data.npcText)?data.npcText:{};
 return {...data,
  ...Object.fromEntries(['hp_curr','hp_max','hp_temp','mp_curr','mp_max'].map(key=>[key,Number.isFinite(data?.[key])?data[key]:null])),
  npcStats:Object.fromEntries(npcNumericKeys.map(key=>[key,Number.isFinite(oldStats[key])?oldStats[key]:null])),
  npcText:Object.fromEntries(npcTextKeys.map(key=>[key,typeof oldText[key]==='string'&&oldText[key].trim()?oldText[key]:null]))
 };
}
export const NPC_NOTE_LIMIT=64000;

const clean=text=>text.replace(/\*\*|__|`/g,'').replaceAll('−','-').trim();
const valueAtStart=text=>{
 const match=/^[+\-]?\d+(?:\.\d+)?/.exec(text||'');
 const value=match?Number(match[0]):null;
 return Number.isFinite(value)&&Math.abs(value)<=100000?value:null;
};
function namedValue(text,label){
 return valueAtStart(new RegExp('(?:^|[\\s,;])'+label+'\\s*([+\\-]?\\d+)', 'i').exec(text||'')?.[1]);
}
function splitEntries(text){
 const rows=[];let start=0,depth=0;
 for(let i=0;i<text.length;i++){
  if(text[i]==='(')depth++;
  if(text[i]===')')depth=Math.max(0,depth-1);
  if(!depth&&',;'.includes(text[i])){rows.push(text.slice(start,i).trim());start=i+1;}
 }
 rows.push(text.slice(start).trim());return rows.filter(Boolean);
}
function attacks(text,type){
 return splitEntries(text.replace(/\s+or\s+(?=[^()]*\()/gi,'; ')).flatMap(part=>{
  const row=/^(.+?)\s+([+-]\d+(?:\s*\/\s*[+-]\d+)*)\s*\(([^)]+)\)/.exec(part);
  if(!row)return [];
  const bonuses=row[2].split('/').map(valueAtStart);
  const [damage,critical='',multiplier='']=row[3].split('/').map(s=>s.trim());
  let formula='';
  try{if(diceTerms(damage).some(term=>term.count))formula=damage;}catch{}
  const range=/^(?:20|(?:[1-9]|1\d)-20)$/.test(critical)?critical:'';
  const mult=[critical,multiplier].find(value=>/^[x×][2-5]$/i.test(value));
  return bonuses.flatMap((bonus,index)=>bonus===null?[]:[{
   name:(row[1]+(bonuses.length>1?' · Attack '+(index+1):'')).slice(0,120),
   attack_type:type,npcAttackBonus:bonus,damage:formula,crit_range:range,
   crit_mult:mult?'x'+mult[1]:'',desc:part.slice(0,1200)
  }]);
 }).slice(0,100);
}

// The note is data. Only fields from the stat block are copied into the sheet.
export function parseNpcStatBlock(markdown=''){
 if(typeof markdown!=='string'||markdown.length>NPC_NOTE_LIMIT)throw Error('Use a Markdown note under 64,000 characters.');
 const rows=new Map();let name='',summary='',source='',abilityList=false;
 const activeAbilities=[];
 for(const raw of markdown.split(/\r?\n/)){
  const line=clean(raw);
  if(/^#\s+\S/.test(line)&&!name)name=line.replace(/^#\s+/,'').slice(0,80);
  if(/^##\s/.test(line))abilityList=false;
  if(/^Key abilities\b/i.test(line))abilityList=true;
  if(/^CR\s+\d/i.test(line)&&!summary)summary=line;
  if(/^Source:\s*/i.test(line))source=line.replace(/^Source:\s*/i,'');
  if(abilityList){
   const ability=/^\s*-\s+\*\*(.+?)\*\*:?\s+(.+)/.exec(raw);
   if(ability&&activeAbilities.length<100)activeAbilities.push({name:ability[1].replace(/:$/,'').slice(0,120),desc:clean(ability[2]).slice(0,12000),...( /\((?:Sp|SL)\)/i.test(ability[1])?{ability_kind:'sp'}:/\(Su\)/i.test(ability[1])?{ability_kind:'su'}:/\(Ex\)/i.test(ability[1])?{ability_kind:'ex'}:{} )});
  }
  const table=/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/.exec(line);
  const inline=/^(Init(?:iative)?|AC|HP|Fort|Ref|Will|Speed|Space|Reach|Melee|Ranged|Str|Dex|Con|Int|Wis|Cha|BAB|CMB|CMD|Feats|Skills|Languages|SQ|Gear|Senses|Defensive Abilities|Special Attacks|DR|SR|Resist|Immune|Weaknesses|Caster Level|CL|Spell DC|Perception)\s*:?\s+(.+)$/i.exec(line);
  const row=table||inline;
  if(row&&!rows.has(row[1].toLowerCase()))rows.set(row[1].toLowerCase(),row[2]);
 }
 const get=key=>rows.get(key)||'';
 const init=get('init')||get('initiative'),ac=get('ac'),hp=get('hp'),saves=get('fort'),bab=get('bab'),scores=get('str');
 const npcStats={},values={
  cr:namedValue(summary,'CR'),initiative:valueAtStart(init),ac:valueAtStart(ac),
  touch:namedValue(ac,'touch'),flat:namedValue(ac,'flat[- ]footed'),fort:valueAtStart(saves),
  ref:valueAtStart(get('ref'))??namedValue(saves,'Ref'),will:valueAtStart(get('will'))??namedValue(saves,'Will'),
  speed:valueAtStart(get('speed')),bab:valueAtStart(bab),cmb:valueAtStart(get('cmb'))??namedValue(bab,'CMB'),
  cmd:valueAtStart(get('cmd'))??namedValue(bab,'CMD'),str:valueAtStart(scores),
  casterLevel:valueAtStart(get('cl'))??valueAtStart(get('caster level')),
  spellDC:valueAtStart(get('spell dc')),
  perception:valueAtStart(get('perception'))??namedValue(init,'Perception')??namedValue(get('senses'),'Perception'),
  reach:valueAtStart(get('reach'))??namedValue(get('space'),'Reach'),
  flySpeed:namedValue(get('speed'),'fly'),swimSpeed:namedValue(get('speed'),'swim'),
  climbSpeed:namedValue(get('speed'),'climb'),burrowSpeed:namedValue(get('speed'),'burrow'),
  fastHealing:namedValue(get('defensive abilities'),'fast healing'),
  regeneration:namedValue(get('defensive abilities'),'regeneration')
 };
 for(const key of ['dex','con','int','wis','cha'])values[key]=valueAtStart(get(key))??namedValue(scores,key);
 const defensiveText=[get('defensive abilities'),get('dr'),get('sr')].filter(Boolean).join('; ');
 const importedDr=parseDr(get('dr')||defensiveText);
 const importedSr=parseSr(get('sr')?'SR '+get('sr'):defensiveText);
 if(importedDr)values.dr=importedDr.amount;
 if(importedSr!==null)values.sr=importedSr;
 for(const [key,value] of Object.entries(values))if(value!==null)npcStats[key]=value;
 const npcText={};
 const details={summary,source,senses:get('senses')||/\bSenses\s+(.+)/i.exec(init)?.[1],languages:get('languages'),
  defenses:get('defensive abilities'),specialAttacks:get('special attacks'),qualities:get('sq'),gear:get('gear'),feats:get('feats'),
  hpDetail:hp,acDetail:ac,saveDetail:[saves,get('ref'),get('will')].filter(Boolean).join('; '),maneuverDetail:[bab,get('cmb'),get('cmd')].filter(Boolean).join('; '),
  movementDetail:get('speed'),attackDetail:[get('melee'),get('ranged')].filter(Boolean).join('; '),skillDetail:get('skills'),
  drBypass:importedDr?.bypass,energyResistances:get('resist'),immunities:get('immune'),vulnerabilities:get('weaknesses')};
 for(const [key,value] of Object.entries(details))if(value)npcText[key]=value.slice(0,4000);
 const skillText=[...splitEntries(get('skills'))];
 const perception=/\bPerception\s+[+-]\d+/i.exec(init)?.[0];
 if(perception&&!skillText.some(row=>/^perception\s/i.test(row)))skillText.push(perception);
 const npcSkills=skillText.flatMap(text=>{
  const row=/^(.+?)\s+([+-]\d+)(?:\s+.*)?$/.exec(text),bonus=valueAtStart(row?.[2]);
  return row&&bonus!==null?[{name:row[1].slice(0,120),bonus}]:[];
 }).slice(0,100);
 const maxHp=valueAtStart(hp),weapons=[...attacks(get('melee'),'melee'),...attacks(get('ranged'),'ranged')];
 // Standard STR/DEX/etc. keys remain available to explicit damage formulas.
 const abilities=Object.fromEntries(['str','dex','con','int','wis','cha'].filter(key=>Object.hasOwn(npcStats,key)).map(key=>[key,npcStats[key]]));
 return {name,data:normalizeNpcSheet({manualCharacter:true,...abilities,...(maxHp===null?{}:{hp_max:Math.max(0,maxHp),hp_curr:Math.max(0,maxHp)}),npcStats,npcText,npcSkills,weapons,activeAbilities})};
}
