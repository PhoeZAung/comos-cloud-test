// Offline retargeting only. The source GLB stays outside the website/repository.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
if(process.argv.length!==3)throw Error('Pass the private Ashwing Drake Lite GLB path.');
const bytes=await readFile(process.argv[2]);
if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2)throw Error('Expected glTF binary version 2.');
const length=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+length)),binary=bytes.subarray(28+length);
const clip=gltf.animations.find(animation=>animation.name==='fly_loop');if(!clip)throw Error('fly_loop was not found.');
function accessor(index){const a=gltf.accessors[index],v=gltf.bufferViews[a.bufferView],width={SCALAR:1,VEC3:3,VEC4:4}[a.type];if(a.componentType!==5126||!width||a.sparse)throw Error('Unsupported animation accessor.');return Array.from({length:a.count},(_,i)=>Array.from({length:width},(_,j)=>binary.readFloatLE((v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||width*4)+j*4)));}
const parents=new Map();gltf.nodes.forEach((node,index)=>node.children?.forEach(child=>parents.set(child,index)));
const tracks=clip.channels.map(channel=>{const sampler=clip.samplers[channel.sampler];if(!['LINEAR','STEP'].includes(sampler.interpolation||'LINEAR'))throw Error('Unsupported clip interpolation.');return {...channel.target,step:sampler.interpolation==='STEP',times:accessor(sampler.input).map(t=>t[0]),values:accessor(sampler.output)};});
const duration=Math.max(...tracks.map(track=>track.times.at(-1))),fps=30;
function interpolate(track,time){let index=0;while(index+1<track.times.length&&track.times[index+1]<=time)index++;const a=track.values[index],b=track.values[Math.min(index+1,track.values.length-1)],mix=track.step||index===track.times.length-1?0:(time-track.times[index])/(track.times[index+1]-track.times[index]);if(track.path!=='rotation')return a.map((v,i)=>v+(b[i]-v)*mix);let dot=a.reduce((sum,v,i)=>sum+v*b[i],0),sign=dot<0?-1:1;dot=Math.abs(dot);const angle=Math.acos(Math.min(1,dot)),sine=Math.sin(angle);const q=dot>.9995?a.map((v,i)=>v+(sign*b[i]-v)*mix):a.map((v,i)=>(v*Math.sin((1-mix)*angle)+sign*b[i]*Math.sin(mix*angle))/sine);const norm=Math.hypot(...q);return q.map(v=>v/norm);}
const multiply=(a,b)=>Array.from({length:16},(_,n)=>{const row=n%4,column=Math.floor(n/4);let sum=0;for(let i=0;i<4;i++)sum+=a[i*4+row]*b[column*4+i];return sum;});
function matrix(node){const [x,y,z,w]=node.rotation||[0,0,0,1],[sx,sy,sz]=node.scale||[1,1,1],[tx,ty,tz]=node.translation||[0,0,0];return [(1-2*(y*y+z*z))*sx,2*(x*y+z*w)*sx,2*(x*z-y*w)*sx,0,2*(x*y-z*w)*sy,(1-2*(x*x+z*z))*sy,2*(y*z+x*w)*sy,0,2*(x*z+y*w)*sz,2*(y*z-x*w)*sz,(1-2*(x*x+y*y))*sz,0,tx,ty,tz,1];}
const named=name=>{const index=gltf.nodes.findIndex(node=>node.name===name);if(index<0)throw Error('Missing bone '+name);return index;};
const chest=named('spine_03'),bones=['L','R'].map(side=>[named('shoulder_'+side),named('hand_'+side),named('strut_d_02_'+side)]),raw=[];
for(let frame=0;frame<=Math.round(duration*fps);frame++){
 const nodes=gltf.nodes.map(node=>({...node}));for(const track of tracks)nodes[track.node][track.path]=interpolate(track,frame/fps);
 const cache=new Map(),world=index=>{if(!cache.has(index))cache.set(index,parents.has(index)?multiply(world(parents.get(index)),matrix(nodes[index])):matrix(nodes[index]));return cache.get(index);};
 const body=world(chest),basis=[0,1,2].map(i=>{const axis=body.slice(i*4,i*4+3),norm=Math.hypot(...axis);return axis.map(v=>v/norm);});
 const relative=(point,base)=>{const delta=world(point).slice(12,15).map((value,i)=>value-world(base)[12+i]);return basis.map(axis=>axis.reduce((sum,value,i)=>sum+value*delta[i],0));};
 raw.push(bones.flatMap(([shoulder,hand,tip])=>{const endpoint=relative(tip,shoulder),wrist=relative(hand,shoulder);return [Math.abs(endpoint[0]),endpoint[2],wrist[1]];}));
}
const ranges=raw[0].map((_,column)=>{const values=raw.map(row=>row[column]);return [Math.min(...values),Math.max(...values)];});
const samples=raw.map(row=>row.map((value,column)=>{const [min,max]=ranges[column],t=max>min?(value-min)/(max-min):.5;return Number((column%3===0?t:t*2-1).toFixed(5));}));
const license=await readFile(new URL('../docs/licenses/ASHWING-DRAKE-LITE.txt',import.meta.url),'utf8');
await writeFile(new URL('../src/features/ashwing-wingbeat.mjs',import.meta.url),'/*\n'+license+'\nCompiled wing-motion curves for the Cosmos end product, not a reusable asset pack.\n*/\nexport const ashwingWingbeat='+JSON.stringify({clip:'fly_loop',fps,duration:Number(duration.toFixed(6)),sourceSha256:createHash('sha256').update(bytes).digest('hex'),samples})+';\n');
console.log('Retargeted fly_loop: '+samples.length+' frames, '+duration+' seconds. Raw model was not copied.');
