import {renderHomeFeed} from '../features/home/feed.mjs';
// Synthetic examples, never real membership or user records.
const posts=[
  {id:'fixture:post:1',authorName:'Astra Vale',persona:'Campaign narrator',scopeLabel:'World 01',createdAt:'2026-10-24T20:40:00Z',text:'The lanterns are lit. Tonight we chart the northern sky together. ✨',replyCount:4},
  {id:'fixture:post:2',authorName:'Mira Quill',scopeLabel:'World 01 · Party A',createdAt:'2026-10-24T19:22:00Z',text:'Session notes are ready. What was your favorite moment?',replyCount:2},
  {id:'fixture:post:3',authorName:'Orion Reed',persona:'The Wanderer',scopeLabel:'World 02',createdAt:'2026-10-24T17:01:00Z',text:'Found a strange map tucked beneath a stone arch.',replyCount:1},
  {id:'fixture:post:4',authorName:'Astra Vale',scopeLabel:'World 01',createdAt:'2026-10-23T22:00:00Z',text:'Next session starts where the old observatory ends.',replyCount:7},
  {id:'fixture:post:5',authorName:'Mira Quill',scopeLabel:'World 01 · Party A',createdAt:'2026-10-23T15:00:00Z',text:'A sketch of the tavern sign is finally finished.',replyCount:0},
  {id:'fixture:post:6',authorName:'Orion Reed',scopeLabel:'World 02',createdAt:'2026-10-22T12:00:00Z',text:'Did anyone else hear the bells after sunset?',replyCount:3},
  {id:'fixture:post:7',authorName:'Astra Vale',scopeLabel:'World 01',createdAt:'2026-10-21T20:00:00Z',text:'Welcome to the sample feed!',replyCount:0},
];

export function mountHomePreview(){
  const root=document.querySelector('[data-home-feed]');
  if(!root)return ()=>{};
  const controller=new AbortController();
  let state='ready',offset=0;
  function render(){
    root.innerHTML=renderHomeFeed({posts,preview:true,state,offset,pageSize:4});
    const label=document.createElement('label');label.className='comos-fixture-control';label.textContent='Test state ';
    const selector=document.createElement('select');selector.setAttribute('aria-label','Feed test state');selector.dataset.feedTestState='';
    for(const name of ['ready','loading','empty','error']){const option=document.createElement('option');option.value=name;option.textContent=name==='ready'?'Sample posts':name[0].toUpperCase()+name.slice(1);selector.append(option);}
    selector.value=state;label.append(selector);root.querySelector('.comos-feed-heading')?.append(label);
  }
  root.addEventListener('change',event=>{if(event.target.matches('[data-feed-test-state]')){state=event.target.value;offset=0;render();}},{signal:controller.signal});
  root.addEventListener('click',event=>{const button=event.target.closest('[data-feed-page]');if(!button)return;offset=Math.max(0,offset+(button.dataset.feedPage==='next'?4:-4));render();},{signal:controller.signal});
  render();return ()=>controller.abort();
}