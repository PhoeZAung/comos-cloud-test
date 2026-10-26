import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createLoreService,createLoreRoutes} from '../backend/lore/service.mjs';
import {createLoreImageRoutes} from '../backend/lore/images.mjs';
import {createApiServer} from '../backend/http/app.mjs';
import {renderLoreEntry} from '../src/ui/lore-entry.mjs';
import {default as compose} from '../src/pages/lore-compose.mjs';

function ensureProfile(db,name){
 const users=createUserRepository(db);const user=users.create({displayName:name});
 return users.completeProfile(user.id,name,user.revision);
}
function input(title,blocks,more={}){
 return {title,blocks,text:blocks.filter(b=>b.type==='text').map(b=>b.text.trim()).join('\n\n'),tagIds:[],clientRequestId:randomUUID(),...more};
}
test('Rich Lore preserves paragraph/picture ordering; old Lore remains readable',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=ensureProfile(db,'Illustrator'),other=ensureProfile(db,'Observer');
  const one=randomUUID(),two=randomUUID();
  for(const id of [one,two])db.prepare('INSERT INTO lore_images(id,owner_id,file_key,mime,created_at) VALUES(?,?,?,?,?)')
    .run(id,owner.id,randomUUID()+'.blob','image/webp','2026-01-01T00:00:00.000Z');
  const service=createLoreService(db,{now:()=>new Date().toISOString()});
  const blocks=[
   {type:'text',text:'First paragraph.'},{type:'text',text:'Second paragraph.'},
   {type:'image',mediaId:one,alt:'A silver harbor'},
   {type:'text',text:'Third paragraph.'},
   {type:'image',mediaId:two,alt:'A blue tower'}
  ];
  const payload=input('Gallery',blocks);
  const entry=service.create(owner.id,payload);
  assert.equal(entry.blocks.length,5);
  assert.deepEqual(entry.blocks.map(b=>b.type),['text','text','image','text','image']);
  assert.equal(entry.blocks[2].url,'/api/v1/lore-images/'+one);
  assert.equal(entry.blocks[4].alt,'A blue tower');
  assert.equal(entry.text,'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.');
  assert.equal(service.create(owner.id,payload).id,entry.id,'idempotent retry');
  assert.throws(()=>service.create(owner.id,{...payload,blocks:[...blocks].reverse()}),{code:'duplicate_request'});
  const html=renderLoreEntry(entry);
  assert.ok(html.indexOf('First paragraph.')<html.indexOf('Second paragraph.'));
  assert.ok(html.indexOf('Second paragraph.')<html.indexOf('src="/api/v1/lore-images/'+one+'"'));
  assert.ok(html.indexOf('src="/api/v1/lore-images/'+one+'"')<html.indexOf('Third paragraph.'));
  assert.ok(html.indexOf('Third paragraph.')<html.indexOf('src="/api/v1/lore-images/'+two+'"'));
  assert.match(html,/class="comos-lore-inline-image"/);
  assert.throws(()=>service.create(other.id,input('Stolen',blocks)),{code:'invalid_images',status:403});
  assert.throws(()=>service.create(owner.id,input('Reused',blocks)),{code:'invalid_images',status:403});
  assert.throws(()=>service.create(owner.id,input('Duplicates',[{type:'text',text:'A'},{type:'image',mediaId:one,alt:''},{type:'image',mediaId:one,alt:''}])),{code:'invalid_blocks'});
  assert.throws(()=>service.create(owner.id,input('URL injection',[{type:'text',text:'A'},{type:'image',mediaId:'https://evil.test/test.jpg',alt:''}])),{code:'invalid_blocks'});
  assert.throws(()=>service.create(owner.id,input('No text',[{type:'image',mediaId:randomUUID(),alt:''}])),{code:'invalid_blocks'});
  assert.throws(()=>service.create(owner.id,input('Overflow',[{type:'text',text:'x'.repeat(10001)}])),{code:'invalid_lore'});
  const legacy=service.create(owner.id,{title:'Text-only',text:'Old lore entry',tagIds:[],clientRequestId:randomUUID()});
  assert.deepEqual(legacy.blocks,[{type:'text',text:'Old lore entry'}]);
  assert.match(renderLoreEntry(legacy),/Old lore entry/);
  assert.doesNotMatch(renderLoreEntry({title:'Unsafe',text:'',blocks:[{type:'image',url:'javascript:alert(1)',alt:'<img>'}]}),/javascript:alert/);
 }finally{db.close();}
});

test('Latest is default, A–Z optional, and both cursor orders remain consistent',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const owner=ensureProfile(db,'Writer');
  let n=0;
  const service=createLoreService(db,{now:()=>new Date(Date.UTC(2026,0,1,0,0,n++)).toISOString()});
  for(const title of ['Zebra','Alpha','Middle'])service.create(owner.id,{title,text:'Story',tagIds:[],clientRequestId:randomUUID()});
  assert.deepEqual(service.list(owner.id).entries.map(x=>x.title),['Middle','Alpha','Zebra']);
  assert.deepEqual(service.list(owner.id,{sort:'az'}).entries.map(x=>x.title),['Alpha','Middle','Zebra']);
  const latest=service.list(owner.id,{sort:'newest',limit:2});
  assert.deepEqual(latest.entries.map(x=>x.title),['Middle','Alpha']);
  assert.deepEqual(service.list(owner.id,{sort:'newest',limit:2,cursor:latest.nextCursor}).entries.map(x=>x.title),['Zebra']);
  const alpha=service.list(owner.id,{sort:'az',limit:2});
  assert.deepEqual(alpha.entries.map(x=>x.title),['Alpha','Middle']);
  assert.deepEqual(service.list(owner.id,{sort:'az',cursor:alpha.nextCursor}).entries.map(x=>x.title),['Zebra']);
  assert.throws(()=>service.list(owner.id,{sort:'az',cursor:latest.nextCursor}),{code:'invalid_cursor'});
  assert.throws(()=>service.list(owner.id,{sort:'za'}),{code:'invalid_sort'});
 }finally{db.close();}
});

test('Lore image endpoint normalizes, stores, and restricts pictures until publication',async()=>{
 const mediaRoot=await mkdtemp(path.join(os.tmpdir(),'comos-lore-images-'));
 const db=await openDatabase(':memory:');
 const owner=ensureProfile(db,'Painter'),reader=ensureProfile(db,'Watcher');
 const sessions={restore:async token=>{
  if(token==='owner')return {user:owner,subject:'owner'};
  if(token==='reader')return {user:reader,subject:'reader'};
  throw Error('Unauthenticated');
 }};
 const origin='https://comos.test';
 const server=createApiServer({db,
  loreRoutes:createLoreRoutes({db,sessions,origin}),
  loreImageRoutes:await createLoreImageRoutes({db,sessions,origin,mediaRoot})
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const readerCookie={Cookie:'__Host-comos_session=reader'};
 const ownerCookie={Cookie:'__Host-comos_session=owner'};
 const png=await sharp({create:{width:60,height:60,channels:3,background:'#88bbff'}}).png().toBuffer();
 try{
  assert.equal((await fetch(base+'/api/v1/lore-images',{method:'POST',headers:{'Content-Type':'image/png',Origin:origin},body:png})).status,401);
  assert.equal((await fetch(base+'/api/v1/lore-images',{method:'POST',headers:{...ownerCookie,'Content-Type':'image/png',Origin:'https://other.test'},body:png})).status,403);
  const bad=await fetch(base+'/api/v1/lore-images',{method:'POST',headers:{...ownerCookie,'Content-Type':'image/svg+xml',Origin:origin},body:Buffer.from('<svg></svg>')});
  assert.equal(bad.status,400);
  const uploaded=await fetch(base+'/api/v1/lore-images',{method:'POST',headers:{...ownerCookie,'Content-Type':'image/png',Origin:origin},body:png});
  assert.equal(uploaded.status,201);
  const imageId=(await uploaded.json()).id;
  assert.equal((await fetch(base+'/api/v1/lore-images/'+imageId,{headers:readerCookie})).status,404,'other member cannot read unpublished picture');
  assert.equal((await fetch(base+'/api/v1/lore-images/'+imageId,{headers:ownerCookie})).status,200);
  const payload=input('Painted coast',[{type:'text',text:'Here is the coast.'},{type:'image',mediaId:imageId,alt:'The coastline'}]);
  const posted=await fetch(base+'/api/v1/lore',{method:'POST',headers:{...ownerCookie,'Content-Type':'application/json',Origin:origin},body:JSON.stringify(payload)});
  assert.equal(posted.status,201);
  const other=await fetch(base+'/api/v1/lore-images/'+imageId,{headers:readerCookie});
  assert.equal(other.status,200);
  assert.equal(other.headers.get('content-type'),'image/webp');
  const actual=await sharp(Buffer.from(await other.arrayBuffer())).metadata();
  assert.equal(actual.format,'webp');
  const read=await fetch(base+'/api/v1/lore/'+(await posted.clone().json()).entry.id,{headers:readerCookie});
  assert.equal(read.status,200);
  const entry=(await read.json()).entry;
  assert.equal(entry.blocks[1].url,'/api/v1/lore-images/'+imageId);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();await rm(mediaRoot,{recursive:true,force:true});}
});

test('New Lore composer offers ordered blocks and modal character tags',()=>{
 assert.match(compose.content,/data-lore-blocks/);
 assert.match(compose.content,/data-add-lore-paragraph/);
 assert.match(compose.content,/data-lore-image-files/);
 assert.match(compose.content,/data-lore-compose-tag-dialog/);
 assert.match(compose.content,/data-lore-open-tags/);
 assert.doesNotMatch(compose.content,/data-lore-tag-select/);
});
