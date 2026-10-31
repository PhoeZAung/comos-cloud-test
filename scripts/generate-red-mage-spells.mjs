import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const data=JSON.parse(await readFile(new URL('rules/classes/red-mage-spells.json',root),'utf8'));
const seen=new Set();
for(const spell of data.spells){
 if(seen.has(spell.id)||!Number.isInteger(spell.level)||spell.level<0||spell.level>6||spell.mpCost!==spell.level||spell.automation!=='manual'||!/^https?:\/\//.test(spell.url)||!/^\w{64}$/.test(spell.archiveSha256)||!spell.description)throw Error('Invalid Red Mage spell reference: '+spell.id);
 seen.add(spell.id);
}
const target=new URL('src/features/characters/rules/red-mage-spells.mjs',root);
const text='// Generated from rules/classes/red-mage-spells.json; spell effects are manual.\nexport const redMageSpells='+JSON.stringify(data.spells)+';\n';
if(process.argv.includes('--check')){if(await readFile(target,'utf8')!==text)throw Error('Red Mage spell projection is stale');}
else await writeFile(target,text);
console.log('Validated '+seen.size+' Red Mage level-0–6 spell references.');
