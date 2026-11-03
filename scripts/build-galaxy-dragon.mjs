import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
// Deterministic, original nebula/stars; generated once, cached as a small WebP.
export async function buildGalaxyDragon(){
 const width=768,height=640,pixels=Buffer.alloc(width*height*3);
 const hash=(x,y)=>{let v=Math.imul(x+911,374761393)^Math.imul(y+353,668265263);v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967296;};
 const noise=(x,y)=>{const a=Math.floor(x),b=Math.floor(y);x-=a;y-=b;x=x*x*(3-2*x);y=y*y*(3-2*y);return (hash(a,b)*(1-x)+hash(a+1,b)*x)*(1-y)+(hash(a,b+1)*(1-x)+hash(a+1,b+1)*x)*y;};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const n=noise(x/130,y/130)*.55+noise(x/48,y/48)*.3+noise(x/17,y/17)*.15;
  const band=Math.exp(-Math.pow((y-height*.55-Math.sin(x/150)*110)/125,2)),cloud=Math.pow(n,2)*band*1.8,blue=Math.exp(-Math.pow((y-height*.32+Math.sin(x/110)*50)/90,2))*n*1.3;
  const at=(y*width+x)*3;pixels[at]=Math.min(255,4+cloud*160+blue*12);pixels[at+1]=Math.min(255,6+cloud*50+blue*50);pixels[at+2]=Math.min(255,18+cloud*190+blue*95);
 }
 const dot=(x,y,power)=>{if(x<0||y<0||x>=width||y>=height)return;const at=(y*width+x)*3;for(let c=0;c<3;c++)pixels[at+c]=Math.min(255,pixels[at+c]+power*[.82,.87,1][c]);};
 for(let i=0;i<1350;i++){const x=Math.floor(hash(i,90)*width),y=Math.floor(hash(i,91)*height),power=45+hash(i,92)*170;dot(x,y,power);if(i%16===0){for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])dot(x+dx,y+dy,power*.34);}}
 const target=new URL('../dist/assets/roll-fx/',import.meta.url);await mkdir(target,{recursive:true});
 await writeFile(new URL('galaxy-nebula.webp',target),await sharp(pixels,{raw:{width,height,channels:3}}).webp({quality:84}).toBuffer());
}
