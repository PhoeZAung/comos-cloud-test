import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharacterLibraryService,createCharacterLibraryRoutes} from '../backend/characters/library.mjs';
import {createCharacterDirectoryRoutes} from '../backend/characters/directory.mjs';
import {createApiServer} from '../backend/http/app.mjs';
import {renderSheetFrame} from '../src/features/sheet/view.mjs';
import charactersPage from '../src/pages/characters.mjs';

test('Add Character presents Wizard and Manual choices, without automatically starting wizard',()=>{
 const html=charactersPage.content;
 assert.match(html,/data-character-create-open/);
 assert.match(html,/<dialog[^>]*data-character-create-dialog/);
 assert.match(html,/Use Wizard/);
 assert.match(html,/href="create-identity\.html"/);
 assert.match(html,/Create Manually/);
 assert.match(html,/data-character-create-manual/);
 assert.doesNotMatch(html,/<a class="button primary" href="create-identity\.html">\+ Create character<\/a>/);
});

test('manual creation saves only an empty sheet marker and opens without race/class/ability data',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const a=createUserRepository(db).create({displayName:'Manual player'});
  const svc=createCharacterLibraryService(db);
  const requestId=randomUUID(),input={mode:'manual',requestId};
  const created=svc.createManual(a.id,input);
  assert.match(created.id,/^[a-f0-9-]{36}$/);
  assert.equal(created.name,'New Character');
  assert.equal(created.revision,1);
  assert.deepEqual(created.data,{manualCharacter:true});
  assert.deepEqual(JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(created.id).data_json),{manualCharacter:true});
  assert.deepEqual(JSON.parse(db.prepare('SELECT sources_json FROM characters WHERE id=?').get(created.id).sources_json),[]);
  for(const key of ['rulesBuild','race','class','classes','hp_max','str','dex','level','skills','activeAbilities','spells'])assert.equal(created.data[key],undefined,key);
  const retried=svc.createManual(a.id,input);
  assert.deepEqual(retried,created);
  assert.equal(svc.list(a.id).characters.length,1);
  assert.equal(svc.list(a.id).characters[0].level,null);
  const frame=renderSheetFrame({id:created.id,name:created.name,data:created.data},'overview');
  assert.match(frame,/<h1>New Character<\/h1>/);
  assert.match(frame,/data-rename-character/);
  assert.doesNotMatch(frame,/class="cs-classline"[^>]*>[^<]+/);
  assert.throws(()=>svc.createManual(a.id,{mode:'manual',requestId:'not-uuid'}),{code:'INVALID_CHARACTER'});
  assert.throws(()=>svc.createManual(a.id,{...input,ownerId:'another-user'}),{code:'INVALID_CHARACTER'});
  assert.throws(()=>svc.createManual(a.id,{...input,build:{}}),{code:'INVALID_CHARACTER'});
  assert.throws(()=>svc.createManual(a.id,{mode:'wizard',requestId}),{code:'INVALID_CHARACTER'});
 }finally{db.close();}
});

test('manual creation is owner-scoped, retriable, and manually editable without wizard',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const repo=createUserRepository(db),a=repo.create({displayName:'One'}),b=repo.create({displayName:'Two'});
  const lib=createCharacterLibraryService(db);
  const requestId=randomUUID();
  const ca=lib.createManual(a.id,{mode:'manual',requestId});
  const cb=lib.createManual(b.id,{mode:'manual',requestId});
  assert.notEqual(ca.id,cb.id);
  assert.deepEqual(lib.list(b.id).characters.map(x=>x.id),[cb.id]);
  const updated=db.prepare('SELECT * FROM characters WHERE id=?').get(ca.id);
  assert.equal(updated.owner_id,a.id);
  assert.equal(updated.name,'New Character');
  assert.deepEqual(JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(ca.id).data_json),{manualCharacter:true});
 }finally{db.close();}
});

test('manual POST respects profile completion, login and same-origin; wizard POST remains valid',async()=>{
 const db=await openDatabase(':memory:');
 const users=createUserRepository(db),ready=users.create({displayName:'Ready'}),incomplete=users.create({displayName:'Incomplete'});
 ready.profileState='complete';incomplete.profileState='pending';
 const sessions={restore:async token=>{if(!['ready','incomplete'].includes(token))throw Error('Sign in');return {subject:token,user:token==='ready'?ready:incomplete};}};
 const origin='https://example.test';
 const server=createApiServer({db,characterLibraryRoutes:createCharacterLibraryRoutes({db,sessions,origin})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const body=JSON.stringify({mode:'manual',requestId:randomUUID()});
 const headers={Cookie:'__Host-comos_session=ready',Origin:origin,'Content-Type':'application/json'};
 try{
  assert.equal((await fetch(base+'/api/v1/my/characters',{method:'POST',headers:{...headers,Cookie:'__Host-comos_session=invalid'},body})).status,401);
  assert.equal((await fetch(base+'/api/v1/my/characters',{method:'POST',headers:{...headers,Cookie:'__Host-comos_session=incomplete'},body})).status,403);
  assert.equal((await fetch(base+'/api/v1/my/characters',{method:'POST',headers:{...headers,Origin:'https://untrusted.test'},body})).status,403);
  const created=await fetch(base+'/api/v1/my/characters',{method:'POST',headers,body});
  assert.equal(created.status,201);
  const payload=await created.json();
  assert.equal(payload.character.name,'New Character');
  assert.deepEqual(payload.character.data,{manualCharacter:true});
  const again=await fetch(base+'/api/v1/my/characters',{method:'POST',headers,body});
  assert.equal(again.status,201);
  assert.equal((await again.json()).character.id,payload.character.id);
  assert.equal((await (await fetch(base+'/api/v1/my/characters',{headers})).json()).characters.length,1);
  const wizard=await fetch(base+'/api/v1/my/characters',{method:'POST',headers,body:JSON.stringify({fields:{charName:'Wizard Adventurer',alignment:'',portrait:'',bio:''}})});
  assert.equal(wizard.status,201);
  assert.equal((await wizard.json()).character.name,'Wizard Adventurer');
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});

test('client waits for successful creation before navigating, and sheet can rename without wizard',async()=>{
 const ui=await readFile(new URL('../src/ui/character-library.mjs',import.meta.url),'utf8');
 assert.match(ui,/body:JSON\.stringify\(\{mode:'manual',requestId:manualRequestId\}\)/);
 assert.match(ui,/if\(!response\.ok\)throw Error\(await readError\(response\)\)/);
 assert.match(ui,/location\.assign\('sheet\.html\?characterId='\+encodeURIComponent\(payload\.character\.id\)\)/);
 assert.match(ui,/manualRequestId\|\|=crypto\.randomUUID\(\)/);
 const sheet=await readFile(new URL('../src/ui/sheet.mjs',import.meta.url),'utf8');
 assert.match(sheet,/data-rename-dialog/);
 assert.match(sheet,/data-rename-form/);
 assert.match(sheet,/save\(\{op:'edit',fields:\{charName:name\}\}\)/);
});
