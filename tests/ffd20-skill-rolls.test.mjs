import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharactersService} from '../backend/characters/service.mjs';
import {publishRoll} from '../backend/characters/rolls.mjs';
import {sheetSkills,skillCanRoll} from '../src/features/sheet/skills.mjs';
import {readFile} from 'node:fs/promises';

test('authoritative roll endpoint rejects zero-rank skills, recomputes ranks, and replays receipts once',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const user=createUserRepository(db).create({displayName:'Skill Roll Tester'}),id=randomUUID();
  createCharactersService(db).save({op:'save',id,revision:0,name:'Hero',ownerId:user.id,sources:[]});
  const data={int:16,dex:12,skills:sheetSkills({}).map(row=>({...row,lvl:0,temp:0,cs:false}))};
  const computers=data.skills.findIndex(row=>row.name==='Computers');
  data.skills[computers].cs=true;data.skills[computers].temp=12;
  db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(id,JSON.stringify(data));
  const character=()=>({id,name:'Hero',revision:1,data:JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id).data_json)});
  const rollReq={kind:'skill',index:computers,mode:'use',discord:false,revision:1,requestId:randomUUID()};
  const action=change=>publishRoll({db,userId:user.id,character:character(),change,origin:'https://example.test'});
  await assert.rejects(action(rollReq),/Trained only/);
  assert.equal(db.prepare('SELECT count(*) n FROM sheet_rolls').get().n,0);
  data.skills[computers].lvl=1;
  db.prepare('UPDATE character_details SET data_json=? WHERE character_id=?').run(JSON.stringify(data));
  assert.equal(computers,46,'legacy skill indices must not move');
  assert.equal(character().data.skills[computers].lvl,1,'stored skill rank should be present');
  assert.equal(sheetSkills(character().data)[computers].lvl,1,'normalized skill must keep saved ranks');
  assert.equal(skillCanRoll(sheetSkills(character().data)[computers]),true,'one rank should unlock skill');
  const result=await action(rollReq);
  assert.equal(result.roll.kind,'skill');
  assert.equal(result.roll.skillName,'Computers');
  assert.equal(result.roll.bonus,19,'INT +3, rank +1, class skill +3, misc +12');
  assert.ok(result.roll.total>=20&&result.roll.total<=39);
  assert.deepEqual(await action(rollReq),result,'no duplicate dice roll on replay');
  assert.equal(db.prepare('SELECT count(*) n FROM sheet_rolls').get().n,1);
  db.prepare('UPDATE sheet_rolls SET created_at=0').run();
  data.skills[computers].lvl=0;
  db.prepare('UPDATE character_details SET data_json=? WHERE character_id=?').run(JSON.stringify(data));
  await assert.rejects(action({...rollReq,requestId:randomUUID()}),/Trained only/);
  assert.equal(db.prepare('SELECT count(*) n FROM sheet_rolls').get().n,1);
 }finally{db.close();}
});
test('Owlbear Dice+ and sheet entry controls use indexed skill roll path, not generic client totals',async()=>{
 const sheet=await readFile('src/ui/sheet.mjs','utf8');
 const owl=await readFile('src/owlbear/rolls.mjs','utf8');
 assert.match(sheet,/data-skill-index/);
 assert.match(sheet,/kind:'skill',index:skillIndex/);
 assert.match(owl,/change.kind==='skill'/);
 assert.match(owl,/skillCanRoll\(row\)/);
});
