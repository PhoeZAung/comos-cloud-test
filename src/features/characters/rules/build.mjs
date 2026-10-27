import {registry} from './catalog.mjs';
import {spells} from './spells.mjs';
import {blackMageSummary} from '../rules-summary.mjs';
import {fixedSkills} from '../../sheet/skills.mjs';
import {pointSpend,standardArray} from '../ability-generation.mjs';
export {registry,spells};
export const stats=['str','dex','con','int','wis','cha'];
export const steps=['Identity','Base scores','Race','Class','Choices','Spells','Review'];
const mod=n=>Math.floor((n-10)/2),uniq=a=>[...new Set(a)];
const bad=m=>{throw Object.assign(Error(m),{code:'INVALID_CHARACTER'});};
export function newBuild(){return {version:registry.version,name:'',alignment:'',bio:'',portrait:'',baseScores:Object.fromEntries(stats.map(k=>[k,10])),abilityMethod:'manual',pointBudget:15,scorePool:[],scoreAssignments:[0,1,2,3,4,5],abilityIncreases:{},initialIntMod:null,raceId:'',heritageId:'',disabledTraits:[],alternateIds:[],level:1,archetypeId:'',choices:{},spellIds:[],spellSelections:null,skillRanks:null,hpRolls:[6],favored:[],reviewed:false};}
export function raceFor(b){return registry.races.find(r=>r.id===b.raceId);}
export function replacementFor(r,id){return r.data.alternateReplacements.filter(x=>x.addsFeatureIds.includes(id));}
export function raceTraits(b){
 const r=raceFor(b);if(!r)return {traits:[],replaced:[],errors:[]};
 const disabled=new Set(b.disabledTraits),active=new Set(r.data.standardTraitIds.filter(id=>!disabled.has(id))),consumed=new Set(),errors=[];
 const heritage=r.data.heritages.find(h=>h.id===b.heritageId);
 const operations=[...(heritage?.replacements||[]),...b.alternateIds.flatMap(id=>replacementFor(r,id))];
 for(const op of operations){
  if(op.resolution!=='resolved'||op.operation!=='replace'||op.scope!=='whole_feature'){errors.push('This trait needs a precise replacement mapping: '+op.description);continue;}
  for(const id of op.targetFeatureIds){if(consumed.has(id))errors.push('Two selections replace '+(r.features.find(f=>f.id===id)?.name||id)+'.');consumed.add(id);active.delete(id);}
  // A user-disabled score/trait stays disabled when a heritage replaces its vector.
  if(!op.targetFeatureIds.some(id=>disabled.has(id)))for(const id of op.addsFeatureIds)active.add(id);
 }
 return {traits:r.features.filter(f=>active.has(f.id)),replaced:[...consumed],errors};
}
export function effectiveScores(b){const result={...b.baseScores};for(const [level,key] of Object.entries(b.abilityIncreases||{}))if(Number(level)<=b.level&&stats.includes(key))result[key]++;for(const f of raceTraits(b).traits)for(const e of f.effects)if(e.automation==='automatic'&&!e.condition&&e.kind==='ability_score'&&e.value?.kind==='constant'){const k=e.target.split('.').at(-1);if(stats.includes(k))result[k]+=e.value.value;}return result;}
export function calculated(value,b,effective=effectiveScores(b)){
 if(!value)return null;if(value.kind==='constant')return value.value;
 if(value.kind==='level_table'){const level=value.levelBasis==='ability_score'?effective.int:b.level;return value.rows.filter(r=>r.from<=level).at(-1)?.value??value.belowFirst;}
 if(value.kind!=='formula')return null;
 let expression=value.expression;
 const vars={CLASS_LEVEL:b.level,CHARACTER_LEVEL:b.level,CASTER_LEVEL:b.level,SPELL_LEVEL:Math.min(9,Math.ceil(b.level/2)),FAVORED_SELECTIONS:0,CHOICE_RANK:1};
 for(const key of stats){vars[key.toUpperCase()+'_MOD']=mod(effective[key]);vars[key.toUpperCase()+'_SCORE']=effective[key];}
 expression=expression.replace(/\b[A-Z_]+\b/g,key=>{if(!Object.hasOwn(vars,key))bad('Unknown formula variable.');return '('+vars[key]+')';});
 const tokens=expression.match(/\d+(?:\.\d+)?|floor|ceil|min|max|[()+*/,\-]/g)||[];
 if(tokens.join('')!==expression.replace(/\s/g,'')||tokens.length>100)bad('Unsupported rules formula.');let at=0,depth=0;
 function atom(){if(++depth>20)bad('Formula nesting too deep.');let t=tokens[at++],v;
  if(t==='-'||t==='+')v=(t==='-'?-1:1)*atom();
  else if(t==='('){v=sum();if(tokens[at++]!==')')bad('Invalid formula.');}
  else if(['floor','ceil','min','max'].includes(t)){if(tokens[at++]!=='(')bad('Invalid formula.');const args=[sum()];while(tokens[at]===','){at++;args.push(sum());}if(tokens[at++]!==')'||args.length>8)bad('Invalid formula.');v=Math[t](...args);}
  else if(t&&/^\d/.test(t))v=Number(t);else bad('Invalid formula.');depth--;return v;}
 function product(){let v=atom();while(['*','/'].includes(tokens[at])){let op=tokens[at++],n=atom();if(op==='/'&&!n)bad('Division by zero.');v=op==='*'?v*n:v/n;}return v;}
 function sum(){let v=product();while(['+','-'].includes(tokens[at])){let op=tokens[at++],n=product();v=op==='+'?v+n:v-n;}return v;}
 let v=sum();if(at!==tokens.length||!Number.isFinite(v)||Math.abs(v)>1000000)bad('Invalid formula result.');
 v=value.rounding==='ceil'?Math.ceil(v):value.rounding==='none'?v:Math.floor(v);if(value.minimum!==null)v=Math.max(v,value.minimum);if(value.maximum!==null)v=Math.min(v,value.maximum);return v;
}
export function choiceEvents(b){return registry.class.data.events.filter(e=>e.type==='choose'&&e.atClassLevel<=b.level&&registry.class.choicePools.some(p=>e.poolIds.includes(p.id)&&p.options.length));}
export function eligibleOptions(b,event){const pool=registry.class.choicePools.find(p=>event.poolIds.includes(p.id)&&p.options.length);return pool?.options||[];}
export function spellCounts(b){const int=b.initialIntMod??mod(effectiveScores(b).int);return {cantrips:4+Math.floor((b.level-1)/3),leveled:Math.max(0,3+int)+2*(b.level-1)+(b.level>=7?1:0)+(b.level>=12?1:0)+(b.level>=17?1:0)};}
export function buildIssues(b,{complete=true}={}){
 const errors=[];const add=(step,message)=>errors.push({step,message});
 if(!b.name.trim())add(0,'Enter a character name.');
 for(const k of stats)if(!Number.isInteger(b.baseScores[k])||b.baseScores[k]<1||b.baseScores[k]>45)add(1,'Base scores must be whole numbers from 1 to 45.');
 if(b.abilityMethod==='point-buy'&&(stats.some(k=>b.baseScores[k]<7||b.baseScores[k]>18)||pointSpend(b.baseScores)>b.pointBudget))add(1,'Point-buy scores must be 7–18 and within the selected budget.');
 if(['array','rolled'].includes(b.abilityMethod)){const pool=b.abilityMethod==='array'?standardArray:b.scorePool;if(pool.length!==6||new Set(b.scoreAssignments).size!==6||b.scoreAssignments.some(i=>!Number.isInteger(i)||i<0||i>5)||stats.some((key,i)=>b.baseScores[key]!==pool[b.scoreAssignments[i]]))add(1,'Assign each generated score exactly once.');}
 if(b.skillRanks!==null&&b.skillRanks!==undefined){const budget=previewBuild(b).skillBudget;if(b.skillRanks.length!==fixedSkills.length||b.skillRanks.some(n=>!Number.isInteger(n)||n<0||n>b.level))add(7,'Skill ranks must be whole numbers up to your character level.');else if(b.skillRanks.reduce((sum,n)=>sum+n,0)!==budget)add(7,'Allocate all '+budget+' skill points.');}
 const race=raceFor(b);if(!race)add(2,'Choose Dwarf, Elvaan or Galka.');
 if(race){if(b.heritageId&&!race.data.heritages.some(h=>h.id===b.heritageId))add(2,'Invalid heritage.');if(b.disabledTraits.some(id=>!race.data.standardTraitIds.includes(id)))add(2,'Unknown standard trait.');if(b.alternateIds.some(id=>!race.data.alternateTraitIds.includes(id)))add(2,'Unknown alternate trait.');for(const error of raceTraits(b).errors)add(2,error);}
 if(!Number.isInteger(b.level)||b.level<1||b.level>20)add(3,'Choose a Black Mage level from 1 to 20.');
 if(b.archetypeId)add(3,'This archetype is not ready for automatic application. Choose base Black Mage for this release.');
 const effective=effectiveScores(b);if(effective.int>45)add(1,'Effective Intelligence above 45 needs a verified bonus-MP table extension.');
 if(complete){
  if(b.hpRolls.length<b.level||b.hpRolls.slice(0,b.level).some(n=>!Number.isInteger(n)||n<1||n>6))add(4,'Enter the base d6 HP result for every class level.');
  if(b.favored.slice(0,b.level).some(v=>!['','hp','skill','racial'].includes(v)))add(4,'Invalid favored class reward.');
  const seen=new Map();for(const event of choiceEvents(b)){const options=eligibleOptions(b,event),chosen=b.choices[event.id]||[],count=calculated(event.count,b);if(chosen.length!==count||chosen.some(id=>!options.some(o=>o.id===id)))add(4,`Level ${event.atClassLevel}: choose ${count} for ${registry.class.choicePools.find(p=>event.poolIds.includes(p.id))?.name}.`);for(const id of chosen){const o=options.find(o=>o.id===id);seen.set(id,(seen.get(id)||0)+1);if(o&&seen.get(id)>(o.repeatLimit||1))add(4,'Repeat limit exceeded for '+o.name+'.');}}
  const s=blackMageSummary(Math.min(20,Math.max(1,b.level)),Math.min(45,effective.int)),chosen=b.spellIds.map(id=>spells.find(s=>s.id===id));
  if(chosen.some(x=>!x)||new Set(b.spellIds).size!==b.spellIds.length)add(5,'Invalid or duplicate learned spell.');
  if(chosen.some(x=>x&&x.level>Math.min(s.spellLevel,effective.int-10)))add(5,'A learned spell exceeds the level or Intelligence requirement.');
  const counts=spellCounts(b);if(chosen.filter(x=>x?.level===0).length!==counts.cantrips||chosen.filter(x=>x?.level>0).length!==counts.leveled)add(5,`Choose ${counts.cantrips} cantrips and ${counts.leveled} other spells.`);
  const limits=[];for(let level=1;level<=b.level;level++){const count=level===1?Math.max(0,3+(b.initialIntMod??mod(effective.int))):2;for(let i=0;i<count+([7,12,17].includes(level)?1:0);i++)limits.push(Math.min(9,Math.ceil(level/2)));}
  const levels=chosen.filter(x=>x?.level>0).map(x=>x.level).sort((a,b)=>a-b);if(levels.some((level,i)=>limits[i]!==undefined&&level>limits[i]))add(5,'Some spells were not available at the level their learning opportunity was gained. Choose more lower-level spells.');
  if(!b.reviewed)add(6,'Confirm you have reviewed the character preview.');
 }
 return errors;
}
export function sanitizeBuild(raw){
 const b=newBuild(),keys=Object.keys(b);if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!keys.includes(k))||raw.version!==registry.version)bad('Unsupported character build.');
 for(const k of ['name','alignment','bio','portrait','raceId','heritageId','archetypeId']){if(typeof raw[k]!=='string'||raw[k].length>(k==='portrait'?160000:k==='bio'?2000:k==='name'?80:250))bad('Invalid '+k+'.');b[k]=raw[k];}
 if(!raw.baseScores||Object.keys(raw.baseScores).some(k=>!stats.includes(k)))bad('Invalid base scores.');for(const k of stats){if(!Number.isInteger(raw.baseScores[k])||raw.baseScores[k]<1||raw.baseScores[k]>45)bad('Invalid base scores.');b.baseScores[k]=raw.baseScores[k];}
 for(const k of ['disabledTraits','alternateIds','spellIds']){if(!Array.isArray(raw[k])||raw[k].length>400||raw[k].some(v=>typeof v!=='string'||v.length>250))bad('Invalid '+k+'.');b[k]=uniq(raw[k]);}
 if(raw.spellSelections!==undefined&&raw.spellSelections!==null){const groups=raw.spellSelections;if(!groups||typeof groups!=='object'||Array.isArray(groups)||Object.keys(groups).some(k=>!['cantrips','leveled'].includes(k)))bad('Invalid spell slots.');for(const k of ['cantrips','leveled'])if(!Array.isArray(groups[k])||groups[k].length>200||groups[k].some(v=>v!==null&&(typeof v!=='string'||v.length>250)))bad('Invalid spell slots.');if(JSON.stringify([...groups.cantrips,...groups.leveled].filter(Boolean))!==JSON.stringify(b.spellIds))bad('Spell slots do not match learned spells.');b.spellSelections=structuredClone(groups);}
 if(raw.skillRanks!==undefined&&raw.skillRanks!==null){if(!Array.isArray(raw.skillRanks)||raw.skillRanks.length!==fixedSkills.length||raw.skillRanks.some(n=>!Number.isInteger(n)||n<0||n>20))bad('Invalid skill ranks.');b.skillRanks=[...raw.skillRanks];}
 for(const k of ['hpRolls','favored']){if(!Array.isArray(raw[k])||raw[k].length>20)bad('Invalid level selections.');b[k]=raw[k].slice();}
 if(raw.abilityMethod!==undefined){if(!['manual','point-buy','array','rolled'].includes(raw.abilityMethod))bad('Unknown score method.');b.abilityMethod=raw.abilityMethod;}
 if(raw.pointBudget!==undefined){if(![10,15,20,25].includes(raw.pointBudget))bad('Invalid point budget.');b.pointBudget=raw.pointBudget;}
 if(raw.scorePool!==undefined){if(!Array.isArray(raw.scorePool)||raw.scorePool.length>6||raw.scorePool.some(n=>!Number.isInteger(n)||n<3||n>18))bad('Invalid score pool.');b.scorePool=[...raw.scorePool];}
 if(raw.scoreAssignments!==undefined){if(!Array.isArray(raw.scoreAssignments)||raw.scoreAssignments.length!==6)bad('Invalid score assignments.');b.scoreAssignments=[...raw.scoreAssignments];}
 if(raw.initialIntMod!==undefined&&raw.initialIntMod!==null){if(!Number.isInteger(raw.initialIntMod)||raw.initialIntMod< -5||raw.initialIntMod>20)bad('Invalid initial INT.');b.initialIntMod=raw.initialIntMod;}
 if(raw.abilityIncreases!==undefined){if(!raw.abilityIncreases||typeof raw.abilityIncreases!=='object'||Array.isArray(raw.abilityIncreases)||Object.keys(raw.abilityIncreases).length>5)bad('Invalid level ability increases.');for(const [level,key] of Object.entries(raw.abilityIncreases)){if(!['4','8','12','16','20'].includes(level)||Number(level)>raw.level||!stats.includes(key))bad('Invalid level ability increase.');b.abilityIncreases[level]=key;}}
 if(!raw.choices||typeof raw.choices!=='object'||Array.isArray(raw.choices)||Object.keys(raw.choices).length>100)bad('Invalid choices.');
 const validIds=new Set(choiceEvents({...b,level:20}).map(e=>e.id));b.choices={};for(const [k,v] of Object.entries(raw.choices)){if(!validIds.has(k)||!Array.isArray(v)||v.length>10||v.some(id=>typeof id!=='string'||id.length>250))bad('Invalid choice.');b.choices[k]=v;}
 if(typeof raw.reviewed!=='boolean'||!Number.isInteger(raw.level))bad('Invalid build.');b.reviewed=raw.reviewed;b.level=raw.level;
 if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(b.name+b.bio+b.alignment))bad('Invalid character text.');
 if(b.portrait&&!/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(b.portrait))bad('Invalid portrait.');
 const errors=buildIssues(b);if(errors.length)bad(errors[0].message);return b;
}
const skillId=row=>'skill:'+row.name.toLowerCase().replace('knw: ','knowledge-').replaceAll(' ','-');
export function previewBuild(b){
 const scores=effectiveScores(b),summary=blackMageSummary(b.level,scores.int),race=raceFor(b),racial=raceTraits(b);
 const featureIds=new Set(registry.class.data.events.filter(e=>e.type==='grant_feature'&&e.atClassLevel<=b.level).flatMap(e=>e.featureIds));
 for(const event of choiceEvents(b))for(const id of b.choices[event.id]||[]){const opt=eligibleOptions(b,event).find(o=>o.id===id);for(const f of opt?.featureIds||[])featureIds.add(f);}
 const features=registry.class.features.filter(f=>featureIds.has(f.id));
 const favored=b.favored.slice(0,b.level),hp=b.hpRolls.slice(0,b.level).reduce((s,n)=>s+Math.max(1,(Number(n)||0)+mod(scores.con)),0)+favored.filter(v=>v==='hp').length;
 return {scores,summary,race,racial,features,hp,skillBudget:summary.skillPerLevel*b.level+favored.filter(v=>v==='skill').length};
}
export function compileBuild(raw,previous={}){
 const previousManaged=previous.rulesBuild;
 const candidate=previousManaged?.input?.initialIntMod!==undefined?{...raw,initialIntMod:previousManaged.input.initialIntMod}:raw;
 const b=sanitizeBuild(candidate),p=previewBuild(b),next=structuredClone(previous);
 if(!previousManaged)b.initialIntMod=mod(p.scores.int);
 const ownedKeys=['hp_max','bab','fort_base','ref_base','will_base','mp_class','mp_bonus','mp_max_spell_level','speed','size_category','languages','senses','proficiencies'];
 // Explicit first adoption retains a rollback snapshot; unknown/manual entries are preserved.
 const rollback=previousManaged?.rollback||structuredClone(previous);
 Object.assign(next,p.scores,{charName:b.name.trim(),alignment:b.alignment,bio:b.bio,portrait:b.portrait,source:'FFD20',race:p.race.name,class:'Black Mage',level:b.level,class_level:b.level,character_level:b.level,total_level:b.level,classes:[{name:'Black Mage',level:b.level,archetype:''}],archetype:'',hp_max:p.hp,bab:p.summary.bab,fort_base:p.summary.fort,ref_base:p.summary.ref,will_base:p.summary.will,mp_class:p.summary.baseMp,mp_bonus:p.summary.bonusMp,mp_max_spell_level:p.summary.spellLevel,spell_dc_base:'int'});
 const effects=p.racial.traits.flatMap(f=>f.effects).filter(e=>e.automation==='automatic'&&!e.condition),lang=[],senses=[],profs=[];
 next.speed=0;next.size_category='Medium';
 for(const e of effects){if(e.target==='identity.speed.land')next.speed=calculated(e.value,b);if(e.target==='identity.size_category')next.size_category=String(e.textValue||'Medium').replace(/^./,c=>c.toUpperCase());if(e.target.startsWith('identity.languages.'))lang.push(e.textValue||e.target.split('.').at(-1));if(e.target.startsWith('identity.senses.'))senses.push(e.textValue||e.target.split('.').at(-1));if(e.target.startsWith('proficiencies.weapon.'))profs.push(e.textValue||e.target.split('.').at(-1).replaceAll('-',' '));}
 next.languages=uniq(lang).join(', ');next.senses=uniq(senses).join('; ');next.proficiencies=uniq([...profs,'Dagger','Sling','Power rod','Power staff','Animated dolls','Quarterstaff','Buckler','Light shields']).join(', ');next.size=next.size_category;
 const initial=!Object.keys(previous).length;
 if(initial){next.hp_curr=p.hp;next.mp=p.summary.mp;next.mp_curr=p.summary.mp;next.mp_temp=0;next.items=[{name:'Starting outfit',type:'Gear',amount:1,desc:'Starting outfit worth up to 10 gil, granted in addition to starting wealth.',value:10,sourceRuleId:'ffd20:class:black-mage:starting-outfit'}];next.weapons=[];next.currency_gil=70;next.gil=70;b.initialIntMod=mod(p.scores.int);}
 else if(next.mp===undefined&&next.mp_curr!==undefined){next.mp=next.mp_curr;next.mp_temp=0;}
 next.favoredClassBonuses=Object.fromEntries(b.favored.slice(0,b.level).map((v,i)=>[String(i+1),v]));
 const originalRows=previous.skills||fixedSkills.map(r=>({...r,lvl:0,temp:0,cs:false,subName:''}));
 next.skills=originalRows.map((row,index)=>{const r={...row};if(b.skillRanks&&index<fixedSkills.length)r.lvl=b.skillRanks[index];const id=skillId(r);r.cs=registry.class.data.classSkills.some(s=>s.skillId===id)||(row.cs===true&&row.rulesClassSkill!==true);r.rulesClassSkill=registry.class.data.classSkills.some(s=>s.skillId===id);
  // Remove only the last source contribution, preserving manually entered misc bonuses.
  r.temp=Number(row.temp||0)-Number(row.rulesBonus||0);let bonus=0;
  for(const e of effects)if(e.target===`skills.${id}.bonus`)bonus+=Number(calculated(e.value,b)||0);else if(e.target===`skills.${id}.class_skill`)r.cs=true;
  if(b.level>=7&&id.startsWith('skill:knowledge-'))bonus+=Math.max(1,Math.floor(b.level/2));r.rulesBonus=bonus;r.temp+=bonus;return r;});
 const rows={activeAbilities:[],passiveAbilities:[],racialAbilities:[],feats:[],spells:[]};
 function grant(f,key){const old=previous[key]?.find(r=>r.sourceRuleId===f.id);if(previousManaged?.ownedIds?.includes(f.id)&&!old)return;
  const action=f.actions?.[0],cost=action?.costs?.[0],pool=registry.class.resources.find(r=>r.id===cost?.resourceId||r.id===f.id.replace(':feature:',':resource:'));const maximum=pool?Math.max(0,calculated(pool.maximum,b)||0):0;
  const row={...old,name:old?.rulesName&&old.name!==old.rulesName?old.name:f.name,desc:old?.rulesDescription&&old.desc!==old.rulesDescription?old.desc:f.description,rulesName:f.name,rulesDescription:f.description,sourceRuleId:f.id,sourceClass:'Black Mage',rulesOwned:true};
  if(pool){const spent=old?Math.max(0,Number(old.u_max||0)-Number(old.u_curr||0)):0;row.u_max=maximum;row.u_curr=Math.max(0,maximum-spent);row.restoreOnLongRest=false;
   if(pool.maximum.kind==='formula'&&!/\b(?:min|max|floor|ceil)\b/.test(pool.maximum.expression)){row.uses_formula=pool.maximum.expression.replace(/\b(STR|DEX|CON|INT|WIS|CHA)_MOD\b/g,'{$1}').replaceAll('CLASS_LEVEL',String(b.level));row.uses_min=pool.maximum.minimum??0;}
  }
  rows[key].push(row);
 }
 for(const f of p.features){const target=f.activation==='active'||f.activation==='mixed'?'activeAbilities':'passiveAbilities';grant(f,target);}
 for(const f of p.racial.traits)if(!f.effects.length||!f.effects.every(e=>e.target.startsWith('identity.')||e.target.startsWith('ability_scores.')))grant(f,'racialAbilities');
 for(let level=1;level<=b.level;level+=2){const id='comos:feat-slot:'+level,old=previous.feats?.find(f=>f.sourceRuleId===id);rows.feats.push({...old,name:old?.name||'Feat · level '+level,desc:old?.desc||'',sourceRuleId:id,rulesOwned:true,pendingFeat:old?.pendingFeat??true});}
 const dcBonus=choiceEvents(b).flatMap(event=>b.choices[event.id]||[]).filter(id=>id==='ffd20:class:black-mage:option:black-magery:spell-mastery').length;
 for(const id of b.spellIds){const spell=spells.find(s=>s.id===id),old=previous.spells?.find(s=>s.sourceRuleId===id);rows.spells.push({...old,sourceRuleId:id,rulesOwned:true,sourceClass:'Black Mage',name:spell.name,desc:spell.description,lvl:spell.level,mp_cost:spell.level,casting_ability:'int',school:spell.school,range:spell.range,duration:spell.duration,saving_throw:spell.save,target:spell.target,rulesDcBonus:spell.level>0?dcBonus:0,dc_misc:Number(old?.dc_misc||0)-Number(old?.rulesDcBonus||0)+(spell.level>0?dcBonus:0)});}
 for(const key of Object.keys(rows))next[key]=[...(previous[key]||[]).filter(r=>!r.rulesOwned),...rows[key]];
 next.standardRacialTraits=p.race.data.standardTraitIds.map(id=>({name:p.race.features.find(f=>f.id===id)?.name||id,enabled:!b.disabledTraits.includes(id)&&!p.racial.replaced.includes(id)}));
 next.alternateRacialTraits=b.alternateIds.map(id=>({name:p.race.features.find(f=>f.id===id)?.name||id,enabled:true}));
 next.favored_class_options=p.race.data.favoredRewards.filter(r=>r.classId===registry.class.id).map(r=>r.description).join('\n')+'\nApply favored-class rewards manually; they are not automatically awarded.';
 const lastValues=Object.fromEntries(ownedKeys.map(k=>[k,next[k]]));
 if(previousManaged)for(const key of ownedKeys){const oldBase=previousManaged.lastValues?.[key];if(typeof oldBase==='number'&&typeof previous[key]==='number')next[key]+=previous[key]-oldBase;else if(oldBase!==undefined&&previous[key]!==oldBase)next[key]=previous[key];}
 next.rulesBuild={version:registry.version,input:b,ownedIds:Object.values(rows).flat().map(r=>r.sourceRuleId),lastValues,rollback};
 return next;
}
export function levelUpBuild(raw,previous){
 const old=previous.rulesBuild?.input;if(!old)bad('Open Edit to establish this character’s reviewed class build before leveling up.');
 if(old.level>=20||raw.level!==old.level+1)bad('Level up adds exactly one level, up to level 20.');
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 for(const key of ['name','alignment','bio','portrait','baseScores','raceId','heritageId','disabledTraits','alternateIds','archetypeId'])if(!same(raw[key],old[key]))bad('Level up cannot change '+key+'. Use Edit instead.');
 const boosts={...(old.abilityIncreases||{})};if(raw.level%4===0){if(!stats.includes(raw.abilityIncreases?.[raw.level]))bad('Choose one ability to increase by +1.');boosts[raw.level]=raw.abilityIncreases[raw.level];}
 if(!same(raw.abilityIncreases||{},boosts))bad('Only the current milestone grants a new +1 ability increase.');
 if(!same(raw.hpRolls,[...old.hpRolls,4]))bad('Black Mage gains 4 base HP at this level.');
 if(raw.skillRanks&&raw.skillRanks.some((n,i)=>n<Number(previous.skills?.[i]?.lvl||0)))bad('Level up cannot remove existing skill ranks.');
 if(old.spellIds.some(id=>!raw.spellIds.includes(id)))bad('Level up cannot remove learned spells.');
 for(const [id,values] of Object.entries(old.choices))if(!same(raw.choices[id],values))bad('Level up cannot replace earlier class choices.');
 if(!same(raw.favored,old.favored))bad('Favored rewards are applied manually.');
 const expectedInitial=old.initialIntMod??mod(effectiveScores(old).int);if(raw.initialIntMod!==expectedInitial)bad('Starting spell entitlement is fixed at creation.');
 return compileBuild(raw,previous);
}
