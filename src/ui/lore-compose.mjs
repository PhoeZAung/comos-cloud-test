import {recordId} from './record-id.mjs';

export function mountLoreCompose({fixture=false}={}){
 const root=document.querySelector('[data-lore-compose]');if(!root)return ()=>{};
 const form=root.querySelector('[data-lore-compose-form]');
 const title=form.querySelector('[name=title]'),body=form.querySelector('[name=text]');
 const picker=root.querySelector('[data-lore-tag-select]'),add=root.querySelector('[data-lore-tag-add]'),chips=root.querySelector('[data-lore-selected-tags]');
 const hint=root.querySelector('[data-lore-tag-hint]'),status=root.querySelector('[data-lore-compose-status]');
 const counter=root.querySelector('[data-lore-count]'),submit=root.querySelector('[data-lore-publish]');
 const controller=new AbortController();
 let tags=[],selected=[],ready=false,busy=false,closed=false,requestId=recordId();
 const message=msg=>{if(!closed)status.textContent=msg;};
 const option=(value,label)=>{const node=document.createElement('option');node.value=value;node.textContent=label;return node;};
 function paintTags(){
   if(closed)return;
   chips.replaceChildren();
   for(const id of selected){
     const tag=tags.find(t=>t.id===id);if(!tag)continue;
     const chip=document.createElement('span');chip.className='comos-lore-selected-tag';
     const label=document.createElement('span');label.textContent=tag.name;
     const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.title='Remove '+tag.name;
     remove.setAttribute('aria-label','Remove tag '+tag.name);remove.dataset.removeLoreTag=id;remove.disabled=busy;
     chip.append(label,remove);chips.append(chip);
   }
   picker.replaceChildren(option('','Add a character tag…'));
   const available=tags.filter(t=>!selected.includes(t.id));
   for(const tag of available)picker.append(option(tag.id,tag.name));
   picker.disabled=!ready||busy||available.length===0;
   add.disabled=!ready||busy||!picker.value;
   hint.textContent=ready?(tags.length?'Only tags from your characters can be added.':'No tags assigned to your characters. You can publish without tags.'):'Checking available character tags…';
 }
 function paint(){
   const len=[...body.value].length;counter.textContent=len+' / 10000';
   for(const control of form.querySelectorAll('input,textarea'))control.disabled=busy;
   submit.disabled=!ready||busy||!title.value.trim()||[...title.value.trim()].length>140||!body.value.trim()||len>10000;
   paintTags();
 }
 async function check(){
   if(fixture){message('Preview only. Sign in to publish Lore.');paint();return;}
   message('Checking character tags…');
   try{
     const result=await fetch('/api/v1/my/lore-tags',{credentials:'same-origin',cache:'no-store',signal:controller.signal});
     if(result.status===401){message('Sign in to create Lore.');return;}
     if(!result.ok)throw Error('Could not load your character tags. Refresh to retry.');
     const payload=await result.json();
     if(!Array.isArray(payload.tags))throw Error('Invalid tag response.');
     tags=payload.tags.filter(t=>t&&typeof t.id==='string'&&typeof t.name==='string');
     ready=true;message('Ready to publish.');
   }catch(error){if(!controller.signal.aborted)message(error.message||'Could not load character tags.');}
   finally{paint();}
 }
 picker.addEventListener('change',()=>{add.disabled=!ready||busy||!picker.value;},{signal:controller.signal});
 root.addEventListener('click',event=>{
   if(event.target.closest('[data-lore-tag-add]')){
     const id=picker.value;
     if(!ready||busy||selected.length>=20||!tags.some(t=>t.id===id)||selected.includes(id))return;
     selected.push(id);requestId=recordId();paint();return;
   }
   const remove=event.target.closest('[data-remove-lore-tag]');
   if(remove&&!busy){selected=selected.filter(id=>id!==remove.dataset.removeLoreTag);requestId=recordId();paint();}
 },{signal:controller.signal});
 form.addEventListener('input',event=>{
   if(event.target===title||event.target===body){requestId=recordId();paint();}
 },{signal:controller.signal});
 form.addEventListener('submit',async event=>{
   event.preventDefault();if(busy||!ready)return;
   const heading=title.value.trim(),text=body.value.trim();
   if(!heading||[...heading].length>140||!text||[...text].length>10000){message('Enter a title (1–140 characters) and description (1–10000 characters).');return;}
   busy=true;paint();message('Publishing Lore…');
   try{
     const response=await fetch('/api/v1/lore',{
       method:'POST',credentials:'same-origin',cache:'no-store',
       headers:{'Content-Type':'application/json',Accept:'application/json'},
       body:JSON.stringify({title:heading,text,tagIds:selected,clientRequestId:requestId}),
       signal:controller.signal
     });
     const payload=await response.json().catch(()=>({}));
     if(!response.ok){
       const known={401:'Sign in again to publish Lore.',403:'One or more selected tags are no longer available on your characters.',409:'This publishing request was already used. Refresh the page.',429:'Please wait before trying again.',503:'Lore is temporarily unavailable.'};
       throw Error(payload.message||known[response.status]||'Lore could not be published.');
     }
     if(!payload.entry?.id)throw Error('The server did not confirm saving your Lore. Check the Lore list before retrying.');
     message('Lore published. Returning to the title list…');
     location.assign('lore.html');
   }catch(error){if(!controller.signal.aborted)message(error.message||'Lore could not be published.');}
   finally{busy=false;paint();}
 },{signal:controller.signal});
 paint();void check();
 return ()=>{closed=true;controller.abort();};
}
