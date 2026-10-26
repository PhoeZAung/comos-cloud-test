const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function renderLoreEntry(entry){
 if(!entry)return '<p role="status">Lore entry not found.</p>';
 const labels=Array.isArray(entry.tags)?entry.tags.filter(t=>t&&typeof t.name==='string').map(t=>'<span>'+esc(t.name)+'</span>').join(''):'';
 const date=entry.createdAt&&Number.isFinite(Date.parse(entry.createdAt))?new Date(entry.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}):'';
 return '<article class="comos-lore-reader"><h1>'+esc(entry.title)+'</h1>'+
   '<p class="comos-lore-byline">'+(entry.authorName?esc(entry.authorName):'Comos member')+(date?' · '+esc(date):'')+'</p>'+
   (labels?'<div class="comos-lore-reader-tags">'+labels+'</div>':'')+
   '<div class="comos-lore-reader-body">'+esc(entry.text||'')+'</div></article>';
}
export function mountLoreEntry({fixture=false}={}){
 const root=document.querySelector('[data-lore-entry]');if(!root)return ()=>{};
 const control=new AbortController();let closed=false;
 const id=new URL(location.href).searchParams.get('id');
 if(fixture){root.innerHTML='<p role="status">Preview only. Sign in to read published Lore.</p>';return ()=>control.abort();}
 if(!id||!(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))){
   root.innerHTML='<p role="status">Choose a Lore entry from the title list.</p>';return ()=>control.abort();
 }
 root.innerHTML='<p role="status">Loading Lore…</p>';
 void (async()=>{
  try{
   const res=await fetch('/api/v1/lore/'+encodeURIComponent(id),{credentials:'same-origin',cache:'no-store',signal:control.signal});
   if(!res.ok)throw Error(res.status===401?'Sign in to read Lore.':res.status===404?'Lore entry not found.':'Could not load Lore.');
   const data=await res.json();
   if(!data.entry)throw Error('Invalid Lore response.');
   if(!closed)root.innerHTML=renderLoreEntry(data.entry);
  }catch(error){if(!closed&&!control.signal.aborted){const p=document.createElement('p');p.role='status';p.textContent=error.message;root.replaceChildren(p);}}
 })();
 return ()=>{closed=true;control.abort();};
}
