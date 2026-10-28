import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateClassDefinition} from '../src/features/characters/rules/class-contract.mjs';

const root=new URL('../',import.meta.url);
const slugPattern=/^[a-z][a-z0-9-]{1,50}$/;
const value=x=>x==null?'not specified':String(x);
const stateLine=state=>Object.entries(state||{}).map(([k,v])=>k+': '+value(v)).join('; ')||'no numeric state recorded';
const refsLine=(refs,sources)=>(refs||[]).map(ref=>{
 const source=(sources||[]).find(s=>s.id===ref.sourceId);
 return (ref.section||'Section')+' ('+value(ref.locator)+')'+(source?.url?' — '+source.url:'');
}).join(' | ')||'SOURCE NOT RECORDED';

export function makeClassReview(definition,{optionCatalog=null}={}){
 const data=definition?.data||{},lines=[],add=(...rows)=>lines.push(...rows);
 let structural='PASS (structural checks only, not human approval)';
 try{validateClassDefinition(definition,{optionCatalog});}
 catch(error){structural='BLOCKED: '+error.message;}
 add('FFD20 CLASS RULES — HUMAN REVIEW: '+(definition?.name||'Unnamed class'),
 '====================================================',
 'Class ID: '+(definition?.id||'unknown'),
 'Review state: '+(definition?.review?.state||'not recorded'),
 'Coverage: '+(definition?.review?.coverage||'not recorded'),
 'Structure: '+structural,
 'This is a review aid, not proof of accuracy or permission to enable this class.','');
 add('1. WHAT NEEDS REVIEW','--------------------');
 const issues=definition?.review?.issues||[];
 if(!issues.length)add('No recorded issues; still compare the official source.');
 issues.forEach((issue,i)=>add(
  (i+1)+'. '+(issue.blocking?'[BLOCKING]':'[CHECK]')+' '+(issue.reason||'Unspecified issue'),
  '   Data location: '+(issue.path||'not recorded')));
 add('','2. ABILITY UPGRADE CHAINS (MOST IMPORTANT)',
 '------------------------------------------');
 const features=[...(data.features||[])].sort((a,b)=>a.atLevel-b.atLevel||a.name.localeCompare(b.name));
 for(const feature of features){
  const chain=(data.upgrades||[]).filter(u=>u.featureId===feature.id).sort((a,b)=>a.atClassLevel-b.atClassLevel);
  add(feature.name+' — gained at class level '+feature.atLevel,
      '  Permanent ID: '+feature.id,
      '  Original rule: '+(feature.description||'not recorded'),
      '  Initial values: '+stateLine(feature.initialState),
      '  Source: '+refsLine(feature.sourceRefs,definition.sources));
  if(!chain.length)add('  Later upgrades: none recorded.');
  let state={...(feature.initialState||{})};
  for(const upgrade of chain){
   state={...state,...(upgrade.changes||{})};
   add('  LEVEL '+upgrade.atClassLevel+' → IMPROVE SAME ABILITY (not a new card)',
       '    Change: '+(upgrade.description||'not described'),
       '    Values set at this level: '+stateLine(upgrade.changes),
       '    Resulting recorded values: '+stateLine(state),
       '    Source: '+refsLine(upgrade.sourceRefs,definition.sources));
  }
  add('');
 }
 if(!features.length)add('No abilities extracted.','');
 add('3. LEVEL TABLE & CHOICE OPPORTUNITIES','------------------------------------');
 for(const row of data.levels||[]){
  const choices=(data.events||[]).filter(e=>e.type==='choose'&&e.atClassLevel===row.level);
  const pools=choices.map(e=>(e.poolIds||(e.poolId?[e.poolId]:[])).join(' / '));
  add('Level '+row.level+': BAB +'+value(row.bab)+'; Fort +'+value(row.fort)+'; Ref +'+value(row.ref)+'; Will +'+value(row.will),
      '  Special: '+(row.special||'not recorded'),
      '  Choose: '+(pools.length?pools.join(' | '):'no recorded choices'),
      '  Source: '+refsLine(row.sourceRefs,definition.sources));
 }
 if(!(data.levels||[]).length)add('No level table extracted.');
 add('','4. TALENT OPTIONS & ARCHETYPES','-------------------------------',
     'Talent options recorded: '+(optionCatalog?.options?.length||0),
     'Archetypes indexed (not automatically enabled): '+(data.archetypeIndex||[]).length);
 for(const archetype of data.archetypeIndex||[])add('- '+archetype.name+' — '+(archetype.status||'unreviewed')+' — '+(archetype.sourceURL||'no source URL'));
 add('','REVIEWER CHECKLIST','------------------',
     '[ ] Every level table row matches the official source.',
     '[ ] Each ability is granted once; later improvements update the same ability.',
     '[ ] Upgrade levels, values, actions and citations match the original rules.',
     '[ ] Talent prerequisites and player choices are not assumed automatically.',
     '[ ] Conditional effects do not become permanent bonuses.',
     '[ ] Unresolved mechanics and archetypes remain disabled.',
     '','Leave review.state as needs_review until actually verified.');
 return lines.join('\n')+'\n';
}
export async function writeClassReview(slug){
 if(!slugPattern.test(slug||''))throw Error('Usage: npm run rules:class:review -- <class-slug>');
 const definition=JSON.parse(await readFile(new URL('rules/classes/'+slug+'.class.json',root),'utf8'));
 let options=null;
 try{options=JSON.parse(await readFile(new URL('rules/classes/'+slug+'-talents.json',root),'utf8'));}
 catch(error){if(error.code!=='ENOENT')throw error;}
 const path='docs/review/FFd20-'+slug+'-Class-Review.txt';
 await mkdir(new URL('docs/review/',root),{recursive:true});
 await writeFile(new URL(path,root),makeClassReview(definition,{optionCatalog:options}));
 return path;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const output=await writeClassReview(process.argv[2]);
 console.log('Wrote human-readable review: '+output);
}
