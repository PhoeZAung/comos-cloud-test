import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const dest=new URL('src/features/characters/rules/archer-catalog.mjs',root);
export async function generateArcherPreview({check=false}={}){
 const c=JSON.parse(await readFile(new URL('rules/classes/archer.class.json',root),'utf8'));
 const t=JSON.parse(await readFile(new URL('rules/classes/archer-talents.json',root),'utf8'));
 if(c.kind!=='class'||c.id!=='ffd20:class:archer'||t.parentClassId!==c.id)throw Error('Archer catalog source mismatch');
 if(c.data.levels.length!==20||c.data.levels.some((r,i)=>r.level!==i+1))throw Error('Invalid Archer level table');
 const featureIds=new Set(c.data.features.map(f=>f.id));
 if(featureIds.size!==c.data.features.length||c.data.upgrades.some(u=>!featureIds.has(u.featureId)))throw Error('Invalid Archer upgrade targets');
 if(t.options.length!==52||new Set(t.options.map(o=>o.id)).size!==52)throw Error('Archer talents missing or duplicated');
 const data={...c,data:{...c.data,talents:t.options}};
 const text='// Generated Archer preview catalog from rules/classes/archer.class.json + archer-talents.json.\n// This is read-only inspection data; it does not enable Archer character saving.\nexport const archer='+JSON.stringify(data)+';\n';
 if(check){if(await readFile(dest,'utf8')!==text)throw Error('Archer class projection stale');}
 else await writeFile(dest,text);
 return data;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await generateArcherPreview({check:process.argv.includes('--check')});
