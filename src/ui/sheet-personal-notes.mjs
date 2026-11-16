/** Personal notes: opt-in recovery for unfinished local edits, with a
 * debounced authenticated save. Drafts live only in this browser tab.
 * Server revisions remain the source of truth; never silently replace newer notes.
 */
export function mountPersonalNotes(root,{characterId,save}={}){
 const form=root?.querySelector('[data-notes]'),area=form?.elements?.namedItem('notesArea');
 if(!area||typeof save!=='function')return {dispose(){},cancelPending(){},clearDraft(){}};
 const abort=new AbortController(),key='cosmos-notes-draft:'+characterId;
 let timer=null,saving=false;
 const storage=()=>{try{return sessionStorage;}catch{return null;}};
 const stored=()=>{try{const value=storage()?.getItem(key);return value&&value.length<=12000?value:null;}catch{return null;}};
 const cache=value=>{try{storage()?.setItem(key,value.slice(0,12000));}catch{}};
 const remove=()=>{try{storage()?.removeItem(key);}catch{}};
 const announce=message=>{const p=form.querySelector('[data-notes-autosave-status]');if(p)p.textContent=message;};
 const cancelPending=()=>{clearTimeout(timer);timer=null;};
 async function flush(){
  if(saving||abort.signal.aborted||!area.isConnected)return;
  saving=true;const value=area.value;
  announce('Saving notes…');
  try{
   const ok=await save({action:'fields',fields:{notesArea:value}});
   if(ok){if(stored()===value)remove();root.querySelector('[data-notes-draft-recover]')?.remove();}
   else if(!abort.signal.aborted)announce('Not saved · draft kept in this tab');
  }catch{
   if(!abort.signal.aborted)announce('Not saved · draft kept in this tab');
  }finally{saving=false;}
 }
 const schedule=()=>{
  cache(area.value);cancelPending();
  announce('Unsaved notes · auto-saving…');
  timer=setTimeout(()=>void flush(),1500);
 };
 area.addEventListener('input',schedule,{signal:abort.signal});
 const previous=stored();
 if(previous!==null&&previous!==area.value){
  const row=document.createElement('div');
  row.className='cs-notes-draft-recovery';row.dataset.notesDraftRecover='';
  row.innerHTML='<span>Unsaved notes from this tab</span><button type="button" class="button" data-notes-restore>Restore draft</button><button type="button" class="button" data-notes-discard>Discard draft</button>';
  form.prepend(row);
  row.addEventListener('click',event=>{
   const button=event.target.closest('button');
   if(!button)return;
   if(button.matches('[data-notes-restore]')){area.value=previous;area.dispatchEvent(new Event('input',{bubbles:true}));area.focus();}
   else if(button.matches('[data-notes-discard]'))remove();
   row.remove();
  },{signal:abort.signal});
 }else if(previous!==null)remove();
 return {dispose(){cancelPending();abort.abort();},cancelPending,clearDraft:remove};
}
