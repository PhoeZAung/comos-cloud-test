import test from 'node:test';import assert from 'node:assert/strict';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderSheetFrame,renderSection} from '../src/features/sheet/view.mjs';
import {renderCharacterRoster} from '../src/features/characters/roster.mjs';
const data={class:'Black Mage',classes:[{name:'Black Mage',level:1}],level:1,int:10,hp_max:6,hp_curr:1,mp_class:3,mp_bonus:0,skills:[{name:'Appraise',stat:'int',lvl:1,cs:true},{name:'Craft',stat:'int',lvl:1,cs:true},{name:'Craft',stat:'int',lvl:1,cs:true},{name:'Craft',stat:'int',lvl:1,cs:true}],items:[{name:'Potion',desc:'Exact imported text.\nSecond line.'}],bio:'Full biography'};
test('favorite boxes, skills and items persist and appear in favorites without exposing extra controls by default',()=>{let d=mergeSheetData(data,{action:'fields',fields:{favorite_boxes:['bio']}});d=mergeSheetData(d,{action:'entry',collection:'skills',index:0,mode:'update',fields:{favorite:true}});d=mergeSheetData(d,{action:'entry',collection:'items',index:0,mode:'update',fields:{favorite:true}});const html=renderSection({id:'x',name:'Test',data:d},'favorites');for(const name of ['Full biography','Appraise','Potion'])assert.match(html,new RegExp(name));const frame=renderSheetFrame({id:'x',name:'Test',data:d},'skills');assert.match(frame,/cs-star-controls-off/);assert.match(frame,/data-toggle-stars/);assert.doesNotMatch(frame,/Unused Skill Points|Ability \+ ranks/);assert(frame.indexOf('cs-roll-tools')<frame.indexOf('aria-label="Character sheet"'));});
test('skill edits cannot overspend and managed progression fields cannot be changed',()=>{assert.throws(()=>mergeSheetData(data,{action:'entry',collection:'skills',index:4,mode:'update',fields:{lvl:1}}),/No skill points/);for(const key of ['hp_max','mp_class','mp_bonus','bab'])assert.throws(()=>mergeSheetData({...data,rulesBuild:{input:{}}},{action:'fields',fields:{[key]:999}}),/calculated/);});
test('character cards have no separate edit or open-sheet action',()=>{for(const view of ['carousel','list']){const html=renderCharacterRoster({view,characters:[{id:'x',name:'Test'}]});assert.doesNotMatch(html,/>Open sheet<|>Edit<|aria-label="Edit /);assert.match(html,/data-select-character|sheet.html\?characterId=/);}});

test('character sheet exposes a separately labeled, confirmable deletion action',()=>{
 const html=renderSheetFrame({id:'123e4567-e89b-42d3-a456-426614174000',name:'Test character',data},'overview');
 assert.match(html,/data-delete-character aria-label="Delete character"/);
 assert.match(html,/title="Delete character \\(archive\\)"/);
 assert.match(html,/data-level-up=/);
});
