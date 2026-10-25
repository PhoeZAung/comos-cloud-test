import {renderLoreLibrary} from '../features/lore/library.mjs';
// Only invented data. This is NOT the legacy lore library.
const entries=[
{id:'fixture:lore:1',title:'The Observatory',excerpt:'A quiet tower watches the stars above the silver coast.',worldId:'fixture:world:1',worldName:'World 01',updatedAt:'2026-10-24T10:00:00Z'},
{id:'fixture:lore:2',title:'Lantern Market',excerpt:'A floating marketplace where travelers exchange stories.',worldId:'fixture:world:1',worldName:'World 01',partyId:'fixture:party:a',partyName:'Party A',updatedAt:'2026-10-23T10:00:00Z'},
{id:'fixture:lore:3',title:'Notes from Mira',excerpt:'Field observations from the northern pass.',worldId:'fixture:world:1',worldName:'World 01',playerId:'fixture:profile:a',updatedAt:'2026-10-22T10:00:00Z'},
{id:'fixture:lore:4',title:'Ember Bridge',excerpt:'An ancient crossing above a river of fire.',worldId:'fixture:world:2',worldName:'World 02',updatedAt:'2026-10-21T10:00:00Z'},
{id:'fixture:lore:5',title:'A Quiet Harbor',excerpt:'The last safe port before the drifting islands.',worldId:'fixture:world:2',worldName:'World 02',partyId:'fixture:party:b',partyName:'Party B',updatedAt:'2026-10-20T10:00:00Z'},
{id:'fixture:lore:6',title:'A Map of Echoes',excerpt:'An annotated chart discovered beneath the old road.',worldId:'fixture:world:2',worldName:'World 02',updatedAt:'2026-10-19T10:00:00Z'},
{id:'fixture:lore:7',title:'The Sunken Archive',excerpt:'Records preserved in a library beneath the waves.',worldId:'fixture:world:3',worldName:'World 03',updatedAt:'2026-10-18T10:00:00Z'},
{id:'fixture:lore:8',title:'The Last Bell',excerpt:'A warning that rings only when no one is listening.',worldId:'fixture:world:3',worldName:'World 03',updatedAt:'2026-10-17T10:00:00Z'},
];
export function mountLorePreview(){
 const root=document.querySelector('[data-lore-library]');if(!root)return ()=>{};
 const controller=new AbortController();let options={query:'',worldId:'',partyId:'',scope:'all',sort:'newest',page:1},state='ready';
 function draw(){
   root.innerHTML=renderLoreLibrary({entries,preview:true,...options,state,pageSize:4});
   const container=root.querySelector('.comos-lore-heading');
   const label=document.createElement('label');label.className='comos-fixture-control';label.textContent='Test state ';
   const select=document.createElement('select');select.dataset.loreTestState='';select.setAttribute('aria-label','Lore test state');
   for(const name of ['ready','loading','empty','error']){const el=document.createElement('option');el.value=name;el.textContent=name==='ready'?'Sample lore':name[0].toUpperCase()+name.slice(1);select.append(el);}
   select.value=state;label.append(select);container?.append(label);
 }
 root.addEventListener('submit',event=>{if(!event.target.matches('[data-lore-search]'))return;event.preventDefault();const form=new FormData(event.target);options={query:String(form.get('query')||''),worldId:String(form.get('worldId')||''),partyId:String(form.get('partyId')||''),scope:String(form.get('scope')||'all'),sort:String(form.get('sort')||'newest'),page:1};draw();},{signal:controller.signal});
 root.addEventListener('change',event=>{
   if(event.target.matches('[data-lore-test-state]')){state=event.target.value;options.page=1;draw();return;}
   const field=event.target.name;if(!['worldId','partyId','scope','sort'].includes(field))return;
   if(field==='worldId'){options.worldId=event.target.value;options.partyId='';}else options[field]=event.target.value;
   options.query=String(root.querySelector('[name=query]')?.value||'');options.page=1;draw();
 },{signal:controller.signal});
 root.addEventListener('click',event=>{const button=event.target.closest('[data-lore-page]');if(!button)return;options.page+=button.dataset.lorePage==='next'?1:-1;draw();},{signal:controller.signal});
 draw();return ()=>controller.abort();
}