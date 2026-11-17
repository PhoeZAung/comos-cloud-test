import test from 'node:test';
import assert from 'node:assert/strict';
import {entryDetail,abilityGroupPreview} from '../src/features/sheet/view.mjs';

test('untracked weapon previews do not render empty ammunition or saving throw sections',()=>{
 const html=entryDetail({
  name:'Training blade',attack_type:'melee',damage:'1d6',
  ammoType:'none',u_curr:0,u_max:0,save_type:'none',save_success:'manual',
  save_dc_override:0,weight:0,cost:'0',desc:'none'
 },{},'weapons');
 assert.doesNotMatch(html,/<h3>Ammunition<\/h3>/);
 assert.doesNotMatch(html,/<h3>Saves<\/h3>/);
 assert.doesNotMatch(html,/<dt>Ammo<\/dt>|<dt>Max Ammo<\/dt>/);
 assert.doesNotMatch(html,/<dt>Weight<\/dt>|<dt>Cost<\/dt>/);
 assert.match(html,/<h3>Damage<\/h3>/);
 assert.match(html,/1d6/);
 assert.doesNotMatch(html,/<h3>Description<\/h3>/);
});

test('zero rounds remain visible when ammunition capacity is actually configured',()=>{
 const html=entryDetail({
  name:'Shortbow',attack_type:'ranged',damage:'1d6',
  ammoType:'Arrows',u_curr:0,u_max:6
 },{},'weapons');
 assert.match(html,/<h3>Ammunition<\/h3>/);
 assert.match(html,/<dt>Ammo Type<\/dt><dd>Arrows<\/dd>/);
 assert.match(html,/<dt>Ammo<\/dt><dd>0 \/ 6<\/dd>/);
 assert.match(html,/<dt>Max Ammo<\/dt><dd>6<\/dd>/);
 const npc=entryDetail({name:'NPC blade',ammoType:null,u_curr:0,u_max:0}, {},'weapons',{npc:true});
 assert.doesNotMatch(npc,/<h3>Ammunition<\/h3>/);
});

test('empty or placeholder ability values do not create preview sections',()=>{
 const html=entryDetail({
  name:'Empty ability',action_type:'none',effect_type:'none',
  attack_type:'none',damage:'none',save_dc_override:0,
  attack_bonus_override:0,spell_resist:'none',desc:'none',
  effect:null,at_higher_lvls:'0',attrs:[{name:'Empty attr',val:0}]
 },{},'activeAbilities');
 assert.doesNotMatch(html,/<h3>Action & targeting<\/h3>/);
 assert.doesNotMatch(html,/<h3>Attack & damage<\/h3>/);
 assert.doesNotMatch(html,/<h3>Other details<\/h3>/);
 assert.doesNotMatch(html,/cs-entry-calcs/);
 assert.doesNotMatch(html,/<h3>Description<\/h3>|<h3>Effect<\/h3>/);
 assert.doesNotMatch(html,/<dd>none<\/dd>|<dd>0<\/dd>/i);
 assert.doesNotMatch(html,/<dt>Empty attr<\/dt>/);
 const configured=entryDetail({name:'Spark',action_type:'Standard',damage:'2d6',save_dc_override:15,desc:'Lightning'}, {},'activeAbilities');
 assert.match(configured,/Action type<\/dt><dd>Standard/);
 assert.match(configured,/2d6/);
 assert.match(configured,/Save DC/);
 assert.match(configured,/<h3>Description<\/h3>/);
});

test('empty group preview omits entire unconfigured detail, combat, saves and resource sections',()=>{
 const empty=abilityGroupPreview({name:'Blank group',action_type:'none',ability_kind:'none',
  effect_type:'none',damage:'0',damage_types:['none',0],attack_misc:0,
  save_type:'none',save_success:'manual',save_dc_override:0,
  u_curr:0,u_max:0,desc:'none',effect:'0',restoreOnLongRest:true
 });
 for(const title of ['Details','Combat','Saves','Resources'])assert.doesNotMatch(empty,new RegExp('<h3>'+title+'</h3>'));
 assert.doesNotMatch(empty,/<dt>Shared uses<\/dt>|<dd>None<\/dd>|<dd>0<\/dd>/);
 const depleted=abilityGroupPreview({name:'Depleted',u_curr:0,u_max:3,restoreOnLongRest:false});
 assert.match(depleted,/<h3>Resources<\/h3>/);
 assert.match(depleted,/<dt>Shared uses<\/dt><dd>0 \/ 3<\/dd>/);
 assert.match(depleted,/<dt>Restore uses on rest<\/dt><dd>No<\/dd>/);
});
