export const KEY='com.cosmos.party-status/state',PORTRAITS='com.cosmos.party-status/portrait',REQUEST='com.cosmos.party-status/portrait-request',UI='com.cosmos.party-status/ui',HUD='com.cosmos.party-status/hud';
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fields=['hp','hpMax','hpTemp','mp','mpMax','ac','touch','flat','cmd'];
export function stateFrom(metadata){
 const state=metadata?.[KEY];
 if(!state||typeof state.publisher!=='string'||state.publisher.length>128||!Number.isFinite(state.updatedAt)||Date.now()-state.updatedAt>45000||state.updatedAt>Date.now()+5000||!Array.isArray(state.characters)||state.characters.length>40)return null;
 const seen=new Set(),characters=[];
 for(const row of state.characters){
  if(!row||typeof row.id!=='string'||!/^[0-9a-f-]{36}$/i.test(row.id)||seen.has(row.id)||typeof row.name!=='string'||row.name.length>80||fields.some(key=>!Number.isFinite(row[key])||Math.abs(row[key])>1e9)||typeof row.portraitHash!=='string'||!/^([a-f0-9]{64})?$/.test(row.portraitHash))return null;
  seen.add(row.id);characters.push({id:row.id,name:row.name,portraitHash:row.portraitHash,...Object.fromEntries(fields.map(key=>[key,row[key]]))});
 }
 return {publisher:state.publisher,updatedAt:state.updatedAt,characters};
}
export const validThumbnail=value=>typeof value==='string'&&value.length<=12000&&/^data:image\/(?:jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(value);
export async function gmConnections(OBR){
 const players=await OBR.party.getPlayers(),result=new Set(players.filter(p=>p.role==='GM').map(p=>p.connectionId));
 if(await OBR.player.getRole()==='GM')result.add(await OBR.player.getConnectionId());return result;
}
