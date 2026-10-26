import {recordId} from './record-id.mjs';

const validImage=file=>file&&['image/jpeg','image/png','image/webp'].includes(file.type)&&file.size>0&&file.size<=5*1024*1024;
export function mountLoreCompose({fixture=false}={}){
 const root=document.querySelector('[data-lore-compose]');if(!root)return ()=>{};
 const form=root.querySelector('[data-lore-compose-form]'),title=form.querySelector('[name=title]');
 const blocksRoot=root.querySelector('[data-lore-blocks]'),filesInput=root.querySelector('[data-lore-image-files]');
 const chips=root.querySelector('[data-lore-selected-tags]'),dialog=root.querySelector('[data-lore-compose-tag-dialog]');
 const options=root.querySelector('[data-lore-tag-options]'),tagCount=root.querySelector('[data-lore-tag-count]');
 const status=root.querySelector('[data-lore-compose-status]'),counter=root.querySelector('[data-lore-count]'),submit=root.querySelector('[data-lore-publish]');
 const controller=new AbortController(),images=new Map();
 const editId=new URLSearchParams(location.search).get('id');
 const isEdit=editId!==null;
 let expectedUpdatedAt='',tags=[],selected=[],ready=false,busy=false,closed=false,requestId=recordId();
 if(isEdit){
   root.querySelector('h1').textContent='Edit Lore';
   submit.textContent='Save Changes';
 }
 const message=msg=>{if(!closed)status.textContent=msg;};
 const button=(text,name,label)=>{
   const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset[name]='';b.setAttribute('aria-label',label);b.title=label;return b;
 };
 const touch=()=>{requestId=recordId();paint();};
 function blockControls(kind){
   const wrapper=document.createElement('div');wrapper.className='comos-lore-edit-block';wrapper.dataset.loreKind=kind;wrapper.dataset.loreBlockId=recordId();
   const header=document.createElement('div');header.className='comos-lore-block-heading';
   const label=document.createElement('span');label.className='comos-lore-block-label';label.textContent=kind==='text'?'Paragraph':'Picture';
   const actions=document.createElement('div');actions.className='comos-lore-block-actions';
   actions.append(button('↑','loreMoveUp','Move up'),button('↓','loreMoveDown','Move down'),button('×','loreRemoveBlock','Remove block'));
   header.append(label,actions);wrapper.append(header);return wrapper;
 }
 function addParagraph(){
   const wrapper=blockControls('text'),textarea=document.createElement('textarea');
   textarea.dataset.loreParagraph='';textarea.rows=5;textarea.maxLength=10000;
   textarea.placeholder='Write a paragraph…';textarea.setAttribute('aria-label','Lore paragraph');
   wrapper.append(textarea);blocksRoot.append(wrapper);touch();textarea.focus();return wrapper;
 }
 function addStoredImage(block){
   const safe=/^\/api\/v1\/lore-images\/[a-f0-9-]{36}$/i;
   if(!block||!safe.test(block.url)||!block.mediaId)return;
   const wrapper=blockControls('image'),id=wrapper.dataset.loreBlockId;
   const image=document.createElement('img');image.src=block.url;image.alt='Existing Lore picture';image.className='comos-lore-image-preview';
   const alt=document.createElement('input');alt.type='text';alt.maxLength=140;alt.placeholder='Image description (optional)';alt.dataset.loreImageAlt='';
   alt.value=typeof block.alt==='string'?block.alt:'';
   alt.setAttribute('aria-label','Image description for accessibility');
   wrapper.append(image,alt);blocksRoot.append(wrapper);
   images.set(id,{file:null,url:null,mediaId:block.mediaId});
 }
 function addImage(file){
   const wrapper=blockControls('image'),id=wrapper.dataset.loreBlockId,url=URL.createObjectURL(file);
   const image=document.createElement('img');image.src=url;image.alt='Selected image preview';image.className='comos-lore-image-preview';
   const alt=document.createElement('input');alt.type='text';alt.maxLength=140;alt.placeholder='Image description (optional)';alt.dataset.loreImageAlt='';
   alt.setAttribute('aria-label','Image description for accessibility');
   wrapper.append(image,alt);blocksRoot.append(wrapper);images.set(id,{file,url,mediaId:null});
   touch();return wrapper;
 }
 function paintOrder(){
   const nodes=[...blocksRoot.children];
   nodes.forEach((block,index)=>{
     block.querySelector('[data-lore-move-up]').disabled=busy||index===0;
     block.querySelector('[data-lore-move-down]').disabled=busy||index===nodes.length-1;
     block.querySelector('[data-lore-remove-block]').disabled=busy;
     const label=block.querySelector('.comos-lore-block-label');
     label.textContent=block.dataset.loreKind==='text'?'Paragraph '+(nodes.slice(0,index+1).filter(node=>node.dataset.loreKind==='text').length):'Picture';
   });
 }
 function paintTags(){
   chips.replaceChildren();options.replaceChildren();
   for(const tag of tags){
     const label=document.createElement('label');label.className='comos-lore-tag-choice';
     const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.dataset.loreComposerTag='';checkbox.value=tag.id;checkbox.checked=selected.includes(tag.id);checkbox.disabled=busy;
     const span=document.createElement('span');span.textContent=tag.name;
     label.append(checkbox,span);options.append(label);
     if(checkbox.checked){
       const chip=document.createElement('span');chip.className='comos-lore-selected-tag';
       const name=document.createElement('span');name.textContent=tag.name;
       const remove=button('×','removeLoreTag','Remove tag '+tag.name);remove.dataset.removeLoreTag=tag.id;remove.disabled=busy;
       chip.append(name,remove);chips.append(chip);
     }
   }
   if(!tags.length){
     const p=document.createElement('p');p.role='status';p.textContent=ready?'No tags assigned to your characters yet.':'Loading your character tags…';options.append(p);
   }
   tagCount.textContent=String(selected.length);tagCount.hidden=selected.length===0;
   root.querySelector('[data-lore-open-tags]').disabled=busy;
 }
 function textBlocks(){
   return [...blocksRoot.children].filter(node=>node.dataset.loreKind==='text').map(node=>node.querySelector('textarea').value.trim()).filter(Boolean);
 }
 function paint(){
   if(closed)return;
   const paragraphs=textBlocks(),length=[...paragraphs.join('\n\n')].length;
   counter.textContent=length+' / 10000';
   submit.disabled=!ready||busy||![...title.value.trim()].length||[...title.value.trim()].length>140||!length||length>10000;
   title.disabled=busy;filesInput.disabled=busy;
   root.querySelector('[data-add-lore-paragraph]').disabled=busy;
   for(const node of blocksRoot.querySelectorAll('textarea,input'))node.disabled=busy;
   paintOrder();paintTags();
 }
 async function check(){
   if(fixture){message('Preview only. Sign in to save Lore.');paint();return;}
   message(isEdit?'Loading Lore to edit…':'Checking character tags…');
   try{
     if(isEdit){
       if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(editId))throw Error('Invalid Lore entry.');
       const res=await fetch('/api/v1/lore/'+encodeURIComponent(editId),{credentials:'same-origin',cache:'no-store',signal:controller.signal});
       if(res.status===401)throw Error('Sign in to edit Lore.');
       if(res.status===403)throw Error('You cannot edit this Lore.');
       if(res.status===404)throw Error('Lore not found.');
       if(!res.ok)throw Error('Could not load this Lore.');
       const data=await res.json();
       if(!data.entry||data.canEdit!==true)throw Error('You do not have permission to edit this Lore.');
       const entry=data.entry;
       expectedUpdatedAt=entry.updatedAt;
       title.value=entry.title||'';
       tags=Array.isArray(data.availableEditTags)?data.availableEditTags.filter(t=>t&&typeof t.id==='string'&&typeof t.name==='string'):[];
       selected=(Array.isArray(entry.tags)?entry.tags:[]).map(t=>t.id).filter(id=>tags.some(t=>t.id===id));
       blocksRoot.replaceChildren();
       for(const block of Array.isArray(entry.blocks)?entry.blocks:[{type:'text',text:entry.text||''}]){
         if(block.type==='text'){
           const wrapper=addParagraph();
           wrapper.querySelector('textarea').value=typeof block.text==='string'?block.text:'';
         }else if(block.type==='image')addStoredImage(block);
       }
       if(!blocksRoot.children.length)addParagraph();
       ready=true;message('Ready to save your changes.');
     }else{
       const res=await fetch('/api/v1/my/lore-tags',{credentials:'same-origin',cache:'no-store',signal:controller.signal});
       if(res.status===401){message('Sign in to publish Lore.');return;}
       if(!res.ok)throw Error('Could not load your character tags. Refresh to retry.');
       const data=await res.json();if(!Array.isArray(data.tags))throw Error('Invalid tag response.');
       tags=data.tags.filter(t=>t&&typeof t.id==='string'&&typeof t.name==='string');
       ready=true;message('Ready to publish.');
     }
   }catch(error){if(!controller.signal.aborted)message(error.message||'Could not load character tags.');}
   finally{paint();}
 }
 root.addEventListener('click',event=>{
   if(event.target.closest('[data-lore-open-tags]')){dialog.showModal();return;}
   if(event.target.closest('[data-lore-tags-close]')){dialog.close();return;}
   if(event.target===dialog){dialog.close();return;}
   if(busy)return;
   if(event.target.closest('[data-add-lore-paragraph]')){addParagraph();return;}
   const removeTag=event.target.closest('[data-remove-lore-tag]');
   if(removeTag){selected=selected.filter(id=>id!==removeTag.dataset.removeLoreTag);touch();return;}
   const block=event.target.closest('[data-lore-block-id]');if(!block)return;
   if(event.target.closest('[data-lore-move-up]')){const prev=block.previousElementSibling;if(prev)blocksRoot.insertBefore(block,prev);touch();}
   else if(event.target.closest('[data-lore-move-down]')){const next=block.nextElementSibling;if(next)blocksRoot.insertBefore(next,block);touch();}
   else if(event.target.closest('[data-lore-remove-block]')){
     const key=block.dataset.loreBlockId,picture=images.get(key);if(picture){if(picture.url)URL.revokeObjectURL(picture.url);images.delete(key);}
     block.remove();touch();
   }
 },{signal:controller.signal});
 dialog.addEventListener('close',()=>root.querySelector('[data-lore-open-tags]')?.focus(),{signal:controller.signal});
 root.addEventListener('change',event=>{
   const box=event.target.closest('[data-lore-composer-tag]');if(box){
     if(busy||!tags.some(t=>t.id===box.value))return;
     selected=box.checked?[...new Set([...selected,box.value])].slice(0,20):selected.filter(id=>id!==box.value);
     touch();return;
   }
   if(event.target===filesInput){
     if(busy)return;
     for(const file of Array.from(filesInput.files||[])){
       if(images.size>=12){message('Up to 12 pictures per Lore entry.');break;}
       if(!validImage(file)){message('Choose JPEG, PNG or WebP images under 5 MB.');continue;}
       addImage(file);
     }
     filesInput.value='';
   }
 },{signal:controller.signal});
 form.addEventListener('input',event=>{
   if(event.target===title||event.target.closest('[data-lore-blocks]'))touch();
 },{signal:controller.signal});
 async function upload(image,index,total){
   if(image.mediaId)return image.mediaId;
   message('Uploading picture '+index+' of '+total+'…');
   const res=await fetch('/api/v1/lore-images',{
     method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':image.file.type},
     body:image.file,signal:controller.signal
   });
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(data.message||'Picture upload failed. Try again.');
   if(typeof data.id!=='string')throw Error('Picture upload was not confirmed.');
   image.mediaId=data.id;return image.mediaId;
 }
 form.addEventListener('submit',async event=>{
   event.preventDefault();if(busy||!ready)return;
   const heading=title.value.trim(),text=textBlocks().join('\n\n'),len=[...text].length;
   if(!heading||[...heading].length>140||!text||len>10000){message('Enter a title up to 140 characters and up to 10,000 characters of Lore text.');return;}
   if(![...blocksRoot.children].some(node=>node.dataset.loreKind==='text'&&node.querySelector('textarea').value.trim())){message('Add at least one paragraph.');return;}
   busy=true;paint();message('Preparing Lore…');
   try{
     const blocks=[],pictureCount=images.size;let uploaded=0;
     for(const node of blocksRoot.children){
       if(node.dataset.loreKind==='text'){
         const paragraph=node.querySelector('textarea').value.trim();if(paragraph)blocks.push({type:'text',text:paragraph});
       }else{
         const image=images.get(node.dataset.loreBlockId);
         if(!image)throw Error('A picture could not be found.');
         const mediaId=await upload(image,++uploaded,pictureCount);
         blocks.push({type:'image',mediaId,alt:node.querySelector('[data-lore-image-alt]').value.trim()});
       }
     }
     if(blocks.length>40)throw Error('Use no more than 40 paragraphs and pictures.');
     message(isEdit?'Saving changes…':'Publishing Lore…');
     const res=await fetch(isEdit?'/api/v1/lore/'+encodeURIComponent(editId):'/api/v1/lore',{
       method:isEdit?'PUT':'POST',credentials:'same-origin',cache:'no-store',
       headers:{'Content-Type':'application/json',Accept:'application/json'},
       body:JSON.stringify({title:heading,text,blocks,tagIds:selected,...(isEdit?{expectedUpdatedAt}:{clientRequestId:requestId})}),
       signal:controller.signal
     });
     const data=await res.json().catch(()=>({}));
     if(!res.ok)throw Error(data.message||(res.status===409?'This Lore was edited elsewhere. Reload before saving.':isEdit?'Changes could not be saved.':'Lore could not be published.'));
     if(!data.entry?.id)throw Error('The server did not confirm your Lore. Check the Lore list before retrying.');
     message(isEdit?'Changes saved. Returning to Lore…':'Published. Returning to Lore…');location.assign('lore.html');
   }catch(error){if(!controller.signal.aborted)message(error.message||'Lore could not be published.');}
   finally{busy=false;paint();}
 },{signal:controller.signal});
 addParagraph();paint();void check();
 return ()=>{closed=true;controller.abort();for(const image of images.values())if(image.url)URL.revokeObjectURL(image.url);};
}
