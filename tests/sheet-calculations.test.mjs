import test from 'node:test';import assert from 'node:assert/strict';
import {arithmetic,entryCalculations,damageExpression,diceTerms} from '../src/features/sheet/calculations.mjs';
import {sheetSkills,fixedSkills} from '../src/features/sheet/skills.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {serverRoll} from '../backend/characters/rolls.mjs';
import {renderSection,renderSheetFrame,entryDetail} from '../src/features/sheet/view.mjs';
const d={classes:[{name:'Black Mage',level:6}],int:18,dex:14,str:10,spell_dc_base:'int',bab:3,ar_ranged_touch_temp:1,mp:8,mp_temp:2,mp_class:10,mp_bonus:3,mp_max_spell_level:3,spells:[{name:'Fire',lvl:'2',attack_type:'ranged_touch',damage:'{CL}d6 + {INT}',range:'Close'}],activeAbilities:[{name:'Power',u_curr:2,u_max:3,uses_formula:'{INT}+{CL}/2',dc_formula:'10 + {LEVEL}/2 + {INT}'}]};
test('spell and ability calculations use modifiers, matched caster levels and explicit formulas',()=>{
 const s=entryCalculations(d.spells[0],d,'spells');assert.equal(s.dc,16);assert.equal(s.mp,2);assert.equal(s.attack.bonus,6);assert.equal(s.range,'40 ft');assert.equal(s.concentration,10);assert.equal(entryCalculations({lvl:2},{classes:d.classes},'spells').dc,null);assert.throws(()=>arithmetic('{INT}+1',entryCalculations({}, {classes:d.classes},'activeAbilities').ctx));assert.equal(damageExpression(d.spells[0].damage,s.ctx),'6d6 + 4');
 const a=entryCalculations(d.activeAbilities[0],d,'activeAbilities');assert.equal(a.dc,17);assert.equal(a.maxUses,7);assert.equal(a.currentUses,2);
 const multi={...d,classes:[{name:'Black Mage',level:4},{name:'White Mage',level:2}]};assert.equal(entryCalculations({lvl:1},multi,'spells').ctx.CL,undefined);assert.throws(()=>damageExpression('{CL}d6',entryCalculations({lvl:1},multi,'spells').ctx));assert.equal(entryCalculations({lvl:1,sourceClass:'White Mage'},multi,'spells').ctx.CL,2);assert.equal(entryCalculations({lvl:1,caster_level:5},multi,'spells').ctx.CL,5);
});
test('bounded arithmetic and typed damage reject executable or excessive expressions',()=>{
 assert.equal(arithmetic('10+{LEVEL}/2+{INT}',{LEVEL:5,INT:4}),16);assert.equal(arithmetic('-3/2'),-2);assert.equal(damageExpression('({CL}/2)d6 + {INT}',{CL:5,INT:-1}),'2d6 -1');
 for(const x of ['globalThis.fetch(1)','1/0','2**3','({MISSING})','1e10','1;alert(1)'])assert.throws(()=>arithmetic(x));
 const terms=diceTerms('2d6 fire + 1d4 cold - 2');assert.equal(terms[0].type,'fire');assert.equal(terms[1].sides,4);assert.equal(terms[2].sign,-1);for(const x of ['99d6','1d9999','1d6+alert(1)','1d6+-2'])assert.throws(()=>diceTerms(x));
 const roll=serverRoll('2d6 fire + 1d4 cold + 3');assert.equal(roll.rolls.length,3);assert.ok(roll.total>=6&&roll.total<=19);assert.equal(roll.breakdown[0].type,'fire');
});
test('casting and ability use spend resources once per merge, consume temp MP first, and preserve data',()=>{
 const cast=mergeSheetData(d,{action:'cast',index:0});assert.equal(cast.mp,8);assert.equal(cast.mp_temp,0);assert.equal(cast.mp_curr,8);assert.equal(d.mp_temp,2);assert.equal(mergeSheetData({...d,mp:-2,mp_temp:5},{action:'cast',index:0}).mp_curr,1);assert.deepEqual(cast.spells,d.spells);
 assert.throws(()=>mergeSheetData({...d,mp:0,mp_temp:1},{action:'cast',index:0}),/Not enough/);assert.throws(()=>mergeSheetData({...d,int:10},{action:'cast',index:0}),/score/);assert.throws(()=>mergeSheetData({...d,mp_max_spell_level:1},{action:'cast',index:0}),/maximum/);
 const use=mergeSheetData(d,{action:'useAbility',index:0});assert.equal(use.activeAbilities[0].u_curr,1);assert.equal(mergeSheetData(use,{action:'rest'}).activeAbilities[0].u_curr,7);assert.throws(()=>mergeSheetData({...d,activeAbilities:[{...d.activeAbilities[0],u_curr:0}]},{action:'useAbility',index:0}),/No uses/);
});
test('fixed skills materialize for new sheets, preserve imported records and cannot be added, deleted or renamed',()=>{
 const original={...d,skills:[{name:'Spellcraft',stat:'int',lvl:2,cs:true,temp:1,legacy:'keep'}]};const rows=sheetSkills(original);assert.equal(rows.length,fixedSkills.length);assert.equal(rows[0].legacy,'keep');assert.equal(sheetSkills({skills:rows}).length,rows.length);
 const changed=mergeSheetData(original,{action:'entry',collection:'skills',index:0,mode:'update',fields:{lvl:3,temp:2}});assert.equal(changed.skills[0].legacy,'keep');assert.equal(changed.skills[0].lvl,3);
 for(const change of [{mode:'add',fields:{name:'New',stat:'int'}},{mode:'remove',index:0},{mode:'update',index:0,fields:{name:'Renamed'}},{mode:'update',index:0,fields:{lvl:7}}])assert.throws(()=>mergeSheetData(original,{action:'entry',collection:'skills',...change}));
});
test('compact category selector and expanded calculation controls avoid list clutter',()=>{
 const c={id:'sample',name:'Mage',data:d},frame=renderSheetFrame(c,'abilities');assert.match(frame,/select data-ability-category/);assert.doesNotMatch(frame,/aria-label="Ability categories"/);const skills=renderSection(c,'skills');assert.doesNotMatch(skills,/data-add-entry="skills"/);assert.match(skills,/Spellcraft/);
 const details=entryDetail(d.spells[0],d,'spells');assert.match(details,/Save DC/);assert.match(details,/>16</);assert.match(details,/Cast · 2 MP/);assert.match(details,/6d6 \+ 4/);assert.match(details,/concentration/);
});
