import {registry} from './catalog.mjs';
import {archer,archerAtLevel,archerChanges} from './archer-levels.mjs';
import {fixedSkills} from '../../sheet/skills.mjs';
import {sheetStats} from '../../sheet/model.mjs';
import {syncLimitBreaks} from '../../sheet/limit-breaks.mjs';

export const ARCHER_ID='ffd20:class:archer';
export const BLACK_MAGE_ID='ffd20:class:black-mage';
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const mod=n=>Math.floor((n-10)/2);
const uniq=a=>[...new Set(a)];
const invalid=message=>{throw Object.assign(Error(message),{code:'INVALID_CHARACTER'});};
const eventPool=(event)=>event.poolIds?.[0]||event.poolId;

function makeArcherClass(){
 const pools=[
  ...Object.entries(archer.data.stylePools).map(([key,list])=>({
   id:ARCHER_ID+':pool:'+key,name:key==='initial'?'Archery Style':key==='improved'?'Improved Archery Style':'Archery Style Mastery',
   options:list.map(name=>({id:ARCHER_ID+':style:'+slug(name),name,description:'Bonus style feat: '+name,repeatLimit:1,featureIds:[]}))})),
  {id:ARCHER_ID+':pool:archery-talents',name:'Archery Talents',options:archer.data.talents.map(t=>({
   id:t.id,name:t.name,description:t.description,repeatLimit:t.repeatLimit||1,
   featureIds:[t.id],minimumLevel:t.minimumLevel,requiresTalentIds:t.requiresTalentIds,
   additionalPrerequisite:t.additionalPrerequisite,asterisk:t.asterisk}))}
 ];
 const events=archer.data.events.filter(e=>e.type==='choose').map(e=>({
  ...e,poolIds:[e.poolId],count:{kind:'constant',value:1},
  sourceRefs:archer.sources[0]?[{sourceId:'archer',section:'Class Features',locator:'choice-level-'+e.atClassLevel}]:[]}));
 return {...archer,features:archer.data.features,choicePools:pools,
  data:{...archer.data,events},resources:[]};
}
export const archerClass=makeArcherClass();
export const availableClasses=[registry.class,archerClass];
export const classFor=b=>availableClasses.find(c=>c.id===(b?.classId||BLACK_MAGE_ID))||null;
export const isArcher=b=>(b?.classId===ARCHER_ID);
export const className=b=>classFor(b)?.name||'Unknown class';
export const classHitDie=b=>isArcher(b)?8:6;
export const classDefaultHp=b=>(isArcher(b)?5:4);
export const classHasSpells=b=>!isArcher(b);

export function classSkill(b,id){
 if(!isArcher(b))return registry.class.data.classSkills.some(s=>s.skillId===id);
 const value=id.replace(/^skill:/,'');
 return archer.data.classSkills?.includes(value)||false;
}
export function archerChoiceEvents(b){
 if(!isArcher(b))return [];
 return archerClass.data.events.filter(e=>e.type==='choose'&&e.atClassLevel<=b.level);
}
export function archerEligibleOptions(b,event){
 const pool=archerClass.choicePools.find(p=>p.id===eventPool(event));if(!pool)return [];
 if(!pool.id.endsWith(':archery-talents'))return pool.options;
 const before=archerChoiceEvents(b).filter(e=>e.atClassLevel<event.atClassLevel);
 const learned=new Set(before.flatMap(e=>b.choices?.[e.id]||[]));
 // External feat prerequisites cannot be verified against free-form general feat slots.
 return pool.options.filter(o=>event.atClassLevel>=o.minimumLevel
   &&(o.requiresTalentIds||[]).every(id=>learned.has(id))
   &&(!o.additionalPrerequisite||o.additionalPrerequisite==='Evasion class feature'&&event.atClassLevel>=3
      ||[...learned].some(id=>id.endsWith(':'+slug(o.additionalPrerequisite.replace(/ feat$/i,''))))));
}
export function archerFeatureChanges(b,baseline){
 if(!isArcher(b))return [];
 return archerChanges(b.level).filter(x=>!baseline||x.kind==='new'&&b.level>baseline.level||x.kind==='upgrade'&&b.level>baseline.level)
 .filter(x=>x.kind!=='choice')
 .map(x=>({kind:x.kind,feature:{id:x.featureId,name:x.name,description:x.description}}));
}
export const archerCurrentDescription=f=>{
 const state=f.state||{};
 const fields=[];
 if(f.name==='Aim')fields.push('Insight +'+state.bonus+'; '+state.targets+' aimed targets; '+(state.action==='move_or_swift'?'move or swift action':'move action'));
 if(f.name==='Hawkeye')fields.push('Perception +'+state.perceptionBonus+'; bow/crossbow range increment +'+state.rangeIncrementFeet+' ft');
 if(f.name==='Expert Archer')fields.push('Bow/crossbow attack and damage +'+state.rangedAttackBonus);
 if(f.name==='Fast Movement')fields.push('Conditional speed +'+state.speedBonusFeet+' ft');
 if(f.name==='Evasion'&&state.improved)fields.push('Improved Evasion');
 if(f.name==='Uncanny Dodge'&&state.improved)fields.push('Improved Uncanny Dodge');
 if(f.name==='Evasive Archer')fields.push('Dodge AC +'+state.rangedAcDodgeBonus+' against ranged attacks only');
 if(f.name==='Critical Aim')fields.push('Threat-range increase +'+state.extraThreatRange+' for bows/crossbows');
 if(f.name==='Shell Piercer'||f.name==='Trueshot Arrow')fields.push('Limit Break duration '+state.durationRounds+' rounds; scaling tier '+state.arrowsOrDcBonus);
 return f.description+(fields.length?'\nCurrent at Archer level '+f.currentLevel+': '+fields.join('; ')+'.':'');
};
export function archerPreview(b,{scores,race,racial,hpRolls,carriedLevels=0}){
 const view=archerAtLevel(b.level),bonus=Number(b.carry?.mpBonus||0),baseMp=Number(b.carry?.mpClass||0);
 const summary={bab:view.row.bab+Number(b.carry?.bab||0),
  fort:view.row.fort+Number(b.carry?.fort||0),
  ref:view.row.ref+Number(b.carry?.ref||0),will:view.row.will+Number(b.carry?.will||0),
  baseMp,bonusMp:bonus,mp:baseMp+bonus,spellLevel:0,
  skillPerLevel:Math.max(1,6+mod(scores.int))};
 const features=view.features.map(f=>({...f,currentLevel:b.level,description:archerCurrentDescription({...f,currentLevel:b.level})}));
 const selections=archerChoiceEvents(b).filter(e=>eventPool(e).endsWith(':archery-talents'))
  .flatMap(e=>b.choices?.[e.id]||[]);
 for(const id of uniq(selections)){const t=archer.data.talents.find(t=>t.id===id);if(t)features.push({id,name:t.name,description:t.description,activation:'passive',featureKind:'class_feature',automation:'manual'});}
 const favored=(b.favored||[]).slice(0,b.level);
 const hp=hpRolls.reduce((sum,n)=>sum+Math.max(1,n+mod(scores.con)),0)+favored.filter(x=>x==='hp').length;
 const carryHp=Number(b.carry?.hpMax||0)+carriedLevels*(mod(scores.con)-mod(b.carry?.con??scores.con));
 const skillBudget=Number(b.carry?.skillBudget||0)+carriedLevels*(mod(scores.int)-mod(b.carry?.int??scores.int))
   +summary.skillPerLevel*b.level+favored.filter(x=>x==='skill').length;
 return {scores,summary,race,racial,features,hp:hp+carryHp,skillBudget};
}
export function archerIssues(b,{complete=true}={}){
 const issues=[],add=(step,message)=>issues.push({step,message});
 if(!Number.isInteger(b.level)||b.level<1||b.level>20)add(3,'Choose an Archer level from 1 to 20.');
 if(b.archetypeId)add(3,'Archer archetypes require their own extracted rules and cannot be selected yet.');
 if(b.carry)add(3,'Archer multiclassing requires a separate verified integration. Create or level an Archer for now.');
 if((b.spellIds||[]).length)add(5,'Archer does not learn Black Mage spells.');
 if(b.initialIntMod!==null&&b.initialIntMod!==undefined)add(5,'Archer has no spellbook initialization.');
 if(!complete)return issues;
 if(b.hpRolls.length!==b.level||b.hpRolls.some((n,i)=>!Number.isInteger(n)||n<1||n>8||i===0&&n!==8))add(4,'Archer starts with 8 base HP and gains 5 base HP at each later level.');
 if(b.favored.length||b.favored.some(x=>x))add(4,'Favored-class bonuses are manual for this class.');
 const selected=new Set(),unique=new Set();
 for(const event of archerChoiceEvents(b)){
  const chosen=b.choices?.[event.id]||[],options=archerEligibleOptions(b,event);
  if(chosen.length!==1||!options.some(o=>o.id===chosen[0]))add(4,'Archer level '+event.atClassLevel+': choose a valid '+archerClass.choicePools.find(p=>p.id===eventPool(event))?.name+'.');
  for(const id of chosen){if(unique.has(id))add(4,'Repeated Archer feat or talent '+id+' is not supported.');unique.add(id);selected.add(id);}
 }
 const allowed=new Set(archerChoiceEvents(b).map(e=>e.id));
 if(Object.keys(b.choices||{}).some(id=>!allowed.has(id)))add(4,'Unknown or premature Archer class selection.');
 if(!b.reviewed)add(6,'Confirm you reviewed the Archer character preview.');
 return issues;
}
const skillId=row=>'skill:'+row.name.toLowerCase().replace('knw: ','knowledge-').replaceAll(' ','-');
export function compileArcherBuild(b,previous,{preview,raceTraits,calculated,rankFloor}){
 const p=preview,oldManaged=previous.rulesBuild,next=structuredClone(previous),rollback=oldManaged?.rollback||structuredClone(previous);
 const ownedKeys=['hp_max','bab','fort_base','ref_base','will_base','mp_class','mp_bonus','mp_max_spell_level','speed','size_category','languages','senses','proficiencies'];
 Object.assign(next,p.scores,{charName:b.name.trim(),alignment:b.alignment,bio:b.bio,portrait:b.portrait,
  source:'FFD20',race:p.race.name,class:'Archer',classId:ARCHER_ID,
  level:b.level,class_level:b.level,character_level:b.level,total_level:b.level,
  classes:[{name:'Archer',level:b.level,archetype:''}],archetype:'',
  hp_max:p.hp,bab:p.summary.bab,fort_base:p.summary.fort,ref_base:p.summary.ref,will_base:p.summary.will,
  mp:0,mp_class:0,mp_bonus:0,mp_max_spell_level:0,spell_dc_base:'dex'});
 const effects=p.racial.traits.flatMap(f=>f.effects).filter(e=>e.automation==='automatic'&&!e.condition);
 const langs=[],senses=[],profs=[];next.speed=0;next.size_category='Medium';
 for(const effect of effects){
  if(effect.target==='identity.speed.land')next.speed=calculated(effect.value,b);
  if(effect.target==='identity.size_category')next.size_category=String(effect.textValue||'Medium').replace(/^./,ch=>ch.toUpperCase());
  if(effect.target.startsWith('identity.languages.'))langs.push(effect.textValue||effect.target.split('.').at(-1));
  if(effect.target.startsWith('identity.senses.'))senses.push(effect.textValue||effect.target.split('.').at(-1));
  if(effect.target.startsWith('proficiencies.weapon.'))profs.push(effect.textValue||effect.target.split('.').at(-1).replaceAll('-',' '));
 }
 next.size=next.size_category;next.languages=uniq(langs).join(', ');next.senses=uniq(senses).join('; ');
 next.proficiencies=uniq([...profs,'Simple weapons','Bows','Crossbows','Light armor']).join(', ');
 next.racialIdentity={type:effects.find(e=>e.target==='identity.type')?.textValue||'',subtypes:uniq(effects.filter(e=>e.target==='identity.subtypes').map(e=>e.textValue).filter(Boolean)),
  rules:p.racial.traits.filter(f=>f.sheetTargets?.includes('identity')&&f.effects.some(e=>e.target.startsWith('identity.'))).map(f=>({id:f.id,name:f.name,description:f.description}))};
 if(!Object.keys(previous).length){
  next.hp_curr=p.hp;next.mp=next.mp_curr=0;next.mp_temp=0;
  next.items=[{name:'Starting outfit',type:'Gear',amount:1,desc:'Starting outfit worth up to 10 gil.',value:10,sourceRuleId:ARCHER_ID+':starting-outfit'}];
  next.weapons=[];next.currency_gil=next.gil=175;
 }
 const previousSkills=previous.skills||fixedSkills.map(r=>({...r,lvl:0,temp:0,cs:false,subName:''}));
 next.skills=previousSkills.map((row,i)=>{
  const r={...row},sid=skillId(r),owned=classSkill(b,sid)||p.racial.traits.some(f=>f.effects.some(e=>e.target==='skills.'+sid+'.class_skill'&&e.automation==='automatic'));
  r.lvl=b.skillRanks?.[i]||0;r.cs=owned||(row.cs===true&&row.rulesClassSkill!==true);r.rulesClassSkill=owned;
  r.temp=Number(row.temp||0)-Number(row.rulesBonus||0);let bonus=0;
  for(const e of effects)if(e.target==='skills.'+sid+'.bonus')bonus+=Number(calculated(e.value,b)||0);else if(e.target==='skills.'+sid+'.class_skill')r.cs=true;
  if(sid==='skill:perception'&&b.level>=2)bonus+=archerAtLevel(b.level).features.find(f=>f.name==='Hawkeye')?.state.perceptionBonus||0;
  r.rulesBonus=bonus;r.temp+=bonus;return r;
 });
 const rows={activeAbilities:[],passiveAbilities:[],racialAbilities:[],feats:[],spells:[]};
 const grant=(f,where)=>{const old=previous[where]?.find(x=>x.sourceRuleId===f.id);
  if(oldManaged?.ownedIds?.includes(f.id)&&!old)return;
  const row={...old,name:old?.rulesName&&old.name!==old.rulesName?old.name:f.name,
   desc:old?.rulesDescription&&old.desc!==old.rulesDescription?old.desc:f.description,
   rulesName:f.name,rulesDescription:f.description,sourceRuleId:f.id,
   sourceClass:'Archer',rulesOwned:true,...(/limit break/i.test(f.name)?{limitBreak:true}:{})};
  rows[where].push(row);
 };
 for(const f of p.features)grant(f,['active','mixed'].includes(f.activation)?'activeAbilities':'passiveAbilities');
 for(const f of p.racial.traits)if(!f.effects.length||!f.effects.every(e=>e.target.startsWith('identity.')||e.target.startsWith('ability_scores.')))grant(f,'racialAbilities');
 for(let lv=1;lv<=b.level;lv+=2){const id='comos:feat-slot:'+lv,old=previous.feats?.find(f=>f.sourceRuleId===id);rows.feats.push({...old,name:old?.name||'Feat · level '+lv,desc:old?.desc||'',sourceRuleId:id,rulesOwned:true,pendingFeat:old?.pendingFeat??true});}
 for(const event of archerChoiceEvents(b).filter(e=>!eventPool(e).endsWith('archery-talents'))){
  const option=archerEligibleOptions(b,event).find(o=>o.id===b.choices?.[event.id]?.[0]),old=previous.feats?.find(f=>f.sourceRuleId===event.id);
  if(option)rows.feats.push({...old,name:old?.rulesName&&old.name!==old.rulesName?old.name:'Archer '+option.name,
   desc:old?.rulesDescription&&old.desc!==old.rulesDescription?old.desc:'Archery Style bonus feat: '+option.name,
   rulesName:'Archer '+option.name,rulesDescription:'Archery Style bonus feat: '+option.name,
   sourceRuleId:event.id,sourceClass:'Archer',rulesOwned:true,pendingFeat:false});
 }
 for(const key of Object.keys(rows)){
  const owned=new Set(oldManaged?.ownedIds||[]);
  next[key]=[...(previous[key]||[]).filter(row=>!row.rulesOwned||!owned.has(row.sourceRuleId)&&!rows[key].some(f=>f.sourceRuleId===row.sourceRuleId)),...rows[key]];
 }
 next.favoredClassBonuses={};next.favored_class_options=p.race.data.favoredRewards.filter(x=>x.classId===ARCHER_ID).map(x=>x.description).join('\n')+'\nFavored rewards require manual adjudication.';
 next.standardRacialTraits=p.race.data.standardTraitIds.map(id=>({name:p.race.features.find(f=>f.id===id)?.name||id,enabled:!b.disabledTraits.includes(id)&&!p.racial.replaced.includes(id)}));
 next.alternateRacialTraits=b.alternateIds.map(id=>({name:p.race.features.find(f=>f.id===id)?.name||id,enabled:true}));
 next.castingProfiles=[];next.spells=(previous.spells||[]).filter(s=>!s.rulesOwned);
 const lastValues=Object.fromEntries(ownedKeys.map(k=>[k,next[k]]));
 if(oldManaged)for(const key of ownedKeys){
  if(key==='mp_max_spell_level')continue;
  const previousValue=oldManaged.lastValues?.[key];
  if(typeof previousValue==='number'&&typeof previous[key]==='number')next[key]+=previous[key]-previousValue;
  else if(previousValue!==undefined&&previous[key]!==previousValue)next[key]=previous[key];
 }
 next.rulesBuild={rankFloor:b.skillRanks?[...b.skillRanks]:rankFloor,version:b.version,input:b,
  ownedIds:Object.values(rows).flat().map(x=>x.sourceRuleId),lastValues,rollback};
 syncLimitBreaks(next);return next;
}
