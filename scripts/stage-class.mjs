import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateClassManifest,validateClassDefinition} from '../src/features/characters/rules/class-contract.mjs';
import {generateClassCatalog} from './generate-class-catalog.mjs';

const root=new URL('../',import.meta.url);
const slugPattern=/^[a-z][a-z0-9-]{1,50}$/;

// Imports only as STAGED. A class-specific verified adapter is mandatory before activation.
export function stagedManifest(manifest,definition,slug,{optionCatalog=null}={}){
 if(!slugPattern.test(slug||'')||definition?.id!=='ffd20:class:'+slug)
  throw Error('Class ID does not match its safe file name.');
 validateClassManifest(manifest);
 validateClassDefinition(definition,{optionCatalog});
 if(manifest.classes.some(entry=>entry.id===definition.id))
  throw Error(definition.id+' already exists in the manifest. No changes made.');
 const entry={id:definition.id,file:'rules/classes/'+slug+'.class.json',
  status:'staged',adapter:null,coverage:definition.review.coverage,
  ...(optionCatalog?{optionFile:'rules/classes/'+slug+'-talents.json'}:{})};
 const updated={...manifest,classes:[...manifest.classes,entry]};
 validateClassManifest(updated);
 return updated;
}

export async function stageClass(slug){
 if(!slugPattern.test(slug||''))throw Error('Usage: npm run rules:class:stage -- <class-slug>');
 const path=new URL('rules/classes/manifest.json',root);
 const previous=await readFile(path,'utf8');
 const manifest=JSON.parse(previous);
 const definition=JSON.parse(await readFile(new URL('rules/classes/'+slug+'.class.json',root),'utf8'));
 let options=null;
 try{options=JSON.parse(await readFile(new URL('rules/classes/'+slug+'-talents.json',root),'utf8'));}
 catch(error){if(error.code!=='ENOENT')throw error;}
 const updated=stagedManifest(manifest,definition,slug,{optionCatalog:options});
 await writeFile(path,JSON.stringify(updated,null,2)+'\n');
 try{await generateClassCatalog();}
 catch(error){await writeFile(path,previous);throw error;}
 return definition.id;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const id=await stageClass(process.argv[2]);
 console.log('Staged '+id+'. Wizard remains disabled until its separately verified adapter is implemented.');
}
