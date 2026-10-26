import {createLoreDraftStore,draftKey} from './lore-draft.mjs';

// All draft bytes stay in IndexedDB on this browser. Every key is scoped to
// the verified signed-in account and the new/edit Lore editor identity.
export async function installLoreDrafts({
 root,editId=null,images,addParagraph,addImage,addStoredImage,
 getSelected,setSelected,getRequestId,setRequestId,getRevision,setRevision,refresh
}){
 const status=root.querySelector('[data-lore-draft-status]');
 const discard=root.querySelector('[data-lore-discard-draft]');
 const blocksRoot=root.querySelector('[data-lore-blocks]');
 const title=root.querySelector('[name=title]');
 const control=new AbortController();
 const store=createLoreDraftStore();
 const say=text=>{if(status)status.textContent=text;};
 let stopped=false,cleared=false,waiting=null,queue=Promise.resolve(),key=null,restoring=true;
 try{
  const res=await fetch('/api/v1/account',{credentials:'same-origin',cache:'no-store',signal:control.signal});
  if(!res.ok)throw Error('Account details unavailable.');
  const user=(await res.json()).user;
  key=draftKey(user?.id,editId);
  const draft=await store.get(key);
  if(draft){
    // Do not lose images from the saved server entry; they remain accessible
    // when a draft is dismissed. This draft is a complete editor snapshot.
    for(const image of images.values())if(image.url)URL.revokeObjectURL(image.url);
    images.clear();blocksRoot.replaceChildren();
    title.value=draft.title;
    setSelected(draft.tagIds);
    setRequestId(draft.requestId);
    if(editId&&draft.expectedUpdatedAt)setRevision(draft.expectedUpdatedAt);
    for(const block of draft.blocks){
      if(block.type==='text'){
        const node=addParagraph();
        node.querySelector('textarea').value=block.text;
      }else if(block.type==='image'){
        if(block.file instanceof Blob){
          const node=addImage(block.file);
          const record=images.get(node.dataset.loreBlockId);
          record.mediaId=block.mediaId||null;
          node.querySelector('[data-lore-image-alt]').value=block.alt;
        }else if(block.mediaId){
          addStoredImage({mediaId:block.mediaId,url:'/api/v1/lore-images/'+block.mediaId,alt:block.alt});
        }
      }
    }
    if(!blocksRoot.children.length)addParagraph();
    say('Recovered an autosaved Lore draft from this device.');
    discard.hidden=false;
    refresh();
  }else say('Autosave ready · stored on this device.');
 }catch(error){
  say('Autosave unavailable: '+(error?.message||'check your browser storage')+'.');
  return {published:async()=>{},dispose:()=>{}};
 }finally{restoring=false;}
 function capture(){
  const blocks=[...blocksRoot.children].map(node=>{
    if(node.dataset.loreKind==='text')return {type:'text',text:node.querySelector('textarea').value};
    const img=images.get(node.dataset.loreBlockId);
    return {type:'image',file:img?.file||null,mediaId:img?.mediaId||'',alt:node.querySelector('[data-lore-image-alt]').value};
  });
  return {version:1,key,title:title.value,tagIds:getSelected(),blocks,requestId:getRequestId(),expectedUpdatedAt:getRevision(),savedAt:Date.now()};
 }
 function commitDraft(){
  if(!key||cleared||stopped||restoring)return queue;
  const record=capture();
  queue=queue.catch(()=>{}).then(()=>store.save(record)).then(()=>{
   if(!stopped&&!cleared){say('Draft saved on this device.');discard.hidden=false;}
  }).catch(error=>{
   if(!stopped&&!cleared)say('Draft not saved: '+(error?.name==='QuotaExceededError'?'browser storage is full':error.message)+'.');
  });
  return queue;
 }
 function schedule(){
  if(stopped||cleared||restoring)return;
  if(waiting!==null)clearTimeout(waiting);
  say('Saving draft…');
  waiting=setTimeout(()=>{waiting=null;void commitDraft();},480);
 }
 // Attach after the composer handlers, so drag/move/remove/file events
 // have already updated the DOM before we snapshot the ordered blocks.
 root.addEventListener('input',schedule,{signal:control.signal});
 root.addEventListener('change',()=>queueMicrotask(schedule),{signal:control.signal});
 root.addEventListener('click',event=>{
  if(event.target.closest('[data-lore-discard-draft]'))return;
  if(event.target.closest('[data-add-lore-paragraph],[data-lore-move-up],[data-lore-move-down],[data-lore-remove-block],[data-remove-lore-tag]'))
    queueMicrotask(schedule);
 },{signal:control.signal});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){if(waiting!==null)clearTimeout(waiting);waiting=null;void commitDraft();}},{signal:control.signal});
 if(discard)discard.addEventListener('click',async()=>{
  if(!confirm('Discard your saved Lore draft on this device?'))return;
  stopped=true;if(waiting!==null)clearTimeout(waiting);
  await queue.catch(()=>{});
  try{await store.clear(key);cleared=true;location.reload();}catch(error){stopped=false;say('Could not clear draft: '+error.message);}
 },{signal:control.signal});
 return {
  async savedNow(){if(waiting!==null){clearTimeout(waiting);waiting=null;}return commitDraft();},
  async published(){
   stopped=true;cleared=true;if(waiting!==null)clearTimeout(waiting);
   await queue.catch(()=>{});
   try{await store.clear(key);}catch{ /* Publishing succeeded; stale draft can be discarded manually on next visit. */ }
  },
  dispose(){
   if(!stopped&&waiting!==null){clearTimeout(waiting);waiting=null;void commitDraft();}
   stopped=true;control.abort();
  }
 };
}
