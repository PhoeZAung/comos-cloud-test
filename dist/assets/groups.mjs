const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let ghost;
export function mountGroups({fixture=false}={}){
 const root=document.querySelector('[data-groups]'),controller=new AbortController();let state,busy=false,closed=false;
 let search='',selected='';
 const options=(rows,empty)=>`<option value="">${empty}</option>`+rows.map(r=>`<option value="${esc(r.id)}">${esc(r.name||r.displayName||'Unnamed player')}</option>`).join('');
 function draw(message=''){
  if(closed)return;
  root.innerHTML=`${fixture?'<p class="field-help">Ghost preview · Sample players and worlds. Nothing is saved to real accounts.</p>':''}<button class="button" data-reload type="button">Reload groups</button><p data-group-status role="status" tabindex="-1">${esc(message)}</p><div class="account-editor"><section class="account-section"><h2>Worlds <small>${state.worlds.length} / 4</small></h2><form data-group-form="world"><label for="world-select">World</label><select id="world-select" name="id">${options(state.worlds,'New world')}</select><label for="world-name">Name</label><input id="world-name" name="name" required maxlength="80"><button class="button" type="submit">Save world</button></form><h3>Parties</h3><form data-group-form="party"><label for="party-select">Party</label><select id="party-select" name="id">${options(state.parties,'New party')}</select><label for="party-world">World</label><select id="party-world" name="worldId" required>${options(state.worlds,'Choose world')}</select><label for="party-name">Name</label><input id="party-name" name="name" required maxlength="80"><button class="button" type="submit">Save party</button></form></section><section class="account-section"><h2>Memberships</h2><form data-search><label for="player-search">Find a player</label><input id="player-search" name="q" value="${esc(search)}" maxlength="80" placeholder="Name or account ID"><button class="button" type="submit">Search</button></form>${state.moreUsers?'<p>Narrow your search to see more players.</p>':''}<label for="player-select">Player</label><select id="player-select">${options(state.selectedUser&&!state.users.some(u=>u.id===state.selectedUser.id)?[state.selectedUser,...state.users]:state.users,'Choose player')}</select><form data-group-form="memberships"><fieldset><legend>World access</legend>${state.worlds.map(w=>`<label class="group-check"><input type="checkbox" name="worldIds" value="${esc(w.id)}" ${state.memberships.worldIds.includes(w.id)?'checked':''}>${esc(w.name)}</label>`).join('')||'<p>No worlds configured.</p>'}</fieldset><fieldset><legend>Party access</legend>${state.parties.map(p=>`<label class="group-check"><input type="checkbox" name="partyIds" value="${esc(p.id)}" ${state.memberships.partyIds.includes(p.id)?'checked':''}>${esc(p.name)} · ${esc(state.worlds.find(w=>w.id===p.worldId)?.name)}</label>`).join('')||'<p>No parties configured.</p>'}</fieldset><button class="button primary" type="submit" ${state.selectedUser?'':'disabled'}>Save memberships</button></form></section></div>`;
  root.querySelector('#player-select').value=state.selectedUser?.id||'';
 }
 async function request(data){
  const query=new URLSearchParams({q:search,userId:selected});
  const res=await fetch('/api/v1/admin/groups?'+query,{credentials:'same-origin',cache:'no-store',...(data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{})});
  const result=await res.json();if(!res.ok)throw Object.assign(new Error(result.message||({401:'Sign in to continue.',403:'Administrator access required.',409:'Groups changed in another session. Reload before saving.',429:'Too many changes. Wait a minute and try again.'}[res.status]||'Could not load groups. Try again.')),{status:res.status});return result;
 }
 async function load(){
  if(busy)return;busy=true;
  try{
   if(fixture){ghost??={revision:1,worlds:[1,2,3,4].map(i=>({id:'fixture:world:'+i,name:'World '+i})),parties:[],users:[{id:'fixture:player:1',displayName:'Preview explorer'},{id:'fixture:player:2',displayName:'Second player'}],assignments:{}};state=structuredClone(ghost);state.users=state.users.filter(u=>u.displayName.toLowerCase().includes(search.toLowerCase()));state.selectedUser=state.users.find(u=>u.id===selected)||state.users[0]||null;state.memberships=ghost.assignments[state.selectedUser?.id]||{worldIds:[],partyIds:[]};}
   else state=await request();
   selected=state.selectedUser?.id||'';draw();
  }catch(error){if(!closed){root.innerHTML='<p role="status">'+esc(error.message)+'</p><button class="button" data-reload>Reload</button>'+(!fixture?'<a class="button" href="signin.html">Sign in</a>':'');}}
  finally{busy=false;}
 }
 root.addEventListener('change',event=>{
  const e=event.target;
  if(e.id==='player-select'){selected=e.value;void load();return;}
  if(e.id==='world-select'){root.querySelector('#world-name').value=state.worlds.find(w=>w.id===e.value)?.name||'';}
  if(e.id==='party-select'){const p=state.parties.find(p=>p.id===e.value);root.querySelector('#party-name').value=p?.name||'';root.querySelector('#party-world').value=p?.worldId||'';}
 },{signal:controller.signal});
 root.addEventListener('click',event=>{if(event.target.closest('[data-reload]'))void load();},{signal:controller.signal});
 root.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;const form=event.target,data=new FormData(form);
  if(form.hasAttribute('data-search')){search=String(data.get('q'));selected='';void load();return;}
  const op=form.dataset.groupForm;let change={op,revision:state.revision};
  if(op==='memberships')change={...change,userId:selected,worldIds:data.getAll('worldIds'),partyIds:data.getAll('partyIds')};
  else change={...change,...Object.fromEntries(data)};
  const status=root.querySelector('[data-group-status]');busy=true;status.textContent='Saving…';
  try{
   if(fixture){
    if(op==='memberships'){if(change.partyIds.some(id=>!change.worldIds.includes(ghost.parties.find(p=>p.id===id)?.worldId)))throw Error('Party access requires membership in its world.');ghost.assignments[selected]={worldIds:change.worldIds,partyIds:change.partyIds};}
    else {const rows=op==='world'?ghost.worlds:ghost.parties;const old=rows.find(r=>r.id===change.id);if(op==='party'&&old&&old.worldId!==change.worldId)throw Error('An existing party must stay in its world.');if(!old&&op==='world'&&rows.length===4)throw Error('Rename an existing world; all four are configured.');const record={id:old?.id||'fixture:party:'+Date.now(),name:change.name.trim(),...(op==='party'?{worldId:change.worldId}:{})};if(old)Object.assign(old,record);else rows.push(record);}
    ghost.revision++;
   }else state=await request(change);
   busy=false;await load();if(!closed)root.querySelector('[data-group-status]').textContent=fixture?'Preview updated.':'Saved.';
  }catch(error){if(!closed)status.textContent=error.message;}
  finally{busy=false;}
 },{signal:controller.signal});
 void load();return ()=>{closed=true;controller.abort();};
}
