import {createCharacterDemo,renderCharacterDemo} from '../features/characters/cards.mjs';
export function mountCharacterPreview(){
  const root=document.querySelector('[data-character-cards]');
  if(!root)return ()=>{};
  const demo=createCharacterDemo(),controller=new AbortController();
  const draw=()=>{root.innerHTML=renderCharacterDemo(demo.snapshot());};
  root.addEventListener('change',event=>{
    if(event.target.matches('[data-character-scenario]')){demo.state(event.target.value);draw();}
  },{signal:controller.signal});
  root.addEventListener('click',event=>{
    const btn=event.target.closest('button');if(!btn)return;
    if(btn.hasAttribute('data-character-page')){if(demo.page(Number(btn.dataset.characterPage)))draw();return;}
    if(btn.hasAttribute('data-copy')){if(demo.duplicate(btn.dataset.copy))draw();return;}
    if(btn.hasAttribute('data-edit')){const item=demo.find(btn.dataset.edit);if(!item)return;const name=window.prompt('Rename temporary sample:',item.name);if(name!==null&&demo.rename(item.id,name))draw();return;}
    if(btn.hasAttribute('data-delete')){const item=demo.find(btn.dataset.delete);if(item&&window.confirm(`Remove temporary sample "${item.name}"?`)){demo.remove(item.id);draw();}}
  },{signal:controller.signal});
  draw();return ()=>controller.abort();
}