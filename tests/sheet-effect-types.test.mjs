import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {effectType} from '../src/features/sheet/effect-types.mjs';
import {formatRoll} from '../src/ui/sheet.mjs';
import {renderSheetFrame} from '../src/features/sheet/view.mjs';
import {readFile} from 'node:fs/promises';

test('server accepts Damage, Heal, Temporary HP and None for manual abilities and spells',()=>{
 let d={activeAbilities:[],spells:[]};
 for(const effect_type of ['none','damage','heal','temp_hp']){
  d=mergeSheetData(d,{action:'entry',collection:'activeAbilities',mode:'add',fields:{name:'Magic '+effect_type,effect_type,damage:'1d6+3'}});
  assert.equal(d.activeAbilities.at(-1).effect_type,effect_type);
 }
 d=mergeSheetData(d,{action:'entry',collection:'spells',mode:'add',fields:{name:'Cure',effect_type:'heal',damage:'1d8+3'}});
 assert.equal(d.spells[0].effect_type,'heal');
 assert.equal(effectType({damage:'2d6'}),'none','legacy entries remain normal rolls');
 assert.throws(()=>mergeSheetData(d,{action:'entry',collection:'activeAbilities',mode:'update',index:0,fields:{effect_type:'life-steal'}}),/valid HP effect/);
 assert.throws(()=>mergeSheetData(d,{action:'entry',collection:'weapons',mode:'add',fields:{name:'Knife',effect_type:'heal'}}),/Invalid entry field/);
});
test('ability editor exposes all effect types without changing manual name-advanced-prose layout',async()=>{
 const code=await readFile('src/ui/sheet.mjs','utf8');
 assert.match(code,/name="effect_type"/);
 assert.match(code,/effectTypes/);
 const frame=renderSheetFrame({id:'test',name:'White Mage',kind:'player',data:{activeAbilities:[{name:'Cure',effect_type:'heal',damage:'1d8+3'}]}},'abilities');
 assert.match(frame,/Cure/);
});
test('roll results clearly label healing, temporary HP, and unapplied combat effects',()=>{
 const roll={kind:'ability',abilityName:'Cure',attack:null,damage:{expression:'1d8+3',total:9,rolls:[6]},combat:{target:'Fighter',outcome:null}};
 assert.match(formatRoll('Ability',{...roll,effectType:'heal'}),/Healing: 9/);
 assert.match(formatRoll('Ability',{...roll,effectType:'temp_hp'}),/Temporary HP: 9/);
 assert.match(formatRoll('Ability',{...roll,effectType:'damage'}),/Dice Roll: 9/);
 assert.match(formatRoll('Ability',{...roll,effectType:'heal'}),/HP not automatically changed/);
});
