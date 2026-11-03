import {mkdir,readFile,writeFile} from 'node:fs/promises';
export async function buildCustomDice(){
 const root=new URL('../dist/assets/dice-box/themes/',import.meta.url);
 for(const shape of ['standard','gemstone'])for(const material of ['polished','glass','galaxy','metal']){
  const base=shape==='gemstone'?'gemstone':'default',id='cosmos-'+shape+'-'+material,config=JSON.parse(await readFile(new URL(base+'/theme.config.json',root),'utf8'));
  const prefix=value=>typeof value==='string'?'../'+base+'/'+value:Object.fromEntries(Object.entries(value).map(([key,value])=>[key,prefix(value)]));
  config.systemName=id;config.meshName=base;config.meshFile='../'+base+'/'+config.meshFile;config.material={...config.material,cosmosFinish:material};
  for(const key of ['diffuseTexture','bumpTexture','specularTexture'])if(config.material[key])config.material[key]=prefix(config.material[key]);
  await mkdir(new URL(id+'/',root),{recursive:true});await writeFile(new URL(id+'/theme.config.json',root),JSON.stringify(config));
 }
}
