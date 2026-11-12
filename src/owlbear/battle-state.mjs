export const BATTLE='com.cosmos.character-sheets/battle',TURN='com.cosmos.character-sheets/turn',LAYOUT='com.cosmos.character-sheets/layout',BAR='com.cosmos.character-sheets/health-bar';
export function layoutFrom(metadata){const raw=metadata?.[LAYOUT]||{};return {party:raw.party!==false,initiative:raw.initiative===true,partyDock:['top','bottom','left','right'].includes(raw.partyDock)?raw.partyDock:'top',initiativeDock:raw.initiativeDock==='right'?'right':'left',npcHp:raw.npcHp===true};}
export const tokenName=item=>String(item.text?.plainText?.trim()||item.name||'Character').slice(0,80);
export const normalizeName=value=>String(value).trim().toLocaleLowerCase();
export function battleRows(items,party){
 const shared=new Map(party.map(row=>[row.id,row]));
 return items.filter(item=>item.type==='IMAGE'&&item.layer==='CHARACTER'&&item.metadata?.[BATTLE]?.enabled===true).slice(0,100).map(item=>{
  const state=item.metadata[BATTLE],site=shared.get(state.siteId),number=(key,fallback=0)=>Number.isFinite(state[key])?Math.max(-9999999,Math.min(9999999,state[key])):fallback;
  return {trackHp:site?site.hpMax>0:state.trackHp!==false&&number('hpMax',1)>0,id:item.id,name:site?.name||tokenName(item),siteId:site?.id||null,linked:!!state.siteId||!!state.npcId,available:!state.siteId||!!site,revision:site?.revision,initiative:number('initiative'),order:Number.isSafeInteger(state.order)?state.order:0,hp:site?.hp??number('hp',1),hpMax:site?.hpMax??number('hpMax',1),hpTemp:site?.hpTemp??number('hpTemp',0),mp:site?.mp??number('mp'),mpMax:site?.mpMax??number('mpMax'),ac:site?.ac??number('ac',10),touch:site?.touch??number('touch',10),flat:site?.flat??number('flat',10),cmd:site?.cmd??number('cmd',10),visible:item.visible!==false,isNpc:!!state.npcId};
 }).sort((a,b)=>b.initiative-a.initiative||a.order-b.order||a.id.localeCompare(b.id));
}

// The GM retains hidden combatants; player-facing state must never include hidden names, stats, or active IDs.
export function battleForViewer(rows,gm=false){return gm?rows:rows.filter(row=>row.visible!==false);}
export function turnForViewer(turn,battle,gm=false){const current=turn||{};return gm||!current.id||battle.some(row=>row.id===current.id)?current:{round:current.round,id:null};}


// Only the GM's original rows may contain enemy HP when NPC HP sharing is off.
// Party characters always retain HP; hiding it in markup would still leak values.
export function battleHpForViewer(battle,{gm=false,npcHp=false}={}){
 if(gm||npcHp)return battle;
 return battle.map(row=>row.siteId?row:{
  ...row,hp:null,hpMax:null,hpTemp:null,trackHp:false
 });
}
