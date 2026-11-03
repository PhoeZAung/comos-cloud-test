// Only compressed pages are shared. At most current/next decoded atlases are held.
let manifest;const blobs=new Map();
async function getManifest(){manifest??=fetch('/assets/critical-fx/manifest.json',{cache:'force-cache'}).then(response=>{if(!response.ok)throw Error('Effect unavailable');return response.json();}).catch(error=>{manifest=null;throw error;});return manifest;}
async function pageBlob(name){if(!blobs.has(name)){if(blobs.size>=16)blobs.delete(blobs.keys().next().value);blobs.set(name,fetch('/assets/critical-fx/'+name,{cache:'force-cache'}).then(response=>{if(!response.ok)throw Error('Effect unavailable');return response.blob();}).catch(error=>{blobs.delete(name);throw error;}));}return blobs.get(name);}
export async function preloadCriticalFrames(effect){const entry=(await getManifest()).effects[effect.id];if(!entry||entry.frames!==effect.frames)throw Error('Effect unavailable');await pageBlob(entry.pages[0]);if(entry.pages[1])void pageBlob(entry.pages[1]).catch(()=>{});return entry;}
async function decode(blob){if(typeof createImageBitmap==='function'){const bitmap=await createImageBitmap(blob);return {image:bitmap,close:()=>bitmap.close()};}const url=URL.createObjectURL(blob),image=new Image();try{image.src=url;await image.decode();return {image,close:()=>URL.revokeObjectURL(url)};}catch(error){URL.revokeObjectURL(url);throw error;}}
export async function createCriticalFrames(effect){
 const entry=await preloadCriticalFrames(effect),pages=new Map(),pending=new Map();let closed=false,failure=null;
 function load(index){if(closed||!entry.pages[index]||pages.has(index))return Promise.resolve();if(!pending.has(index))pending.set(index,pageBlob(entry.pages[index]).then(decode).then(page=>{if(closed)page.close();else pages.set(index,page);}).catch(error=>{failure=error;}).finally(()=>pending.delete(index)));return pending.get(index);}
 await load(0);if(failure)throw failure;void load(1);
 return {entry,
  ready(frame){if(failure)throw failure;const index=Math.floor(frame/16);void load(index);return pages.has(index);},
  draw(context,frame,width,height){const index=Math.floor(frame/16),page=pages.get(index);if(!page)return;const offset=frame%16;context.clearRect(0,0,width,height);const scale=effect.fit==='cover'?Math.max(width/entry.width,height/entry.height):null,dw=scale?entry.width*scale:width,dh=scale?entry.height*scale:height;context.drawImage(page.image,offset%4*entry.width,Math.floor(offset/4)*entry.height,entry.width,entry.height,(width-dw)/2,(height-dh)/2,dw,dh);for(const [key,old] of pages)if(key<index){old.close();pages.delete(key);}void load(index+1);},
  close(){closed=true;for(const page of pages.values())page.close();pages.clear();}
 };
}
