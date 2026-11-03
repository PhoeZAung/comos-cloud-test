import {ashwingWingbeat} from './ashwing-wingbeat.mjs';
// Retarget the sampled lateral extension, sweep, and wrist lift onto the shadow.
// Matrix attributes are updated directly; CSS animation inside a mask is not used.
export function wingPoseAt(milliseconds){
 const {duration,fps,samples}=ashwingWingbeat,time=((milliseconds/1000%duration)+duration)%duration,position=time*fps,first=Math.floor(position),mix=position-first;
 const a=samples[first],b=samples[Math.min(first+1,samples.length-1)],values=a.map((value,i)=>value+(b[i]-value)*mix);
 return [0,1].map(side=>{
  const [spread,sweep,lift]=values.slice(side*3,side*3+3),sign=side===0?1:-1,angle=sign*sweep*11*Math.PI/180,scale=.28+.76*spread,shear=sign*lift*.1,cos=Math.cos(angle),sin=Math.sin(angle);
  const a=cos,b=sin,c=cos*shear-sin*scale,d=sin*shear+cos*scale,x=510,y=380;
  return [a,b,c,d,x-a*x-c*y,y-b*x-d*y];
 });
}
export function applyWingPose(root,milliseconds){
 const wings=[root.querySelector('.galaxy-wing-upper'),root.querySelector('.galaxy-wing-lower')];
 wingPoseAt(milliseconds).forEach((matrix,index)=>wings[index]?.setAttribute('transform','matrix('+matrix.map(value=>value.toFixed(5)).join(' ')+')'));
}
