import {renderHomeFeed} from '../features/home/feed.mjs';
import {preview} from './runtime.mjs';
// Ghost Home starts EMPTY. It shows only posts a tester actually submits in Ghost composer.
export function mountHomePreview() {
  const root=document.querySelector('[data-home-feed]');
  if(!root)return ()=>{};
  const controller=new AbortController();
  let offset=0;
  function render(){
    const posts=preview.data.list('posts');
    root.innerHTML=renderHomeFeed({posts,preview:true,viewerId:'fixture:profile:guest',pageSize:10,offset});
  }
  root.addEventListener('click',event=>{
    const more=event.target.closest('[data-feed-more]');
    const del=event.target.closest('[data-delete-post]');
    if(more){offset+=10;render();}
    else if(del&&confirm('Delete this Ghost post?')){preview.data.remove('posts',del.dataset.deletePost);offset=0;render();}
  },{signal:controller.signal});
  render();return ()=>controller.abort();
}