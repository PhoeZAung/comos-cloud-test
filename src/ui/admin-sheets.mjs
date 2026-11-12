const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function mountAdminSheets(){
 const root=document.querySelector('[data-admin-sheets]'),controller=new AbortController();
 const params=new URL(location.href).searchParams,party=params.get('partyTagId'),owner=params.get('ownerId');
 let selected=null;
 const offsets=new Map();
 function select(id){
  const tabs=[...root.querySelectorAll('[data-admin-sheet-tab]')];
  const current=tabs.find(tab=>tab.dataset.adminSheetTab===id);
  if(!current)return;
  if(selected&&selected!==id){
   const prev=[...root.querySelectorAll('[data-admin-sheet-panel]')].find(panel=>panel.dataset.adminSheetPanel===selected);
   try{const y=prev?.querySelector('iframe')?.contentWindow?.scrollY;if(Number.isFinite(y)&&(y>0||!offsets.has(selected)))offsets.set(selected,y);}catch{}
  }
  selected=id;
  for(const button of tabs){
   const active=button===current;
   button.setAttribute('aria-selected',String(active));
   button.tabIndex=active?0:-1;
  }
  for(const panel of root.querySelectorAll('[data-admin-sheet-panel]')){
   const active=panel.dataset.adminSheetPanel===id;
   panel.hidden=!active;
   if(active){
    let frame=panel.querySelector('iframe');
    if(!frame){
     frame=document.createElement('iframe');
     frame.title=panel.dataset.sheetName+' character sheet';
     frame.src='sheet.html?'+new URLSearchParams({characterId:id,compact:'1'});
     frame.loading='eager';
     panel.append(frame);
     frame.addEventListener('load',()=>{
      try{frame.contentWindow?.addEventListener('scroll',()=>{
       if(selected===id&&Number.isFinite(frame.contentWindow.scrollY))offsets.set(id,frame.contentWindow.scrollY);
      },{passive:true});}catch{}
     });
    }else requestAnimationFrame(()=>requestAnimationFrame(()=>{
     if(selected===id)try{frame.contentWindow?.scrollTo(0,offsets.get(id)||0);}catch{}
    }));
   }
  }
 }
 function render(rows){
  const ordered=[...rows.values()];
  if(!ordered.length){root.innerHTML='<p role="status">No character sheets in this group.</p>';return;}
  root.innerHTML='<p role="status">'+ordered.length+' sheets</p>'+
   '<nav class="admin-sheet-tabs" role="tablist" aria-label="Group character sheets">'+
   ordered.map((row,index)=>'<button type="button" role="tab" data-admin-sheet-tab="'+esc(row.id)+'" id="admin-sheet-tab-'+index+'" aria-controls="admin-sheet-panel-'+index+'" aria-selected="false" tabindex="-1" title="'+esc(row.name)+'">'+esc(row.name)+'</button>').join('')+'</nav>'+
   '<div class="admin-sheet-panels">'+ordered.map((row,index)=>'<section class="admin-sheet-panel" role="tabpanel" data-admin-sheet-panel="'+esc(row.id)+'" data-sheet-name="'+esc(row.name)+'" id="admin-sheet-panel-'+index+'" aria-labelledby="admin-sheet-tab-'+index+'" hidden><div class="admin-sheet-panel-header"><strong>'+esc(row.name)+'</strong><a class="button" href="sheet.html?'+esc(new URLSearchParams({characterId:row.id,compact:'1'}))+'" target="_blank" rel="noopener">Open in new window</a></div></section>').join('')+'</div>';
  select(ordered[0].id);
 }
 async function load(){
  try{
   if(!party&&!owner)throw Error('Choose a party or player from Admin first.');
   const rows=new Map(),seen=new Set();let cursor='';
   do{
    const query=new URLSearchParams(party?{groupBy:'party',partyTagId:party,cursor}:{ownerId:owner,cursor});
    const response=await fetch('/api/v1/admin/directory?'+query,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
    const result=await response.json();if(!response.ok)throw Error(result.message||(response.status===403?'Administrator access required.':'Could not load group sheets.'));
    for(const row of result.characters||[])rows.set(row.id,row);
    cursor=result.nextCursor||'';if(cursor&&seen.has(cursor))throw Error('Could not load the remaining sheets.');seen.add(cursor);
   }while(cursor);
   if(!controller.signal.aborted)render(rows);
  }catch(error){if(!controller.signal.aborted){root.replaceChildren();const status=document.createElement('p');status.role='status';status.textContent=error.message;root.append(status);}}
 }
 root.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-admin-sheet-tab]');
  if(button)select(button.dataset.adminSheetTab);
 },{signal:controller.signal});
 root.addEventListener('keydown',event=>{
  const button=event.target.closest?.('[data-admin-sheet-tab]');
  if(!button||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const tabs=[...root.querySelectorAll('[data-admin-sheet-tab]')],index=tabs.indexOf(button);
  const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
  select(tabs[next].dataset.adminSheetTab);tabs[next].focus();
 },{signal:controller.signal});
 void load();
 return ()=>{controller.abort();root.querySelectorAll('iframe').forEach(frame=>frame.remove());};
}
