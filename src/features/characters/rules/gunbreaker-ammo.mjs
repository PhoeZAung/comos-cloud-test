import {martialDefinition,martialArchetype,GUNBREAKER_ID,DOOM_SLAYER_ID} from './martial-progression.mjs';
export const MAGICKED_AMMO_ID=GUNBREAKER_ID+':feature:magicked-ammo';
const bad=message=>{throw Error(message);};
const integer=(value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;
export function gunbreakerAmmoProfiles(data){
 const b=data.rulesBuild?.input;
 if(b?.classId!==GUNBREAKER_ID||b.archetypeId&&b.archetypeId!==DOOM_SLAYER_ID)return [];
 return (b.archetypeId?martialArchetype(b)?.data.ammunitionProfiles:martialDefinition(b)?.data.ammunitionProfiles)?.filter(p=>p.minimumLevel<=b.level)||[];
}
export function gunbreakerAmmoSummary(data){
 const state=data.gunbreakerAmmo;if(state===undefined)return null;
 if(!state||typeof state!=='object'||Array.isArray(state)||Object.keys(state).some(k=>!['version','profileId','loaded','infused'].includes(k))||state.version!==1)bad('Invalid gun arm ammunition tracker.');
 const b=data.rulesBuild?.input,profile=gunbreakerAmmoProfiles(data).find(p=>p.id===state.profileId);
 if(!profile)bad('Choose a gun arm or mode available at this class level.');
 const level=b.level,allowance=martialDefinition(b).data.levels[level-1].magickedAmmoPerLoad;
 const maximum=level>=19?profile.capacity:Math.min(profile.capacity,allowance);
 if(!integer(state.loaded,0,profile.capacity)||!integer(state.infused,0,Math.min(maximum,state.loaded)))bad('Recorded ammunition exceeds the loaded magazine or infusion limit.');
 return {profile,level,maximum,perLoad:maximum,loaded:state.loaded,infused:state.infused,brutalShellMaximum:Math.min(4,1+Math.floor((level-1)/5))};
}
export function updateGunbreakerAmmo(data,change){
 if(!change||Object.keys(change).some(k=>!['op','revision','action','operation','profileId','rounds'].includes(k)))bad('Invalid ammunition action.');
 if(change.operation==='configure'){
  if(Object.hasOwn(change,'rounds')||typeof change.profileId!=='string')bad('Choose a gun arm or mode.');
  const profile=gunbreakerAmmoProfiles(data).find(p=>p.id===change.profileId);if(!profile)bad('Choose a gun arm or mode available at this class level.');
  const old=gunbreakerAmmoSummary(data);if(old?.loaded)bad('Clear and reconcile the recorded magazine before changing the tracked gun or mode.');
  data.gunbreakerAmmo={version:1,profileId:profile.id,loaded:0,infused:0};
 }else{
  if(Object.hasOwn(change,'profileId'))bad('Change the tracked gun with Configure.');
  const info=gunbreakerAmmoSummary(data);if(!info)bad('Configure the ammunition tracker first.');
  const state=data.gunbreakerAmmo;
  if(change.operation==='reload'){
   const rounds=change.rounds??info.profile.capacity;if(!integer(rounds,1,info.profile.capacity))bad('Loaded rounds must be whole numbers within the gun’s capacity.');
   state.loaded=rounds;state.infused=Math.min(rounds,info.maximum);
  }else if(change.operation==='infuse'){
   if(Object.hasOwn(change,'rounds'))bad('Infusion quantity is calculated from class level and capacity.');
   state.infused+=Math.min(info.maximum-state.infused,state.loaded-state.infused,info.perLoad);
  }else if(change.operation==='clear'){
   if(Object.hasOwn(change,'rounds'))bad('Invalid clear action.');state.loaded=state.infused=0;
  }else if(change.operation==='fire'){
   if(!integer(change.rounds,1,info.loaded))bad('Not enough loaded rounds.');
   state.loaded-=change.rounds;state.infused-=Math.min(change.rounds,state.infused);
  }else if(['spend','blast-shield','brutal-shell'].includes(change.operation)){
   if(change.operation==='blast-shield'&&Object.hasOwn(change,'rounds'))bad('Blast Shield costs exactly two infused rounds.');
   const rounds=change.operation==='blast-shield'?2:change.rounds;
   if(change.operation==='brutal-shell'&&!integer(rounds,1,info.brutalShellMaximum))bad('Brutal Shell allows 1–'+info.brutalShellMaximum+' infused rounds at this level.');
   if(!integer(rounds,1,info.infused))bad('Not enough infused rounds.');state.infused-=rounds;state.loaded-=rounds;
  }else bad('Invalid ammunition action.');
 }
 syncGunbreakerAmmo(data);return data;
}
export function syncGunbreakerAmmo(data){
 const info=gunbreakerAmmoSummary(data);if(!info)return;
 for(const row of [...(data.activeAbilities||[]),...(data.passiveAbilities||[])])if(row.rulesOwned&&row.sourceRuleId===MAGICKED_AMMO_ID){
  row.u_max=info.maximum;row.u_curr=info.infused;row.restoreOnLongRest=false;delete row.uses_formula;
 }
}
export function gunbreakerAmmoAbilityCost(data,row){
 if(data.gunbreakerAmmo===undefined||!row?.rulesOwned)return 0;
 gunbreakerAmmoSummary(data);
 return row.sourceRuleId===GUNBREAKER_ID+':feature:blast-shield'?2:[MAGICKED_AMMO_ID,GUNBREAKER_ID+':feature:brutal-shell'].includes(row.sourceRuleId)?1:0;
}
