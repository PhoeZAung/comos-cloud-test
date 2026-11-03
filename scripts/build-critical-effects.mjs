import sharp from 'sharp';
import {readFile,writeFile,mkdir,cp,stat} from 'node:fs/promises';
import {homedir} from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {criticalEffects} from '../src/features/critical-effects.mjs';
export async function buildCriticalEffects(){
 const base=path.join(homedir(),'.cosmos-dev','critical-fx'),source=path.join(base,'sources'),cache=path.join(base,'compiled'),destination=new URL('../dist/assets/critical-fx/',import.meta.url),inputs=[];
 for(const effect of criticalEffects){try{const file=await readFile(path.join(source,effect.id+'.gif'));inputs.push({effect,file,hash:createHash('sha256').update(file).digest('hex')});}catch{console.info('Critical GIF assets are not installed; static critical receipts remain available.');return false;}}
 await mkdir(cache,{recursive:true});let previous;try{previous=JSON.parse(await readFile(path.join(cache,'manifest.json'),'utf8'));}catch{}
 let valid=previous?.version===1&&inputs.every(({effect,hash})=>previous.effects?.[effect.id]?.sourceSha256===hash);
 if(valid){for(const entry of Object.values(previous.effects))for(const page of entry.pages)try{await stat(path.join(cache,page));}catch{valid=false;}}
 if(!valid){
  const manifest={version:1,effects:{}};
  for(const {effect,file,hash} of inputs){
   const metadata=await sharp(file,{animated:true}).metadata();if(metadata.pages!==effect.frames)throw Error('Unexpected frame count for '+effect.id);
   const scale=Math.min(1,480/Math.max(metadata.width,metadata.pageHeight)),width=Math.round(metadata.width*scale);
   const {data,info}=await sharp(file,{animated:true}).resize({width}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   const height=info.pageHeight||Math.round(info.height/effect.frames),bytes=info.width*height*4,pages=[];
   for(let first=0;first<effect.frames;first+=16){
    const overlays=[];for(let offset=0;offset<16&&first+offset<effect.frames;offset++)overlays.push({input:data.subarray((first+offset)*bytes,(first+offset+1)*bytes),raw:{width:info.width,height,channels:4},left:offset%4*info.width,top:Math.floor(offset/4)*height});
    const name=effect.id+'-'+pages.length+'.webp';await sharp({create:{width:info.width*4,height:height*4,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(overlays).webp({quality:88,alphaQuality:100,effort:3}).toFile(path.join(cache,name));pages.push(name);
   }
   manifest.effects[effect.id]={width:info.width,height,columns:4,frames:effect.frames,delays:metadata.delay.map(delay=>Math.max(10,delay)),pages,sourceSha256:hash};
   console.info('Prepared '+effect.id+': '+effect.frames+' frames.');
  }
  await writeFile(path.join(cache,'manifest.json'),JSON.stringify(manifest));
 }
 for(const sound of ['fire','arcane','fizzle'])try{await cp(path.join(homedir(),'.cosmos-dev','roll-fx',sound+'.ogg'),path.join(cache,sound+'.ogg'));}catch{}
 await mkdir(destination,{recursive:true});await cp(cache,destination,{recursive:true});return true;
}
