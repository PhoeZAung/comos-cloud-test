import {abilities,sizes,number,modifier,sheetStats} from '../features/sheet/model.mjs';
import {escape as e,sections,renderSheetFrame,renderSection,collectionBlock,renderSkillRows,entryDetail,titles,abilityTabs} from '../features/sheet/view.mjs';
const groupFields={
 abilities:['str','dex','con','int','wis','cha'],identity:['size_category','languages','senses'],
 resources:['hp_curr','hp_temp','hp_max','hp_max_temp','mp_curr','mp_temp','mp_class','mp_bonus','mp_max_temp'],
 base:['init_temp','bab','bab_temp','speed'],defense:['ac_armor','ac_natural','ac_deflect','ac_dodge','ac_temp','touch_temp','flat_temp','cmd_temp'],
 attack:['ar_melee_ability','ar_melee_temp','ar_ranged_ability','ar_ranged_temp','ar_touch_ability','ar_touch_temp','ar_ranged_touch_ability','ar_ranged_touch_temp','cmb_temp'],
 saves:['fort_base','fort_enhance','fort_temp','ref_base','ref_enhance','ref_temp','will_base','will_enhance','will_temp'],resistances:['resistances'],proficiencies:['proficiencies'],currency:['currency_gil','currency_moogle','slot_cap'],spell:['spell_dc_base','mp_max_spell_level']
};
const labels={str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma',size_category:'Size',hp_curr:'Current HP',hp_temp:'Temporary HP',hp_max:'Base maximum HP',hp_max_temp:'Maximum HP adjustment',mp_curr:'Current MP (including temp)',mp_temp:'Temporary MP',mp_class:'Class MP',mp_bonus:'Bonus MP',mp_max_temp:'Maximum MP adjustment',init_temp:'Initiative misc',bab:'Base attack bonus',bab_temp:'BAB adjustment',ac_armor:'Armor',ac_natural:'Natural armor',ac_deflect:'Deflection',ac_dodge:'Dodge',ac_temp:'AC adjustment',touch_temp:'Touch adjustment',flat_temp:'Flat-footed adjustment',cmd_temp:'CMD adjustment',cmb_temp:'CMB adjustment',currency_gil:'Gil',currency_moogle:'Moogle',slot_cap:'Capacity',spell_dc_base:'Spell ability',mp_max_spell_level:'Maximum spell level',desc:'Description',u_curr:'Uses remaining',u_max:'Maximum uses',lvl:'Level / ranks',cs:'Class skill',temp:'Misc bonus',subName:'Specialization',stat:'Ability',ability_mod:'Attack ability',attack_misc:'Attack misc',restoreOnLongRest:'Restore uses on rest',amount:'Quantity',equipped:'Equipped'};
const readable=k=>labels[k]||k.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const textKeys=new Set(['name','desc','damage','range','type','crit_range','crit_mult','attack_type','duration','target','saving_throw','school','spell_resist','at_higher_lvls','subName','languages','senses','resistances','proficiencies']);
const boolKeys=new Set(['cs','equipped','restoreOnLongRest']);
function field(key,value){
 const label=readable(key),opts=key==='size_category'?sizes:key==='stat'||key==='ability_mod'||key==='spell_dc_base'?abilities:key.endsWith('_ability')?['str','dex']:null;
 if(opts)return `<label class="cs-field"><span>${label}</span><select name="${key}">${opts.map(opt=>'<option value="'+opt+'"'+(opt===String(value||opts[0])?' selected':'')+'>'+opt+'</option>').join('')}</select></label>`;
 if(boolKeys.has(key))return `<label class="cs-checkbox"><input type="checkbox" name="${key}" ${value?'checked':''}><span>${label}</span></label>`;
 if(['desc','resistances','proficiencies'].includes(key))return `<label class="cs-field cs-field-wide"><span>${label}</span><textarea name="${key}" rows="5" maxlength="12000">${e(value||'')}</textarea></label>`;
 const isText=textKeys.has(key);
 return `<label class="cs-field"><span>${label}</span><input name="${key}" type="${isText?'text':'number'}" ${isText?'maxlength="'+(key==='name'?120:12000)+'"':'step="any" required'} value="${e(value??(isText?'':0))}" ${key==='name'?'required':''}></label>`;
}
export function rollDice(expression,random=limit=>{const range=4294967296,ceiling=range-range%limit;let x;do{x=crypto.getRandomValues(new Uint32Array(1))[0];}while(x>=ceiling);return x%limit+1;}){
 const match=/^\s*(\d{1,2})d(\d{1,4})(?:\s*([+-])\s*(\d{1,6}))?\s*$/i.exec(expression);if(!match)throw Error('Use dice such as 1d20+5 or 2d6.');
 const count=Number(match[1]),sides=Number(match[2]);if(count<1||count>50||sides<2||sides>1000)throw Error('Use 1–50 dice with 2–1,000 sides.');
 const rolls=Array.from({length:count},()=>random(sides)),bonus=Number(match[4]||0)*(match[3]==='-'?-1:1);return {expression,rolls,bonus,total:rolls.reduce((a,b)=>a+b,bonus)};
}
export function mountSheet(){
 const root=document.querySelector('main'),id=new URL(location.href).searchParams.get('characterId'),compact=new URL(location.href).searchParams.get('compact')==='1';
 const control=new AbortController();let closed=false,character=null,admin=false,busy=false,conflict=false,dirty=false,timer=null,dialogState=null,polling=false,discordEnabled=true,stream=null,resourceTimer=null,pendingResourceFields={};
 let section=new URL(location.href).searchParams.get('section')||({'sheet-inventory':'items','sheet-abilities':'abilities'}[document.body.dataset.page]||'overview');if(!sections.some(([k])=>k===section))section='overview';
 let ability=new URL(location.href).searchParams.get('ability')||'activeAbilities';if(!abilityTabs.includes(ability))ability='activeAbilities';
 document.body.classList.toggle('sheet-compact',compact);
 if(!id){root.innerHTML='<h1>Character sheet</h1><p>Choose a character to open its sheet.</p><a class="button" href="characters.html">Characters</a>';return ()=>control.abort();}
 const endpoint='/api/v1/character-records/'+encodeURIComponent(id);
 const status=message=>{const node=root.querySelector('[data-sheet-status]');if(node)node.textContent=message;};
 const dialog=()=>root.querySelector('[data-sheet-dialog]');
 const setBusy=value=>{busy=value;root.querySelector('[data-sheet]')?.classList.toggle('cs-saving',value);root.querySelectorAll('button,input,select,textarea').forEach(node=>node.disabled=value);};
 async function request(body,revision){
  const res=await fetch(endpoint+(revision!==undefined?'?revision='+revision:''),{signal:control.signal,credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,op:body.op||'sheet',revision:character.revision})}:{})});
  const data=await res.json();if(!res.ok)throw Object.assign(Error(data.message||({401:'Sign in to open this sheet.',404:'Character unavailable.',409:'Changed elsewhere. Copy any unsaved edits, then Refresh.'})[res.status]||'Could not reach the character server.'),{status:res.status});return data;
 }
 function draw(){if(closed)return;pendingResourceFields={};root.innerHTML=renderSheetFrame(character,section,{admin,compact,ability});root.querySelector('[data-discord-rolls]').checked=discordEnabled;document.title=character.name+' · Comos';dirty=false;}
 async function save(change){
  if(busy||closed||conflict)return false;setBusy(true);status('Saving…');
  try{const result=await request(change);if(closed)return false;character=result.character;dirty=false;dialog()?.close();draw();status('Saved · Synced'+(admin?' · Admin':''));return true;}
  catch(err){if(closed)return false;if(err.status===409){conflict=true;root.querySelector('[data-sheet-refresh]').hidden=false;}status(err.message);const message=root.querySelector('[data-dialog-status]');if(message)message.textContent=err.message;return false;}
  finally{if(!closed)setBusy(false);}
 }
 async function refresh(force=false){
  if(closed||busy||polling||document.hidden||(!force&&(dirty||conflict||dialog()?.open)))return;
  if(force&&(dirty||dialog()?.open)&&!confirm('Discard unsaved edits and load the latest sheet?'))return;
  polling=true;const previousRevision=character?.revision;
  try{const result=await request(null,!force&&character?character.revision:undefined);if(closed||busy||character?.revision!==previousRevision)return;if(!result.unchanged){if(!force&&(dirty||dialog()?.open))return;character=result.character;admin=result.admin===true;conflict=false;draw();}status('Synced'+(admin?' · Admin':''));}
  catch(err){if(!closed)status(err.message);}
  finally{polling=false;}
 }
 function schedule(){clearTimeout(timer);if(closed)return;timer=setTimeout(async()=>{await refresh();schedule();},5000);}
 function openDialog(title,keys,values,change,{help=''}={}){
  if(busy||conflict){status(conflict?'Refresh to load the latest sheet before editing.':'Saving…');return;}
  root.querySelector('[data-sheet-form] button[type=submit]').hidden=false;dialogState={keys,change};root.querySelector('#cs-dialog-title').textContent=title;
  root.querySelector('[data-dialog-fields]').innerHTML=(help?'<p class="cs-caption">'+e(help)+'</p>':'')+'<div class="cs-form-grid">'+keys.map(k=>field(k,values[k])).join('')+'</div>';
  root.querySelector('[data-dialog-status]').textContent='';if(['damage','heal','spendMp'].includes(change.action))root.querySelector('[name=amount]').closest('label').querySelector('span').textContent='Amount';dialog().showModal();
 }
 function showFormula(label){
  const d=character.data,s=sheetStats(d),n=k=>number(d[k]),mod=a=>s.mods[a];
  const size=[8,4,2,1,0,-1,-2,-4,-8][sizes.indexOf(d.size_category||d.size||'Medium')]||0;
  const formulas={
   'Initiative':`DEX ${mod('dex')} + adjustment ${n('init_temp')} = ${s.initiative}`,
   'BAB':`Base ${n('bab')} + adjustment ${n('bab_temp')} = ${s.bab}`,
   'Speed':`Saved movement speed: ${s.speed}`,
   'AC':`10 + DEX ${mod('dex')} + size ${size} + armor ${n('ac_armor')} + natural ${n('ac_natural')} + deflection ${n('ac_deflect')} + dodge ${n('ac_dodge')} + adjustment ${n('ac_temp')} = ${s.ac}`,
   'Touch':`10 + DEX ${mod('dex')} + size ${size} + deflection ${n('ac_deflect')} + dodge ${n('ac_dodge')} + adjustment ${n('touch_temp')} = ${s.touch}`,
   'Flat-footed':`10 + size ${size} + armor ${n('ac_armor')} + natural ${n('ac_natural')} + deflection ${n('ac_deflect')} + adjustment ${n('flat_temp')} = ${s.flat}`,
   'CMD':`10 + STR ${mod('str')} + DEX ${mod('dex')} − size ${size} + adjustment ${n('cmd_temp')} = ${s.cmd}`,
   'CMB':`BAB ${s.bab} + STR ${mod('str')} + DEX ${mod('dex')} − size ${size} + adjustment ${n('cmb_temp')} = ${s.cmb}`,
   'HP':`Current ${s.hp}; base maximum ${n('hp_max')} + maximum adjustment ${n('hp_max_temp')} = ${s.hpMax}; temporary HP ${s.hpTemp}`,
   'MP':`Current ${s.mp}; class ${n('mp_class')} + bonus ${n('mp_bonus')} + maximum adjustment ${n('mp_max_temp')} = ${s.mpMax}`,
   'Armor class':`Calculated AC: ${s.ac}`
  };
  for(const [name,key,stat] of [['Fortitude','fort','con'],['Reflex','ref','dex'],['Will','will','wis']])formulas[name]=`${stat.toUpperCase()} ${mod(stat)} + base ${n(key+'_base')} + enhancement ${n(key+'_enhance')} + adjustment ${n(key+'_temp')} = ${s[key]}`;
  for(const [name,key,fallback,total] of [['Melee','ar_melee','str',s.melee],['Ranged','ar_ranged','dex',s.ranged],['Touch attack','ar_touch','str',s.touchAttack],['Ranged touch','ar_ranged_touch','dex',s.rangedTouch]]){const stat=['str','dex'].includes(d[key+'_ability'])?d[key+'_ability']:fallback;formulas[name]=`BAB ${s.bab} + ${stat.toUpperCase()} ${mod(stat)} + size ${size} + adjustment ${n(key+'_temp')} = ${total}`;}
  root.querySelector('#cs-dialog-title').textContent=label+' calculation';root.querySelector('[data-dialog-fields]').innerHTML='<p class="cs-prose">'+e(formulas[label]||'Saved sheet value')+'</p><p class="cs-caption">Uses the saved sheet components. Class progression and conditional effects remain manual.</p>';root.querySelector('[data-dialog-status]').textContent='';root.querySelector('[data-sheet-form] button[type=submit]').hidden=true;dialog().showModal();
 }
 function editEntry(key,index){
  const row=character.data[key]?.[index]||{};
  const keys=key==='skills'?['name','stat','lvl','temp','cs','subName']:key==='items'?['name','amount','equipped','desc']:key==='weapons'?['name','damage','ability_mod','attack_misc','range','crit_range','crit_mult','desc']:key==='spells'?['name','lvl','school','type','range','duration','target','saving_throw','spell_resist','damage','desc','at_higher_lvls']:key==='activeAbilities'?['name','type','u_curr','u_max','restoreOnLongRest','desc','at_higher_lvls']:['name','desc','at_higher_lvls'];
  const values={...row,damage:row.damage||row.dmg||'',amount:row.amount??1,stat:row.stat||'int',ability_mod:row.ability_mod||row.mod||'str',restoreOnLongRest:row.restoreOnLongRest!==false};
  openDialog(index===null?'Add '+titles[key]:'Edit '+(row.name||titles[key]),keys,values,{action:'entry',collection:key,index,mode:index===null?'add':'update'});
  if(index!==null)root.querySelector('[data-dialog-fields]').insertAdjacentHTML('beforeend','<button class="cs-delete" type="button" data-remove-entry="'+key+':'+index+'">Delete entry</button>');
 }
 async function roll(label,expression){
  if(busy)return;setBusy(true);const node=root.querySelector('[data-roll-result]');node.hidden=false;node.textContent='Rolling…';
  try{const result=await request({op:'roll',expression,label,requestId:crypto.randomUUID(),discord:discordEnabled});if(closed)return;const r=result.roll;node.textContent=label+': '+r.total+' ('+r.rolls.join(', ')+(r.bonus?' '+(r.bonus>=0?'+':'−')+' '+Math.abs(r.bonus):'')+')'+(result.discord==='sent'?' · Sent to Discord':result.discord==='failed'?' · Discord delivery failed; roll kept here':result.discord==='pending'?' · Discord delivery pending':' · Local only');document.dispatchEvent(new CustomEvent('comos:sheet-roll',{detail:{characterId:id,label,...r}}));}
  catch(err){if(!closed)node.textContent=err.message;}finally{if(!closed)setBusy(false);}
 }
 root.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||busy)return;
  if(button.matches('[data-ability-tab]')){if(dirty&&!confirm('Discard unsaved edits?'))return;ability=button.dataset.abilityTab;draw();const url=new URL(location.href);url.searchParams.set('ability',ability);history.replaceState(null,'',url);return;}
  if(button.matches('[data-sheet-tab]')){
   if((dirty||dialog()?.open)&&!confirm('Discard unsaved edits?'))return;section=button.dataset.sheetTab;draw();const url=new URL(location.href);url.searchParams.set('section',section);history.replaceState(null,'',url);return;
  }
  if(button.matches('[data-dialog-close]')){dialog()?.close();dirty=false;if(!conflict)void refresh();return;}
  if(button.matches('[data-sheet-refresh]')){void refresh(true);return;}
  if(button.matches('[data-edit-stats]')){
   const group=button.dataset.editStats,values={...character.data},s=sheetStats(values);if(group==='resources'){values.mp_curr=s.mp;values.mp_class=values.mp_class??s.mpMax;values.mp_bonus=values.mp_bonus??0;}if(group==='currency')values.currency_gil=values.currency_gil??values.gil??0;
   if(group==='identity')values.size_category=values.size_category||values.size||'Medium';
   openDialog(readable(group),groupFields[group],values,{action:'fields'},{help:group==='resources'?'HP and MP maximums are saved values. Class progression and bonus MP are not recalculated from a rules catalog.':''});return;
  }
  if(button.matches('[data-edit-entry]')){const [key,i]=button.dataset.editEntry.split(':');editEntry(key,Number(i));return;}
  if(button.matches('[data-add-entry]')){editEntry(button.dataset.addEntry,null);return;}
  if(button.matches('[data-remove-entry]')){const [key,i]=button.dataset.removeEntry.split(':');if(confirm('Delete this entry?'))void save({action:'entry',collection:key,index:Number(i),mode:'remove'});return;}
  if(button.matches('[data-resource]')){const key=button.dataset.resource,s=sheetStats(character.data),value=(key==='hp_curr'?s.hp:s.mp)+Number(button.dataset.delta);void save({action:'fields',fields:{[key]:value}});return;}
  if(button.matches('[data-use]')){const index=Number(button.dataset.use),row=character.data.activeAbilities[index];if(number(row.u_curr)>0)void save({action:'entry',collection:'activeAbilities',index,mode:'update',fields:{u_curr:number(row.u_curr)-1}});else status('No uses remaining.');return;}
  if(button.matches('[data-damage-roll]')){roll(button.dataset.damageLabel+' damage',button.dataset.damageRoll);return;}
  if(button.matches('[data-roll]')){roll(button.dataset.roll,'1d20'+(Number(button.dataset.bonus)>=0?'+':'')+number(button.dataset.bonus));return;}
  if(button.matches('[data-formula]')){showFormula(button.dataset.formula);return;}
  if(button.matches('[data-rest]')){if(confirm('Recover HP equal to total level, refill MP, and restore active abilities marked for rest?'))void save({action:'rest'});return;}
  if(button.matches('[data-spend-mp]')){openDialog('Spend MP',['amount'],{amount:1},{action:'spendMp'},{help:'Enter the MP cost for this cast.'});return;}
 },{signal:control.signal});
 root.addEventListener('submit',event=>{
  if(!event.target.matches('[data-sheet-form],[data-notes]'))return;event.preventDefault();
  if(event.target.matches('[data-notes]')){void save({action:'fields',fields:{notesArea:event.target.elements.notesArea.value}});return;}
  const fields={};for(const key of dialogState.keys){const node=event.target.elements[key];fields[key]=boolKeys.has(key)?node.checked:textKeys.has(key)||node.tagName==='SELECT'?node.value:Number(node.value);}
  if(dialogState.change.action==='spendMp'){void save({action:dialogState.change.action,amount:fields.amount});return;}
  void save({...dialogState.change,fields});
 },{signal:control.signal});
 root.addEventListener('input',event=>{
  if(event.target.matches('[data-sheet-search]')){const d=character.data,q=event.target.value;root.querySelector('[data-sheet-list]').innerHTML=section==='skills'?renderSkillRows(d,q):section==='items'?collectionBlock('items',d,q):section==='spells'?collectionBlock('spells',d,q):collectionBlock(ability,d,q);return;}
  if(event.target.closest('form')||event.target.matches('[data-resource-input]')){dirty=true;status('Unsaved changes');}
  if(event.target.matches('[data-resource-input]')){clearTimeout(resourceTimer);const key=event.target.dataset.resourceInput,value=Number(event.target.value);if(event.target.value!==''&&Number.isFinite(value)&&(key!=='hp_temp'||value>=0)){pendingResourceFields[key]=value;resourceTimer=setTimeout(()=>{if(Object.keys(pendingResourceFields).length)void save({action:'fields',fields:{...pendingResourceFields}});},650);}}
 },{signal:control.signal});
 root.addEventListener('change',event=>{
  if(event.target.matches('[data-discord-rolls]'))discordEnabled=event.target.checked;
  if(event.target.matches('[data-resource-input]')){clearTimeout(resourceTimer);const value=Number(event.target.value);if(event.target.value!==''&&Number.isFinite(value)&&(event.target.dataset.resourceInput!=='hp_temp'||value>=0)){pendingResourceFields[event.target.dataset.resourceInput]=value;void save({action:'fields',fields:{...pendingResourceFields}});}}
  if(event.target.matches('[data-equipment]'))void save({action:'entry',collection:'items',index:Number(event.target.dataset.equipment),mode:'update',fields:{equipped:event.target.checked}});
 },{signal:control.signal});
 root.addEventListener('toggle',event=>{const detail=event.target;if(!detail.matches?.('[data-entry-details]')||!detail.open)return;const [key,i]=detail.dataset.entryDetails.split(':');const row=character?.data[key]?.[Number(i)];if(row)detail.querySelector('[data-entry-detail-body]').innerHTML=entryDetail(row);},{capture:true,signal:control.signal});
 root.addEventListener('cancel',()=>{dirty=false;},{capture:true,signal:control.signal});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();},{signal:control.signal});
 window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}},{signal:control.signal});
 root.innerHTML='<p role="status">Loading character…</p>';
 void request().then(result=>{if(closed)return;character=result.character;admin=result.admin===true;draw();schedule();if(typeof EventSource!=='undefined'){stream=new EventSource(endpoint+'?stream=1');stream.onmessage=()=>void refresh();}}).catch(err=>{if(!closed)root.innerHTML='<h1>Character sheet</h1><p role="status">'+e(err.message)+'</p><a class="button" href="signin.html">Sign in</a><a class="back" href="characters.html">← Characters</a>';});
 return ()=>{closed=true;clearTimeout(timer);clearTimeout(resourceTimer);stream?.close();control.abort();document.body.classList.remove('sheet-compact');};
}
