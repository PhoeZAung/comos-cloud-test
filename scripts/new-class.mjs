import {mkdir,writeFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const name=process.argv[2],re=/^[a-z][a-z0-9-]{1,50}$/;
if(!re.test(name||''))throw Error('Usage: node scripts/new-class.mjs <kebab-case-class-name> (at least two letters)');
const path=new URL('rules/classes/'+name+'.class.json',root);
try{await access(path);throw Error('Class file already exists. Never overwrite an extraction.');}catch(e){if(e.code!=='ENOENT')throw e;}
const id='ffd20:class:'+name;
const source={sourceId:'main',section:'Table: Class',locator:'CHECK-OFFICIAL-ROW'};
const levels=Array.from({length:20},(_,i)=>({level:i+1,bab:0,iterativeAttacks:[],fort:0,ref:0,will:0,special:'NOT EXTRACTED',baseMp:null,maxSpellLevel:null,sourceRefs:[source]}));
const c={schemaVersion:'comos.rules.v1',kind:'class',id,name:name.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),revision:1,
 sources:[{id:'main',url:'https://finalfantasyd20.com/classes/',title:'REPLACE WITH EXACT OFFICIAL CLASS PAGE',retrievedOn:'',sourceKind:'official_web'}],
 review:{state:'needs_review',coverage:'scaffold',reviewedBy:null,reviewedOn:null,issues:[{path:'/data',blocking:true,reason:'Empty scaffold. Fill all 20 source-backed progression rows, features, upgrade events and choice dependencies before registering.'}]},
 data:{category:'core',maximumLevel:20,hitDie:8,alignment:'Any',skillPointsPerLevel:{base:0,plusAbilityModifier:'int',minimum:1},classSkills:[],
  proficiencies:{weapons:[],armor:[],shields:[]},startingWealth:null,levels,features:[],upgrades:[],events:[],archetypeIndex:[],spellcasting:{learningMode:'none'}}};
await mkdir(new URL('rules/classes/',root),{recursive:true});
await writeFile(path,JSON.stringify(c,null,2)+'\n',{flag:'wx'});
console.log('Created '+name+'.class.json. Fill source references, replace all placeholders, then register in rules/classes/manifest.json as status=staged and adapter=null.');
