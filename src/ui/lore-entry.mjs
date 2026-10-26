const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function renderLoreEntry(entry,{canDelete=false}={}){
 if(!entry)return '<p role="status">Lore entry not found.</p>';
 const labels=Array.isArray(entry.tags)?entry.tags.filter(t=>t&&typeof t.name==='string').map(t=>'<span>'+esc(t.name)+'</span>').join(''):'';
 const date=entry.createdAt&&Number.isFinite(Date.parse(entry.createdAt))?new Date(entry.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}):'';
 const blocks=Array.isArray(entry.blocks)&&entry.blocks.length?entry.blocks:[{type:'text',text:entry.text||''}];
 const mediaPattern=/^\/api\/v1\/lore-images\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const content=blocks.map(block=>{
  if(block?.type==='text'&&typeof block.text==='string')return '<p class="comos-lore-paragraph">'+esc(block.text)+'</p>';
  if(block?.type==='image'&&typeof block.url==='string'&&mediaPattern.test(block.url)){
   const alt=typeof block.alt==='string'?block.alt:'';
   return '<figure class="comos-lore-inline-image"><img loading="lazy" decoding="async" src="'+esc(block.url)+'" alt="'+esc(alt)+'"></figure>';
  }
  return '';
 }).join('');
 return '<article class="comos-lore-reader"><h1>'+esc(entry.title)+'</h1>'+
   '<p class="comos-lore-byline">'+(entry.authorName?esc(entry.authorName):'Comos member')+(date?' · '+esc(date):'')+'</p>'+
   (labels?'<div class="comos-lore-reader-tags">'+labels+'</div>':'')+
   '<div class="comos-lore-reader-body">'+content+'</div>'+ 
   (canDelete&&typeof entry.id==='string'&&/^[0-9a-f-]{36}$/i.test(entry.id)?'<div class="comos-lore-admin-actions"><button type="button" class="comos-lore-delete" data-delete-lore="'+esc(entry.id)+'">Delete Lore</button></div>':'')+'</article>';
}
export function mountLoreEntry({fixture=false}={}){
 const root=document.querySelector('[data-lore-entry]');if(!root)return ()=>{};
 const control=new AbortController();let closed=false;
 const id=new URL(location.href).searchParams.get('id');
 if(fixture){root.innerHTML='<p role="status">Preview only. Sign in to read published Lore.</p>';return ()=>control.abort();}
 if(!id||!(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))){
   root.innerHTML='<p role="status">Choose a Lore entry from the title list.</p>';return ()=>control.abort();
 }
 root.addEventListener('click',async event=>{
  const button=event.target.closest('[data-delete-lore]');
  if(!button||button.disabled||!confirm('Delete this Lore permanently?'))return;
  button.disabled=true;
  try{
   const res=await fetch('/api/v1/lore/'+encodeURIComponent(button.dataset.deleteLore),{
    method:'DELETE',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'},signal:control.signal
   });
   if(!res.ok)throw Error(res.status===403?'Only admins can delete Lore.':res.status===404?'This Lore is already gone.':'Could not delete Lore.');
   location.assign('lore.html');
  }catch(error){
   if(!closed&&!control.signal.aborted){
    const notice=document.createElement('p');notice.role='status';notice.className='comos-lore-delete-status';notice.textContent=error.message;
    button.after(notice);button.disabled=false;
   }
  }
 },{signal:control.signal});
 root.innerHTML='<p role="status">Loading Lore…</p>';
 void (async()=>{
  try{
   const res=await fetch('/api/v1/lore/'+encodeURIComponent(id),{credentials:'same-origin',cache:'no-store',signal:control.signal});
   if(!res.ok)throw Error(res.status===401?'Sign in to read Lore.':res.status===404?'Lore entry not found.':'Could not load Lore.');
   const data=await res.json();
   if(!data.entry)throw Error('Invalid Lore response.');
   if(!closed)root.innerHTML=renderLoreEntry(data.entry,{canDelete:data.canDelete===true});
  }catch(error){if(!closed&&!control.signal.aborted){const p=document.createElement('p');p.role='status';p.textContent=error.message;root.replaceChildren(p);}}
 })();
 return ()=>{closed=true;control.abort();};
}
