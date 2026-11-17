import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createCharactersService} from '../backend/characters/service.mjs';
import {createCharacterLibraryRoutes} from '../backend/characters/library.mjs';
import {createDirectoryRoutes} from '../backend/characters/directory.mjs';
import {createItemsService} from '../backend/items/service.mjs';
import {createItemsRoutes} from '../backend/items/routes.mjs';
import {createOwlbearRoutes} from '../backend/auth/owlbear.mjs';
import {createApiServer} from '../backend/http/app.mjs';
import {createSheetTabs,sheetTabURL} from '../src/ui/sheet-tabs.mjs';
import {renderSection} from '../src/features/sheet/view.mjs';

test('character tabs remember each sheet view and preserve the Owlbear connection nonce',()=>{
 const tabs=createSheetTabs();
 tabs.add({id:'first',name:'Vivi'});
 tabs.add({id:'second',name:'Steiner & friends'});
 tabs.remember('first',{section:'items',itemView:'equip',itemTag:'Armor',scrollY:200});
 tabs.remember('second',{section:'spells',spellLevel:3});
 const current='https://cosmos.test/sheet.html?characterId=second&section=spells&spellLevel=3&compact=1#owlbear';
 const first=sheetTabURL(current,'first',tabs.view('first'));
 assert.equal(first.search,'?characterId=first&compact=1&section=items&itemView=equip&itemTag=Armor');
 assert.equal(first.hash,'#owlbear');
 assert.equal(tabs.view('first').scrollY,200);
 assert.match(tabs.render('second'),/Steiner &amp; friends/);
 assert.equal(tabs.close('second','second'),'first');
 assert.equal(tabs.close('first','first'),'first');
 assert.equal(tabs.view('second').spellLevel,3);
 assert.match(renderSection({data:{}},'items'),/data-add-entry="items"/);
});

test('players can add catalog items without spending gil and Owlbear grants only expose their own sheets',async()=>{
 const db=await openDatabase(':memory:');
 const users=createUserRepository(db),owner=users.create({displayName:'Owner'}),other=users.create({displayName:'Other'});
 const service=createCharactersService(db),id=randomUUID(),foreignId=randomUUID(),origin='https://cosmos.test';
 for(const [characterId,user] of [[id,owner],[foreignId,other]]){
  service.save({op:'save',id:characterId,revision:0,name:user.display_name||user.displayName,ownerId:user.id,sources:[]});
  db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(characterId,JSON.stringify({currency_gil:7}));
 }
 const items=createItemsService(db),item=items.save({op:'save',id:randomUUID(),revision:0,name:'Travel rope',category:'Gear',description:'Climbing gear',sourceId:'test',sourceVersion:'1'});
 const sessions={restore:async cookie=>({subject:cookie,user:cookie==='owner'?owner:other})};
 const config={db,sessions,items,origin,adminUids:[]};
 const directory=createDirectoryRoutes(config),catalog=createItemsRoutes(config),library=createCharacterLibraryRoutes(config);
 const owl=createOwlbearRoutes({...config,handlers:[directory,catalog,library]});
 const server=createApiServer({db,itemsRoutes:catalog,characterLibraryRoutes:library,directoryRoutes:async(...args)=>await owl(...args)||await directory(...args)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const headers={cookie:'__Host-comos_session=owner',origin,'content-type':'application/json'};
 const post=(path,body,extra={})=>fetch(base+path,{method:'POST',headers:{...headers,...extra},body:JSON.stringify(body)});
 try{
  assert.equal((await fetch(base+'/api/v1/item-catalog')).status,401);
  const list=await fetch(base+'/api/v1/item-catalog?q=rope&category=Gear',{headers}).then(r=>r.json());
  assert.equal(list.items[0].id,item.id);
  const grant=await post('/api/v1/owlbear/connect',{scope:'sheet'}).then(r=>r.json());
  const proxy=(path,method='GET',body)=>post('/api/v1/owlbear/request',{method:'api',value:{path,method,body}},{authorization:'Bearer '+grant.token});
  const owned=await proxy('/api/v1/my/characters').then(r=>r.json());
  assert.deepEqual(owned.data.characters.map(character=>character.id),[id]);
  assert.equal((await proxy('/api/v1/item-catalog/categories').then(r=>r.json())).data.categories[0].category,'Gear');
  const change={op:'sheet',action:'addCatalogItem',itemId:item.id,quantity:2,revision:1};
  assert.equal((await proxy('/api/v1/character-records/'+foreignId,'POST',change)).status,403);
  const path='/api/v1/character-records/'+id;
  const result=await proxy(path,'POST',change).then(r=>r.json());
  assert.equal(result.status,200);
  const data=result.data.character.data;
  assert.equal(data.currency_gil,7);
  assert.equal(data.items[0].name,'Travel rope');
  assert.equal(data.items[0].amount,2);
  assert.equal(data.items[0].equipped,false);
  assert.equal((await post(path,change)).status,409);
  assert.equal((await post(path,{...change,revision:2,quantity:0})).status,400);
  items.save({op:'archive',id:item.id,revision:1,archived:true});
  assert.equal((await post(path,{...change,revision:2})).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});


test('administrator can add priced and unpriced premade items to other player sheets without charging Gil',async()=>{
 const db=await openDatabase(':memory:'),users=createUserRepository(db);
 const gm=users.create({displayName:'GM'}),player=users.create({displayName:'Adventurer'}),outsider=users.create({displayName:'Outsider'});
 const chars=createCharactersService(db),playerId=randomUUID(),npcId=randomUUID(),origin='https://cosmos.test';
 for(const characterId of [playerId,npcId]){
  chars.save({op:'save',id:characterId,revision:0,name:characterId===playerId?'Adventurer':'Monster',ownerId:player.id,sources:[]});
  db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(characterId,JSON.stringify({currency_gil:1,currency_moogle:9,items:[],weapons:[]}));
 }
 db.prepare("UPDATE characters SET kind='npc' WHERE id=?").run(npcId);
 const items=createItemsService(db);
 const rope=items.save({op:'save',id:randomUUID(),revision:0,name:'Travel rope',category:'Gear',description:'Climbing gear',sourceId:'test',sourceVersion:'1',priceGil:22});
 const sword=items.save({op:'save',id:randomUUID(),revision:0,name:'Longsword',category:'Weapon',description:'Slashing sword',sourceId:'test',sourceVersion:'1',priceGil:45});
 const sessions={restore:async cookie=>{
  const user={gm,player,outsider}[cookie];if(!user)throw Error('Unknown account');
  return {subject:cookie,user};
 }};
 const routes=createDirectoryRoutes({db,sessions,adminUids:['gm'],origin,items});
 const server=createApiServer({db,directoryRoutes:routes});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const headers=account=>({cookie:'__Host-comos_session='+account,origin,'content-type':'application/json'});
 const request=(account,characterId,change)=>fetch(base+'/api/v1/character-records/'+characterId,{
  method:'POST',headers:headers(account),body:JSON.stringify(change)
 });
 const data=()=>JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(playerId).data_json);
 try{
  assert.equal((await fetch(base+'/api/v1/character-records/'+playerId,{headers:headers('gm')})).status,200);
  assert.equal((await fetch(base+'/api/v1/character-records/'+playerId,{headers:headers('outsider')})).status,404);
  const grant={op:'sheet',action:'addCatalogItem',itemId:rope.id,quantity:3,revision:1};
  assert.equal((await request('outsider',playerId,grant)).status,404,'a non-admin must not grant to someone else');
  let response=await request('gm',playerId,grant);
  assert.equal(response.status,200,(await response.clone().json()).message);
  let payload=await response.json();
  assert.equal(payload.admin,true);assert.equal(payload.character.owned,false);
  assert.equal(payload.character.data.items[0].name,'Travel rope');
  assert.equal(payload.character.data.items[0].amount,3);
  assert.equal(payload.character.data.currency_gil,1,'a GM grant never deducts Gil');
  assert.equal(payload.character.data.currency_moogle,9);
  response=await request('gm',playerId,{...grant,revision:2,itemId:sword.id,quantity:1});
  assert.equal(response.status,200,(await response.clone().json()).message);
  payload=await response.json();
  assert.equal(payload.character.data.weapons[0].name,'Longsword','weapons are routed to the proper player section');
  assert.equal(payload.character.data.items.length,1);
  assert.equal(payload.character.data.currency_gil,1);
  assert.equal((await request('gm',playerId,{...grant,revision:1})).status,409,'stale GM edits are rejected');
  response=await request('gm',playerId,{...grant,revision:3,quantity:1});
  assert.equal(response.status,200,'a second copy remains a separate inventory record');
  assert.equal(data().items.length,2,'same-name entries must not be merged');
  assert.equal(data().currency_gil,1);
  assert.equal((await request('gm',npcId,{...grant,revision:1})).status,403,'NPC sheets forbid player inventory grants even for GMs');
  assert.equal((await request('gm',playerId,{...grant,revision:4,quantity:0})).status,400,'invalid grant quantities remain rejected');
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});
