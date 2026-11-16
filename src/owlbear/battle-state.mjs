export const BATTLE='com.cosmos.character-sheets/battle',TURN='com.cosmos.character-sheets/turn',LAYOUT='com.cosmos.character-sheets/layout',BAR='com.cosmos.character-sheets/health-bar';
export function layoutFrom(metadata){
 const raw=metadata?.[LAYOUT]||{},oldDock=['top','bottom','left','right'].includes(raw.partyDock)?raw.partyDock:'top';
 const clamp=value=>Math.max(0,Math.min(1,value));
 return {
  party:raw.party!==false,initiative:raw.initiative===true,
  // Legacy docking is used only to initialize new, freely movable coordinates.
  partyX:clamp(Number.isFinite(raw.partyX)?raw.partyX:oldDock==='left'?0:oldDock==='right'?1:.5),
  partyY:clamp(Number.isFinite(raw.partyY)?raw.partyY:oldDock==='bottom'?1:.06),
  partyColumns:Number.isInteger(raw.partyColumns)&&raw.partyColumns>=1&&raw.partyColumns<=6?raw.partyColumns:3,
  initiativeDock:raw.initiativeDock==='right'?'right':'left',npcHp:raw.npcHp===true
 };
}
export const tokenName=item=>String(item.text?.plainText?.trim()||item.name||'Character').slice(0,80);
export const normalizeName=value=>String(value).trim().toLocaleLowerCase();
export function battleRows(items,party){
 const shared=new Map(party.map(row=>[row.id,row]));
 return items.filter(item=>item.type==='IMAGE'&&item.layer==='CHARACTER'&&item.metadata?.[BATTLE]?.enabled===true).slice(0,100).map(item=>{
  const state=item.metadata[BATTLE],site=shared.get(state.siteId),number=(key,fallback=0)=>Number.isFinite(state[key])?Math.max(-9999999,Math.min(9999999,state[key])):fallback;
  return {trackHp:site?site.hpMax>0:state.trackHp!==false&&Number.isFinite(state.hp)&&Number.isFinite(state.hpMax)&&state.hpMax>0,hpHidden:!site&&state.hpHidden===true,id:item.id,name:site?.name||tokenName(item),siteId:site?.id||null,linked:!!state.siteId||!!state.npcId,available:!state.siteId||!!site,revision:site?.revision,initiative:number('initiative'),order:Number.isSafeInteger(state.order)?state.order:0,hp:site?.hp??number('hp',1),hpMax:site?.hpMax??number('hpMax',1),hpTemp:site?.hpTemp??number('hpTemp',0),mp:site?.mp??number('mp'),mpMax:site?.mpMax??number('mpMax'),ac:site?.ac??number('ac',10),touch:site?.touch??number('touch',10),flat:site?.flat??number('flat',10),cmd:site?.cmd??number('cmd',10),visible:item.visible!==false,isNpc:!!state.npcId};
 }).sort((a,b)=>b.initiative-a.initiative||a.order-b.order||a.id.localeCompare(b.id));
}

// The GM retains hidden combatants; player-facing state must never include hidden names, stats, or active IDs.
export function battleForViewer(rows,gm=false){return gm?rows:rows.filter(row=>row.visible!==false);}
export function turnForViewer(turn,battle,gm=false){const current=turn||{};return gm||!current.id||battle.some(row=>row.id===current.id)?current:{round:current.round,id:null};}


// Hide NPC HP at the source of player-facing state, not just in markup.
// Per-NPC privacy always wins over room-wide "Show NPC HP".
// The GM still receives real HP to continue running combat.
export function battleHpForViewer(battle,{gm=false,npcHp=false}={}){
 if(gm)return battle;
 return battle.map(row=>{
  if(row.siteId)return row;
  const {hpHidden,...visible}=row;
  // The per-NPC eye hides combat stats, not just the HP label. Never send
  // hidden AC or defense breakdowns over the player-facing room channel.
  if(hpHidden)return {...visible,hp:null,hpMax:null,hpTemp:null,trackHp:false,
   mp:null,mpMax:null,ac:null,touch:null,flat:null,cmd:null};
  return npcHp&&row.trackHp?visible:{...visible,hp:null,hpMax:null,hpTemp:null,trackHp:false};
 });
}
/** Move to the next player-visible combatant, never making a hidden token
 * the active turn. Keep round progression when the traversal wraps. */
export function advanceVisibleTurn(sorted=[],turn={},direction=1){
 if(!Array.isArray(sorted)||!sorted.length)return null;
 const candidates=sorted.some(row=>row.visible!==false);if(!candidates)return null;
 const index=Math.max(0,sorted.findIndex(row=>row.id===turn?.id));
 const step=direction===-1?-1:1;
 let round=Math.max(1,Number(turn?.round)||1);
 let position=index;
 for(let offset=1;offset<=sorted.length;offset++){
  const previous=position;
  position=(position+step+sorted.length)%sorted.length;
  if(step===1&&position===0&&previous===sorted.length-1)round++;
  else if(step===-1&&position===sorted.length-1&&previous===0)round=Math.max(1,round-1);
  if(sorted[position].visible!==false)return {id:sorted[position].id,round};
 }
 return null;
}
