import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
export async function buildDiceAssets(){
 const target=new URL('../dist/assets/dice-box/lib/',import.meta.url);
 await mkdir(target,{recursive:true});
 for(const name of ['dice-box.es.js','Dice.js','world.onscreen.js','world.offscreen.js','world.none.js']){
  let source=await readFile(new URL('../node_modules/@3d-dice/dice-box/dist/'+name,import.meta.url),'utf8');
  if(name==='Dice.js'){
   const anchor='const d = t.pickWithRay(Ze.ray);';
   if(!source.includes(anchor))throw Error('Dice Box adapter needs review for this library version.');
   source=source.replace(anchor,`// Cosmos: orient settled visual dice to the authoritative server value.
      const rawWanted=s.config.data?.targetValue;
      const wanted=Number.isInteger(rawWanted)?(s.dieParent?((rawWanted-1)%10)+1:s.config.sides===100?Math.floor((rawWanted-1)/10)*10:rawWanted):undefined;
      if(Number.isInteger(wanted)){
        const face=Object.keys(o[s.dieType]).find(key=>o[s.dieType][key]===wanted);
        if(face!==undefined){
          const indices=c.getIndices(),positions=c.getVerticesData('position'),start=Number(face)*3;
          const vertex=index=>new p(positions[index*3],positions[index*3+1],positions[index*3+2]);
          const a=vertex(indices[start]),b=vertex(indices[start+1]),f=vertex(indices[start+2]);
          const normal=p.Cross(b.subtract(a),f.subtract(a)).normalize();
          const orient=n=>{
            const dot=Math.max(-1,Math.min(1,p.Dot(n,u))),axis=p.Cross(n,u);
            if(axis.length()<0.0001)axis.copyFrom(p.Cross(n,new p(1,0,0)));
            if(axis.length()<0.0001)axis.copyFrom(new p(0,0,1));
            const rotation=s.mesh.rotationQuaternion.constructor.RotationAxis(axis.normalize(),Math.acos(dot));
            s.mesh.rotationQuaternion=rotation;c.rotationQuaternion=rotation;c.computeWorldMatrix(true);s.mesh.computeWorldMatrix(true);
          };
          orient(normal);
          if(o[s.dieType][t.pickWithRay(Ze.ray)?.faceId]!==wanted)orient(normal.negate());
        }
      }
      const d = t.pickWithRay(Ze.ray);`);
  }
  await writeFile(new URL(name,target),source);
 }
 await cp(new URL('../public/assets/dice-box/',import.meta.url),new URL('../dist/assets/dice-box/',import.meta.url),{recursive:true});
}
