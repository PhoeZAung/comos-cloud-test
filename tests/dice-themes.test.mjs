import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createAccountService} from '../backend/account/service.mjs';
import {diceThemes,resultDice} from '../src/features/dice-themes.mjs';

test('dice theme persists on account, validates choices, and survives older preference payloads',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const repo=createUserRepository(db),service=createAccountService({db,files:{}});let user=repo.create();
  assert.equal(user.preferences.diceTheme,'classic');
  for(const theme of diceThemes){user=service.update(user.id,{revision:user.revision,preferences:{...user.preferences,diceTheme:theme.id}});assert.equal(repo.get(user.id).preferences.diceTheme,theme.id);}
  assert.throws(()=>service.update(user.id,{revision:user.revision,preferences:{...user.preferences,diceTheme:'../secret'}}),{code:'INVALID_ACCOUNT'});
  const {diceTheme,...oldPreferences}=user.preferences;
  user=service.update(user.id,{revision:user.revision,preferences:oldPreferences});assert.equal(user.preferences.diceTheme,diceTheme);
 }finally{db.close();}
});
test('3D visual dice retain server faces and never turn modifiers into dice or duplicate attack rolls',()=>{
 const attack={total:25,breakdown:[{dice:'1d20',rolls:[18]},{total:7}]},damage={total:9,breakdown:[{dice:'2d6',rolls:[3,4]},{total:2}]};
 assert.deepEqual(resultDice({...attack,kind:'weapon',damage}).map(d=>[d.sides,d.data.targetValue]),[[20,18],[6,3],[6,4]]);
 assert.deepEqual(resultDice({kind:'spell',attack,damage}).map(d=>d.data.targetValue),[18,3,4]);
 assert.deepEqual(resultDice({total:5,breakdown:[{total:5}]}),[]);
 assert.deepEqual(resultDice({total:99,breakdown:[{dice:'1d100',rolls:[99]}]})[0].data,{targetValue:99});
});
