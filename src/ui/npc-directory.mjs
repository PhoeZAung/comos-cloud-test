import {NPC_NOTE_LIMIT,parseNpcStatBlock} from '../features/characters/npc-stat-block.mjs';
import {recordId} from './record-id.mjs';
import {npcCatalogTag} from '../features/characters/npc-library.mjs';

const endpoint='/api/v1/admin/npcs';
export function mountNpcDirectory(){
 const root=document.querySelector('[data-npc-directory]');
 const control=new AbortController(),{signal}=control;
 root.innerHTML=`<div class="npc-directory-toolbar"><h1>NPC Catalog</h1><button type="button" class="button primary" data-add-npc hidden>Add NPC</button></div>
 <nav class="npc-chapter-tabs" aria-label="NPC catalog categories">
  <button type="button" data-npc-chapter="npc" aria-pressed="true">NPC</button>
  <button type="button" data-npc-chapter="bestiary" aria-pressed="false">Bestiary</button>
  <button type="button" data-npc-chapter="companions" aria-pressed="false">Companions</button>
 </nav><section class="npc-progress-grid" data-npc-progress aria-label="Kingmaker chapter extraction progress"><p>Checking source progress…</p></section>
 <form class="npc-directory-search" role="search" data-find-npc hidden><label class="sr-only" for="npc-search">Search NPCs by name</label><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4 4"/></svg><input id="npc-search" type="search" maxlength="80" placeholder="Search NPCs by name…" autocomplete="off"><button type="button" data-clear-npc-search aria-label="Clear NPC search" hidden>×</button></form>
 <p data-npc-status role="status"></p><div data-npc-list></div><button class="button" type="button" data-more-npcs hidden>More NPCs</button>
 <dialog class="npc-create-dialog" aria-labelledby="npc-create-title"><form data-npc-create>
 <h2 id="npc-create-title">Add NPC</h2>
 <label>NPC name<input name="name" maxlength="80" autocomplete="off"></label>
  <label>Library<select name="category" aria-label="NPC library">
   <option value="npc" selected>NPC</option><option value="bestiary">Bestiary</option><option value="companions">Companion</option>
  </select></label>
 <label class="npc-note-drop" data-npc-drop><strong>Drop a Markdown note here</strong><span>or choose a file</span><input class="sr-only" name="file" type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" aria-label="Choose Markdown note"><span data-npc-filename></span></label>
 <label>Stat block<textarea name="markdown" rows="8" maxlength="${NPC_NOTE_LIMIT}" placeholder="Paste a stat block or choose a Markdown note"></textarea></label>
 <p data-npc-preview role="status"></p><p data-npc-error role="alert"></p>
 <div class="actions"><button type="button" class="button" data-cancel-npc>Cancel</button><button class="button primary" type="submit">Save NPC</button></div>
 </form></dialog>`;
 const dialog=root.querySelector('dialog'),form=root.querySelector('[data-npc-create]');
 const status=root.querySelector('[data-npc-status]'),list=root.querySelector('[data-npc-list]');
 const more=root.querySelector('[data-more-npcs]'),add=root.querySelector('[data-add-npc]'),search=root.querySelector('[data-find-npc]');
 const name=form.elements.name,markdown=form.elements.markdown,preview=root.querySelector('[data-npc-preview]'),error=root.querySelector('[data-npc-error]');
 const save=form.querySelector('[type=submit]');
 const searchInput=search.querySelector('input'),clear=search.querySelector('[data-clear-npc-search]');
 const drop=form.querySelector('[data-npc-drop]'),filename=form.querySelector('[data-npc-filename]');
 const progressRoot=root.querySelector('[data-npc-progress]'),chapterButtons=[...root.querySelectorAll('[data-npc-chapter]')];
 let query='',cursor=null,generation=0,requestId,searchTimer,autoName='',saving=false,category='npc';
 function showProgress(progress){
  if(!Array.isArray(progress))return;
  progressRoot.replaceChildren();
  for(const item of progress){
   const card=document.createElement('article');
   card.className='npc-progress-card';
   card.dataset.progressCategory=item.id;
   const heading=document.createElement('strong');heading.textContent=item.name;
   const meter=document.createElement('progress');
   meter.max=item.total||1;meter.value=Math.min(item.total||1,item.staged||0);
   meter.setAttribute('aria-label',item.name+' source extraction progress');
   const desc=document.createElement('small');
   desc.textContent=item.deferred?'Deferred — not extracting yet':
    'GitHub staged '+(item.staged||0)+' / '+item.total+' · Source-reviewed '+(item.reviewed||0)+' · Needs review '+(item.staged-item.reviewed||0)+' · Cosmos imported '+(item.imported||0);
   card.append(heading,meter,desc);progressRoot.append(card);
  }
 }
 function selectCategory(id){
  if(!['npc','bestiary','companions'].includes(id))return;
  category=id;query=searchInput.value='';
  clear.hidden=true;cursor=null;list.replaceChildren();more.hidden=true;
  const label=id==='companions'?'Companion':id==='bestiary'?'Bestiary creature':'NPC';
  add.textContent='Add '+label;
  root.querySelector('#npc-create-title').textContent='Add '+label;
  save.textContent='Save '+label;
  searchInput.placeholder='Search '+(id==='companions'?'companions':id==='bestiary'?'Bestiary creatures':'NPCs')+' by name…';
  for(const button of chapterButtons)button.setAttribute('aria-pressed',String(button.dataset.npcChapter===id));
  ++generation;void load();
 }
 chapterButtons.forEach(button=>button.addEventListener('click',()=>selectCategory(button.dataset.npcChapter),{signal}));

 async function request(url,body){
  const response=await fetch(url,{signal,credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const result=await response.json();
  if(!response.ok)throw Error(result.message||({401:'Sign in to manage NPCs.',403:'Administrator access required.'}[response.status]||'Could not load NPCs.'));
  return result;
 }
 async function load(next=''){
  const turn=++generation;
  more.disabled=true;status.textContent='Loading NPCs…';
  try{
   const result=await request(endpoint+'?'+new URLSearchParams({q:query,cursor:next,category}));
   if(signal.aborted||turn!==generation)return;
   if(!next)list.replaceChildren();
   showProgress(result.progress);
   for(const character of result.characters){
    const article=document.createElement('article'),link=document.createElement('a'),tag=document.createElement('span');
    article.className='directory-character npc-catalog-row';link.className='directory-sheet-link';
    link.href='sheet.html?characterId='+encodeURIComponent(character.id);link.textContent=character.name;
    const label=character.tag||npcCatalogTag(category);
    tag.className='npc-library-tag';tag.dataset.npcTag=label;
    tag.textContent=label==='companion'?'Companion':label==='bestiary'?'Bestiary':'NPC';
    article.append(link,tag);list.append(article);
   }
   cursor=result.nextCursor;more.hidden=!cursor;
   status.textContent=list.children.length?'':query?'No matching '+(category==='companions'?'companions':category==='bestiary'?'Bestiary creatures':'NPCs')+'.':
    'No imported entries in this category yet. Staged GitHub records will appear after the final QNAP import.';
   add.hidden=search.hidden=false;
  }catch(reason){if(!signal.aborted&&turn===generation)status.textContent=reason.message;}
  finally{if(turn===generation)more.disabled=false;}
 }
 function showPreview(fallbackName=''){
  const parsed=parseNpcStatBlock(markdown.value),data=parsed.data,stats=data.npcStats;
  const suggestedName=parsed.name||fallbackName;
  if((!name.value.trim()||name.value===autoName)&&suggestedName)name.value=autoName=suggestedName;
  const highlights=[Number.isFinite(data.hp_max)?data.hp_max+' HP':'',Number.isFinite(stats.ac)?'AC '+stats.ac:'',data.weapons.length?data.weapons.length+' attacks':'',data.npcSkills.length?data.npcSkills.length+' skills':''];
  preview.textContent=highlights.filter(Boolean).join(' · ');
 }
 add.addEventListener('click',()=>{
  if(saving)return;
  form.reset();form.elements.category.value=category;requestId=recordId();autoName='';save.disabled=false;
  preview.textContent=error.textContent=filename.textContent='';
  dialog.showModal();name.focus();
 },{signal});
 root.querySelector('[data-cancel-npc]').addEventListener('click',()=>dialog.close(),{signal});
 more.addEventListener('click',()=>{if(cursor)void load(cursor);},{signal});
 function searchNames(delay){
  clearTimeout(searchTimer);query=searchInput.value.trim();clear.hidden=!searchInput.value;
  ++generation;cursor=null;more.hidden=true;
  if(delay)searchTimer=setTimeout(()=>void load(),180);else void load();
 }
 searchInput.addEventListener('input',()=>searchNames(true),{signal});
 clear.addEventListener('click',()=>{searchInput.value='';searchInput.focus();searchNames(false);},{signal});
 search.addEventListener('submit',event=>{event.preventDefault();searchNames(false);},{signal});
 markdown.addEventListener('change',()=>showPreview(),{signal});
 async function importNote(files){
  if(save.disabled||!files.length)return;
  if(files.length!==1){error.textContent='Choose one note at a time.';return;}
  const file=files[0],started=requestId;
  const current=()=>!signal.aborted&&dialog.open&&started===requestId;
  error.textContent='';save.disabled=true;
  try{
   if(!/\.(md|markdown|txt)$/i.test(file.name))throw Error('Choose a Markdown or plain text note.');
   if(file.size>256000)throw Error('Use a Markdown note under 64,000 characters.');
   const content=await file.text();
   if(!current())return;
   if(content.length>NPC_NOTE_LIMIT)throw Error('Use a Markdown note under 64,000 characters.');
   markdown.value=content;
   showPreview(file.name.replace(/\.[^.]+$/,'').slice(0,80));
   filename.textContent=file.name;
  }catch(reason){if(current())error.textContent=reason.message;}
  finally{if(current())save.disabled=false;}
 }
 form.elements.file.addEventListener('change',()=>void importNote(form.elements.file.files),{signal});
 const hasFiles=event=>event.dataTransfer?.types.includes('Files');
 dialog.addEventListener('dragover',event=>{if(hasFiles(event)){event.preventDefault();event.dataTransfer.dropEffect='copy';drop.classList.add('is-dragging');}},{signal});
 dialog.addEventListener('dragleave',event=>{if(!dialog.contains(event.relatedTarget))drop.classList.remove('is-dragging');},{signal});
 dialog.addEventListener('drop',event=>{
  drop.classList.remove('is-dragging');
  if(hasFiles(event)){event.preventDefault();void importNote(event.dataTransfer.files);}
 },{signal});
 dialog.addEventListener('close',()=>drop.classList.remove('is-dragging'),{signal});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(save.disabled)return;
  saving=save.disabled=true;error.textContent='';
  try{
   const result=await request(endpoint,{name:name.value,markdown:markdown.value,category:form.elements.category.value,requestId});
   if(!signal.aborted)location.assign('sheet.html?characterId='+encodeURIComponent(result.character.id));
  }catch(reason){if(!signal.aborted)error.textContent=reason.message;}
  finally{saving=save.disabled=false;}
 },{signal});
 selectCategory('npc');return ()=>{clearTimeout(searchTimer);dialog.close();control.abort();};
}
