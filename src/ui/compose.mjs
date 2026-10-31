import {recordId} from './record-id.mjs';
export function mountCompose({fixture=false}={}) {
  const root=document.querySelector('[data-compose]');
  if(!root)return ()=>{};
  const form=root.querySelector('[data-compose-form]');
  if(!form)return ()=>{};
  const title=form.querySelector('[name=title]'),input=form.querySelector('[name=text]');
  const status=root.querySelector('[data-compose-status]'),submit=root.querySelector('[data-compose-submit]');
  const count=root.querySelector('[data-compose-count]'),controller=new AbortController();
  let allowed=fixture,busy=false,closed=false,requestId=recordId();
  let attachments=[];
  const preview=root.querySelector('[data-attachments]');
  function showAttachments(){preview.replaceChildren();attachments.forEach((a,index)=>{const box=document.createElement('div'),image=document.createElement('img'),remove=document.createElement('button');image.src=a.url;image.alt='Attachment preview';remove.type='button';remove.textContent='Remove';remove.onclick=()=>{if(busy)return;URL.revokeObjectURL(a.url);attachments.splice(index,1);requestId=recordId();showAttachments();};box.append(image,remove);preview.append(box);});}
  for(const field of root.querySelectorAll('[data-post-images],[data-post-gif]'))field.addEventListener('change',()=>{for(const file of field.files){if(attachments.length>=4||file.size>6*1024*1024){message('Choose up to four images or GIFs, each under 6 MB.');break;}attachments.push({file,url:URL.createObjectURL(file)});}field.value='';requestId=recordId();showAttachments();},{signal:controller.signal});
  const picker=root.querySelector('[data-emoji-picker]');for(const emoji of ['😀','😂','❤️','✨','🌌','🔥','🎉','👍','👀','🎲','⚔️','🌟']){const button=document.createElement('button');button.type='button';button.textContent=emoji;button.onclick=()=>{input.setRangeText(emoji,input.selectionStart,input.selectionEnd,'end');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();};picker.append(button);}
  root.querySelector('[data-emoji]').onclick=()=>{picker.hidden=!picker.hidden;};
  const message=value=>{if(!closed)status.textContent=value;};
  function paint(){
    const textLength=[...input.value].length,titleLength=[...title.value].length;
    count.textContent=textLength+' / 2000';
    for(const control of form.querySelectorAll('input,textarea,button'))control.disabled=busy;
    submit.disabled=busy||!allowed||!input.value.trim()||textLength>2000||titleLength>140;
  }
  async function checkPermission(){
    message('Checking posting permission…');
    try{
      const res=await fetch('/api/v1/access',{credentials:'same-origin',cache:'no-store',signal:controller.signal});
      if(res.status===401){message('Sign in with your admin account to publish.');return;}
      if(!res.ok)throw new Error('Could not verify admin access. Refresh this page to retry.');
      const payload=await res.json();
      allowed=payload.admin===true;
      message(allowed?'Ready to publish to everyone on Cosmos.':'Only the Cosmos administrator can create posts. You can still reply to posts.');
    }catch(error){if(!controller.signal.aborted)message('Could not verify admin access. Refresh this page to retry.');}
    finally{paint();}
  }
  form.addEventListener('input',()=>{requestId=recordId();paint();},{signal:controller.signal});
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(busy)return;
    if(!allowed){message('Only your verified admin account can publish.');return;}
    const text=input.value.trim(),heading=title.value.trim();
    if(!text||[...text].length>2000||[...heading].length>140){message('Enter a description of 1–2000 characters and a title of at most 140 characters.');return;}
    busy=true;paint();message('Publishing post…');
    try{
      if(fixture){
        const {preview}=await import('../preview/runtime.mjs');
        preview.data.create('posts',{authorId:'fixture:profile:guest',authorName:'Preview admin',title:heading,text,media:attachments.map(a=>({url:a.url})),createdAt:new Date().toISOString()});
        root.querySelector('[data-compose-return]').click();
      }else{
        for(const a of attachments){if(a.id)continue;const uploaded=await fetch('/api/v1/home-media',{method:'POST',credentials:'same-origin',body:a.file,signal:controller.signal});const result=await uploaded.json();if(!uploaded.ok)throw Error(result.message||'Image upload failed.');a.id=result.id;}
        const res=await fetch('/api/v1/posts',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({title:heading,text,clientRequestId:requestId,mediaIds:attachments.map(a=>a.id)}),signal:controller.signal});
        const data=await res.json().catch(()=>({}));
        if(!res.ok){
          const known={401:'Sign in again to post.',403:'Only a verified admin account can publish posts.',409:'A different post already used this request. Try editing the text.',429:'Too many requests. Try again shortly.',503:'The server is temporarily unavailable. Try again.'};
          throw new Error(known[res.status]||data.message||'Could not publish. Please try again.');
        }
        if(!data.post?.id)throw new Error('The server did not confirm the saved post. Refresh Home before retrying.');
        message('Post published. Opening Home…');
        location.assign('home.html');
      }
    }catch(error){if(!controller.signal.aborted)message(error?.message||'Post failed. Please try again.');}
    finally{busy=false;paint();}
  },{signal:controller.signal});
  paint();
  if(fixture)message('Ghost preview: admin posting demonstration (not saved online).');
  else void checkPermission();
  return ()=>{closed=true;controller.abort();};
}
