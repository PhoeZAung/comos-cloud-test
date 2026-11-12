const modules=new Map();
export function loadSheetEffect(name){
 if(!['electric','paper','laser'].includes(name))throw Error('Unknown sheet effect.');
 if(!modules.has(name)){
  // Local, prebuilt assets; no runtime registry or CDN request.
  const base=new URL('./react-bits/'+name,import.meta.url);
  const link=document.createElement('link');link.rel='stylesheet';link.href=base.href+'.css';
  const styles=new Promise((resolve,reject)=>{link.onload=resolve;link.onerror=()=>reject(Error('Effect stylesheet unavailable.'));});
  document.head.append(link);
  modules.set(name,Promise.all([import(base.href+'.js'),styles]).then(([module])=>module).catch(error=>{modules.delete(name);link.remove();throw error;}));
 }
 return modules.get(name);
}
