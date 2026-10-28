import {access,mkdir,writeFile} from 'node:fs/promises';
const [parent,name]=process.argv.slice(2),re=/^[a-z][a-z0-9-]{1,50}$/;
if(!re.test(parent||'')||!re.test(name||''))throw Error('Usage: npm run rules:archetype:new -- <class-slug> <archetype-slug>');
const root=new URL('../',import.meta.url),path=new URL('rules/classes/archetypes/'+parent+'-'+name+'.archetype.json',root);
try{await access(path);throw Error('Archetype already exists; will not overwrite.');}catch(e){if(e.code!=='ENOENT')throw e;}
const id='ffd20:archetype:'+parent+':'+name;
const c={schemaVersion:'comos.rules.v1',kind:'archetype',id,parentClassId:'ffd20:class:'+parent,
 name:name.replace(/-/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase()),revision:1,
 sources:[{id:'main',url:'https://finalfantasyd20.com/classes/',title:'REPLACE with direct archetype URL',retrievedOn:'',sourceKind:'official_web'}],
 review:{state:'needs_review',coverage:'scaffold',issues:[{path:'/data',blocking:true,reason:'Extract exact replacements and new features with source locators; never register this empty template.'}]},
 data:{replacements:[],features:[],upgrades:[],events:[],resources:[],choicePools:[]}};
await mkdir(new URL('rules/classes/archetypes/',root),{recursive:true});
await writeFile(path,JSON.stringify(c,null,2)+'\n',{flag:'wx'});
console.log('Created '+parent+'-'+name+'.archetype.json. Fill and validate, then register with status=staged and adapter=null in rules/classes/archetypes/manifest.json.');
