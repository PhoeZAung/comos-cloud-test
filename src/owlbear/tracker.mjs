import {stateFrom} from './party-state.mjs';
export const TRACKER='com.cosmos.party-status/tracker';
export function trackerConfig(metadata){
 const value=metadata?.[TRACKER]||{};
 return {...value,views:value.views||{party:value.mode!=='off',battle:value.mode==='battle'}};
}
export function memberships(token){return token.memberships||{party:token.mode==='party',battle:token.mode==='battle'};}
export function trackerRows(metadata,mode='party'){
 const config=trackerConfig(metadata),characters=stateFrom(metadata)?.characters||[];
 const tokens=(config.tokens||[]).filter(t=>memberships(t)[mode]).slice(0,30).map(t=>{
  const linked=characters.find(c=>c.id===t.characterId);return {...t,...(linked||{}),id:t.id,sourceId:linked?.id,linked:Boolean(linked),portraitHash:linked?.portraitHash||'',tokenPortrait:t.portrait};
 });
 const linkedIds=new Set(tokens.map(t=>t.sourceId));
 const base=characters.filter(c=>!linkedIds.has(c.id)&&(mode==='party'||!(config.battleHidden||[]).includes(c.id))).map(c=>({...c,linked:true}));
 let rows=[...base,...tokens].filter(c=>mode!=='party'||!(config.hidden||[]).includes(c.id)).map(c=>({...c,initiative:Number.isFinite(config.initiatives?.[c.id])?config.initiatives[c.id]:(c.initiative||0),portraitOverride:config.photos?.[c.id]||'',round:config.round||1}));
 if(mode==='battle')rows.sort((a,b)=>b.initiative-a.initiative||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
 const active=rows.some(c=>c.id===config.turn)?config.turn:rows[0]?.id,index=rows.findIndex(c=>c.id===active),next=rows[(index+1)%rows.length]?.id;
 return rows.map(c=>({...c,active:mode==='battle'&&c.id===active,upNext:mode==='battle'&&rows.length>1&&c.id===next}));
}
export function removeMember(config,id,mode){
 const token=config.tokens?.find(t=>t.id===id);
 if(token){token.memberships={...memberships(token),[mode]:false};if(token.characterId){if(mode==='party')config.hidden=[...new Set([...(config.hidden||[]),token.characterId])];else config.battleHidden=[...new Set([...(config.battleHidden||[]),token.characterId])];}if(!token.memberships.party&&!token.memberships.battle)config.tokens=config.tokens.filter(t=>t.id!==id);}
 else if(mode==='battle')config.battleHidden=[...new Set([...(config.battleHidden||[]),id])];
 else config.hidden=[...new Set([...(config.hidden||[]),id])];
}
export function advanceTurn(config,metadata,direction){
 const rows=trackerRows({...metadata,[TRACKER]:config},'battle');if(!rows.length){delete config.turn;config.round=1;return;}
 const index=rows.findIndex(c=>c.active),round=Math.max(1,config.round||1);
 if(direction<0&&index===0&&round===1){config.turn=rows[0].id;config.round=1;return;}
 config.turn=rows[(index+direction+rows.length)%rows.length].id;
 config.round=round+(direction>0&&index===rows.length-1?1:direction<0&&index===0?-1:0);
}
export async function saveTracker(OBR,update){
 if(await OBR.player.getRole()!=='GM')throw Error('GM only.');
 const metadata=await OBR.room.getMetadata(),value=structuredClone(trackerConfig(metadata));update(value,metadata);
 if(new TextEncoder().encode(JSON.stringify({...metadata,[TRACKER]:value})).byteLength>15000)throw Error('Tracker is full. Remove some cards or photos.');
 await OBR.room.setMetadata({[TRACKER]:value});
}
