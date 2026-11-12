import {normalizeName} from './battle-state.mjs';

// Match one and only one saved NPC. Never guess between duplicate names.
export function uniqueNpcForToken(token,roster){
 const exact=roster.filter(row=>normalizeName(row.name)===normalizeName(token));
 return exact.length===1?exact[0]:null;
}

export function npcHpDice(detail){
 // Printed import format: "94 (11d10+33)". Require a real dice expression
 // next to the printed HP, never interpret unrelated hit/damage dice.
 const match=/^\s*\d+\s*\(\s*(\d{1,3})d(\d{1,4})\s*([+-]\s*\d{1,5})?\s*\)/i.exec(String(detail||''));
 if(!match)return null;
 const count=Number(match[1]),sides=Number(match[2]),bonus=Number((match[3]||'0').replace(/\s/g,''));
 if(!Number.isSafeInteger(count)||count<1||count>300||!Number.isSafeInteger(sides)||sides<2||sides>1000||!Number.isSafeInteger(bonus)||Math.abs(bonus)>100000)return null;
 return {count,sides,bonus,expression:count+'d'+sides+(bonus?bonus>0?'+'+bonus:String(bonus):'')};
}

export function rollNpcHp(dice,rollDie){
 const rolls=[];
 for(let i=0;i<dice.count;i++){
  const face=rollDie(dice.sides);
  if(!Number.isInteger(face)||face<1||face>dice.sides)throw Error('Invalid NPC HP die.');
  rolls.push(face);
 }
 return {hp:Math.max(1,rolls.reduce((a,b)=>a+b,0)+dice.bonus),rolls,expression:dice.expression};
}

export function randomNpcDie(sides){
 // Rejection sampling avoids modulo bias for ordinary table dice.
 const range=4294967296,limit=Math.floor(range/sides)*sides,bytes=new Uint32Array(1);
 do{crypto.getRandomValues(bytes);}while(bytes[0]>=limit);
 return bytes[0]%sides+1;
}

// The sheet's Init value is a modifier, not an initiative roll result.
// Roll once when an NPC enters battle and store the result on that token.
export function rollNpcInitiative(bonus,rollDie=randomNpcDie){
 if(!Number.isFinite(bonus)||!Number.isInteger(bonus)||Math.abs(bonus)>9999)throw Error('Invalid NPC initiative modifier.');
 const d20=rollDie(20);
 if(!Number.isInteger(d20)||d20<1||d20>20)throw Error('Invalid NPC initiative die.');
 return {d20,bonus,total:d20+bonus};
}

export function npcBattleStats(character,rollDie=randomNpcDie){
 if(character?.kind!=='npc'||!character.data)return null;
 const d=character.data,n=d.npcStats||{},ac=Number(n.ac);
 const printed=Number(d.hp_max);
 if(!Number.isFinite(n.ac)||!Number.isFinite(printed)||printed<=0||printed>9999999)return null;
 const dice=npcHpDice(d.npcText?.hpDetail);
 const result=dice?rollNpcHp(dice,rollDie):{hp:printed,rolls:[],expression:null};
 const mp=Number.isFinite(d.mp_curr)?d.mp_curr:0;
 if(!Number.isFinite(mp)||mp<0||mp>=1e7)return null;
 const initiative=Number.isFinite(n.initiative)?n.initiative:0;
 if(Math.abs(initiative)>9999||ac< -9999999||ac>=1e7)return null;
 return {
  hp:Math.min(9999999,result.hp),mp,ac,
  touch:Number.isFinite(n.touch)?n.touch:ac,
  flat:Number.isFinite(n.flat)?n.flat:ac,
  cmd:Number.isFinite(n.cmd)?n.cmd:10,
  initiative,trackHp:true,
  npcId:character.id,
  hpRoll:result.expression?{expression:result.expression,rolls:result.rolls,total:result.hp}:null
 };
}
