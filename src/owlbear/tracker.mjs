import {stateFrom} from './party-state.mjs';
export const TRACKER='com.cosmos.party-status/tracker';
export function trackerRows(metadata){
 const config=metadata?.[TRACKER]||{},state=stateFrom(metadata),mode=['party','battle','off'].includes(config.mode)?config.mode:'party';
 if(mode==='off')return [];
 const characters=state?.characters||[],selected=new Set(config.battle||[]);
 const base=characters.filter(c=>mode==='party'||selected.has(c.id)).map(c=>({...c,linked:true}));
 const tokens=(Array.isArray(config.tokens)?config.tokens:[]).filter(t=>t.mode===mode).slice(0,30).map(t=>{
  const linked=characters.find(c=>c.id===t.characterId);return {...t,...(linked||{}),id:t.id,sourceId:linked?.id,linked:Boolean(linked),portraitHash:linked?.portraitHash||'',tokenPortrait:t.portrait};
 });
 const rows=[...base,...tokens].filter(c=>!(config.hidden||[]).includes(c.id)).map(c=>({...c,portraitOverride:config.photos?.[c.id]||'',active:config.turn===c.id,round:config.round||1}));
 return mode==='battle'?rows.sort((a,b)=>(b.initiative||0)-(a.initiative||0)||a.name.localeCompare(b.name)):rows;
}
export async function saveTracker(OBR,update){
 if(await OBR.player.getRole()!=='GM')throw Error('GM only.');
 const metadata=await OBR.room.getMetadata(),value=structuredClone(metadata[TRACKER]||{});update(value);
 if(new TextEncoder().encode(JSON.stringify({...metadata,[TRACKER]:value})).byteLength>15000)throw Error('Tracker is full. Remove some cards or photos.');
 await OBR.room.setMetadata({[TRACKER]:value});
}
