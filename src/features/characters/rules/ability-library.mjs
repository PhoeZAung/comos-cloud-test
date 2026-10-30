import {registry,previewBuild,calculated,raceFor,classFor} from './build.mjs';
import {isBeastmaster,beastmasterCounter} from './beastmaster-level-one.mjs';
import {isLimitBreak} from '../../sheet/limit-breaks.mjs';
const categories=['activeAbilities','passiveAbilities','racialAbilities','feats'];
export function availableRuleAbilities(data){
 const b=data.rulesBuild?.input;if(!b)return [];
 const preview=previewBuild(b),race=raceFor(b),features=[...preview.features.map(feature=>({feature,definition:isBeastmaster(b)?classFor(b):registry.class,key:feature.activation==='active'||feature.activation==='mixed'?'activeAbilities':'passiveAbilities'})),...preview.racial.traits.filter(f=>!f.effects.length||!f.effects.every(e=>e.target.startsWith('identity.')||e.target.startsWith('ability_scores.'))).map(feature=>({feature,definition:race,key:'racialAbilities'}))];
 return features.map(({feature,definition,key})=>({id:feature.id,name:feature.name,description:feature.description,key,feature,definition,url:definition.sources?.[0]?.url||'',added:categories.some(k=>data[k]?.some(row=>row.sourceRuleId===feature.id))}));
}
export function addRuleAbility(data,id){
 const option=availableRuleAbilities(data).find(o=>o.id===id);if(!option)throw Error('This ability is not granted by the current race, class, level or choices.');if(option.added)throw Error('This ability is already on the sheet.');
 const {feature:f,definition,key}=option,b=data.rulesBuild.input,action=f.actions?.[0],cost=action?.costs?.[0],pool=definition.resources?.find(r=>r.id===cost?.resourceId||r.id===f.id.replace(':feature:',':resource:'));
 const counter=isBeastmaster(b)?beastmasterCounter(f,previewBuild(b).scores):null;
 const maximum=counter?.maximum??(pool?Math.max(0,calculated(pool.maximum,b)||0):0);
 const row={name:f.name,desc:f.description,rulesName:f.name,rulesDescription:f.description,sourceRuleId:f.id,sourceClass:definition===registry.class?registry.class.name:'',rulesOwned:true,u_max:maximum,u_curr:maximum,restoreOnLongRest:pool?.recovery?.automaticRecoveryAllowed===true};
 if(isBeastmaster(b)&&definition.id===b.classId){row.sourceClass=definition.name;if(counter)row.uses_formula=counter.formula;}
 if(f.featureKind==='limit_break'||isLimitBreak(row))row.limitBreak=true;
 data[key]??=[];data[key].push(row);return row;
}
