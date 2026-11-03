import test from 'node:test';import assert from 'node:assert/strict';
import {naturalResult} from '../src/ui/critical-fx.mjs';
import {criticalEffects,criticalEnabled,chooseCriticalEffect,CriticalFrameClock} from '../src/features/critical-effects.mjs';
import {normalizeDiceOptions,validDiceOptions,mergeDiceOptions} from '../src/features/dice-options.mjs';
import {openDatabase} from '../backend/db/database.mjs';import {createUserRepository} from '../backend/repositories/users.mjs';import {createAccountService} from '../backend/account/service.mjs';
import {renderSheetFrame} from '../src/features/sheet/view.mjs';
import {createStaticHandler} from '../backend/http/static.mjs';import sharp from 'sharp';import http from 'node:http';import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
const roll=(face,total=face,dice='1d20')=>({kind:'check',total,breakdown:[{dice,rolls:[face]}]});
test('natural criticals use unmodified primary d20 faces and preserve the receipt',()=>{
 assert.equal(naturalResult(roll(20,27)),20);assert.equal(naturalResult(roll(17,20)),null);assert.equal(naturalResult(roll(1,20)),1);
 for(const dice of ['1d100','1d200','2d10','1d6'])assert.equal(naturalResult(roll(20,20,dice)),null);
 assert.equal(naturalResult({...roll(17),kind:'weapon',damage:roll(20),critical:{confirmation:roll(20)}}),null);assert.equal(naturalResult({kind:'spell',damage:roll(20)}),null);
 const receipt=Object.freeze({...roll(20,28),breakdown:Object.freeze([Object.freeze({dice:'1d20',rolls:Object.freeze([20])})])});assert.equal(naturalResult(receipt),20);assert.equal(receipt.total,28);
});
test('random pools contain exactly the requested three effects for each outcome',()=>{
 assert.deepEqual(criticalEffects.filter(e=>e.value===1).map(e=>e.id),['void-rift','crystal-shatter-blast','planet-shatter']);
 assert.deepEqual(criticalEffects.filter(e=>e.value===20).map(e=>e.id),['thunder-god-strike','starfall-barrage','thousand-cuts']);
 for(const value of [1,20]){const picks=[0,.5,.999].map(n=>chooseCriticalEffect(value,()=>n));assert.equal(new Set(picks.map(e=>e.id)).size,3);assert.ok(picks.every(e=>e.value===value));}assert.equal(chooseCriticalEffect(17),null);
});
test('every effect has an impact and a number cue within its visible playback',()=>{
 for(const effect of criticalEffects){assert.ok(effect.impacts.length>0);assert.ok(effect.impacts.includes(effect.numberFrame));assert.ok(effect.impacts.every(frame=>frame>=0&&frame<(effect.endFrame||effect.frames)));}
 assert.equal(criticalEffects.find(e=>e.id==='planet-shatter').endFrame,83);
});
test('frame clock preserves native delays, pauses for an unavailable page and cannot skip impact frames',()=>{
 const clock=new CriticalFrameClock([30,40,30]);assert.equal(clock.tick(29),0);assert.equal(clock.tick(1),1);assert.equal(clock.tick(39),1);assert.equal(clock.tick(1),2);clock.tick(30);assert.equal(clock.finished,true);
 const stalled=new CriticalFrameClock([30,40,30]);assert.equal(stalled.tick(70,()=>false),0);assert.equal(stalled.tick(0,()=>true),1);assert.equal(stalled.elapsed,0);
 const slow=new CriticalFrameClock(Array(10).fill(30));assert.equal(slow.tick(3000),1);assert.equal(slow.tick(0),2);
 const trimmed=new CriticalFrameClock(Array(100).fill(30),3);for(let i=0;i<3;i++)trimmed.tick(30);assert.equal(trimmed.frame,2);assert.equal(trimmed.finished,true);
});
test('Nat 20 and Nat 1 can be switched independently; old global preferences remain compatible',()=>{
 const defaults=normalizeDiceOptions();assert.equal(defaults.nat20Effects,true);assert.equal(defaults.nat1Effects,true);
 const off=normalizeDiceOptions({critEffects:false});assert.equal(criticalEnabled(20,off),false);assert.equal(criticalEnabled(1,off),false);
 const separate=normalizeDiceOptions({critEffects:false,nat20Effects:true,nat1Effects:false});assert.equal(criticalEnabled(20,separate),true);assert.equal(criticalEnabled(1,separate),false);assert.equal(criticalEnabled(17,separate),false);
 const {nat20Effects,nat1Effects,...legacy}=defaults;assert.equal(validDiceOptions({...legacy,critStyle:'fire',nat20Style:'dragon'}),true);assert.equal(validDiceOptions({...defaults,nat1Effects:'yes'}),false);assert.equal(validDiceOptions({...defaults,unknown:1}),false);assert.equal(Object.hasOwn(normalizeDiceOptions({nat20Style:'dragon'}),'nat20Style'),false);
});
test('legacy saves preserve independent flags unless the old global switch is changed',()=>{
 const current=normalizeDiceOptions({nat20Effects:false,nat1Effects:true});
 const {nat20Effects,nat1Effects,...legacy}=current;assert.deepEqual(mergeDiceOptions(current,{...legacy,volume:.35}),{...current,volume:.35});
 const disabled=mergeDiceOptions(current,{...legacy,critEffects:false});assert.equal(disabled.nat20Effects,false);assert.equal(disabled.nat1Effects,false);
});
test('independent flags persist on accounts and no animation style is stored',async()=>{
 const db=await openDatabase(':memory:');try{const users=createUserRepository(db),service=createAccountService({db,files:{}});let user=users.create();user=service.update(user.id,{revision:user.revision,preferences:{...user.preferences,diceOptions:{...user.preferences.diceOptions,nat20Effects:false,nat1Effects:true}}});const {nat20Effects,nat1Effects,...legacy}=user.preferences.diceOptions;user=service.update(user.id,{revision:user.revision,preferences:{...user.preferences,diceOptions:{...legacy,volume:.35,nat20Style:'dragon'}}});assert.equal(user.preferences.diceOptions.nat20Effects,false);assert.equal(user.preferences.diceOptions.nat1Effects,true);assert.equal(user.preferences.diceOptions.volume,.35);assert.equal(Object.hasOwn(user.preferences.diceOptions,'nat20Style'),false);}finally{db.close();}
});
test('sheet settings offer two switches and random preview buttons without an animation picker',()=>{
 const html=renderSheetFrame({id:'sample',name:'Sample',data:{}});
 assert.match(html,/data-dice-option="nat20Effects"/);assert.match(html,/data-dice-option="nat1Effects"/);assert.doesNotMatch(html,/data-dice-option="(?:critStyle|nat20Style)"/);assert.match(html,/data-preview-critical="20"/);assert.match(html,/data-preview-critical="1"/);
});
test('the native static handler serves critical manifests, frame pages and cues only inside the asset directory',async()=>{
 const prefix=path.join(os.tmpdir(),'cosmos-critical-static-'),dir=await mkdtemp(prefix);let server;
 try{const asset=path.join(dir,'assets','critical-fx');await mkdir(asset,{recursive:true});const bytes=await sharp({create:{width:2,height:2,channels:4,background:'#9766cc'}}).webp().toBuffer();await writeFile(path.join(asset,'page.webp'),bytes);await writeFile(path.join(asset,'manifest.json'),'{}');await writeFile(path.join(asset,'cue.ogg'),Buffer.from('fixture'));await writeFile(path.join(dir,'outside.webp'),bytes);await writeFile(path.join(dir,'auth-headers.json'),JSON.stringify({'Content-Security-Policy':"default-src 'self'"}));server=http.createServer(await createStaticHandler(dir));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
  for(const [file,type]of [['page.webp','image/webp'],['manifest.json','application/json'],['cue.ogg','audio/ogg']]){const response=await fetch(base+'/assets/critical-fx/'+file);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),type);}assert.equal((await fetch(base+'/outside.webp')).status,404);
 }finally{if(server)await new Promise(resolve=>server.close(resolve));assert.ok(path.resolve(dir).startsWith(path.resolve(prefix)));await rm(dir,{recursive:true,force:true});}
});
