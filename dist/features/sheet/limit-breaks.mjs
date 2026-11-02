import {sheetStats,number} from './model.mjs';
import {characterClasses,totalClassLevel} from '../characters/ffd20.mjs';
export const isLimitBreak=row=>row?.limitBreak===true||/limit[\s-]*break/i.test(String(row?.sourceRuleId||'')+' '+String(row?.rulesName||'')+' '+String(row?.name||''));
export function limitBreakState(data){
 const level=totalClassLevel(characterClasses(data))||number(data.character_level||data.level)||1,max=1+Math.floor((Math.max(1,level)-1)/4),s=sheetStats(data);
 const rows=['activeAbilities','passiveAbilities','racialAbilities','feats'].flatMap(k=>data[k]||[]).filter(isLimitBreak);
 // Legacy independent counters are reconciled conservatively; reading never refills a spent pool.
 const legacy=rows.reduce((spent,row)=>spent+Math.max(0,number(row.u_max)-number(row.u_curr??row.u_max)),0);
 const spent=Math.max(0,Math.trunc(number(data.limitBreakPool?.spent??legacy))),current=Math.max(0,max-spent),threshold=Math.floor(s.hpMax/2);
 return {max,current,spent,threshold,allowed:s.hp<=threshold&&current>0,reason:s.hp>threshold?'Must be at '+threshold+' HP or below':current===0?'No Limit Break usage remaining':''};
}
export function syncLimitBreaks(data){const state=limitBreakState(data);if(!data.limitBreakPool&&!['activeAbilities','passiveAbilities','racialAbilities','feats'].some(k=>data[k]?.some(isLimitBreak)))return state;data.limitBreakPool={spent:state.spent};for(const key of ['activeAbilities','passiveAbilities','racialAbilities','feats'])for(const row of data[key]||[])if(isLimitBreak(row)){row.limitBreak=true;row.u_max=state.max;row.u_curr=state.current;}return state;}
export function spendLimitBreak(data){const state=limitBreakState(data);if(!state.allowed)throw Error(state.reason);data.limitBreakPool={spent:state.spent+1};syncLimitBreaks(data);}
