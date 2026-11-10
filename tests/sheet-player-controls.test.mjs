import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {Readable} from 'node:stream';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderSheetFrame,renderSection,entryDetail} from '../src/features/sheet/view.mjs';
import {createOwlbearRoutes} from '../backend/auth/owlbear.mjs';

test('weapons track maximum and current uses; manual abilities retain user-entered limits',()=>{
 const base={str:16,dex:14,hp_max:24,hp_curr:12,weapons:[],activeAbilities:[]};
 const withWeapon=mergeSheetData(base,{action:'entry',collection:'weapons',mode:'add',fields:{name:'Magic Pistol',damage:'1d6',u_curr:4,u_max:6}});
 assert.match(renderSection({data:withWeapon},'combat'),/4 \/ 6/);
 assert.match(renderSection({data:withWeapon},'combat'),/data-edit-entry="weapons:0"/);
 const edited=mergeSheetData(withWeapon,{action:'entry',collection:'weapons',mode:'update',index:0,fields:{u_curr:2}});
 assert.equal(edited.weapons[0].u_curr,2);
 assert.throws(()=>mergeSheetData(withWeapon,{action:'entry',collection:'weapons',mode:'update',index:0,fields:{u_curr:7}}),/maximum uses/);
 assert.throws(()=>mergeSheetData(base,{action:'entry',collection:'weapons',mode:'add',fields:{name:'Bad',u_curr:4,u_max:1}}),/maximum uses/);
 const manual=mergeSheetData(edited,{action:'entry',collection:'activeAbilities',mode:'add',fields:{name:'Custom Shield',u_curr:2,u_max:3,restoreOnLongRest:true,desc:'A custom feature.'}});
 assert.equal(manual.activeAbilities[0].u_curr,2);
 assert.match(renderSection({data:manual},'abilities'),/2 \/ 3/);
 assert.throws(()=>mergeSheetData(manual,{action:'entry',collection:'activeAbilities',mode:'update',index:0,fields:{u_curr:5}}),/maximum uses|between 0/);
 const frame=renderSheetFrame({id:randomUUID(),name:'Tester',data:manual},'abilities');
 assert.match(frame,/data-add-manual-ability/);
 assert.match(frame,/data-rule-abilities/);
 assert.match(frame,/cs-ability-add-menu/);
 assert.doesNotMatch(entryDetail(manual.activeAbilities[0],manual,'activeAbilities'),/data-edit-entry/);
});

test('Gun Arm setup is hidden, and Limit Breaks appear only in Active',()=>{
 const data={classes:[{name:'Black Mage',level:3}],hp_max:20,hp_curr:10,gunbreakerAmmo:{},
  activeAbilities:[{name:'Limit Break: Starfall',limitBreak:true,favorite:true}],passiveAbilities:[{name:'Limit Break: Echo',limitBreak:true},{name:'Passive Aura'}],racialAbilities:[{name:'Racial Feature'}]};
 const character={id:randomUUID(),name:'Tester',data};
 for(const section of ['combat','abilities']){
  assert.doesNotMatch(renderSection(character,section),/Gun arm ammunition/);
 }
 assert.match(renderSection(character,'abilities',{ability:'activeAbilities'}),/Limit Break: Echo/);
 assert.doesNotMatch(renderSection(character,'abilities',{ability:'passiveAbilities'}),/Limit Break: Echo/);
 assert.doesNotMatch(renderSection(character,'favorites'),/Limit Break: Starfall/);
 assert.match(renderSection(character,'abilities',{ability:'passiveAbilities'}),/Passive Aura/);
});

test('Owlbear owner may update own shared HP and MP, never other players or unshared characters',async()=>{
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE characters(id TEXT PRIMARY KEY,owner_id TEXT,archived INTEGER,kind TEXT DEFAULT \"player\");CREATE TABLE character_details(character_id TEXT PRIMARY KEY,data_json TEXT)');
 const first=randomUUID(),second=randomUUID(),hidden=randomUUID();
 for(const [id,owner,shared] of [[first,'a',true],[second,'b',true],[hidden,'a',false]]){
  db.prepare('INSERT INTO characters(id,owner_id,archived) VALUES(?,?,0)').run(id,owner);
  db.prepare('INSERT INTO character_details VALUES(?,?)').run(id,JSON.stringify({owlbearStatusVisible:shared}));
 }
 const origin='https://cosmos.test',calls=[];
 const sessions={restore:async cookie=>({subject:'ordinary-'+cookie,user:{id:cookie}})};
 const handler=async(req,res,path,send)=>{
  if(!path.startsWith('/api/v1/character-records/'))return false;
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  calls.push({path,body:JSON.parse(Buffer.concat(chunks).toString())});
  send(200,{character:{revision:4}});return true;
 };
 const route=createOwlbearRoutes({db,sessions,adminUids:[],origin,handlers:[handler]});
 async function request(path,body,extra={}){
  const req=Readable.from([Buffer.from(JSON.stringify(body))]);req.method='POST';
  req.headers={origin,'content-type':'application/json',...extra};req.socket={};
  let reply;await route(req,{},path,(status,data)=>reply={status,data});return reply;
 }
 try{
  const grant=await request('/api/v1/owlbear/connect',{scope:'sheet'},{cookie:'__Host-comos_session=a'});
  assert.equal(grant.status,200);
  const auth={authorization:'Bearer '+grant.data.token};
  const change=id=>request('/api/v1/owlbear/request',{method:'party-stats',value:{id,revision:3,stats:{hp:12,mp:5}}},auth);
  assert.equal((await change(first)).data.data.saved,true);
  assert.equal(calls.length,1);
  assert.equal(calls[0].body.fields.hp_curr,12);
  assert.equal((await change(second)).status,403);
  assert.equal((await change(hidden)).status,403);
  assert.equal(calls.length,1);
 }finally{db.close();}
});
