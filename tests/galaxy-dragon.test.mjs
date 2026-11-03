import test from 'node:test';
import assert from 'node:assert/strict';
import {naturalResult} from '../src/ui/critical-fx.mjs';
import {normalizeDiceOptions,validDiceOptions} from '../src/features/dice-options.mjs';
import {playDragonRoar} from '../src/ui/dragon-roar.mjs';
import {synthesizeDragonRoar,DRAGON_ROAR_SECONDS} from '../src/features/dragon-roar.mjs';
import {ashwingWingbeat} from '../src/features/ashwing-wingbeat.mjs';
import {wingPoseAt} from '../src/features/dragon-wing-pose.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {createUserRepository} from '../backend/repositories/users.mjs';
import {createAccountService} from '../backend/account/service.mjs';
import {createStaticHandler} from '../backend/http/static.mjs';
import http from 'node:http';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const roll=(face,total=face,dice='1d20')=>({kind:'check',total,breakdown:[{dice,rolls:[face]}]});
test('natural 20 uses the unmodified main d20, not totals, damage, or confirmation',()=>{
 assert.equal(naturalResult(roll(20,27)),20);assert.equal(naturalResult(roll(20,15)),20);
 assert.equal(naturalResult(roll(17,20)),null);assert.equal(naturalResult(roll(12,20)),null);
 for(const dice of ['1d100','1d200','2d10','1d6'])assert.equal(naturalResult(roll(20,20,dice)),null);
 assert.equal(naturalResult({...roll(17),kind:'weapon',damage:roll(20),critical:{confirmation:roll(20)}}),null);
 assert.equal(naturalResult({kind:'spell',damage:roll(20)}),null);
 assert.equal(naturalResult({kind:'spell',attack:roll(20,26),damage:roll(3)}),20);
 assert.equal(naturalResult(roll(1,20)),1);assert.equal(naturalResult(roll(19,20)),null);
 const input=Object.freeze({...roll(20,28),breakdown:Object.freeze([Object.freeze({dice:'1d20',rolls:Object.freeze([20])})])});assert.equal(naturalResult(input),20);assert.equal(input.total,28);
});
test('galaxy dragon defaults on old and new options without enabling sound or changing volume',()=>{
 assert.equal(normalizeDiceOptions().nat20Style,'dragon');
 const legacy=normalizeDiceOptions({critStyle:'arcane',critSound:false,critEffects:false,volume:.25});
 assert.equal(legacy.nat20Style,'dragon');assert.equal(legacy.critSound,false);assert.equal(legacy.critEffects,false);assert.equal(legacy.volume,.25);
 for(const nat20Style of ['dragon','fire','arcane'])assert.equal(normalizeDiceOptions({nat20Style}).nat20Style,nat20Style);
 const {nat20Style,...old}=legacy;assert.equal(validDiceOptions(old),true);assert.equal(validDiceOptions({...legacy,nat20Style:'unknown'}),false);
});
test('natural-20 style persists and older preference payloads retain an explicit selection',async()=>{
 const db=await openDatabase(':memory:');try{
  const users=createUserRepository(db),service=createAccountService({db,files:{}});let user=users.create();assert.equal(user.preferences.diceOptions.nat20Style,'dragon');
  user=service.update(user.id,{revision:user.revision,preferences:{...user.preferences,diceOptions:{...user.preferences.diceOptions,nat20Style:'arcane',critSound:false}}});
  assert.equal(users.get(user.id).preferences.diceOptions.nat20Style,'arcane');
  const {nat20Style,...old}=user.preferences.diceOptions;
  user=service.update(user.id,{revision:user.revision,preferences:{...user.preferences,diceOptions:{...old,volume:.35}}});
  assert.equal(user.preferences.diceOptions.nat20Style,'arcane');assert.equal(user.preferences.diceOptions.critSound,false);assert.equal(user.preferences.diceOptions.volume,.35);
 }finally{db.close();}
});
function audio(state='running'){
 const nodes=[];const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=kind=>{const n={kind,gain:param(),frequency:param(),Q:{value:0},connect(){return this;},disconnect(){this.disconnected=true;},start(time){this.started=time;},stop(time){this.stopped=time;}};nodes.push(n);return n;};
 return {state,nodes,currentTime:10,sampleRate:8000,destination:{},createBuffer(_channels,size){this.bufferCount=(this.bufferCount||0)+1;const data=new Float32Array(size);return {getChannelData:()=>data};},createGain:()=>node('gain'),createBufferSource:()=>node('noise'),createBiquadFilter:()=>node('filter'),createOscillator:()=>node('tone')};
}
test('roar respects muted/suspended audio, has a bounded duration and releases nodes',()=>{
 for(const [state,volume] of [['suspended',1],['closed',1],['running',0],['running',NaN]]){const context=audio(state);playDragonRoar(context,volume)();assert.equal(context.nodes.length,0);}
 const context=audio(),stop=playDragonRoar(context,.8),sources=context.nodes.filter(node=>['noise','tone'].includes(node.kind));
 assert.equal(sources.length,1);for(const source of sources){assert.ok(source.started>=10);assert.ok(source.stopped<=11);}
 stop();stop();assert.ok(context.nodes.every(node=>node.disconnected));playDragonRoar(context,.5)();assert.equal(context.bufferCount,1,'roar buffer should be reused');
});
test('the real static handler serves the lightweight galaxy texture with an image MIME type',async()=>{
 const prefix=path.join(os.tmpdir(),'cosmos-dragon-static-'),dir=await mkdtemp(prefix);let server;
 try{
  const bytes=await readFile(new URL('../dist/assets/roll-fx/galaxy-nebula.webp',import.meta.url));assert.ok(bytes.length<48000,'galaxy texture must stay under 48 KB');
  await mkdir(path.join(dir,'assets','roll-fx'),{recursive:true});await writeFile(path.join(dir,'assets','roll-fx','galaxy-nebula.webp'),bytes);await writeFile(path.join(dir,'outside.webp'),bytes);await writeFile(path.join(dir,'auth-headers.json'),JSON.stringify({'Content-Security-Policy':"default-src 'self'"}));
  server=http.createServer(await createStaticHandler(dir));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
  const response=await fetch(base+'/assets/roll-fx/galaxy-nebula.webp');assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/webp');assert.equal((await response.arrayBuffer()).byteLength,bytes.length);assert.equal((await fetch(base+'/outside.webp')).status,404);
 }finally{if(server)await new Promise(resolve=>server.close(resolve));assert.ok(path.resolve(dir).startsWith(path.resolve(prefix)));await rm(dir,{recursive:true,force:true});}
});

test('Ashwing fly_loop drives a visible, continuous wingbeat instead of CSS in a mask',()=>{
 assert.equal(ashwingWingbeat.clip,'fly_loop');assert.equal(ashwingWingbeat.samples.length,25);assert.ok(Math.abs(ashwingWingbeat.duration-.8)<.00001);assert.match(ashwingWingbeat.sourceSha256,/^[a-f0-9]{64}$/);
 const start=wingPoseAt(0),end=wingPoseAt(ashwingWingbeat.duration*1000);start.forEach((matrix,i)=>matrix.forEach((v,j)=>assert.ok(Math.abs(v-end[i][j])<.00001)));
 const point=matrix=>[matrix[0]*428+matrix[2]*63+matrix[4],matrix[1]*428+matrix[3]*63+matrix[5]],a=point(wingPoseAt(80)[0]),b=point(wingPoseAt(320)[0]);assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])>80,'wing tip must visibly travel');
 for(let t=0;t<1600;t+=16)for(const [a,b,c,d,...rest] of wingPoseAt(t)){assert.ok([a,b,c,d,...rest].every(Number.isFinite));assert.ok(a*d-b*c>=.279&&a*d-b*c<=1.041,'wings must not invert');}
});
test('the original roar waveform is finite, audible, peak-limited, and fades out',()=>{
 const signal=synthesizeDragonRoar(16000);assert.equal(signal.length,Math.ceil(16000*DRAGON_ROAR_SECONDS));assert.ok(signal.every(Number.isFinite));const peak=signal.reduce((value,x)=>Math.max(value,Math.abs(x)),0),rms=Math.sqrt(signal.reduce((value,x)=>value+x*x,0)/signal.length);assert.ok(peak>.85&&peak<=.861);assert.ok(rms>.03);assert.equal(signal[0],0);assert.ok(Math.abs(signal.at(-1))<.001);assert.deepEqual(synthesizeDragonRoar(16000),signal);assert.throws(()=>synthesizeDragonRoar(0));
});
