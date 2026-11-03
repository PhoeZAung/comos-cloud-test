export const diceOptionDefaults=Object.freeze({enabled:false,shape:'standard',material:'polished',color:'#ad94ef',critEffects:true,nat20Effects:true,nat1Effects:true,critSound:false,volume:0.9});
export function normalizeDiceOptions(value={}){
 const v=value&&typeof value==='object'?value:{};
 return {enabled:v.enabled===true,shape:['standard','gemstone'].includes(v.shape)?v.shape:'standard',material:['polished','glass','galaxy','metal'].includes(v.material)?v.material:'polished',color:/^#[a-f0-9]{6}$/i.test(v.color)?v.color:'#ad94ef',critEffects:v.critEffects!==false,nat20Effects:typeof v.nat20Effects==='boolean'?v.nat20Effects:v.critEffects!==false,nat1Effects:typeof v.nat1Effects==='boolean'?v.nat1Effects:v.critEffects!==false,critSound:v.critSound===true,volume:Number.isFinite(v.volume)?Math.max(0,Math.min(1,v.volume)):0.9};
}
export function mergeDiceOptions(current,incoming){const value={...current,...incoming};for(const key of ['nat20Effects','nat1Effects'])if(!Object.hasOwn(incoming,key))value[key]=Object.hasOwn(incoming,'critEffects')&&incoming.critEffects!==current.critEffects?incoming.critEffects:current[key];return normalizeDiceOptions(value);}
export function validDiceOptions(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||!Object.keys(diceOptionDefaults).every(key=>['nat20Effects','nat1Effects'].includes(key)||Object.hasOwn(value,key)))return false;
 const normalized=normalizeDiceOptions(value);return Object.entries(value).every(([key,entry])=>key==='speed'?Number.isFinite(entry)&&entry>=.75&&entry<=2:key==='nat20Style'?['dragon','fire','arcane'].includes(entry):key==='critStyle'?['fire','arcane'].includes(entry):Object.hasOwn(diceOptionDefaults,key)&&normalized[key]===entry);
}
