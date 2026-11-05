import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {damageExpression,diceTerms,damageTypeTotals,damageTypeLine} from '../src/features/sheet/calculations.mjs';
import {serverRoll,weaponRoll,publishRoll,criticalResult} from '../backend/characters/rolls.mjs';
import {formatRoll} from '../src/ui/sheet.mjs';
import {renderSection,renderSheetFrame,actionIcon} from '../src/features/sheet/view.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharactersService} from '../backend/characters/service.mjs';

test('typed damage accepts adjacent dice and sums the same damage type',()=>{
 const expression=damageExpression('1d6 fire + 2 ice  1d8 fire');
 assert.equal(expression,'1d6 fire + 2 ice + 1d8 fire');
 const terms=diceTerms(expression);
 assert.deepEqual(terms.map(t=>t.type),['fire','ice','fire']);
 assert.equal(terms[1].flat,2);
 const result={expression,rolls:[1,2],total:5,breakdown:[
  {type:'Fire',dice:'1d6',rolls:[1],total:1},
  {type:'ice',total:2},
  {type:'fire',dice:'1d8',rolls:[2],total:2}
 ]};
 assert.deepEqual(damageTypeTotals(result),[{type:'fire',total:3},{type:'ice',total:2}]);
 assert.equal(damageTypeLine(result),'3 fire + 2 ice damage');
 assert.match(formatRoll('Elemental damage',result),/3 fire \+ 2 ice damage/);
 const crit=criticalResult({crit_range:'19-20',crit_mult:'x2'},{rolls:[20]},result,'1d20+1',()=>({rolls:[10],total:11,expression:'1d20+1'}));
 assert.equal(damageTypeLine(crit.damage),'6 fire + 4 ice damage');
 assert.deepEqual(damageTypeTotals({breakdown:[{type:'',total:7}]}),[]);
 assert.equal(damageTypeLine({breakdown:[{type:'Fire',total:3},{type:'',total:2}]}),'3 fire + 2 untyped damage');
 // The same parsing and breakdown also power ordinary dice rolls.
 const actual=serverRoll(expression);assert.equal(actual.total,actual.breakdown.reduce((sum,part)=>sum+part.total,0));
 assert.ok(actual.breakdown.some(part=>part.type==='ice'));
 assert.equal(damageTypeTotals(actual).length,2);
 assert.throws(()=>diceTerms('2d6 fire + JS code'),/Invalid dice term/);
});

test('weapon attack spends exactly one limited use and sends grouped elements to Discord',async()=>{
 const db=await openDatabase(':memory:');
 try {
  const user=createUserRepository(db).create(),id=randomUUID();
  createCharactersService(db).save({op:'save',id,revision:0,name:'Tester',ownerId:user.id,sources:[]});
  const data={str:10,dex:10,bab:2,weapons:[{name:'Elemental sword',attack_type:'melee',damage:'1d6 fire + 2 ice 1d8 fire',u_curr:1,u_max:1,crit_range:'20',crit_mult:'x2'}]};
  let payload='',calls=0;
  const makeWeaponRoll=(row,source)=>weaponRoll(row,source,expression=>{
   if(expression.startsWith('1d20'))return {expression,rolls:[7],bonus:2,total:9,breakdown:[]};
   return {expression,rolls:[1,2],bonus:2,total:5,breakdown:[{type:'fire',total:1},{type:'ice',total:2},{type:'fire',total:2}]};
  });
  const change={kind:'weapon',mode:'use',index:0,revision:1,discord:true,requestId:randomUUID()};
  const args={db,userId:user.id,character:{id,name:'Tester',revision:1,data},change,origin:'https://example.test',makeWeaponRoll,
   sendFetch:async(_url,{body})=>{payload+=JSON.parse(body).content;calls++;return {ok:true};}};
  const result=await publishRoll(args);
  assert.equal(result.roll.remainingUses,0);
  assert.match(payload,/3 fire \+ 2 ice damage/);
  assert.match(payload,/0 usage remaining/);
  assert.match(formatRoll('Weapon',result.roll),/3 fire \+ 2 ice damage/);
  assert.equal(JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id).data_json).weapons[0].u_curr,0);
  assert.deepEqual(await publishRoll({...args,character:{...args.character,revision:2}}),result);
  assert.equal(calls,1);
  db.prepare('UPDATE sheet_rolls SET created_at=0').run();
  const spent={...data,weapons:[{...data.weapons[0],u_curr:0}]};
  await assert.rejects(()=>publishRoll({...args,character:{...args.character,revision:2,data:spent},change:{...change,revision:2,requestId:randomUUID()}}),/No weapon uses remaining/);
 }finally{db.close();}
});

test('weapon headings, icon labels and editor styles refer to the supplied artwork',async()=>{
 const sheet=renderSheetFrame({id:'x',name:'Hero',data:{weapons:[{name:'Blade',damage:'1d6',u_max:1,u_curr:1}],activeAbilities:[{name:'Run',action_type:'Move'}]}},'combat',{combatView:'offense'});
 assert.match(sheet,/cs-d20-symbol/);
 const weapon=renderSection({id:'x',name:'Hero',data:{weapons:[{name:'Blade',damage:'1d6',u_max:1,u_curr:1}]}},'combat',{combatView:'offense'});
 assert.match(weapon,/data-weapon-roll="0"/);
 assert.match(actionIcon({action_type:'Standard'}),/cs-action-graphic/);
 assert.match(actionIcon({action_type:'Move'}),/cs-action-graphic/);
 assert.match(actionIcon({action_type:'Immediate'}),/cs-action-immediate/);
 const css=await readFile(new URL('../src/styles/sheet-refinements.css',import.meta.url),'utf8');
 assert.match(css,/icons\/d20\.png/);assert.match(css,/icons\/sword-action\.png/);assert.match(css,/icons\/running-action\.png/);
 assert.match(css,/cs-ability-prose/);
});
