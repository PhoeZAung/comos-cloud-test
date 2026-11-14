import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Readable} from 'node:stream';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharacterLibraryRoutes,createCharacterLibraryService} from '../backend/characters/library.mjs';
import {createDirectoryRoutes} from '../backend/characters/directory.mjs';
import {createOwlbearRoutes} from '../backend/auth/owlbear.mjs';
import {publishRoll} from '../backend/characters/rolls.mjs';
import {parseNpcStatBlock} from '../src/features/characters/npc-stat-block.mjs';
import {renderSheetFrame} from '../src/features/sheet/view.mjs';
import {requestSheetDice} from '../src/owlbear/rolls.mjs';

const note=`# Captain Test
**CR 8** | Human warrior | **LN** Medium humanoid
**Source:** Test fixture
## Stat block
| Stat | Value |
| --- | --- |
| **Init** | +3; **Senses** low-light vision; Perception +7 |
| **AC** | 24, touch 14, flat-footed 21 (+8 armor, +3 Dex, +3 natural) |
| **hp** | 94 (11d10+33) |
| **Fort** | +10, **Ref** +8, **Will** +4 (+2 vs. fear) |
| **Speed** | 20 ft. |
| **Melee** | +2 test sword +21/+16/+11 (1d8+9/17-20) |
| **Str** | 16, **Dex** 16, **Con** 16, **Int** 10, **Wis** 10, **Cha** 8 |
| **BAB** | +11; **CMB** +14 (+16 disarm); **CMD** 28 |
| **Skills** | Acrobatics +18, Knowledge (nobility) +7 |
| **Languages** | Common, Elven |
| **Gear** | Test sword, potion (2) |
**Key abilities (as printed):**
- **Parry:** Gain a conditional bonus.
## GM-only campaign notes
- An unrelated narrative secret.
`;

test('NPC import preserves printed totals, iterative attacks, conditions and independent roll buttons',()=>{
 const {name,data}=parseNpcStatBlock(note);
 assert.equal(name,'Captain Test');assert.equal(data.hp_max,94);
 assert.deepEqual([data.npcStats.ac,data.npcStats.touch,data.npcStats.flat,data.npcStats.ref,data.npcStats.cmd],[24,14,21,8,28]);
 assert.deepEqual(data.weapons.map(row=>[row.npcAttackBonus,row.damage,row.crit_range]),[[21,'1d8+9','17-20'],[16,'1d8+9','17-20'],[11,'1d8+9','17-20']]);
 assert.deepEqual(data.npcSkills.map(row=>row.bonus),[18,7,7]);
 assert.equal(data.activeAbilities[0].name,'Parry');assert.match(data.npcText.saveDetail,/vs\. fear/);
 assert.doesNotMatch(JSON.stringify(data),/unrelated narrative secret/);
 const html=renderSheetFrame({id:'npc',name,kind:'npc',data});
 assert.match(html,/data-roll="Reflex" data-bonus="8"/);assert.match(html,/data-roll="Knowledge \(nobility\)" data-bonus="7"/);
 assert.match(html,/data-weapon-roll="2"/);assert.doesNotMatch(html,/data-level-up|data-sheet-tab="items"/);
});

test('only administrators can save, edit and roll NPCs, including through an Owlbear grant',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const users=createUserRepository(db),owner=users.create({displayName:'GM'}),guest=users.create({displayName:'Guest'});
  const origin='https://cosmos.test',adminUids=['gm'],sessions={restore:async cookie=>{
   if(cookie==='gm')return {user:owner,subject:'gm'};
   if(cookie==='revoked')return {user:owner,subject:'former-admin'};
   if(cookie==='guest')return {user:guest,subject:'guest'};
   throw Error('Sign in');
  }};
  const directory=createDirectoryRoutes({db,sessions,adminUids,origin});
  const library=createCharacterLibraryRoutes({db,sessions,adminUids,origin});
  const extension=createOwlbearRoutes({db,sessions,adminUids,origin,handlers:[directory,library]});
  async function request(path,{body,cookie='gm',token,requestOrigin=origin}={}){
   const req=Readable.from(body?[Buffer.from(JSON.stringify(body))]:[]);req.method=body?'POST':'GET';req.url=path;
   req.headers={origin:requestOrigin,cookie:'__Host-comos_session='+cookie,'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})};
   const pathname=new URL(path,origin).pathname;let reply;const send=(status,data)=>reply={status,data};
   await extension(req,{},pathname,send)||await directory(req,{},pathname,send)||await library(req,{},pathname,send);
   return reply;
  }
  const base='/api/v1/admin/npcs',body={name:'',markdown:note,requestId:randomUUID()};
  assert.equal((await request(base,{body,cookie:'guest'})).status,403);
  assert.equal((await request(base,{body,requestOrigin:'https://foreign.test'})).status,403);
  const created=await request(base,{body});assert.equal(created.status,201);
  const id=created.data.character.id,path='/api/v1/character-records/'+id;
  assert.equal((await request(base,{body})).data.character.id,id);
  assert.equal((await request(base+'?q=Captain')).data.characters[0].name,'Captain Test');
  assert.equal(createCharacterLibraryService(db).list(owner.id).characters.length,0);
  assert.equal((await request(path,{cookie:'revoked'})).status,404);
  assert.equal((await request(path,{cookie:'guest'})).status,404);
  const saved=(await request(path,{body:{op:'sheet',revision:1,action:'npcStats',fields:{ref:9}}})).data.character;
  assert.equal(saved.data.npcStats.ref,9);
  assert.equal((await request(path,{body:{op:'owlbear-status',revision:2,visible:true}})).status,400);
  const grant=async cookie=>(await request('/api/v1/owlbear/connect',{body:{scope:'sheet'},cookie})).data.token;
  const gm=await grant('gm'),ordinary=await grant('revoked');
  const call=(token,method,value)=>request('/api/v1/owlbear/request',{token,body:{method,value}});
  assert.equal((await call(ordinary,'npc-list')).status,403);
  assert.equal((await call(ordinary,'api',{method:'GET',path})).status,403);
  assert.equal((await call(gm,'npc-list')).data.data.characters[0].id,id);
  const opened=(await call(gm,'api',{method:'GET',path})).data.data.character;
  assert.equal(opened.kind,'npc');assert.equal(opened.data.hp_curr,94);
  const attack={op:'roll',kind:'weapon',index:1,revision:opened.revision,mode:'use'};
  const notation=[];
  const faces=await requestSheetDice(opened,attack,async expression=>{
   notation.push(expression);
   const types=[...expression.matchAll(/(\d+)d(\d+)/g)].map(match=>'d'+match[2]);
   return {groups:types.map((diceType,i)=>({diceType,dice:[{value:i===0?11:4}]}))};
  });
  assert.deepEqual(notation,['1d20+16, 1d8+9']);
  const result=await call(gm,'api',{method:'POST',path,body:{...attack,discord:false,requestId:randomUUID(),owlbearRolls:faces}});
  assert.equal(result.data.status,200);assert.equal(result.data.data.roll.total,27);
  assert.equal(result.data.data.roll.damage.total,13);
  assert.equal((await call(gm,'roll-history')).data.data.rolls[0].character,'Captain Test');
  assert.deepEqual((await call(ordinary,'roll-history')).data.data.rolls,[]);
  db.prepare('UPDATE sheet_rolls SET created_at=0').run();
  const messages=[];
  const discord=await publishRoll({db,userId:owner.id,character:opened,origin,change:{...attack,discord:true,requestId:randomUUID(),owlbearRolls:faces},sendFetch:async(_url,options)=>{messages.push(JSON.parse(options.body));return {ok:true};}});
  assert.equal(discord.discord,'sent');assert.match(messages[0].content,/Captain Test[\s\S]*11 \+ 16 = 27/);
  assert.deepEqual(messages[0].allowed_mentions,{parse:[]});
 }finally{db.close();}
});
