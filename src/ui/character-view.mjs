const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function valueMarkup(value){
 if(value===null)return '';
 if(Array.isArray(value))return value.map((item,i)=>typeof item==='object'&&item?`<details><summary>${esc(item.name||item.title||item.itemName||'Entry '+(i+1))}</summary>${valueMarkup(item)}</details>`:`<p>${esc(item)}</p>`).join('')||'None';
 if(typeof value==='object')return '<dl>'+Object.entries(value).filter(([k])=>!k.startsWith('__')).map(([k,v])=>`<div><dt>${esc(k.replaceAll('_',' '))}</dt><dd>${valueMarkup(v)}</dd></div>`).join('')+'</dl>';
 return esc(value);
}
export function mountCharacterView(){
 const id=new URL(location.href).searchParams.get('characterId');if(!id)return ()=>{};
 const root=document.querySelector('main'),control=new AbortController();let closed=false,character;
 const page=document.body.dataset.page,editing=page.startsWith('create-');
 async function request(body){const r=await fetch('/api/v1/character-records/'+encodeURIComponent(id),{signal:control.signal,credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const d=await r.json();if(!r.ok)throw Error(d.message||'Character unavailable. Sign in with its owner or an admin account.');return d.character;}
 function link(route){return route+'.html?characterId='+encodeURIComponent(id);}
 function draw(){
  const data=character.data;
  if(editing){
   const steps=['create-source','create-identity','create-race','create-class'],index=steps.indexOf(page),title=['Sources','Identity','Race','Class & level'][index];
   const fields=index===1?[['charName','Name',character.name]]:index===2?[['race','Race',data.race||'']]:index===3?[['class','Class',data.class||data.className||''],['level','Level',String(data.level||data.character_level||1)]]:[];
   root.innerHTML=`<a class="back" href="admin.html">← Characters</a><h1>${title}</h1><form data-edit-character>${index===3?'<p class="field-help">Saved stats stay unchanged when class or level changes.</p>':''}${fields.map(([key,label,value])=>`<label for="edit-${key}">${label}</label><input id="edit-${key}" name="${key}" value="${esc(value)}" required maxlength="${key==='charName'?80:120}">`).join('')||'<p>Saved source selections and sheet data are retained.</p>'}<p role="status"></p><div class="wizard-actions"><a class="button" href="${index?link(steps[index-1]):'admin.html'}">Back</a><button class="button primary" type="submit">${index===3?'Save':'Next'}</button></div></form>`;
   root.querySelector('form').addEventListener('submit',async event=>{event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;try{const fields=Object.fromEntries(new FormData(event.target));if(Object.keys(fields).length)character=await request({op:'edit',revision:character.revision,fields});if(!closed)location.assign(index===3?link('sheet'):link(steps[index+1]));}catch(e){if(!closed)root.querySelector('[role=status]').textContent=e.message;button.disabled=false;}},{signal:control.signal});
  }else{
   const section=page==='sheet-inventory'?['items','weapons','gil','currency_gil']:page==='sheet-abilities'?['spells','activeAbilities','passiveAbilities','racialAbilities','feats','skills']:['race','class','className','level','character_level','str','dex','con','int','wis','cha','hp_curr','hp_max','mp_curr','mp_max','ac_total','bab','speed','alignment'];
   for(const a of document.querySelectorAll('nav[aria-label="Character sheet"] a')){const url=new URL(a.href);url.searchParams.set('characterId',id);a.href=url.href;}
   root.innerHTML=`<a class="back" href="admin.html">← Characters</a><nav class="tabs" aria-label="Character sheet">${[['sheet','Overview'],['sheet-inventory','Inventory'],['sheet-abilities','Abilities']].map(([route,label])=>`<a href="${link(route)}" ${page===route?'aria-current="page"':''}>${label}</a>`).join('')}</nav><h1>${esc(character.name)}</h1><section class="saved-sheet"><dl>${section.filter(k=>data[k]!==undefined).map(k=>`<div><dt>${esc(k.replaceAll('_',' '))}</dt><dd>${valueMarkup(data[k])}</dd></div>`).join('')||'<p>No saved values in this section.</p>'}</dl></section>`;
  }
 }
 root.innerHTML='<p role="status">Loading character…</p>';request().then(c=>{if(!closed){character=c;draw();}}).catch(e=>{if(!closed)root.innerHTML='<p role="status">'+esc(e.message)+'</p><a class="back" href="characters.html">← Characters</a>';});return ()=>{closed=true;control.abort();};
}
