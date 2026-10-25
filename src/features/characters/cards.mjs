// Ghost-only interaction model; it never connects to APIs or persistent storage.
export const PAGE_SIZE=6;
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const seed=Array.from({length:15},(_,i)=>({id:`fixture:character:${i+1}`,name:['Star Wanderer','Moon Keeper','Aether Knight','Cloud Dancer','Rune Seeker'][i%5]+` ${i+1}`,level:1+(i%12),race:['Hume','Moogle','Viera'][i%3],className:['Warrior','Black Mage','White Mage'][i%3]}));
export function createCharacterDemo(rows=seed){
  if(!Array.isArray(rows))throw new TypeError('Characters must be an array');
  let items=rows.map(row=>({...row})),page=1,status='ready',feedback='';let copyId=0;
  const snapshot=()=>{const count=items.length,pages=Math.max(1,Math.ceil(count/PAGE_SIZE));page=Math.min(page,pages);return {items:status==='ready'?items.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE).map(x=>({...x})):[],count,page,pages,status,feedback};};
  return {snapshot,
    state(next){if(!['ready','loading','empty','error'].includes(next))throw Error('Unknown demo state');status=next;page=1;feedback='';},
    page(next){const pages=Math.max(1,Math.ceil(items.length/PAGE_SIZE));if(Number.isInteger(next)&&next>=1&&next<=pages){page=next;return true;}return false;},
    find(id){const value=items.find(x=>x.id===id);return value?{...value}:null;},
    rename(id,name){const value=String(name??'').trim();if(!value||value.length>80)return false;const item=items.find(x=>x.id===id);if(!item)return false;item.name=value;feedback='Sample renamed in memory. Nothing was saved.';return true;},
    duplicate(id){const item=items.find(x=>x.id===id);if(!item)return false;const clone={...item,id:`fixture:character:copy-${++copyId}`,name:`${item.name} (copy)`};items.unshift(clone);page=1;status='ready';feedback='Temporary sample copy created with a new ID.';return clone.id;},
    remove(id){const length=items.length;items=items.filter(x=>x.id!==id);if(length===items.length)return false;feedback='Sample removed in memory only.';return true;},
  };
}
export function renderCharacterDemo(data){
  const {items,status,page,pages,count,feedback}=data;
  const cards=items.map(c=>`<article class="cosmos-character"><a class="cosmos-portrait" href="sheet.html?character=${encodeURIComponent(c.id)}" aria-label="Open sample sheet for ${esc(c.name)}"><span aria-hidden="true">${esc(c.name.split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase())}</span><small>↗</small></a><div class="cosmos-character-info"><span class="eyebrow">SAMPLE CHARACTER</span><h3>${esc(c.name)}</h3><p>Level ${Number.isInteger(c.level)?c.level:'—'} · ${esc(c.race)} · ${esc(c.className)}</p><div class="cosmos-character-actions"><button type="button" data-edit="${esc(c.id)}">Edit</button><button type="button" data-copy="${esc(c.id)}">Copy</button><button type="button" data-delete="${esc(c.id)}">Delete</button></div></div></article>`).join('');
  const empty=status==='loading'?'Loading sample characters…':status==='error'?'Simulated load error. No account data was affected.':status==='empty'?'No sample characters in this state.':'No sample characters.';
  return `<div class="cosmos-character-demo"><p class="cosmos-fixture-label" role="note">STEP 7.1–7.3 · Ghost preview only. Sample characters, names and actions reset on refresh; these are not saved records.</p><div class="cosmos-demo-toolbar"><h2>Character cards <small>${status==='ready'?count:'—'}</small></h2><label>Test state <select data-character-scenario>${[['ready','Sample cards'],['loading','Loading'],['empty','Empty'],['error','Error']].map(([v,label])=>`<option value="${v}"${v===status?' selected':''}>${label}</option>`).join('')}</select></label></div><p class="cosmos-character-feedback" role="status">${esc(feedback||'7.2 · Portrait, Edit, Copy and Delete demo')}</p>${status==='ready'&&cards?`<div class="cosmos-character-grid">${cards}</div>`:`<div class="cosmos-empty" role="status">${empty}</div>`}${status==='ready'&&count?`<nav class="cosmos-pagination" aria-label="Character pages"><button type="button" data-character-page="${page-1}"${page<=1?' disabled':''}>Previous</button><span>Page ${page} / ${pages}</span><button type="button" data-character-page="${page+1}"${page>=pages?' disabled':''}>Next</button></nav>`:''}</div>`;
}