import {randomInt} from 'node:crypto';
const relay='https://weathered-term-1e39.phoeaung2076.workers.dev';
export function serverRoll(expression){
 const m=typeof expression==='string'&&/^\s*(\d{1,2})d(\d{1,4})(?:\s*([+-])\s*(\d{1,6}))?\s*$/i.exec(expression);
 if(!m||+m[1]<1||+m[1]>50||+m[2]<2||+m[2]>1000)throw Error('Use 1–50 dice with 2–1,000 sides.');
 const rolls=Array.from({length:+m[1]},()=>randomInt(1,+m[2]+1)),bonus=Number(m[4]||0)*(m[3]==='-'?-1:1);return {expression,rolls,bonus,total:rolls.reduce((a,b)=>a+b,bonus)};
}
export async function publishRoll({db,userId,character,change,origin,sendFetch=fetch}){
 if(!/^[\da-f-]{36}$/i.test(change.requestId)||typeof change.label!=='string'||!change.label.trim()||change.label.length>120||/[\u0000-\u001f]/.test(change.label)||typeof change.discord!=='boolean')throw Error('Invalid roll.');
 const old=db.prepare('SELECT * FROM sheet_rolls WHERE id=?').get(change.requestId);
 if(old){if(old.user_id!==userId||old.character_id!==character.id||old.expression!==change.expression||old.label!==change.label)throw Error('Roll identifier already used.');return {roll:JSON.parse(old.result_json),discord:old.delivery};}
 const last=db.prepare('SELECT created_at FROM sheet_rolls WHERE user_id=? ORDER BY created_at DESC LIMIT 1').get(userId);if(last&&Date.now()-last.created_at<1500)throw Error('Wait a moment before rolling again.');
 const roll=serverRoll(change.expression),delivery=change.discord?'pending':'off';
 db.prepare('INSERT INTO sheet_rolls VALUES(?,?,?,?,?,?,?,?,?)').run(change.requestId,userId,character.id,change.expression,change.label,JSON.stringify(roll),delivery,Date.now(),change.discord?1:0);
 if(!change.discord)return {roll,discord:'off'};
 const safe=s=>String(s).replaceAll('@','＠').replace(/[\r\n]/g,' ').replace(/[*_`~|<>]/g,'').slice(0,120);
 const content=`🎲 ${safe(character.name)} — ${safe(change.label)}\n${roll.expression}: [${roll.rolls.join(', ')}] ${roll.bonus>=0?'+':'−'} ${Math.abs(roll.bonus)} = ${roll.total}`;
 let state='failed';try{const response=await sendFetch(relay,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({content,allowed_mentions:{parse:[]}}),signal:AbortSignal.timeout(7000)});state=response.ok?'sent':'failed';}catch{}
 db.prepare('UPDATE sheet_rolls SET delivery=? WHERE id=?').run(state,change.requestId);return {roll,discord:state};
}
