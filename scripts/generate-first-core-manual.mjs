import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
export async function generateFirstCoreManual({check=false}={}){
 const catalog=JSON.parse(await readFile(new URL('rules/classes/first-core-manual.json',root),'utf8'));
 if(catalog.schemaVersion!=='cosmos.manual-source.v1'||catalog.mode!=='manual')throw Error('Invalid manual source catalog.');
 const seen=new Set(),expected={archer:15,bard:21,beastmaster:12};
 for(const [slug,count] of Object.entries(expected)){
  const family=catalog.families.find(f=>f.id==='ffd20:class:'+slug);
  if(!family||family.pages.filter(p=>p.kind==='archetype').length!==count)throw Error('Incomplete '+slug+' source family.');
  const parent=JSON.parse(await readFile(new URL('rules/classes/'+slug+'.class.json',root),'utf8'));
  if(parent.data.features.some(f=>!family.pages[0].cards.some(c=>c.canonicalRuleId===f.id)))throw Error('Missing individual '+slug+' feature text.');
  for(const page of family.pages){
   if(seen.has(page.id)||!page.cards.length||!/^https:\/\/(www\.)?finalfantasyd20\.com\//.test(page.url))throw Error('Invalid source page '+page.id);
   seen.add(page.id);
   for(const card of page.cards){
    if(seen.has(card.id)||!card.name||!card.description?.trim()||card.description.length>100000||createHash('sha256').update(card.description).digest('hex')!==card.textSha256)throw Error('Invalid source card '+card.id);
    seen.add(card.id);
   }
  }
 }
 if(catalog.families.length!==3||catalog.families.find(f=>f.name==='Bard').pages.find(p=>p.kind==='songs').cards.length!==176)throw Error('Incomplete source catalog.');
 const output='// Generated manual reference cards. These are not automatic class/archetype grants.\nexport const firstCoreManual='+JSON.stringify(catalog)+';\n';
 const target=new URL('src/features/characters/rules/first-core-manual-catalog.mjs',root);
 if(check){if(await readFile(target,'utf8')!==output)throw Error('Manual source projection is stale.');}
 else await writeFile(target,output);
 return catalog;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const catalog=await generateFirstCoreManual({check:process.argv.includes('--check')});
 console.log('Validated '+catalog.families.length+' manual source families.');
}
