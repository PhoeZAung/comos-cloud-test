import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderSection,entryDetail,actionIcon} from '../src/features/sheet/view.mjs';
import {actionTypes,damageTypes} from '../src/features/sheet/entry-options.mjs';

test('weapon damage tags and misfire preserve attack math and usage validation',()=>{
 const initial={weapons:[{name:'Gunblade',attack_type:'ranged',damage:'1d8',u_curr:2,u_max:6}],activeAbilities:[]};
 const next=mergeSheetData(initial,{action:'entry',collection:'weapons',mode:'update',index:0,fields:{damage_types:['Piercing','Fire','Good','Piercing'],misfire:'1–2',u_curr:3,u_max:8}});
 assert.deepEqual(next.weapons[0].damage_types,['Piercing','Fire','Good']);assert.equal(next.weapons[0].misfire,'1–2');assert.equal(next.weapons[0].damage,'1d8');assert.equal(next.weapons[0].attack_type,'ranged');
 for(const value of ['Slashing',['Unrecognized'],[{}]])assert.throws(()=>mergeSheetData(initial,{action:'entry',collection:'weapons',mode:'update',index:0,fields:{damage_types:value}}),/damage types/);
 assert.throws(()=>mergeSheetData(next,{action:'entry',collection:'weapons',mode:'update',index:0,fields:{u_curr:9}}),/maximum uses/);
 assert.deepEqual(damageTypes.slice(0,3),['Bludgeoning','Piercing','Slashing']);assert.ok(damageTypes.indexOf('Good')>damageTypes.indexOf('Shadow'));assert.deepEqual(damageTypes.slice(-3),['Poison','Mental','Precision']);
});

test('all ability action types and separate effect prose survive updates without overwriting legacy feature type',()=>{
 const original={activeAbilities:[{name:'Ward',type:'Su',desc:'Original description.'}]};
 for(const action of actionTypes){const data=mergeSheetData(original,{action:'entry',collection:'activeAbilities',mode:'update',index:0,fields:{action_type:action,effect:'Shield <script>ignored</script>',at_higher_lvls:'Grows at level 5.'}});assert.equal(data.activeAbilities[0].type,'Su');assert.equal(data.activeAbilities[0].action_type,action);const detail=entryDetail(data.activeAbilities[0],data,'activeAbilities');assert.match(detail,/cs-entry-prose/);assert.match(detail,/&lt;script&gt;/);assert.doesNotMatch(detail,/<script>/);assert.match(detail,/Grows at level 5/);}
 assert.throws(()=>mergeSheetData(original,{action:'entry',collection:'activeAbilities',mode:'update',index:0,fields:{action_type:'Invented'}}),/action type/);
 const swift=actionIcon({action_type:'Swift'}),immediate=actionIcon({action_type:'Immediate'});assert.equal(swift.slice(swift.indexOf('<svg')),immediate.slice(immediate.indexOf('<svg')));assert.match(swift,/cs-action-swift/);assert.match(immediate,/cs-action-immediate/);
});

test('weapon/ability names open dialogs, keep independent editors and order action icons between them',()=>{
 const data={weapons:[{name:'Sword',damage:'1d6'}],activeAbilities:[{name:'Ward',action_type:'Immediate'}]};
 const combat=renderSection({data},'combat');assert.match(combat,/data-collapse-weapons aria-expanded="true"/);assert.match(combat,/data-entry-preview="weapons:0"/);assert.doesNotMatch(combat,/data-entry-details="weapons:0"/);
 const ability=renderSection({data},'abilities');assert.match(ability,/data-entry-preview="activeAbilities:0"/);assert.doesNotMatch(ability,/data-entry-details="activeAbilities:0"/);assert.ok(ability.indexOf('Ward')<ability.indexOf('cs-action-immediate'));assert.ok(ability.indexOf('cs-action-immediate')<ability.indexOf('data-edit-entry="activeAbilities:0"'));
});
