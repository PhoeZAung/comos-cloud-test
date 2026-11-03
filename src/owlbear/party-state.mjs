export const KEY='com.cosmos.party-status/state';
const fields=['hp','hpMax','hpTemp','mp','mpMax','ac','touch','flat','cmd'];
export function stateFrom(metadata){
 const state=metadata?.[KEY];
 if(!state||typeof state.publisher!=='string'||state.publisher.length>128||!Number.isFinite(state.updatedAt)||Date.now()-state.updatedAt>45000||state.updatedAt>Date.now()+5000||!Array.isArray(state.characters)||state.characters.length>40)return null;
 const seen=new Set(),characters=[];
 for(const row of state.characters){
  if(!row||typeof row.id!=='string'||!/^[0-9a-f-]{36}$/i.test(row.id)||seen.has(row.id)||typeof row.name!=='string'||row.name.length>80||fields.some(key=>!Number.isFinite(row[key])||Math.abs(row[key])>1e9)||typeof row.portraitHash!=='string'||!/^([a-f0-9]{64})?$/.test(row.portraitHash))return null;
  seen.add(row.id);characters.push({id:row.id,name:row.name,revision:Number.isSafeInteger(row.revision)?row.revision:undefined,portraitHash:row.portraitHash,...Object.fromEntries(fields.map(key=>[key,row[key]]))});
 }
 return {publisher:state.publisher,updatedAt:state.updatedAt,characters};
}
