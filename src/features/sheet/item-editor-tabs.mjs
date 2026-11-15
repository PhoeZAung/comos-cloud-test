import {inventoryEditorFields,inventorySourceFields} from './inventory-fields.mjs';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

/**
 * Both tabs live inside the same form. Hiding a panel must never unmount
 * its inputs, so values survive switching tabs and a single Save covers both.
 */
export function renderItemEditorTabs(values={},renderField,renderSourceFields){
 const parts=inventoryEditorFields(values.sourceCategory||'Misc');
 const imported=Boolean(values.sourceItemId||values.sourceCatalog||Object.keys(inventorySourceFields(values)).length);
 const group=(label,keys)=>'<fieldset class="cs-editor-group cs-inventory-field-group"><legend>'+escapeHtml(label)+'</legend>'+keys.map(renderField).join('')+'</fieldset>';
 const detailsKeys=imported?['amount','cost','weight','img','link','carried']:['amount','cost','weight'];
 const commonStats=imported?['cl','traits'].filter(k=>parts.common.some(([,key])=>key===k)):[];
 const categoryStats=parts.extras.map(([,key])=>key);
 if(parts.allowTwoHanded)categoryStats.push('two_handed');
 const statKeys=[...new Set([...commonStats,...categoryStats])];
 const statLabel=({
  'Magic Items':'Magic Item Stats',
  'Alchemical Items':'Alchemy Stats',
  'Vehicles & Mounts':'Vehicle Stats',
  Consumables:'Consumable Stats',
  'Services & Other':'Service Stats'
 })[parts.category]||parts.category+' Stats';
 const advanced=imported?'<details class="cs-inventory-advanced-source"><summary>Advanced source columns</summary>'+renderSourceFields(values)+'</details>':'';
 return '<div class="cs-item-editor" data-item-editor>'+
  '<div class="cs-item-editor-tabs" role="tablist" aria-label="Item editor sections" data-item-edit-tabs>'+
   '<button type="button" role="tab" id="cs-item-edit-tab-details" aria-controls="cs-item-edit-panel-details" aria-selected="true" tabindex="0" data-item-edit-tab="details">Item Details</button>'+
   '<button type="button" role="tab" id="cs-item-edit-tab-stats" aria-controls="cs-item-edit-panel-stats" aria-selected="false" tabindex="-1" data-item-edit-tab="stats">'+escapeHtml(statLabel)+'</button>'+
  '</div>'+
  '<section role="tabpanel" id="cs-item-edit-panel-details" aria-labelledby="cs-item-edit-tab-details" data-item-edit-panel="details" tabindex="0">'+
   '<div class="cs-form-grid cs-inventory-editor">'+renderField('sourceCategory')+renderField('name')+
    group('Item details',detailsKeys)+
    '<div class="cs-ability-prose">'+renderField('desc')+'</div>'+
   '</div>'+
  '</section>'+
  '<section role="tabpanel" id="cs-item-edit-panel-stats" aria-labelledby="cs-item-edit-tab-stats" data-item-edit-panel="stats" tabindex="0" hidden>'+
   '<div class="cs-form-grid cs-inventory-editor">'+
    (statKeys.length?group(statLabel,statKeys):'<p class="cs-caption cs-item-stats-empty">No additional stats are required for this category.</p>')+
    '<div class="cs-ability-prose">'+renderField('special')+'</div>'+
    advanced+
   '</div>'+
  '</section>'+
 '</div>';
}

/** Only read controls that were rendered. Optional/imported metadata that is
 * hidden from the form must stay untouched in existing inventory records.
 * Inactive tabs remain in the DOM so their controls are included normally.
 */
export function collectItemEditorFields(form,keys,boolKeys=new Set()){
 const fields={};
 for(const key of keys){
  if(key==='damage_types'){fields[key]=new FormData(form).getAll(key);continue;}
  const node=form.elements.namedItem(key);
  if(!node)continue;
  if(boolKeys.has(key)){fields[key]=node.checked;continue;}
  if(['ammo_ar_bonus','ammo_dmg_bonus'].includes(key)){fields[key]=node.value.trim()===''?0:Number(node.value);continue;}
  if(key==='amount'||key==='weight'){
   if(node.value.trim()==='')continue;
   fields[key]=Number(node.value);
  }else fields[key]=node.value;
 }
 return fields;
}
