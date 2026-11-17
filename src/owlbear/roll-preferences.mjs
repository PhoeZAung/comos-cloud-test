const key='com.cosmos.character-sheets/simple-hit-miss';
export function readSimpleHitMiss(){
 try{return localStorage.getItem(key)==='true';}catch{return false;}
}
export function saveSimpleHitMiss(enabled){
 try{localStorage.setItem(key,String(enabled===true));}catch{}
}
