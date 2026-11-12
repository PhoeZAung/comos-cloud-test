import test from 'node:test';
import assert from 'node:assert/strict';
import {combatVerdict,combatEventVerdict} from '../src/features/sheet/combat-verdict.mjs';
import {formatRoll} from '../src/ui/sheet.mjs';
import {readFile} from 'node:fs/promises';

const roll={kind:'weapon',weaponName:'Longsword',rolls:[4],total:9,expression:'1d20+5',damage:{expression:'1d8',rolls:[6],total:6}};
test('a missed attack always displays MISS and indicates no HP change',()=>{
 const r={...roll,combat:{target:'Goblin',outcome:'Miss',applied:true,hit:false,amount:0}};
 assert.deepEqual(combatVerdict(r),{label:'MISS',tone:'miss',detail:'No HP lost on a missed attack'});
 assert.match(formatRoll('Longsword',r),/No HP change/);
 assert.equal(combatEventVerdict({kind:'damage',source:'weapon',hit:false,reason:'Miss'}),'MISS');
});
test('a hit with 0 damage due to DR remains a HIT',()=>{
 const r={...roll,combat:{target:'Golem',outcome:'Hit',reason:'Hit',applied:true,hit:true,amount:0}};
 assert.equal(combatVerdict(r).label,'HIT');
 assert.match(combatVerdict(r).detail,/no effective HP change/);
 assert.match(formatRoll('Longsword',r),/0 effective HP/);
 assert.equal(combatEventVerdict({kind:'damage',source:'weapon',hit:true,reason:'Hit',amount:0}),'HIT');
});
test('spell resistance, saving throws, GM validation, and incomplete resolution are distinct',()=>{
 assert.equal(combatVerdict({...roll,combat:{target:'Enemy',reason:'Spell resisted'}}).label,'RESISTED');
 assert.equal(combatVerdict({...roll,combat:{target:'Enemy',reason:'Save negated'}}).label,'SAVED');
 assert.equal(combatVerdict({...roll,combat:{target:'Enemy',outcome:'Hit',pending:true}}).label,'HIT · GM REVIEW');
 assert.equal(combatVerdict({...roll,combat:{target:'Enemy',outcome:'Hit',note:'No HP updated'}}).label,'HIT · REVIEW');
 assert.equal(combatEventVerdict({kind:'damage',reason:'Spell resisted',hit:false}),'RESISTED');
 assert.equal(combatEventVerdict({kind:'damage',reason:'Save negated',hit:false}),'SAVED');
});
test('hit and miss badges are applied in the existing post-dice present() callback',async()=>{
 const code=await readFile('src/ui/sheet.mjs','utf8');
 assert.match(code,/const present=\(\)=>/);
 assert.match(code,/const verdict=combatVerdict\(r\)/);
 assert.match(code,/current\.prepend\(banner\)/);
 assert.match(code,/void showDice\(r,\{onResult:present\}\)/);
 const css=await readFile('src/styles/sheet-refinements.css','utf8');
 assert.match(css,/cs-combat-indicator-miss/);
 assert.match(css,/cs-combat-indicator-hit/);
});
