import {patchLandingAnimation,patchPhysicsRecording} from './dice-landing-animation.mjs';
import {patchSettledFaces} from './dice-settled-adapter.mjs';
import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {buildCustomDice} from './build-custom-dice.mjs';
export async function buildDiceAssets(){
 const target=new URL('../dist/assets/dice-box/lib/',import.meta.url);
 await mkdir(target,{recursive:true});
 for(const name of ['dice-box.es.js','Dice.js','world.onscreen.js','world.offscreen.js','world.none.js']){
  let source=await readFile(new URL('../node_modules/@3d-dice/dice-box/dist/'+name,import.meta.url),'utf8');
  if(name==='Dice.js')source=patchSettledFaces(source);
  if(name==='dice-box.es.js'){
   source=patchPhysicsRecording(source);
   const start=source.indexOf('  resizeWorld() {'),end=source.indexOf('  async init()',start);
   if(start<0||end<0)throw Error('Dice resize adapter needs review.');
   source=source.slice(0,start)+`  resizeWorld() {
     if(!this.cosmosResize){
       this.cosmosResize=pl(()=>{const width=this.canvas.clientWidth,height=this.canvas.clientHeight;
         if(width<1||height<1)return;
         W(this,u).resize({width,height});
         if(W(this,p))W(this,p).postMessage({action:'resize',width,height});
       });
       window.addEventListener('resize',this.cosmosResize);
     }
     this.cosmosResize();
   }
`+source.slice(end);
  }
  if(name==='world.onscreen.js'){
   source=patchLandingAnimation(source);
   source=source.replace('r.value = r.value + s.value, this.onRollResult','r.value = r.value + s.value, r.value === 0 && (r.value = 100), this.onRollResult');
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
