import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharactersService} from '../backend/characters/service.mjs';
import {createCharacterLibraryService,createCharacterLibraryRoutes} from '../backend/characters/library.mjs';
import {createApiServer} from '../backend/http/app.mjs';

test('Lore tag choices come only from the signed-in owner’s active characters',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const users=createUserRepository(db);
  const alice=users.create({displayName:'Alice'}),bob=users.create({displayName:'Bob'});
  const characterService=createCharactersService(db);
  const aChar=randomUUID(),bChar=randomUUID(),archived=randomUUID();
  for(const [id,owner,name] of [[aChar,alice.id,'Alice Mage'],[bChar,bob.id,'Bob Mage'],[archived,alice.id,'Archived Mage']]){
    characterService.save({op:'save',id,revision:0,name,ownerId:owner,sources:[]});
  }
  const arcane=randomUUID(),hidden=randomUUID(),old=randomUUID(),unused=randomUUID();
  for(const [id,name] of [[arcane,'Arcane'],[hidden,'Other player tag'],[old,'Archived tag'],[unused,'Unassigned tag']]){
    db.prepare('INSERT INTO character_tags(id,name) VALUES(?,?)').run(id,name);
  }
  const assign=db.prepare('INSERT INTO character_tag_links(character_id,tag_id) VALUES(?,?)');
  assign.run(aChar,arcane);assign.run(bChar,hidden);assign.run(archived,old);
  db.prepare('UPDATE characters SET archived=1 WHERE id=?').run(archived);
  const service=createCharacterLibraryService(db);
  assert.deepEqual(service.loreTags(alice.id),[{id:arcane,name:'Arcane'}]);
  assert.deepEqual(service.loreTags(bob.id),[{id:hidden,name:'Other player tag'}]);

  const sessions={restore:async cookie=>{
    if(cookie==='a')return {subject:'a',user:alice};
    if(cookie==='b')return {subject:'b',user:bob};
    throw Error('Not signed in');
  }};
  const api=createApiServer({db,characterLibraryRoutes:createCharacterLibraryRoutes({db,sessions,origin:'https://example.test'})});
  await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+api.address().port+'/api/v1/my/lore-tags';
  try{
    assert.equal((await fetch(base)).status,401);
    const aliceResult=await fetch(base,{headers:{Cookie:'__Host-comos_session=a'}});
    assert.equal(aliceResult.status,200);
    assert.deepEqual((await aliceResult.json()).tags,[{id:arcane,name:'Arcane'}]);
    const bobResult=await fetch(base,{headers:{Cookie:'__Host-comos_session=b'}});
    assert.deepEqual((await bobResult.json()).tags,[{id:hidden,name:'Other player tag'}]);
    assert.equal((await fetch(base+'?ownerId='+bob.id,{headers:{Cookie:'__Host-comos_session=a'}})).status,400);
    assert.equal((await fetch(base,{method:'POST',headers:{Cookie:'__Host-comos_session=a'}})).status,405);
  }finally{await new Promise(resolve=>api.close(resolve));}
 }finally{db.close();}
});
