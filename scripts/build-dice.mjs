import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {buildCustomDice} from './build-custom-dice.mjs';
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
  if(name==='world.onscreen.js'){
   const anchor='n.AddAttribute("customColor");';
   if(!source.includes(anchor))throw Error('Dice material adapter needs review.');
   source=source.replace(anchor,anchor+`
    // Cosmos custom finishes use the shipped numbered dice meshes/textures.
    for(const mat of [r,n]){
      const finish=i.cosmosFinish;
      if(finish){mat.specularPower=finish==='metal'?220:120;mat.specularColor.set(.85,.85,.95);}
      if(finish==='glass'){mat.alpha=.58;mat.backFaceCulling=false;mat.needDepthPrePass=true;mat.specularPower=180;}
      if(finish==='galaxy'){
        mat.emissiveColor.set(.12,.06,.23);
        mat.Fragment_Custom_Diffuse(\x60
          baseColor.rgb = mix(vColor.rgb, baseColor.rgb, baseColor.a);
          float cloud = .5+.5*sin(vPositionW.x*2.7+sin(vPositionW.z*4.0)+vPositionW.y*3.1);
          float star = pow(fract(sin(dot(floor(vPositionW.xz*35.0),vec2(12.9898,78.233)))*43758.5453),90.0);
          vec3 cosmos = mix(vColor.rgb*.14, mix(vColor.rgb,vec3(.35,.10,.65),.45),cloud)+vec3(star);
          baseColor.rgb=mix(cosmos,baseColor.rgb,baseColor.a);
        \x60);
      }
    }
`);
  }
  await writeFile(new URL(name,target),source);
 }
 await cp(new URL('../public/assets/dice-box/',import.meta.url),new URL('../dist/assets/dice-box/',import.meta.url),{recursive:true});
 await buildCustomDice();
}
