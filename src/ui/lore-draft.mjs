// Browser-only, per-account Lore draft storage. IndexedDB can persist File blobs,
// unlike localStorage; no Lore drafts are sent to the server before publishing.
const DB='comos-lore-drafts',STORE='drafts';
const VERSION=1;
export function draftKey(userId,entryId=null){
 if(typeof userId!=='string'||!/^[a-z0-9-]{8,}$/i.test(userId))throw Error('A signed-in account is required for drafts.');
 return userId+':'+(entryId||'new');
}
export function validateDraft(value){
 if(!value||value.version!==VERSION||typeof value.key!=='string'||typeof value.title!=='string'||!Array.isArray(value.blocks)||value.blocks.length>40||!Array.isArray(value.tagIds))return false;
 return value.blocks.every(block=>block&&(
  block.type==='text'&&typeof block.text==='string'||
  block.type==='image'&&typeof block.alt==='string'&&((typeof block.mediaId==='string'&&block.mediaId.length>0)||(typeof Blob!=='undefined'&&block.file instanceof Blob))
 ));
}
function openDb(){
 if(typeof indexedDB==='undefined')return Promise.reject(Error('This browser cannot store image drafts.'));
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB,VERSION);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'key'});};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('Draft storage is unavailable.'));
  req.onblocked=()=>reject(Error('Close other Comos tabs to enable draft storage.'));
 });
}
async function perform(mode,key,record){
 const db=await openDb();
 try{
  return await new Promise((resolve,reject)=>{
   const transaction=db.transaction(STORE,mode==='get'?'readonly':'readwrite');
   const store=transaction.objectStore(STORE);
   const request=mode==='get'?store.get(key):mode==='put'?store.put(record):store.delete(key);
   let result;
   request.onsuccess=()=>{result=request.result;};
   transaction.oncomplete=()=>resolve(result);
   transaction.onerror=()=>reject(transaction.error||Error('Could not save Lore draft.'));
   transaction.onabort=()=>reject(transaction.error||Error('Could not save Lore draft.'));
  });
 }finally{db.close();}
}
export function createLoreDraftStore(){
 return Object.freeze({
  async get(key){const record=await perform('get',key);return validateDraft(record)?record:null;},
  async save(record){if(!validateDraft(record))throw Error('Invalid draft content.');await perform('put',record.key,record);},
  async clear(key){await perform('delete',key);}
 });
}
