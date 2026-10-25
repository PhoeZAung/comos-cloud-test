import {recordId} from './record-id.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let ghost;
export function mountCharacterAdmin({fixture=false}={}){
 const root=document.querySelector('[data-character-admin]'),controller=new AbortController();
 let closed=false,busy=false,records=[],users=[],editing=null,draftId=null,cursor='',nextCursor=null,q='',archived=false,sourceIndex=0;
 function setBusy(value){busy=value;if(!closed)for(const control of root.querySelectorAll('input,select,button'))control.disabled=value;}
 const status=message=>{if(!closed)root.querySelector('[data-character-status]').textContent=message;};
 async function request(path,body){
  const response=await fetch('/api/v1/'+path,{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const data=await response.json();if(!response.ok)throw Error(data.message||({401:'Sign in to continue.',403:'Administrator access required.',409:'This record changed. Reload before saving.',429:'Too many changes. Wait a minute and try again.'}[response.status]||'Could not connect. Try again.'));return data;
 }
 function sourceRow(source={id:'',version:''}){
  const n=++sourceIndex;
  return `<div class="character-source"><div><label for="source-id-${n}">Source ID</label><input id="source-id-${n}" name="sourceId" value="${esc(source.id)}" maxlength="64"></div><div><label for="source-version-${n}">Version</label><input id="source-version-${n}" name="sourceVersion" value="${esc(source.version)}" maxlength="64"></div><button class="button" type="button" data-remove-source aria-label="Remove source">×</button></div>`;
 }
 function options(){
  const selected=editing&&{id:editing.ownerId,displayName:editing.ownerName};
  const rows=selected&&!users.some(u=>u.id===selected.id)?[selected,...users]:users;
  return '<option value="">Choose player</option>'+rows.map(u=>`<option value="${esc(u.id)}">${esc(u.displayName||'Unnamed player')} · ${esc(u.id.slice(0,8))}</option>`).join('');
 }
 function drawEditor(){
  const e=editing;
  root.querySelector('[data-record-editor]').innerHTML=`<h2>${e?'Edit character':'Add character record'}</h2><form data-owner-search><label for="owner-search">Find owner</label><input id="owner-search" name="q" maxlength="80" placeholder="Player name or account ID"><button class="button" type="submit">Search players</button></form><form data-record-form><label for="character-name">Character name</label><input id="character-name" name="name" required maxlength="80" value="${esc(e?.name)}"><label for="character-owner">Owner</label><select id="character-owner" name="ownerId" required>${options()}</select><fieldset><legend>Sources</legend><div data-sources>${(e?.sources?.length?e.sources:[{}]).map(sourceRow).join('')}</div><button class="button" type="button" data-add-source>Add source</button></fieldset><div class="actions"><button class="button primary" type="submit">Save character</button><button class="button" type="button" data-cancel>Cancel</button>${e?`<button class="button" type="button" data-archive>${e.archived?'Restore character':'Archive character'}</button>`:''}</div></form>`;
  root.querySelector('#character-owner').value=e?.ownerId||'';
 }
 function draw(){
  if(closed)return;
  root.innerHTML=`${fixture?'<p class="field-help">Ghost preview · Sample character records. Changes stay in this preview until refresh.</p>':''}<p data-character-status role="status" tabindex="-1"></p><div class="actions"><button class="button" data-reload type="button">Reload characters</button><button class="button primary" data-new type="button">Add character record</button>${fixture?'':'<a class="button" href="/api/v1/admin/backup" download>Download backup (users &amp; characters)</a>'}</div><form data-character-search class="character-search"><div><label for="character-search">Find character</label><input id="character-search" name="q" value="${esc(q)}" maxlength="80"></div><label class="group-check"><input type="checkbox" name="archived" ${archived?'checked':''}>Archived</label><button class="button" type="submit">Search</button></form><div class="character-admin-grid"><section class="account-section" aria-label="Character list"><div data-record-list>${records.map(r=>`<article class="character-record"><h2>${esc(r.name)}</h2><p>Owner: ${esc(r.ownerName||'Unnamed player')}</p><p>${r.sources.map(s=>esc(s.id)+' · '+esc(s.version)).join(', ')||'No sources assigned'}</p><button class="button" data-edit="${esc(r.id)}">Edit <span class="sr-only">${esc(r.name)}</span></button></article>`).join('')||'<p>No character records found.</p>'}</div><div class="actions">${cursor?'<button class="button" data-first>First page</button>':''}${nextCursor?'<button class="button" data-next>Next page</button>':''}</div></section><section class="account-section" data-record-editor><p>Select a character or add a record.</p></section></div>`;
 }
 async function load(message=''){
  if(busy)return;setBusy(true);editing=null;draftId=null;
  try{
   if(fixture){
    ghost??={users:[{id:'fixture:player:1',displayName:'Preview explorer'},{id:'fixture:player:2',displayName:'Second player'}],records:[{id:'fixture:character:1',name:'Preview character',ownerId:'fixture:player:1',ownerName:'Preview explorer',sources:[],archived:false,revision:1}]};
    users=structuredClone(ghost.users);records=structuredClone(ghost.records.filter(r=>r.archived===archived&&r.name.toLowerCase().includes(q.toLowerCase())));nextCursor=null;
   }else{
    const [list,players]=await Promise.all([request('admin/characters?'+new URLSearchParams({q,cursor,archived:archived?'1':'0'})),request('admin/players')]);
    records=list.characters;nextCursor=list.nextCursor;users=players.users;
   }
   draw();status(message);
  }catch(error){if(!closed)root.innerHTML=`<p role="status">${esc(error.message)}</p><button class="button" data-reload>Reload</button>${!fixture?'<a class="button" href="preview/admin.html">Ghost preview</a>':''}`;}
  finally{setBusy(false);}
 }
 root.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button||busy)return;
  if(button.hasAttribute('data-reload')){void load();return;}
  if(button.hasAttribute('data-new')){editing=null;draftId=recordId();drawEditor();root.querySelector('#character-name').focus();return;}
  if(button.dataset.edit){editing=records.find(r=>r.id===button.dataset.edit);draftId=null;drawEditor();root.querySelector('#character-name').focus();return;}
  if(button.hasAttribute('data-cancel')){editing=null;draftId=null;root.querySelector('[data-record-editor]').innerHTML='<p>Select a character or add a record.</p>';return;}
  if(button.hasAttribute('data-add-source')){const rows=root.querySelector('[data-sources]');if(rows.children.length<10)rows.insertAdjacentHTML('beforeend',sourceRow());else status('Choose up to ten sources.');return;}
  if(button.hasAttribute('data-remove-source')){button.closest('.character-source').remove();return;}
  if(button.hasAttribute('data-first')){cursor='';void load();return;}
  if(button.hasAttribute('data-next')){cursor=nextCursor;void load();return;}
  if(button.hasAttribute('data-archive')&&editing){
   const record=editing;setBusy(true);status(record.archived?'Restoring…':'Archiving…');
   try{
    if(fixture){Object.assign(ghost.records.find(r=>r.id===record.id),{archived:!record.archived,revision:record.revision+1});}
    else await request('admin/characters',{op:'archive',id:record.id,revision:record.revision,archived:!record.archived});
    setBusy(false);cursor='';await load(record.archived?'Character restored.':'Character archived.');
   }catch(error){status(error.message);}finally{setBusy(false);}
  }
 },{signal:controller.signal});
 root.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const form=event.target,data=new FormData(form);
  if(form.hasAttribute('data-character-search')){q=String(data.get('q'));archived=data.has('archived');cursor='';void load();return;}
  if(form.hasAttribute('data-owner-search')){
   const query=String(data.get('q')),select=root.querySelector('#character-owner'),selected=select.value;setBusy(true);
   try{const result=fixture?{users:ghost.users.filter(u=>u.displayName.toLowerCase().includes(query.toLowerCase())),moreUsers:false}:await request('admin/players?'+new URLSearchParams({q:query,userId:selected}));users=result.users;if(result.selectedUser&&!users.some(u=>u.id===result.selectedUser.id))users.unshift(result.selectedUser);const old=Array.from(select.options).find(o=>o.value===selected);select.innerHTML=options();if(selected&&!Array.from(select.options).some(o=>o.value===selected)&&old)select.append(old);select.value=selected;status(result.moreUsers?'Narrow your search to see more players.':'Players loaded.');}catch(error){status(error.message);}finally{setBusy(false);}return;
  }
  if(!form.hasAttribute('data-record-form'))return;
  const ids=data.getAll('sourceId'),versions=data.getAll('sourceVersion');
  const sources=ids.map((id,i)=>({id:String(id).trim(),version:String(versions[i]).trim()})).filter(s=>s.id||s.version);
  if(sources.some(s=>!['id','version'].every(k=>/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(s[k])))||new Set(sources.map(s=>s.id)).size!==sources.length){status('Each source needs a unique ID and a version.');return;}
  const change={op:'save',id:editing?.id||draftId,revision:editing?.revision||0,name:String(data.get('name')).trim(),ownerId:String(data.get('ownerId')),sources};
  setBusy(true);status('Saving…');
  try{
   if(fixture){const owner=ghost.users.find(u=>u.id===change.ownerId);if(!owner)throw Error('Choose a player.');const old=ghost.records.find(r=>r.id===change.id);const record={...change,ownerName:owner.displayName,archived:old?.archived||false,revision:change.revision+1};if(old)Object.assign(old,record);else ghost.records.push(record);}
   else await request('admin/characters',change);
   setBusy(false);cursor='';await load(fixture?'Preview updated.':'Character saved.');
  }catch(error){status(error.message);}finally{setBusy(false);}
 },{signal:controller.signal});
 void load();return ()=>{closed=true;controller.abort();};
}
