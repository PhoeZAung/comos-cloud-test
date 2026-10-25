export function mountCompose({fixture=false}={}) {
  const root=document.querySelector('[data-compose]');if(!root)return ()=>{};
  const form=root.querySelector('[data-compose-form]'),input=form.querySelector('[name=text]');
  const status=root.querySelector('[data-compose-status]'),submit=root.querySelector('[data-compose-submit]');
  const scopes=root.querySelector('[data-compose-scopes]'),world=form.querySelector('[name=worldId]'),party=form.querySelector('[name=partyId]');
  const count=root.querySelector('[data-compose-count]'),controller=new AbortController();
  world.required=!fixture;
  let available={worlds:[],parties:[]},busy=false,ready=fixture,requestId=crypto.randomUUID();
  const paint=()=>{const n=Array.from(input.value).length;count.textContent=n+' / 2000';submit.disabled=busy||!ready||!input.value.trim()||n>2000;};
  const message=value=>status.textContent=value;
  function fill(select,rows,empty){select.replaceChildren();const first=document.createElement('option');first.value='';first.textContent=empty;select.append(first);for(const row of rows){const option=document.createElement('option');option.value=row.id;option.textContent=row.name;select.append(option);}}
  function refreshParties(){fill(party,available.parties.filter(row=>row.worldId===world.value),'All members of this world');}
  async function loadScopes(){
    try{
      const res=await fetch('/api/v1/feed/scopes',{credentials:'same-origin',cache:'no-store',signal:controller.signal});
      if(res.status===401){message('Sign in to write a post.');return;}
      if(!res.ok)throw Error('Could not load your worlds.');
      available=await res.json();if(!Array.isArray(available.worlds)||!Array.isArray(available.parties))throw Error('Invalid scope response.');
      if(!available.worlds.length){message('You need membership in a world before posting. Ask a Comos admin for access.');return;}
      fill(world,available.worlds,'Choose a world');if(available.worlds.length===1)world.value=available.worlds[0].id;
      refreshParties();scopes.hidden=false;ready=true;paint();
    }catch(error){if(!controller.signal.aborted)message('Could not load worlds. Refresh and try again.');}
  }
  input.addEventListener('input',()=>{requestId=crypto.randomUUID();paint();},{signal:controller.signal});
  world.addEventListener('change',refreshParties,{signal:controller.signal});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy||!ready||!input.value.trim())return;
    busy=true;paint();message('Posting…');
    try{
      if(fixture){
        const {preview}=await import('../preview/runtime.mjs');
        preview.data.create('posts',{authorId:'fixture:profile:guest',authorName:'Preview explorer',text:input.value.trim(),createdAt:new Date().toISOString()});
      }else{
        const res=await fetch('/api/v1/posts',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:input.value,worldId:world.value,partyId:party.value||null,clientRequestId:requestId}),signal:controller.signal});
        if(!res.ok){const data=await res.json().catch(()=>({}));throw Error(({401:'Sign in again to post.',403:'Complete your profile and confirm world access before posting.',409:'This post was already submitted differently.',429:'Too many posts. Try again shortly.'})[res.status]||data.message||'Could not publish post.');}
      }
      // A normal navigation reloads authenticated Home. Ghost uses SPA navigation to retain isolated memory.
      if(fixture)root.querySelector('[data-compose-return]').click();else location.assign('home.html');
    }catch(error){if(!controller.signal.aborted)message(error.message);}
    finally{busy=false;paint();}
  },{signal:controller.signal});
  paint();if(!fixture)void loadScopes();
  return ()=>controller.abort();
}