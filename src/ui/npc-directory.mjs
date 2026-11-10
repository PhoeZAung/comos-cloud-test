import {NPC_NOTE_LIMIT,parseNpcStatBlock} from '../features/characters/npc-stat-block.mjs';
import {recordId} from './record-id.mjs';

const endpoint='/api/v1/admin/npcs';
export function mountNpcDirectory(){
 const root=document.querySelector('[data-npc-directory]');
 const control=new AbortController(),{signal}=control;
 root.innerHTML=`<div class="npc-directory-toolbar"><h1>NPCs</h1><button type="button" class="button primary" data-add-npc hidden>Add NPC</button></div>
 <form class="npc-directory-search" data-find-npc hidden><label class="sr-only" for="npc-search">Find NPC</label><input id="npc-search" type="search" maxlength="80" placeholder="Find NPC"><button class="button" type="submit">Find</button></form>
 <p data-npc-status role="status"></p><div data-npc-list></div><button class="button" type="button" data-more-npcs hidden>More NPCs</button>
 <dialog class="npc-create-dialog" aria-labelledby="npc-create-title"><form data-npc-create>
 <h2 id="npc-create-title">Add NPC</h2>
 <label>NPC name<input name="name" maxlength="80" autocomplete="off"></label>
 <label>Markdown note<input name="file" type="file" accept=".md,.markdown,.txt,text/markdown,text/plain"></label>
 <label>Stat block<textarea name="markdown" rows="8" maxlength="${NPC_NOTE_LIMIT}" placeholder="Paste a stat block or choose a Markdown note"></textarea></label>
 <p data-npc-preview role="status"></p><p data-npc-error role="alert"></p>
 <div class="actions"><button type="button" class="button" data-cancel-npc>Cancel</button><button class="button primary" type="submit">Save NPC</button></div>
 </form></dialog>`;
 const dialog=root.querySelector('dialog'),form=root.querySelector('[data-npc-create]');
 const status=root.querySelector('[data-npc-status]'),list=root.querySelector('[data-npc-list]');
 const more=root.querySelector('[data-more-npcs]'),add=root.querySelector('[data-add-npc]'),search=root.querySelector('[data-find-npc]');
 const name=form.elements.name,markdown=form.elements.markdown,preview=root.querySelector('[data-npc-preview]'),error=root.querySelector('[data-npc-error]');
 const save=form.querySelector('[type=submit]');
 let query='',cursor=null,generation=0,requestId;

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
   const result=await request(endpoint+'?'+new URLSearchParams({q:query,cursor:next}));
   if(signal.aborted||turn!==generation)return;
   if(!next)list.replaceChildren();
   for(const character of result.characters){
    const article=document.createElement('article'),link=document.createElement('a');
    article.className='directory-character';link.className='directory-sheet-link';
    link.href='sheet.html?characterId='+encodeURIComponent(character.id);link.textContent=character.name;
    article.append(link);list.append(article);
   }
   cursor=result.nextCursor;more.hidden=!cursor;status.textContent=list.children.length?'':'No NPCs found.';
   add.hidden=search.hidden=false;
  }catch(reason){if(!signal.aborted&&turn===generation)status.textContent=reason.message;}
  finally{if(turn===generation)more.disabled=false;}
 }
 function showPreview(){
  const parsed=parseNpcStatBlock(markdown.value),data=parsed.data,stats=data.npcStats;
  if(!name.value.trim()&&parsed.name)name.value=parsed.name;
  const highlights=[data.hp_max!==undefined?data.hp_max+' HP':'',stats.ac!==undefined?'AC '+stats.ac:'',data.weapons.length?data.weapons.length+' attacks':'',data.npcSkills.length?data.npcSkills.length+' skills':''];
  preview.textContent=highlights.filter(Boolean).join(' · ');
 }
 add.addEventListener('click',()=>{form.reset();requestId=recordId();preview.textContent=error.textContent='';dialog.showModal();name.focus();},{signal});
 root.querySelector('[data-cancel-npc]').addEventListener('click',()=>dialog.close(),{signal});
 more.addEventListener('click',()=>{if(cursor)void load(cursor);},{signal});
 search.addEventListener('submit',event=>{event.preventDefault();query=search.querySelector('input').value;void load();},{signal});
 markdown.addEventListener('change',showPreview,{signal});
 form.elements.file.addEventListener('change',async()=>{
  const file=form.elements.file.files[0],started=requestId;
  if(!file)return;
  error.textContent='';
  try{
   if(file.size>256000)throw Error('Use a Markdown note under 64,000 characters.');
   const content=await file.text();
   if(signal.aborted||!dialog.open||started!==requestId)return;
   if(content.length>NPC_NOTE_LIMIT)throw Error('Use a Markdown note under 64,000 characters.');
   markdown.value=content;showPreview();
   if(!name.value.trim())name.value=file.name.replace(/\.[^.]+$/,'').slice(0,80);
  }catch(reason){if(started===requestId)error.textContent=reason.message;}
 },{signal});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(save.disabled)return;
  save.disabled=true;error.textContent='';
  try{
   const result=await request(endpoint,{name:name.value,markdown:markdown.value,requestId});
   if(!signal.aborted)location.assign('sheet.html?characterId='+encodeURIComponent(result.character.id));
  }catch(reason){if(!signal.aborted)error.textContent=reason.message;}
  finally{save.disabled=false;}
 },{signal});
 void load();return ()=>{dialog.close();control.abort();};
}
