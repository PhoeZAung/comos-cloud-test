export function mountCompose({fixture=false}={}) {
  const root=document.querySelector('[data-compose]');
  if(!root)return ()=>{};
  const form=root.querySelector('[data-compose-form]');
  if(!form)return ()=>{};
  const title=form.querySelector('[name=title]'),input=form.querySelector('[name=text]');
  const status=root.querySelector('[data-compose-status]'),submit=root.querySelector('[data-compose-submit]');
  const count=root.querySelector('[data-compose-count]'),controller=new AbortController();
  let allowed=fixture,busy=false,closed=false,requestId=crypto.randomUUID();
  const message=value=>{if(!closed)status.textContent=value;};
  function paint(){
    const textLength=[...input.value].length,titleLength=[...title.value].length;
    count.textContent=textLength+' / 2000';
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
      message(allowed?'Ready to publish to everyone on Comos.':'Only the Comos administrator can create posts. You can still reply to posts.');
    }catch(error){if(!controller.signal.aborted)message('Could not verify admin access. Refresh this page to retry.');}
    finally{paint();}
  }
  form.addEventListener('input',()=>{requestId=crypto.randomUUID();paint();},{signal:controller.signal});
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
        preview.data.create('posts',{authorId:'fixture:profile:guest',authorName:'Preview admin',title:heading,text,createdAt:new Date().toISOString()});
        root.querySelector('[data-compose-return]').click();
      }else{
        const res=await fetch('/api/v1/posts',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({title:heading,text,clientRequestId:requestId}),signal:controller.signal});
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