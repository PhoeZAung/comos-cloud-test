import {SOURCE_NAME,ALIGNMENTS,CLASS_NAMES,RACE_NAMES,ARCHETYPES,RACE_TRAITS,defaultTraits,characterClasses,totalClassLevel} from '../features/characters/ffd20.mjs';

const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const choices=(names,selected='',placeholder='Select…')=>'<option value="">'+esc(placeholder)+'</option>'+[...new Set([...names,...(selected&&!names.includes(selected)?[selected]:[])])].map(name=>'<option value="'+esc(name)+'"'+(name===selected?' selected':'')+'>'+esc(name)+'</option>').join('');
const portraitOK=value=>typeof value==='string'&&value.length<=160000&&/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value);
const noPortrait='<svg viewBox="0 0 100 120" aria-hidden="true" fill="none"><circle cx="50" cy="33" r="21" fill="currentColor" opacity=".7"/><path d="M11 114v-10c0-25 17-42 39-42s39 17 39 42v10" fill="currentColor" opacity=".6"/></svg>';
function valueMarkup(value){
 if(value===null)return '';
 if(Array.isArray(value))return value.map((item,i)=>typeof item==='object'&&item?`<details><summary>${esc(item.name||item.title||item.itemName||'Entry '+(i+1))}</summary>${valueMarkup(item)}</details>`:`<p>${esc(item)}</p>`).join('')||'None';
 if(typeof value==='object')return '<dl>'+Object.entries(value).filter(([k])=>!k.startsWith('__')).map(([k,v])=>`<div><dt>${esc(k.replaceAll('_',' '))}</dt><dd>${valueMarkup(v)}</dd></div>`).join('')+'</dl>';
 return esc(value);
}
const route=(name,id)=>name+'.html'+(id?'?characterId='+encodeURIComponent(id):'');
const useTraitList=(data,key)=>{
 const existing=data[key];
 return Array.isArray(existing)?existing.filter(x=>x&&typeof x.name==='string').map(x=>({name:x.name,enabled:x.enabled!==false})):null;
};
const traitToggle=(kind,entry,index)=>`<label class="cw-trait-row"><input type="checkbox" data-trait-kind="${kind}" data-trait-index="${index}" ${entry.enabled?'checked':''}><span>${esc(entry.name)}</span></label>`;
export function renderRace(data,state){
 const race=state.race||'';
 const standards=state.standard,alternates=state.alternate;
 const available=(RACE_TRAITS[race]?.alternate||[]).filter(name=>!alternates.some(x=>x.name===name));
 return `<section class="cw-step"><h1>Race</h1><form data-edit-character data-step="race">
  <label class="cw-field"><span>Race</span><select name="race" data-race-select required>${choices(RACE_NAMES,race,'Choose a race')}</select></label>
  <section class="cw-trait-section"><div class="cw-section-heading"><h2>Standard racial traits</h2><span>Enabled by default</span></div>
  ${standards.length?'<div class="cw-traits">'+standards.map((t,i)=>traitToggle('standard',t,i)).join('')+'</div>':'<p class="field-help">Traits for this race are not yet indexed. Add them from your FFD20 rules.</p>'}
  <div class="cw-add-trait"><label class="sr-only" for="cw-standard-new">Standard trait name</label><input id="cw-standard-new" data-standard-new maxlength="80" placeholder="Standard trait name"><button class="button" type="button" data-add-trait="standard">+ Add</button></div></section>
  <section class="cw-trait-section"><div class="cw-section-heading"><h2>Alternate racial traits</h2><span>Off when added</span></div>
  ${alternates.length?'<div class="cw-traits">'+alternates.map((t,i)=>traitToggle('alternate',t,i)).join('')+'</div>':'<p class="field-help">No alternate traits added.</p>'}
  <div class="cw-add-trait">${available.length?'<label class="sr-only" for="cw-alternate-select">Available alternates</label><select id="cw-alternate-select" data-alternate-select>'+choices(available,'','Choose alternate trait')+'</select>':''}
  <label class="sr-only" for="cw-alternate-new">Other alternate trait name</label><input id="cw-alternate-new" data-alternate-new maxlength="80" placeholder="Other alternate trait"><button class="button" type="button" data-add-trait="alternate">+ Add</button></div>
  <p class="field-help">Alternate traits normally replace standard traits. Review replacements in the FFD20 rules; toggles do not automatically change game bonuses.</p></section>
  <p class="cw-status" role="status" data-edit-status></p><div class="wizard-actions"><a class="button" href="${route('create-identity',state.id)}">Back</a><button class="button primary" type="submit">Save &amp; next</button></div></form></section>`;
}
function classOptions(current){return choices(CLASS_NAMES,current,'Choose class');}
function renderArchetype(name,selected,index){
 const options=ARCHETYPES[name]||[];
 const custom=Boolean(selected&&!options.includes(selected));
 return `<label class="cw-field cw-archetype"><span>Archetype <small>optional</small></span>
  <select data-archetype-select="${index}" ${!name?'disabled':''}><option value="">No archetype</option>${options.map(item=>'<option value="'+esc(item)+'"'+(item===selected?' selected':'')+'>'+esc(item)+'</option>').join('')}<option value="__custom__" ${custom?'selected':''}>Other archetype…</option></select></label>
  <label class="cw-field cw-archetype-other" ${custom?'':'hidden'}><span>Archetype name</span><input data-archetype-custom="${index}" maxlength="80" value="${esc(custom?selected:'')}" placeholder="Enter archetype name"></label>`;
}
export function renderClass(data,state){
 const classes=state.classes;
 const total=totalClassLevel(classes);
 return `<section class="cw-step"><h1>Classes</h1><form data-edit-character data-step="class">
  <div data-class-rows>${classes.map((row,index)=>`<section class="cw-class-card" data-class-index="${index}">
   <div class="cw-class-heading"><h2>Class ${index+1}</h2>${index?'<button class="cw-icon" type="button" data-remove-class="'+index+'" aria-label="Remove class '+(index+1)+'" title="Remove class">×</button>':''}</div>
   <div class="cw-class-line"><label class="cw-field"><span>Class</span><select data-class-name="${index}" required>${classOptions(row.name)}</select></label>
    <label class="cw-field cw-level"><span>Level</span><span class="cw-level-control"><button type="button" data-level-step="${index}" data-change="-1" aria-label="Decrease class ${index+1} level">−</button><input type="number" data-class-level="${index}" min="1" max="20" step="1" value="${Number(row.level)||1}" aria-label="Class ${index+1} level" required><button type="button" data-level-step="${index}" data-change="1" aria-label="Increase class ${index+1} level">+</button></span></label></div>
   ${renderArchetype(row.name,row.archetype,index)}</section>`).join('')}</div>
  <div class="cw-multiclass-footer"><button type="button" class="button" data-add-class ${classes.length>=8?'disabled':''}>+ Multiclass</button><strong>Total level: <span data-total-level>${total}</span></strong></div>
  <p class="cw-status" role="status" data-edit-status></p><div class="wizard-actions"><a class="button" href="${route('create-race',state.id)}">Back</a><button type="submit" class="button primary">Save &amp; open sheet</button></div></form></section>`;
}
export function renderIdentity(data,state){
 const portrait=state.portrait;
 return `<section class="cw-step"><div class="cw-source"><span>Source</span><strong>${SOURCE_NAME}</strong></div><h1>Identity</h1><form data-edit-character data-step="identity">
  <label class="cw-field"><span>Name</span><input name="charName" maxlength="80" required value="${esc(state.name)}" placeholder="Character name"></label>
  <div class="cw-photo-group"><div class="cw-photo" data-portrait-preview>${portraitOK(portrait)?'<img src="'+esc(portrait)+'" alt="Character portrait preview">':noPortrait}</div><div><label class="cw-field" for="cw-photo-input"><span>Character picture</span><input type="file" id="cw-photo-input" data-portrait-upload accept="image/jpeg,image/png,image/webp"></label><p class="field-help">JPG, PNG or WebP. A small preview is saved with your character.</p>${portrait?'<button class="button" type="button" data-clear-portrait>Remove picture</button>':''}</div></div>
  <label class="cw-field"><span>Alignment</span><select name="alignment">${choices(ALIGNMENTS,state.alignment,'Choose alignment')}</select></label>
  <p class="cw-status" role="status" data-edit-status></p><div class="wizard-actions"><a class="button" href="characters.html">Back</a><button class="button primary" type="submit">Save &amp; next</button></div></form></section>`;
}
export function characterLevelSummary(data={}){
 const classes=characterClasses(data).filter(row=>row.name&&Number(row.level)>0);
 const total=classes.length?totalClassLevel(classes):Number(data.character_level||data.level)||0;
 return {classes,totalLevel:total};
}
export function renderSheet(character,page){
 const data=character.data||{},summary=characterLevelSummary(data),id=character.id;
 const section=page==='sheet-inventory'?['items','weapons','gil','currency_gil']:page==='sheet-abilities'?['spells','activeAbilities','passiveAbilities','racialAbilities','feats','skills']:['race','str','dex','con','int','wis','cha','hp_curr','hp_max','mp_curr','mp_max','ac_total','bab','speed','alignment'];
 const portrait=portraitOK(data.portrait)?'<img class="cw-sheet-portrait" src="'+esc(data.portrait)+'" alt="">':'';
 return `<a class="back" href="characters.html">← Characters</a><nav class="tabs" aria-label="Character sheet">${[['sheet','Overview'],['sheet-inventory','Inventory'],['sheet-abilities','Abilities']].map(([name,title])=>`<a href="${route(name,id)}" ${page===name?'aria-current="page"':''}>${title}</a>`).join('')}</nav>
  <div class="cw-sheet-heading">${portrait}<div><h1>${esc(character.name)}</h1>${data.source?'<span class="cw-source-caption">'+esc(data.source)+'</span>':''}</div></div>
  ${page==='sheet'?'<section class="cw-sheet-levels" aria-label="Class levels"><div><span>Total level</span><strong>'+esc(summary.totalLevel||'—')+'</strong></div>'+summary.classes.map((row,index)=>'<div><span>Class '+(index+1)+' Lv</span><strong>'+esc(row.name)+' '+esc(row.level)+'</strong>'+(row.archetype?'<small>'+esc(row.archetype)+'</small>':'')+'</div>').join('')+'</section>':''}
  <section class="saved-sheet"><dl>${section.filter(key=>data[key]!==undefined).map(key=>`<div><dt>${esc(key.replaceAll('_',' '))}</dt><dd>${valueMarkup(data[key])}</dd></div>`).join('')||'<p>No saved values in this section.</p>'}</dl></section>`;
}
async function processPicture(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>3000000)throw Error('Choose a JPG, PNG or WebP under 3 MB.');
 const bitmap=await createImageBitmap(file);
 try{
  let limit=512,quality=.82;
  for(let i=0;i<6;i++){
   const ratio=Math.min(1,limit/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image preview is unavailable.');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
   const encoded=canvas.toDataURL('image/jpeg',quality);
   if(encoded.length<=145000)return encoded;
   limit=Math.floor(limit*.8);quality=Math.max(.55,quality-.1);
  }
  throw Error('Picture is too complex. Try a smaller image.');
 }finally{bitmap.close?.();}
}
export function mountCharacterView(){
 const page=document.body.dataset.page;const editing=page.startsWith('create-');
 const initialId=new URL(location.href).searchParams.get('characterId');
 if(page==='create-source'){location.replace(route('create-identity',initialId));return ()=>{};}
 if(editing&&!['create-identity','create-race','create-class'].includes(page))return ()=>{};
 if(editing&&!initialId&&page!=='create-identity'){location.replace(route('create-identity'));return ()=>{};}
 const root=document.querySelector('main'),control=new AbortController();let closed=false,character=null;
 let stage={id:initialId,portrait:'',name:'',alignment:'',race:'',standard:[],alternate:[],classes:[{name:'',level:1,archetype:''}]};
 const listId=()=>character?.id||initialId;
 const link=name=>route(name,listId());
 async function request(id,body){const res=await fetch('/api/v1/character-records/'+encodeURIComponent(id),{signal:control.signal,credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const json=await res.json();if(!res.ok)throw Error(json.message||({401:'Sign in first.',403:'You cannot edit this character.',409:'This character changed. Reload before saving.'})[res.status]||'Could not save character.');return json.character;}
 function hydrate(){const d=character?.data||{};
   stage={id:listId(),name:character?.name||d.charName||'',portrait:portraitOK(d.portrait)?d.portrait:'',alignment:d.alignment||'',race:d.race||'',standard:useTraitList(d,'standardRacialTraits')||defaultTraits(d.race||''),alternate:useTraitList(d,'alternateRacialTraits')||[],classes:characterClasses(d)};
 }
 const status=message=>{const node=root.querySelector('[data-edit-status]');if(node)node.textContent=message;};
 function draw(){if(closed)return;
  if(!editing){root.innerHTML=renderSheet(character,page);return;}
  root.innerHTML=page==='create-identity'?renderIdentity(character?.data||{},stage):page==='create-race'?renderRace(character?.data||{},stage):renderClass(character?.data||{},stage);
 }
 function readClasses(){const rows=[...root.querySelectorAll('[data-class-index]')];stage.classes=rows.map(row=>{
   const name=row.querySelector('[data-class-name]').value;
   const level=Number(row.querySelector('[data-class-level]').value);
   const picked=row.querySelector('[data-archetype-select]').value;
   const archetype=picked==='__custom__'?row.querySelector('[data-archetype-custom]').value:picked;
   return {name,level,archetype};
 });}
 async function save(fields,next){
  if(document.body.dataset.mode!=='live'){status('Preview mode does not save characters.');return;}
  const button=root.querySelector('[type=submit]');if(button)button.disabled=true;status('Saving…');
  try{
   if(!character){
    if(page!=='create-identity')throw Error('Save identity first.');
    const res=await fetch('/api/v1/my/characters',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields}),signal:control.signal});
    const payload=await res.json();if(!res.ok)throw Error(payload.message||'Could not create character.');character=payload.character;
   }else{
    const step=page==='create-identity'?'identity':page==='create-race'?'race':'class';
    character=await request(character.id,{op:'wizard',step,revision:character.revision,fields});
   }
   if(!closed)location.assign(route(next,character.id));
  }catch(e){if(!closed){status(e.message);if(button)button.disabled=false;}}
 }
 root.addEventListener('submit',event=>{
  if(!event.target.matches('[data-edit-character]'))return;event.preventDefault();
  if(page==='create-identity'){
    const form=event.target,fields={charName:form.elements.charName.value.trim(),alignment:form.elements.alignment.value,portrait:stage.portrait};
    void save(fields,'create-race');
  }else if(page==='create-race'){
    const race=event.target.elements.race.value;
    void save({race,standardRacialTraits:stage.standard,alternateRacialTraits:stage.alternate},'create-class');
  }else{readClasses();void save({classes:stage.classes},'sheet');}
 },{signal:control.signal});
 root.addEventListener('change',async event=>{
  if(event.target.matches('[data-portrait-upload]')){
    const file=event.target.files?.[0];if(!file)return;const form=root.querySelector('[data-edit-character]');if(form){stage.name=form.elements.charName.value;stage.alignment=form.elements.alignment.value;}status('Preparing picture…');
    try{stage.portrait=await processPicture(file);if(!closed){draw();status('Picture ready. Save to keep it.');}}catch(e){status(e.message);}
  }
  if(event.target.matches('[data-race-select]')){stage.race=event.target.value;stage.standard=defaultTraits(stage.race);stage.alternate=[];draw();}
  if(event.target.matches('[data-trait-kind]')){
    const kind=event.target.dataset.traitKind==='standard'?'standard':'alternate',index=Number(event.target.dataset.traitIndex);
    if(stage[kind][index])stage[kind][index].enabled=event.target.checked;
  }
  if(event.target.matches('[data-class-name]')){readClasses();const index=Number(event.target.dataset.className);stage.classes[index].archetype='';draw();}
  if(event.target.matches('[data-archetype-select]')){const idx=Number(event.target.dataset.archetypeSelect);const other=root.querySelector(`[data-archetype-custom="${idx}"]`);if(other){other.closest('.cw-archetype-other').hidden=event.target.value!=='__custom__';if(event.target.value==='__custom__')other.focus();}readClasses();}
 },{signal:control.signal});
 root.addEventListener('click',event=>{
  if(event.target.matches('[data-clear-portrait]')){const form=root.querySelector('[data-edit-character]');if(form){stage.name=form.elements.charName.value;stage.alignment=form.elements.alignment.value;}stage.portrait='';draw();return;}
  const add=event.target.closest('[data-add-trait]');
  if(add){const kind=add.dataset.addTrait==='standard'?'standard':'alternate';
    const text=root.querySelector(kind==='standard'?'[data-standard-new]':'[data-alternate-new]')?.value.trim();
    const picked=kind==='alternate'?root.querySelector('[data-alternate-select]')?.value:'';
    const name=text||picked;if(!name||name.length>80){status('Enter a trait name.');return;}
    if(stage[kind].some(t=>t.name.toLowerCase()===name.toLowerCase())){status('This trait is already added.');return;}
    stage[kind].push({name,enabled:kind==='standard'});draw();return;
  }
  if(event.target.closest('[data-add-class]')){readClasses();if(stage.classes.length>=8)return;stage.classes.push({name:'',level:1,archetype:''});draw();return;}
  const rem=event.target.closest('[data-remove-class]');if(rem){readClasses();const i=Number(rem.dataset.removeClass);if(i>0)stage.classes.splice(i,1);draw();return;}
  const stepper=event.target.closest('[data-level-step]');if(stepper){const i=Number(stepper.dataset.levelStep),input=root.querySelector(`[data-class-level="${i}"]`);if(!input)return;input.value=String(Math.max(1,Math.min(20,(Number(input.value)||1)+Number(stepper.dataset.change))));readClasses();root.querySelector('[data-total-level]').textContent=String(totalClassLevel(stage.classes));}
 },{signal:control.signal});
 root.addEventListener('input',event=>{
  if(event.target.matches('[data-class-level]')){readClasses();const target=root.querySelector('[data-total-level]');if(target)target.textContent=String(totalClassLevel(stage.classes));}
 },{signal:control.signal});
 if(!initialId){hydrate();draw();}
 else if(document.body.dataset.mode!=='live'){root.innerHTML='<p role="status">Character editing is only available on the signed-in site.</p>';return ()=>{closed=true;control.abort();};}
 else{root.innerHTML='<p role="status">Loading character…</p>';request(initialId).then(c=>{if(!closed){character=c;hydrate();draw();}}).catch(error=>{if(!closed)root.innerHTML='<p role="status">'+esc(error.message)+'</p><a class="back" href="characters.html">← Characters</a>';});}
 return ()=>{closed=true;control.abort();};
}