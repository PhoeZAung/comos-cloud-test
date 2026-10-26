import {renderHomeFeed} from '../features/home/feed.mjs';
import {refreshPostTimes} from '../features/home/time.mjs';
import {sessionUser} from './session.mjs';

export function mountFeed() {
  const root=document.querySelector('[data-home-feed]');
  if(!root)return ()=>{};
  const controller=new AbortController();
  let closed=false,busy=false,posts=[],pinnedPosts=[],cursor=null,signedOut=false,viewerId='',canPost=false;
  const render=(state='ready')=>{if(!closed)root.innerHTML=renderHomeFeed({posts,pinnedPosts,state,viewerId:viewerId||sessionUser?.id||'',nextCursor:cursor,signedOut,canPost});};
  async function load({more=false,ignoreBusy=false}={}) {
    if((busy&&!ignoreBusy)||closed)return;
    busy=true;if(!more)render('loading');
    try {
      const response=await fetch('/api/v1/feed'+(more&&cursor?'?cursor='+encodeURIComponent(cursor):''),{credentials:'same-origin',cache:'no-store',signal:controller.signal});
      if(response.status===401){signedOut=true;posts=[];pinnedPosts=[];cursor=null;canPost=false;render();return;}
      if(!response.ok)throw Error('Posts could not be loaded.');
      const payload=await response.json();
      if(!Array.isArray(payload.posts)||!([null,'string'].includes(payload.nextCursor===null?null:typeof payload.nextCursor)))throw Error('Invalid feed response.');
      posts=more?[...posts,...payload.posts]:payload.posts;
      if(!more){pinnedPosts=Array.isArray(payload.pinnedPosts)?payload.pinnedPosts:[];}
      cursor=payload.nextCursor||null;viewerId=typeof payload.viewerId==='string'?payload.viewerId:'';canPost=payload.canPost===true;signedOut=false;render();
    }catch(error){if(!closed&&!controller.signal.aborted){if(more){const status=document.createElement('p');status.role='status';status.textContent='Could not load more posts. Please retry.';root.append(status);}else render('error');}}
    finally{busy=false;}
  }
  root.addEventListener('click',async event=>{
    if(event.target.closest('[data-feed-more]')){void load({more:true});return;}
    const pin=event.target.closest('[data-pin-post]');
    if(pin&&!busy){
      const id=pin.dataset.pinPost,pinned=pin.dataset.pinState==='pin';
      busy=true;pin.disabled=true;
      try{
        const res=await fetch('/api/v1/posts/'+encodeURIComponent(id)+'/pin',{
          method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({pinned}),signal:controller.signal
        });
        const data=await res.json().catch(()=>({}));
        if(!res.ok)throw Error(data.message||'Could not change pin status.');
        await load({more:false,ignoreBusy:true});
      }catch(error){if(!closed&&!controller.signal.aborted){pin.disabled=false;alert(error.message);}}
      finally{busy=false;}
      return;
    }
    const button=event.target.closest('[data-delete-post]');
    if(!button||busy)return;
    const id=button.dataset.deletePost;
    if(!confirm('Delete your post?'))return;
    busy=true;button.disabled=true;
    try{
      const response=await fetch('/api/v1/posts/'+encodeURIComponent(id),{method:'DELETE',credentials:'same-origin',headers:{Accept:'application/json'},signal:controller.signal});
      if(!response.ok)throw Error('Could not delete this post.');
      posts=posts.filter(post=>post.id!==id);pinnedPosts=pinnedPosts.filter(post=>post.id!==id);render();
    }catch(error){if(!closed&&!controller.signal.aborted){button.disabled=false;alert('Could not delete your post. Try again.');}}
    finally{busy=false;}
  },{signal:controller.signal});
  const clock=setInterval(()=>{if(!closed)refreshPostTimes(root);},60000);
  void load();
  return ()=>{closed=true;clearInterval(clock);controller.abort();};
}