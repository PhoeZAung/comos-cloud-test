import {tagChoices} from '../features/tag-groups.mjs';
import {tag,edit,levelUp,statusCard,external} from './admin-icons.mjs';
const shop='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"><path d="M4 8h16l-1.5 12h-13L4 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path,body,signal){const r=await fetch('/api/v1/'+path,{credentials:'same-origin',cache:'no-store',signal,...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Error(data.message||({401:'Sign in to continue.',403:'Administrator access required.',409:'Character changed. Close and open it again.'}[r.status]||'Could not connect.'));return data;}
export function mountCharacterAdmin(){
 const root=document.querySelector('[data-character-admin]'),control=new AbortController();let query='',cursor='',closed=false,searchTimer,searchGeneration=0;const partyMode=root.hasAttribute('data-party-admin'),openGroups=new Set();
 root.innerHTML=`<div class="directory-tools"><form data-find><label class="sr-only" for="directory-search">${partyMode?'Find party / character':'Find character / user'}</label><input type="search" id="directory-search" name="q" maxlength="80" placeholder="${partyMode?'Find party / character':'Find character / user'}"><button class="button" type="submit">Find</button></form><a class="icon-button" href="admin-tags.html" aria-label="Manage tags" title="Manage tags">${tag}</a></div><p role="status" data-feedback></p><div data-users></div><dialog data-tags-dialog aria-labelledby="tag-heading"><form data-tag-form><h2 id="tag-heading">Character tags</h2><div data-tag-choices></div><p role="status" data-dialog-status></p><div class="actions"><button class="button primary" type="submit">Save</button><button class="button" data-close type="button">Close</button></div></form></dialog>`;
 if(!partyMode)root.insertAdjacentHTML('beforeend',`<dialog class="character-create-dialog" data-admin-create-dialog aria-labelledby="admin-create-title">
   <h2 id="admin-create-title">Create a character</h2>
   <p data-admin-create-owner></p>
   <p>How would you like to start?</p>
   <div class="character-create-choices">
     <a class="button primary" data-admin-create-wizard href="create-identity.html">Use Wizard</a>
     <button type="button" class="button" data-admin-create-manual>Create Manually</button>
   </div>
   <p role="status" aria-live="polite" data-admin-create-status></p>
   <div class="actions"><button type="button" class="button" data-admin-create-cancel>Cancel</button></div>
 </dialog>`);
 const feedback=root.querySelector('[data-feedback]'),list=root.querySelector('[data-users]'),dialog=root.querySelector('[data-tags-dialog]'),createDialog=root.querySelector('[data-admin-create-dialog]');let selected,opening=false,createOwnerId='',createRequestId=null,creating=false;
 createDialog?.addEventListener('cancel',event=>{if(creating)event.preventDefault();},{signal:control.signal});
 createDialog?.addEventListener('click',event=>{if(event.target===createDialog&&!creating)createDialog.close();},{signal:control.signal});
 async function load(){const generation=++searchGeneration;feedback.textContent='Loading…';try{const d=await api('admin/directory?'+new URLSearchParams({q:query,cursor,...(partyMode?{groupBy:'party'}:{})}),null,control.signal);if(closed||generation!==searchGeneration)return;list.innerHTML=(partyMode?(d.parties||[]).map(p=>({...p,displayName:p.name})):d.users).map(u=>`<details class="directory-user" data-user="${esc(u.id)}" ${query||openGroups.has(u.id)?'open':''}><summary>${esc(u.displayName||'Unnamed user')} <span>${u.characterCount}</span><a class="icon-button" href="admin-sheets.html?${partyMode?'partyTagId':'ownerId'}=${encodeURIComponent(u.id)}" target="_blank" rel="noopener" aria-label="Open all sheets for ${esc(u.displayName||'group')}" title="Open all sheets">${external}</a></summary>${partyMode?'':`<div class="actions"><button type="button" class="button primary" data-admin-create-open="${esc(u.id)}" data-admin-owner-name="${esc(u.displayName||'Unnamed user')}" aria-label="Create character for ${esc(u.displayName||'Unnamed user')}">+ Create character for this player</button><button type="button" class="button danger" data-delete-user="${esc(u.id)}" data-user-name="${esc(u.displayName||'')}" data-user-revision="${u.revision}" aria-label="Delete user ${esc(u.displayName||'Unnamed user')}">Delete user</button></div>`}<div data-character-list></div></details>`).join('')||(partyMode?'<p>No parties.</p>':'<p>No users found.</p>');if(d.nextCursor)list.insertAdjacentHTML('beforeend',`<button class="button" data-more-users="${esc(d.nextCursor)}">${partyMode?'More parties':'More users'}</button>`);feedback.textContent='';for(const detail of list.querySelectorAll('[data-user][open]')){detail.dataset.loaded='true';void characters(detail);}}catch(e){if(!closed&&generation===searchGeneration)feedback.textContent=e.message;}}
 async function characters(details,next=''){
  const box=details.querySelector('[data-character-list]'),generation=searchGeneration;try{const d=await api('admin/directory?'+new URLSearchParams({...(partyMode?{groupBy:'party',partyTagId:details.dataset.user}:{ownerId:details.dataset.user}),cursor:next,q:query}),null,control.signal);if(closed||generation!==searchGeneration||!details.isConnected)return;const markup=d.characters.map(c=>`<article class="directory-character"><div><a class="directory-sheet-link" href="sheet.html?characterId=${encodeURIComponent(c.id)}" aria-label="Open sheet for ${esc(c.name)}"><strong>${esc(c.name)}</strong></a><div class="character-tag-labels">${c.tags.map(t=>`<span>${esc(t.name)}</span>`).join('')}</div></div><div class="character-controls"><button type="button" class="icon-button owlbear-status-toggle" data-owlbear-status="${esc(c.id)}" aria-pressed="${c.owlbearStatusVisible===true}" aria-label="Cosmos party for ${esc(c.name)}" title="${c.owlbearStatusVisible?'Hide from Cosmos party':'Show in Cosmos party'}">${statusCard}</button><button type="button" class="icon-button" data-character-tags="${esc(c.id)}" aria-label="Tags for ${esc(c.name)}" title="Tags">${tag}</button><a class="icon-button" href="admin-items.html?characterId=${encodeURIComponent(c.id)}" aria-label="Shop as ${esc(c.name)}" title="Shop as character">${shop}</a><a class="icon-button" href="create-identity.html?characterId=${encodeURIComponent(c.id)}" aria-label="Edit ${esc(c.name)}" title="Edit wizard">${edit}</a><a class="icon-button" href="create-identity.html?characterId=${encodeURIComponent(c.id)}&levelUp=1" aria-label="Level up ${esc(c.name)}" title="Level up character">${levelUp}</a></div></article>`).join('');if(next)box.insertAdjacentHTML('beforeend',markup);else box.innerHTML=markup||'<p>No characters.</p>';box.querySelector('[data-more-characters]')?.remove();if(d.nextCursor)box.insertAdjacentHTML('beforeend',`<button class="button" data-more-characters="${esc(d.nextCursor)}">More characters</button>`);}catch(e){if(!closed)box.textContent=e.message;}
 }
 root.addEventListener('input',event=>{if(!event.target.matches('#directory-search'))return;query=event.target.value;cursor='';searchGeneration++;clearTimeout(searchTimer);searchTimer=setTimeout(()=>void load(),120);},{signal:control.signal});
 root.addEventListener('toggle',event=>{const detail=event.target;if(detail.matches?.('[data-user]')){if(detail.open)openGroups.add(detail.dataset.user);else openGroups.delete(detail.dataset.user);}if(detail.matches?.('[data-user]')&&detail.open&&!detail.dataset.loaded){detail.dataset.loaded='true';void characters(detail);}},{capture:true,signal:control.signal});
 root.addEventListener('click',async event=>{
  const create=event.target.closest('[data-admin-create-open]');
  if(create&&createDialog){
   if(creating)return;
   const ownerId=create.dataset.adminCreateOpen;
   if(createOwnerId!==ownerId)createRequestId=null;
   createOwnerId=ownerId;
   createDialog.querySelector('[data-admin-create-owner]').textContent='For '+(create.dataset.adminOwnerName||'this player');
   createDialog.querySelector('[data-admin-create-wizard]').href='create-identity.html?ownerId='+encodeURIComponent(ownerId);
   createDialog.querySelector('[data-admin-create-status]').textContent='';
   createDialog.showModal();
   return;
  }
  if(event.target.closest('[data-admin-create-cancel]')){if(!creating)createDialog?.close();return;}
  if(event.target.closest('[data-admin-create-wizard]')&&creating){event.preventDefault();return;}
  const manual=event.target.closest('[data-admin-create-manual]');
  if(manual&&createDialog){
   if(creating||!createOwnerId)return;
   creating=true;createRequestId||=crypto.randomUUID();
   const status=createDialog.querySelector('[data-admin-create-status]');
   const cancel=createDialog.querySelector('[data-admin-create-cancel]');
   const wizard=createDialog.querySelector('[data-admin-create-wizard]');
   manual.disabled=true;cancel.disabled=true;wizard.setAttribute('aria-disabled','true');wizard.tabIndex=-1;
   status.textContent='Creating blank character…';
   try{
    const result=await api('admin/characters/create',{mode:'manual',ownerId:createOwnerId,requestId:createRequestId},control.signal);
    if(typeof result.character?.id!=='string')throw Error('Character was not returned. Try again.');
    location.assign('sheet.html?characterId='+encodeURIComponent(result.character.id));
   }catch(error){
    if(!closed&&!control.signal.aborted){
     status.textContent=error.message||'Could not create the character.';
     creating=false;manual.disabled=false;cancel.disabled=false;wizard.removeAttribute('aria-disabled');wizard.removeAttribute('tabindex');
    }
   }
   return;
  }
  const remove=event.target.closest('[data-delete-user]');if(remove){
   const popup=document.createElement('dialog');popup.className='directory-delete-user';popup.setAttribute('aria-label','Delete user');
   popup.innerHTML='<form><h2>Delete '+esc(remove.dataset.userName||'user')+'?</h2><p>Removes Cosmos access and archives their characters. Their shared Firebase account stays active.</p><label>Confirm user name<input name="confirmName" required autocomplete="off"></label><p role="status"></p><div class="actions"><button type="button" class="button" data-cancel-delete>Cancel</button><button type="submit" class="button danger">Delete user</button></div></form>';
   popup.addEventListener('click',event=>{if(event.target===popup||event.target.closest('[data-cancel-delete]'))popup.close();});const closeDelete=()=>popup.close();control.signal.addEventListener('abort',closeDelete,{once:true});popup.addEventListener('close',()=>{control.signal.removeEventListener('abort',closeDelete);popup.remove();},{once:true});
   popup.querySelector('form').addEventListener('submit',async event=>{event.preventDefault();const submit=popup.querySelector('[type=submit]');submit.disabled=true;try{await api('admin/users/remove',{userId:remove.dataset.deleteUser,confirmName:popup.querySelector('input').value,revision:Number(remove.dataset.userRevision)},control.signal);popup.close();if(!closed)void load();}catch(error){popup.querySelector('[role=status]').textContent=error.message;}finally{submit.disabled=false;}});
   document.body.append(popup);popup.showModal();return;
  }
  const close=event.target.closest('[data-close]');if(close){dialog.close();return;}
  const more=event.target.closest('[data-more-users]');if(more){cursor=more.dataset.moreUsers;void load();return;}
  const next=event.target.closest('[data-more-characters]');if(next){void characters(next.closest('details'),next.dataset.moreCharacters);return;}
  const toggle=event.target.closest('[data-owlbear-status]');if(toggle){
   if(toggle.disabled)return;toggle.disabled=true;const visible=toggle.getAttribute('aria-pressed')!=='true';
   try{const current=await api('character-records/'+toggle.dataset.owlbearStatus,null,control.signal);await api('character-records/'+toggle.dataset.owlbearStatus,{op:'owlbear-status',revision:current.character.revision,visible},control.signal);if(!closed){for(const node of root.querySelectorAll('[data-owlbear-status]'))if(node.dataset.owlbearStatus===toggle.dataset.owlbearStatus){node.setAttribute('aria-pressed',String(visible));node.title=visible?'Hide from Cosmos party':'Show in Cosmos party';}feedback.textContent=visible?'Character shown in Cosmos Party.':'Character hidden from Cosmos Party.';}}
   catch(error){if(!closed)feedback.textContent=error.message;}finally{toggle.disabled=false;}return;
  }
  const button=event.target.closest('[data-character-tags]');if(!button||opening)return;opening=true;feedback.textContent='Loading tags…';
  try{const d=await api('character-records/'+button.dataset.characterTags,null,control.signal);if(closed)return;selected=d.character;root.querySelector('[data-tag-choices]').innerHTML=tagChoices(d.availableTags,{selected:selected.tags,attribute:'data-character-tag-choice',name:'tags'});root.querySelector('[data-dialog-status]').textContent='';dialog.showModal();feedback.textContent='';}catch(e){if(!closed)feedback.textContent=e.message;}finally{opening=false;}
 },{signal:control.signal});
 root.addEventListener('submit',async event=>{
  event.preventDefault();if(event.target.matches('[data-find]')){query=new FormData(event.target).get('q');cursor='';void load();return;}
  if(!event.target.matches('[data-tag-form]'))return;const status=root.querySelector('[data-dialog-status]'),save=event.target.querySelector('[type=submit]');save.disabled=true;
  try{await api('character-records/'+selected.id,{op:'tags',revision:selected.revision,tagIds:new FormData(event.target).getAll('tags')},control.signal);if(!closed){dialog.close();if(partyMode)void load();else for(const d of list.querySelectorAll('details[open]'))void characters(d);}}catch(e){if(!closed)status.textContent=e.message;}finally{save.disabled=false;}
 },{signal:control.signal});void load();return ()=>{closed=true;clearTimeout(searchTimer);control.abort();dialog.close();createDialog?.close();};
}
export function mountTags(){
 const root=document.querySelector('[data-tag-manager]'),control=new AbortController();let closed=false;
 root.innerHTML=['world','party'].map(kind=>`<section class="tag-manager-group"><h2>${kind==='world'?'World':'Party'} tags</h2><form data-new-tag data-kind="${kind}"><label class="sr-only" for="new-${kind}-tag">${kind==='world'?'World':'Party'} tag name</label><input id="new-${kind}-tag" name="name" placeholder="${kind==='world'?'World':'Party'} tag name" required maxlength="80"><button class="button primary">Add ${kind} tag</button></form><div data-tag-list="${kind}"></div></section>`).join('')+'<p role="status"></p>';
 const status=root.querySelector('[role=status]');
 function draw(tags){if(closed)return;for(const kind of ['world','party'])root.querySelector('[data-tag-list='+kind+']').innerHTML=tags.filter(t=>(t.kind||'party')===kind).map(t=>`<form data-tag-id="${esc(t.id)}" class="tag-editor"><label class="sr-only" for="tag-${esc(t.id)}">Tag name</label><input id="tag-${esc(t.id)}" name="name" required maxlength="80" value="${esc(t.name)}"><select name="kind" aria-label="Group for ${esc(t.name)}"><option value="world" ${kind==='world'?'selected':''}>World</option><option value="party" ${kind==='party'?'selected':''}>Party</option></select><button class="button">Save</button></form>`).join('');}
 api('admin/tags',null,control.signal).then(d=>draw(d.tags)).catch(e=>{if(!closed)status.textContent=e.message;});
 root.addEventListener('submit',async event=>{event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;try{const fields=new FormData(event.target),name=fields.get('name'),id=event.target.dataset.tagId,kind=fields.get('kind')||event.target.dataset.kind;const d=await api('admin/tags',{name,kind,...(id?{id}:{})},control.signal);draw(d.tags);status.textContent='Saved.';if(!id)event.target.reset();}catch(e){if(!closed)status.textContent=e.message;}finally{button.disabled=false;}},{signal:control.signal});return ()=>{closed=true;control.abort();};
}
