import {availableRuleAbilities} from '../features/characters/rules/ability-library.mjs';
import {manualSourceFamilies,manualSourceOptions} from '../features/characters/rules/manual-source-library.mjs';
import {formatSheetText} from '../features/sheet/rich-text.mjs';
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const destinations={activeAbilities:'Active abilities',passiveAbilities:'Passive abilities',feats:'Feats'};
const option=(id,name,selected)=>'<option value="'+e(id)+'"'+(id===selected?' selected':'')+'>'+e(name)+'</option>';

// Preview links as their labels while retaining the original Markdown in the
// stored Description. Tables stay readable on a small screen.
export function formatSourceText(text){
 const lines=String(text).replace(/\[([^\]]+)\]\(https?:\/\/[^)\n]+\)/g,'$1').split('\n'),parts=[];let prose=[];
 const flush=()=>{if(prose.length){parts.push(formatSheetText(prose.join('\n')));prose=[];}};
 for(let i=0;i<lines.length;i++){
  if(lines[i].trim().startsWith('|')&&/^[| :\-]+$/.test(lines[i+1]||'')){
   flush();const cells=line=>line.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
   const header=cells(lines[i]);i+=2;const rows=[];
   while(i<lines.length&&lines[i].trim().startsWith('|')){rows.push(cells(lines[i]));i++;}i--;
   parts.push('<div class="cs-source-table"><table><thead><tr>'+header.map(c=>'<th>'+formatSheetText(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(c=>'<td>'+formatSheetText(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>');
  }else prose.push(lines[i]);
 }
 flush();return parts.join('');
}

export function renderSourceCard(card){
 const collection=card.defaultCollection;
 return '<details class="cs-card cs-library-card" data-source-card="'+e(card.id)+'"><summary>'+e(card.name)+(card.level!==undefined?' <small>Song level '+card.level+'</small>':card.atLevel?' <small>Class level '+card.atLevel+'</small>':'')+(card.added?' <small>Added</small>':'')+'</summary>'+
  '<p class="cs-caption">'+e(card.pageName)+'</p>'+(card.prerequisites&&card.prerequisites!=='—'?'<p><strong>Prerequisites:</strong> '+e(card.prerequisites)+'</p>':'')+
  (card.sheetNote?'<p class="cs-library-note">'+e(card.sheetNote)+'</p>':'')+
  '<div class="cs-richtext">'+formatSourceText(card.description)+'</div><a href="'+e(card.url)+'" target="_blank" rel="noopener">Official source ↗</a>'+
  (card.added?'':'<div class="cs-library-add-fields">'+(collection==='spells'?'<span>Copies to Spells</span>':card.limitBreak?'<span>Uses the shared Limit Break pool</span>':'<label class="cs-field">Add to<select data-source-destination>'+Object.entries(destinations).map(([id,name])=>option(id,name,collection)).join('')+'</select></label><label class="cs-field">Usage maximum (optional)<input type="number" inputmode="numeric" data-source-maximum min="0" max="1000000" step="1" placeholder="0"></label>')+'</div>')+
  '<button class="button" type="button" data-source-add="'+e(card.id)+'"'+(card.added?' disabled':'')+'>'+(card.added?'Added':'Copy to sheet')+'</button></details>';
}

export function openAbilityLibrary({getData,save,onAdded=()=>{}}){
 const modal=document.createElement('dialog');modal.className='cs-dialog cs-ability-library';modal.setAttribute('aria-label','Add abilities');
 const initial=getData(),matching=manualSourceFamilies.find(f=>f.id===initial.classId||f.name.toLowerCase()===String(initial.class||'').toLowerCase());
 let familyId=matching?.id||manualSourceFamilies[0].id,pageId=initial.archetypeId||familyId,manual=!initial.rulesBuild,pending=false,shown=[];
 const family=()=>manualSourceFamilies.find(f=>f.id===familyId);
 const sourceOptions=()=>family().pages.map(p=>option(p.id,p.name,pageId)).join('');
 modal.innerHTML='<div class="cs-card-title"><h2>Add abilities</h2><button type="button" class="cs-icon" data-library-close aria-label="Close">×</button></div>'+
  '<label class="cs-field">Library<select data-library-mode>'+option('granted','Granted to this character',manual?'manual':'granted')+option('manual','Manual source import',manual?'manual':'granted')+'</select></label>'+
  '<div data-source-controls><p class="cs-library-note">Copy the full source text, then apply level requirements, prerequisites, choices and archetype replacements manually. Edit usage counters on the sheet as needed.</p><div class="cs-form-grid"><label class="cs-field">Class<select data-source-family>'+manualSourceFamilies.map(f=>option(f.id,f.name,familyId)).join('')+'</select></label><label class="cs-field">Source<select data-source-page>'+sourceOptions()+'</select></label></div><div data-source-guide></div></div>'+
  '<label class="cs-search">Find an ability<input type="search" data-library-search></label><p class="cs-caption" data-library-count></p><div data-library-list></div><p role="status" data-library-status></p>';
 const status=message=>{modal.querySelector('[data-library-status]').textContent=message;};
 const draw=()=>{
  modal.querySelector('[data-source-controls]').hidden=!manual;
  const query=modal.querySelector('[data-library-search]').value;
  if(manual){
   if(!family().pages.some(p=>p.id===pageId))pageId=familyId;
   const page=family().pages.find(p=>p.id===pageId);
   shown=manualSourceOptions(getData(),{familyId,pageId,query});
   modal.querySelector('[data-source-guide]').innerHTML='<details class="cs-library-guide"><summary>Setup, progression and replacements</summary>'+
    (page.kind==='archetype'?'<p>Read this archetype’s replacements before copying abilities. Kept features come from the parent '+e(family().name)+' source.</p>':'')+
    (page.introduction?'<div class="cs-richtext">'+formatSourceText(page.introduction)+'</div>':'')+
    page.references.map(ref=>'<details><summary>'+e(ref.name)+'</summary><div class="cs-richtext">'+formatSourceText(ref.description)+'</div></details>').join('')+
    '<a href="'+e(page.url)+'" target="_blank" rel="noopener">Official source ↗</a></details>';
   modal.querySelector('[data-library-list]').innerHTML=shown.map(renderSourceCard).join('')||'<p>No matching source entries.</p>';
  }else{
   shown=availableRuleAbilities(getData()).filter(o=>[o.name,o.description].some(s=>s.toLowerCase().includes(query.toLowerCase())));
   modal.querySelector('[data-library-list]').innerHTML=shown.map(o=>'<details class="cs-card cs-library-card"><summary>'+e(o.name)+'</summary><div class="cs-richtext">'+formatSheetText(o.description)+'</div>'+(o.url?'<a href="'+e(o.url)+'" target="_blank" rel="noopener">Official source ↗</a>':'')+'<button class="button" type="button" data-library-add="'+e(o.id)+'" '+(o.added?'disabled':'')+'>'+(o.added?'Added':'Add')+'</button></details>').join('')||'<p>No granted abilities. Choose Manual source import to copy from Archer, Bard or Beastmaster.</p>';
  }
  modal.querySelector('[data-library-count]').textContent=shown.length+' '+(manual?'source entries · all levels · manual setup':'available abilities');
 };
 const controls=['[data-library-mode]','[data-source-family]','[data-source-page]'];
 modal.addEventListener('change',event=>{
  if(pending||!controls.some(s=>event.target.matches(s)))return;
  manual=modal.querySelector('[data-library-mode]').value==='manual';
  const newFamily=modal.querySelector('[data-source-family]').value;
  if(familyId!==newFamily){familyId=newFamily;pageId=familyId;modal.querySelector('[data-source-page]').innerHTML=sourceOptions();}
  else pageId=modal.querySelector('[data-source-page]').value;
  status('');draw();
 });
 modal.querySelector('[data-library-search]').addEventListener('input',()=>{if(!pending)draw();});
 modal.addEventListener('click',async event=>{
  if(event.target.closest('[data-library-close]')){modal.close();return;}
  const button=event.target.closest('[data-library-add],[data-source-add]');if(!button||pending)return;
  let change;
  if(button.dataset.sourceAdd){
   const card=shown.find(o=>o.id===button.dataset.sourceAdd),container=button.closest('[data-source-card]');
   const rawMaximum=container.querySelector('[data-source-maximum]')?.value||'0',maximum=Number(rawMaximum);
   if(!Number.isSafeInteger(maximum)||maximum<0||maximum>1000000){status('Enter a whole usage maximum from 0 to 1,000,000.');return;}
   change={action:'addManualSourceAbilities',picks:[{id:card.id,collection:container.querySelector('[data-source-destination]')?.value||card.defaultCollection,maximum}]};
  }else change={action:'addRuleAbility',ruleId:button.dataset.libraryAdd};
  pending=true;button.disabled=true;status('Adding…');
  for(const control of modal.querySelectorAll('select,input'))control.disabled=true;
  try{
   if(await save(change)){draw();status('Added. Full source text is in Description.');onAdded();}
   else{button.disabled=false;status('The entry could not be added. Save or refresh the sheet and try again.');}
  }catch(error){button.disabled=false;status(error.message);}
  finally{pending=false;for(const control of modal.querySelectorAll('select,input'))control.disabled=false;}
 });
 modal.addEventListener('close',()=>modal.remove(),{once:true});document.body.append(modal);draw();modal.showModal();
 return modal;
}
