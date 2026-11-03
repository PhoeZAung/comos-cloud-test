import {createHash} from 'node:crypto';
import {sheetStats} from '../../src/features/sheet/model.mjs';
// This is a deliberately small projection, never a full character or user profile.
export const STATUS_LIMIT=40;
export function characterPortrait(data){
 for(const key of ['portrait','portraitUrl','characterImage','image','img','avatar']){
  const value=data[key];
  if(typeof value==='string'&&value.length<=160000&&/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(value))return value;
 }
 return '';
}
export function statusRoster(db){
 const rows=db.prepare("SELECT c.id,c.name,c.revision,d.data_json FROM characters c JOIN character_details d ON d.character_id=c.id WHERE c.archived=0 AND json_extract(d.data_json,'$.owlbearStatusVisible')=1 ORDER BY lower(c.name),c.id LIMIT ?").all(STATUS_LIMIT+1);
 if(rows.length>STATUS_LIMIT)throw Error('Choose up to '+STATUS_LIMIT+' characters for the Owlbear status overlay.');
 return rows.map(row=>{
  const data=JSON.parse(row.data_json),stats=sheetStats(data),portrait=characterPortrait(data);
  return {id:row.id,name:row.name,revision:row.revision,hp:stats.hp,hpMax:stats.hpMax,hpTemp:stats.hpTemp,mp:stats.mp,mpMax:stats.mpMax,ac:stats.ac,touch:stats.touch,flat:stats.flat,cmd:stats.cmd,portraitHash:portrait?createHash('sha256').update(portrait).digest('hex'):''};
 });
}
