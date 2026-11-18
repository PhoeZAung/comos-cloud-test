import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {targetDefenseForAttack} from '../src/features/sheet/target-defense.mjs';
import {renderAbilityEditorTabs,renderWeaponEditorTabs} from '../src/features/sheet/entry-editor-tabs.mjs';
import {abilityGroupEditorKeys} from '../src/features/sheet/ability-groups.mjs';
import {resolveCombatTarget,attackOutcome} from '../src/owlbear/combat-target.mjs';

test('ability, spell, and group combat editors show target defense beside extra attack bonus',()=>{
 const html=renderAbilityEditorTabs(['attack_type','attack_misc','target_defense','attack_bonus_override'],key=>'<input name="'+key+'">');
 assert.ok(html.indexOf('name="attack_misc"')<html.indexOf('name="target_defense"'));
 assert.ok(html.indexOf('name="target_defense"')<html.indexOf('name="attack_bonus_override"'));
 assert.ok(abilityGroupEditorKeys.includes('target_defense'));
 assert.match(readFileSync(new URL('../src/owlbear/sheet.mjs',import.meta.url),'utf8'),/target_defense:row\.target_defense/);
});

test('automatic preserves legacy defense and selected AC can override attack type',()=>{
 assert.equal(targetDefenseForAttack({attack_type:'ranged'}),'ac');
 assert.equal(targetDefenseForAttack({attack_type:'ranged_touch'}),'touch');
 assert.equal(targetDefenseForAttack({attack_type:'touch'}),'touch');
 assert.equal(targetDefenseForAttack({attack_type:'ranged',target_defense:'auto'}),'ac');
 assert.equal(targetDefenseForAttack({attack_type:'ranged',target_defense:'touch'}),'touch');
 assert.equal(targetDefenseForAttack({attack_type:'ranged_touch',target_defense:'ac'}),'ac');
 assert.equal(targetDefenseForAttack({attack_type:'cmb',target_defense:'touch'}),'cmd');
 assert.equal(targetDefenseForAttack({attack_type:'ranged',target_defense:'flat'}),'flat');
 assert.equal(targetDefenseForAttack({attack_type:'melee',target_defense:'cmd'}),'cmd');
 assert.equal(targetDefenseForAttack({attack_type:'ranged',target_defense:'invalid'}),'ac');
});

test('saving and editing ability, spell and group target defense',()=>{
 let data={activeAbilities:[],spells:[]};
 data=mergeSheetData(data,{action:'entry',collection:'activeAbilities',mode:'add',fields:{name:'Pistol Shot',attack_type:'ranged',target_defense:'touch'}});
 data=mergeSheetData(data,{action:'entry',collection:'spells',mode:'add',fields:{name:'Ray',attack_type:'ranged_touch',target_defense:'auto'}});
 assert.equal(data.activeAbilities[0].target_defense,'touch');
 assert.equal(data.spells[0].target_defense,'auto');
 data=mergeSheetData(data,{action:'entry',collection:'activeAbilities',mode:'update',index:0,fields:{target_defense:'ac'}});
 assert.equal(data.activeAbilities[0].target_defense,'ac');
 const group={name:'Gunfire',u_max:2,u_curr:2,restoreOnLongRest:true,target_defense:'touch'};
 data=mergeSheetData(data,{action:'abilityGroup',mode:'add',collection:'activeAbilities',fields:group});
 assert.equal(data.abilityGroups[0].target_defense,'touch');
 data=mergeSheetData(data,{action:'entry',collection:'activeAbilities',mode:'update',index:0,fields:{target_defense:'flat'}});
 assert.equal(data.activeAbilities[0].target_defense,'flat');
 data=mergeSheetData(data,{action:'abilityGroup',mode:'add',collection:'activeAbilities',fields:{...group,name:'Grapple',target_defense:'cmd'}});
 assert.equal(data.abilityGroups[1].target_defense,'cmd');
 assert.throws(()=>mergeSheetData(data,{action:'entry',collection:'activeAbilities',mode:'update',index:0,fields:{target_defense:'invalid'}}),/valid target defense/);
 assert.throws(()=>mergeSheetData(data,{action:'abilityGroup',mode:'add',collection:'activeAbilities',fields:{...group,target_defense:'invalid'}}),/valid target defense/);
});

test('Owlbear checks Touch AC instead of Normal AC for selected firearm ability',()=>{
 const actor={id:'hero-token',siteId:'hero-sheet',name:'Hero',isNpc:false,available:true,visible:true};
 const foe={id:'foe-token',npcId:'foe-sheet',name:'Foe',isNpc:true,available:true,visible:true,ac:25,touch:12,cmd:21};
 const state={characterId:'hero-sheet',kind:'ability',battle:[actor,foe],turn:{id:actor.id},selection:[foe.id],ready:true};
 const ranged={effect_type:'damage',attack_type:'ranged',target_defense:'touch',damage:'1d8'};
 const touch=resolveCombatTarget({...state,row:ranged});
 const normal=resolveCombatTarget({...state,row:{...ranged,target_defense:'ac'}});
 assert.deepEqual([touch.defense,touch.ac],['touch',12]);
 assert.deepEqual([normal.defense,normal.ac],['ac',25]);
 assert.equal(attackOutcome({kind:'ability',attack:{rolls:[11],total:16}},touch),'Hit');
 assert.equal(attackOutcome({kind:'ability',attack:{rolls:[11],total:16}},normal),'Miss');
});

test('weapon editor exposes target defense adjacent to attack bonus, excluding ammunition',()=>{
 const render=(key)=>'<input name="'+key+'">';
 for(const [npc,keys] of [[false,['attack_type','ability_mod','attack_misc','target_defense']],[true,['attack_type','npcAttackBonus','target_defense']]]){
  const html=renderWeaponEditorTabs(keys,render,{npc});
  assert.match(html,/data-entry-edit-tab="stats"/);
  assert.match(html,/name="target_defense"/);
  assert.ok(html.indexOf('name="target_defense"')>html.indexOf('name="'+(npc?'npcAttackBonus':'attack_misc')+'"'));
 }
 const ammo=renderWeaponEditorTabs(['name','target_defense','amount'],render,{category:'Ammunition'});
 assert.doesNotMatch(ammo,/name="target_defense"/);
});

test('weapons preserve selected flat-footed and CMD defenses on player and NPC sheets',()=>{
 let player={weapons:[]};
 player=mergeSheetData(player,{action:'entry',collection:'weapons',mode:'add',fields:{name:'Heavy Crossbow',attack_type:'ranged',target_defense:'flat'}});
 assert.equal(player.weapons[0].target_defense,'flat');
 player=mergeSheetData(player,{action:'entry',collection:'weapons',mode:'update',index:0,fields:{target_defense:'cmd'}});
 assert.equal(player.weapons[0].target_defense,'cmd');
 let npc={weapons:[]};
 npc=mergeSheetData(npc,{action:'entry',collection:'weapons',mode:'add',fields:{name:'Tentacle',attack_type:'melee',npcAttackBonus:8,target_defense:'touch'}},{npc:true});
 assert.equal(npc.weapons[0].target_defense,'touch');
 assert.throws(()=>mergeSheetData(player,{action:'entry',collection:'weapons',mode:'update',index:0,fields:{target_defense:'not_an_ac'}}),/valid target defense/);
});

test('Owlbear chooses flat-footed and CMD values for weapons and abilities',()=>{
 const hero={id:'hero',siteId:'hero-sheet',name:'Hero',isNpc:false,visible:true,available:true};
 const enemy={id:'enemy',npcId:'npc-sheet',name:'Enemy',isNpc:true,visible:true,available:true,ac:24,touch:12,flat:17,cmd:28};
 const context={characterId:'hero-sheet',battle:[hero,enemy],turn:{id:'hero'},selection:['enemy'],ready:true};
 for(const kind of ['weapon','ability']){
  for(const [defense,expected] of [['flat',17],['cmd',28],['touch',12],['ac',24]]){
   const target=resolveCombatTarget({...context,kind,row:{attack_type:'ranged',effect_type:'damage',target_defense:defense,damage:'1d8'}});
   assert.deepEqual([target.defense,target.ac],[defense,expected]);
   assert.equal(attackOutcome({kind:'weapon',rolls:[10],total:18},target),18>=expected?'Hit':'Miss');
  }
 }
});
