import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderSheetFrame,abilityGroupPreview} from '../src/features/sheet/view.mjs';

const group={
 id:'g-test-123',collection:'activeAbilities',name:'Elemental <Arsenal>',
 u_curr:2,u_max:3,restoreOnLongRest:true,ability_kind:'sp',
 desc:'**A shared collection** with <unsafe> text',effect:'Fire and ice',
 action_type:'Standard',damage:'2d6',damage_types:['Fire','Ice'],
 save_type:'ref',save_success:'half',save_dc_override:15,
 link:'https://example.com/rules'
};

test('group name opens the same ability preview while keeping drag and edit separate',()=>{
 const frame=renderSheetFrame({
  id:'hero',name:'Hero',kind:'player',owned:true,
  data:{activeAbilities:[{name:'Blaze',abilityGroupId:group.id}],abilityGroups:[group]}
 },'abilities',{ability:'activeAbilities'});
 assert.ok(frame.includes('data-ability-group-card="g-test-123"'));
 assert.ok(frame.includes('data-ability-group-preview="g-test-123"'));
 assert.ok(frame.includes('class="cs-entry-preview cs-group-name-preview"'));
 assert.ok(frame.includes('aria-haspopup="dialog"'));
 assert.ok(frame.includes('data-edit-ability-group="g-test-123"'));
 assert.ok(frame.includes('data-group-drag="g-test-123"'));
 assert.ok(frame.includes('&lt;Arsenal&gt;'));
 const code=readFileSync(new URL('../src/ui/sheet.mjs',import.meta.url),'utf8');
 assert.ok(code.includes("if(button.matches('[data-ability-group-preview]'))"));
 assert.ok(code.includes('openAbilityGroupPreview(button.dataset.abilityGroupPreview)'));
 assert.ok(code.includes("popup.querySelector('[data-entry-popup-content]').innerHTML=abilityGroupPreview(group)"));
 assert.ok(code.includes('popup.showModal()'));
});

test('group preview renders saved details, combat, saves, resources and rich text',()=>{
 const html=abilityGroupPreview(group);
 for(const section of ['Details','Combat','Saves','Resources']){
  assert.ok(html.includes('<h3>'+section+'</h3>'));
 }
 assert.ok(html.includes('<dt>Shared uses</dt><dd>2 / 3</dd>'));
 assert.ok(html.includes('<dt>Restore uses on rest</dt><dd>Yes</dd>'));
 assert.ok(html.includes('<dt>Action type</dt><dd>Standard</dd>'));
 assert.ok(html.includes('<dt>Dice Roll</dt><dd>2d6</dd>'));
 assert.ok(html.includes('<dt>Save type</dt><dd>Reflex</dd>'));
 assert.ok(html.includes('<dt>Save DC</dt><dd>15</dd>'));
 assert.ok(html.includes('<strong>A shared collection</strong>'));
 assert.ok(html.includes('&lt;unsafe&gt;'));
 assert.ok(!html.includes('<unsafe>'));
 assert.ok(html.includes('href="https://example.com/rules"'));
 assert.ok(!html.includes('data-roll=')&&!html.includes('data-entry-use='));
 const legacy=abilityGroupPreview({name:'Legacy',u_curr:0,u_max:0});
 assert.ok(legacy.includes('<dt>Shared uses</dt><dd>0 / 0</dd>'));
 assert.ok(legacy.includes('<dt>Restore uses on rest</dt><dd>Yes</dd>'));
});

test('group preview does not interpret saved HTML or unsafe links',()=>{
 const html=abilityGroupPreview({
  ...group,damage:'"><img src=x onerror=alert(1)>',
  link:'javascript:alert(1)',desc:'<script>alert(1)</script>'
 });
 assert.ok(!html.includes('<script>')&&!html.includes('<img'));
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(html.includes('&lt;img'));
 assert.ok(!html.includes('href="javascript:'));
});
