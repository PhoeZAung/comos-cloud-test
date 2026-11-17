import {sheetStats} from '../../src/features/sheet/model.mjs';

// Translate editable HUD totals into individual sheet modifiers, without
// changing armor, ability scores, initiative or other calculated defenses.
export function partyDefenseAdjustments(data,stats){
 const fields={};
 for(const [key,field] of Object.entries({ac:'ac_temp',touch:'touch_temp',flat:'flat_temp',cmd:'cmd_temp'})){
  if(stats[key]===undefined)continue;
  if(!Number.isSafeInteger(stats[key])||Math.abs(stats[key])>=1e7)throw Error('Defense totals must be whole numbers.');
  const baseline=sheetStats({...data,...fields,[field]:0})[key];
  fields[field]=stats[key]-baseline;
  if(!Number.isSafeInteger(fields[field])||Math.abs(fields[field])>=1e7)throw Error('Defense adjustment is outside the supported range.');
 }
 return fields;
}
