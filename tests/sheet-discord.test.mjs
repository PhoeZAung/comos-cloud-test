import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {openDatabase} from '../backend/db/database.mjs';import {createUserRepository} from '../backend/repositories/users.mjs';import {createCharactersService} from '../backend/characters/service.mjs';import {publishRoll,serverRoll} from '../backend/characters/rolls.mjs';
test('server rolls validate dice; Discord suppresses mentions and repeated IDs never send twice',async()=>{
 const db=await openDatabase(':memory:');try{const user=createUserRepository(db).create({displayName:'Player'}),id=randomUUID();createCharactersService(db).save({op:'save',id,revision:0,name:'@everyone',ownerId:user.id,sources:[]});let calls=0,body;
 const args={db,userId:user.id,character:{id,name:'@everyone'},origin:'https://example.test',change:{requestId:randomUUID(),expression:'2d6+3',label:'@here attack',discord:true},sendFetch:async(url,options)=>{calls++;assert.equal(new URL(url).hostname,'weathered-term-1e39.phoeaung2076.workers.dev');body=JSON.parse(options.body);return {ok:true};}};
 const result=await publishRoll(args);assert.equal(result.discord,'sent');assert.ok(result.roll.total>=5&&result.roll.total<=15);assert.doesNotMatch(body.content,/@everyone|@here/);assert.deepEqual(body.allowed_mentions,{parse:[]});assert.deepEqual(await publishRoll(args),result);assert.equal(calls,1);
 await assert.rejects(()=>publishRoll({...args,change:{...args.change,expression:'1d20'}}));for(const expression of ['99d6','1d1','eval(1)','2d6;bad()'])assert.throws(()=>serverRoll(expression));
 }finally{db.close();}
});
test('Discord failures retain a generated result without retrying or reporting delivery',async()=>{
 const db=await openDatabase(':memory:');try{const user=createUserRepository(db).create({displayName:'Player'}),id=randomUUID();createCharactersService(db).save({op:'save',id,revision:0,name:'Mage',ownerId:user.id,sources:[]});let calls=0;
 const args={db,userId:user.id,character:{id,name:'Mage'},origin:'https://example.test',change:{requestId:randomUUID(),expression:'1d20',label:'Save',discord:true},sendFetch:async()=>{calls++;throw Error('Offline');}};
 const result=await publishRoll(args);assert.equal(result.discord,'failed');assert.ok(result.roll.total>0);assert.deepEqual(await publishRoll(args),result);assert.equal(calls,1);
 }finally{db.close();}
});
