export const nameKey=value=>value.trim().normalize('NFKC').toLowerCase();
export function uniqueName(db,value,exceptId=''){
 const name=value.trim();if(!name)return;
 if(db.prepare('SELECT 1 FROM users WHERE display_name_key=? AND id<>?').get(nameKey(name),exceptId))throw Object.assign(Error('That display name is already taken. Choose another.'),{code:'INVALID_PROFILE'});
}
export function reserveName(db,base,id){
 let name=(String(base||'Player').trim().replace(/[\u0000-\u001f\u007f]/g,'')||'Player').slice(0,70),candidate=name,n=2;
 while(db.prepare('SELECT 1 FROM users WHERE display_name_key=? AND id<>?').get(nameKey(candidate),id))candidate=name+' '+n++;
 db.prepare("UPDATE users SET display_name=?,display_name_key=?,profile_state='complete' WHERE id=?").run(candidate,nameKey(candidate),id);return candidate;
}
