export const diceOptionDefaults=Object.freeze({enabled:false,shape:'standard',material:'polished',color:'#ad94ef',speed:1.5,critEffects:true,critSound:false,critStyle:'fire',volume:0.9});
export function normalizeDiceOptions(value={}){
 const v=value&&typeof value==='object'?value:{};
 return {enabled:v.enabled===true,shape:['standard','gemstone'].includes(v.shape)?v.shape:'standard',material:['polished','glass','galaxy','metal'].includes(v.material)?v.material:'polished',color:/^#[a-f0-9]{6}$/i.test(v.color)?v.color:'#ad94ef',speed:Number.isFinite(v.speed)?Math.max(.75,Math.min(2,v.speed)):1.5,critEffects:v.critEffects!==false,critSound:v.critSound===true,critStyle:['fire','arcane'].includes(v.critStyle)?v.critStyle:'fire',volume:Number.isFinite(v.volume)?Math.max(0,Math.min(1,v.volume)):0.9};
}
// Older open pages may still save the full pre-speed shape. Accept that shape;
// reads normalize the absent speed to the new default without a DB migration.
export function validDiceOptions(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(diceOptionDefaults).every(key=>key==='speed'||Object.hasOwn(value,key))&&Object.entries(value).every(([key,entry])=>Object.hasOwn(diceOptionDefaults,key)&&normalizeDiceOptions(value)[key]===entry);}
