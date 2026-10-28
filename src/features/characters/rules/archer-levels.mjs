import {archer} from './archer-catalog.mjs';
export {archer};
// Upgrade events point at a stable feature ID; never grant duplicate feature cards.
// Comparisons use Archer CLASS level, independent of total character level.
const initial={
 'aim':{bonus:1,targets:1,action:'move'},
 'hawkeye':{perceptionBonus:1,rangeIncrementFeet:5},
 'expert-archer':{rangedAttackBonus:1,rangedDamageBonus:1},
 'fast-movement':{speedBonusFeet:10},
 'evasion':{improved:false},
 'uncanny-dodge':{improved:false},
 'evasive-archer':{rangedAcDodgeBonus:2},
 'critical-aim':{extraThreatRange:1},
 'shell-piercer':{durationRounds:1,arrowsOrDcBonus:1},
 'trueshot-arrow':{durationRounds:1,arrowsOrDcBonus:1}
};
export function archerAtLevel(value){
 const level=Number(value);
 if(!Number.isInteger(level)||level<1||level>20)throw RangeError('Archer level must be 1–20.');
 const row=archer.data.levels[level-1],upgrades=archer.data.upgrades.filter(u=>u.atClassLevel<=level),currentEvents=archer.data.events.filter(e=>e.atClassLevel===level);
 const features=archer.data.features.filter(f=>f.atLevel<=level).map(f=>{
  const key=f.id.split(':').at(-1),history=upgrades.filter(u=>u.featureId===f.id),
        state=history.reduce((s,u)=>({...s,...u.changes}),{...(initial[key]||{})});
  return {...f,state,history,latestUpgrade:history.at(-1)||null};
 });
 return {level,row,features,events:currentEvents,upgrades:currentEvents.filter(e=>e.type==='upgrade_feature'),
         newFeatures:currentEvents.filter(e=>e.type==='grant_feature'),
         newChoices:currentEvents.filter(e=>e.type==='choose'),
         totalTalentSlots:Math.floor(level/2),totalStyleFeatSlots:1+(level>=5?1:0)+(level>=10?1:0)};
}
export function archerChanges(level){
 const state=archerAtLevel(level);
 return [...state.newFeatures.map(e=>({kind:'new',name:archer.data.features.find(f=>f.id===e.featureId)?.name,description:e.description,featureId:e.featureId})),
  ...state.upgrades.map(e=>({kind:'upgrade',name:archer.data.features.find(f=>f.id===e.featureId)?.name,description:e.description,featureId:e.featureId})),
  ...state.newChoices.map(e=>({kind:'choice',name:e.description,description:'Option must meet prerequisites when implemented.',featureId:e.featureId}))];
}
export function archerTalentOptions(level){
 const n=archerAtLevel(level).level;
 return archer.data.talents.map(t=>({...t,meetsLevel:n>=t.minimumLevel,requiresVerification:!!t.requiresTalentIds.length||!!t.additionalPrerequisite})); 
}
