// Recheck authorization when queued work runs, including grant/role changes.
export function adminMenu(OBR,allowed,item,onError=()=>{}){
 let queue=Promise.resolve(),visible=false;
 return ()=>{queue=queue.then(async()=>{const next=allowed()===true;if(next===visible)return;if(next)await OBR.contextMenu.create(item);else await OBR.contextMenu.remove(item.id);visible=next;}).catch(onError);return queue;};
}
