import {renderHomeFeed} from '../features/home/feed.mjs';
import {sessionUser} from './session.mjs';

export function mountFeed() {
  const root=document.querySelector('[data-home-feed]');
  if(!root)return ()=>{};
  const controller=new AbortController();
  let closed=false,busy=false,posts=[],cursor=null,signedOut=false,viewerId='';
  const render=(state='ready')=>{if(!closed)root.innerHTML=renderHomeFeed({posts,state,viewerId:viewerId||sessionUser?.id||'',nextCursor:cursor,signedOut});};
  async function load({more=false}={}) {
    if(busy||closed)return;
    busy=true;if(!more)render('loading');
    try {
      const response=await fetch('/api/v1/feed'+(more&&cursor?'?cursor='+encodeURIComponent(cursor):''),{credentials:'same-origin',cache:'no-store',signal:controller.signal});
      if(response.status===401){signedOut=true;posts=[];cursor=null;render();return;}
      if(!response.ok)throw Error('Posts could not be loaded.');
      const payload=await response.json();
      if(!Array.isArray(payload.posts)||!([null,'string'].includes(payload.nextCursor===null?null:typeof payload.nextCursor)))throw Error('Invalid feed response.');
      posts=more?[...posts,...payload.posts]:payload.posts;
      cursor=payload.nextCursor||null;viewerId=typeof payload.viewerId==='string'?payload.viewerId:'';signedOut=false;render();
    }catch(error){if(!closed&&!controller.signal.aborted){if(more){const status=document.createElement('p');status.role='status';status.textContent='Could not load more posts. Please retry.';root.append(status);}else render('error');}}
    finally{busy=false;}
  }
  root.addEventListener('click',async event=>{
    if(event.target.closest('[data-feed-more]')){void load({more:true});return;}
    const button=event.target.closest('[data-delete-post]');
    if(!button||busy)return;
    const id=button.dataset.deletePost;
    if(!confirm('Delete your post?'))return;
    busy=true;button.disabled=true;
    try{
      const response=await fetch('/api/v1/posts/'+encodeURIComponent(id),{method:'DELETE',credentials:'same-origin',headers:{Accept:'application/json'},signal:controller.signal});
      if(!response.ok)throw Error('Could not delete this post.');
      posts=posts.filter(post=>post.id!==id);render();
    }catch(error){if(!closed&&!controller.signal.aborted){button.disabled=false;alert('Could not delete your post. Try again.');}}
    finally{busy=false;}
  },{signal:controller.signal});
  void load();
  return ()=>{closed=true;controller.abort();};
}