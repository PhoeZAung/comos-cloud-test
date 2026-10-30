import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateBardSongCatalog} from '../src/features/characters/rules/song-contract.mjs';
import {validateBardJingleMechanics} from '../src/features/characters/rules/jingle-contract.mjs';
import {validateBardSongMechanics} from '../src/features/characters/rules/song-mechanics-contract.mjs';
const root=new URL('../',import.meta.url);
export async function generateBardCatalog(){
 const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
 const catalog=await read('rules/classes/bard-songs.json'),jingles=await read('rules/classes/bard-jingle-mechanics.json'),songs=await read('rules/classes/bard-song-mechanics.json');
 validateBardSongCatalog(catalog);validateBardJingleMechanics(jingles,catalog);validateBardSongMechanics(songs,catalog);
 const data=catalog.songs.filter(s=>s.level<=1).map(s=>{
  const m=(s.level===0?jingles:songs).entries.find(e=>e.songId===s.id);
  return {id:s.id,name:s.name,level:s.level,kind:s.kind,usageMode:s.usageMode,mpCost:m.mpCost,school:m.school,range:m.range,
   target:typeof m.targeting==='string'?m.targeting:Object.entries(m.targeting).map(([k,v])=>k+': '+v).join('; '),
   duration:m.duration,save:m.savingThrow,spellResistance:m.spellResistance,castingTime:m.castingTime,
   description:[m.castingTime+'; '+m.mpCost+' MP.',m.mechanicsSummary,
    'Target: '+(typeof m.targeting==='string'?m.targeting:Object.entries(m.targeting).map(([k,v])=>k+': '+v).join('; '))+'.',
    'Range: '+m.range+'. Duration: '+m.duration+'.','Save: '+m.savingThrow+'. Spell resistance: '+m.spellResistance+'.',
    m.scaling?.length?'Scaling: '+m.scaling.map(x=>x.parameter+' = '+x.expression).join('; ')+'.':'',
    s.usageMode==='maintained'?'Maintained: one song at a time; free action each round; range, saves, resistance and maximum duration still apply.':'',
    'Apply effects manually; conditional effects are not permanent sheet bonuses.'].filter(Boolean).join('\n'),url:m.sourceURL};
 });
 await writeFile(new URL('src/features/characters/rules/bard-songs.mjs',root),'// Generated from validated Bard song and jingle mechanics. Do not edit.\nexport const bardSongs='+JSON.stringify(data)+';\n');
 return data;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log('Validated '+(await generateBardCatalog()).length+' first-level Bard song/jingle options.');
