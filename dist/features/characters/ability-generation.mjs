export const pointCosts={7:-4,8:-2,9:-1,10:0,11:1,12:2,13:3,14:5,15:7,16:10,17:13,18:17};
export const standardArray=[15,14,13,12,10,8];
export function pointSpend(scores){return Object.values(scores).reduce((sum,n)=>sum+(pointCosts[n]??1000),0);}
export function rollScores(die=()=>{const n=new Uint32Array(1);do{crypto.getRandomValues(n);}while(n[0]>=4294967292);return n[0]%6+1;}){
 return Array.from({length:6},()=>{const dice=Array.from({length:4},die);if(dice.some(n=>!Number.isInteger(n)||n<1||n>6))throw Error('Invalid die.');return {dice,total:dice.reduce((a,b)=>a+b,0)-Math.min(...dice)};});
}
