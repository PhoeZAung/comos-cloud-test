import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderSheetFrame,renderSection,collectionBlock,entryDetail,actionIcon} from '../src/features/sheet/view.mjs';

const data={activeAbilities:[
 {name:'Alpha',desc:'First',action_type:'Standard',u_curr:1,u_max:2},
 {name:'Beta',desc:'Second',action_type:'',type:'Move',u_curr:0,u_max:2},
 {name:'Gamma',desc:'Third',action_type:'Swift',u_curr:2,u_max:2}
],passiveAbilities:[{name:'Permanent'}],weapons:[{name:'Sword',desc:'A sword',u_curr:0,u_max:3}]};

test('reorder saves selected ability order and retains all row data without touching weapons',()=>{
 const moved=mergeSheetData(data,{action:'reorderAbility',collection:'activeAbilities',from:0,to:2});
 assert.deepEqual(moved.activeAbilities.map(row=>row.name),['Beta','Gamma','Alpha']);
 assert.deepEqual(moved.activeAbilities[2],data.activeAbilities[0]);
 assert.equal(moved.weapons[0].u_curr,0);
 assert.deepEqual(data.activeAbilities.map(row=>row.name),['Alpha','Beta','Gamma']);
 const backward=mergeSheetData(moved,{action:'reorderAbility',collection:'activeAbilities',from:2,to:0});
 assert.deepEqual(backward.activeAbilities.map(row=>row.name),['Alpha','Beta','Gamma']);
 for(const bad of [
  {collection:'weapons',from:0,to:0},
  {collection:'skills',from:0,to:0},
  {collection:'activeAbilities',from:-1,to:0},
  {collection:'activeAbilities',from:0,to:3},
  {collection:'activeAbilities',from:0.3,to:1}
 ])assert.throws(()=>mergeSheetData(data,{action:'reorderAbility',...bad}),/ability|reorder/i);
 assert.throws(()=>mergeSheetData({activeAbilities:[{name:'Ultimate',limitBreak:true},{name:'Strike'}]},{action:'reorderAbility',collection:'activeAbilities',from:0,to:1}),/Cannot reorder/);
});

test('active, passive, racial and feat lists present drag handles; other sections do not',()=>{
 const character={id:'hero',name:'Hero',data};
 const html=renderSection(character,'abilities',{ability:'activeAbilities'});
 assert.equal((html.match(/data-ability-drag=/g)||[]).length,3);
 assert.match(html,/data-ability-index="0"/);
 assert.match(html,/data-ability-drag="activeAbilities:2"/);
 assert.match(html,/Drag to reorder, or press arrow keys/);
 assert.doesNotMatch(collectionBlock('weapons',data),/data-ability-drag/);
 assert.doesNotMatch(renderSection(character,'favorites'),/data-ability-drag/);
 assert.doesNotMatch(collectionBlock('activeAbilities',data,'Al'),/data-ability-drag/);
});

test('an explicit empty action shows no icon, even with a legacy type',()=>{
 assert.equal(actionIcon({name:'Beta',action_type:'',type:'Move'}),'');
 assert.match(actionIcon({action_type:'Standard'}),/cs-action-standard/);
 assert.match(actionIcon({type:'Move'}),/cs-action-move/);
 const popup=entryDetail({name:'Beta',desc:'Long text',action_type:'',type:'Move',attack_type:'ranged',damage:'1d8'},data,'activeAbilities');
 assert.match(popup,/Action &amp; targeting|Action & targeting/);
 assert.match(popup,/Attack &amp; damage|Attack & damage/);
 assert.ok(popup.indexOf('cs-entry-meta-groups')>0);
 assert.ok(popup.indexOf('cs-entry-meta-groups')<popup.indexOf('cs-entry-prose'));
 assert.match(popup,/None/);
});

test('weapon collapse is an icon and Owlbear gets a dedicated slider to Notes',()=>{
 const character={id:'hero',name:'Hero',data};
 const combat=renderSection(character,'combat');
 assert.match(combat,/class="cs-weapons-toggle"/);
 assert.match(combat,/data-collapse-weapons aria-expanded="true"/);
 assert.doesNotMatch(combat,/>Collapse weapons<\/button>/);
 const regular=renderSheetFrame(character,'notes');
 const owlbear=renderSheetFrame(character,'notes',{owlbear:true});
 assert.doesNotMatch(regular,/data-owlbear-section-slider/);
 assert.match(owlbear,/data-owlbear-section-slider min="0" max="5" step="1" value="5"/);
 assert.match(owlbear,/Navigate sheet sections; slide to Notes/);
});

test('rich text controls start collapsed and narrative in popups can grow without nested scrolling',async()=>{
 const ui=await readFile(new URL('../src/ui/sheet.mjs',import.meta.url),'utf8');
 const css=await readFile(new URL('../src/styles/sheet-refinements.css',import.meta.url),'utf8');
 assert.match(ui,/<details class="cs-rich-tools">/);
 assert.doesNotMatch(ui,/<details class="cs-rich-tools" open/);
 assert.match(ui,/\['left','Align left','L'\]/);
 assert.match(ui,/\['right','Align right','R'\]/);
 assert.match(ui,/None \(no icon\)/);
 assert.match(ui,/data-ability-drag/);
 assert.match(ui,/setPointerCapture/);
 assert.match(ui,/data-owlbear-section-slider/);
 assert.match(css,/\.cs-entry-popup \.cs-prose[^}]*max-height:none;overflow:visible/);
 const long='An important detail. '.repeat(350);
 const popup=entryDetail({name:'Long',desc:long,effect:'**Bold effect**',at_higher_lvls:'- Bigger'},data,'passiveAbilities');
 assert.ok(popup.includes(long));
 assert.match(popup,/<strong>Bold effect<\/strong>/);
 assert.match(popup,/<li>Bigger<\/li>/);
 const weapon=entryDetail({name:'Bow',desc:long},data,'weapons');
 assert.ok(weapon.includes(long));
});
