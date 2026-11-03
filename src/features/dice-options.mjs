export const diceOptionDefaults=Object.freeze({enabled:false,shape:'standard',material:'polished',color:'#ad94ef',critEffects:true,critSound:false,critStyle:'fire',nat20Style:'dragon',volume:0.9});
export function normalizeDiceOptions(value={}){
 const v=value&&typeof value==='object'?value:{};
 return {enabled:v.enabled===true,shape:['standard','gemstone'].includes(v.shape)?v.shape:'standard',material:['polished','glass','galaxy','metal'].includes(v.material)?v.material:'polished',color:/^#[a-f0-9]{6}$/i.test(v.color)?v.color:'#ad94ef',critEffects:v.critEffects!==false,critSound:v.critSound===true,critStyle:['fire','arcane'].includes(v.critStyle)?v.critStyle:'fire',nat20Style:['dragon','fire','arcane'].includes(v.nat20Style)?v.nat20Style:'dragon',volume:Number.isFinite(v.volume)?Math.max(0,Math.min(1,v.volume)):0.9};
}
// Existing pages may omit nat20Style. Retired speed values remain ignored.
export function validDiceOptions(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(diceOptionDefaults).every(key=>key==='nat20Style'||Object.hasOwn(value,key))&&Object.entries(value).every(([key,entry])=>key==='speed'?Number.isFinite(entry)&&entry>=.75&&entry<=2:Object.hasOwn(diceOptionDefaults,key)&&normalizeDiceOptions(value)[key]===entry);}
