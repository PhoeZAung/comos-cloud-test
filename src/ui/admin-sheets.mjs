const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountAdminSheets(){
 const root=document.querySelector('[data-admin-sheets]'),controller=new AbortController();
 const params=new URL(location.href).searchParams,party=params.get('partyTagId'),owner=params.get('ownerId');
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
   if(controller.signal.aborted)return;
   root.innerHTML='<p role="status">'+rows.size+' sheets</p><div class="admin-sheet-grid">'+[...rows.values()].map(row=>{
    const url='sheet.html?'+new URLSearchParams({characterId:row.id,compact:'1'});
    return '<section class="admin-sheet-card"><h2><a href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(row.name)+'</a></h2><iframe src="'+esc(url)+'" title="'+esc(row.name)+' character sheet" loading="eager"></iframe></section>';
   }).join('')+'</div>';
  }catch(error){if(!controller.signal.aborted){root.replaceChildren();const status=document.createElement('p');status.role='status';status.textContent=error.message;root.append(status);}}
 }
 void load();return ()=>{controller.abort();root.querySelectorAll('iframe').forEach(frame=>frame.remove());};
}
