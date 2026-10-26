import {renderPostThread,renderThreadUnavailable} from '../features/home/thread.mjs';
import {refreshPostTimes} from '../features/home/time.mjs';

export function mountPostThread({fixture=false}={}) {
  const root=document.querySelector('[data-post-thread]');
  if(!root)return ()=>{};
  const controller=new AbortController();
  const postId=new URLSearchParams(location.search).get('id');
  let post=null,replies=[],cursor=null,previewOffset=0,viewerId='',busy=false,closed=false,replyTarget=null,collapsedIds=new Set(),requestId=crypto.randomUUID();
  const path=()=>'/api/v1/posts/'+encodeURIComponent(postId);
  const count=()=>{const input=root.querySelector('[name=text]'),counter=root.querySelector('[data-reply-count]'),button=root.querySelector('[data-reply-submit]');
    if(!input)return;const size=[...input.value].length;counter.textContent=size+' / 2000';button.disabled=busy||!input.value.trim()||size>2000;};
  function paint(){if(closed||!post)return;root.innerHTML=renderPostThread({post,replies,nextCursor:cursor,more:fixture&&cursor!==null,viewerId,replyTarget,collapsedIds:[...collapsedIds]});count();}
  function notice(message){const el=root.querySelector('[data-reply-status]');if(el)el.textContent=message;else if(!closed)root.innerHTML=renderThreadUnavailable(message);}
  async function getJson(url,options={}){
    const res=await fetch(url,{credentials:'same-origin',cache:'no-store',signal:controller.signal,...options});
    if(res.status===401)throw Error('Sign in to read this post.');
    if(res.status===404)throw Error('Post not available.');
    if(!res.ok)throw Error('Could not load this post. Try again.');
    return res.json();
  }
  function fixtureReplies(){
    const all=currentPreview().data.list('replies').filter(x=>x.postId===postId)
      .sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))||b.id.localeCompare(a.id));
    replies=all.slice(0,previewOffset+20);
    cursor=replies.length<all.length?'fixture:more':null;
  }
  let fixtureContext;
  function currentPreview(){return fixtureContext;}
  async function load(){
    if(!postId){root.innerHTML=renderThreadUnavailable();return;}
    try{
      if(fixture){
        const {preview}=await import('../preview/runtime.mjs');fixtureContext=preview;
        post=preview.data.get('posts',postId);if(!post){root.innerHTML=renderThreadUnavailable();return;}
        viewerId='fixture:profile:guest';fixtureReplies();paint();
      }else{
        const data=await getJson(path());
        if(!data.post||!data.post.id)throw Error('Could not load this post.');
        post=data.post;viewerId=data.viewerId||'';
        const thread=await getJson(path()+'/replies');
        replies=thread.replies;cursor=thread.nextCursor||null;
        if(!Array.isArray(replies))throw Error('Could not load replies.');
        paint();
      }
    }catch(error){if(!closed&&!controller.signal.aborted)root.innerHTML=renderThreadUnavailable(error.message);}
  }
  root.addEventListener('input',event=>{if(event.target.matches('[name=text]')){requestId=crypto.randomUUID();count();}},{signal:controller.signal});
  root.addEventListener('submit',async event=>{
    const form=event.target.closest('[data-reply-form]');if(!form)return;
    event.preventDefault();if(busy||!post)return;
    const input=form.querySelector('[name=text]');const text=input.value.trim();if(!text||[...text].length>2000)return;
    busy=true;count();notice('Publishing reply…');
    try{
      if(fixture){currentPreview().data.create('replies',{postId,authorId:viewerId,authorName:'Preview explorer',text,parentReplyId:replyTarget?.id||null,createdAt:new Date().toISOString()});
        previewOffset=0;fixtureReplies();}
      else{
        const res=await fetch(path()+'/replies',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,clientRequestId:requestId,...(replyTarget?{parentReplyId:replyTarget.id}:{})}),signal:controller.signal});
        if(!res.ok){const message=({400:'That reply target is no longer available.',401:'Sign in to reply.',403:'You no longer have access to reply.',404:'This post is no longer available.',429:'Too many replies. Try again later.'})[res.status]||'Could not publish reply.';throw Error(message);}
        const data=await getJson(path()+'/replies');replies=data.replies;cursor=data.nextCursor||null;
      }
      requestId=crypto.randomUUID();replyTarget=null;collapsedIds.clear();busy=false;paint();notice('Reply posted.');
    }catch(error){if(!closed&&!controller.signal.aborted)notice(error.message);}
    finally{busy=false;count();}
  },{signal:controller.signal});
  root.addEventListener('click',async event=>{
    const toggle=event.target.closest('[data-collapse-thread]');
    if(toggle){
      const id=toggle.dataset.collapseThread;
      if(collapsedIds.has(id))collapsedIds.delete(id);else collapsedIds.add(id);
      // Toggle the subtree without repainting the text editor or losing a draft reply.
      const branch=root.querySelectorAll('[data-reply-branch]');
      const row=[...branch].find(el=>el.dataset.replyBranch===id);
      const subtree=[...row?.children||[]].find(el=>el.classList.contains('comos-reply-children'));
      if(subtree)subtree.hidden=collapsedIds.has(id);
      toggle.setAttribute('aria-expanded',String(!collapsedIds.has(id)));
      const count=toggle.textContent.replace(/^.*?(\d+\s+repl(?:y|ies))$/,'$1');
      toggle.textContent=(collapsedIds.has(id)?'＋ Show ':'− Hide ')+count;
      toggle.setAttribute('aria-label',(collapsedIds.has(id)?'Expand':'Collapse')+' replies');
      return;
    }
    const next=event.target.closest('[data-more-replies]'),del=event.target.closest('[data-reply-delete]');
    const to=event.target.closest('[data-reply-to]'),cancel=event.target.closest('[data-cancel-reply]');
    if(cancel){replyTarget=null;requestId=crypto.randomUUID();paint();root.querySelector('[name=text]')?.focus();return;}
    if(to){const target=replies.find(reply=>reply.id===to.dataset.replyTo);if(target){replyTarget={id:target.id,authorName:target.authorName};requestId=crypto.randomUUID();paint();root.querySelector('[name=text]')?.focus();root.querySelector('[data-reply-form]')?.scrollIntoView({behavior:'smooth',block:'center'});}return;}
    if(next&&!busy){busy=true;next.disabled=true;
      try{if(fixture){previewOffset+=20;fixtureReplies();}else if(cursor){const page=await getJson(path()+'/replies?cursor='+encodeURIComponent(cursor));
        {const seen=new Map(replies.map(reply=>[reply.id,reply]));for(const reply of page.replies)seen.set(reply.id,reply);replies=[...seen.values()];}cursor=page.nextCursor||null;}paint();}
      catch{notice('Could not load more replies.');next.disabled=false;}finally{busy=false;count();}
    }
    if(del&&!busy&&confirm('Delete your reply?')){busy=true;del.disabled=true;
      try{if(fixture)currentPreview().data.remove('replies',del.dataset.replyDelete);
        else {const res=await fetch('/api/v1/replies/'+encodeURIComponent(del.dataset.replyDelete),{method:'DELETE',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'},signal:controller.signal});if(!res.ok)throw Error();}
        replies=replies.filter(reply=>reply.id!==del.dataset.replyDelete);paint();}
      catch{notice('Could not delete reply.');del.disabled=false;}finally{busy=false;count();}
    }
  },{signal:controller.signal});
  const clock=setInterval(()=>{if(!closed)refreshPostTimes(root);},60000);
  void load();return ()=>{closed=true;clearInterval(clock);controller.abort();};
}