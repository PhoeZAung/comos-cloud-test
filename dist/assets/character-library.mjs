import {renderCharacterRoster} from '../features/characters/roster.mjs';
import {createCharacterDemo} from '../features/characters/cards.mjs';
export function mountCharacterLibrary({fixture=false}={}){
  const root=document.querySelector('[data-character-cards]');if(!root)return ()=>{};
  const control=new AbortController();
  let closed=false,loading=false,characters=[],selected=0,view='carousel',nextCursor=null,message='',error='',suppressCardClickUntil=0;
  const readError=async response=>{try{const data=await response.json();return data.message||({401:'Sign in to access your characters.',403:'Character access denied.'})[response.status]||'Could not complete this action.';}catch{return 'Could not complete this action.';}};
  const draw=()=>{
    if(closed)return;
    root.innerHTML=renderCharacterRoster({characters,selected,view,loading,error,message,nextCursor,preview:fixture});
    const stage=root.querySelector('[data-character-stage]');
    if(stage)stage.dataset.characterStage='ready';
  };
  function turn(delta){
    if(characters.length<2)return;
    selected=(selected+delta+characters.length)%characters.length;
    const count=characters.length;
    for(const element of root.querySelectorAll('[data-card-index]')){
      const index=Number(element.dataset.cardIndex),forward=(index-selected+count)%count,backward=(selected-index+count)%count;
      const position=index===selected?'is-current':backward===1?'is-prev':forward===1?'is-next':'is-offstage';
      element.classList.remove('is-current','is-prev','is-next','is-offstage');
      element.classList.add(position);
      element.toggleAttribute('inert',position==='is-offstage');
      if(position==='is-offstage')element.setAttribute('aria-hidden','true');else element.removeAttribute('aria-hidden');
      const button=element.querySelector('[data-select-character]');
      if(button){if(position==='is-current')button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');}
    }
    const position=root.querySelector('[data-active-position]');if(position)position.textContent=(selected+1)+' / '+count;
  }
  async function load({more=false}={}){
    if(loading||closed)return;
    loading=true;error='';if(!more)message='';if(!more)draw();
    try{
      const url='/api/v1/my/characters'+(more&&nextCursor?'?cursor='+encodeURIComponent(nextCursor):'');
      const res=await fetch(url,{credentials:'same-origin',cache:'no-store',signal:control.signal});
      if(!res.ok)throw Error(await readError(res));
      const data=await res.json();
      if(!Array.isArray(data.characters))throw Error('Invalid character response.');
      characters=more?[...characters,...data.characters]:data.characters;
      nextCursor=typeof data.nextCursor==='string'?data.nextCursor:null;
      selected=Math.min(selected,Math.max(0,characters.length-1));
    }catch(e){if(!closed&&!control.signal.aborted)error=e.message;}
    finally{loading=false;draw();}
  }
  if(fixture){
    const demo=createCharacterDemo();
    characters=demo.snapshot().items.map(c=>({...c,tags:['Demo'],portraitUrl:null}));
    message='Sample preview only.';
    draw();
  }else void load();
  root.addEventListener('click',event=>{
    const toggle=event.target.closest('[data-character-view]');
    if(toggle){view=toggle.dataset.characterView==='list'?'list':'carousel';draw();root.querySelector('[data-character-view]')?.focus();return;}
    const rotation=event.target.closest('[data-rotate-character]');
    if(rotation){turn(Number(rotation.dataset.rotateCharacter));return;}
    const card=event.target.closest('[data-select-character]');
    if(card){if(Date.now()<suppressCardClickUntil)return;const wanted=Number(card.dataset.selectCharacter);if(Number.isInteger(wanted)&&wanted>=0&&wanted<characters.length)turn(wanted-selected);return;}
    if(event.target.closest('[data-load-characters]')){void load({more:true});return;}
  },{signal:control.signal});
  root.addEventListener('keydown',event=>{
    if(!event.target.closest('[data-character-stage]'))return;
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();turn(event.key==='ArrowRight'?1:-1);}
  },{signal:control.signal});
  let start=null;
  root.addEventListener('pointerdown',event=>{
    if(!event.target.closest('[data-character-stage]')||event.target.closest('a'))return;
    start={x:event.clientX,y:event.clientY,id:event.pointerId};
  },{signal:control.signal});
  root.addEventListener('pointerup',event=>{
    if(!start||event.pointerId!==start.id)return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;
    if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.3){suppressCardClickUntil=Date.now()+300;turn(dx<0?1:-1);}
  },{signal:control.signal});
  root.addEventListener('pointercancel',()=>{start=null;},{signal:control.signal});
  return ()=>{closed=true;control.abort();};
}
