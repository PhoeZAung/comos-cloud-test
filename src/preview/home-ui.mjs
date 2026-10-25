import {renderHomeFeed} from '../features/home/feed.mjs';
import {preview} from './runtime.mjs';
// Ghost Home starts with no fictional posts and no backend access.
export function mountHomePreview() {
  const root=document.querySelector('[data-home-feed]');
  if(!root)return ()=>{};
  const controller=new AbortController();
  let offset=0;
  function render(){root.innerHTML=renderHomeFeed({posts:preview.data.list('posts'),preview:true,viewerId:'fixture:profile:guest',canPost:true,pageSize:10,offset});}
  root.addEventListener('click',event=>{
    const more=event.target.closest('[data-feed-more]');
    const del=event.target.closest('[data-delete-post]');
    if(more){offset+=10;render();}
    else if(del&&confirm('Delete this Ghost post?')){preview.data.remove('posts',del.dataset.deletePost);offset=0;render();}
  },{signal:controller.signal});
  render();return ()=>controller.abort();
}