// Presentation metadata only: these fields never change a roll's mechanics.
export const actionTypes=['Standard','Move','Full Round','Free','Swift','Immediate'];
export const damageTypes=['Bludgeoning','Piercing','Slashing','Earth','Fire','Ice','Lightning','Water','Wind','Holy','Shadow','Acid','Cold','Electricity','Sonic','Force','Positive','Negative','Good','Evil','Lawful','Chaotic','Poison','Mental','Precision'];
export function actionType(value){
 const text=String(value||'').trim().toLowerCase().replace(/[._-]+/g,' ');
 return actionTypes.find(option=>option.toLowerCase()===text||option.toLowerCase()+' action'===text)||(text==='full round action'?'Full Round':'');
}
export function selectedDamageTypes(value){return Array.isArray(value)?[...new Set(value.filter(v=>damageTypes.includes(v)))]:[];}
