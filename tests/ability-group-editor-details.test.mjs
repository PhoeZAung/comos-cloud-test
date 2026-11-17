import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {abilityGroupEditorKeys} from '../src/features/sheet/ability-groups.mjs';
import {renderAbilityEditorTabs} from '../src/features/sheet/entry-editor-tabs.mjs';

const base={name:'Elemental arsenal',u_curr:2,u_max:3,restoreOnLongRest:true};
const values={...base,ability_kind:'other',desc:'Group description',effect:'Shared lore',at_higher_lvls:'More lore',link:'https://example.org/ability',
 action_type:'Standard',range:'30 ft',duration:'1 round',target:'one foe',effect_type:'damage',attack_type:'none',attack_misc:2,attack_bonus_override:'',
 damage:'2d6',damage_types:['Fire'],saving_throw:'Reflex half',save_type:'ref',save_success:'half',
 save_success_damage:'1d6',save_dc_override:15,dc_formula:'10 + level',casting_ability:'int',dc_misc:1,caster_level:'',sr_bonus:0,spell_resist:'yes'};

test('ability groups show the existing Details, Combat, Saves and Resources editor tabs',()=>{
 const html=renderAbilityEditorTabs(abilityGroupEditorKeys,key=>'<input name="'+key+'">');
 for(const [id,label] of [['details','Details'],['combat','Combat'],['saves','Saves'],['resources','Resources']]){
  assert.match(html,new RegExp('data-entry-edit-tab="'+id+'"[^>]*>'+label+'</button>'));
 }
 for(const field of ['name','desc','effect','damage','save_type','save_success','save_dc_override','u_curr','u_max','restoreOnLongRest']){
  assert.match(html,new RegExp('name="'+field+'"'));
 }
});

test('group combat and save metadata survive edits without changing member abilities or shared usage',()=>{
 const original={activeAbilities:[{name:'Blaze',damage:'1d4'},{name:'Frost'}]};
 let saved=mergeSheetData(original,{action:'abilityGroup',mode:'add',collection:'activeAbilities',fields:values});
 const id=saved.abilityGroups[0].id;
 assert.deepEqual(saved.abilityGroups[0].damage_types,['Fire']);
 assert.equal(saved.abilityGroups[0].save_dc_override,15);
 assert.deepEqual(saved.activeAbilities,original.activeAbilities);
 saved=mergeSheetData(saved,{action:'abilityGroup',mode:'move',collection:'activeAbilities',id,index:0});
 saved=mergeSheetData(saved,{action:'useAbility',collection:'activeAbilities',index:0});
 assert.equal(saved.abilityGroups[0].u_curr,1);
 assert.equal(saved.activeAbilities[0].damage,'1d4');
 saved=mergeSheetData(saved,{action:'abilityGroup',mode:'update',collection:'activeAbilities',id,fields:{...base,u_curr:1,desc:'Updated',save_dc_override:''}});
 assert.equal(saved.abilityGroups[0].desc,'Updated');
 assert.equal(saved.abilityGroups[0].damage,'2d6');
 assert.equal(saved.abilityGroups[0].save_dc_override,'');
 assert.equal(saved.abilityGroups[0].u_curr,1);
});

test('group editor rejects unsafe or invalid combat and save details',()=>{
 for(const fields of [
  {...values,action_type:'Invalid action'}, {...values,save_type:'not_a_save'},
  {...values,damage_types:['Other']}, {...values,link:'javascript:alert(1)'},
  {...values,save_dc_override:0}, {...values,attack_bonus_override:1.5},
  {...values,desc:'X'.repeat(100001)}, {...values,unknown:'bad'}
 ]){
  assert.throws(()=>mergeSheetData({}, {action:'abilityGroup',mode:'add',collection:'feats',fields}));
 }
});
