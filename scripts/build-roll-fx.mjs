import {cp,mkdir,access} from 'node:fs/promises';
import {homedir} from 'node:os';
import path from 'node:path';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
export async function buildRollFx(output,{local=false}={}){
 await build({entryPoints:[fileURLToPath(new URL('../src/ui/drake-fx.mjs',import.meta.url))],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:path.join(output,'assets/drake-fx.js')});
 if(!local)return;
 const source=path.join(homedir(),'.cosmos-dev','roll-fx');try{await access(source);}catch{return;}
 const destination=path.join(output,'assets/roll-fx');await mkdir(destination,{recursive:true});
 // Only named end-product assets; never copy credentials or the source ZIPs.
 for(const name of ['fire.gif','arcane.gif','drake.glb','dwarven-frame.png','fire.ogg','arcane.ogg','fizzle.ogg'])await cp(path.join(source,name),path.join(destination,name));
}
