// Lore discovery UI. Entries must already be authorized by the future Lore API.
// The tag selector is backed by active tags on the signed-in player's characters.
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const time=value=>Number.isFinite(Date.parse(value))?Date.parse(value):0;
const allowedSorts=new Set(['newest','oldest','az','za']);
const searchIcon='<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 5 5"/></svg>';
const tagIcon='<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h9l9 9-8 8-10-10V4Z"/><circle cx="8" cy="9" r="1.5"/></svg>';
const ids=tags=>Array.isArray(tags)?tags.map(tag=>typeof tag==='string'?tag:tag&&typeof tag.id==='string'?tag.id:null).filter(Boolean):[];

export function browseLore(entries,{query='',worldId='',partyId='',scope='all',sort='newest',selectedTags=[],allowedTags=null,page=1,pageSize=6}={}){
  if(!Array.isArray(entries))throw new TypeError('Lore entries must be an array');
  if(!allowedSorts.has(sort))throw new Error('Invalid lore sort');
  if(!['all','personal'].includes(scope))throw new Error('Invalid lore scope');
  const picked=[...new Set(ids(selectedTags))];
  const available=allowedTags===null?null:new Set(ids(allowedTags));
  // If the selected tag is no longer attached to one of the player's characters,
  // fail closed rather than displaying unfiltered entries.
  const unavailable=available!==null&&picked.some(id=>!available.has(id));
  const q=String(query).trim().toLocaleLowerCase();
  const filtered=unavailable?[]:entries.filter(entry=>
    (!worldId||entry.worldId===worldId)&&(!partyId||entry.partyId===partyId)&&
    (scope!=='personal'||Boolean(entry.playerId))&&
    (!picked.length||picked.some(id=>ids(entry.tags).includes(id)))&&
    (!q||[entry.title,entry.excerpt,entry.authorName].some(value=>String(value??'').toLocaleLowerCase().includes(q)))
  );
  const name=(a,b)=>String(a.title??'').localeCompare(String(b.title??''),'en',{sensitivity:'base'})||String(a.id??'').localeCompare(String(b.id??''));
  filtered.sort((a,b)=>sort==='az'?name(a,b):sort==='za'?-name(a,b):sort==='newest'?time(b.updatedAt)-time(a.updatedAt)||name(a,b):time(a.updatedAt)-time(b.updatedAt)||name(a,b));
  const size=Number.isSafeInteger(pageSize)&&pageSize>0&&pageSize<=30?pageSize:6;
  const count=Math.max(1,Math.ceil(filtered.length/size));
  const number=Number.isSafeInteger(page)?Math.min(Math.max(page,1),count):1;
  return {entries:filtered.slice((number-1)*size,number*size),total:filtered.length,page:number,pageCount:count};
}

function entryRow(entry){
 const id=encodeURIComponent(String(entry.id||''));
 return '<li class="comos-lore-title-row"><a href="lore-entry.html?id='+esc(id)+'">'+esc(entry.title||'Untitled entry')+'</a></li>';
}

export function renderLoreLibrary({entries=[],availableTags=[],selectedTags=[],query='',searchOpen=false,tagsOpen=false,tagState='ready',worldId='',partyId='',scope='all',sort='az',page=1,pageSize=40,preview=false,state='ready',serverFiltered=false,nextCursor=null,canPublish=false}={}){
  if(!['ready','loading','error','empty'].includes(state))throw new Error('Unknown lore state');
  if(!['ready','loading','error'].includes(tagState))throw new Error('Unknown tag state');
  const eligible=Array.isArray(availableTags)?availableTags.filter(t=>t&&typeof t.id==='string'&&typeof t.name==='string'):[];
  const allowed=new Set(eligible.map(tag=>tag.id));
  const selected=[...new Set(ids(selectedTags))].filter(id=>allowed.has(id));
  const result=serverFiltered?{entries,total:entries.length,page:1,pageCount:1}:browseLore(entries,{query,worldId,partyId,scope,sort,page,pageSize,selectedTags:selected,allowedTags:eligible});
  const noEntries=state==='empty'||(state==='ready'&&result.total===0);
  const statuses={loading:'Loading lore entries…',error:'Could not load lore. Please try again.',empty:'No lore entries to show.',ready:'No matching lore entries.'};
  const selectedCount=selected.length;
  return '<section class="comos-lore" aria-labelledby="comos-lore-title">'+
    '<div class="comos-lore-heading"><h1 id="comos-lore-title">Lore</h1>'+
      '<div class="comos-lore-icons" aria-label="Lore tools">'+
        '<button type="button" class="comos-lore-icon" data-lore-toggle="search" aria-label="Search lore" title="Search" aria-controls="comos-lore-search-panel" aria-expanded="'+searchOpen+'">'+searchIcon+'</button>'+
        '<button type="button" class="comos-lore-icon'+(selectedCount?' has-filters':'')+'" data-lore-toggle="tags" aria-label="Filter by character tags" title="Character tags" aria-controls="comos-lore-tags-panel" aria-expanded="'+tagsOpen+'">'+tagIcon+'</button>'+
      '</div></div>'+
    (preview?'<p class="comos-lore-preview" role="note">Preview only — sample results cannot grant access.</p>':'')+
    '<form class="comos-lore-search-panel" id="comos-lore-search-panel" data-lore-search '+(searchOpen?'':'hidden')+' role="search">'+
      '<label for="comos-lore-query" class="sr-only">Search lore titles and stories</label>'+
      '<input id="comos-lore-query" name="query" type="search" maxlength="120" placeholder="Search lore" value="'+esc(query)+'" autocomplete="off">'+
    '</form>'+
    '<div class="comos-lore-tags-panel" id="comos-lore-tags-panel" data-lore-tags '+(tagsOpen?'':'hidden')+'>'+
      '<fieldset><legend class="sr-only">Your characters’ tags</legend>'+
      (tagState==='loading'?'<p role="status">Loading your character tags…</p>':
       tagState==='error'?'<p role="status">Could not load character tags. Reopen the tag filter to retry.</p>':
       eligible.length?'<div class="comos-lore-tag-options">'+eligible.map(tag=>
        '<label class="comos-lore-tag-choice"><input type="checkbox" data-lore-tag value="'+esc(tag.id)+'" '+(selected.includes(tag.id)?'checked':'')+'><span>'+esc(tag.name)+'</span></label>'
       ).join('')+'</div>':
       '<p role="status">No tags are attached to your characters yet.</p>')+
      '<small>Only tags on your characters are available.</small></fieldset>'+
    '</div>'+
    '<div class="comos-lore-results" aria-live="polite" aria-busy="'+(state==='loading')+'">'+
      (state==='ready'&&result.total>0?
        '<ul class="comos-lore-title-list">'+result.entries.map(entryRow).join('')+'</ul>':
        '<div class="comos-lore-empty" role="status"><span aria-hidden="true">✧</span><p>'+esc(statuses[state])+'</p></div>')+
    '</div>'+
    (serverFiltered&&nextCursor?'<div class="comos-lore-more"><button class="button" type="button" data-lore-load-more>Load more</button></div>':'')+
    (!serverFiltered&&state==='ready'&&result.pageCount>1?
      '<nav class="comos-lore-pages" aria-label="Lore pages"><button type="button" data-lore-page="prev" '+(result.page<=1?'disabled':'' )+'>Previous</button><span>Page '+result.page+' of '+result.pageCount+'</span><button type="button" data-lore-page="next" '+(result.page>=result.pageCount?'disabled':'')+'>Next</button></nav>':'')+
    (canPublish?'<a class="fab" href="lore-compose.html" aria-label="Write lore">+</a>':'')+
  '</section>';
}
