// Step 6.1: browser UI over records that the server has ALREADY authorized.
// Client filtering is convenience only; it must never substitute for scope enforcement.
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const time=value=>Number.isFinite(Date.parse(value))?Date.parse(value):0;
const allowedSorts=new Set(['newest','oldest','az','za']);

export function browseLore(entries,{query='',worldId='',partyId='',scope='all',sort='newest',page=1,pageSize=6}={}){
  if(!Array.isArray(entries))throw new TypeError('Lore entries must be an array');
  if(!allowedSorts.has(sort))throw new Error('Invalid lore sort');
  if(!['all','personal'].includes(scope))throw new Error('Invalid lore scope');
  const q=String(query).trim().toLocaleLowerCase();
  const filtered=entries.filter(entry=>(!worldId||entry.worldId===worldId)&&(!partyId||entry.partyId===partyId)&&(scope!=='personal'||Boolean(entry.playerId))&&(!q||[entry.title,entry.excerpt,entry.authorName].some(value=>String(value??'').toLocaleLowerCase().includes(q))));
  const name=(a,b)=>String(a.title??'').localeCompare(String(b.title??''),'en',{sensitivity:'base'})||String(a.id??'').localeCompare(String(b.id??''));
  filtered.sort((a,b)=>sort==='az'?name(a,b):sort==='za'?-name(a,b):sort==='newest'?time(b.updatedAt)-time(a.updatedAt)||name(a,b):time(a.updatedAt)-time(b.updatedAt)||name(a,b));
  const size=Number.isSafeInteger(pageSize)&&pageSize>0&&pageSize<=30?pageSize:6;
  const count=Math.max(1,Math.ceil(filtered.length/size));
  const number=Number.isSafeInteger(page)?Math.min(Math.max(page,1),count):1;
  return {entries:filtered.slice((number-1)*size,number*size),total:filtered.length,page:number,pageCount:count};
}

function options(rows,value,label){
  return `<option value="">${esc(label)}</option>`+rows.map(row=>`<option value="${esc(row.id)}" ${value===row.id?'selected':''}>${esc(row.name)}</option>`).join('');
}
function uniqueOptions(entries,type){
  const map=new Map();for(const entry of entries){
    const id=type==='world'?entry.worldId:entry.partyId;
    const name=type==='world'?entry.worldName:entry.partyName;
    if(id&&!map.has(id))map.set(id,{id,name:name||id});
  }
  return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
function entryCard(entry,preview){
  const date=time(entry.updatedAt)?new Date(entry.updatedAt).toISOString().slice(0,10):'';
  return `<article class="comos-lore-card">
    <div class="comos-lore-card-meta"><span>${esc(entry.worldName||'World')}</span>${entry.partyId?`<span>${esc(entry.partyName||'Party')}</span>`:''}${entry.playerId?'<span>Personal</span>':''}</div>
    <h2>${esc(entry.title||'Untitled entry')}</h2><p>${esc(entry.excerpt||'No summary provided.')}</p>
    <div class="comos-lore-card-foot"><span>${date?`Updated ${esc(date)}`:'Lore entry'}</span>${preview?'<a href="lore-entry.html">Entry preview →</a>':''}</div>
  </article>`;
}

export function renderLoreLibrary({entries=[],query='',worldId='',partyId='',scope='all',sort='newest',page=1,pageSize=6,preview=false,state='ready'}={}){
  if(!['ready','loading','error','empty'].includes(state))throw new Error('Unknown lore state');
  const worlds=uniqueOptions(entries,'world');
  const parties=uniqueOptions(worldId?entries.filter(e=>e.worldId===worldId):entries,'party');
  const result=browseLore(entries,{query,worldId,partyId,scope,sort,page,pageSize});
  const noEntries=state==='empty'||(state==='ready'&&result.total===0);
  const statuses={loading:'Loading lore entries…',error:'Could not load lore. Please try again.',empty:'No lore entries to show.',ready:'No matching lore entries.'};
  return `<section class="comos-lore" aria-labelledby="comos-lore-title">
    <div class="comos-lore-heading"><div><h1 id="comos-lore-title">Lore</h1><span class="comos-lore-phase">6.1 · LIBRARY</span></div></div>
    ${preview?'<p class="comos-lore-preview" role="note">Ghost preview · Fictional sample lore; filters here do not grant access.</p>':''}
    <form class="comos-lore-tools" data-lore-search aria-label="Search and filter lore">
      <label class="comos-lore-search">Search<input name="query" type="search" maxlength="120" placeholder="Search titles and stories" value="${esc(query)}"></label>
      <button class="button" type="submit">Search</button>
      <label>World<select name="worldId">${options(worlds,worldId,'All worlds')}</select></label>
      <label>Party<select name="partyId">${options(parties,partyId,'All parties')}</select></label>
      <label>Player<select name="scope"><option value="all" ${scope==='all'?'selected':''}>All visible</option><option value="personal" ${scope==='personal'?'selected':''}>Personal only</option></select></label>
      <label>Sort<select name="sort"><option value="newest" ${sort==='newest'?'selected':''}>Newest</option><option value="oldest" ${sort==='oldest'?'selected':''}>Oldest</option><option value="az" ${sort==='az'?'selected':''}>A–Z</option><option value="za" ${sort==='za'?'selected':''}>Z–A</option></select></label>
    </form>
    <div class="comos-lore-results" aria-live="polite" aria-busy="${state==='loading'}">
      ${state==='ready'&&result.total>0?`<p class="comos-lore-count">${result.total} ${result.total===1?'entry':'entries'}</p><div class="comos-lore-list">${result.entries.map(entry=>entryCard(entry,preview)).join('')}</div>`:
       `<div class="comos-lore-empty" role="status"><span aria-hidden="true">✧</span><p>${esc(statuses[state])}</p>${!preview&&noEntries?'<small>Scoped lore records will appear here once the live Lore API is connected.</small>':''}</div>`}
    </div>
    ${state==='ready'&&result.pageCount>1?`<nav class="comos-lore-pages" aria-label="Lore pages"><button type="button" data-lore-page="prev" ${result.page<=1?'disabled':''}>Previous</button><span>Page ${result.page} of ${result.pageCount}</span><button type="button" data-lore-page="next" ${result.page>=result.pageCount?'disabled':''}>Next</button></nav>`:''}
  </section>`;
}